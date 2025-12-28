<template>
  <LayoutSingle
    class="grid-selector"
    v-bng-blur
    v-bng-on-ui-nav:rotate_h_cam,rotate_v_cam="() => { }"
  >
    <div class="header-container">
      <BngBreadcrumbs
        v-if="!noBreadcrumbs"
        class="header-breadcrumbs"
        :items="screenHeaderPath"
        limit="5"
        simple
        disable-last-item
        :show-back-button="showBreadcrumbsBack"
        @click="gotoHeaderItem"
        @back="onBreadBack"
      />
      <div v-else>
        <!-- placeholder for breadcrumbs -->
      </div>
      <HeaderButtons
        v-if="!inlineHeaderContainer"
        :can-switch-details="canSwitchDetails"
        :hidden-tabs="props.hiddenTabs"
        :details-mode="detailsMode"
        @switch-details-mode="switchDetailsMode"
      />
    </div>
    <div class="content-container">
      <div class="grid-wrapper" :class="{ active: activeSectionScope === 'grid' }">
        <BlurBackground />
        <div
          v-if="showScreenHeader"
          class="header-row"
          :class="{ active: activeSectionScope === 'grid' && showIfController, 'no-controller': !showIfController }">
          <BngScreenHeadingV2 type="2" class="header-title-v2">
            {{ screenHeaderTitle }}
          </BngScreenHeadingV2>
          <div class="header-back-button" v-show="activeSectionScope === 'grid' && showIfController && currentPathSegments.length > 1">
            <BngBinding ui-event="back" controller />
            <BngIcon :type="icons.undo" />
          </div>
        </div>
        <div
          class="grid-content"
          ref="gridContentRef"
          v-bng-scoped-nav="{
            activated: scopedNavState.isGridActive,
            canBubbleEvent: canBubbleGridEvent,
            canDeactivate: canDeactivateGrid,
            preferAutoFocus: true,
            autoFocusDelay: 400,
          }"
          v-bng-on-ui-nav:context="onToggleSectionScope"
          v-bng-ui-nav-label:context="'Filters and more'"
          v-bng-on-ui-nav:back="onBackFromGrid"
          v-bng-ui-nav-scroll
          bng-nav-scroll
          bng-no-nav="true"
          tabindex="-1"
          @activate="onGridActivate"
          @deactivate="onGridDeactivate"
          @click="onGridWrapperClick"
        >
          <Grid
            :in-details="activeSectionScope === 'details' && detailsMode === 'detail'"
            :display-size="displaySize"
            :backend-name="props.backendName"
            :auto-focus-key="store.autoFocusKey.value"
            :active-item="store.activeItem.value"
            :groups="groups"
            :tile-images-top-aligned="tileImagesTopAligned"
            @focus-item="onItemFocus"
            @select-item="onItemSelect"
            @deselect-item="onItemDeselect"
            :double-click-override="doubleClickOverride"
          />
        </div>
      </div>

      <div
        v-bng-scoped-nav="{
          activated: scopedNavState.isDetailsActive,
          canDeactivate: () => false,
          canBubbleEvent: canBubbleDetailsEvent,
          bubbleWhitelistEvents: ['menu'],
        }"
        v-bng-on-ui-nav:context="onToggleSectionScope"
        v-bng-ui-nav-label:context="'Filters and more'"
        v-bng-on-ui-nav:action_2="onToggleFavorite"
        v-bng-ui-nav-label:action_2="'Toggle favorite'"
        v-bng-on-ui-nav:back.focusRequired="onBackFromDetails"
        class="details-wrapper wide"
        tabindex="-1"
        bng-no-nav="true"
        :class="{ active: activeSectionScope === 'details', 'no-controller': !showIfController }"
        @activate="onDetailsActivate"
        @deactivate="onDetailsDeactivate"
        @click="onDetailsWrapperClick"
      >

        <BlurBackground />
        <div  class="header-row" :class="{ active: activeSectionScope === 'details' && showIfController, 'no-controller': !showIfController }" bng-no-child-nav="true">
          <!--v-if="inlineHeaderContainer"-->
          <HeaderButtons
            slim
            :can-switch-details="canSwitchDetails"
            :hidden-tabs="props.hiddenTabs"
            :details-mode="detailsMode"
            @switch-details-mode="switchDetailsMode"
          />

          <div v-if="!inlineHeaderContainer" class="header-title-container">
            <BngCardHeading type="ribbon" class="header-title"> {{ detailsModeTitles[detailsMode] }} </BngCardHeading>
            <BngButton v-if="detailsModeBackTo[detailsMode]" bng-no-nav="true" @click="toggleDetailsMode(detailsModeBackTo[detailsMode])" :accent="ACCENTS.outlined" iconRight="undo">
              <BngBinding ui-event="back" controller />
            </BngButton>
            <div class="header-back-button" v-show="activeSectionScope === 'grid' || !showIfController">
              <BngIcon :type="icons.adjust" />
              <BngBinding ui-event="context" controller />
            </div>
            <div class="header-back-button" v-show="activeSectionScope === 'details' && showIfController">
              <BngBinding ui-event="back" controller />
              <BngIcon :type="icons.undo" />
            </div>
          </div>
        </div>
        <template v-if="detailsMode === 'advanced'">

          <div class="scrollable-content">
            <SearchBar
              :searchText="store.searchText.value"
              :setSearchText="store.setSearchText"
            />
            <DetailedFilters
              :filterList="store.filterList.value"
              :filterByProp="store.filterByProp.value"
              :searchText="store.searchText.value"
              :commonFilters="store.commonFilters.value"
              :detailsMode="store.detailsMode.value"
              :onlyCommonFilters="store.onlyCommonFilters.value"
              :isFilterLocked="store.isFilterLocked"
              :isFilterOptionLocked="store.isFilterOptionLocked"
              :isRangeFilterLocked="store.isRangeFilterLocked"
              :toggleFilter="store.toggleFilter"
              :updateRangeFilter="store.updateRangeFilter"
              :resetRangeFilter="store.resetRangeFilter"
              :setSearchText="store.setSearchText"
              :setDetailsMode="store.setDetailsMode"
            />
            <DisplayControls
              :displayData="store.displayData.value"
              :detailsMode="store.detailsMode.value"
              :updateDisplayData="store.updateDisplayData"
              :resetDisplayDataToDefaults="store.resetDisplayDataToDefaults"
              :setDetailsMode="store.setDetailsMode"
            />
            <div class="details-mode-buttons">
              <BngButton @click="toggleDetailsMode('filter')" :accent="ACCENTS.secondary" iconLeft="filter"> More filters... </BngButton>
              <BngButton @click="toggleDetailsMode('displayControls')" :accent="ACCENTS.secondary" iconLeft="adjust"> Display Options </BngButton>
            </div>
            <BngCardHeading type="line" class="heading">Management</BngCardHeading>
            <slot name="management-details" :managementDetails="store.managementDetails.value" :executeButton="store.executeButton" />
          </div>
        </template>

        <!-- Filter mode: show display controls and filters -->
        <template v-else-if="detailsMode === 'filter'">
          <div class="scrollable-content">
            <DetailedFilters
              :filterList="store.filterList.value"
              :filterByProp="store.filterByProp.value"
              :searchText="store.searchText.value"
              :commonFilters="store.commonFilters.value"
              :detailsMode="store.detailsMode.value"
              :onlyCommonFilters="store.onlyCommonFilters.value"
              :isFilterLocked="store.isFilterLocked"
              :isFilterOptionLocked="store.isFilterOptionLocked"
              :isRangeFilterLocked="store.isRangeFilterLocked"
              :toggleFilter="store.toggleFilter"
              :updateRangeFilter="store.updateRangeFilter"
              :resetRangeFilter="store.resetRangeFilter"
              :setSearchText="store.setSearchText"
              :setDetailsMode="store.setDetailsMode"
            />
          </div>
        </template>

        <!-- Display controls mode: show display controls -->
        <template v-else-if="detailsMode === 'displayControls'">

          <DisplayControls
            class="scrollable-content"
            :displayData="store.displayData.value"
            :detailsMode="store.detailsMode.value"
            :updateDisplayData="store.updateDisplayData"
            :resetDisplayDataToDefaults="store.resetDisplayDataToDefaults"
            :setDetailsMode="store.setDetailsMode"
          />
        </template>

        <!-- Detail mode: show item details panel -->
        <template v-else-if="detailsMode === 'detail'">
          <template v-if="hasSelectedItem">
            <div class="details-content">
              <!--
              <div v-if="store.activeItemDetails?.value">
                <BngCardHeading type="ribbon" class="header-title"> {{ store.activeItemDetails.value.headerTitle }} </BngCardHeading>
              </div>
            -->
              <slot
                name="item-details"
                :activeItem="store.activeItem.value"
                :activeItemDetails="store.activeItemDetails.value"
                :executeButton="store.executeButton"
                :toggleFavourite="store.toggleFavourite"
                :exploreFolder="store.exploreFolder"
                :goToMod="store.goToMod"
                @focus-item="setDetailsScope"
              />
            </div>
          </template>
          <template v-else>

          <div class="scrollable-content">
            <SearchBar
              :searchText="store.searchText.value"
              :setSearchText="store.setSearchText"
            />
            <DetailedFilters
              :filterList="store.filterList.value"
              :filterByProp="store.filterByProp.value"
              :searchText="store.searchText.value"
              :commonFilters="store.commonFilters.value"
              :detailsMode="store.detailsMode.value"
              :onlyCommonFilters="store.onlyCommonFilters.value"
              :isFilterLocked="store.isFilterLocked"
              :isFilterOptionLocked="store.isFilterOptionLocked"
              :isRangeFilterLocked="store.isRangeFilterLocked"
              :toggleFilter="store.toggleFilter"
              :updateRangeFilter="store.updateRangeFilter"
              :resetRangeFilter="store.resetRangeFilter"
              :setSearchText="store.setSearchText"
              :setDetailsMode="store.setDetailsMode"
            />
            <DisplayControls
              :displayData="store.displayData.value"
              :detailsMode="store.detailsMode.value"
              :updateDisplayData="store.updateDisplayData"
              :resetDisplayDataToDefaults="store.resetDisplayDataToDefaults"
              :setDetailsMode="store.setDetailsMode"
            />
            <BngCardHeading type="line" class="heading">Info</BngCardHeading>
            <div class="scrollable-content">
              Please select an item to see details.
            </div>
          </div>
          </template>
        </template>
      </div>
    </div>
  </LayoutSingle>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted, onBeforeMount, inject, reactive } from "vue"
import { useRoute, useRouter } from "vue-router"
import { BngButton, BngBinding, BngCardHeading, BngIcon, icons, BngBreadcrumbs, BngScreenHeadingV2, ACCENTS } from "@/common/components/base"
import { vBngScopedNav, vBngOnUiNav, vBngUiNavScroll, vBngUiNavLabel, vBngBlur } from "@/common/directives"
import { LayoutSingle } from "@/common/layouts"
import useGridSelector from "./composables/useGridSelector"
import { storeToRefs } from "pinia"
import Grid from "./components/Grid.vue"
import DetailedFilters from "./components/DetailedFilters.vue"
import DisplayControls from "./components/DisplayControls.vue"
import SearchBar from "./components/SearchBar.vue"
import HeaderButtons from "./components/HeaderButtons.vue"
import BlurBackground from "@/common/modules/main-bg/components/BlurBackground.vue"
import { lua } from "@/bridge"
import useControls from "@/services/controls"

const props = defineProps({
  backendName: {
    type: String,
    default: "gridSelector"
  },
  routePath: {
    type: String,
    default: "/grid-selector"
  },
  defaultPath: {
    type: Object,
    default: () => ({keys: ["allModels"]})
  },
  defaultDetailsMode: {
    type: String,
    default: "detail"
  },
  hiddenTabs: {
    type: Array,
    default: () => []
  },
  tileImagesTopAligned: {
    type: Boolean,
    default: false
  },
  doubleClickOverride: {
    type: Function,
    default: null
  },
  noBreadcrumbs: {
    type: Boolean,
    default: false
  },
  overrideBackFromGrid: {
    type: Function,
    default: null
  },
  inlineHeaderContainer: {
    type: Boolean,
    default: true
  },
  selectCallback: {
    type: Function,
    default: null
  },
  bubbleEvents: {
    type: Array,
    default: () => []
  }
})


const Controls = useControls()
const { showIfController } = storeToRefs(Controls)
//const showIfController = true

const store = useGridSelector(props.backendName, props.defaultPath, props.defaultDetailsMode)
const { groups, displayData, detailsMode, selectedItem, showScreenHeader, screenHeaderTitle, screenHeaderPath, activeItemDetails, activeItem, activeFilters } = store
const route = useRoute()
const router = useRouter()

const detailsModeTitles = {
  detail: "Details",
  advanced: "Advanced",
  filter: "Filters",
  displayControls: "Display",
}

const detailsModeBackTo = {
  filter: "advanced",
  displayControls: "advanced",
}

// Watch for prop changes and update store
watch(
  () => [props.backendName, props.defaultPath, props.defaultDetailsMode],
  ([newBackendName, newDefaultPath, newDefaultDetailsMode], [oldBackendName, oldDefaultPath, oldDefaultDetailsMode]) => {
    // If backendName changes, we need to recreate the store (but that's complex, so we'll just update the path)
    if (newBackendName !== oldBackendName) {
      // Update the current path if defaultPath changed
      if (newDefaultPath && newDefaultPath.keys) {
        store.setCurrentPath(newDefaultPath)
      }
    }
    if (newDefaultDetailsMode !== oldDefaultDetailsMode) {
      store.setDetailsMode(newDefaultDetailsMode)
    }
  },
  { deep: true }
)

const scopedNavState = reactive({
  isGridActive: false,
  isDetailsActive: false,
})

const setBack = inject("setBack")
const showTopbarTabBindings = inject("showTopbarTabBindings")
const showTopbarBackBinding = inject("showTopbarBackBinding")
const showBreadcrumbsBack = ref(false)
const canUseTopbar = ref(true)

watch(() => scopedNavState.isDetailsActive, val => {
  canUseTopbar.value = !val
  showTopbarTabBindings(canUseTopbar.value)
})

watch(screenHeaderPath, val => {

  showBreadcrumbsBack.value = val && val.length > 2
  showTopbarBackBinding(!showBreadcrumbsBack.value)
})

const switchSeq = computed(() => {
  const allTabs = ["detail", "advanced", "displayControls"]
  return allTabs.filter(tab => !props.hiddenTabs.includes(tab))
})
const getNextSwitchSeq = mode => {
  if (!mode) mode = detailsMode.value
  if (mode === "filter") mode = "advanced" // treat "filter" as "advanced"
  const seq = switchSeq.value
  if (seq.length === 0) return "detail" // fallback
  const currentIndex = seq.indexOf(mode)
  if (currentIndex === -1) return seq[0] // if current mode is not in sequence, return first
  return seq[(currentIndex + 1) % seq.length]
}

const canSeeDetails = ref(true)
const hasSelectedItem = computed(() => !!store.selectedItem.value)
const canSwitchDetails = computed(() => activeSectionScope.value !== "default" || detailsMode.value === "advanced")

function switchDetailsMode(mode) {
  console.log("switchDetailsMode", mode)
  if (typeof mode !== "string") {
    mode = getNextSwitchSeq(mode)
  }
  if (mode === "detail" && !canSeeDetails.value) {
    mode = getNextSwitchSeq(mode)
  }
  console.log("switchDetailsMode", mode)
  store.setDetailsMode(mode)
  switchScope("details")
}

function onToggleSectionScope() {
  if (activeSectionScope.value === "grid") {
    switchScope("details")
  } else {
    switchDetailsMode()
  }
}

const activeSectionScope = ref("grid") // 'grid' | 'details'

function switchScope(name, force = false) {
  name = name || (activeSectionScope.value === "grid" ? "details" : "grid")
  if (name === "details") {
    scopedNavState.isGridActive = false
    if (force) scopedNavState.isDetailsActive = false
    nextTick(() => {
      activeSectionScope.value = name
      scopedNavState.isDetailsActive = true
    })
  } else {
    scopedNavState.isDetailsActive = false
    if (force) scopedNavState.isGridActive = false
    nextTick(() => {
      activeSectionScope.value = name
      scopedNavState.isGridActive = true
    })
  }
}

const onGridActivate = () => {
  scopedNavState.isGridActive = true
}
const onGridDeactivate = event => {
  scopedNavState.isGridActive = false
}
const onDetailsActivate = () => {
  scopedNavState.isDetailsActive = true
}
const onDetailsDeactivate = event => {
  scopedNavState.isDetailsActive = false
}

const setDetailsScope = info => {
  switchScope("details")
}

const canBubbleGridEvent = event => {
  // rotate_v_cam needs to be bubbled up because it will be handled by crossfire in global handler
  if (event.detail.name === "rotate_v_cam" || event.detail.name === "menu") return true
  if (canUseTopbar.value && (event.detail.name === "tab_l" || event.detail.name === "tab_r")) return true
  if (props.bubbleEvents.includes(event.detail.name)) return true
  return false
}
const canBubbleDetailsEvent = event => {
  // rotate_v_cam needs to be bubbled up because it will be handled by crossfire in global handler
  if (event.detail.name === "rotate_v_cam") return true
  if (props.bubbleEvents.includes(event.detail.name)) return true
  return false
}
const canDeactivateGrid = () => {
  return screenHeaderPath.value.length <= 1
}

const onBackFromDetails = () => {
  if (detailsMode.value === "displayControls" || detailsMode.value === "filter") {
    toggleDetailsMode("advanced")
    return
  }
  switchScope("grid")
}

const onToggleFavorite = () => {
  store.toggleFavourite(activeItem.value)
}

// Scroll position management
const gridContentRef = ref(null)
const scrollPositions = ref(new Map()) // Store scroll positions for each path
let scrollTimeout = null // For debouncing scroll events

// Computed property to get displaySize from displayData
const displaySize = computed(() => {
  const option = displayData.value.find(option => option.key === "displaySize")
  return option ? option.value : "medium"
})

// Initialize the store when the component is mounted
store.initialize()

// This is called from the composable if a tile should be force selected, when a random tile is selected via management button
store.setOnBackFromDetailsCallback(() => {
  onBackFromDetails()
})

const defaultPath = props.defaultPath.keys // "allModels"

const canDeactivateDetails = () => {
  return detailsMode.value === "advanced"
}

// Computed properties for route parameters
const currentPathSegments = computed(() => {
  const pathMatch = route.params.pathMatch
  if (!pathMatch) {
    // Return defaultPath.keys if it exists, otherwise return defaultPath or empty array
    return props.defaultPath?.keys || (Array.isArray(props.defaultPath) ? props.defaultPath : [])
  }
  const segments = Array.isArray(pathMatch) ? pathMatch.map(segment => decodeURIComponent(segment)) : [decodeURIComponent(pathMatch)]
  // If itemDetails exists, append it to segments
  if (route.params.itemDetails) {
    const itemDetails = Array.isArray(route.params.itemDetails)
      ? route.params.itemDetails.map(segment => decodeURIComponent(segment))
      : [decodeURIComponent(route.params.itemDetails)]
    segments.push(...itemDetails)
  }
  return segments
})

// Function to save scroll position for current path
const saveScrollPosition = () => {
  if (!gridContentRef.value) return

  const pathKey = currentPathSegments.value.join("/")
  const scrollTop = gridContentRef.value.scrollTop
  scrollPositions.value.set(pathKey, scrollTop)
}

// Debounced scroll handler
const debouncedSaveScrollPosition = () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  scrollTimeout = setTimeout(() => {
    saveScrollPosition()
  }, 100) // Debounce for 100ms
}

// Function to restore scroll position for current path
const restoreScrollPosition = () => {
  if (!gridContentRef.value) return

  const pathKey = currentPathSegments.value.join("/")
  const savedPosition = scrollPositions.value.get(pathKey)

  if (savedPosition !== undefined) {
    nextTick(() => {
      gridContentRef.value.scrollTop = savedPosition
    })
  }
}

// Watch for items changes and notify when UI is ready
watch(
  groups,
  async newGroups => {
    if (newGroups) {
      // Wait for the next tick to ensure DOM is updated
      await nextTick()
      // Wait for one more tick to ensure all reactive updates and DOM rebuilds are complete
      await nextTick()
      // Now notify that the UI is ready for interaction
      store.notifyUIReady()
      // Restore scroll position after groups are loaded
      restoreScrollPosition()
    }
  },
  { immediate: true }
)

// Watch for route changes and update the store
watch(
  [currentPathSegments],
  async ([segments], [oldSegments]) => {
    // Save scroll position for the old path before changing
    if (oldSegments && gridContentRef.value) {
      const oldPathKey = oldSegments.join("/")
      const currentScrollTop = gridContentRef.value.scrollTop
      scrollPositions.value.set(oldPathKey, currentScrollTop)
    }

    const path = { keys: segments }
    await store.setCurrentPath(path)
  },
  { immediate: true }
)

// Watch for grid content ref to add scroll listener
watch(
  gridContentRef,
  newElement => {
    if (newElement) {
      // Add scroll event listener to continuously save scroll position
      const handleScroll = () => {
        debouncedSaveScrollPosition()
      }

      newElement.addEventListener("scroll", handleScroll)

      // Store the handler for cleanup
      newElement._scrollHandler = handleScroll
    }
  },
  { immediate: true }
)

onBeforeMount(() => {
  lua.simTimeAuthority.pushPauseRequest('gridSelector')
})

onMounted(() => {
  setBack(props.backendName, onBackFromGrid)
  nextTick(() => {
    scopedNavState.isGridActive = true
  })
})

// Cleanup scroll listener on component unmount
onUnmounted(() => {
  setBack(props.backendName)
  if (gridContentRef.value && gridContentRef.value._scrollHandler) {
    gridContentRef.value.removeEventListener("scroll", gridContentRef.value._scrollHandler)
  }
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  lua.ui_gridSelector.closedFromUI(props.backendName)
  lua.simTimeAuthority.popPauseRequest('gridSelector')
})

const onItemFocus = item => {
  if (item && item.showDetails) store.setPreviewItem(item)
}

const onItemSelect = async (item, doNavigation = true) => {
  //console.log("onItemSelect", item, doNavigation)
  if (item.gotoPath && Array.isArray(item.gotoPath)) {
    store.prevSelectedItem.value = item.key
    if (doNavigation) {
      routeNav(item)
    }
    store.clearSelectedItem()
    //store.setDetailsMode("advanced")
    if (doNavigation) {
      switchScope("grid")
    }
    if (props.selectCallback) {
      await props.selectCallback(item, doNavigation)
    }
  } else if (item.showDetails) {
    if (item.key === selectedItem.value?.key) {
      //store.setSelectedItem(null)
    } else {
      //onToggleSectionScope()
    }
    let consumed = false
    if (props.selectCallback) {
      consumed = await props.selectCallback(item, doNavigation)
    }
    if (!consumed) {
      await store.setSelectedItem(item)
      if (doNavigation) {
        switchScope("details")
      }
    }
  }
}

const onGridWrapperClick = event => {
  store.clearSelectedItem()
  switchScope("grid", true)
}
const onDetailsWrapperClick = event => {
  switchScope("details", true)
}

const onItemDeselect = () => {
  store.clearSelectedItem()
}

const toggleDetailsMode = mode => {
  store.setDetailsMode(mode)
}

function routeNav(item) {
  if (item.gotoAngularState) return
  const encodedPath = item.gotoPath.map(segment => encodeURIComponent(segment)).join("/")
  //console.log("routeNav", `${props.routePath}/${encodedPath}`)
  router.push(`${props.routePath}/${encodedPath}`)
}

const onBackFromGrid = () => {
  console.log("onBackFromGrid", screenHeaderPath.value)
  if( props.overrideBackFromGrid && screenHeaderPath.value.length <= 2) {
    return props.overrideBackFromGrid()
  }
  if (screenHeaderPath.value.length > 1) {
    const item = screenHeaderPath.value[screenHeaderPath.value.length - 2]
    if (store.prevSelectedItem.value) store.autoFocusKey.value = store.prevSelectedItem.value
    gotoHeaderItem(item)
    return false
  }
  return true
}

const onBreadBack = () => nextTick(onBackFromGrid)

const clearSearch = () => {
  store.setSearchText("")
}

const clearFilters = () => {
  console.log("clearFilters", activeFilters.value)
  for (const filter of activeFilters.value) {
    console.log("clearFilter", filter)
    if (filter && filter.type === "range") {
      store.resetRangeFilter(filter.propName)
    } else {
      store.resetSetFilter(filter.propName)
    }
  }
}

const setCurrentPath = path => {
  store.setCurrentPath(path)
}
const gotoHeaderItem = item => {
  console.log("gotoHeaderItem", item)
  if (item.gotoAngularState) {
    window.bngVue.gotoAngularState(item.gotoAngularState)
  } else if (item.gotoPath) {
    if (item.clearSearch) {
      clearSearch()
    }
    if (item.clearFilters) {
      clearFilters()
    }
    setCurrentPath({ keys: item.gotoPath })
    routeNav(item)
    switchScope("grid")
  }
}

defineExpose({
  screenHeaderPath,
  clearSearch,
  clearFilters,
  setCurrentPath
})
</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;

.grid-selector {
  --safezone-top: 2.75em;
  --safezone-bottom: 4.75em;
  --content-flow: column nowrap;
  --content-max-width: unset;

  pointer-events: none;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  > * {
    pointer-events: auto;
    gap: 0.25em;
  }
}

.header-container {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  width: 100%;
  max-width: 100%;
  $bg: rgba(0, 0, 0, 0.66);

  --background-color: #{$bg};
  --bng-breadcrumbs-enabled-opacity: 0.01;

  .header-breadcrumbs {
    align-self: flex-start;
  }

}

.content-container {
  display: flex;
  flex: 1;
  gap: 0.5em;
  box-sizing: border-box;
  min-height: 0;
}

.grid-wrapper {
  flex: 1 1 75%;
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 0.5rem;
  overflow: hidden;
}


.header-controls {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
}

.header-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.25);
  --bng-heading-background-opacity: 0;
  min-height: 3.6rem;
  flex: 0 0 auto;
  .header-title-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
  }
  > :deep(.bng-button) {
    margin-top: 0.75rem !important;
  }
  &.active {
    background-color: rgba(0, 0, 0, 0.75);
    .header-title {
      color: white;
      margin-left: 0rem;
    }
  }
  &.no-controller {
    background-color: rgba(0, 0, 0, 0.5);
  }
}

.header-title-v2 {
  :deep(.header) {
    > h1 {
      font-weight: 1000 !important;
    }
  }
}

.header-back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-right: 0.5rem;
  padding-top: 1rem;
}

.header-with-path-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0rem;
  overflow: hidden;

  > .header-title {
    overflow: visible;
    margin-top: 0;
  }
  > .header-title.heading-style-ribbon::before {
    height: calc(100% + 0.5rem);
    top: -0.5rem;
    width: 3rem;
    left: -1rem;
  }
}

.header-path {
  color: rgb(200, 200, 200);
  font-size: 1rem;
  margin-bottom: -0.75rem;
  font-weight: 500;
  font-style: normal;
  > *:not(:last-child)::after {
    content: " / ";
  }
  .header-path-item {
    cursor: pointer;
    &:hover {
      text-decoration: underline;
      &::after {
        text-decoration: none !important;
      }
    }
  }
}

.header-title {
  color: white;
  margin-bottom: 0rem;
  padding-bottom: 0.5rem;
  margin-top: 0.5rem;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
  transition: margin-left 0.25s ease-in-out;
  flex: 1;
  font-size: 1.75rem;
  font-weight: 900;
}

.grid-content {
  position: relative;
  flex: 1;
  overflow: hidden;

  // hide the focus frame for grid content
  &::before {
    display: none !important;
  }
}

.details-wrapper {
  position: relative;
  background-color: rgba(0, 0, 0, 0.5);
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 0.5rem;
  color: white;
  flex: 1 0 30rem;
  //height: 100%;
  align-self: stretch;

  .scrollable-content {
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .details-content {
    height: calc(100% - 3.6rem);
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
  }

  // hide the focus frame for details wrapper
  &::before {
    display: none !important;
  }

  .heading {
    margin-left: -0.5rem;
    margin-top: 0.5rem;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    .spacer {
      flex: 1;
    }
    &.wide {
      padding-bottom: 0;
    }
  }
  .details-mode-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    > * {
      max-width: unset !important;
      align-items: center;
      margin: 0 !important;
    }
  }
  &.wide {
    padding-bottom: 0;
  }
}
</style>
