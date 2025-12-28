<template>
  <BngDrawer v-model="expanded" :expandable="current.allowOpenDrawer" :position="position" :blur="blur">
    <template #header v-if="!usePath">
      {{ current.label }}
    </template>
    <template #header-controls>
      <BngBreadcrumbs v-if="usePath" :items="path" limit="5" @click="onPath"></BngBreadcrumbs>
      <BngButton v-else-if="backState.show" :accent="ACCENTS.outlined" :disabled="backState.disable" @click="onBack">Back</BngButton>
      <slot name="controls"></slot>
    </template>
    <template #content>
      <BngList
        :layout="expanded ? LIST_LAYOUTS.TILES : LIST_LAYOUTS.RIBBON"
        :big="big"
        :target-width="itemWidth"
        :target-height="itemHeight"
        :target-margin="itemMargin"
        v-bng-disabled="!('items' in current)"
        no-background>
        <slot
          name="action"
          v-if="'items' in current"
          v-for="(item, index) in current.items"
          :item="item"
          :select="onSelect"
          :is-loading="false"
          :order="index"></slot>
        <slot name="action" v-else v-for="idx in skeletonItems" :item="lazyItem" :select="() => {}" :is-loading="true"></slot>
      </BngList>
    </template>
  </BngDrawer>
</template>

<script setup>
import { ref, computed, watch } from "vue"
import { BngDrawer, BngList, BngBreadcrumbs, BngButton, LIST_LAYOUTS, ACCENTS, icons } from "@/common/components/base"
import { vBngDisabled } from "@/common/directives"

/**
 * Represents an action item.
 * @typedef {Object} ActionItem
 * @property {string} [label] (unused here)
 * @property {Array<string|number>} value
 * @property {string|Object} [icon] (unused here) If true, icon will be used otherwise, image will be used
 * @property {string} [image] (unused here)
 * @property {Boolean} [lazyLoadItems=false] If items will be loaded and we should wait for them to appear (`items` must not exist until then)
 * @property {Boolean} [flattenChildren] (unused here)
 * @property {Boolean} [allowOpenDrawer=false] Allows expand the drawer
 * @property {Array<ActionItem>} [items] Sub-items. See also `lazyLoadItems`
 */

const props = defineProps({
  /** @type {ActionItem} */
  actions: {
    type: Object,
    default: { allowOpenDrawer: false },
  },
  /** @description Number of empty items to show while real ones are loading */
  skeletonItems: {
    type: Number,
    default: 5,
  },
  /** @description Use breadcrumbs instead of title with [Back] button */
  usePath: Boolean,
  /** @description When [Back] button is used, make it disable itself instead of hiding it */
  alwaysShowBack: Boolean,
  /** @description Target item width in em. It should be the same as real item width. If not specified, it will be calculated automatically (not 100% reliable). */
  itemWidth: Number,
  /** @description Target item height in em when big list is in use. It should be the same as real item height. If not specified, it will be calculated automatically (not 100% reliable). */
  itemHeight: Number,
  /** @description Item margin in em. It should be the same as real item width. If not specified, it will be calculated automatically (should be reliable). */
  itemMargin: Number,
  /** @description List renderer optimised for big amount of items. It should not be changed dynamically to avoid possible issues. */
  big: Boolean,
  /** @description Side where it will be used (default: "bottom") */
  position: String,
  /** @description Set background blur */
  blur: Boolean,
})

const emit = defineEmits(["select"])
defineExpose({ goBack: onBack })

const expanded = ref(false)
const current = ref(props.actions)

// "loading" item for skeleton view
const lazyItem = {
  label: "…",
  // icon: icons.infinity,
  // icon: icons.sync,
  icon: icons.stopwatchSectionOutlinedStart,
  // icon: icons.POITimeL,
}

function onSelect(item) {
  if ("items" in item || item.lazyLoadItems) {
    current.value && addBack(current.value)
    current.value = item
  }
  emit("select", item)
}

const backState = computed(() => {
  const disable = back.value.length === 0 || !("items" in current.value)
  return { show: !disable || props.alwaysShowBack, disable }
})

const back = ref([])
function onBack() {
  current.value = null
  onSelect(back.value.pop().data)
}

function addBack(prevItem) {
  const backItem = {
    index: back.value.length,
    label: prevItem.label,
    data: prevItem,
  }
  // remove props.usePath check if you need to switch it at runtime
  if (props.usePath && prevItem.items) {
    backItem.items = prevItem.items.reduce(
      (res, itm) => [
        ...res,
        {
          index: backItem.index + 1, // nested items should have + 1 index
          label: itm.label,
          data: itm,
        },
      ],
      []
    )
  }
  back.value.push(backItem)
}

const path = computed(() => (!props.usePath ? undefined : [...back.value, { current: true, label: current.value.label, data: current.value }]))

function onPath(item) {
  if (item.current) return // ignore click on current
  back.value.splice(item.index)
  current.value = null
  onSelect(item.data)
}

watch(
  () => props.actions,
  val => {
    back.value.splice(0)
    current.value = val
  }
)
</script>
