/**
 * UINavEventProcessor - Pure event processing logic
 * Handles transformation of Lua events to DOM event data
 */

import { ACTIONS_BY_UI_EVENT, UI_SCOPE_ATTR } from "./constants.js"

export class UINavEventProcessor {
  constructor() {
    this.isModified = false
  }

  /**
   *
   * @param {string} name
   * @param {any} value
   * @param {array} extras
   * @param {object} context
   * @returns {object | null} Event data for DOM event, or null if event should be ignored
   */
  processEvent(name, value = undefined, extras = [], context = {}) {
    if (!this.isValidGameContext()) return null
    if (context.isEventBlocked && context.isEventBlocked(name)) return null

    this.handleModifierState(name, value)

    if (this.shouldHandleWithAngular(name, value)) {
      this.handleAngularIntegration()
      return null
    }

    return this.createEventData(name, value, extras)
  }

  /**
   * @returns Check if we're in a valid game context
   */
  isValidGameContext() {
    return window.beamng?.ingame
  }

  /**
   * Handle modifier key state tracking
   */
  handleModifierState(name, value) {
    if (name === "modifier") {
      this.isModified = value === 1
    }
  }

  /**
   * Check if this event should be handled by Angular integration
   */
  shouldHandleWithAngular(name, value) {
    return window.globalAngularRootScope && window.bngIntroShown && (name === "menu" || name === "back") && value === 1
  }

  handleAngularIntegration() {
    window.globalAngularRootScope.$broadcast("MenuToggle")
  }

  /**
   * Create event data object for DOM event
   */
  createEventData(name, value, extras) {
    const activeElement = document.activeElement
    let targetScope = null

    if (activeElement && activeElement !== document.body) {
      const scopeElement = activeElement.closest(`[${UI_SCOPE_ATTR}]`)
      if (scopeElement) targetScope = scopeElement.getAttribute(UI_SCOPE_ATTR)
    }

    return {
      name,
      value,
      modified: name !== "modifier" && this.isModified,
      extras,
      boundAction: ACTIONS_BY_UI_EVENT[name],
      sendToCrossfire: true,
      targetScope,
    }
  }

  /**
   * Get the correct DOM element to dispatch the event from
   */
  getEventBroadcastElement(activeScope) {
    const activeElement = document.activeElement
    if (activeElement && activeElement !== document.body) {
      return activeElement
    }

    if (activeScope) {
      const scopeElement = document.querySelector(`[${UI_SCOPE_ATTR}="${activeScope}"]`)
      if (scopeElement) return scopeElement
    }

    return document.body
  }
}
