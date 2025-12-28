// Store/service for Controls data

import { ref, computed } from "vue"
import { defineStore } from "pinia"
import { lua, useBridge } from "@/bridge"
import { $translate } from "@/services"
import { defer } from "@/utils"
import { serializeCheck } from "@/bridge/libs/Lua"
// import { ACTIONS_BY_UI_EVENT } from "@/bridge/libs/UINavEvents"
import { ACTIONS_BY_UI_EVENT } from "@/services/uiNav"
import logger from "@/services/logger"

const STORE_NAME = "controls"
let store

const DEVICE_ICONS = {
  key: "keyboard", // keyboard
  mou: "mouseLMB", // mouse
  vin: "smartphone2", // vinput
  whe: "steeringWheelCommon", // wheel
  gam: "gamepadOld", // gamepad
  xin: "gamepadOld", // xinput
  default: "gamepad", // joystick and others
}

export const CONTROL_LABELS = {
  "escape": "ESC", // ⎋
  "enter": "⏎",
  "tab": "⭾",
  "capslock": "⇪",
  "backspace": "⌫",
  "delete": "Del",
  "insert": "Ins",
  "home": "Home",
  "end": "End",
  "pageup": "PG↑",
  "pagedown": "PG↓",
  "lshift": "L⇧",
  "rshift": "R⇧",
  "shift": "⇧",
  "lcontrol": "L Ctrl",
  "rcontrol": "R Ctrl",
  "lalt": "L Alt",
  "ralt": "R Alt",
  "left": "←",
  "right": "→",
  "up": "↑",
  "down": "↓",
  "space": "␣",
  "grave": "~",
  "backslash": "\\",
  "/": "/",
  "comma": ",",
  "period": ".",
  ";": ";",
  "apostrophe": "'",
  "[": "[",
  "]": "]",
  "minus": "-", // both numpad and regular named "minus"
  "+": "NP+",
  "*": "NP*",
  "numpaddivide": "NP/",
  "numpad0": "NP0",
  "numpad1": "NP1",
  "numpad2": "NP2",
  "numpad3": "NP3",
  "numpad4": "NP4",
  "numpad5": "NP5",
  "numpad6": "NP6",
  "numpad7": "NP7",
  "numpad8": "NP8",
  "numpad9": "NP9",
  "numpaddecimal": "NP.",
  "numpadenter": "NP⏎",
  // device-specific
  "xaxis": "X Axis",
  "yaxis": "Y Axis",
  "zaxis": "Z Axis",
  "rzaxis": "R Z Axis",
  "thumblx": "L Thumb X",
  "thumbly": "L Thumb Y",
  "thumbrx": "R Thumb X",
  "thumbry": "R Thumb Y",
}

const controlLabel = control => control.toLowerCase().split(/[ -]+/).map(
  ctl => CONTROL_LABELS[ctl] || (ctl.startsWith("button") ? "BTN" + ctl.substring(6) : ctl)
).join(" + ")

const CONTROL_ICONS = {
  // family > control > icon
  pc_mouse: {
    button0: "mouseLMB",
    button1: "mouseRMB",
    button2: "mouseMMB",
    xaxis: "mouseXAxis",
    yaxis: "mouseYAxis",
    zaxis: "mouseWheel",
  },
  xbox: {
    btn_a: "xboxA",
    btn_b: "xboxB",
    btn_x: "xboxX",
    btn_y: "xboxY",
    btn_back: "xboxView",
    btn_start: "xboxMenu",
    btn_l: "xboxLB",
    triggerl: "xboxLT",
    btn_r: "xboxRB",
    triggerr: "xboxRT",
    dpov: "xboxDDown",
    lpov: "xboxDLeft",
    rpov: "xboxDRight",
    upov: "xboxDUp",
    thumblx: "xboxXAxis",
    thumbly: "xboxYAxis",
    thumbrx: "xboxXRot",
    thumbry: "xboxYRot",
    btn_lt: "xboxLSButton",
    btn_rt: "xboxRSButton",
  },
  ps: {
    button1: "psCross",
    button3: "psTriangle",
    button0: "psSquare",
    button2: "psCircle",
    button8: "psCreate2",
    button9: "psMenu2",
    button4: "psL1",
    button6: "psL2",
    button5: "psR1",
    button7: "psR2",
    dpov: "psDDown",
    lpov: "psDLeft",
    rpov: "psDRight",
    upov: "psDUp",
    xaxis: "psLSX",
    yaxis: "psLSY",
    zaxis: "psRSX",
    rzaxis: "psRSY",
    rxaxis: "psL2",
    ryaxis: "psR2",
    button10: "psL3Button",
    button11: "psR3Button",
    // button12: "psTrackpadPressLeft", // ?
    button13: "psTrackpadPressCenter", // probably?
    // button14: "psTrackpadPressRight", // ?
    // TODO: add touchpad swipe gestures if possible
  },
}

export const DEVICE_CONTROLS = {
  pc_mouse: Object.keys(CONTROL_ICONS.pc_mouse),
  // pc_keyboard: [],
  xbox: Object.keys(CONTROL_ICONS.xbox),
  ps: Object.keys(CONTROL_ICONS.ps),
}

// duplicate the group with the control labels
const extendControlGroupNames = groups => groups.reduce((res, group) => {
  res.push(group)
  res.push({ ...group, controls: group.controls.map(ctl => CONTROL_LABELS[ctl]) })
  return res
}, [])

const GROUPED_CONTROLS = {
  pc_keyboard: extendControlGroupNames([
    // { icon: "", controls: ["left", "right", "up", "down"] },
    { label: "↑↓←→", controls: ["left", "right", "up", "down"] },
    { label: "NP 8↑ 2↓ 4← 6→", controls: ["numpad2", "numpad4", "numpad6", "numpad8"] },
  ]),
  xbox: extendControlGroupNames([
    { icon: "xboxDDefaultSolid", controls: ["upov", "dpov", "lpov", "rpov"] },
    // { icon: "", controls: ["lpov", "rpov"] },
    // { icon: "", controls: ["upov", "dpov"] },
    { icon: "xboxThumbL", controls: ["thumblx", "thumbly"] },
    { icon: "xboxThumbR", controls: ["thumbrx", "thumbry"] },
  ]),
  ps: extendControlGroupNames([
    { icon: "psDDefaultSolid", controls: ["upov", "dpov", "lpov", "rpov"] },
    // { icon: "", controls: ["lpov", "rpov"] },
    // { icon: "", controls: ["upov", "dpov"] },
    { icon: "psLS", controls: ["xaxis", "yaxis"] },
    { icon: "psRS", controls: ["zaxis", "rzaxis"] },
  ]),
}

const DEVICE_FAMILY = {
  mouse: "pc_mouse",
  keyboard: "pc_keyboard",
  xinput: "xbox",
  ps5: "ps",
}

const CONTROL_ICON_KEYS = Object.keys(DEVICE_FAMILY)

const getViewerOverrides = (devName = undefined, imagePack = undefined) => {
  let family
  if (imagePack) {
    if (imagePack in DEVICE_FAMILY) family = DEVICE_FAMILY[imagePack]
    else if (imagePack in CONTROL_ICONS) family = imagePack
  }
  if (!family && devName) {
    devName = CONTROL_ICON_KEYS.find(key => devName.startsWith(key)) || devName
    if (devName in DEVICE_FAMILY) family = DEVICE_FAMILY[devName]
    else if (devName in CONTROL_ICONS) family = devName
  }
  if (!family) return null
  return {
    family,
    icons: CONTROL_ICONS[family] || {},
    groups: GROUPED_CONTROLS[family] || [],
  }
}

// Device Ordering
const DEVICE_ORDER = ["wheel", "joystick", "xinput", "gamepad", "mouse", "keyboard"]

const makeStore = defineStore(STORE_NAME, () => {
  const { events } = useBridge()

  // this holds the list of all devNames ordered by heuristics
  const devNamesOrder = DEVICE_ORDER.map(devType => devType + "0")

  const actions = ref([])
  const categories = ref({})
  const categoriesList = ref([])
  const bindings = ref([])
  const bindingsPerDevice = computed(() => Object.fromEntries(bindings.value.map(b => [b.devname, b])))
  // const bindingsUniqueDevices = ref({}) // unused
  const bindingTemplate = ref({})
  const controllers = ref({})
  const players = ref({})

  /** last devices (array of last used order) */
  const lastDeviceOrder = ref([...devNamesOrder])
  /** last device (single) */
  const lastDevice = computed(() => isKbm(lastDeviceOrder.value[0]) ? kbmDevNames : lastDeviceOrder.value[0])
  /** last devices (controllers only) */
  const lastControllers = computed(() => lastDeviceOrder.value.filter(devName => !isKbm(devName)))
  /** last devices (controllers only) signature */
  const lastControllersSignature = computed(() => lastControllers.value.sort().join("::"))
  /** if controller is used last */
  const isControllerUsed = computed(() => !isKbm(lastDeviceOrder.value[0]))
  /** if controller is connected */
  const isControllerAvailable = computed(() => lastDeviceOrder.value.some(devName => !isKbm(devName)))
  /** last device if controller, null if keyboard/mouse */
  const lastDeviceSimple = computed(() => isControllerUsed.value ? lastDevice.value : null)

  // get devicetype from device name (remove trailing numbers, xinput4 --> xinput)
  const getDevType = devName => devName ? devName.replace(/\d+$/, "") : ""
  const deviceSorter = (a, b) => DEVICE_ORDER.indexOf(getDevType(a)) - DEVICE_ORDER.indexOf(getDevType(b))

  const kbmDevNames = ["keyboard0", "mouse0"].sort(deviceSorter)
  const kbmShortNames = kbmDevNames.map(devName => devName.slice(0, 3))
  const isKbm = devName => devName && kbmShortNames.includes(devName.slice(0, 3))

  const _receiveControlsData = data => ((controllers.value = data), _updateDeviceNotes()),
    _receivePlayersData = data => (players.value = data),
    _receiveBindingsData = _processBindingsData

  const _getBindingsData = () => lua.extensions.core_input_bindings.notifyUI("Vue controls service needs the data")

  const connect = (state = true) => {
    const method = state ? "on" : "off"
    events[method]("ControllersChanged", _receiveControlsData)
    events[method]("AssignedPlayersChanged", _receivePlayersData)
    events[method]("InputBindingsChanged", _receiveBindingsData)
    events[method]("RecentDevicesChanged", _requestRecentDevices)
  }
  const disconnect = () => connect(false)

  const deviceIcon = deviceName => DEVICE_ICONS[(deviceName || "").slice(0, 3)] || DEVICE_ICONS["default"]

  async function _requestRecentDevices(devNames = undefined) {
    if (!devNames) devNames = await lua.extensions.core_input_bindings.getRecentDevices()
    if (!Array.isArray(devNames) || devNames.length === 0) {
      // default order by heuristics
      devNames = devNamesOrder
    } else if (isKbm(devNames[0])) {
      // move both kbd/mouse first if first device is one of them
      // we're using this instead of sorting because we want to have the original kbd-mouse order
      devNames = [...kbmDevNames, ...devNames.filter(devName => !isKbm(devName))]
    }
    lastDeviceOrder.value.splice(0, lastDeviceOrder.value.length, ...devNames)
  }

  function* getBindingsIter(devFilter = [], useLastDeviceOrder = false) {
    if (!useLastDeviceOrder || devFilter.length > 0) {
      yield* bindings.value
    } else {
      for (const devName of lastDeviceOrder.value) {
        const binding = bindingsPerDevice.value[devName]
        if (binding) yield binding
      }
    }
  }

  const findBindingForAction = (action, devName = undefined, useLastDeviceOrder = false) => {
    const devFilter = !devName ? [] : Array.isArray(devName) ? devName : [devName]
    const bindingsIter = getBindingsIter(devFilter, useLastDeviceOrder)
    for (let binding of bindingsIter) {
      if (devFilter.length > 0 && !devFilter.includes(binding.devname)) continue
      let found = binding.contents.bindings.find(b => b.action === action)
      if (found) {
        // getBindingDetails returns only the first binding for a given action, ordered by the heuristics
        let help = getBindingDetails(binding.devname, found.control, action)
        if (help) {
          help.devName = binding.devname
          help.imagePack = binding.contents.imagePack
          return help
        }
      }
    }
    return undefined
  }

  // note: if devname is not provided, the first binding found will be used as the devname for the returned bindings
  //       use allDevices = true to return bindings for all devices
  const findAllBindingsForAction = (action, devName = undefined, allDevices = false, useLastDeviceOrder = false) => {
    const res = []
    const devFilter = !devName ? [] : Array.isArray(devName) ? devName : [devName]
    const bindingsIter = getBindingsIter(devFilter, useLastDeviceOrder)
    for (let binding of bindingsIter) {
      if (devFilter.length > 0 && !devFilter.includes(binding.devname)) continue
      const matches = binding.contents.bindings.filter(b => b.action === action)
      if (matches.length > 0) {
        for (const match of matches) {
          const help = getBindingDetails(binding.devname, match.control, action)
          if (help) {
            if (!allDevices && devFilter.length === 0) devFilter.push(binding.devname)
            help.devName = binding.devname
            help.imagePack = binding.contents.imagePack
            res.push(help)
          }
        }
        // When allDevices=false and no devFilter, stop after first device with matches
        // if (!allDevices && devFilter.length === 0) break
      }
    }
    return res
  }

  const defaultBindingEntry = (action, control) => ({
    ...bindingTemplate.value,
    action,
    control,
  })

  const isAxis = (device, control) => {
    let c = controllers.value[device].controls[control]
    return c && c.control_type == "axis"
  }

  // A conflicting binding refers to the same control of the same device, and the two actions belong to the same actionMap.
  // returns an array of the conflicting bindings
  const bindingConflicts = (device, control, action) => {
    let dev = bindings.value.find(b => b.devname == device),
      others = dev.contents.bindings.filter(b => b.control == control)

    return others
      .filter(b => b.action != action)
      .map(b => ({
        ...b,
        ...getBindingDetails(device, control, b.action),
        resolved: false,
      }))
  }

  // Captures user input
  const captureBinding = (modifiersAllowed = true) => {
    let controlCaptured = false,
      eventsRegister = {},
      d = defer(),
      capturingBinding = true

    function _listener(data) {
      if (!capturingBinding) return // Not trying to capture bindings, ignore
      if (controlCaptured) return // No business listening to incoming events

      const devName = data.devName
      if (!eventsRegister[devName]) eventsRegister[devName] = { axis: {}, key: [null, null] }
      const eventData = eventsRegister[devName]

      d.notify(eventsRegister)

      let valid = false
      let key0, key1, key0Parts, key1Parts // temp vars
      const genericModifierKeys = ["lalt", "lcontrol", "lshift", "ralt", "rcontrol", "rshift"]

      // Register the received input. The control types are handled
      // separately, because different criteria apply to each one of them
      switch (data.controlType) {
        case "axis":
          if (!eventData.axis[data.control]) {
            eventData.axis[data.control] = { first: data.value, last: data.value, accumulated: 0 }
          } else {
            let detectionThreshold = devName.startsWith("mouse") ? 1 : 0.5
            eventData.axis[data.control].accumulated +=
              Math.abs(eventData.axis[data.control].last - data.value) / detectionThreshold
            eventData.axis[data.control].last = data.value
          }
          // If we are working with axes (i.e. the axis property has been populated) we
          // should be a little strict because there will probably be noise (mouse movements
          // are a perfect example). The criterion is if there is *enough* accumulated motion
          valid = eventData.axis[data.control].accumulated >= 1
          break

        case "button":
        case "pov":
        case "key":
          eventData.key = [eventData.key.at(-1), data.control]

          // Keys are easy too but not as trivial as buttons, because there can be
          // key combinations. We keep track of the last two key events, if they
          // coincide (again an on-off event cycle, like the case with buttons), we
          // can assign the control.
          key0 = eventData.key[0]
          key1 = eventData.key[1]

          // Check for pattern: "controlX, modifierX controlX"
          // if this is the pattern, then we pressed a button that is also a modifier, but it still needs to be bindable normally
          if (key0 && key1) {
            let validSet = false
            key0Parts = key0.split(" ")
            key1Parts = key1.split(" ")

            if (key0Parts.length === 1 && key1Parts.length === 2 && key1Parts[1] === key0Parts[0]) {
              eventData.key[1] = key0
              key1 = key0
              data.control = key0

              // This blocks modifiers that are used by themselves
              if (!modifiersAllowed) {
                valid = false
                validSet = true
              }
            }

            if (!validSet) {
              valid = (key0 === key1)
              if (!modifiersAllowed && (key0Parts.length === 2 || genericModifierKeys.includes(data.control))) {
                // dont allow any modified binding
                valid = false
              }
            }

            // reset the event register when the button is released
            if (data.value === 0) {
              eventData.key = [null, null]
            }
          }

          break
        default:
          console.error("Unrecognised raw input controlType: " + JSON.stringify(data))
      }

      // Want to blacklist something? Put it here!
      if (valid) {
        // No right mouse click
        if (data.devName.startsWith("mouse") && data.control === "button1") valid = false
      }

      if (valid) {
        controlCaptured = true
        capturingBinding = false
        data.direction = data["controlType"] === "axis"
          ? Math.sign(eventData.axis[data.control].last - eventData.axis[data.control].first)
          : 0
        d.resolve(data)
        _captureHelper.stopListening()
      }
    }

    lua.ActionMap.enableBindingCapturing(true) // prevent keypresses from running their bound actions (such as ESC keypress closing the entire menu when you attempt to rebind it)
    lua.setCEFTyping(true)

    _captureHelper.stopListening = () => {
      lua.ActionMap.enableBindingCapturing(false)
      lua.WinInput.setForwardRawEvents(false)
      lua.setCEFTyping(false)
      events.off("RawInputChanged", _listener)
    }

    // Set up the event listener and a function to remove it
    events.on("RawInputChanged", _listener)

    lua.WinInput.setForwardRawEvents(true)

    return d.promise
  }

  const removeBinding = (device, control, action, mockSave) => {
    let deviceContents = { ...bindings.value.find(b => b.devname == device).contents }
    deviceContents.bindings = [...deviceContents.bindings]
    let entryIndex = deviceContents.bindings.findIndex(b => b.control == control && b.action == action) || null
    if (!entryIndex) return
    deviceContents.bindings.splice(entryIndex, 1)
    if (mockSave) {
      let deviceIndex = bindings.value.findIndex(b => b.devname == device)
      bindings.value[deviceIndex].contents = deviceContents
    } else {
      serializeCheck(deviceContents.name) // log potential errors in computers set to non-english language
      lua.extensions.core_input_bindings.saveBindingsToDisk(deviceContents)
    }
  }

  const addBinding = (device, bindingData, replace, mockSave) => {
    let deviceContents = { ...bindings.value.find(b => b.devname == device).contents }
    deviceContents.bindings = [...deviceContents.bindings]
    if (replace) {
      let deprecatedIndex = deviceContents.bindings.findIndex(b => b.control == bindingData.details.control && b.action == bindingData.details.action)
      deviceContents[deprecatedIndex] = bindingData
    } else {
      serializeCheck(deviceContents.name) // log potential errors in computers set to non-english language
      lua.extensions.core_input_bindings.saveBindingsToDisk(deviceContents)
    }
  }

  const isFFBBound = () => {
    for (let i = 0; i < bindings.value.length; i++) {
      let b = bindings.value[i]
      if (isKbm(b.devname)) continue
      let bs = b.contents.bindings
      for (let j = 0; j < bs.length; j++) {
        if (bs[j].action === "steering") return true
      }
    }
    return false
  }

  const isFFBCapable = (asRef = false) => {
    const ffbCapable = () => Object.values(controllers.value).some(controller => controller.ffbAxes && Object.keys(controller.ffbAxes).length > 0)
    if (asRef) return computed(() => ffbCapable())
    return ffbCapable
  }

  const getIsControllerAvailable = (asRef = false) => asRef ? isControllerAvailable : isControllerAvailable.value
  const getIsControllerUsed = (asRef = false) => asRef ? isControllerUsed : isControllerUsed.value

  const isWheelFound = vendorId => {
    for (let b of bindings.value) {
      if (b.devname.slice(0, 3) === "whe") {
        let vid = b.contents.vidpid.slice(4, 8)
        if (vid == vendorId) return true
      }
    }
    return false
  }

  function isFFBEnabled(asRef = false) {
    const filter = () =>
      bindings.value
        .filter(b => b.devname.slice(0, 3) !== "xin") // skip xinput vibration gamepads
        .some(b => b.contents.bindings.some(binding => binding.action === "steering" && binding.isForceEnabled))

    if (asRef) return computed(() => filter())
    return filter()
  }

  function isPidVidFound(desiredVid, desiredPid, asRef = false) {
    const filter = () =>
      bindings.value.some(b => {
        const vid = desiredVid === undefined ? desiredVid : b.contents.vidpid.slice(4, 8)
        const pid = desiredPid === undefined ? desiredPid : b.contents.vidpid.slice(0, 4)
        return vid == desiredVid && pid == desiredPid
      })

    if (asRef) return computed(() => filter())
    return filter()
  }

  function getBindingDetails(device, control, action) {
    const actionDetails = getActionDetails(action)

    if (!actionDetails) {
      console.warn("Action details not found: ", action)
      return
    }

    const deviceBindings = bindings.value.find(b => b.devname === device).contents.bindings
    const common = {
      icon: deviceIcon(device),
      title: actionDetails.title,
      desc: actionDetails.desc,
    }
    const details = deviceBindings.find(b => b.control === control && b.action === action) || defaultBindingEntry(action, control)
    const isBindingAxis = isAxis(device, control)

    return {
      ...bindingTemplate.value,
      ...details,
      ...common,
      isAxis: isBindingAxis,
      action: actionDetails.action,
      actionName: actionDetails.actionName,
    }
  }

  function getActionDetails(action) {
    const actionDetails = actions.value[action]
    if (!actionDetails) return

    return {
      ...actionDetails,
      action: actionDetails.actionName,
    }
  }

  /**
   * Adds a new binding to the bindings array
   * @param {Object} bindingData - The binding data to add
   * @param {string} bindingData.devname - The name of the device
   * @param {string} bindingData.control - The control to bind
   * @param {string} bindingData.action - The action to bind
   * @returns
   */
  function addNewBinding(bindingData) {
    const { devname, control, action } = bindingData
    const device = bindings.value.find(b => b.devname == devname)

    if (!device) {
      console.warn("Device not found: ", devname)
      return
    }

    const deviceContents = device.contents

    deviceContents.bindings.push({
      ...bindingTemplate.value,
      ...bindingData,
      control,
      action,
    })

    serializeCheck(deviceContents.name) // log potential errors in computers set to non-english language
    lua.extensions.core_input_bindings.saveBindingsToDisk(deviceContents)
  }

  /**
   * Updates a binding to a new control
   * @param {string} devname - The name of the device
   * @param {string} action - The action to update
   * @param {string} control - The control to update
   * @param {string} newControl - The new control to update to
   * @param {Object} extras - Additional properties to update on the binding
   * @param {Object} extras.linearity - The linearity of the binding
   * @param {number} extras.deadzoneResting - The resting deadzone of the binding
   * @param {number} extras.deadzoneEnd - The ending deadzone of the binding
   * @param {boolean} extras.inverted - Whether the binding is inverted
   */
  function updateBinding(bindingData) {
    const { devname, control, action } = bindingData
    const oldDevname = bindingData.oldDevname || devname
    const oldControl = bindingData.oldControl || control

    const device = bindings.value.find(b => b.devname == oldDevname)
    if (!device) {
      console.warn("Device not found: ", oldDevname)
      return
    }

    const deviceContents = device.contents
    const deprecatedIndex = deviceContents.bindings.findIndex(b => b.control == oldControl && b.action == action)
    if (deprecatedIndex === -1) {
      console.warn("Binding not found: ", oldDevname, oldControl, action)
      return
    }

    if (devname === oldDevname) {
      // delete oldDevname and oldControl from bindingData
      delete bindingData.oldDevname
      delete bindingData.oldControl

      // update the binding to the new control
      deviceContents.bindings[deprecatedIndex] = { ...bindingData }
    } else {
      // remove the binding from the old device
      deviceContents.bindings.splice(deprecatedIndex, 1)
      // add the binding to the new device
      const newDevice = bindings.value.find(b => b.devname === devname)
      const newDeviceContents = newDevice.contents

      newDeviceContents.bindings.push({
        ...bindingData,
        bindingTemplate: bindingTemplate.value,
      })

      serializeCheck(newDeviceContents.name) // log potential errors in computers set to non-english language
      lua.extensions.core_input_bindings.saveBindingsToDisk(newDeviceContents)
    }

    serializeCheck(deviceContents.name) // log potential errors in computers set to non-english language
    lua.extensions.core_input_bindings.saveBindingsToDisk(deviceContents)
  }

  /**
   * Deletes multiple bindings and lessens call to saveBindingsToDisk by only saving once for each device
   * @param {Object[]} controls - The bindings to delete
   * @param {string} controls.devname - The devname of the binding
   * @param {string} controls.control - The control of the binding
   * @param {string} controls.action - The action of the binding
   */
  function deleteBindings(bindingsData) {
    // group bindings by devname
    const bindingsByDevname = bindingsData.reduce((acc, b) => {
      acc[b.devname] = acc[b.devname] || []
      acc[b.devname].push(b)
      return acc
    }, {})

    // loop through each devname and delete the bindings
    for (const devname in bindingsByDevname) {
      const device = bindings.value.find(b => b.devname == devname)
      if (!device) {
        console.warn("Device not found: ", devname)
        continue
      }

      const deviceContents = device.contents
      bindingsByDevname[devname].forEach(b => {
        const index = deviceContents.bindings.findIndex(binding => binding.control == b.control && binding.action == b.action)
        if (index !== -1) {
          deviceContents.bindings.splice(index, 1)
        }
      })

      serializeCheck(deviceContents.name) // log potential errors in computers set to non-english language
      lua.extensions.core_input_bindings.saveBindingsToDisk(deviceContents)
    }
  }

  function deleteBinding({ devname, control, action }) {
    const device = bindings.value.find(b => b.devname == devname)

    if (!device) {
      console.warn("Device not found: ", devname)
      return
    }

    const deviceContents = device.contents
    const index = deviceContents.bindings.findIndex(b => b.control == control && b.action == action)

    if (index === -1) {
      console.warn("Binding not found: Skipping...", devname, control, action)
      return
    }

    deviceContents.bindings.splice(index, 1)
    serializeCheck(deviceContents.name) // log potential errors in computers set to non-english language
    lua.extensions.core_input_bindings.saveBindingsToDisk(deviceContents)
  }

  function getAllBindingsForAction(action, devName, asRef = false) {
    const filteredBindings = () =>
      bindings.value
        .filter(b => (!devName || b.devname == devName) && b.contents.bindings.find(a => a.action === action))
        .flatMap(b =>
          b.contents.bindings
            .filter(x => x.action === action)
            .map(x => ({
              ...x,
              ...getBindingDetails(b.devname, x.control, x.action),
              devname: b.devname,
              action: action,
              actionName: action,
            }))
        )

    if (asRef) return computed(() => filteredBindings())
    else return filteredBindings()
  }

  const _captureHelper = { devName: null, stopListening: null }

  function _updateDeviceNotes() {
    ////// ** TODO ** Check the above is doing same as this original
    Object.values(bindings.value).forEach(({ contents: bindingContents }) => {
      for (let id in controllers.value) {
        let controller = controllers.value[id]
        if (bindingContents.vidpid == controller.vidpid) {
          controller.notes = bindingContents.notes
          break
        }
      }
    })
  }

  let lastBindingsData = null

  function _processBindingsData(data) {
    const newBindingsData = JSON.stringify(data)
    if (lastBindingsData === newBindingsData) return
    lastBindingsData = newBindingsData

    if (!Array.isArray(data.bindings)) data.bindings = []

    // sometimes bindings[deviceIndex].contents.bindings is an object instead of an array!
    // should be fixed, but let's cover this up until then.
    // NOTE: This is really REALLY bad. [citation needed]
    data.bindings.forEach(device => {
      if (!Array.isArray(device.contents.bindings)) {
        device.contents.bindings = Object.values(device.contents.bindings)
      }
    })

    bindingTemplate.value = data.bindingTemplate
    bindings.value = data.bindings

    if (!data.actionCategories || !data.bindingTemplate || data.bindings.length === 0) {
      logger.debug("Did not receive bindings data. Timing issue?")
      return
    }

    /// NOTE: commented out because this was unused across the code
    // remove bindings from same-type devices. this avoids displaying an XBOX gamepad binding 4 times when you connect 4 gamepads
    // const uniqueDevices = {}
    // data.bindings.forEach(binding => {
    //   const devType = binding.contents.devicetype
    //   const type = isKbm(devType) ? devType : binding.contents.vidpid.toLowerCase()
    //   uniqueDevices[type] = binding
    // })
    // bindingsUniqueDevices.value = uniqueDevices

    // order the devices, so we display e.g. gamepad bindings rather than keyboard bindings, if both kinds of devices are plugged
    bindings.value.sort((a, b) => deviceSorter(a.devname, b.devname))

    devNamesOrder.splice(0) // clear devnames order
    kbmDevNames.splice(0) // clear kbm devnames
    for (const binding of data.bindings) {
      const devName = binding.devname
      // gather actual devnames order
      if (!devNamesOrder.includes(devName)) devNamesOrder.push(devName)
      // gather kbm devnames (in order)
      if (isKbm(devName)) kbmDevNames.push(devName)
      // set device icon
      binding.icon = deviceIcon(devName)
    }

    // set recent devices order
    // lastDeviceOrder.value.splice(0, lastDeviceOrder.value.length, ...devNamesOrder)
    _requestRecentDevices()

    // Normally, the key in data actions is the action name. However, in vehicle specific
    // bindings, the key is of the form {vehicle}__actionName, so get the actionName field
    // from the object to be sure.
    const acts = {}
    for (let act in data.actions) acts[act] = { actionName: act, ...data.actions[act] }
    actions.value = acts

    // This doesn't do anything? no uniquedevices come from Lua?
    // data.bindingsUniqueDevices.forEach((binding, i) => bindingsUniqueDevices.value[i].icon = deviceIcon(binding.devname))

    // Refactor categories and actions
    categories.value = data.actionCategories
    for (let cat in categories.value) {
      if (typeof categories.value[cat] === "object") categories.value[cat].actions = []
    }
    for (let act in actions.value) {
      let obj = { key: act, ...actions.value[act] }
      if (!(actions.value[act].cat in categories.value)) {
        categories.value[actions.value[act].cat] = {
          order: 99,
          icon: "symbol_exclamation",
          title: "UNDEFINED CATEGORY: " + actions.value[act].cat,
          desc: "",
          actions: [],
        }
      }
      categories.value[actions.value[act].cat].actions.push(obj)
    }

    categoriesList.value = []
    Object.entries(categories.value).forEach(([catName, cat]) =>
      categoriesList.value.push({
        key: catName,
        ...cat,
      })
    )

    // Translations
    for (let x in categoriesList.value) {
      for (let y in categoriesList.value[x].actions) {
        categoriesList.value[x].actions[y].titleTranslated = $translate.instant(categoriesList.value[x].actions[y].title)
        categoriesList.value[x].actions[y].descTranslated = $translate.instant(categoriesList.value[x].actions[y].desc)
        for (let z in categoriesList.value[x].actions[y].tags) {
          if (!categoriesList.value[x].actions[y].tagsTranslated) {
            categoriesList.value[x].actions[y].tagsTranslated = []
          }
          categoriesList.value[x].actions[y].tagsTranslated[z] = $translate.instant(categoriesList.value[x].actions[y].tags[z])
        }
      }
    }

    _updateDeviceNotes()
  }

  /**
   * Makes a viewer object for a given action
   * @param {Object} props - The properties to make a viewer object for
   * @param {string} props.deviceKey - By device key
   * @param {string} props.device - By device name (or array of device names)
   * @param {string} props.action - By action name
   * @param {string} props.uiEvent - By UI event
   * @param {string} props.imagePack - Predefine image pack (for raw actions)
   * @param {boolean} props.controller - Use controller-only bindings, excluding keyboard/mouse (if no `device` is provided)
   * @param {boolean} props.actionVariants - Gather action variants (axis inversion will be sorted for buttons)
   * @param {boolean} props.useLastDevice - Use last device order to find bindings
   * @returns {Object} Viewer object
   */
  function makeViewerObj({ deviceKey, device, action, uiEvent, imagePack, controller = false, actionVariants = false, useLastDevice = false }) {
    let viewerObj, multiDevice = false
    if (device && Array.isArray(device) && device.length === 0) device = undefined
    if (Array.isArray(device)) {
      if (device.length === 0) device = undefined
      else if (device.length === 1) device = device[0]
      else multiDevice = true
    }
    if (!device && controller) {
      device = lastControllers.value
      if (device.length === 0) device = undefined
      else if (device.length === 1) device = device[0]
      else multiDevice = true
    }
    if (uiEvent) action = ACTIONS_BY_UI_EVENT[uiEvent]
    if (action) {
      if (actionVariants) {
        viewerObj = _buildViewerObjVariants(findAllBindingsForAction(action, device, false, useLastDevice))
        actionVariants = !!viewerObj?.variants
        if (actionVariants) {
          viewerObj.variants.sort((a, b) => a.isInverted - b.isInverted)
        }
      } else {
        viewerObj = findBindingForAction(action, device, useLastDevice)
      }
    } else {
      actionVariants = false
    }
    if (deviceKey) {
      const devName = viewerObj?.devName || (multiDevice ? device[0] : device)
      viewerObj = {
        icon: deviceIcon(devName),
        control: deviceKey,
        devName: devName,
        imagePack: viewerObj?.imagePack || imagePack,
      }
    }
    if (viewerObj) {
      _parseViewerObj(viewerObj, imagePack, actionVariants)
      if (viewerObj.variants) {
        viewerObj.variants.forEach(obj => _parseViewerObj(obj, imagePack, actionVariants, device))
      }
    }
    return viewerObj
  }

  function _buildViewerObjVariants(viewerObjs) {
    const len = viewerObjs?.length || 0
    if (len === 0) return undefined
    if (len === 1) return viewerObjs[0]
    return { ...viewerObjs[0], variants: viewerObjs }
  }

  const rgxCombo = /modifier(?<mod>\d+)[ -]+|[ -]*(?<key>.+)/gi

  function _parseViewerObj(viewerObj, imagePack = undefined, actionVariants = false, devNames = undefined) {
    const devName = viewerObj.devName
    imagePack = viewerObj.imagePack || imagePack
    if (!imagePack) {
      // derive imagePack from the existing bindings
      const binding = bindings.value?.find(b => b.devname === devName)
      if (binding?.contents?.imagePack) imagePack = binding.contents.imagePack
      if (!imagePack && devName) imagePack = CONTROL_ICON_KEYS.find(key => devName.startsWith(key))
      viewerObj.imagePack = imagePack
    }
    // handle combo keys
    if (viewerObj.control.startsWith("modifier")) {
      // this results in an array like [{ mod: "1" }, { key: "a" }, ...]
      const matches = [...viewerObj.control.matchAll(rgxCombo)].map(m => m.groups)
      if (matches.length > 0) {
        viewerObj.multiControls = []
        for (const match of matches) {
          if (match.mod) {
            const modName = "customModifier" + match.mod
            // try same device
            let mod = actionVariants
              ? _buildViewerObjVariants(findAllBindingsForAction(modName, devName, false, false))
              : findBindingForAction(modName, devName)
            if (!mod) {
              // try all devices
              // note: it's not very friendly with actionVariants.
              //       to make it work, we need to gather devices list for all then rerun the makeViewerObj with updated list.
              //       so I suggest not to use actionVariants at all for now.
              mod = actionVariants
                ? _buildViewerObjVariants(findAllBindingsForAction(modName, devNames, false, false))
                : findBindingForAction(modName, devNames)
            }
            if (mod) viewerObj.multiControls.push(mod)
          } else {
            viewerObj.multiControls.push({
              devName,
              control: match.key,
              icon: viewerObj.icon,
              imagePack,
            })
          }
        }
      }
    }
    // add icons and groups
    _addCustomInfo(viewerObj)
    if (viewerObj.multiControls) {
      viewerObj.multiControls.forEach(_addCustomInfo)
    }
  }

  function _addCustomInfo(viewerObj) {
    const devOverrides = getViewerOverrides(viewerObj.devName, viewerObj.imagePack)
    viewerObj.family = devOverrides?.family
    const ownIcon = devOverrides?.icons[viewerObj.control]
    viewerObj.special = !!ownIcon
    viewerObj.ownGroups = devOverrides?.groups
    if (viewerObj.special) {
      viewerObj.ownIcon = ownIcon
    } else {
      viewerObj.control = controlLabel(viewerObj.control)
    }
  }

  // Setup
  connect()
  _getBindingsData()

  const computedProps = {
    categories: computed(() => categories.value),
    categoriesList: computed(() => categoriesList.value),
    controllers: computed(() => controllers.value),
    players: computed(() => players.value),
    bindingTemplate: computed(() => bindingTemplate.value),
    lastDevice: lastDeviceSimple,
    lastDevices: lastDeviceOrder,
    lastControllers: lastControllers,
    lastControllersSignature: lastControllersSignature, // temp thing for performance
    isControllerAvailable: isControllerAvailable,
    isControllerUsed: isControllerUsed,
    /** use this for a consistent way to show/hide elements based on controller availability */
    showIfController: isControllerUsed,
    /** use this for a consistent way to show/hide focus frame based on controller availability */
    focusIfController: isControllerAvailable,
  }

  return {
    ...computedProps,
    // methods
    addNewBinding,
    connect,
    deleteBinding,
    deleteBindings,
    disconnect,
    deviceIcon,
    findBindingForAction,
    findAllBindingsForAction,
    getActionDetails,
    getBindingDetails,
    getAllBindingsForAction,
    defaultBindingEntry,
    isAxis,
    bindingConflicts,
    captureBinding,
    removeBinding,
    addBinding,
    isFFBBound,
    isFFBEnabled,
    isFFBCapable,
    isGamepadAvailable: getIsControllerAvailable, // for compatibility; replaced with isControllerAvailable
    isWheelFound,
    isPidVidFound,
    makeViewerObj,
    updateBinding,
  }
})

// ** TODO ** - possible optimisation later - connect and disconnect on demand based on number of clients (see composables example - mounted, unmounted)?
const useStore = () => store || (store = makeStore())
export default useStore
