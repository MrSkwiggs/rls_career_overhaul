import { ref, reactive, computed, onUnmounted } from "vue"
import { defineStore } from "pinia"
import { useBridge } from "@/bridge"
// import { ACTIONS_BY_UI_EVENT, UI_EVENTS, eventFirer } from "@/bridge/libs/UINavEvents"
import { ACTIONS_BY_UI_EVENT, UI_EVENTS, getUINavServiceInstance, eventFirer } from "@/services/uiNav"
import { MONITORED_UI_NAV_EVENTS } from "@/services/crossfire"
// import useControls from "@/services/controls"
import Logger from "@/services/logger"
import { uniqueId } from "@/services/uniqueId"

// default navigation for crossfire and angular
const DEFAULT_NAVIGATION = [
  // crossfire
  ...MONITORED_UI_NAV_EVENTS,
  // angular
  "back",
]

// make those events always active by default
const ALWAYS_ACTIVE = ["ok", "menu", "back"]

const BLOCKER = Symbol("uiNavBlocker")

export const useUINavTracker = defineStore("uiNavTracker", () => {
  const { lua, events } = useBridge()

  const DEBUG = false
  const showErrors = window.beamng && !window.beamng.shipping

  let initialised = false
  const trackedEvents = ref([])
  const trackedInstances = {}
  const ignoredEvents = ref([])
  const ignoredInstances = {}
  const blockedEvents = ref([])
  const blockedInstances = {}
  const unblockedEvents = ref([])
  const unblockedInstances = {}
  const activeEvents = ref([])
  const labelRegistry = useUiNavLabel()

  // TODO: create exclusive context for scopes

  function updateBlocklist() {
    const uiNavService = getUINavServiceInstance()
    const eventsToBlock = blockedEvents.value.filter(name => !unblockedEvents.value.includes(name))
    uiNavService.setBlockedEvents(eventsToBlock)
    // UINAV_BLOCKLIST.splice(0, UINAV_BLOCKLIST.length, ...blockedEvents.value.filter(name => !unblockedEvents.value.includes(name)))
  }

  // trigger reactive update
  let raf
  function update(eventName) {
    // const idx = trackedEvents.value.findIndex(e => e.name === eventName)
    // if (idx > -1) {
    //   trackedEvents.value[idx] = { ...trackedEvents.value[idx] }
    // }
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      activeEvents.value = trackedEvents.value
        .filter(e => !ignoredEvents.value.includes(e.name)
          && (unblockedEvents.value.includes(e.name) || !blockedEvents.value.includes(e.name)))
        .map(e => ({
          ...e,
          nogroup: !!trackedInstances[e.name]?.at(-1)?.nogroup,
        }))
    })
  }

  const ownerIdCheck = ownerId => {
    if (typeof ownerId !== "string" || !ownerId) {
      throw new Error("ownerId is required and must be a string")
    }
  }
  // TODO: upgrade to error
  const eventNameCheck = (eventName, quiet = false) => {
    let ok = true
    if (typeof eventName !== "string" || !eventName) {
      showErrors && Logger.error("eventName is required")
      ok = false
    } else if (!(eventName in ACTIONS_BY_UI_EVENT)) {
      showErrors && !quiet && Logger.error(`eventName ${eventName} does not exist`)
      ok = false
    }
    return ok
  }

  const getRecentInstance = eventName => trackedInstances[eventName].findLast(inst => inst.element !== BLOCKER)
  const parseActive = (active, eventName) => typeof active === "boolean" ? active : ALWAYS_ACTIVE.includes(eventName)

  function addEvent(eventName, ownerId, element = null, options = {}) {
    // it is here because on first UI open MenuActionMapEnabled happens after addEvent calls
    // this is normal behaviour but we need to address this, so here it is
    if (!initialised) rebind()

    if (!eventNameCheck(eventName)) return

    ownerIdCheck(ownerId)

    if (!trackedInstances[eventName]) trackedInstances[eventName] = []
    if (!element) element = window.document.body
    // if (instances[eventName].includes(element)) return // might be useful to ignore .up/.down modifier bindings
    const instance = trackedInstances[eventName].find(instance => instance.ownerId === ownerId)
    if (instance) {
      // DEBUG && Logger.log("already exists", eventName, ownerId, element)
      // here we're still updating the element despite not being called from updateEvent
      instance.element = element
      instance.nogroup = !!options?.nogroup
      instance.active = parseActive(options?.active, eventName)
      update(eventName)
      return
    }
    trackedInstances[eventName].push({
      ownerId,
      element,
      nogroup: !!options?.nogroup,
      active: parseActive(options?.active, eventName),
    })
    DEBUG && Logger.log("added event", eventName, trackedInstances[eventName].length, element)
    if (trackedInstances[eventName].length === 1) {
      const event = {
        name: eventName,
        label: computed(() => {
          const instance = getRecentInstance(eventName)
          return labelRegistry.getLabel(eventName, instance?.element) || null
        }),
        action: computed(() => {
          const instance = getRecentInstance(eventName)
          // note: don't forget that eventFirer returns a function that expects either a PointerEvent or a value
          return instance?.active ? eventFirer(eventName) : null
        }),
      }
      trackedEvents.value.push(event)
      actionSwitch(true, eventName)
      DEBUG && Logger.log("ACTIVATED event", eventName)
    }
    update(eventName)
  }

  // this supposed to be called for focusRequired only
  function updateEvent(eventName, ownerId, element, options = {}) {
    ownerIdCheck(ownerId)
    if (!eventNameCheck(eventName)) return
    if (!element) element = window.document.body
    const instance = trackedInstances[eventName]?.find(instance => instance.ownerId === ownerId)
    if (!instance) {
      addEvent(eventName, ownerId, element, false, options)
      return
    }
    instance.element = element
    instance.nogroup = !!options?.nogroup
    instance.active = parseActive(options?.active, eventName)

    update(eventName)
  }

  function removeEvent(eventName, ownerId, element = null) {
    ownerIdCheck(ownerId)
    if (!eventNameCheck(eventName)) return
    if (!trackedInstances[eventName]) return
    if (!element) element = window.document.body

    // only remove the specific element's instance
    const idx = trackedInstances[eventName].findIndex(instance => instance.ownerId === ownerId)
    if (idx === -1) return

    trackedInstances[eventName].splice(idx, 1)
    DEBUG && Logger.log("removed event", eventName, trackedInstances[eventName].length, element)
    update(eventName)

    if (trackedInstances[eventName].length === 0) {
      delete trackedInstances[eventName]
      const idx = trackedEvents.value.findIndex(h => h.name === eventName)
      if (idx > -1) {
        trackedEvents.value.splice(idx, 1)
        actionSwitch(false, eventName)
        DEBUG && Logger.log("DEACTIVATED event", eventName)
      }
    }
  }

  function addHelper(eventList, instanceList, eventName, ownerId, func, quiet = false) {
    ownerIdCheck(ownerId)
    if (!eventNameCheck(eventName, quiet)) return
    if (!eventList.value.includes(eventName)) {
      eventList.value.push(eventName)
      func && func()
      if (!instanceList[eventName]) instanceList[eventName] = []
    }
    instanceList[eventName].push(ownerId)
  }

  function removeHelper(eventList, instanceList, eventName, ownerId, func, quiet = false) {
    ownerIdCheck(ownerId)
    if (!eventNameCheck(eventName, quiet)) return
    if (!(eventName in instanceList)) return
    const instIdx = instanceList[eventName].indexOf(ownerId)
    if (instIdx === -1) return

    instanceList[eventName].splice(instIdx, 1)

    if (instanceList[eventName].length === 0) {
      const idx = eventList.value.indexOf(eventName)
      if (idx > -1) {
        eventList.value.splice(idx, 1)
        func && func()
      }
    }
  }

  function addIgnore(eventName, ownerId) {
    addHelper(ignoredEvents, ignoredInstances, eventName, ownerId,
      DEBUG ? () => Logger.log("added ignore", eventName) : null,
      true
    )
  }

  function removeIgnore(eventName, ownerId) {
    removeHelper(ignoredEvents, ignoredInstances, eventName, ownerId,
      DEBUG ? () => Logger.log("removed ignore", eventName) : null,
      true
    )
  }

  function addBlocker(eventName, ownerId) {
    addHelper(blockedEvents, blockedInstances, eventName, ownerId, () => {
      addEvent(eventName, ownerId, BLOCKER)
      updateBlocklist() // must go after addEvent
      DEBUG && Logger.log("added blocker", eventName)
    })
  }

  function removeBlocker(eventName, ownerId) {
    removeHelper(blockedEvents, blockedInstances, eventName, ownerId, () => {
      removeEvent(eventName, ownerId, BLOCKER)
      updateBlocklist()
      DEBUG && Logger.log("removed blocker", eventName)
    })
  }

  function addForceUnblock(eventName, ownerId) {
    addHelper(unblockedEvents, unblockedInstances, eventName, ownerId, () => {
      update(eventName)
      updateBlocklist()
      DEBUG && Logger.log("added unblocker", eventName)
    })
  }

  function removeForceUnblock(eventName, ownerId) {
    removeHelper(unblockedEvents, unblockedInstances, eventName, ownerId, () => {
      update(eventName)
      updateBlocklist()
      DEBUG && Logger.log("removed unblocker", eventName)
    })
  }

  const actionSwitch = async (enabled, eventName) => {
    // FIXME: "menu" exception is a special case because "toggleMenues" does not exist in core_input_actions.menuActionMapNames for some reason
    if (eventName === "menu") return
    // prevent action disable if the event is blocked
    if (!enabled && blockedEvents.value.includes(eventName)) return
    // apply
    await lua.extensions.core_input_bindings.setMenuActionEnabled(enabled, ACTIONS_BY_UI_EVENT[eventName])
  }

  function rebind() {
    if (!initialised) {
      initialised = true
      // UINAV_BLOCKLIST.splice(0) // just in case
      const uiNavService = getUINavServiceInstance()
      uiNavService.clearBlockedEvents()
      //window.BNG_Logger && window.BNG_Logger.debug(`UINavTracker is binding ${DEFAULT_NAVIGATION.length} default events for Crossfire and Angular`)
      DEFAULT_NAVIGATION.forEach(name => addEvent(name, "__uiNavTracker_default"))
    }
    // force unbind all untracked events // FIXME: this thing should be in lua
    const otherEvents = Object.keys(ACTIONS_BY_UI_EVENT).filter(name => !DEFAULT_NAVIGATION.includes(name) && !trackedEvents.value.find(e => e.name === name))
    //window.BNG_Logger && window.BNG_Logger.debug(`UINavTracker is making sure that ${otherEvents.length} unused events are disabled`)
    otherEvents.forEach(name => actionSwitch(false, name))
  }
  lua.extensions.core_input_bindings.getMenuActionMapEnabled().then(enabled => enabled && rebind())
  events.on("MenuActionMapEnabled", enabled => enabled && rebind())

  return {
    /** All active events. */
    activeEvents,
    /** All blocked events. */
    blockedEvents,
    /** All unblocked events. */
    unblockedEvents,
    /** Adds an event to the tracker. */
    addEvent,
    /** Updates an event in the tracker. */
    updateEvent,
    /** Removes an event from the tracker. */
    removeEvent,
    /** Do not use as is! It is made for BngBinding. */
    addIgnore,
    /** Do not use as is! It is made for BngBinding. */
    removeIgnore,
    /** Do not use as is! Use useUINavBlocker composable instead. */
    addBlocker,
    /** Do not use as is! Use useUINavBlocker composable instead. */
    removeBlocker,
    /** Prevents the event from being blocked. */
    addForceUnblock,
    /** Removes the event from being unblocked. */
    removeForceUnblock,
  }
})

export function useUINavBlocker() {
  const id = uniqueId("uiNavBlocker")
  const tracker = useUINavTracker()
  // const Controls = useControls()
  const allEventNames = Object.keys(ACTIONS_BY_UI_EVENT)
  const defaultEvents = Object.freeze(Object.fromEntries(DEFAULT_NAVIGATION.map(name => [name, name])))
  const allEvents = Object.freeze(UI_EVENTS)
  const blockedEvents = []
  const unblockedEvents = []

  const filterEvents = events => {
    if (!events) return []
    if (typeof events === "string") events = [events]
    else if (events.length === 0) return []
    return events.reduce((res, name) => allEventNames.includes(name) && !res.includes(name) ? [...res, name] : res, [])
  }

  function allowOnly(events = []) {
    events = filterEvents(events)
    // if (events.length === 0) Logger.warn("Empty events list provided, will block all events.")
    blockOnly(allEventNames.filter(name => !events.includes(name)))
  }

  function allowNavigationOnly(enforce = true) {
    if (!enforce) return blockOnly()
    const events = [...DEFAULT_NAVIGATION, "menu"]
    // if (!Controls.isControllerAvailable) events.push("menu")
    blockOnly(allEventNames.filter(name => !events.includes(name)))
  }

  function blockOnly(events = []) {
    events = filterEvents(events)
    blockedEvents.filter(name => !events.includes(name)).forEach(name => tracker.removeBlocker(name, id))
    blockedEvents.splice(0)
    blockedEvents.push(...events)
    blockedEvents.forEach(name => tracker.addBlocker(name, id))
  }

  function ensureNoBlock(events = []) {
    events = filterEvents(events)
    unblockedEvents.filter(name => !events.includes(name)).forEach(name => tracker.removeForceUnblock(name, id))
    unblockedEvents.splice(0)
    unblockedEvents.push(...events)
    events.forEach(name => tracker.addForceUnblock(name, id))
  }

  function isBlocked(eventName) {
    if (tracker.unblockedEvents.includes(eventName)) return false
    return tracker.blockedEvents.includes(eventName)
  }

  const clear = () => blockOnly()

  onUnmounted(clear)

  return {
    allEvents,
    /** Navigation events that are bound by default. */
    defaultEvents,
    /** Allows only listed events. Will override blockOnly. */
    allowOnly,
    /** Allows only default navigation events. Will override blockOnly. Use boolean argument to enable or disable. Default: true. */
    allowNavigationOnly,
    /** Block only listed events. Will override allowOnly. */
    blockOnly,
    /** Clears all the blocks on this instance. Usually you don't need to call this, because blocks are cleared on unmount. */
    clear,
    /** Prevent blocking listed events. Overrides all blocks. */
    ensureNoBlock,
    /** Returns true if the event is blocked. Not limited to this instance. */
    isBlocked,
  }
}

export const useUiNavLabel = defineStore("uiNavLabeler", () => {
  const elementLabels = reactive(new WeakMap())
  const eventElements = reactive({})

  function registerLabel(element, eventNames, label) {
    if (!elementLabels.has(element)) {
      elementLabels.set(element, {})
    }
    const elementEvents = elementLabels.get(element)
    if (!Array.isArray(eventNames)) eventNames = [eventNames]
    for (const eventName of eventNames) {
      elementEvents[eventName] = label
      if (!eventElements[eventName]) {
        eventElements[eventName] = new Set()
      }
      eventElements[eventName].add(element)
    }
  }

  function clearLabels(element, eventNames = null) {
    if (!elementLabels.has(element)) return
    const elementEvents = elementLabels.get(element)
    if (eventNames === null) {
      for (const eventName of Object.keys(elementEvents)) {
        if (eventElements[eventName]) {
          eventElements[eventName].delete(element)
        }
      }
      elementLabels.delete(element)
    } else {
      for (const eventName of eventNames) {
        delete elementEvents[eventName]
        if (eventElements[eventName]) {
          eventElements[eventName].delete(element)
        }
      }
      if (Object.keys(elementEvents).length === 0) {
        elementLabels.delete(element)
      }
    }
  }

  function getLabel(eventName, element = null) {
    if (element && elementLabels.has(element) && elementLabels.get(element)[eventName]) {
      return elementLabels.get(element)[eventName]
    }
    if (eventElements[eventName]) {
      for (const el of eventElements[eventName]) {
        const label = elementLabels.get(el)?.[eventName]
        if (label) return label
      }
    }
    return null
  }

  function getElementEvents(element) {
    if (!elementLabels.has(element)) return []
    return Object.keys(elementLabels.get(element))
  }

  return {
    registerLabel,
    clearLabels,
    getLabel,
    getElementEvents,
  }
})
