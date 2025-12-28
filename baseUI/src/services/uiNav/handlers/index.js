/**
 * UINavHandlers - Main handler manager for UI navigation events
 * Provides the primary API for adding/removing handlers and manages scope vs individual registration
 */

import { DOM_UI_NAVIGATION_EVENT, UI_SCOPE_ATTR } from "../constants.js"
import { ScopeRegistry } from "./scopeRegistry.js"
import { HandlerFactory } from "./handlerFactory.js"

export class UINavHandlers {
  constructor() {
    this.scopeRegistry = new ScopeRegistry()
  }

  /**
   * Add a UINav handler to a DOM Element
   *
   * @param {HTMLElement} domElement - The DOM element to attach handler to
   * @param {string|object} uiNavHandlerOrDescriptor - Existing handler or descriptor for creating new one
   * @param {function} [handler=undefined] - Handler function (if creating a new handler)
   * @param {HTMLElement} [originalElement=undefined] - Original element reference
   * @returns {function} The UINav handler that was added
   */
  add(domElement, uiNavHandlerOrDescriptor, handler = undefined) {
    const scopeElement = domElement.closest(`[${UI_SCOPE_ATTR}]`)

    if (scopeElement) {
      return this.addWithScope(domElement, uiNavHandlerOrDescriptor, handler, scopeElement)
    } else {
      return this.addIndividual(domElement, uiNavHandlerOrDescriptor, handler)
    }
  }

  /**
   * Remove a UINav handler from a DOM Element
   *
   * @param {HTMLElement} domElement - The DOM element to remove handler from
   * @param {function} uiNavHandler - The handler function to remove
   */
  remove(domElement, uiNavHandler) {
    const scopeElement = domElement.closest(`[${UI_SCOPE_ATTR}]`)

    if (scopeElement) {
      this.scopeRegistry.unregister(domElement, uiNavHandler)
    } else {
      this.removeIndividual(domElement, uiNavHandler)
    }
  }

  /**
   * Add handler using scope-based registration
   * @private
   */
  addWithScope(domElement, uiNavHandlerOrDescriptor, handler, scopeElement) {
    // SAFETY CHECK: Validate that the target element is within the scope
    const targetElement = domElement
    if (!scopeElement.contains(targetElement)) {
      console.error("UINav: Attempting to register handler for element outside scope", {
        targetElement,
        scopeElement,
        scopeId: scopeElement.getAttribute(UI_SCOPE_ATTR),
      })

      // Fall back to individual registration
      return this.addIndividual(domElement, uiNavHandlerOrDescriptor, handler)
    }

    // Create or use existing handler
    const wrapperHandler = handler ? HandlerFactory.createHandler(uiNavHandlerOrDescriptor, handler) : uiNavHandlerOrDescriptor

    const handlerDescriptor = {
      element: domElement,
      eventDescriptor: HandlerFactory.normalizeEventDescriptor(uiNavHandlerOrDescriptor),
      handler: wrapperHandler,
      disabled: false,
    }

    return this.scopeRegistry.register(scopeElement, handlerDescriptor)
  }

  /**
   * Add handler using individual element registration
   * @private
   */
  addIndividual(domElement, uiNavHandlerOrDescriptor, handler) {
    // Use the passed handler, or build one using descriptor and handler
    const uiNavHandler = handler ? HandlerFactory.createHandler(uiNavHandlerOrDescriptor, handler) : uiNavHandlerOrDescriptor

    domElement.addEventListener(DOM_UI_NAVIGATION_EVENT, uiNavHandler)
    return uiNavHandler
  }

  /**
   * Remove handler using individual element registration
   * @private
   */
  removeIndividual(domElement, uiNavHandler) {
    domElement.removeEventListener(DOM_UI_NAVIGATION_EVENT, uiNavHandler)
  }
}

// Export singleton instance
export default new UINavHandlers()
