<template>
  <Accordion v-if="treeState && parentHasChildren" class="branch-category">
    <PartsBranch
      v-for="child in parentChildren"
      :key="child.slotName"
      :root-slot="rootSlot"
      :child="child"
      :info="info"
      :tree-state="treeState"
      :tree-state-key="child.slotName"
      :display-names="displayNames"
      :show-auxiliary="showAuxiliary"
      :separate-sort="separateSort"
      :always-sort="alwaysSort"
      :show-empty="showEmpty"
      :flat-entry="flatEntry"
      :highlighter="highlighter"
      @select="select"
      @deselect="deselect"
      @highlight="highlight"
      @change="change"
      @dropdown="dropdown"
    />
  </Accordion>

  <AccordionItem
    v-else-if="treeState && shouldShow"
    ref="accordionItem"
    :static="flatEntry || !childHasChildren"
    :expanded="expanded"
    @expanded="expanded = $event"
    :class="{ 'item-changed': child.changed }"
    arrow-big
    navigable
    @mouseover.stop="select(child, true)"
    @mouseleave.stop="deselect(child, true)"
    @focusin.stop="select(child, false)"
    @focusout.stop="deselect(child, false)"
    :primary-action="partsList.length > 0 ? openPartsDropdown : undefined"
    :secondary-action="highlightable ? toggleHighlightCurrent : undefined"
    primary-label="ui.inputActions.menu.menu_item_select.title"
    secondary-label="ui.vehicleconfig.highlight"
    expand-hint-inline
    secondary-hint-inline
  >
    <template #caption>
      <span v-bng-highlighter="highlighter">
        {{ displayName }}
      </span>
    </template>
    <template #controls>
      <BngDropdown
        ref="partsDropdown"
        v-model="child.chosenPartName"
        :items="partsList"
        :disabled="!hasPartList"
        :highlight="highlighter"
        :show-search="partsList.length > 5"
        long-names="cut"
        @valueChanged="change(child)"
        @focus="focusReturn"
        @open="dropdown(true)"
        @close="dropdown(false)"
        bng-no-nav
      />
      <BngButton
        :accent="ACCENTS.text"
        :class="{ 'visibility-toggle': true, 'visibility-toggle-on': child.highlight }"
        :icon="child.highlight ? icons.eyeSolidOpened : icons.eyeSolidClosed"
        :disabled="!highlightable"
        @click="toggleHighlight(child)"
        @focus="accordionItem.focus()"
        bng-no-nav
      />
    </template>

    <PartsBranch
      v-if="!flatEntry && treeState && childHasChildren"
      :children="childChildren"
      :info="info"
      :tree-state="treeState"
      :display-names="displayNames"
      :show-auxiliary="showAuxiliary"
      :separate-sort="separateSort"
      :always-sort="alwaysSort"
      :show-empty="showEmpty"
      :highlighter="highlighter"
      @select="select"
      @deselect="deselect"
      @highlight="highlight"
      @change="change"
      @dropdown="dropdown"
    />
    <div v-else-if="!flatEntry && treeState">&mdash;</div>
  </AccordionItem>

  <!-- <div v-else-if="!rootSlot">&mdash;</div> -->
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue"
import { BngDropdown, BngButton, ACCENTS, icons } from "@/common/components/base"
import { vBngHighlighter } from "@/common/directives"
import { Accordion, AccordionItem } from "@/common/components/utility"
import PartsBranch from "./PartsBranch.vue"
import { partOptionSorter, partOptionGrouper } from "../parts/common"

const props = defineProps({
  rootSlot: Boolean,
  children: Object,
  child: Object,
  info: Object,
  treeState: Object,
  treeStateKey: String,
  flatEntry: Boolean,
  displayNames: Boolean,
  showAuxiliary: Boolean,
  separateSort: Boolean,
  alwaysSort: Boolean,
  showEmpty: Boolean,
  highlighter: [String, Array, RegExp],
})

const accordionItem = ref()
const partsDropdown = ref()
const openPartsDropdown = () => partsDropdown.value && partsDropdown.value.open()

const emit = defineEmits(["select", "deselect", "highlight", "change", "dropdown"])
const select = (slot, mouse = false) => (!props.child || highlightable.value) && emit("select", slot, mouse)
const deselect = (slot, mouse = false) => emit("deselect", slot, mouse)
const highlight = slot => emit("highlight", slot)
const change = slot => emit("change", slot)
const dropdown = val => emit("dropdown", val)

const focusReturn = () => nextTick(() => accordionItem.value.focus())

// allows part selection by calling a function on the active element (see Parts.vue, on the bottom of on-vehicle-change event)
const accItemUnwatch = watch(accordionItem, () => {
  const elm = accordionItem.value?.captionElement
  if (elm) {
    accItemUnwatch()
    elm.partSelect = () => props.child && select(props.child)
  }
})

function toggleHighlight(slot) {
  slot.highlight = !slot.highlight
  highlight(slot)
}
const toggleHighlightCurrent = () => toggleHighlight(props.child)
const highlightable = computed(() => typeof props.child?.highlight === "boolean")

const expanded = ref(false)
if (!props.flatEntry) {
  // treeState loads after the config, so we need to watch it
  let unwatchTreeState
  unwatchTreeState = watch(() => props.treeState, () => setTimeout(() => {
    unwatchTreeState()
    expanded.value = props.treeStateKey && props.treeState[props.treeStateKey] ? props.treeState[props.treeStateKey] || false : false
    // console.log(props.treeStateKey, expanded.value)
    watch(() => expanded.value, val => {
      if (!props.treeStateKey) return
      if (val) {
        props.treeState[props.treeStateKey] = val
      } else if (props.treeStateKey in props.treeState) {
        delete props.treeState[props.treeStateKey]
      }
    })
  }, 50), { immediate: true })
}

const childrenSorter = (a, b) => {
  if (props.separateSort) {
    if (a.children && !b.children) return 1
    if (b.children && !a.children) return -1
  }
  if (props.displayNames || !props.alwaysSort) {
    return a.slotName.localeCompare(b.slotName)
  } else {
    const info = props.info[a.parentSlotName]?.slotInfoUi || {}
    return getSlotName(a, info).localeCompare(getSlotName(b, info))
  }
}

// info example:
// pickup_frame (part)         > description
// pickup_frame (part)         > slotInfoUi  > pickup_engine (slot)       > description
// pickup_engine_v8_4.5 (part) > slotInfoUi  > pickup_transmission (slot) > description
const slotInfo = computed(() => props.displayNames ? {} : props.info[props.child?.parentSlotName]?.slotInfoUi || {})
const isCoreSlot = computed(() => !!props.info[props.child?.parentSlotName]?.slotInfoUi?.[props.child?.slotName]?.coreSlot)
const getSlotName = (slot, info = {}) => props.displayNames ? slot.slotName : info[slot.slotName]?.description || slot.slotName
const displayName = computed(() => getSlotName(props.child, slotInfo.value))

// this is a much faster way to know if there are any parts
const hasPartList = computed(() => {
  let list = props.child?.suitablePartNames || []
  if (list.length === 0) {
    if (props.child?.chosenPartName) {
      list = [props.child.chosenPartName]
    } else {
      list = (props.child?.unsuitablePartNames || []).map(({ partName }) => partName)
    }
  }
  if (!props.showAuxiliary /*&& slotInfo.value[props.child?.slotName]?.coreSlot*/) {
    list = list.filter(partName => !props.info[partName]?.isAuxiliary)
  }
  return list.length > 0
})

const partsList = computed(() => {
  if (!hasPartList.value) return []

  let addEmpty = true

  let list = props.child?.suitablePartNames || []
  if (list.length === 0 && props.child?.chosenPartName) {
    list = [props.child.chosenPartName]
    addEmpty = false
  }

  const unsuitable = (props.child?.unsuitablePartNames || [])
    .reduce((res, { partName, reason }) => ({ ...res, [partName]: reason }), {})
  list.push(...Object.keys(unsuitable))

  if (list.length === 0) return []

  // format the list for the dropdown
  list = list
    .map(partName => ({
      value: partName,
      label: // note: don't trim spaces - they're used for custom sorting
        (props.info[partName]?.isAuxiliary ? "[!] " : "") +
        (props.displayNames ? partName : (props.info[partName]?.description || partName)),
      disabled: partName in unsuitable,
      tooltip: partName in unsuitable ? { text: unsuitable[partName], position: "right" } : undefined,
      isAuxiliary: props.info[partName]?.isAuxiliary,
    }))
    .filter(opt => !opt.isAuxiliary || props.showAuxiliary || props.child?.chosenPartName === opt.value)

  // ignore the list if showAux is disabled, we only have one aux item and it's in a core slot
  if (!props.showAuxiliary && list.length === 1 && list[0].isAuxiliary && isCoreSlot.value) {
    return []
  }

  list.sort(partOptionSorter)

  // group options (currently by wheel and tire sizes only)
  list = partOptionGrouper(list)

  // add empty slot if it's not a core slot
  if (addEmpty && !isCoreSlot.value) {
    list.unshift({ value: "", label: "Empty" })
  }

  // return the list
  return list
})

const parentAllChildren = computed(() => props.children ? Object.values(props.children || {}) : [])
const parentHasChildren = computed(() => parentAllChildren.value.length > 0)
const parentChildren = computed(() => [...parentAllChildren.value].sort(childrenSorter))

const childAllChildren = computed(() => props.child?.children ? Object.values(props.child.children || {}) : [])
const childHasChildren = computed(() => childAllChildren.value.length > 0)
const childChildren = computed(() => [...childAllChildren.value].sort(childrenSorter))

const shouldShow = computed(() => childHasChildren.value || hasPartList.value || props.showEmpty)
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

$corners: var(--bng-corners-1);

.branch-category > :deep(.bng-accitem) {
  // expanded content block
  > .bng-accitem-content {
    $pad: 0.6em;
    background-image: linear-gradient(
      to right,
      transparent calc($pad - 0.05em),
      rgba(255, 255, 255, 0.1) calc($pad - 0.05em) calc($pad + 0.05em),
      rgba(255, 255, 255, 0.05) calc($pad + 0.05em),
      rgba(255, 255, 255, 0) 5em
    );
    margin-bottom: 0.5em;
  }

  &.bng-accitem-expandable > .bng-accitem-caption {
    padding: 0 0.1em 0 0.75em;
  }

  &.bng-accitem-expandable:hover > .bng-accitem-caption > .bng-accitem-caption-content {
    color: var(--bng-orange-400);
  }

  &.bng-accitem.bng-accitem-expanded > .bng-accitem-caption {
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.1);
  }

  // line visual style
  &:not(.bng-accitem-expanded) {
    // &:nth-child(1n) > .bng-accitem-caption {
    //   background-color: rgba(#ccc, 0.1);
    // }
    // &:nth-child(2n) > .bng-accitem-caption {
    //   background-color: rgba(#000, 0.1);
    // }
    > .bng-accitem-caption > .bng-accitem-caption-content {
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: stretch;
      > * {
        flex: 0 1 auto;
      }
      &::after {
        flex: 1 1 auto;
        content: "";
        display: inline-block;
        height: 1em;
        margin-bottom: 0.5rem;
        margin-left: 0.5rem;
        margin-right: 0.25rem;
        border-bottom: 1px dashed #333;
      }
    }
  }

  > .bng-accitem-caption {
    align-items: first baseline;
    .bng-accitem-caption-expander {
      margin-bottom: -0.2em;
      align-self: unset;
      margin-left: -0.25em;
      margin-right: 0.125em;
    }
  }

  > .bng-accitem-caption {
    padding-right: 0.1em;
    .bng-dropdown,
    .visibility-toggle {
      background-color: rgba(var(--bng-cool-gray-900-rgb), 0.75);
      border-radius: $corners;
      @include modify-focus($corners, 1px);
    }
    .visibility-toggle {
      padding-top: 0.4em;
    }
  }
  &.bng-accitem-expanded > .bng-accitem-caption {
    // change backgrounds in expanded item
    .bng-dropdown,
    .visibility-toggle {
      background-color: rgba(var(--bng-cool-gray-800-rgb), 0.8);
    }
  }

  > .bng-accitem-caption,
  > .bng-accitem-content {
    padding-top: 0rem;
    padding-bottom: 0rem;
  }
}

.item-changed > :deep(.bng-accitem-caption) {
  background-image: linear-gradient(90deg, rgba(255, 102, 0, 0.35) 0%, rgba(255, 255, 255, 0) 100%) !important;
}

:deep(.bng-accitem-caption-controls) {
  flex: 0 0 55% !important;
  width: 16em;
  display: flex;
  flex-flow: row nowrap;
  padding: 0.125rem;
  .bng-dropdown {
    flex: 1 1 auto;
    margin: 0;
  }
}

.visibility-toggle {
  min-width: unset !important;
  min-height: unset !important;
  height: 2em;
  padding: 0.25rem 0.375rem;
  margin: 0 0 0 0.125rem !important;
  > * {
    font-size: 1.25em !important;
    opacity: 0.8;
  }
  &:not(.visibility-toggle-on) > * {
    opacity: 0.5;
  }
}
</style>
