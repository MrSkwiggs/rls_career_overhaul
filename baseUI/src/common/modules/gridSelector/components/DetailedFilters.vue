<template>
  <div class="filters">
    <!-- Search bar at the top of detailed filters -->
    <div v-if="detailsMode === 'filter'" class="search-section">
      <SearchBar
        :searchText="searchText"
        :setSearchText="setSearchText"
        placeholder="Search items..."
        :full-width="true"
        @focus-item="emit('focus-item', $event)"
      />
    </div>

    <div class="filter-options-grid" v-if="detailsMode !== 'filter'">
      <BngPill
        v-for="(filter, index) in commonFilters"
        :key="index"
        :class="[getFilterOptionClass(filter[0], filter[1]), { 'filter-locked': props.isFilterOptionLocked(filter[0], filter[1]) }]"
        :style="{ cursor: props.isFilterOptionLocked(filter[0], filter[1]) ? 'not-allowed' : 'pointer' }"
        bng-nav-item
        class="filter-option-chip"
        @click="toggleFilter(filter[0], filter[1])">
        <span class="option-label">{{ filter[1] }}</span>
        <span class="option-icon">
          <BngIcon v-if="filterByProp && filterByProp[filter[0]] && filterByProp[filter[0]][filter[1]]" :type="icons.checkmark" />
          <BngIcon v-else :type="icons.xmark" />
          <BngIcon v-if="props.isFilterOptionLocked(filter[0], filter[1])" :type="icons.lockClosed" class="lock-icon" />
        </span>
      </BngPill>
    </div>

    <div class="filters-container" v-if="detailsMode === 'filter'">
      <Accordion class="filters-accordion">
        <div v-for="filter in filterList" :key="filter.propName" class="filter-wrapper">
          <AccordionItem
            navigable
            :static="!filter.options || filter.options.length === 0"
            arrow-big
            expand-hint-inline
            :expanded="expandedAccordions[filter.propName]"
            :class="{ 'has-active-filters': isFilterActive(filter) }"
            @focus="emit('focus-item', filter.propName)">
            <template #caption>
              <div class="filter-container" navigable tabindex="0">
                <div class="filter-content">
                  {{ formatFilterName(filter.propName) }}
                </div>
              </div>
            </template>
            <div class="filter-options" v-if="filter.type === 'set' && filter.options">
              <div class="filter-options-grid">
                <BngPill
                  v-for="(option, index) in filter.options"
                  :key="index"
                  :class="[getFilterOptionClass(filter.propName, option), { 'filter-locked': props.isFilterOptionLocked(filter.propName, option) }]"
                  :style="{ cursor: props.isFilterOptionLocked(filter.propName, option) ? 'not-allowed' : 'pointer' }"
                  class="filter-option-chip"
                  @click="toggleFilter(filter.propName, option)">
                  <span class="option-label">{{ option }}</span>
                  <span class="option-icon">
                    <BngIcon v-if="filterByProp[filter.propName][option]" :type="icons.checkmark" />
                    <BngIcon v-else :type="icons.abandon" />
                    <BngIcon v-if="props.isFilterOptionLocked(filter.propName, option)" :type="icons.lockClosed" class="lock-icon" />
                  </span>
                </BngPill>
              </div>
            </div>
            <div class="filter-options" v-if="filter.type === 'range'">
              <div class="range-bar-container">
                <div class="range-bar">
                  <div class="range-selection" :style="getRangeBarStyle(filter.propName)"></div>
                </div>
              </div>

              <div class="range-inputs">
                <div class="range-input-group">
                  <label class="range-label">Min:</label>
                  <BngInput
                    :key="filter.propName + 'min'"
                    :modelValue="filterByProp[filter.propName].min"
                    type="number"
                    :min="filter.min"
                    :max="filter.max"
                    :step="filter.step || 1"
                    :disabled="props.isRangeFilterLocked(filter.propName)"
                    @valueChanged="(val) => onRangeFilterChanged(filter.propName, val, 'min')" />
                </div>
                <div class="range-input-group">
                  <label class="range-label">Max:</label>
                  <BngInput
                    :key="filter.propName + 'max'"
                    :modelValue="filterByProp[filter.propName].max"
                    type="number"
                    :min="filter.min"
                    :max="filter.max"
                    :step="filter.step || 1"
                    :disabled="props.isRangeFilterLocked(filter.propName)"
                    @valueChanged="(val) => onRangeFilterChanged(filter.propName, val, 'max')" />
                </div>
              </div>
            </div>
          </AccordionItem>
        </div>
      </Accordion>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed } from "vue"
import { BngIcon, BngInput, icons, BngCardHeading, BngPill, BngCard, BngButton } from "@/common/components/base"
import { vBngDoubleClick, vBngScopedNav } from "@/common/directives"
import { Accordion, AccordionItem } from "@/common/components/utility"
import { debounce } from "@/utils/rateLimit"
import DisplayControls from "./DisplayControls.vue"
import SearchBar from "./SearchBar.vue"
import BngInputNew from "@/common/components/base/bngInputNew.vue"

const props = defineProps({
  filterList: {
    type: Array,
    required: true,
  },
  filterByProp: {
    type: Object,
    required: true,
  },
  searchText: {
    type: String,
    default: "",
  },
  commonFilters: {
    type: Array,
    default: () => [],
  },
  detailsMode: {
    type: String,
    required: true,
  },
  onlyCommonFilters: {
    type: Boolean,
    default: true,
  },
  isFilterLocked: {
    type: Function,
    required: true,
  },
  isFilterOptionLocked: {
    type: Function,
    required: true,
  },
  isRangeFilterLocked: {
    type: Function,
    required: true,
  },
  toggleFilter: {
    type: Function,
    required: true,
  },
  updateRangeFilter: {
    type: Function,
    required: true,
  },
  resetRangeFilter: {
    type: Function,
    required: true,
  },
  setSearchText: {
    type: Function,
    required: true,
  },
  setDetailsMode: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['focus-item'])

// All values are now passed as props

// Track which accordions should be expanded
const expandedAccordions = ref({})

// Store pending range filter updates for debouncing
const pendingRangeUpdates = ref({})
// Map of debounced functions per propName
const debouncedUpdateFunctions = ref({})

// Get or create a debounced update function for a specific propName
const getDebouncedUpdate = (propName) => {
  if (!debouncedUpdateFunctions.value[propName]) {
    debouncedUpdateFunctions.value[propName] = debounce(() => {
      if (pendingRangeUpdates.value[propName]) {
        const { min, max } = pendingRangeUpdates.value[propName]
        props.updateRangeFilter(propName, min, max)
        delete pendingRangeUpdates.value[propName]
      }
    }, 300)
  }
  return debouncedUpdateFunctions.value[propName]
}

// Clean up debounced functions on unmount
onUnmounted(() => {
  // Cancel any pending debounced updates
  Object.values(debouncedUpdateFunctions.value).forEach(debouncedFn => {
    if (debouncedFn && debouncedFn.cancel) {
      debouncedFn.cancel()
    }
  })
  debouncedUpdateFunctions.value = {}
  pendingRangeUpdates.value = {}
})

const formatFilterName = key => {
  return key
}

const getFilterOptionClass = (propName, option) => {
  const filter = props.filterList.find(f => f.propName === propName)
  if (!filter || !filter.options) return ""

  const allEnabled = filter.options.every(opt => props.filterByProp[propName]?.[opt] === true)
  const currentOptionEnabled = props.filterByProp[propName]?.[option] === true

  if (allEnabled) {
    // All items are enabled - show neutral state
    return "filter-neutral"
  } else {
    // Mixed state - show red/green based on individual state
    return currentOptionEnabled ? "filter-active" : "filter-inactive"
  }
}

const hasActiveFilters = propName => {
  if (!props.filterList) return false

  const filter = props.filterList.find(f => f.propName === propName)
  if (!filter) return false

  if (filter.type === "range") {
    // For range filters, check if min/max differ from defaults
    const filterData = props.filterByProp[propName]
    if (!filterData) return false

    const currentMin = filterData.min
    const currentMax = filterData.max
    const defaultMin = filter.min
    const defaultMax = filter.max

    return currentMin > defaultMin || currentMax < defaultMax
  } else {
    // For set filters, check if any option is false
    if (!filter.options || !Array.isArray(filter.options)) return false

    return filter.options.some(option => {
      const status = props.filterByProp[propName]?.[option]
      return status === false
    })
  }
}

const toggleFilter = (propName, option, event) => {
  // Don't toggle if the filter is locked
  if (props.isFilterOptionLocked(propName, option)) {
    console.log("Cannot toggle locked filter:", propName, option)
    return
  }

  // Prevent default behavior to maintain focus
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  emit('focus-item', 'filters')

  props.toggleFilter(propName, option)
}

const onRangeFilterChanged = (propName, newValue, field) => {
  // Don't update if the filter is locked
  if (props.isRangeFilterLocked(propName)) {
    console.log("Cannot update locked range filter:", propName)
    return
  }

  // Validate and fix range values, then always update each range filter
  const filter = props.filterList.find(f => f.propName === propName)
  if (!filter || filter.type !== "range") return

  const filterData = props.filterByProp[propName]
  if (!filterData) return

  // Get current values and update the changed field
  // Use pending values if they exist, otherwise use current filterData values
  const currentPending = pendingRangeUpdates.value[propName]
  let min = currentPending ? currentPending.min : filterData.min
  let max = currentPending ? currentPending.max : filterData.max

  // Update the field that changed
  if (field === 'min') {
    min = newValue
  } else if (field === 'max') {
    max = newValue
  }

  // Ensure values are within the allowed range
  min = Math.max(filter.min, Math.min(filter.max, min))
  max = Math.max(filter.min, Math.min(filter.max, max))

  // Ensure min <= max
  if (min > max) {
    // If min is greater than max, swap them
    ;[min, max] = [max, min]
  }

  // Store pending update
  pendingRangeUpdates.value[propName] = { min, max }

  // Trigger debounced update for this specific propName
  const debouncedUpdate = getDebouncedUpdate(propName)
  debouncedUpdate()
  emit('focus-item', propName)
}

const resetRangeFilter = propName => {
  // Don't reset if the filter is locked
  if (props.isRangeFilterLocked(propName)) {
    console.log("Cannot reset locked range filter:", propName)
    return
  }

  props.resetRangeFilter(propName)
}

const isFilterActive = filter => {
  return hasActiveFilters(filter.propName)
}

const getRangeBarStyle = propName => {
  const filter = props.filterList.find(f => f.propName === propName)
  if (!filter || filter.type !== "range") return {}

  const filterData = props.filterByProp[propName]
  if (!filterData) return {}

  const currentMin = filterData.min
  const currentMax = filterData.max
  const totalRange = filter.max - filter.min

  // Calculate the position and width of the selected range
  const leftPosition = ((currentMin - filter.min) / totalRange) * 100
  const width = ((currentMax - currentMin) / totalRange) * 100

  return {
    left: `${leftPosition}%`,
    width: `${width}%`,
    backgroundColor: "var(--bng-orange-500)",
  }
}

const clearSearch = () => {
  props.setSearchText("")
}

const commitSearch = () => {
  // No need to commit since we're using the new filter system
  // The search is already applied when updateFilterOption is called
}

const toggleDetailsMode = () => {
  if (props.detailsMode === "filter") {
    props.setDetailsMode("default")
  } else {
    props.setDetailsMode("filter")
  }
}

const onSearchChanged = value => {
  props.setSearchText(value)
}

// Initialize expanded accordions based on active filters
onMounted(() => {
  if (props.filterList) {
    props.filterList.forEach(filter => {
      if (hasActiveFilters(filter.propName)) {
        expandedAccordions.value[filter.propName] = true
      }
    })
  }
})
</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;

.filters {
  color: white;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .search-section {
    margin-bottom: 0.5rem;
  }

  :deep(.card-cnt) {
    gap: 0.5rem;
    background: none;
    overflow: visible;
  }

  .heading {
    margin-left: -0.5rem;
    margin-top: 0;
    margin-bottom: 0.5rem;
  }
  :deep(.heading-style-ribbon::before) {
    top: 0.1em;
  }

  .header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
}

:deep(.filters .bng-card .card-cnt) {
  background: none !important;
  overflow: visible !important;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;

  .search-input {
    flex: 1;
  }
  :deep(.bng-input-container) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .search-icon {
    cursor: pointer;
    width: 2.5rem;
    padding: 0.5rem;
    height: 2.5rem;
  }
  .search-icon-container {
    position: relative;
    width: 2.5rem;
    height: 2.5rem;
    margin-left: -0.5rem;
    background-color: rgba(255, 255, 255, 0.1);
    border-top-right-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-left: none;
    &.active {
      background-color: rgba(34, 197, 94, 0.2);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-left: none;
    }
    &:hover {
      .show-unhovered {
        opacity: 0;
      }
      .show-hovered {
        opacity: 1;
      }
    }
  }
  .show-unhovered {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 1;
  }
  .show-hovered {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
  }
}
.filter-toggle-icon {
  flex: 0;
  margin-right: 0.5rem;
  padding: 0.5rem;
  &:hover {
    scale: 1.33;
  }
  &.active {
    background-color: rgba(255, 255, 255, 0.25);
    border-radius: var(--bng-corners-1);
  }
}

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filters-accordion {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.filter-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

.filter-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: var(--bng-corners-1);
  box-sizing: border-box;
  min-height: 1.75rem;
}

.filter-content {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
  padding: 0.25rem 0.5rem;
}

.filter-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--bng-orange-500);
  flex-shrink: 0;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25rem;
}

.filter-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.filter-control-btn {
  min-width: 4rem;
  height: 2rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  line-height: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}

.more-filters-button {
  max-width: unset !important;
}

.filter-options-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-option-chip {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  //gap: 0.5rem;
  //padding: 0.25rem 0.75rem;
  //background: rgba(239, 68, 68, 0.2);
  cursor: pointer;
  font-size: 0.875rem;
  //border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: inset 0 0 0 0.125em rgba(239, 68, 68, 0.3);

  &:hover {
    background: rgba(239, 68, 68, 0.3);
  }
}

.filter-neutral {
  background: rgba(156, 163, 175, 0.2);
  box-shadow: inset 0 0 0 0.125em rgba(156, 163, 175, 0.3);

  &:hover {
    background: rgba(156, 163, 175, 0.3);
  }
}

.filter-active {
  background: rgba(34, 197, 94, 0.2);
  box-shadow: inset 0 0 0 0.125em rgba(34, 197, 94, 0.3);
  &:hover {
    background: rgba(34, 197, 94, 0.3);
  }
}

.filter-inactive {
  background: rgba(239, 68, 68, 0.2);

  &:hover {
    background: rgba(239, 68, 68, 0.3);
  }
}

.filter-locked {
  opacity: 0.6;
  cursor: not-allowed !important;

  &:hover {
    background: inherit !important;
  }
}

.option-label {
  font-weight: 500;
  flex: 1;
}

.option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  font-size: 0.75rem;
  position: relative;
}

.filter-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--bng-corners-1);
  box-sizing: border-box;
  padding: 0rem 0.5rem;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}

.filter-option-include {
  background: rgba(34, 197, 94, 0.2);
  border-left: 3px solid rgb(34, 197, 94);

  &:hover {
    background: rgba(34, 197, 94, 0.3);
  }
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.option-status {
  font-size: 0.75rem;
}

.option-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.tiny-button {
  min-width: 1.5rem !important;
  height: 1.25rem !important;
  padding: 0.125rem 0.25rem !important;
  font-size: 0.7rem !important;
  line-height: 1 !important;
}

.range-inputs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.range-input-group {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.range-label {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.range-bar-container {
  height: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.range-bar {
  height: 100%;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  overflow: hidden;
  position: relative;
}

.range-selection {
  height: 100%;
  background-color: var(--bng-orange-500);
  position: absolute;
  top: 0;
  border-radius: 0.25rem;
}

:deep(.bng-accitem) {
  width: 100%;
  box-sizing: border-box;

  .bng-accitem-caption {
    border-left: 0.5rem solid #00000000;
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.8);
    &:hover {
      background-color: rgba(var(--bng-cool-gray-700-rgb), 1);
    }
  }

  &.bng-accitem.bng-accitem-expanded > .bng-accitem-caption {
    background-color: rgba(var(--bng-cool-gray-700-rgb), 1);
    &:hover {
      background-color: rgba(var(--bng-cool-gray-700-rgb), 1);
    }
  }

  &.has-active-filters > .bng-accitem-caption {
    border-left: 0.5rem solid var(--bng-orange-500);
    color: var(--bng-orange-500);
  }

  &.has-active-filters.bng-accitem.bng-accitem-expanded > .bng-accitem-caption {
    border-left: 0.5rem solid var(--bng-orange-500);
    color: var(--bng-orange-500);
  }

  > .bng-accitem-caption {
    padding: 0.125rem 0.25rem;
    align-items: center;
    min-height: unset;
    box-sizing: border-box;
  }

  > .bng-accitem-content {
    padding-left: 0.5rem;
  }
}
</style>
