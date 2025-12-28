/**
 * HandlerFactory - Creates and wraps UI navigation event handlers
 * Handles descriptor normalization, event matching, and handler wrapping
 */

import { isOnOffEvent, checkOn, normalizeEventDescriptor, eventMatchesDescriptor, getDescriptorEventNameText } from "../utils.js"

export class HandlerFactory {
  /**
   * Create a new UINav handler function
   */
  static createHandler(eventDescriptor, userHandler) {
    const descriptor = normalizeEventDescriptor(eventDescriptor)
    if (!descriptor) {
      throw new Error("Invalid event descriptor when trying to create a UINav handler. Expecting a String or an Object.")
    }

    const handlerFuncName = userHandler?.name || `uiNav_${getDescriptorEventNameText(descriptor)}_handler`
    let disabled = false

    function wrapper(event) {
      const eventData = event?.detail || {}

      // Basic event matching - scope logic is handled at scope level
      if (disabled || !eventMatchesDescriptor(eventData, descriptor)) {
        // Return true to allow bubbling when handler doesn't match
        return true
      }

      // Execute the user handler
      let result = userHandler(event)

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

  /**
   * Normalize an event descriptor
   * If a string, check for a simple event with that name
   * If an object, fill a sensible default for value if it is missing
   */
  static normalizeEventDescriptor(eventDescriptor) {
    const normalizers = {
      string: {
        name: eventDescriptor,
        value: isOnOffEvent(eventDescriptor) ? checkOn : undefined,
        modified: false,
        extras: undefined,
      },
      object: {
        ...eventDescriptor,
        value: "value" in eventDescriptor ? eventDescriptor.value : isOnOffEvent(eventDescriptor.name) ? checkOn : undefined,
      },
    }

    return normalizers[typeof eventDescriptor] || false
  }
}
