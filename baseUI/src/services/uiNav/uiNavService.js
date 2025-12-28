import { GAME_UI_NAVIGATION_EVENT, GAME_UI_NAV_MAP_ENABLED_EVENT, DOM_UI_NAVIGATION_EVENT, UI_NAV_ACTION_GROUP, ACTIONS_BY_UI_EVENT } from "./constants.js"
import { UINavEventProcessor } from "./eventProcessor.js"
import { UINavActionHandlers } from "./actionHandlers.js"
import { lua } from "@/bridge"
import logger from "@/services/logger"

class UINavService {
  constructor(eventBus) {
    this._eventBus = eventBus
    this._eventsActive = false
    this._globalEventsHooked = false
    this._activeScope = undefined
    this._blockedEvents = []

    this.eventProcessor = new UINavEventProcessor()
    this.actionHandlers = new UINavActionHandlers(eventBus)

    this.useCrossfire = true
  }

  initialize() {
    // this._eventBus = eventBus
    // this.actionHandlers.setEventBus(eventBus)
    this.attachEventListeners()
    this.hookGlobalEvents()
  }

  handleGameEvent = (name, value, ...extras) => {
    // logger.debug("UINavService: handleGameEvent", { name, value, extras })
    const context = {
      activeScope: this.activeScope,
      isEventBlocked: eventName => this.isEventBlocked(eventName),
    }

    const eventData = this.eventProcessor.processEvent(name, value, extras, context)

    if (eventData) {
      this.dispatchDOMEvent(eventData)
    }
  }

  /**
   * Add events to the internal blocklist
   * @param  {...string} events - Event names to block
   */
  blockEvents(...events) {
    const eventsToAdd = events.flat().filter(event => !this._blockedEvents.includes(event))
    this._blockedEvents.push(...eventsToAdd)
  }

  /**
   * Remove events from the internal blocklist
   * @param {...string} events - Event names to unblock
   */
  unblockEvents(...events) {
    const eventsToRemove = events.flat()
    this._blockedEvents = this._blockedEvents.filter(event => !eventsToRemove.includes(event))
  }

  /**
   * Set the entire blocklist (replaces existing)
   * @param {string[]} events - Array of event names to block
   */
  setBlockedEvents(events = []) {
    this._blockedEvents = [...events]
  }

  /**
   * Clear all blocked events
   */
  clearBlockedEvents() {
    this._blockedEvents = []
  }

  /**
   * Check if an event is blocked
   * @param {string} eventName - Event name to check
   * @returns {boolean} - True if blocked
   */
  isEventBlocked(eventName) {
    return this._blockedEvents.includes(eventName)
  }

  /**
   * @returns {string[]} Get current blocked events list (read-only copy)
   */
  getBlockedEvents() {
    return [...this._blockedEvents]
  }


  handleEnabledChange = state => {
    this.eventsActive = state
  }

  dispatchDOMEvent = eventData => {
    const event = new CustomEvent(DOM_UI_NAVIGATION_EVENT, {
      detail: eventData,
      cancelable: true,
      bubbles: true,
    })

    // console.log("dispatchDOMEvent", eventData)
    const targetElement = this.eventProcessor.getEventBroadcastElement(this.activeScope)
    // console.log("targetElement", targetElement)
    targetElement.dispatchEvent(event)
  }

  /**
   * Fire an UI event
   *
   * @param      {string}  uiEvent  UI event name
   * @return     {Function}  A function that fires the UI event
   */
  fireEvent(uiEvent, value) {
    if (!this._eventBus) return

    if (value instanceof PointerEvent) {
      // specific for being on @click (used in the uiNavTracker)
      this._eventBus.emit(GAME_UI_NAVIGATION_EVENT, uiEvent, 1)
      this._eventBus.emit(GAME_UI_NAVIGATION_EVENT, uiEvent, 0)
    } else {
      this._eventBus.emit(GAME_UI_NAVIGATION_EVENT, uiEvent, typeof value === "number" ? value : value ? 1 : 0)
    }
  }

  setActiveScope(scopeId) {
    this._activeScope = scopeId
    // Could add validation here in the future
  }

  /**
   * Get the active UI scope
   */
  get activeScope() {
    return this._activeScope
  }

  /**
   * Activate/Deactivate the UINavEvent system
   */
  activate(state = true) {
    this.attachEventListeners(state)
    this.eventsActive = state
  }

  /**
   * Hook/unhook global DOM event handlers
   */
  hookGlobalEvents(state = true) {
    const listenerAction = document.body[state ? "addEventListener" : "removeEventListener"]
    listenerAction(DOM_UI_NAVIGATION_EVENT, this.actionHandlers.handleGlobalEvent)
    this.globalEventsHooked = state
  }

  /**
   * Attach/detach event bus listeners
   */
  attachEventListeners(state = true) {
    if (!this._eventBus) return

    this._eventBus.off(GAME_UI_NAVIGATION_EVENT)
    this._eventBus.off(GAME_UI_NAV_MAP_ENABLED_EVENT)

    if (state) {
      this._eventBus.on(GAME_UI_NAVIGATION_EVENT, this.handleGameEvent)
      this._eventBus.on(GAME_UI_NAV_MAP_ENABLED_EVENT, this.handleEnabledChange)
    }
  }

  // Event filtering methods
  setFilteredEvents(...events) {
    this.clearFilteredEvents()
    const actionsToFilter = [...new Set(events.flat(Infinity))].map(event => ACTIONS_BY_UI_EVENT[event])
    lua.extensions.core_input_actionFilter.setGroup(UI_NAV_ACTION_GROUP, actionsToFilter)
    lua.extensions.core_input_actionFilter.addAction(0, UI_NAV_ACTION_GROUP, true)
  }

  setFilteredEventsAllExcept(...events) {
    const eventsToNotFilter = [...new Set(events.flat(Infinity))]
    const allEvents = Object.keys(ACTIONS_BY_UI_EVENT)
    const eventsToFilter = allEvents.filter(ev => !eventsToNotFilter.includes(ev))
    this.setFilteredEvents(eventsToFilter)
  }

  clearFilteredEvents() {
    lua.extensions.core_input_actionFilter.addAction(0, UI_NAV_ACTION_GROUP, false)
    lua.extensions.core_input_actionFilter.setGroup(UI_NAV_ACTION_GROUP, [])
  }

  // Getters for system state
  set eventsActive(value) {
    this._eventsActive = value
  }

  get eventsActive() {
    return this._eventsActive
  }

  set globalEventsHooked(value) {
    this._globalEventsHooked = value
  }

  get globalEventsHooked() {
    return this._globalEventsHooked
  }

  get useCrossfire() {
    return this.actionHandlers.useCrossfire
  }

  set useCrossfire(value) {
    this.actionHandlers.setUseCrossfire(value)
  }

  get eventBus() {
    return this._eventBus
  }
}

let instance = null
export const setUINavServiceInstance = (serviceInstance) => {
  instance = serviceInstance
}

export const getUINavServiceInstance = () => {
  if (!instance) {
    throw new Error("UINavService not initialized.")
  }
  return instance
}

export { UINavService }
export default getUINavServiceInstance
