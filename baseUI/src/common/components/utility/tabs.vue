<template>
  <div class="tab-container">
    <component v-if="tabListStart" :is="tabListStart" />
    <component v-if="tabsContent[selectedIndex]" :is="tabsContent[selectedIndex]" class="tab-content" />
    <component v-if="tabListEnd" :is="tabListEnd" />
  </div>
</template>

<script setup>
import { ref, shallowRef, watch, provide, useSlots, onMounted, nextTick } from "vue"
import { TabList } from "@/common/components/utility"

const emit = defineEmits(["change"])
const props = defineProps({
  selectedIndex: {
    type: Number,
    default: -1,
  },
})

const ready = ref(false)
const slots = useSlots()
const tabListStart = shallowRef()
const tabListEnd = shallowRef()
const tabsList = ref()
const tabsContent = ref([])
const selectedIndex = ref(-1)

const isTabList = vnode => typeof vnode.type === "object" && vnode.type.__name === TabList.__name

provide("tabs", tabsList)

watch(() => slots.default?.(), update, { immediate: true })
watch(() => props.selectedIndex, index => selectTab(index))

function update(vnodes) {
  if (!ready.value) return
  if (typeof vnodes === "undefined") vnodes = slots.default?.()
  if (!Array.isArray(vnodes)) vnodes = []

  // find TabList
  const tabListIndex = vnodes.findIndex(vn => isTabList(vn))
  tabListStart.value = tabListIndex === 0 ? vnodes[tabListIndex] : TabList
  tabListEnd.value = tabListIndex === vnodes.length - 1 ? vnodes[tabListIndex] : null

  // filter content
  tabsContent.value = vnodes
    .filter(vn => !isTabList(vn))
    .reduce((res, vnode) => {
      if (typeof vnode.type === "symbol" && vnode.type.toString() === "Symbol(v-fgt)") {
        res.push(...vnode.children)
        return res
      }
      res.push(vnode)
      return res
    }, [])

  // create list of tabs for TabList
  tabsList.value = tabsContent.value.map((tab, index) => ({
    index,
    heading: tab.props?.["tab-heading"] || tab.props?.tabHeading || `Tab ${index + 1}`,
    active: selectedIndex.value === -1
      ? props.selectedIndex === index || !!tab.props?.["tab-selected"] || !!tab.props?.tabSelected
      : selectedIndex.value === index,
  }))

  // select tab
  const activeIndex = tabsList.value.findIndex(tab => tab.active)
  selectTab(activeIndex > -1 ? activeIndex : 0)
}

function selectTab(index) {
  if (!ready.value) return
  if (typeof index !== "number" || index < 0 || index >= tabsList.value.length) return
  if (selectedIndex.value === index) return
  let prevTab = tabsList.value[selectedIndex.value]
  tabsList.value.forEach(tab => {
    tab.active = tab.index === index
  })
  selectedIndex.value = index
  emit("change", tabsList.value[index], prevTab)
}
provide("selectTab", selectTab)

defineExpose({
  goNext: () => selectTab((selectedIndex.value + 1) % tabsList.value.length),
  goPrev: () => selectTab(Math.abs(selectedIndex.value - 1) % tabsList.value.length),
  selectTab,
})

onMounted(() => {
  ready.value = true
  nextTick(update)
})
</script>

<style lang="scss" scoped>
.tab-container {
  display: flex;
  flex-direction: column;
  color: var(--tab-container-fg);
}

// this trick makes the styles lower priority than the styles of the tab itself, effectively making it a fallback style
:deep(.tab-content) {
  flex: 1 1 auto;
  box-sizing: border-box;
  border-radius: var(--tab-content-corners);
  background-color: var(--tab-content-bg);
  overflow: hidden;
}

.bng-tabs {

  --tab-container-fg: var(--bng-off-white);

  --tab-bg: var(--bng-black-o6);
  --tab-bg-active-line: var(--bng-orange-500-rgb);

  --tab-content-bg: var(--bng-black-o6);

  --tab-list-corners: var(--bng-corners-1);
  --tab-corners: var(--bng-corners-2);
  --tab-content-corners: var(--bng-corners-1);

  --tab-border: 0.125em solid var(--bng-cool-gray-700);

  --tab-spacing: 0.25em;
}

</style>