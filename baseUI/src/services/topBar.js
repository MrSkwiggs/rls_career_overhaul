import { defineStore } from "pinia"
import { ref, computed, nextTick, reactive, watch } from "vue"
import { useBridge } from "@/bridge"
import { Lua } from "@/bridge/libs"
import { debounce } from "@/utils/rateLimit"

const LUA_EXTENSION_NAME = "ui_topBar"

export const useTopBar = defineStore("topBar", () => {
  const { events } = useBridge()

  let setupComplete = false

  const _items = ref({})
  const _activeItem = ref(null)

  const visible = ref(false)
  const hiddenItems = ref([])
  const gameState = reactive({
    isInGame: undefined,
    gameState: undefined,
    uiState: undefined,
    isCareerActive: undefined,
    isGarageActive: undefined,
    isMissionActive: undefined,
    isScenarioActive: undefined,
  })

  const sortItems = (a, b) => (a.order ?? 0) - (b.order ?? 0)
  const items = computed(() =>
    Object.values(_items.value)
      .filter(item => !hiddenItems.value || !hiddenItems.value.includes(item.id))
      .sort(sortItems)
  )

  const activeItem = computed({
    get: () => _activeItem.value,
    set: value => {
      if (value === _activeItem.value) return

      _activeItem.value = value
      Lua.ui_topBar.setActiveItem(value)
    },
  })

  const updateTopBarVisibility = () => {
    if (!gameState.uiState || gameState.isInGame === undefined) return

    if (gameState.uiState.startsWith("menu.mainmenu") && !gameState.isInGame) visible.value = false

    if (!visible.value || gameState.uiState === "unknown") {
      activeItem.value = null
      return
    }

    // update the active item
    if (gameState.uiState) {
      let updatedActiveItem = Object.values(_items.value).find(item => item.targetState === gameState.uiState)

      if (!updatedActiveItem) updatedActiveItem = Object.values(_items.value).find(item => item.substate && gameState.uiState.startsWith(item.substate))

      activeItem.value = updatedActiveItem ? updatedActiveItem.id : null
    }

    updateHiddenItems()
  }

  watch(
    () => gameState.uiState,
    () => nextTick(updateTopBarVisibility)
  )
  watch(
    () => gameState.isInGame,
    () => nextTick(updateTopBarVisibility)
  )

  const selectPrevious = () => {
    if (!visible.value) return

    const len = items.value.length
    if (len === 0) return
    const currentIndex = items.value.findIndex(item => item.id === activeItem.value)
    const previousIndex = (currentIndex - 1 + len) % len
    selectEntry(items.value[previousIndex].id)
  }

  const selectNext = () => {
    if (!visible.value) return

    const len = items.value.length
    if (len === 0) return
    const currentIndex = items.value.findIndex(item => item.id === activeItem.value)
    const nextIndex = (currentIndex + 1) % len
    selectEntry(items.value[nextIndex].id)
  }

  const selectEntry = itemId => {
    if (!visible.value) return

    activeItem.value = itemId
    Lua.ui_topBar.selectItem(itemId)
  }

  const show = () => {
    visible.value = true
  }

  const hide = () => {
    visible.value = false
  }

  function updateHiddenItems() {
    hiddenItems.value = Object.values(_items.value)
      .filter(shouldHideItem)
      .map(item => item.id)
  }

  function shouldHideItem(item) {
    if (!item.flags || item.flags.length === 0) return false

    for (const flag of item.flags) {
      if (flag === "inGameOnly" && !gameState.isInGame) return true

      // career related checks
      if ((flag === "careerOnly" && !gameState.isCareerActive) || (flag === "noCareer" && gameState.isCareerActive)) return true

      // mission related checks
      if ((flag === "missionOnly" && !gameState.isMissionActive) || (flag === "noMission" && gameState.isMissionActive && !gameState.isScenarioUnrestricted)) return true

      // garage related checks
      if ((flag === "garageOnly" && !gameState.isGarageActive) || (flag === "noGarage" && gameState.isGarageActive)) return true

      // scenario related checks
      if ((flag === "scenarioOnly" && !gameState.isScenarioActive) || (flag === "noScenario" && gameState.isScenarioActive && !gameState.isScenarioUnrestricted)) return true

      // career and garage related checks
      if (
        (flag === "careerGarageOnly" && (!gameState.isCareerActive || !gameState.isGarageActive)) ||
        (flag === "noCareerGarage" && gameState.isCareerActive && gameState.isGarageActive)
      )
        return true
    }

    return false
  }

  function onCareerStateChanged(data) {
    // console.log("ui_topBar_careerStateChanged", data)
    gameState.isCareerActive = data.isActive
  }

  function onGarageStateChanged(data) {
    // console.log("ui_topBar_garageStateChanged", data)
    gameState.isGarageActive = data.isActive
  }

  function onMissionStateChanged(data) {
    // console.log("ui_topBar_missionStateChanged", data)
    gameState.isMissionActive = data.isActive
  }

  function onScenarioStateChanged(data) {
    // console.log("ui_topBar_scenarioStateChanged", data)
    gameState.isScenarioActive = data.isActive
  }

  function onDataRequested(data) {
    // console.log("ui_topBar_dataRequested", data)
    const { isInGame, items: dataItems } = data

    _items.value = dataItems
    gameState.isInGame = isInGame
    hiddenItems.value = []
  }

  function onGameStateChanged(data) {
    // console.log("ui_topBar_gameStateChanged", data)
    gameState.isInGame = data.isInGame
    gameState.isCareerActive = data.isCareerActive
    gameState.isGarageActive = data.isGarageActive
    gameState.isMissionActive = data.isMissionActive
    gameState.isScenarioActive = data.isScenarioActive
    gameState.isScenarioUnrestricted = data.isScenarioUnrestricted

    nextTick(() => updateHiddenItems())
  }

  function onEntriesChanged(data) {
    // console.log("ui_topBar_entriesChanged", data)
    _items.value = data
  }

  function onVisibleItemsChanged(data) {
    // console.log("ui_topBar_visibleItemsChanged", data)
    hiddenItems.value = data
  }

  function onShow() {
    // console.log("ui_topBar_show")
    visible.value = true
  }

  function onHide() {
    // console.log("ui_topBar_hide")
    visible.value = false
  }

  const debouncedStateChange = debounce(data => {
    const stateName = (data.fullPath || data.name || "unknown").replace(/^\//, "") // Remove leading slash
    gameState.uiState = stateName
  }, 100)

  function onUIStateChanged(data) {
    // console.log("ui_topBar_uiStateChanged", data)
    debouncedStateChange(data)
  }

  const eventHandlerMap = {
    selectPrevious: selectPrevious,
    selectNext: selectNext,
    OnCareerActive: onCareerStateChanged,
    garageStateChanged: onGarageStateChanged,
    missionStateChanged: onMissionStateChanged,
    scenarioStateChanged: onScenarioStateChanged,
    dataRequested: onDataRequested,
    gameStateChanged: onGameStateChanged,
    entriesChanged: onEntriesChanged,
    visibleItemsChanged: onVisibleItemsChanged,
    show: onShow,
    hide: onHide,
  }

  function addListeners() {
    for (const eventName of Object.keys(eventHandlerMap)) {
      events.on(`${LUA_EXTENSION_NAME}_${eventName}`, eventHandlerMap[eventName])
    }
  }

  function removeListeners() {
    for (const eventName of Object.keys(eventHandlerMap)) {
      events.off(`${LUA_EXTENSION_NAME}_${eventName}`, eventHandlerMap[eventName])
    }
  }

  const setup = async () => {
    if (setupComplete) return

    const isLoaded = await Lua.extensions.isExtensionLoaded(LUA_EXTENSION_NAME)
    if (!isLoaded) await Lua.extensions.load(LUA_EXTENSION_NAME)
    addListeners()

    await Lua.ui_topBar.requestData()
    setupComplete = true
  }

  const dispose = () => {
    removeListeners()
    Lua.extensions.unload(LUA_EXTENSION_NAME)
  }

  setup()

  return {
    activeItem,
    items,
    visible,
    gameState,
    show,
    hide,
    selectEntry,
    selectPrevious,
    selectNext,
    onUIStateChanged,
    dispose,
  }
})
