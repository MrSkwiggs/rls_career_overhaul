<!-- PoiFilters - Component for displaying filter icons in two rows -->
<template>
  <div class="poi-filters">
    <template v-for="filterSection in filterData" :key="filterSection.key">
      <div class="filter-row" v-bng-blur="true" v-if="filterSection && filterSection.groups">
        <div
          class="filter-icon"
          @click="toggleFilterSectionVisibility(filterSection.key)"
          :class="{ 'has-active-filters': hasActiveFilters(filterSection) }"
        >
          <BngTooltip :text="$tt(filterSection.title)">
            <BngIcon :type="filterSection.icon" />
          </BngTooltip>
        </div>
        <div class="filter-separator"></div>
        <template v-for="group in filterSection.groups" :key="group.key">
          <div
            class="filter-group"
            v-if="group && group.elementCount > 0"
            @click="toggleGroupVisibility(group.key)"
            :class="{ 'inactive': !group.visible }"
          >
            <BngTooltip :text="$tt(group.label) + ' ×' + group.elementCount ">
              <BngIcon :type="group.icon || 'info'" :color="getGroupColor(filterSection, group)"/>
            </BngTooltip>
            <!--<span v-if="!group.icon">{{ $tt(group.label) }}</span>  -->
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { vBngBlur } from "@/common/directives"
import { BngIcon, BngCardHeading } from '@/common/components/base'
import BngTooltip from '@/common/components/base/bngTooltip.vue'


const props = defineProps({
  store: {
    type: Object,
    required: true
  }
})

const { filterData, debugLog } = props.store

// Add debug logging for component lifecycle
debugLog('PoiFilters', 'Component initialized', {
  filterDataCount: filterData.value?.length || 0
})

// Computed function to get group visual state
const getGroupVisualState = (filter, group) => {
  if (!filter || !group || !filter.groups || !Array.isArray(filter.groups)) return 'inactive'

  // Count visible and total groups in this filter
  let visibleGroups = 0
  let totalGroups = 0

  for (const filterGroup of filter.groups) {
    if (filterGroup && filterGroup.elementCount > 0) {
      totalGroups++
      if (filterGroup.visible) {
        visibleGroups++
      }
    }
  }

  const isAllGroupsActive = visibleGroups === totalGroups
  const isGroupActive = group.visible

  if (isAllGroupsActive) {
    return 'neutral' // All groups active - show neutral state
  } else {
    return isGroupActive ? 'active' : 'inactive'
  }
}

// Computed function to get group color
const getGroupColor = (filter, group) => {
  const state = getGroupVisualState(filter, group)

  switch (state) {
    case 'neutral':
      return 'var(--bng-off-white)'
    case 'active':
      return 'var(--bng-add-green-100)'
    case 'inactive':
    default:
      return 'var(--bng-add-red-300)'
  }
}

// Function to check if a filter has active filters
const hasActiveFilters = (filter) => {
  if (!filter || !filter.groups || !Array.isArray(filter.groups)) return false

  let visibleGroups = 0
  let totalGroups = 0

  for (const group of filter.groups) {
    if (group && group.elementCount > 0) {
      totalGroups++
      if (group.visible) {
        visibleGroups++
      }
    }
  }

  // Return true if not all groups are visible (meaning some are filtered out)
  return visibleGroups < totalGroups
}

const toggleGroupVisibility = (groupKey) => {
  debugLog('PoiFilters', 'Toggling group visibility', groupKey)
  props.store.toggleGroupVisibility(groupKey)
}

const toggleFilterSectionVisibility = (filterKey) => {
  debugLog('PoiFilters', 'Toggling filter section visibility', filterKey)
  props.store.toggleFilterSectionVisibility(filterKey)
}
</script>

<style lang="scss" scoped>
.poi-filters {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
}

.filter-heading {
  color: white;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 0.5rem;
}

.filter-row {
  display: flex;
  align-items: center;
  padding: 0.25rem;
  border-radius: 0.5rem;
  gap: 0.25rem;
  color: white;
  background: rgba(0, 0, 0, 0.5);
}

.filter-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.has-active-filters {
    color: var(--bng-orange-500);

    :deep(.bng-icon) {
      color: var(--bng-orange-500);
    }
  }

  :deep(.bng-icon) {
    font-size: 1.5rem;
    color: white;

    &:hover {
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
    }
  }
}

.filter-separator {
  width: 1px;
  height: 1.5rem;
  background: rgba(255, 255, 255, 0.8);
}

.filter-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 5rem;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.inactive {
    opacity: 0.5;
  }

  :deep(.bng-icon) {
    font-size: 1.5rem;
    cursor: pointer;

    &:hover {
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
    }
  }
}
</style>
