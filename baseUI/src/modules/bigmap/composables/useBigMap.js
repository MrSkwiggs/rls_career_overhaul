import { ref, computed } from 'vue'
import { lua, useBridge } from '@/bridge'
import { $translate } from '@/services/translation'

// Debug flag - set to true to enable logging, false to disable
const DEBUG_BIGMAP = false

// Centralized debug logging utility for all bigmap components
export const debugLog = (component, message, data) => {
  if (DEBUG_BIGMAP) {
    console.log(`[BigMap:${component}] ${message}`, data)
  }
}

export default function useBigMap() {
  // State
  const selectedPoi = ref(null)
  const selectedPoiIds = ref([])
  const filterData = ref([])
  const groupData = ref([])
  const poiData = ref({})
  const gameMode = ref('')
  const levelData = ref({ title: '' })
  const isPoiListVisible = ref(false)
  const isDetailsVisible = ref(false)

  const { events } = useBridge()

  // Computed properties
  const translatedPreheadings = computed(() => {
    const preheadings = []

    if (gameMode.value) {
      preheadings.push($translate.instant(`ui.playmodes.${gameMode.value}`))
    }

    if (levelData.value?.title) {
      preheadings.push($translate.instant(levelData.value.title))
    }

    return preheadings
  })

  const currentFilterTitle = computed(() => {
    return $translate.instant('bigMap.sideMenu.pois')
  })

  // Helper function to get static data from Lua (only called once at initialization)
  const getStaticDataFromLua = async () => {
    try {
      // Get POI data
      const poiDataResult = await lua.freeroam_vueBigMap.getPoiData()
      poiData.value = poiDataResult || {}

      // Get game state info
      const gameStateResult = await lua.freeroam_vueBigMap.getGameStateInfo()
      if (gameStateResult) {
        gameMode.value = gameStateResult.gameMode || ''
        levelData.value = gameStateResult.levelData || { title: '' }
      }

      debugLog("Store", "Static data loaded from Lua", {
        poiData: poiData.value,
        gameMode: gameMode.value
      })
    } catch (error) {
      console.error("Error getting static data from Lua:", error)
    }
  }

  // Helper function to get dynamic data from Lua (called after filter changes)
  const getDynamicDataFromLua = async () => {
    try {
      // Get filter data
      const filterDataResult = await lua.freeroam_vueBigMap.getFilters()
      filterData.value = filterDataResult || []

      // Get group data
      const groupDataResult = await lua.freeroam_vueBigMap.getGroups()
      groupData.value = groupDataResult || []

      debugLog("Store", "Dynamic data loaded from Lua", {
        filterData: filterData.value,
        groupData: groupData.value
      })
    } catch (error) {
      console.error("Error getting dynamic data from Lua:", error)
    }
  }

    // Event handler for showPoiDetails hook
  const handleShowPoiDetails = (data) => {
    debugLog("Store", "Show POI details", data)
    const poiIds = data?.poiIds || []

    // Store the POI IDs list
    selectedPoiIds.value = poiIds

    if (poiIds.length === 0) {
      // No POIs to show, clear selection
      selectedPoi.value = null
      isDetailsVisible.value = false
      return
    }

    // First ID is the selected POI
    const selectedPoiId = poiIds[0]
    if (selectedPoiId && poiData.value[selectedPoiId]) {
      selectedPoi.value = poiData.value[selectedPoiId]
      isDetailsVisible.value = true
    } else {
      selectedPoi.value = null
      isDetailsVisible.value = false
    }
    //getDynamicDataFromLua()
  }


      // Group visibility toggle function
  const toggleGroupVisibility = async (groupKey) => {
    debugLog("Store", "Toggling group visibility", groupKey)

    try {
      // Create object with group key and toggle its visibility
      const filterIds = [groupKey]// Set to visible
      await lua.freeroam_vueBigMap.toggleFiltersByIds(filterIds)
      await getDynamicDataFromLua()
    } catch (error) {
      console.error("Error toggling group visibility:", error)
    }
  }

  // Filter visibility toggle function
  const toggleFilterSectionVisibility = async (filterKey) => {
    debugLog("Store", "Toggling filter visibility", filterKey)

    try {
      await lua.freeroam_vueBigMap.toggleFilterSectionById(filterKey)
      await getDynamicDataFromLua()
    } catch (error) {
      console.error("Error toggling filter visibility:", error)
    }
  }

  // Actions
  const selectPoi = async (poiId) => {
    debugLog("Store", "Selecting POI", poiId)
    try {
      const result = await lua.freeroam_vueBigMap.selectPoiFromList(poiId)
      if (result === "success") {
        if (poiId) {
          selectedPoi.value = poiData.value[poiId]
          isDetailsVisible.value = true
        } else {
          selectedPoi.value = null
          isDetailsVisible.value = false
        }
      } else {
        console.error("Failed to select POI:", result)
      }
    } catch (error) {
      console.error("Error selecting POI:", error)
    }
  }

  const showPoiList = () => {
    isPoiListVisible.value = true
  }

  const hidePoiList = () => {
    isPoiListVisible.value = false
    // When hiding the POI list, also deselect the current POI
    if (selectedPoi.value) {
      selectPoi(null)
    }
  }

  const onHover = async (poiId, active) => {
    try {
      await lua.freeroam_vueBigMap.hoverPoiFromList(poiId, active)
    } catch (error) {
      console.error("Error hovering POI:", error)
    }
  }

  const executePoiAction = async (actionId) => {
    try {
      await lua.freeroam_vueBigMap.executePoiAction(actionId)
    } catch (error) {
      console.error("Error executing POI action:", error)
    }
  }

  // Lifecycle
  const initialize = async () => {
    try {
      // Tell Lua to enter bigmap mode and display markers
      await lua.freeroam_vueBigMap.enterBigMap()

      // Get static data from Lua (POI data and game state)
      await getStaticDataFromLua()

      // Get initial dynamic data from Lua (filters and groups)
      await getDynamicDataFromLua()

      // Listen for showPoiDetails hook
      events.on('showPoiDetails', handleShowPoiDetails)
    } catch (error) {
      console.error("Error initializing bigmap:", error)
    }
  }

  const cleanup = async () => {
    try {
      // Tell Lua to exit bigmap mode and clean up
      await lua.freeroam_vueBigMap.exitBigMap()

      // Clean up event listeners
      events.off('showPoiDetails')
    } catch (error) {
      console.error("Error cleaning up bigmap:", error)
    }
  }

  return {
    // State
    selectedPoi,
    selectedPoiIds,
    filterData,
    groupData,
    poiData,
    gameMode,
    levelData,
    isPoiListVisible,
    isDetailsVisible,

    // Computed
    translatedPreheadings,
    currentFilterTitle,

    // Actions
    initialize,
    cleanup,
    selectPoi,
    showPoiList,
    hidePoiList,
    onHover,
    executePoiAction,
    toggleGroupVisibility,
    toggleFilterSectionVisibility,

    // Debug utility
    debugLog,
  }
}