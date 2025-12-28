import { computed, ref } from "vue"
import { defineStore } from "pinia"
import { default as UINavEvents } from "@/bridge/libs/UINavEvents"
import useControls from "@/services/controls"

export const NAV_STATES = {
  partial: "partial", // scope is only partially activated; only some selected events are allowed to pass through. container is not opened and focus navigation is not trapped
  active: "active", // scope is fully activated; all events are allowed to pass through. container is opened and focus navigation is trapped
  inactive: "inactive", // scope is not activated; no events are allowed to pass through. container is closed and focus navigation is not trapped
  suspended: "suspended", // scope is suspended either due to a child scoped nav being activated or a popup being opened; does not receive any events, instead, child scoped navs and popups receive events
}

export const NAV_EVENTS = {
  activate: "internalActivate",
  deactivate: "internalDeactivate",
  suspend: "internalSuspend",
  resume: "internalResume",
}

export const ACTIVATION_TYPES = {
  full: "full",
  partial: "partial",
  popup: "popup",
}

let mouseTrackingInitialized = false
// let mouseDownEvent = null

export const useScopedNav = defineStore("scopedNav", () => {
  const controls = useControls()
  const activeScopes = ref([])
  const mouseDownEvent = ref(null)
  const isGamepadAvailable = controls.isGamepadAvailable(true)
  setMouseTracking()

  const isGamepadActive = computed(() => isGamepadAvailable && isGamepadAvailable.value && !mouseDownEvent.value)

  const getGamepadActiveStatus = () => controls.isGamepadAvailable() && !mouseDownEvent.value

  function onMouseDown(event) {
    // console.log("onMouseDown", event)
    // only track if there are any active scopes
    const fromController = event.fromController
    mouseDownEvent.value = activeScopes.value.length > 0 && !fromController ? event : null
  }

  function setMouseTracking(element) {
    if (mouseTrackingInitialized) return

    document.addEventListener("mousedown", onMouseDown, true)
    mouseTrackingInitialized = true
  }

  function disposeMouseTracking() {
    if (!mouseTrackingInitialized) return
    document.removeEventListener("mousedown", onMouseDown, true)
    mouseTrackingInitialized = false
  }

  function activateScope(scopeId, element, activationType = ACTIVATION_TYPES.full) {
    // console.log("activateScope", scopeId, element, activationType, activeScopes.value)

    // check if current top scope's activation type is full.
    // only when the current top scope's activation type is full, can a new scope be activated unless it's a popup.
    // a partial activation must first be fully activated before a new scope can be activated

    const top = getTopScope()
    if (top && top.scopeId === scopeId && top.activationType === activationType) {
      console.warn("Scope is already activated", { scopeId, element, activationType })
      return top
    }

    if (activationType !== ACTIVATION_TYPES.popup && top && top.activationType === ACTIVATION_TYPES.partial && scopeId !== top.scopeId) {
      console.error("Partial activation must first be fully activated before a new scope can be activated")
      return
    }

    let scopeData, previousScope

    // if the new scope is a popup, activate it immediately
    if (activationType === ACTIVATION_TYPES.popup) {
      // console.log("new scope is a popup, activate it immediately")
      scopeData = { scopeId, element, activationType }
      suspendTopFullScope(scopeData)
      activeScopes.value.push(scopeData)
      previousScope = top
    }
    // if no top scope, immediately activate the new scope
    else if (!top) {
      // console.log("1. if no top scope, immediately activate the new scope")
      scopeData = { scopeId, element, activationType }
      activeScopes.value.push(scopeData)
    }
    // if top scope is full and new scope is full and top scope is not the same as the new scope, suspend the top scope and activate the new scope
    else if (top && top.activationType === ACTIVATION_TYPES.full && scopeId !== top.scopeId && activationType === ACTIVATION_TYPES.full) {
      // console.log(
      //   "if top scope is full and new scope is full and top scope is not the same as the new scope, suspend the top scope and activate the new scope"
      // )
      scopeData = { scopeId, element, activationType }
      previousScope = top
      suspendTopScope({ ...scopeData, previousScope })
      activeScopes.value.push(scopeData)
    }
    // if top scope is full and new scope is partial and top scope is not the same as the new scope, partially activate the new scope
    else if (top && top.activationType === ACTIVATION_TYPES.full && scopeId !== top.scopeId) {
      // console.log("if top scope is full and new scope is partial and top scope is not the same as the new scope, partially activate the new scope")
      scopeData = { scopeId, element, activationType }
      previousScope = top
      activeScopes.value.push(scopeData)
    }
    // if top scope is equal to new scope and if top scope is partial, fully activate the top scope and suspend the parent scope if any
    else if (top && top.activationType === ACTIVATION_TYPES.partial && scopeId === top.scopeId) {
      // console.log("if top scope is equal to new scope and if top scope is partial, fully activate the top scope and suspend the parent scope")
      const prevScope = activeScopes.value.length > 1 ? activeScopes.value[activeScopes.value.length - 2] : null
      if (prevScope) suspendScope(prevScope.scopeId)
      top.activationType = ACTIVATION_TYPES.full
      scopeData = { scopeId, element, activationType }
    }
    // if top scope is suspended and new scope is the same as the top scope, then resume the top scope. e.g. when a popup is closed
    else if (top && top.activationType === ACTIVATION_TYPES.suspended && scopeId === top.scopeId) {
      // console.log("if top scope is suspended and newe scope is the same as the top scope, then resume the top scope. e.g. when a popup is closed")
      resumeTopScope()
      scopeData = top
    } else {
      // console.log("else")
      console.error("Invalid scope activation request", { scopeId, element, activationType })
      return
    }

    UINavEvents.activeScope = scopeId
    emitEvent(NAV_EVENTS.activate, { ...scopeData, previousScope }, element)

    return { ...scopeData, previousScope }
  }

  /**
   * If there is already an existing stack of scopes available, this will try to activate an unrelated new scope or resume an existing scope
   * basically, deactivate the scopes in the stack and activate the new set of scopes if unrelated
   * @param {string} scopeId
   * @param {HTMLElement} element
   * @param {Object[]} parentScopes
   * @param {string} parentScopes.scopeId
   * @param {HTMLElement} parentScopes.element
   * @param {string} activationType
   * @param {Object} args - additional data to send `onActivate` event
   */
  function tryActivateScope(scopeId, element, parentScopes, activationType = ACTIVATION_TYPES.full, args) {
    // console.log("tryActivateScope", scopeId, element, parentScopes, activationType)
    // check if the scope is already in the stack
    const index = activeScopes.value.findIndex(scope => scope.scopeId === scopeId)

    // if the scope is already in the stack, resume the scope
    if (index > -1) {
      resumeScope(scopeId)
      return
    }

    const scopeData = { scopeId, element, activationType, args }

    // to inform the listener whether the new scope is unrelated to the previous active scope
    let unrelated = true

    // check if any of the parent scopes are already in the stack
    let existingParentIndex = -1
    let parentIndex = -1
    for (let i = 0; i < parentScopes.length; i++) {
      existingParentIndex = activeScopes.value.findIndex(scope => scope.scopeId === parentScopes[i].scopeId)
      if (existingParentIndex > -1) {
        parentIndex = i
        break
      }
    }

    // the new scopes' parent scope is already in the stack
    // deactivate the scopes after the parent scope index
    if (parentIndex > -1) {
      for (let i = activeScopes.value.length - 1; i > existingParentIndex; i--) {
        internalDeactivateScope(activeScopes.value[i].scopeId, scopeData)
      }

      // add the rest of the parent scopes before the parentIndex to the stack
      if (parentIndex > 0) {
        for (let i = parentIndex - 1; i >= 0; i--) {
          activeScopes.value.push({ ...parentScopes[i], activationType: ACTIVATION_TYPES.full })
        }
      }

      unrelated = false
    }
    // remove all the active scopes and activate the new scope and all it's parents with a suspended status
    else {
      // deactivate all the scopes in the stack and activate the new scope and all it's parents with a suspended status
      for (const existingScope of activeScopes.value.toReversed()) {
        internalDeactivateScope(existingScope.scopeId, scopeData)
      }

      // add all the parent scopes to the stack
      for (const parentScope of parentScopes) {
        activeScopes.value.push({ ...parentScope, activationType: ACTIVATION_TYPES.full })
      }
    }

    // add and activate the new scope
    activeScopes.value.push({ ...scopeData, activationType: ACTIVATION_TYPES.full, unrelated })
    UINavEvents.activeScope = scopeId
    emitEvent(NAV_EVENTS.activate, scopeData, element)

    return scopeData
  }

  function resumeScope(scopeId, args) {
    // console.log("resumeScope", scopeId)
    const scope = getScopeById(scopeId)
    if (!scope) {
      console.warn("No scope to resume")
      return
    }

    // set the specified scope as fully active
    const index = activeScopes.value.findIndex(scope => scope.scopeId === scopeId)
    activeScopes.value[index].activationType = ACTIVATION_TYPES.full

    const currentScope = getTopScope()
    const scopeData = { ...scope, previousScope: currentScope, args }

    // and remove and deactivate the rest of the scoped after (i.e. child scoped navs)
    // notify the scope elements to react to the change
    for (let i = index + 1; i < activeScopes.value.length; i++) {
      internalDeactivateScope(activeScopes.value[i].scopeId, scope)
    }

    UINavEvents.activeScope = scopeId
    emitEvent(NAV_EVENTS.resume, scopeData, scope.element)
  }

  function resumeRootScope() {
    if (activeScopes.value.length === 0) {
      console.warn("No active scope to resume")
      return
    }

    const rootScope = activeScopes.value[0]
    if (rootScope.activationType !== ACTIVATION_TYPES.full) {
      console.warn("Root scope is not fully activated")
      return
    }

    resumeScope(rootScope.scopeId, { noAutoFocus: true })
  }

  function resumeTopScope(previousScope) {
    const top = getTopScope()
    if (!top) {
      console.warn("No active scope to resume")
      return
    }

    // if top scope is a partially activated scope, activate it and fully activate it's parent scope
    const data = internalResumeScope(top.scopeId, previousScope)

    if (top.activationType === ACTIVATION_TYPES.popup) {
      const topFullScope = getTopFullScope()
      if (topFullScope && topFullScope.scopeId !== top.scopeId) {
        internalResumeScope(topFullScope.scopeId, previousScope)
      }
    }

    UINavEvents.activeScope = top.scopeId
    return data
  }

  function suspendTopScope(newScope) {
    const top = getTopScope()
    if (!top) {
      console.warn("No active scope to suspend")
      return
    }

    // top.activationType = ACTIVATION_TYPES.suspended

    const scopeData = {
      ...top,
      activationType: ACTIVATION_TYPES.suspended,
      currentScope: newScope,
    }

    // disable child navigation
    emitEvent(NAV_EVENTS.suspend, scopeData, top.element)
  }

  function suspendTopFullScope(newScope) {
    const topIndex = activeScopes.value.findLastIndex(scope => scope.activationType === ACTIVATION_TYPES.full)

    if (topIndex === -1) {
      console.warn("No top full scope to suspend")
      return
    }

    const top = activeScopes.value[topIndex]

    const scopeData = {
      ...top,
      currentScope: newScope,
    }

    for (let i = topIndex + 1; i < activeScopes.value.length; i++) {
      suspendScope(activeScopes.value[i].scopeId, newScope)
    }

    emitEvent(NAV_EVENTS.suspend, scopeData, top.element)
  }

  function suspendScope(scopeId, newScope) {
    const scope = getScopeById(scopeId)
    if (!scope) {
      console.warn("No scope to suspend")
      return
    }

    const scopeData = {
      ...scope,
      currentScope: newScope,
    }

    emitEvent(NAV_EVENTS.suspend, scopeData, scope.element)
    return scopeData
  }

  /**
   * Deactivates the top scope and resumes the previous scope
   * @returns {Object} scopeData - the scope data of the new top scope
   */
  function deactivateTopScope() {
    // console.log("deactivateTopScope")
    const top = getTopScope()

    if (!top) {
      console.warn("No active scope to deactivate")
      return
    }

    const newTop = activeScopes.value.length > 1 ? activeScopes.value[activeScopes.value.length - 2] : null
    let scopeData, newScopeId

    // if top scope is a popup, deactivate the top scope and resume the previous scope
    if (top.activationType === ACTIVATION_TYPES.popup) {
      scopeData = { ...top, currentScope: newTop }

      let activateNewTopParent = false
      // if new top is partially activated resume and also resume its parent scope (which is a the full top scope)
      if (newTop && newTop.activationType === ACTIVATION_TYPES.partial) {
        activateNewTopParent = true
      }
    }
    // if top scope is full, deactivate the top scope and resume the previous scope
    else if (top.activationType === ACTIVATION_TYPES.full) {
      // console.log("if top scope is full, deactivate the top scope and resume the previous scope")
      scopeData = { ...top, currentScope: newTop }
      newScopeId = newTop ? newTop.scopeId : null
    }
    // if top scope is partial, deactivate the top scope (current scope currently still has an activated status if top scope is partial)
    else if (top.activationType === ACTIVATION_TYPES.partial) {
      // console.log("if top scope is partial, deactivate the top scope (current scope currently still has an activated status if top scope is partial)")
      scopeData = { ...newTop, currentScope: newTop }
      newScopeId = newTop ? newTop.scopeId : null
    }
    // if no previous scope, deactivate the current scope and set the current scope the oldScope's value
    else {
      // console.log("if no previous scope, deactivate the current scope and set the current scope the oldScope's value")
      scopeData = top
      newScopeId = null
    }

    activeScopes.value = activeScopes.value.filter(scope => scope.scopeId !== top.scopeId)
    UINavEvents.activeScope = newScopeId
    emitEvent(NAV_EVENTS.deactivate, scopeData, top.element)

    return scopeData
  }

  /**
   * Deactivates the specified scope and all it's children scopes
   * @param {string} scopeId
   */
  function deactivateScope(scopeId, args) {
    // console.log("deactivateScope", scopeId)
    const scope = getScopeById(scopeId)
    if (!scope) {
      console.warn("No scope to deactivate", scopeId)
      return
    }

    const index = activeScopes.value.findIndex(scope => scope.scopeId === scopeId)

    // check if there's a top scope to resume from the deactivated scope
    if (index >= 1) {
      const newTop = activeScopes.value[index - 1]
      resumeScope(newTop.scopeId)
    }
    // otherwise, just deactivate the specified scope and all it's children scopes
    else {
      for (let i = index; i < activeScopes.value.length; i++) {
        internalDeactivateScope(activeScopes.value[i].scopeId, scope, args)
      }
      UINavEvents.activeScope = null
    }
  }

  function deactivateAllScopes() {
    // reset mouse tracking on deactivate scopes
    if (activeScopes.value.length === 0) return
    deactivateScope(activeScopes.value[0].scopeId)
  }

  function deactivateScopesBefore(scopeId) {
    const index = activeScopes.value.findIndex(scope => scope.scopeId === scopeId)
    if (index <= 0) return
    deactivateScope(activeScopes.value[index - 1].scopeId)
  }

  function getTopScope() {
    return activeScopes.value[activeScopes.value.length - 1]
  }

  function isTopScope(scopeId) {
    if (activeScopes.value.length === 0) return false
    return getTopScope().scopeId === scopeId
  }

  function isTopFullScope(scopeId) {
    const top = getTopFullScope()
    return top && top.scopeId === scopeId
  }

  function getTopFullScope() {
    return activeScopes.value.findLast(scope => scope.activationType === ACTIVATION_TYPES.full)
  }

  function isRootScope(scopeId) {
    return activeScopes.value.length > 0 && activeScopes.value[0].scopeId === scopeId
  }

  /**
   * Returns the top full scope by the distance from the top full scope
   * @param {number} distance - the distance from the top full scope. 0 will return the top full scope, 1 will return the full scope immediately below the top full scope, and so on.
   * @returns {Object} scopeData - the scope data of the top full scope
   */
  function getTopFullScopeByDistance(distance) {
    const fullScopes = activeScopes.value.filter(scope => scope.activationType === ACTIVATION_TYPES.full)
    if (fullScopes.length === 0) return null

    const lastFullScopeIndex = fullScopes.length - 1
    const targetIndex = lastFullScopeIndex - distance

    return targetIndex >= 0 && targetIndex < fullScopes.length ? fullScopes[targetIndex] : null
  }

  function getScopeById(scopeId) {
    return activeScopes.value.find(scope => scope.scopeId === scopeId)
  }

  function internalResumeScope(scopeId, previousScope) {
    const scope = getScopeById(scopeId)
    if (!scope) {
      console.warn("No scope to resume")
      return
    }

    const scopeData = {
      ...scope,
      previousScope,
    }

    emitEvent(NAV_EVENTS.resume, scopeData, scope.element)
    return scopeData
  }

  function internalDeactivateScope(scopeId, newScope, args) {
    // console.log("internalDeactivateScope", scopeId, newScope)
    const scope = getScopeById(scopeId)
    if (!scope) {
      console.warn("No scope to deactivate")
      return
    }

    const scopeData = {
      ...scope,
      currentScope: newScope,
      args,
    }

    emitEvent(NAV_EVENTS.deactivate, scopeData, scope.element)
    activeScopes.value = activeScopes.value.filter(scope => scope.scopeId !== scopeId)
    return scopeData
  }

  const reportFocusNavigation = () => {
    mouseDownEvent.value = null
  }

  return {
    isGamepadActive,
    reportFocusNavigation,
    getGamepadActiveStatus,

    activateScope,
    tryActivateScope,
    deactivateTopScope,
    deactivateScope,
    deactivateAllScopes,
    deactivateScopesBefore,
    resumeRootScope,
    resumeTopScope,
    resumeScope,
    suspendTopScope,
    getTopScope,
    getTopFullScope,
    isRootScope,
    isTopScope,
    isTopFullScope,
    getScopeById,
    getTopFullScopeByDistance,
  }
})

function emitEvent(name, data, element) {
  const event = new CustomEvent(name, {
    detail: data,
    bubbles: false,
  })

  element.dispatchEvent(event)
}
