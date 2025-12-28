import { defineStore } from "pinia"
import { reactive, ref } from "vue"

const DEFAULT_ACCELERATION_RATE = 0.75
const DEFAULT_ACCELERATION_NATURE = 1.75
const DEFAULT_ACTION_INTERVAL_MS = 150

const FOCUS_LD_TRIGGER_VALUE = -0.5
const FOCUS_RU_TRIGGER_VALUE = 0.5

export const ACTION_PARAMS_TYPE = {
  xyPoints: "xyPoints",
  xPoint: "xPoint",
}

export const useActionHoldService = defineStore("actionHoldService", () => {
  const data = ref({})

  const start = id => {
    const action = data.value[id]
    if (!action) throw new Error(`Error starting hold action ${id}. Id not found.`)
    data.value[id].holdFn = setInterval(createHoldFn(id), data.value[id].actionInterval)
  }

  const reset = id => {
    const action = data.value[id]

    if (!action) return

    if (action.holdFn) clearInterval(action.holdFn)
    data.value[id].holdFn = null
    data.value[id].holdTimeMs = 0
  }

  const add = (
    id,
    actionFn,
    immediateStart = false,
    options = { actionInterval: DEFAULT_ACTION_INTERVAL_MS, accelerationRate: DEFAULT_ACCELERATION_RATE, accelerationNature: DEFAULT_ACCELERATION_NATURE }
  ) => {
    if (data.value[id]) throw new Error(`Error adding hold action for ${id}. Id already exists.`)

    data.value[id] = {
      actionFn,
      ...options,
      holdTimeMs: 0,
      holdFn: null,
    }

    if (immediateStart) start(id)
  }

  const remove = id => {
    if (!data.value[id]) return
    reset(id)
    delete data.value[id]
  }

  // remove all related handlers including scalar handlers
  const removeAll = id => {
    remove(id)
    remove(getFocusScalarName(id))
    remove(getFocusScalarXName(id))
    remove(getFocusScalarYName(id))
  }

  const clear = () => {
    const keys = Object.keys(data.value)
    for (let i = 0; i < keys.length; i++) {
      removeAll(keys[i])
    }
  }

  const addOrUpdate = (
    id,
    actionFn,
    immediateStart = false,
    options = { actionInterval: DEFAULT_ACTION_INTERVAL_MS, accelerationRate: DEFAULT_ACCELERATION_RATE, accelerationNature: DEFAULT_ACCELERATION_NATURE }
  ) => {
    if (data.value[id]) remove(id)
    add(id, actionFn, immediateStart, options)
  }

  const onFocus = (id, actionFn, element, actionParamsType = ACTION_PARAMS_TYPE.xyPoints) => {
    // remove hold scalar
    remove(getFocusScalarXName(id))
    remove(getFocusScalarYName(id))

    if (element.detail.value === 0) {
      remove(id)
      return
    }

    const eventName = element.detail.name
    let xDirection = 0,
      yDirection = 0

    switch (eventName) {
      case "focus_l":
        xDirection = -1
        break
      case "focus_r":
        xDirection = 1
        break
      case "focus_d":
        yDirection = -1
        break
      case "focus_u":
        yDirection = 1
        break
    }

    switch (actionParamsType) {
      case ACTION_PARAMS_TYPE.xyPoints:
        actionFn(xDirection, yDirection)
        addOrUpdate(id, multiplier => actionFn(xDirection * multiplier, yDirection * multiplier), true)
        break
      case ACTION_PARAMS_TYPE.xPoint:
        const xValue = xDirection !== 0 ? xDirection : yDirection
        if (xValue !== 0) {
          actionFn(xValue)
          addOrUpdate(id, multiplier => actionFn(xValue * multiplier), true)
        }
        break
    }
  }

  const inputNavStates = reactive({
    xLatestValue: 0,
    yLatestValue: 0,
    latestEventName: null,
  })

  const onFocusScalar = (id, actionFn, element, actionParamsType = ACTION_PARAMS_TYPE.xyPoints) => {
    console.log("onFocusScalar", { id, name: element.detail.name, value: element.detail.value })
    // remove normal hold
    remove(id)

    const eventName = element.detail.name
    const eventValue = element.detail.value

    if (
      inputNavStates.latestEventName === eventName &&
      (((eventName === "focus_lr" || eventName === "rotate_h_cam") && eventValue === inputNavStates.xLatestValue) ||
        ((eventName === "focus_ud" || eventName === "rotate_v_cam") && eventValue === inputNavStates.yLatestValue))
    )
      return

    let xDirection = 0,
      yDirection = 0

    if (eventName === "focus_lr" || eventName === "rotate_h_cam") {
      if (eventValue > FOCUS_RU_TRIGGER_VALUE && eventValue > inputNavStates.xLatestValue) {
        xDirection = 1
      } else if (eventValue < FOCUS_LD_TRIGGER_VALUE && eventValue < inputNavStates.xLatestValue) {
        xDirection = -1
      }

      if (xDirection !== 0) {
        switch (actionParamsType) {
          case ACTION_PARAMS_TYPE.xyPoints:
            actionFn(xDirection, yDirection)
            addOrUpdate(getFocusScalarXName(id), multiplier => actionFn(xDirection * multiplier, 0), true)
            break
          case ACTION_PARAMS_TYPE.xPoint:
            actionFn(xDirection)
            addOrUpdate(getFocusScalarXName(id), multiplier => actionFn(xDirection * multiplier), true)
            break
        }
        inputNavStates.latestEventName = eventName
      } else {
        remove(getFocusScalarXName(id))
      }

      inputNavStates.xLatestValue = eventValue
      // inputNavStates.latestEventName = eventName
    } else if ((eventName === "focus_ud" || eventName === "rotate_v_cam") && actionParamsType !== ACTION_PARAMS_TYPE.xPoint) {
      if (eventValue > FOCUS_RU_TRIGGER_VALUE && eventValue > inputNavStates.yLatestValue) {
        yDirection = 1
      } else if (eventValue < FOCUS_LD_TRIGGER_VALUE && eventValue < inputNavStates.yLatestValue) {
        yDirection = -1
      }

      if (yDirection !== 0) {
        actionFn(xDirection, yDirection)
        addOrUpdate(getFocusScalarYName(id), multiplier => actionFn(0, yDirection * multiplier), true)
        inputNavStates.latestEventName = eventName
      } else {
        remove(getFocusScalarYName(id))
      }

      inputNavStates.yLatestValue = eventValue
    }
  }

  function createHoldFn(id) {
    const action = data.value[id]
    return () => {
      const multiplier = 1 + action.accelerationRate * (action.holdTimeMs / 1000) ** action.accelerationNature
      action.actionFn(multiplier)
      data.value[id].holdTimeMs = action.holdTimeMs + action.actionInterval
    }
  }

  function getFocusScalarName(id) {
    return `${id}_scalar`
  }

  function getFocusScalarXName(id) {
    return `${getFocusScalarName(id)}_x`
  }

  function getFocusScalarYName(id) {
    return `${getFocusScalarName(id)}_y`
  }

  return {
    onFocus,
    onFocusScalar,
    add,
    addOrUpdate,
    remove,
    removeAll,
    clear,
    start,
    reset,
  }
})
