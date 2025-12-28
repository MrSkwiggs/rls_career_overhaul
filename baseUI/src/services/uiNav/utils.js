/**
 * UINav Utilities - Common utility functions for UI navigation
 */

import { VALUE_BASED_EVENTS } from "./constants.js"

/**
 * Determines whether the specified event type is an on/off event
 * @param {string} eventName - The event name
 * @returns {boolean} - True if the specified event is an on/off event, False otherwise
 */
export const isOnOffEvent = eventName => !VALUE_BASED_EVENTS.includes(eventName)

/**
 * Check if given value is 'on' (truthy)
 * @param {any} value - Value to check
 * @returns {any} - Truthy/falsy
 */
export const checkOn = value => value

/**
 * Handle event propagation
 * @param {Event} event - The event object
 * @param {boolean} propagate - Whether to allow propagation
 */
export const handlePropagation = (event, propagate) => {
  if (!propagate && event) event.stopPropagation()
}

/**
 * Normalize an event descriptor
 * @param {string|object} eventDescriptor - The event descriptor
 * @returns {object|false} - Normalized descriptor or false if invalid
 */
export const normalizeEventDescriptor = eventDescriptor => {
  const descriptorTypes = {
    string: {
      name: eventDescriptor,
      value: isOnOffEvent(eventDescriptor) ? checkOn : undefined,
      modified: false,
      extras: undefined
    },
    object: {
      ...eventDescriptor,
      value: "value" in eventDescriptor
        ? eventDescriptor.value
        : isOnOffEvent(eventDescriptor.name) ? checkOn : undefined,
    },
  }

  return descriptorTypes[typeof eventDescriptor] || false
}

/**
 * Check if event data matches a descriptor
 * @param {object} eventData - The event data
 * @param {object} descriptor - The descriptor (must be normalized)
 * @returns {boolean} - True if matched, False otherwise
 */
export const eventMatchesDescriptor = (eventData, descriptor) => {
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
 * Return a textual label for the 'name' part of a descriptor
 * @param {object} descriptor - The descriptor
 * @returns {string} - Label for the 'name' part
 */
export const getDescriptorEventNameText = descriptor => {
  if (!descriptor.name) return "ALL"
  if (typeof descriptor.name === "function") return descriptor.name.name
  return descriptor.name
}