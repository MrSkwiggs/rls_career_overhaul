// uiNavHandlers - functions for creating and managing handlers for UINav events

import { DOM_UI_NAVIGATION_EVENT } from "@/bridge/libs/UINavEvents"
import { default as UINavEvents, UI_SCOPE_ATTR } from "@/bridge/libs/UINavEvents"
import { SCOPED_NAV_ATTR, SCOPED_NAV_PROPERTY_NAME } from "@/services/scopedNav/constants"

const USE_ENHANCED = true

const VALUE_BASED_EVENTS = ["zoom_out", "zoom_in", "subtab_l", "subtab_r", "move_ud", "move_lr", "focus_ud", "focus_lr", "rotate_h_cam", "rotate_v_cam"]

const SCOPE_HANDLER_REGISTRY = new WeakMap()

const registerWithScope = (element, eventDescriptor, handler, originalElement) => {
  // TODO: Need to check if this will work or break when using vue teleport
  const scopeElement = element.closest(`[${UI_SCOPE_ATTR}]`)

  if (!scopeElement) {
    return addOriginal(element, eventDescriptor, handler, originalElement)
  }

  // SAFETY CHECK: Validate that the target element is within the scope
  const targetElement = originalElement || element
  if (!scopeElement.contains(targetElement)) {
    console.error("UINav: Attempting to register handler for element outside scope", {
      targetElement,
      scopeElement,
      scopeId: scopeElement.getAttribute(UI_SCOPE_ATTR),
    })

    // Fall back to individual registration
    return addOriginal(element, eventDescriptor, handler, originalElement)
  }

  let scopeRegistry = SCOPE_HANDLER_REGISTRY.get(scopeElement)
  if (!scopeRegistry) {
    scopeRegistry = {
      handlers: [],
      scopeHandler: null,
      initialized: false,
    }
    SCOPE_HANDLER_REGISTRY.set(scopeElement, scopeRegistry)
  }

  const wrapperHandler = wrapperEnhanced(eventDescriptor, handler, originalElement, element)

  const handlerDescriptor = {
    // TODO: Need to check if we can remove originalElement
    element: originalElement || element,
    eventDescriptor: _normaliseEventDescriptor(eventDescriptor),
    handler: wrapperHandler,
    disabled: false,
  }

  // Add to scope's handler registry
  scopeRegistry.handlers.push(handlerDescriptor)

  // Initialize scope handler if not done already
  if (!scopeRegistry.initialized) {
    initializeScopeHandler(scopeElement, scopeRegistry)
  }

  return wrapperHandler
}

/**
 * Initialzes the centralized event handler for a UI scope
 */
const initializeScopeHandler = (scopeElement, scopeRegistry) => {
  const scopeHandler = event => {
    // Only execute scope-based bubbling if this scope is actually active
    const scopeId = scopeElement.getAttribute(UI_SCOPE_ATTR)
    const targetScope = event.detail?.targetScope

    // Only process if this scope was the intended target
    if (targetScope && targetScope !== scopeId) {
      console.warn("UINav: Event target scope is not the intended scope", { targetScope, scopeId })
      return
    }

    // Fallback to current active scope check for events without targetScope
    if (!targetScope) {
      const isActiveScope = UINavEvents.activeScope === scopeId
      if (!isActiveScope) {
        // If scope is not active, don't interferre with normal bubbling
        return
      }
    }

    const evData = event?.detail || {}

    // Check if the event should be ignored or not at scope level
    if (
      scopeElement[SCOPED_NAV_PROPERTY_NAME] &&
      scopeElement[SCOPED_NAV_PROPERTY_NAME].canIgnoreEvent &&
      scopeElement[SCOPED_NAV_PROPERTY_NAME].canIgnoreEvent(event)
    ) {
      event.stopPropagation()
      return false
    }

    executeScopedBubbling(scopeElement, event, scopeRegistry.handlers)

    if (!event.defaultPrevented && scopeElement._bngScopedNav) {
      // The existing scoped nav system will handle additional logic
      // like scope activation, crossfire integration, etc.
    }
  }

  // Add single event listener to scope
  scopeElement.addEventListener(DOM_UI_NAVIGATION_EVENT, scopeHandler)
  scopeRegistry.scopeHandler = scopeHandler
  scopeRegistry.initialized = true
}

/**
 * Executes custom bubbling within a UIscope
 */
const executeScopedBubbling = (scopeElement, event, handlers) => {
  const eventData = event.detail

  // Determine starting element for bubbling
  let startElement = event.target
  const activeElement = document.activeElement

  // If there's an active element within scope, start from there
  // TODO: Can this check be optimized
  if (activeElement && scopeElement.contains(activeElement)) {
    const hasActiveHandlers = handlers.some(h => h.element === activeElement && !h.disabled && _eventMatchesDescriptor(eventData, h.eventDescriptor))
    if (hasActiveHandlers) {
      startElement = activeElement
    }
  }

  // If no active element or no handlers for active element, find deepes handler
  if (startElement === event.target) {
    startElement = findDeepestHandlerElement(scopeElement, handlers, eventData)
  }

  // Check if we have any handlers for this event
  // TODO: Is this check necessary when we have already filtered handlers in findDeepestHandlerElement?
  const hasMatchingHandlers = handlers.some(h => !h.disabled && _eventMatchesDescriptor(eventData, h.eventDescriptor))

  if (hasMatchingHandlers && startElement) {
    // Build bubbling path and execute handlers
    const bubblingPath = buildBubblingPath(startElement, scopeElement, handlers, eventData)
    const eventWasHandled = !executeHandlersAlongPath(bubblingPath, event)

    if (eventWasHandled) {
      event.stopPropagation()
      return
    }
  } else {
    // No handlers found - check if scope allows bubbling for this event
    const shouldBubble = checkScopeBubbling(scopeElement, event)

    if (shouldBubble) {
      // Allow event to bubble to parent scope
      // Don't stop propagation, let it continue up the DOM tree
      return
    } else {
      event.stopPropagation()
    }
  }
}

/**
 * Checks if a UI scope allowss an event to bubble up based on its scoped nav configuration
 */
const checkScopeBubbling = (scopeElement, event) => {
  // Check if this is a scoped nav element
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
 * Finds the deepest element that has matching handlers
 */
const findDeepestHandlerElement = (scopeElement, handlers, eventData) => {
  // Optimized version of the code below
  const matchingHandlers = handlers.filter(h => !h.disabled && _eventMatchesDescriptor(eventData, h.eventDescriptor))
  if (matchingHandlers.length === 0) return null

  const uniqueElements = [...new Set(matchingHandlers.map(h => h.element))]

  const elementDepths = new Map()
  // TODO: Can be possibly cached in BngOnUiNav directive and set when adding handler
  const validElements = uniqueElements.filter(el => {
    const depth = getElementDepth(el, scopeElement)
    if (depth >= 0) {
      elementDepths.set(el, depth)
      return true
    }
    return false
  })

  return validElements.sort((a, b) => elementDepths.get(b) - elementDepths.get(a))[0] || null

  // Sort by DOM depth (deepest first)
  // const sortedElements = matchingHandlers
  //   .map(h => h.element)
  //   .filter((el, index, arr) => arr.indexOf(el) === index) // Remove duplicates
  //   .filter(el => {
  //     // SAFETY CHECK: Only include elements that are within the scope
  //     const depth = getElementDepth(el, scopeElement)
  //     return depth >= 0
  //   })
  //   .sort((a, b) => {
  //     const depthA = getElementDepth(a, scopeElement)
  //     const depthB = getElementDepth(b, scopeElement)
  //     return depthB - depthA // Descending order (deepest first)
  //   })

  // return sortedElements.length > 0 ? sortedElements[0] : null
}

/**
 * Builds the bubbling path from start element to scope
 */
const buildBubblingPath = (startElement, scopeElement, handlers, eventData) => {
  if (!scopeElement.contains(startElement)) {
    console.warn("UINav: Start element is outside scope boundary", startElement, scopeElement)
    return []
  }

  // Pre-filter handlers once instead of filtering per element
  const matchingHandlers = handlers.filter(h => !h.disabled && _eventMatchesDescriptor(eventData, h.eventDescriptor))

  const path = []
  let current = startElement

  // Build path from start element up to scope element
  while (current && scopeElement.contains(current)) {
    // Find matching handlers for this element
    // const elementHandlers = handlers.filter(h => h.element === current && !h.disabled && _eventMatchesDescriptor(eventData, h.eventDescriptor))
    // Find handlers for this specific element (now O(n) instead of O(n*m))
    const elementHandlers = matchingHandlers.filter(h => h.element === current)

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
 * Executes handlers along the bubbling path
 */
const executeHandlersAlongPath = (bubblingPath, event) => {
  for (const pathItem of bubblingPath) {
    for (const handlerDescriptor of pathItem.handlers) {
      try {
        // Execute the handler
        const result = handlerDescriptor.handler(event)

        // If handler returns false, stop bubbling
        if (!result) {
          // event.stopPropagation()
          return false
        }
      } catch (error) {
        console.error("Error in UINav scope handler:", error)
      }
    }

    // If event propagation was stopped, exit bubbling
    // if (event.defaultPrevented) {
    //   return
    // }
  }

  return true
}

/**
 * Gets the depth of an element relative to a parent
 */
const getElementDepth = (element, parent) => {
  let depth = 0
  let current = element

  while (current && current !== parent) {
    depth++
    current = current.parentElement
  }

  return current === parent ? depth : -1
}

/**
 * Removes a handler from the scope registry
 */
const removeFromScope = (element, handlerController) => {
  const scopeElement = element.closest(`[${UI_SCOPE_ATTR}]`)
  if (!scopeElement) return

  const scopeRegistry = SCOPE_HANDLER_REGISTRY.get(scopeElement)
  if (!scopeRegistry) return

  // Find and remove the handler
  const handlerIndex = scopeRegistry.handlers.findIndex(h => h.element === element && h.handler === handlerController)

  if (handlerIndex !== -1) {
    scopeRegistry.handlers.splice(handlerIndex, 1)
  }

  // If no more handlers, cleanup scope listener
  if (scopeRegistry.handlers.length === 0) {
    scopeElement.removeEventListener(DOM_UI_NAVIGATION_EVENT, scopeRegistry.scopeHandler)
    SCOPE_HANDLER_REGISTRY.delete(scopeElement)
  }
}

const add = (domElement, uiNavHandlerOrDescriptor, handler = undefined, originalElement = undefined) => {
  if (USE_ENHANCED) {
    return addEnhanced(domElement, uiNavHandlerOrDescriptor, handler, originalElement)
  } else {
    return addOriginal(domElement, uiNavHandlerOrDescriptor, handler, originalElement)
  }
}

/**
 * Enhanced add function that uses scope-based handling when appropriate
 */
const addEnhanced = (domElement, uiNavHandlerOrDescriptor, handler = undefined, originalElement = undefined) => {
  // Check if element is within a UI scope
  const scopeElement = domElement.closest(`[${UI_SCOPE_ATTR}]`)

  if (scopeElement) {
    // Use scope-based registration
    return registerWithScope(domElement, uiNavHandlerOrDescriptor, handler, originalElement)
  } else {
    // Fall back to individual handler registration
    return addOriginal(domElement, uiNavHandlerOrDescriptor, handler, originalElement)
  }
}

/**
 * Add a UINav handler to a DOM Element.
 *
 * @param      {object}         domElement                The dom element
 * @param      {string|object}  uiNavHandlerOrDescriptor  Existing UINav handler (previously created by 'create', or a descriptor for creating a new one
 * @param      {function}       [handler=undefined]       Handler function (if creating a new UINav handler)
 * @return     {function}       The UINav handler that was added
 */
const addOriginal = (domElement, uiNavHandlerOrDescriptor, handler = undefined, originalElement = undefined) => {
  // use the passed uiNavHandler, or build one using descriptor and handler
  let uiNavHandler = handler ? create(uiNavHandlerOrDescriptor, handler, originalElement, domElement) : uiNavHandlerOrDescriptor
  domElement.addEventListener(DOM_UI_NAVIGATION_EVENT, uiNavHandler)
  return uiNavHandler
}

function handlePropagation(e, propagate) {
  if (!propagate && e) e.stopPropagation()
}

/**
 * Create a new UINav handler function.
 *
 * @param      {string|object}  eventDescriptor         The event descriptor (see _normaliseEventDescriptor)
 * @param      {function}       handler                 The handler
 * @return     {function}       Newly created UINav handler function
 */
const create = (eventDescriptor, handler, originalElement, domElement) => {
  // Check if this element is within a UI scope
  const scopeElement = domElement.closest(`[${UI_SCOPE_ATTR}]`)

  if (scopeElement) {
    // Use enhanced wrapper for scope-registered handlers
    return wrapperEnhanced(eventDescriptor, handler, originalElement, domElement)
  } else {
    // Use original wrapper for non-scope handlers
    return wrapperOriginal(eventDescriptor, handler, originalElement, domElement)
  }
}

/**
 * Enhanced wrapper for scope-registered handlers
 * This is a simpler wrapper since scope-level logic is handled by the scope handler
 */
function wrapperEnhanced(eventDescriptor, handler, originalElement, domElement) {
  const descriptor = _normaliseEventDescriptor(eventDescriptor)
  if (!descriptor) {
    throw new Error("Invalid event descriptor when trying to create a UINav handler. Expecting a String or an Object.")
  }

  const handlerFuncName = handler?.name || `uiNav_${_descriptorEventNameText(descriptor)}_handler`

  let disabled = false

  function wrapper(e) {
    const evData = e?.detail || {}

    // Basic event matching - scope logic is handled at scope level
    if (disabled || !_eventMatchesDescriptor(evData, descriptor)) {
      // Return true to allow bubbling when handler doesn't match
      return true
    }

    // Execute the user handler
    let result = handler(e)

    // Return the result for bubbling control
    return result
  }

  // For dynamic naming of the UINav handler function (good for stack traces)
  Object.defineProperty(wrapper, "name", { value: handlerFuncName })

  // UI Nav handlers can be instantly enabled/disabled using the "disabled" property
  Object.defineProperty(wrapper, "disabled", {
    configurable: false,
    get: () => disabled,
    set: state => {
      disabled = state
    },
  })

  return wrapper
}

const wrapperOriginal = (eventDescriptor, handler, originalElement, domElement) => {
  const descriptor = _normaliseEventDescriptor(eventDescriptor)
  if (!descriptor) {
    throw new Error("Invalid event descriptor when trying to create a UINav handler. Expecting a String or an Object.")
  }

  const handlerFuncName = handler?.name || `uiNav_${_descriptorEventNameText(descriptor)}_handler`

  let disabled = false

  function wrapper(e) {
    const evData = e?.detail || {}
    // console.log("evData", evData, descriptor, "matches", _eventMatchesDescriptor(evData, descriptor), new Error().stack)
    if (disabled || !_eventMatchesDescriptor(evData, descriptor)) return
    // console.log("handler", evData.name, new Error().stack)

    const scopeElement = document.querySelector(`[${UI_SCOPE_ATTR}="${UINavEvents.activeScope}"]`)

    // check if the event should be ignored or not, if so, immediately stop propagation
    if (
      scopeElement &&
      scopeElement[SCOPED_NAV_PROPERTY_NAME] &&
      scopeElement.contains(domElement) &&
      scopeElement[SCOPED_NAV_PROPERTY_NAME].canIgnoreEvent &&
      scopeElement[SCOPED_NAV_PROPERTY_NAME].canIgnoreEvent(e)
    ) {
      handlePropagation(e, false)
      return false
    }

    // handle passthrough
    const domScopedNavProps = domElement.hasAttribute(SCOPED_NAV_ATTR) ? domElement[SCOPED_NAV_PROPERTY_NAME] : {}
    if (
      scopeElement &&
      (!UINavEvents.activeScope || (scopeElement !== domElement && scopeElement.contains(domElement))) &&
      originalElement !== domElement &&
      domScopedNavProps.passthroughActive &&
      (!domScopedNavProps.passthroughEnabled || !domScopedNavProps.passthroughEvents.includes(evData.name))
    ) {
      // handlePropagation(e, false)
      return false
    }

    // handle bubble: this check is needed for events with no handler i.e. it cannot set the e.bubbleToNextScope to true
    const scopedNavProps =
      scopeElement && scopeElement.hasAttribute(SCOPED_NAV_ATTR) && scopeElement[SCOPED_NAV_PROPERTY_NAME] ? scopeElement[SCOPED_NAV_PROPERTY_NAME] : {}
    const shouldBubbleEvent = scopedNavProps.shouldBubbleEvent && scopedNavProps.shouldBubbleEvent(e)
    if (
      scopeElement &&
      UINavEvents.activeScope &&
      scopeElement !== domElement &&
      domElement.contains(scopeElement) &&
      !e.bubbleToNextScope &&
      !shouldBubbleEvent
    ) {
      handlePropagation(e, false)
      return false
    }

    let result = handler(e)
    const bubble = result || e.bubbleToNextScope

    // only allow scoped nav to decide whether to allow or prevent bubbling
    if (e.target.hasAttribute(SCOPED_NAV_ATTR) || e.target.hasAttribute(UI_SCOPE_ATTR)) {
      handlePropagation(e, bubble)
    }

    e.bubbleToNextScope = bubble
    return bubble
  }

  // For dynamic naming of the UINav handler function (good for stack traces)
  Object.defineProperty(wrapper, "name", { value: handlerFuncName })

  // UI Nav handlers can be instantly enabled/disabled using the "disabled" property
  Object.defineProperty(wrapper, "disabled", {
    configurable: false,
    get: () => disabled,
    set: state => {
      disabled = state
    },
  })

  return wrapper
}

/**
 * Return a textual label for the 'name' part of a descriptor
 *
 * @param      {object}  descriptor  The descriptor
 * @return     {string}  Label for the 'name' part
 */
const _descriptorEventNameText = descriptor => {
  if (!descriptor.name) return "ALL"
  if (typeof descriptor.name === "function") return descriptor.name.name
  return descriptor.name
}

/**
 *  Remove passed UINav handler from the element.
 *
 * @param      {object}  domElement    The dom element
 * @param      {function}  uiNavHandler  The navigation handler
 */
const remove = (domElement, uiNavHandler) => {
  if (USE_ENHANCED) {
    return removeEnhanced(domElement, uiNavHandler)
  } else {
    return removeOriginal(domElement, uiNavHandler)
  }
}

const removeOriginal = (domElement, uiNavHandler) => {
  domElement.removeEventListener(DOM_UI_NAVIGATION_EVENT, uiNavHandler)
}

const removeEnhanced = (domElement, uiNavHandler) => {
  // Check if element is within a UI scope
  const scopeElement = domElement.closest(`[${UI_SCOPE_ATTR}]`)

  if (scopeElement) {
    // Use scope-based removal
    removeFromScope(domElement, uiNavHandler)
  } else {
    // Fall back to individual handler removal
    removeOriginal(domElement, uiNavHandler)
  }
}

/**
 * Normalise an event descriptor.
 *
 * If a string, check for a simple event with that name (an on/down event in the case of a simple on/off type event)
 * If an object, fill a sensible default for value if it is missing (similar to string above)
 *
 * Examples:
 *  'ok' - simple string - will normalise to checking for 'ok' event with an 'on' value (truthy)
 *  {name:'ok'} - will be same as string above
 *  {name:'ok', modified:true} - object with missing 'value' - will check for a modified 'ok' event with an 'on' value
 *  {name:'ok', value:undefined} - object with 'value' present but undefined - will check for an 'ok' event with any value
 *
 * @param      {string|object}  eventDescriptor  The event descriptor
 */
const _normaliseEventDescriptor = eventDescriptor =>
  ({
    string: { name: eventDescriptor, value: _isOnOffEvent(eventDescriptor) ? _checkOn : undefined, modified: false, extras: undefined },
    object: {
      ...eventDescriptor,
      value: "value" in eventDescriptor ? eventDescriptor.value : _isOnOffEvent(eventDescriptor.name) ? _checkOn : undefined,
    },
  }[typeof eventDescriptor] || false)

/**
 * Determines whether the specified event type is an on/off event.
 *
 * @param      {string}   eventName  The event name
 * @return     {boolean}  True if the specified event descriptor is an on/off event, False otherwise.
 */
const _isOnOffEvent = eventName => !VALUE_BASED_EVENTS.includes(eventName)

/**
 * Determine if the passed event data is a match for the descriptor.
 *
 * @param      {object}   eventData   The event data
 * @param      {object}   descriptor  The descriptor (must be normalised)
 * @return     {boolean}  True if matched, False otherwise
 */
const _eventMatchesDescriptor = (eventData, descriptor) => {
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

/**
 * Check if given value is 'on' (truthy)
 *
 * @param      {any}  v       value to check
 * @return     {any}  truthy/falsy
 */
const _checkOn = v => v

export default {
  add,
  // create,
  remove,
}

export { _isOnOffEvent, _checkOn }
