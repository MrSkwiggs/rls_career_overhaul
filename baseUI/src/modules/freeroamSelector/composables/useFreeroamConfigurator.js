import { ref, computed, onUnmounted } from "vue"
import { lua, useBridge } from "@/bridge"
import logger from "@/services/logger"

export default function useFreeroamConfigurator() {
  const { events } = useBridge()

  // State
  const configData = ref(null)
  const button = ref(null)
  const error = ref(null)
  const isInitializing = ref(false)

  // Event handlers
  const refreshConfigHandler = () => {
    logger.debug("freeroamConfiguratorRefreshConfig")
    loadConfiguration()
  }

  const refreshButtonHandler = () => {
    logger.debug("freeroamConfiguratorRefreshButton")
    loadButtons()
  }

  // Register event listeners
  events.on("freeroamConfiguratorRefreshConfig", refreshConfigHandler)
  events.on("freeroamConfiguratorRefreshButton", refreshButtonHandler)

  // Load button from backend
  const loadButtons = async () => {
    try {
      const buttonData = await lua.freeroam_freeroamConfigurator.getButtons()
      button.value = buttonData || null
      logger.debug("Loaded button:", buttonData)
    } catch (err) {
      logger.error("Failed to load button:", err)
      error.value = err
    }
  }

  // Load configuration data from Lua
  const loadConfiguration = async () => {
    try {
      error.value = null

      const data = await lua.freeroam_freeroamConfigurator.getConfiguration()

      if (data?.options) {
        processOptionsTree(data.options)
      }

      configData.value = data
      logger.debug("Loaded configuration:", data)

      // Load buttons after configuration is loaded
      await loadButtons()
    } catch (err) {
      logger.error("Failed to load freeroam configuration:", err)
      error.value = err
    }
  }

  // Helper to attach logic to the raw data tree
  const processOptionsTree = options => {
    if (!options || !Array.isArray(options)) return

    options.forEach(group => {
      if (group.key) {
        group.onChange = val => {
          group.value = val
          handleOptionChange(group.key, val)
        }
      }

      Object.defineProperty(group, "enabled", {
        get() {
          return !this.key || !!this.value
        },
        enumerable: true,
        configurable: true
      })

      if (group.options && Array.isArray(group.options)) {
        group.options.forEach(option => {
          if (option.key) {
            option.onChange = val => {
              option.value = val
              handleOptionChange(option.key, val)
            }
          }
        })
      }
    })
  }

  // Tile click handlers
  const onSpawnPointTileClick = async () => {
    try {
      await lua.freeroam_freeroamConfigurator.onSpawnPointTileClick()
      logger.debug("Spawn point tile clicked")
    } catch (err) {
      logger.error("Failed to handle spawnpoint tile click:", err)
      error.value = err
    }
  }

  const onVehicleTileClick = async () => {
    try {
      await lua.freeroam_freeroamConfigurator.onVehicleTileClick()
      logger.debug("Vehicle tile clicked")
    } catch (err) {
      logger.error("Failed to handle vehicle tile click:", err)
      error.value = err
    }
  }

  // Update configuration option
  const updateOption = async (key, value) => {
    try {
      await lua.freeroam_freeroamConfigurator.updateOption(key, value)
      logger.debug(`Updated option ${key}:`, value)
    } catch (err) {
      logger.error(`Failed to update option ${key}:`, err)
      error.value = err
    }
  }

  // Handle option changes directly from select elements
  const handleOptionChange = async (key, newValue) => {
    try {
      await lua.freeroam_freeroamConfigurator.updateOption(key, newValue)
      // Reload buttons after option change as they might be affected
      await loadButtons()
      logger.debug(`Handled option change ${key}:`, newValue)
    } catch (err) {
      logger.error(`Failed to update ${key} option:`, err)
      error.value = err
    }
  }

  // Handle button clicks
  const handleButtonClick = async (buttonId) => {
    try {
      await lua.freeroam_freeroamConfigurator.triggerButton(buttonId)
      logger.debug("Button clicked:", buttonId)
    } catch (err) {
      logger.error("Failed to trigger button:", err)
      error.value = err
    }
  }

  // Select spawn point and refresh config
  const selectSpawnPoint = async (levelName, spawnPointObjectName, key) => {
    try {
      if (!levelName) {
        logger.error("selectSpawnPoint: levelName is required")
        throw new Error("levelName is required")
      }

      await lua.freeroam_freeroamConfigurator.setSpawnPoint(levelName, spawnPointObjectName, key)

      // Refresh the config data
      configData.value.currentSpawnPoint = await lua.freeroam_freeroamConfigurator.getCurrentSpawnPointTile()

      logger.debug("Selected spawn point:", { levelName, spawnPointObjectName })
      return true
    } catch (err) {
      logger.error("Failed to select spawn point:", err)
      error.value = err
      return false
    }
  }

  // Select vehicle and refresh config
  const selectVehicle = async (model, config, additionalData, key) => {
    try {
      if (!model || !config) {
        logger.error("selectVehicle: model and config are required")
        throw new Error("model and config are required")
      }

      await lua.freeroam_freeroamConfigurator.setVehicle(model, config, additionalData || {}, key)

      // Refresh the config data
      configData.value.currentVehicle = await lua.freeroam_freeroamConfigurator.getCurrentVehicleTile()

      logger.debug("Selected vehicle:", { model, config, additionalData })
      return true
    } catch (err) {
      logger.error("Failed to select vehicle:", err)
      error.value = err
      return false
    }
  }

  // Navigation helpers
  const gotoHeaderItem = (item) => {
    if (item.gotoPath) {
      window.bngVue.gotoGameState(item.gotoPath.path, { params: item.gotoPath.props })
      logger.debug("Navigated to path:", item.gotoPath)
    }
    if (item.gotoAngularState) {
      window.bngVue.gotoAngularState(item.gotoAngularState)
      logger.debug("Navigated to angular state:", item.gotoAngularState)
    }
    if (item.click) {
      item.click()
      logger.debug("Navigated to click:", item.click)
    }
  }

  const goBack = () => {
    logger.debug("goBack called")
    gotoHeaderItem({ gotoAngularState: "menu.mainmenu" })
  }

  // Computed properties
  const hasOptions = computed(() =>
    configData.value?.options && configData.value.options.length > 0
  )

  const hasSpawnPoint = computed(() =>
    !!configData.value?.currentSpawnPoint
  )

  const hasVehicle = computed(() =>
    !!configData.value?.currentVehicle
  )

  const canConfigureOptions = computed(() =>
    hasSpawnPoint.value && hasVehicle.value
  )

  // Helper methods
  const isGroupEnabled = (group) => {
    return !group.key || !!group.value
  }

  // Initialize function
  const initialize = async () => {
    if (isInitializing.value) {
      logger.debug("Already initializing, skipping...")
      return
    }

    try {
      isInitializing.value = true
      logger.debug("Initializing FreeroamConfigurator composable...")
      await loadConfiguration()
      logger.debug("FreeroamConfigurator composable initialized successfully")
    } catch (err) {
      logger.error("Failed to initialize FreeroamConfigurator composable:", err)
      error.value = err
    } finally {
      isInitializing.value = false
    }
  }

  // Cleanup function
  const cleanup = () => {
    logger.debug("FreeroamConfigurator composable cleanup")
    events.off("freeroamConfiguratorRefreshConfig", refreshConfigHandler)
    events.off("freeroamConfiguratorRefreshButton", refreshButtonHandler)
  }

  // Lifecycle cleanup
  onUnmounted(() => {
    cleanup()
  })

  return {
    // State
    configData,
    config: configData,
    button,
    error,
    isInitializing,

    // Computed
    hasOptions,
    hasSpawnPoint,
    hasVehicle,
    canConfigureOptions,

    // Actions
    initialize,
    loadConfiguration,
    loadButtons,
    onSpawnPointTileClick,
    onVehicleTileClick,
    updateOption,
    handleOptionChange,
    handleButtonClick,
    selectSpawnPoint,
    selectVehicle,
    gotoHeaderItem,
    goBack,

    // Helper methods
    isGroupEnabled
  }
}
