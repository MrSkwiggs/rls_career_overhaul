import { ref, watch, onUnmounted, computed } from "vue"
import { lua, useBridge } from "@/bridge"
import logger from "@/services/logger"

export default function useGridSelector(backendName = "gridSelector", defaultPath = {keys: ["missions"]}, defaultDetailsMode = "detail") {

  // State
  const currentPath = ref(defaultPath)
  const previousPath = ref(null) // Track the previous path to detect changes

  const groups = ref([])
  const filterList = ref([])
  const filterByProp = ref([])
  const commonFilters = ref([])
  const lockedFiltersByProp = ref([])
  const activeFilters = ref([])
  const onlyCommonFilters = ref(true)
  const detailsMode = ref(defaultDetailsMode) // "advanced", "filter", "detail"
  const selectedItem = ref(null)
  const selectedItemDetails = ref(null)
  const prevSelectedItem = ref(null)
  // Hovered or focusframe preview item that is not yet selected
  const previewItem = ref(null)
  const previewItemDetails = ref(null)
  const managementDetails = ref(null)
  const autoFocusKey = ref(null)
  // Screen header state
  const showScreenHeader = ref(true)
  const screenHeaderTitle = ref("Grid Selector")
  const screenHeaderPath = ref([{text: "Menu", gotoAngularState: "menu"}])
  const { events } = useBridge()

  // Force select tile callback
  let backFromDetailsCallback = null

  // Store the event handler reference for cleanup
  const refreshAllHandler = (backendName) => {
    if (backendName !== backendName) return
    logger.debug("gridSelectorRefreshAll")
    loadTiles()
    loadFilters()
    loadManagementDetails()
  }
  const refreshCurrentItemDetailsHandler = (backendName) => {
    if (backendName !== backendName) return
    logger.debug("gridSelectorRefreshCurrentItemDetails")
    setSelectedItem(selectedItem.value)
  }

  events.on("gridSelectorRefreshAll", refreshAllHandler)
  events.on("gridSelectorRefreshCurrentItemDetails", refreshCurrentItemDetailsHandler)

  const log = (...args) => {
    //logger.debug("gridSelectorStore", ...args)
  }

  // Display data structure
  const displayData = ref([])

  // Search text state
  const searchText = ref("")

  async function getSearchText() {
    try {
      const data = await lua.ui_gridSelector.getSearchText(backendName)
      searchText.value = data || ""
      return data || ""
    } catch (error) {
      logger.error("Failed to get search text:", error)
      return ""
    }
  }

  async function setSearchText(value) {
    try {
      await lua.ui_gridSelector.setSearchText(backendName, value)
      searchText.value = value || ""
      await loadTiles()
      await loadFilters()
      // Update screen header title after search change
      await updateScreenHeaderData()
    } catch (error) {
      logger.error("Failed to set search text:", error)
    }
  }

  // Loading state
  const isInitializing = ref(false)

  // transforms an object into an array, if the object is empty
  const safeArray = arr => Array.isArray(arr) ? arr : []

  async function setCurrentPath(path) {
    log("Setting current path:", path)
    currentPath.value = path
    await loadTiles()
  }

  // Actions
  async function loadTiles() {
    log("Loading tiles...", currentPath.value)
    try {
      const data = await lua.ui_gridSelector.getTiles(backendName, currentPath.value, previousPath.value !== currentPath.value)
      lua.ui_gridSelector.profilerFinish(backendName, "received lua data on UI")
      log("Received tiles:", data)
      groups.value = safeArray(data)
      log("groups", groups.value)
      // figure out the default selected tile only if path changed
      if (!selectedItem.value && (detailsMode.value === "advanced" || detailsMode.value === "detail") && previousPath.value !== currentPath.value) {
        for (const group of groups.value) {
          for (const tile of group.tiles) {
            if (tile.isDefaultSelected) {
              //setSelectedItem(tile)
              autoFocusKey.value = tile.key
              log("Default selected tile:", tile.name, tile)
              if (tile.forceAutoFocus) {
                backFromDetailsCallback()
              }
            }
          }
        }
      }
      previousPath.value = currentPath.value
      lua.ui_gridSelector.profilerFinish(backendName, "loaded tiles into reactive state")
    } catch (error) {
      logger.error("Failed to load tiles:", error)
    }
  }

  async function loadFilters() {
    log("Loading filters...")
    try {
      const data = await lua.ui_gridSelector.getFilters(backendName)
      filterList.value = safeArray(data.filterList)
      filterByProp.value = data.filterByProp
      commonFilters.value = safeArray(data.commonFilters) || []
      lockedFiltersByProp.value = data.lockedFiltersByProp || []
      activeFilters.value = safeArray(data.activeFilters)
      onlyCommonFilters.value = data.onlyCommonFilters
      log("Received filters:", filterList.value, filterByProp.value, activeFilters.value, onlyCommonFilters.value)
    } catch (error) {
      logger.error("Failed to load filters:", error)
    }
  }

  async function loadManagementDetails() {
    log("Loading management details...")
    try {
      const data = await lua.ui_gridSelector.getManagementDetails(backendName)
      managementDetails.value = data
      log("Received management details:", managementDetails.value)
    } catch (error) {
      logger.error("Failed to load management details:", error)
    }
  }

  async function toggleFilter(propName, option) {
    log("Toggling filter:", propName, option)
    try {
      // Call Lua to toggle the filter and get updated filterByProp and activeFilters
      await lua.ui_gridSelector.toggleFilter(backendName, propName, option)
      await loadFilters()
      await loadTiles()
      // Update screen header title after filter change
      await updateScreenHeaderData()
    } catch (error) {
      logger.error("Failed to toggle filter:", error)
    }
  }

  async function updateRangeFilter(propName, min, max) {
    log("Updating range filter:", propName, min, max)
    try {
      // Call Lua to update the range filter and get updated filterByProp and activeFilters
      await lua.ui_gridSelector.updateRangeFilter(backendName, propName, min, max)
      await loadFilters()
      await loadTiles()
      // Update screen header title after filter change
      await updateScreenHeaderData()
    } catch (error) {
      logger.error("Failed to update range filter:", error)
    }
  }

  async function resetRangeFilter(propName) {
    console.log("Resetting range filter:", propName)
    try {
      // Call Lua to reset the range filter and get updated filterByProp and activeFilters
      await lua.ui_gridSelector.resetRangeFilter(backendName, propName)
      await loadFilters()
      await loadTiles()
      // Update screen header title after filter change
      await updateScreenHeaderData()
    } catch (error) {
      logger.error("Failed to reset range filter:", error)
    }
  }

  async function resetSetFilter(propName) {
    log("Resetting set filter:", propName)
    try {
      // Call Lua to reset the set filter and get updated filterByProp and activeFilters
      await lua.ui_gridSelector.resetSetFilter(backendName, propName)
      await loadFilters()
      await loadTiles()
      // Update screen header title after filter change
      await updateScreenHeaderData()
    } catch (error) {
      logger.error("Failed to reset set filter:", error)
    }
  }

  async function loadDisplayData() {
    try {
      const data = await lua.ui_gridSelector.getDisplayDataOptions(backendName)
      displayData.value = safeArray(data)
      // Update the search text state to match the display data
      const searchOption = displayData.value.find(option => option.key === "searchText")
      if (searchOption) {
        searchText.value = searchOption.value || ""
        // pendingSearchText.value = searchOption.value || "" // This line was removed from the new_code, so it's removed here.
      }
      log("Loaded display data:", displayData.value)
    } catch (error) {
      logger.error("Failed to load display data:", error)
    }
  }

  async function updateDisplayData(key, value) {
    try {
      await lua.ui_gridSelector.setDisplayDataOption(backendName, key, value)
      await loadDisplayData()
      await loadTiles()
      // Update screen header title after display data change
      await updateScreenHeaderData()
    } catch (error) {
      logger.error("Failed to update display data:", error)
    }
  }

  async function resetDisplayDataToDefaults() {
    try {
      await lua.ui_gridSelector.resetDisplayDataToDefaults(backendName)
      await loadDisplayData()
      await loadTiles()
      // Update screen header title after display data reset
      await updateScreenHeaderData()
    } catch (error) {
      logger.error("Failed to reset display data to defaults:", error)
    }
  }

  // Set details mode
  function setDetailsMode(mode) {
    log("Setting details mode:", mode)
    detailsMode.value = mode
  }


  // Set selected item and get details from Lua
  async function setSelectedItem(item) {
    log('Setting selected item:', item)
    if (!item || !item.showDetails) {
      autoFocusKey.value = null
      selectedItem.value = null
      selectedItemDetails.value = null
      // If there is no preview item either, return to advanced mode
      //if (detailsMode.value === 'detail' && !previewItem.value) setDetailsMode('advanced')
      // Load management details when no item is selected
      await loadManagementDetails()
      return
    }
    try {
      log("Getting item details (set selected item):", item.showDetails)
      const details = await lua.ui_gridSelector.getDetails(backendName,item.showDetails)
      log("Received item details:", details)
      autoFocusKey.value = item.key
      selectedItem.value = item
      selectedItemDetails.value = details
      if (details?.paintData && details?.paints) {
        if (selectedItemDetails.value?.paints) {
          selectedItemDetails.value.paints.multiPaintSetups = safeArray(selectedItemDetails.value.paints.multiPaintSetups)
          selectedItemDetails.value.paints.factoryPaints = safeArray(selectedItemDetails.value.paints.factoryPaints)
        }
      }
      setDetailsMode("detail")
    } catch (error) {
      logger.error("Failed to get item details:", error)
      autoFocusKey.value = null
      selectedItem.value = item
      selectedItemDetails.value = null
    }
  }

  // Clear selected item
  async function clearSelectedItem() {
    selectedItem.value = null
    selectedItemDetails.value = null
    // If there is no preview item active, revert to advanced mode
    //if (detailsMode.value === 'detail' && !previewItem.value) setDetailsMode('advanced')
    // Load management details when selection is cleared
    await loadManagementDetails()
  }

  // Set preview (hover/focus) item and get details without selecting
  async function setPreviewItem(item) {
    log('Setting preview item:', item)
    if (!item || !item.showDetails) {
      previewItem.value = null
      previewItemDetails.value = null
      //if (detailsMode.value === 'detail' && !selectedItem.value) setDetailsMode('advanced')
      return
    }
    try {
      const details = await lua.ui_gridSelector.getDetails(backendName,item.showDetails)
      log('Received preview details:', details)
      previewItem.value = item
      previewItemDetails.value = details
      setDetailsMode('detail')
    } catch (error) {
      previewItem.value = item
      previewItemDetails.value = null
    }
  }

  function clearPreviewItem() {
    log('clearPreviewItem')

    previewItem.value = null
    previewItemDetails.value = null
    //if (detailsMode.value === 'detail' && !selectedItem.value) setDetailsMode('advanced')
  }

  // Active item is selected when present, otherwise preview
  const activeItem = computed(() => selectedItem.value || previewItem.value)
  const activeItemDetails = computed(() => selectedItem.value ? selectedItemDetails.value : previewItemDetails.value)

  // Execute button callback by ID
  async function executeButton(buttonId, additionalData) {
    log("Executing button:", buttonId)
    try {
      if (additionalData?.waitForLoadingScreen) {
        window.vueEventBus?.emit("LoadingScreen", { active: true })
        await startLoading(async () => {
          await waitForLoadingScreenFadeIn()
          let data = await lua.ui_gridSelector.executeButton(backendName, buttonId, additionalData)
          // this is used by the "Select Random" button
          if (data && data.gotoPath) {
            setCurrentPath(data.gotoPath)
          }
        })
      } else {
        let data = await lua.ui_gridSelector.executeButton(backendName, buttonId, additionalData)
        // this is used by the "Select Random" button
        if (data && data.gotoPath) {
          setCurrentPath(data.gotoPath)
        }
      }
    } catch (error) {
      logger.error("Failed to execute button:", error)
    }
  }

  const executeButtonHandler = (backendName, buttonId, additionalData) => {
    if (backendName !== backendName) return
    executeButton(buttonId, additionalData)
  }
  events.on("gridSelectorExecuteButton", executeButtonHandler)

  async function toggleFavourite(item) {
    log("Toggling favourite:", item)
    await lua.ui_gridSelector.toggleFavourite(backendName, item.showDetails)
    const details = await lua.ui_gridSelector.getDetails(backendName,item.showDetails)
    log("Received item details:", details)
    selectedItem.value = item
    selectedItemDetails.value = details
    // Set to detail mode when an item with details is selected
    await loadTiles()
  }

  // Search functionality
  function clearSearch() {
    setSearchText("")
  }

  function updateSearch(newSearchText) {
    setSearchText(newSearchText || "")
  }

  async function updateSearchInLua(searchTextToSend) {
    await setSearchText(searchTextToSend || "")
  }

  function commitSearch() {
    setSearchText(searchText.value || "")
  }

  // Helper function to get a specific display option value
  function getDisplayOptionValue(key) {
    const option = displayData.value.find(option => option.key === key)
    return option ? option.value : null
  }

  // Helper functions to check if filters are locked
  function isFilterLocked(propName, option = null) {
    if (!lockedFiltersByProp.value[propName]) {
      return false
    }

    if (option) {
      // Check if specific option is locked
      return lockedFiltersByProp.value[propName][option] !== undefined
    } else {
      // Check if any option for this property is locked
      return Object.keys(lockedFiltersByProp.value[propName]).length > 0
    }
  }

  // Update screen header title
  async function updateScreenHeaderData() {
    try {
      const headerData = await lua.ui_gridSelector.getScreenHeaderTitleAndPath(backendName,currentPath.value)
      screenHeaderTitle.value = headerData.title || "Grid Selector"
      screenHeaderPath.value = headerData.pathSegments
    } catch (error) {
      logger.error("Failed to update screen header title:", error)
      screenHeaderTitle.value = "Grid Selector"
      screenHeaderPath.value = [{text: "Menu", gotoAngularState: "menu"}]
    }
  }

  function isFilterOptionLocked(propName, option) {
    return isFilterLocked(propName, option)
  }

  function isRangeFilterLocked(propName) {
    return isFilterLocked(propName)
  }

  // Watch for route changes and clear selected item
  watch(currentPath, () => {
    clearSelectedItem()
    clearPreviewItem()
    // Update screen header title when path changes
    updateScreenHeaderData()
  })

  // Watch for filter changes and clear selected item
  watch([filterByProp, activeFilters], () => {
    clearSelectedItem()
    clearPreviewItem()
    // Update screen header title when filters change
    updateScreenHeaderData()
  })

  // Watch for display data changes and update header title
  watch(displayData, () => {
    // Update screen header title when display data changes
    updateScreenHeaderData()
  }, { deep: true })

  // Call this when the UI is fully rendered and ready for user interaction
  function notifyUIReady(tag) {
    log("UI is ready for interaction, finishing profiler")
    lua.ui_gridSelector.profilerFinish(backendName,tag)
  }

  // Function to set the back from details callback
  function setOnBackFromDetailsCallback(callback) {
    backFromDetailsCallback = callback
  }


  // Initialize function - call this explicitly when ready
  async function initialize() {
    if (isInitializing.value) {
      log("Already initializing, skipping...")
      return
    }

    try {
      isInitializing.value = true
      log("Initializing GridSelector composable...")
      await Promise.all([
        loadFilters(),
        loadDisplayData(),
        loadManagementDetails(),
        getSearchText()
      ])
      log("GridSelector composable initialized successfully")
    } catch (error) {
      logger.error("Failed to initialize GridSelector composable:", error)
      // You might want to show a user-friendly error message here
    } finally {
      isInitializing.value = false
    }
  }

  const exploreFolder = function(path) {
    lua.ui_gridSelector.exploreFolder(backendName, path)
  }
  const goToMod = function(modId) {
    lua.ui_gridSelector.goToMod(backendName, modId)
  }

  // Lifecycle cleanup
  onUnmounted(() => {
    logger.debug("GridSelector composable unmounting")
    // Clean up event listeners
    events.off("gridSelectorRefreshAll", refreshAllHandler)
    events.off("gridSelectorRefreshCurrentItemDetails", refreshCurrentItemDetailsHandler)
    events.off("gridSelectorExecuteButton", executeButtonHandler)
  })

  return {
    // State
    groups,
    filterList,
    filterByProp,
    lockedFiltersByProp,
    commonFilters,
    activeFilters,
    onlyCommonFilters,
    displayData,
    currentPath,
    detailsMode,
    selectedItem,
    selectedItemDetails,
    prevSelectedItem,
    previewItem,
    previewItemDetails,
    activeItem,
    activeItemDetails,
    managementDetails,
    isInitializing,
    searchText,
    getSearchText,
    setSearchText,
    autoFocusKey,

    // Screen header state
    showScreenHeader,
    screenHeaderTitle,
    screenHeaderPath,

    // Actions
    initialize,
    setCurrentPath,
    loadTiles,
    loadFilters,
    loadManagementDetails,
    toggleFilter,
    updateRangeFilter,
    resetRangeFilter,
    resetSetFilter,
    loadDisplayData,
    updateDisplayData,
    resetDisplayDataToDefaults,
    setDetailsMode,
    setSelectedItem,
    clearSelectedItem,
    setPreviewItem,
    clearPreviewItem,
    executeButton,
    notifyUIReady,
    isFilterLocked,
    isFilterOptionLocked,
    isRangeFilterLocked,
    toggleFavourite,
    clearSearch,
    updateSearch,
    commitSearch,
    updateScreenHeaderData,
    exploreFolder,
    goToMod,
    setOnBackFromDetailsCallback,
  }
}