/**
 * UINavActionHandlers - Handles default actions for UI navigation events
 * Processes DOM ui_nav events and executes corresponding game actions
 */
import { default as lua, runRaw as runRawLua } from "@/bridge/libs/Lua"
import logger from "@/services/logger"
import * as Crossfire from "@/services/crossfire"
import { NAV_ACTIONS } from "./constants.js"

export class UINavActionHandlers {
  constructor(eventBus = null) {
    this._useCrossfire = true
    this.eventBus = eventBus
  }

  /**
   * Set whether to use Crossfire for event handling
   */
  setUseCrossfire(enabled) {
    this._useCrossfire = enabled
  }

  get useCrossfire() {
    return this._useCrossfire
  }

  setEventBus(eventBus) {
    this.eventBus = eventBus
  }

  /**
   * Handle global UI navigation events with default behaviors
   * This is the main entry point for DOM ui_nav events
   *
   * @param {CustomEvent} event - The UI navigation DOM event
   */
  handleGlobalEvent = event => {
    // logger.debug("UINavActionHandlers: handleGlobalEvent", { event })
    const eventData = event.detail

    // Handle button down events (value === 1)
    if (eventData.value === 1) {
      if (this.handleMenuActions(eventData)) return
      if (this.handleNavigationActions(eventData)) return
      if (this.handleGameActions(eventData)) return
    }

    // Send to Crossfire
    if (this.useCrossfire && eventData.sendToCrossfire) {
      Crossfire.handleUINavEvent(event)
    }

    // Handle remaining actions if not prevented by Crossfire
    if (!event.defaultPrevented) {
      this.handleTabNavigation(eventData)
      this.handleCameraRotation(eventData)
      this.handleContextActions(eventData)
    }
  }

  /**
   * Handle menu-related actions (menu, back)
   * @param {object} eventData - Event detail data
   * @returns {boolean} - True if event was handled, otherwise false
   */
  handleMenuActions = eventData => {
    if (eventData.name === "menu" || eventData.name === "back") {
      // Tell Angular to toggle menu
      // Note: This is backward compatibility with Angular screens
      const globalAngularRootScope = window.globalAngularRootScope
      if (globalAngularRootScope) {
        globalAngularRootScope.$broadcast("MenuToggle")
        return false
      }
      return true
    }
    return false
  }

  /**
   * Handle navigation actions (focus movements)
   * @param {object} eventData - Event detail data
   * @returns {boolean} - True if event was handled, otherwise false
   */
  handleNavigationActions(eventData) {
    if (NAV_ACTIONS.includes(eventData.name)) {
      // Tell Lua we're in MenuItemNavigation
      lua.extensions.hook("onMenuItemNavigation")
      return
    }
    return false
  }

  /**
   * Handle game-specific actions (pause, camera center)
   * @param {object} eventData - Event detail data
   * @returns {boolean} - True if event was handled, otherwise false
   */
  handleGameActions(eventData) {
    switch (eventData.name) {
      case "pause":
        // Toggle pause state
        lua.simTimeAuthority.togglePause()
        return true

      case "center_cam":
        // Center camera - uses player ID from extras if available
        runRawLua(`if core_camera then core_camera.resetCamera(${eventData.extras.player}) end`, false)
        return true

      default:
        return false
    }
  }

  /**
   * Handle tab navigation (tab_l, tab_r)
   * @param {object} eventData - Event detail data
   */
  handleTabNavigation(eventData) {
    if (eventData.value === 1) {
      switch (eventData.name) {
        case "tab_l":
          this.eventBus.emit("ui_topBar_selectPrevious")
          break
        case "tab_r":
          this.eventBus.emit("ui_topBar_selectNext")
          break
      }
    }
  }

  /**
   * Handle camera rotation (rotate_h_cam, rotate_v_cam)
   * @param {object} eventData - Event detail data
   */
  handleCameraRotation(eventData) {
    // TODO: Maybe this should be handled in lua via gameplay or action map?
    if (eventData.name === "rotate_h_cam" || eventData.name === "rotate_v_cam") {
      const camDir = eventData.name === "rotate_v_cam" ? "pitch" : "yaw"
      const [filterType] = eventData.extras || [0]
      runRawLua(`if core_camera then core_camera.rotate_${camDir}(${eventData.value}, ${filterType}) end`, false)
    }
  }

  /**
   * Handle context-specific actions
   * @param {object} eventData - Event detail data
   */
  handleContextActions(eventData) {
    // TODO: Maybe this should be handled in lua instead like either in the next higher action map or in gameplay layer?
    const bigmapEvents = ["context", "details", "camera"]
    if (bigmapEvents.includes(eventData.name) && eventData.value === 1 && this.isBigMapContext()) {
      runRawLua(`if freeroam_bigMapMode then freeroam_bigMapMode.toggleBigMap() end`, false)
    }
  }

  isBigMapContext() {
    // TODO: Why not check from lua state/context if currently in bigmap or not
    const validHashes = ["#/bigmap", "#/menu.bigmap", "#/play", "#/menu/bigmap"]
    return validHashes.includes(window.location.hash)
  }
}
