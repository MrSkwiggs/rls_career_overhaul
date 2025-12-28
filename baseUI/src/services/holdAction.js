import { ref, onUnmounted } from "vue"

export function useHoldAction(actionFn, options = { interval: 150, startOnConditionFn: null, stopOnConditionFn: null, debounceDuration: 300 }) {
  const intervalId = ref(null)
  const latestValue = ref(null)
  const oldValue = ref(null)
  const debounceTimeout = ref(null)

  const startHold = () => {
    if (intervalId.value) return

    intervalId.value = setInterval(() => {
      actionFn(latestValue.value, oldValue.value)
    }, options.interval)
  }

  const stopHold = () => {
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
    latestValue.value = null
    oldValue.value = null
    if (debounceTimeout.value) {
      clearTimeout(debounceTimeout.value)
      debounceTimeout.value = null
    }
  }

  const updateActionValue = value => {
    oldValue.value = latestValue.value
    latestValue.value = value

    if (options.stopOnConditionFn && options.stopOnConditionFn(latestValue.value, oldValue.value)) {
      stopHold()
    } else if (options.startOnConditionFn && options.startOnConditionFn(value)) {
      if (!debounceTimeout.value) {
        debounceTimeout.value = setTimeout(() => {
          startHold()
        }, options.debounceDuration)
      }
    }
  }

  onUnmounted(() => stopHold())

  return { startHold, stopHold, updateActionValue }
}
