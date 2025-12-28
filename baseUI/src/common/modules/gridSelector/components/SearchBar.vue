<template>
  <div class="search-container" :class="{ 'full-width': fullWidth }">
    <BngInput
      class="search-input"
      :modelValue="searchText"
      :placeholder="placeholder"
      @valueChanged="onSearchChanged"
      @keydown.enter="commitSearch"
      @blur="commitSearch"
      @focus="emit('focus-item', 'search')"
    />
    <div class="search-icon-container" @click="clearSearch"
    :class="{ 'active': searchText }">
      <BngIcon
        :type="icons.search"
        class="search-icon show-unhovered"
      />
      <BngIcon
        :type="icons.trashBin2"
        class="search-icon show-hovered"
      />
    </div>
  </div>
</template>

<script setup>
import { BngButton, BngIcon, BngInput, icons } from '@/common/components/base'

const props = defineProps({
  searchText: {
    type: String,
    required: true
  },
  setSearchText: {
    type: Function,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Search...'
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  showClearAllButton: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['focus-item', 'clear-all'])

// searchText is now passed as a prop

// Search functionality
const clearSearch = () => {
  props.setSearchText('')
  emit('focus-item', 'search')
}

const commitSearch = () => {
  // No need to commit since we're using the new filter system
  // The search is already applied when updateFilterOption is called
}

const onSearchChanged = (value) => {
  props.setSearchText(value)
  emit('focus-item', 'search')
}

const clearAll = () => {
  emit('clear-all')
}
</script>

<style scoped lang="scss">
.search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;
  width: 100%;

  &.full-width {
    width: 100%;
  }

  .search-input {
    flex: 1;
    --input-height: 2.25rem;
  }
  :deep(.bng-input-container) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .search-icon {
    cursor: pointer;
    padding: 0.33rem;
    height: 2.25rem;
  }
  .search-icon-container {
    position: relative;
    width: 2.25rem;
    height: 2.25rem;
    margin-left: -0.5rem;
    background-color: rgba(255, 255, 255, 0.1);
    border-top-right-radius: var(--bng-corners-2);
    border-bottom-right-radius: var(--bng-corners-2);
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
    position:absolute;
    top: 0;
    left: 0;
    opacity: 1;
  }
  .show-hovered {
    position:absolute;
    top: 0;
    left: 0;
    opacity: 0;
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
</style>
