<template>
  <div class="active-filters-list" :class="{ 'show-border': showBorderAnimation }">
    <div class="filters-pills">
      <div class="filters-row">
        <!-- Search bar - always visible -->
        <SearchBar
          :store="store"
          placeholder="Search..."
          :full-width="!activeFilters || activeFilters.length === 0"
          :show-clear-all-button="true"
          @focus-item="emit('focus-item', $event)"
          @clear-all="clearAllFilters"
        />
        <template v-if="(activeFilters.length > 0 || searchText) && !onlyCommonFilters && detailsMode !== 'filter'">

          <BngPill
            v-for="(filter, index) in activeFilters"
            :key="`${filter.propName}-${filter.propValue}-${index}`"
            class="filter-pill"
            :class="{
              'filter-active': filter.isActive,
              'filter-locked': isFilterLocked(filter.propName)
            }"
            @click="removeFilter(filter.propName, filter.propValue)"
            @focus="emit('focus-item', 'filters')"
            :style="{ cursor: isFilterLocked(filter.propName) ? 'not-allowed' : 'pointer' }"
          >
            <span class="filter-text">{{ filter.displayText }}</span>
            <span class="option-icon">
              <BngIcon :type="icons[filter.iconType]" class="filter-icon" />
              <BngIcon v-if="!isFilterLocked(filter.propName)" :type="icons.trashBin2" class="remove-icon" />
              <BngIcon v-if="isFilterLocked(filter.propName)" :type="icons.lockClosed" class="lock-icon" />
            </span>
          </BngPill>
          <div class="divider"></div>
        </template>
      </div>

    </div>
  </div>
</template>

<script setup>
import { BngButton, BngIcon, BngInput, BngPill, icons } from '@/common/components/base'
import SearchBar from './SearchBar.vue'
import { storeToRefs } from 'pinia'
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  store: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['focus-item'])

const { activeFilters, filterList, searchText, onlyCommonFilters, detailsMode } = storeToRefs(props.store)
const { isFilterLocked } = props.store

const showBorderAnimation = ref(false)

const triggerBorderAnimation = () => {
  showBorderAnimation.value = true
  setTimeout(() => {
    showBorderAnimation.value = false
  }, 2000) // Wait 2 seconds total (1s show + 1s fade)
}

// Watch for changes in activeFilters
watch(activeFilters, (newFilters, oldFilters) => {
  // Only trigger animation if filters actually changed (not just reference)
  if (JSON.stringify(newFilters) !== JSON.stringify(oldFilters)) {
    //triggerBorderAnimation()
  }
}, { deep: true })

// Check on mount if filters are not empty
onMounted(() => {
  if (activeFilters.value.length > 0) {
    //triggerBorderAnimation()
  }
})

const removeFilter = (propName, propValue) => {
  // Don't remove if the filter is locked
  if (isFilterLocked(propName)) {
    console.log('Cannot remove locked filter:', propName)
    return
  }
  emit('focus-item', 'filters')
  // Handle search filter
  if (propName === "searchText") {
    props.store.clearSearch()
    return
  }

  // Find the filter item to determine its type
  const filterItem = filterList.value.find(item => item.propName === propName)

  if (filterItem && filterItem.type === 'range') {
    // Handle range filter: reset to default values
    props.store.resetRangeFilter(propName)
  } else {
    // Handle set filter: enable all options for this property (set to true)
    props.store.resetSetFilter(propName)
  }
}

const toggleDetailsMode = () => {
  if (props.store.detailsMode === 'filter') {
    props.store.setDetailsMode('default')
  } else {
    props.store.setDetailsMode('filter')
  }
}

const clearAllFilters = () => {
  for (const filter of activeFilters.value) {
    removeFilter(filter.propName, filter.propValue)
  }
  props.store.setSearchText('')
  emit('focus-item', 'filters')
}

</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;

.active-filters-list {
  display: flex;
  align-items: center;
  color: white;
  border: 1px solid transparent;
  margin: -1px;
  border-radius: 0.5rem;
  transition: border-color 1s ease, background-color 1s ease;
  border-color: transparent;
  padding: 0;
  &.show-border {
    border-color: white;
    background-color: rgba(255, 255, 255, 0.15);
  }
}

.filters-pills {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;

  .filters-row {
    flex: 1 1 auto;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: stretch;
    padding-top: 0.25rem;
  }
}

.filter-toggle-icon {
  flex: 0 0 2.5rem;
  cursor: pointer;
  align-self: flex-start;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 2.5rem !important;
  width: 2.5rem !important;
  border-radius: var(--bng-corners-2);

  &.trash-icon {
    margin-left: auto;
  }
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.8rem;
  height: 2.25rem;
  font-size: 0.875rem;
  background: rgba(239, 68, 68, 0.2);
  border-radius: var(--bng-corners-2);
  transition: background-color 0.2s ease;
  cursor: pointer;
  box-shadow: inset 0 0 0 0.125em rgba(239, 68, 68, 0.3);
  flex: 1 0 auto;
  &:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  &.neutral {
    background: rgba(156, 163, 175, 0.2);
    box-shadow: inset 0 0 0 0.125em rgba(156, 163, 175, 0.3);
    &:hover {
      background: rgba(156, 163, 175, 0.3);
    }
    cursor: default;
  }
}

.filter-active {
  background: rgba(34, 197, 94, 0.2);
  box-shadow: inset 0 0 0 0.125em rgba(34, 197, 94, 0.3);
  &:hover {
    background: rgba(34, 197, 94, 0.3);
  }
}

.filter-locked {
  opacity: 0.6;
  cursor: not-allowed !important;

  &:hover {
    background: inherit !important;
  }
}

.filter-text {
  white-space: nowrap;
}

.option-icon {
  display: flex;
  width: 1rem;
  height: 1rem;
  font-size: 0.75rem;
  position: relative;
}

.filter-icon {
  opacity: 1;
}

.remove-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
}

.filter-pill:hover {
  .filter-icon {
    opacity: 0;
  }

  .remove-icon {
    opacity: 1;
  }

  .lock-icon {
    opacity: 1;
  }
}

.filter-locked {
  .filter-icon {
    opacity: 1;
  }

  .lock-icon {
    opacity: 1;
  }
}


.divider {
  flex: 0 0 auto;
  width: 100%;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
}
</style>