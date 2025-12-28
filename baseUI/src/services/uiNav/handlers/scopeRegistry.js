/**
 * ScopeRegistry - Manages scope-based UI navigation handlers
 * Handles registration, initialization, and cleanup of handlers within UI scopes
 */

import { MONITORED_UI_NAV_EVENTS } from "@/services/crossfire.js"
import { DOM_UI_NAVIGATION_EVENT, UI_EVENTS, UI_SCOPE_ATTR } from "@/services/uiNav/constants.js"
import { getUINavServiceInstance } from "@/services/uiNav/uiNavService.js"
import { SCOPED_NAV_PROPERTY_NAME, SCOPED_NAV_ATTR } from "@/services/scopedNav/constants"

export class ScopeRegistry {
  constructor() {
    this.scopeRegistries = new WeakMap()
    this.depthCache = new WeakMap()
    this.cleanupTimers = new Map()
  }

  /**
   * Clear depth cache for a scope (call when DOM structure changes)
   */
  clearDepthCache(scopeElement) {
    this.depthCache.delete(scopeElement)
  }

  /**
   *  Get cached depth or calculate and cache it
   */
  getCachedDepth(element, scopeElement) {
    let scopeDepthCache = this.depthCache.get(scopeElement)

    if (!scopeDepthCache) {
      scopeDepthCache = new Map()
      this.depthCache.set(scopeElement, scopeDepthCache)
    }

    if (!scopeDepthCache.has(element)) {
      const depth = this._getElementDepth(element, scopeElement)
      scopeDepthCache.set(element, depth)
    }

    return scopeDepthCache.get(element)
  }

  /**
   * Register a handler with a UI scope
   */
  register(scopeElement, handlerDescriptor) {
    let scopeRegistry = this.scopeRegistries.get(scopeElement)
    if (!scopeRegistry) {
      scopeRegistry = {
        handlers: [],
        scopeHandler: null,
        initialized: false,
      }
      this.scopeRegistries.set(scopeElement, scopeRegistry)
    }

    const existingIndex = scopeRegistry.handlers.findIndex(
      h => h.element === handlerDescriptor.element && this.descriptorsMatch(h.eventDescriptor, handlerDescriptor.eventDescriptor)
    )
    if (existingIndex !== -1) {
      scopeRegistry.handlers[existingIndex] = handlerDescriptor
    } else {
      scopeRegistry.handlers.push(handlerDescriptor)
    }

    if (!scopeRegistry.initialized) {
      this.initializeScopeHandler(scopeElement, scopeRegistry)
    }

    this.clearDepthCache(scopeElement)
    return handlerDescriptor.handler
  }

  descriptorsMatch(desc1, desc2) {
    return desc1.name === desc2.name && desc1.modified === desc2.modified && desc1.focusRequired === desc2.focusRequired
  }

  /**
   * Unregister a handler from a scope
   */
  unregister(element, handlerController) {
    const scopeElement = element.closest(`[${UI_SCOPE_ATTR}]`)
    if (!scopeElement) return

    const scopeRegistry = this.scopeRegistries.get(scopeElement)
    if (!scopeRegistry) return

    // Find and remove the handler
    const handlerIndex = scopeRegistry.handlers.findIndex(h => h.element === element && h.handler === handlerController)

    if (handlerIndex !== -1) {
      scopeRegistry.handlers.splice(handlerIndex, 1)

      this.clearDepthCache(scopeElement)
    }

    this.scheduleCleanup(scopeElement, scopeRegistry)
  }

  /**
   *  Schedule cleanup with debouncing to avoid repeated cleanup operations
   */
  scheduleCleanup(scopeElement, scopeRegistry) {
    if (this.cleanupTimers.has(scopeElement)) {
      clearTimeout(this.cleanupTimers.get(scopeElement))
    }

    // Schedule a new cleanup
    const timerId = setTimeout(() => {
      this.performCleanup(scopeElement, scopeRegistry)
      this.cleanupTimers.delete(scopeElement)
    }, 100)

    this.cleanupTimers.set(scopeElement, timerId)
  }

  performCleanup(scopeElement, scopeRegistry) {
    if (scopeRegistry.handlers.length === 0) {
      scopeElement.removeEventListener(DOM_UI_NAVIGATION_EVENT, scopeRegistry.scopeHandler)
      this.scopeRegistries.delete(scopeElement)
      this.clearDepthCache(scopeElement)
    }
  }

  /**
   * Clean up all timers (call on service destruction)
   */
  destroy() {
    this.cleanupTimers.forEach(timer => clearTimeout(timer))
    this.cleanupTimers.clear()
    this.depthCache = new WeakMap()
  }

  /**
   * Initialize the centralized event handler for a UI scope
   */
  initializeScopeHandler(scopeElement, scopeRegistry) {
    const scopeHandler = event => {
      const scopeId = scopeElement.getAttribute(UI_SCOPE_ATTR)
      const uiNavService = getUINavServiceInstance()
      const targetScope = event.detail?.targetScope || uiNavService.activeScope

      if (targetScope && targetScope !== scopeId && !this._isTargetScopeNested(targetScope, scopeElement)) {
        console.warn(`UINav: Event target scope is not the intended scope. Ignoring event for this scope(${scopeId})`, { targetScope, scopeId })
        return
      }

      // canIgnoreEvent
      if (
        scopeElement[SCOPED_NAV_PROPERTY_NAME] &&
        scopeElement[SCOPED_NAV_PROPERTY_NAME].canIgnoreEvent &&
        scopeElement[SCOPED_NAV_PROPERTY_NAME].canIgnoreEvent(event)
      ) {
        event.stopPropagation()
        return
      }

      // passthrough events
      const isTargetActiveScope = targetScope === scopeId && scopeId === uiNavService.activeScope
      const canPassthrough = isTargetActiveScope && this._allowsPassthrough(scopeElement, event.detail)
      const monitoredEvents = [...MONITORED_UI_NAV_EVENTS, UI_EVENTS.back]

      if (!isTargetActiveScope && !canPassthrough && !monitoredEvents.includes(event.detail.name)) {
        return // if passthrough is not allowed, just bubble up and let the parent scope or global handler process the event
      }
      if (!isTargetActiveScope && !canPassthrough && monitoredEvents.includes(event.detail.name)) {
        const res = this._executeScopedNavHandler(scopeElement, event, scopeRegistry.handlers)
        if (!res) event.stopPropagation()
        return
      }

      const res = this._executeScopedBubbling(scopeElement, event, scopeRegistry.handlers)
      // TODO: Check if we should allow this or require both res and this._checkScopeBubbling to be true
      if (!res || !this._checkScopeBubbling(scopeElement, event)) event.stopPropagation()
    }

    // Add single event listener to scope
    scopeElement.addEventListener(DOM_UI_NAVIGATION_EVENT, scopeHandler)
    scopeRegistry.scopeHandler = scopeHandler
    scopeRegistry.initialized = true
  }

  _isTargetScopeNested(targetScopeId, currentScopeElement) {
    const targetScopeElement = document.querySelector(`[${UI_SCOPE_ATTR}="${targetScopeId}"]`)
    if (!targetScopeElement) return false

    return currentScopeElement.contains(targetScopeElement) && targetScopeElement !== currentScopeElement
  }

  _executeScopedNavHandler(scopeElement, event, handlers) {
    const matchingHandlers = handlers.filter(h => !h.disabled && this._eventMatchesDescriptor(event.detail, h.eventDescriptor) && h.element === scopeElement)
    if (matchingHandlers.length === 0) return true

    const results = []
    for (const handler of matchingHandlers) {
      try {
        const result = handler.handler(event)
        results.push(result)
      } catch (error) {
        console.error("Error in UINav scope handler:", error, {
          element: handler.element,
          event: event.detail.name,
        })
        results.push(false)
      }
    }

    return results.some(result => result === true)
  }

  /**
   * Execute custom bubbling within a UI scope
   */
  _executeScopedBubbling(scopeElement, event, handlers) {
    const eventData = event.detail

    const matchingHandlers =
      handlers && handlers.length > 0 ? handlers.filter(h => !h.disabled && this._eventMatchesDescriptor(eventData, h.eventDescriptor)) : []
    if (matchingHandlers.length === 0) return true

    const activeElement = document.activeElement
    let startElement = event.target

    if (activeElement && scopeElement.contains(activeElement) && matchingHandlers.some(h => h.element === activeElement)) {
      startElement = activeElement
    } else {
      startElement = this._findDeepestHandlerElement(scopeElement, matchingHandlers)
    }

    const bubblingPath = this._buildBubblingPath(startElement, scopeElement, matchingHandlers)
    if (bubblingPath.length === 0) {
      console.warn("UINav: No bubbling path found.", { scopeElement, event, handlers })
      return true
    }

    return this._executeHandlersAlongPath(bubblingPath, event)
  }

  /**
   * Find the deepest element that has matching handlers
   */
  _findDeepestHandlerElement(scopeElement, handlers) {
    const uniqueElements = [...new Set(handlers.map(h => h.element))]
    const validElements = uniqueElements.filter(el => {
      const depth = this.getCachedDepth(el, scopeElement)
      if (depth < 0) return false
      return !this._isElementInNestedScope(el, scopeElement)
    })

    return (
      validElements.sort((a, b) => {
        const depthA = this.getCachedDepth(a, scopeElement)
        const depthB = this.getCachedDepth(b, scopeElement)
        return depthB - depthA
      })[0] || null
    )
  }

  _isElementInNestedScope(element, currentScopeElement) {
    let current = element

    while (current && current !== currentScopeElement) {
      if (current.hasAttribute(UI_SCOPE_ATTR) && current !== currentScopeElement) return true
      current = current.parentElement
    }

    return false
  }

  /**
   * Build the bubbling path from start element to scope
   */
  _buildBubblingPath(startElement, scopeElement, handlers) {
    if (!scopeElement.contains(startElement)) {
      console.warn("UINav: Start element is outside scope boundary", startElement, scopeElement)
      return []
    }

    const path = []
    let current = startElement

    // Build path from start element up to scope element
    while (current && scopeElement.contains(current)) {
      const elementHandlers = handlers.filter(h => h.element === current)

      if (elementHandlers.length > 0) {
        path.push({
          element: current,
          handlers: elementHandlers,
        })
      }

      if (current === scopeElement) break
      current = current.parentElement
    }

    return path
  }

  /**
   * Execute handlers along the bubbling path
   */
  _executeHandlersAlongPath(bubblingPath, event) {
    for (const pathItem of bubblingPath) {
      const results = []

      for (const handlerDescriptor of pathItem.handlers) {
        try {
          const result = handlerDescriptor.handler(event)
          results.push(result)
        } catch (error) {
          console.error("Error in UINav scope handler:", error, {
            element: pathItem.element,
            event: event.detail.name,
          })
          results.push(false)
        }
      }

      const shouldContinueBubbling = results.some(result => result === true)
      if (!shouldContinueBubbling) return false
    }

    return true
  }

  /**
   * Check if a UI scope allows an event to bubble up
   */
  _checkScopeBubbling(scopeElement, event) {
    const scopedNavProps = scopeElement._bngScopedNav
    if (!scopedNavProps) {
      // Not a scoped nav element, allow bubbling by default
      return true
    }

    if (scopedNavProps.shouldBubbleEvent && typeof scopedNavProps.shouldBubbleEvent === "function") {
      return scopedNavProps.shouldBubbleEvent(event)
    }

    return false
  }

  /**
   * Get the depth of an element relative to a parent
   */
  _getElementDepth(element, parent) {
    let depth = 0
    let current = element

    while (current && current !== parent) {
      depth++
      current = current.parentElement
    }

    return current === parent ? depth : -1
  }

  _allowsPassthrough(scopeElement, eventData) {
    const domScopedNavProps = scopeElement.hasAttribute(SCOPED_NAV_ATTR) ? scopeElement[SCOPED_NAV_PROPERTY_NAME] : {}
    return domScopedNavProps.passthroughActive && domScopedNavProps.passthroughEnabled && domScopedNavProps.passthroughEvents.includes(eventData.name)
  }

  /**
   * Check if event data matches a descriptor
   */
  _eventMatchesDescriptor(eventData, descriptor) {
    for (let [item, value] of Object.entries(descriptor)) {
      if (value !== undefined) {
        if (item === "focusRequired") {
          if (value && !value.contains(document.activeElement)) return false
        } else {
          if (!(item in eventData)) return false
          if (typeof value === "function") {
            if (!value(eventData[item])) return false
          } else if (eventData[item] != value) {
            return false
          }
        }
      }
    }
    return true
  }
}
