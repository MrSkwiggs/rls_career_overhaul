// useUiNavScalar.js
import { ref } from "vue"

/**
 * useUINavScalarEventsHandler
 * @description Handles UINav events and processes them into a single scalar value
 * Implements axis locking: once an axis becomes dominant (non-neutral),
 * it is "locked" and its input will exclusively be used until it goes to a neutral (0) value.
 *
 * A configurable debounceDelay is applied to processInput to batch rapid events.
 * Additionally, a trigger threshold is included, so that only inputs with an absolute value
 * exceeding the threshold are processed.
 *
 * Options:
 * - onUpdate {function}: Callback to call when a processed update is ready. Receives ({axis, direction, oldDirection}).
 * - alpha {number}: The smoothing factor. Defaults to 0.1.
 * - debounceDelay {number}: Delay in milliseconds for debouncing. Defaults to 150.
 * - threshold {number}: The absolute scalar threshold required to process an input. Defaults to 0.2.
 *
 * @param {Object} options
 * @param {Number} options.initialValue - The starting value. Defaults to 0.
 * @param {Number} options.alpha - The smoothing factor. Defaults to 0.1.
 * @param {Number} options.threshold - The starting value at which the value gets processed (i.e. deadzone).
 * @param {Number} options.debounceDelay - The number of milliseconds to debounce the input.
 * @param {function} options.onUpdate - Callback to call when a processed update is ready. Receives ({axis, direction, oldDirection}).
 * @returns {Object} - Returns the following reactive values and a handleEvent function:
 *   focusUDValue,
 *   focusLRValue,
 *   activeAxis,
 *   direction,
 *   handleEvent,
 */
export function useUINavScalarEventsHandler(options = {}) {
  const alpha = options.alpha || 0.1
  const threshold = options.threshold || 0.2
  const initialValue = options.initialValue || 0
  const onUpdate = options.onUpdate
  const debounceDelay = options.debounceDelay || 150

  const focusUDValue = ref(initialValue)
  const focusLRValue = ref(initialValue)
  const activeAxis = ref(null)
  const direction = ref(0)

  let debounceTimer = null

  function processEvent(axis, value) {
    switch (axis) {
      case "focus_ud":
        updateFocusUd(value)
        break
      case "focus_lr":
        updateFocusLr(value)
        break
      default:
        break
    }
  }

  /**
   * Update the up/down (vertical) axis value.
   * @param {number} newValue - New raw value for up/down axis.
   */
  function updateFocusUd(newValue) {
    // Apply EMA smoothing for the up/down axis.
    focusUDValue.value = focusUDValue.value + alpha * (newValue - focusUDValue.value)
  }

  /**
   * Update the left/right (horizontal) axis value.
   * @param {number} newValue - New raw value for left/right axis.
   */
  function updateFocusLr(newValue) {
    // Apply EMA smoothing for the left/right axis.
    focusLRValue.value = focusLRValue.value + alpha * (newValue - focusLRValue.value)
  }

  function quantize(value) {
    const quantized = Math.round(value * 10) / 10
    console.log("quantize", value, quantized)
    return quantized
  }

  /**
   * Evaluates both axes, applies the threshold, and determines which axis is active.
   * Calls the onUpdate callback (if provided) with the latest axis, direction, and the previous direction.
   */
  function evaluateActiveAxis() {
    // Store the old direction before recalculating.
    const oldDirection = direction.value

    let newAxis = activeAxis.value
    let newDirection = direction.value

    // If an axis is already active, check if it still exceeds the threshold.
    if (activeAxis.value === "focus_ud") {
      if (Math.abs(focusUDValue.value) < threshold) {
        newAxis = null
        newDirection = 0
      } else {
        newDirection = quantize(focusUDValue.value)
      }
    } else if (activeAxis.value === "focus_lr") {
      if (Math.abs(focusLRValue.value) < threshold) {
        newAxis = null
        newDirection = 0
      } else {
        newDirection = quantize(focusLRValue.value)
      }
    } else {
      // No axis is active; check if either axis exceeds the threshold.
      const udMag = Math.abs(focusUDValue.value)
      const lrMag = Math.abs(focusLRValue.value)

      if (udMag >= threshold || lrMag >= threshold) {
        // If both exceed the threshold, pick the axis with the larger magnitude.
        if (udMag >= lrMag) {
          newAxis = "focus_ud"
          newDirection = quantize(focusUDValue.value)
        } else {
          newAxis = "focus_lr"
          newDirection = quantize(focusLRValue.value)
        }
      } else {
        newAxis = null
        newDirection = 0
      }
    }

    // Update the reactive values.
    activeAxis.value = newAxis
    direction.value = newDirection

    // Call the onUpdate callback with the current axis, new direction, and old direction.
    if (typeof onUpdate === "function") {
      onUpdate({ axis: newAxis, direction: newDirection, oldDirection })
    }
  }

  /**
   * Update the state based on the axis and value, then schedule the input processing.
   * @param {object} event - Event object with details {name, value} for an axis.
   */
  function handleEvent(event) {
    const { name: axis, value } = event.detail

    processEvent(axis, value)

    if (debounceDelay > 0) {
      if (debounceTimer) clearTimeout(debounceTimer)

      debounceTimer = setTimeout(() => {
        evaluateActiveAxis()
        debounceTimer = null
      }, debounceDelay)
    } else {
      evaluateActiveAxis()
    }
  }

  return {
    focusUDValue,
    focusLRValue,
    activeAxis,
    direction,
    handleEvent,
  }
}
