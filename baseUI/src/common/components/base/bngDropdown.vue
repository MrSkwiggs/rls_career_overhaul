<!-- BngDropdown.vue -->
<template>
  <BngDropdownContainer
    ref="elContainer"
    v-bind="binds"
    v-model:opened="opened"
    :disabled="disabled"
    :headless="headless"
    :focus-target="focusTarget"
    :popover-target="popoverTarget"
    :class="{
      'with-search': showSearch,
      [`dropdown-longnames-${longNames}`]: true,
    }"
    @show="emit('open')"
    @hide="emit('close')"
  >
    <template v-if="!headless" #display>
      <slot name="display">
        <span class="dropdown-display" v-bng-highlighter="highlighter">
          {{ headerText }}
        </span>
      </slot>
    </template>

    <div v-if="showSearch" class="dropdown-search">
      <BngInput
        v-model.trim="search"
        floating-label="Search"
        @focus="searching = true"
        @blur="searching = false"
      />
    </div>
    <!-- Show a no-results message when searching and nothing is found -->
    <div v-if="search && groupedItems.every(group => group.items.length === 0)">
      {{ $t("ui.common.search.noResults") }}
    </div>
    <template v-else>
      <!-- Iterate over groups -->
      <template v-for="(group, groupIndex) in groupedItems" :key="groupIndex">
        <!-- Render group header if available -->
        <div v-if="group.header" class="dropdown-group-header">
          {{ group.header.label }}
        </div>
        <!-- Render each item (adding an extra class if the item belongs to a group) -->
        <div
          v-for="(item, idx) in group.items" :key="item.value"
          class="dropdown-option"
          :class="{
            'selected': selectedItem && selectedItem.value === item.value,
            'grouped-item': group.header,
            'disabled': item.disabled
          }"
          :bng-nav-item="!item.disabled || item.focusable"
          :tabindex="item.disabled ? -1 : tabIndexValue"
          :bng-scoped-nav-autofocus="!item.disabled && !searching && ((selectedItem && selectedItem.value === item.value) || (!selectedItem && groupIndex === 0 && idx === 0))"
          v-bng-on-ui-nav:ok.asMouse.focusRequired
          v-bng-ui-nav-label:ok="'ui.inputActions.menu.menu_item_select.title'"
          v-bng-tooltip="item.tooltip ?? undefined"
          v-bng-highlighter="highlighter"
          @click="select(item)"
          @keyup.enter="select(item)"
        >
          {{ item.label }}
        </div>
      </template>
    </template>

  </BngDropdownContainer>
</template>

<script setup>
import { ref, computed, watch, useAttrs } from "vue"
import { BngDropdownContainer, BngInput } from "@/common/components/base"
import { vBngHighlighter, vBngOnUiNav, vBngUiNavLabel, vBngTooltip } from "@/common/directives"

const attrs = useAttrs()
const binds = computed(() => !props.headless ? attrs : undefined)

const props = defineProps({
  modelValue: {
    type: [Number, String, Boolean, Object],
  },
  /**
   * @property {Array} items - An array of dropdown items.
   * Each item object may include:
   * @property {Boolean} [disabled] - Indicates whether the item is disabled.
   * @property {Boolean} [focusable] - Specifies if the item should remain focusable even when disabled.
   * @property {String} [tooltip] - Optional tooltip text displayed for the item.
   */
  items: {
    type: Array,
    required: true,
  },
  showSearch: Boolean,
  highlight: {
    type: [String, Array, RegExp],
  },
  disabled: Boolean,
  longNames: {
    type: String,
    default: "oneline",
    validator: val => ["oneline", "wrap", "cut"].includes(val),
  },
  searchGroupName: Boolean,
  headless: Boolean,
  focusTarget: Object,
  popoverTarget: Object,
})

const emit = defineEmits(["update:modelValue", "valueChanged", "open", "close"])

const elContainer = ref(null)

const opened = ref(false)

const searching = ref(false)
const search = ref("")
const searchTerm = computed(() => search.value.toLowerCase())

// reset search on close
watch(opened, val => !val && (search.value = ""))

defineExpose({
  opened,
  open: () => opened.value = true,
  close: () => opened.value = false,
  toggle: () => opened.value = !opened.value,
  get popoverName() { return elContainer.value?.popoverName },
})

// ---------------------------------------------------------------------
// - When a search is active, if a group header matches the search text
//   *and* props.searchGroupName is true, then return all its items unfiltered.
// - Otherwise, always filter the child items by the search text.
// ---------------------------------------------------------------------
const groupedItems = computed(() => {
  const hasGrouping = props.items.some(item => item.group || item.grouped)
  const searchActive = !!searchTerm.value

  // If no grouping flags are used, filter normally.
  if (!hasGrouping) {
    const filtered = searchActive
      ? props.items.filter(item =>
          item.label.toLowerCase().includes(searchTerm.value)
        )
      : props.items
    return [{ header: null, items: filtered }]
  }

  // Build groups from the flat list.
  const groups = []
  let currentGroup = null

  props.items.forEach(item => {
    if (item.group) {
      // New group header; record if the header text matches the search.
      const headerMatches = item.label.toLowerCase().includes(searchTerm.value)
      currentGroup = { header: item, allItems: [], _headerMatches: headerMatches }
      groups.push(currentGroup)
    } else if (item.grouped) {
      if (currentGroup) {
        currentGroup.allItems.push(item)
      } else {
        // No preceding group header – treat as a standalone group.
        groups.push({ header: null, allItems: [item] })
      }
    } else {
      // Standalone item.
      groups.push({ header: null, allItems: [item] })
      currentGroup = null
    }
  })

  // Process each group based on the search.
  const finalGroups = groups
    .map(group => {
      if (searchActive) {
        if (group.header) {
          // If "searchGroupName" is enabled and the header matches,
          // return all items. Otherwise, filter the group's items.
          if (props.searchGroupName && group._headerMatches) {
            return { header: group.header, items: group.allItems, headerMatches: true }
          } else {
            const filteredItems = group.allItems.filter(item =>
              item.label.toLowerCase().includes(searchTerm.value)
            )
            return { header: group.header, items: filteredItems, headerMatches: false }
          }
        } else {
          // Standalone group: filter its items.
          const filteredItems = group.allItems.filter(item =>
            item.label.toLowerCase().includes(searchTerm.value)
          )
          return { header: null, items: filteredItems }
        }
      } else {
        // No search active – return all items.
        return { header: group.header || null, items: group.allItems }
      }
    })
    // Remove empty groups.
    .filter(group => {
      if (group.header) {
        // When searchGroupName is enabled, we keep the group if the header matched
        // OR if any child items match. Otherwise, only keep if there are matching items.
        return (props.searchGroupName && group.headerMatches) || group.items.length > 0
      } else {
        return group.items.length > 0
      }
    })

  return finalGroups
})

const highlighter = computed(() => search.value || props.highlight)
const selectedValue = computed({
  get: () => props.modelValue,
  set: newValue => {
    emit("update:modelValue", newValue)
    emit("valueChanged", newValue)
  }
})
const selectedItem = computed(() =>
  props.items.find(x => x.value === selectedValue.value)
)
const headerText = computed(() =>
  selectedItem.value &&
  selectedItem.value.value !== null &&
  selectedItem.value.value !== undefined
    ? selectedItem.value.label
    : "Select"
)
const tabIndexValue = computed(() => (props.disabled ? -1 : 0))

const select = item => {
  if (item.disabled) return
  opened.value = false;
  if (selectedValue.value !== item.value) {
    selectedValue.value = item.value
  }
  elContainer.value?.focusContainer()
}
</script>

<style lang="scss" scoped>
.dropdown-option {
  flex: 1 0 auto !important;
  padding: 0.25em 0.5em;
  position: relative;
  cursor: pointer;
  color: var(--bng-off-white);
  min-width: 10rem;

  // override for focus frame
  &::before {
    top: 0px !important;
    left: 0px !important;
    right: 0px !important;
    bottom: 0px !important;
  }

  &.selected {
    background-color: var(--bng-orange-600);
  }
  &:hover {
    background-color: var(--dropdown-option-hover-bg, var(--bng-ter-blue-gray-600));
  }
  &:active {
    background-color: var(--dropdown-option-active-bg, var(--bng-ter-blue-gray-800));
  }
}

.with-search {
  padding-top: 0;
}

.dropdown-search {
  position: sticky;
  display: inline-block;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 2.5em;
  z-index: 1;
  color: var(--bng-off-white);
  overflow: hidden;

  > * {
    // margin-top: -0.5em;
    background-color: rgba(var(--bng-ter-blue-gray-700-rgb), 1);
  }
}

/* Style for group headers */
.dropdown-group-header {
  padding: 0.25em 0.5em;
  font-weight: bold;
  background-color: rgba(var(--bng-off-black-rgb), 0.2);
}

/* Indent items belonging to a group */
.grouped-item {
  padding-left: 1.5em;
}

.dropdown-longnames-oneline {
  .dropdown-display,
  .dropdown-option {
    white-space: nowrap;
    overflow: visible;
  }
}
.dropdown-longnames-wrap {
  .dropdown-display,
  .dropdown-option {
    white-space: normal;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}
.dropdown-longnames-cut {
  .dropdown-display,
  .dropdown-option {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}

.dropdown-option.disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
