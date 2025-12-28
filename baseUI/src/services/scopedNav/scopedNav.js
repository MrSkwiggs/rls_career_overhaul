import { defineStore } from "pinia"
import { ref } from "vue"
import logger from "@/services/logger"
// import { UINavEvents } from "@/bridge/libs"
import { getUINavServiceInstance } from "@/services/uiNav"
import { SCOPED_NAV_STATES, SCOPED_NAV_EVENTS, SCOPED_NAV_PROPERTY_NAME, SCOPED_NAV_TYPES } from "./constants"
import { findParentScope } from "./utils"
import { usePopover } from "@/services/popover"

const SCOPED_NAV_OBSERVER_EVENTS = {
  onBeforeScopeActivated: "onBeforeScopeActivated",
  onScopeActivated: "onScopeActivated",
  onBeforeScopeDeactivated: "onBeforeScopeDeactivated",
  onScopeDeactivated: "onScopeDeactivated",
  onBeforeScopeSuspended: "onBeforeScopeSuspended",
  onScopeSuspended: "onScopeSuspended",
  onBeforeScopeResumed: "onBeforeScopeResumed",
  onScopeResumed: "onScopeResumed",
}

const scopedNavObservers = {}

export function registerScopedNavObserver(id, observer) {
  scopedNavObservers[id] = observer
}

export function unregisterScopedNavObserver(id) {
  delete scopedNavObservers[id]
}

function notifyScopedNavObservers(event, detail) {
  Object.keys(scopedNavObservers).forEach(observerId => {
    const callback = scopedNavObservers[observerId][event]
    if (callback && typeof callback === "function") {
      try {
        callback(detail)
      } catch (error) {
        logger.error(`Error in scoped nav observer ${observerId} for event ${event}`, error)
      }
    }
  })
}

export const useScopedNav = defineStore("scopedNav2", () => {
  const scopeStack = ref([])

  const activateScope = (scopeId, element, options = { activationType: SCOPED_NAV_STATES.active, suspendParentScopes: false }) => {
    // logger.debug("activateScope", scopeId, element, options)
    notifyScopedNavObservers(SCOPED_NAV_OBSERVER_EVENTS.onBeforeScopeActivated, { scopeId, element, options })

    let scopeIndex = scopeStack.value.findIndex(s => s.scopeId === scopeId)
    const existingScope = scopeIndex !== -1 ? scopeStack.value[scopeIndex] : undefined

    if (existingScope && existingScope.activationType === options.activationType) {
      logger.warn(`Scope ${scopeId} already active. Ignoring...`)
      notifyScopedNavObservers(SCOPED_NAV_OBSERVER_EVENTS.onScopeActivated, { scopeId, element, options })
      return
    }

    if (existingScope) {
      existingScope.activationType = options.activationType
    } else {
      scopeStack.value.push({
        scopeId,
        element,
        ...options,
      })
      scopeIndex = scopeStack.value.length - 1
    }

    // UINavEvents.activeScope = scopeId
    // getUINavServiceInstance().setActiveScope(scopeId)

    notifyScopedNavObservers(SCOPED_NAV_OBSERVER_EVENTS.onScopeActivated, { scopeId, element, options })

    const scopeData = { scopeId, ...options }

    // if the nav type is popover, suspend the parent scopes
    const { type } = element[SCOPED_NAV_PROPERTY_NAME]
    if (type === SCOPED_NAV_TYPES.popover || options.suspendParentScopes) {
      let referenceElement = element

      if (type === SCOPED_NAV_TYPES.popover) {
        const popover = usePopover()
        const popoverName = element.getAttribute("data-bng-popover-name")
        const pop = popover.getPopover(popoverName)
        if (pop && pop.target) referenceElement = pop.target
      }

      if (!referenceElement) {
        logger.warn("Unable to find popover's target element. Skipping suspending parent scopes...")
        return
      }

      const parentScopes = scopeStack.value.slice(0, scopeIndex)
      for (let i = parentScopes.length - 1; i >= 0; i--) {
        const scope = parentScopes[i]
        if (referenceElement && scope.element.contains(referenceElement)) {
          suspendScope(scope.scopeId, scopeData)
        } else if (referenceElement && !scope.element.contains(referenceElement)) {
          deactivateScope(scope.scopeId)
        }
      }
    }

    getUINavServiceInstance().setActiveScope(scopeId)

    element.dispatchEvent(
      new CustomEvent(SCOPED_NAV_EVENTS.activate, {
        detail: scopeData,
      })
    )

    return scopeData
  }

  const deactivateScope = (scopeId, settings = { resumePrevious: false }) => {
    // logger.debug("deactivateScope", scopeId, settings)
    const scopeIndex = scopeStack.value.findIndex(s => s.scopeId === scopeId)

    if (scopeIndex === -1) {
      logger.warn(`Scope ${scopeId} not found. Ignoring...`)
      return
    }

    notifyScopedNavObservers(SCOPED_NAV_OBSERVER_EVENTS.onBeforeScopeDeactivated, { scopeId, settings })

    const scopeData = scopeStack.value[scopeIndex]
    const element = scopeData.element
    const { type } = element[SCOPED_NAV_PROPERTY_NAME]

    scopeStack.value = scopeStack.value.slice(0, scopeIndex)

    element.dispatchEvent(
      new CustomEvent(SCOPED_NAV_EVENTS.deactivate, {
        detail: {
          scopeId,
          settings,
          ...scopeData,
        },
      })
    )

    notifyScopedNavObservers(SCOPED_NAV_OBSERVER_EVENTS.onScopeDeactivated, { scopeId, settings })

    if (!settings.resumePrevious) {
      // UINavEvents.activeScope = null
      getUINavServiceInstance().setActiveScope(null)
      return
    }

    // if type is popover, find its reference element's parent scope
    let parentScope

    if (type === SCOPED_NAV_TYPES.popover) {
      const popover = usePopover()
      const popoverName = element.getAttribute("data-bng-popover-name")
      const pop = popover.getPopover(popoverName)

      if (pop) parentScope = findParentScope(pop.target, true)
      else logger.warn("Unable to find popover's target element. Skipping resume...")
    } else {
      parentScope = findParentScope(element, true)
    }

    if (!parentScope) {
      // UINavEvents.activeScope = null
      getUINavServiceInstance().setActiveScope(null)
    } else if (getScopeById(parentScope.scopeId)) {
      resumeScope(parentScope.scopeId)
    } else {
      activateScope(parentScope.scopeId, parentScope.element)
    }
  }

  const resumeScope = scopeId => {
    // logger.debug("resumeScope", scopeId)

    const scopeIndex = scopeStack.value.findIndex(s => s.scopeId === scopeId)
    if (scopeIndex === -1) {
      logger.warn(`Scope ${scopeId} not found. Ignoring...`)
      return
    }

    notifyScopedNavObservers(SCOPED_NAV_OBSERVER_EVENTS.onBeforeScopeResumed, { scopeId })

    for (let i = scopeStack.value.length - 1; i > scopeIndex; i--) {
      const scope = scopeStack.value[i]
      deactivateScope(scope.scopeId)
    }

    const scopeData = scopeStack.value[scopeIndex]
    scopeData.activationType = SCOPED_NAV_STATES.active

    // UINavEvents.activeScope = scopeData.scopeId
    getUINavServiceInstance().setActiveScope(scopeData.scopeId)

    const element = scopeData.element
    element.dispatchEvent(
      new CustomEvent(SCOPED_NAV_EVENTS.resume, {
        detail: scopeData,
      })
    )

    notifyScopedNavObservers(SCOPED_NAV_OBSERVER_EVENTS.onScopeResumed, { scopeId })

    return scopeData
  }

  const suspendScope = (scopeId, newScope) => {
    // logger.debug("suspendScope", scopeId, newScope)

    const scopeIndex = scopeStack.value.findIndex(s => s.scopeId === scopeId)
    if (scopeIndex === -1) {
      logger.warn(`Scope ${scopeId} not found. Ignoring...`)
      return
    }

    notifyScopedNavObservers(SCOPED_NAV_OBSERVER_EVENTS.onBeforeScopeSuspended, { scopeId, newScope })

    const scopeData = scopeStack.value[scopeIndex]

    if (scopeData.activationType === SCOPED_NAV_STATES.suspended) {
      logger.warn(`Scope ${scopeId} already suspended. Ignoring...`)
      return
    }

    scopeData.activationType = SCOPED_NAV_STATES.suspended

    const element = scopeData.element
    const payload = {
      scopeId,
      newScope,
      ...scopeData,
    }

    element.dispatchEvent(new CustomEvent(SCOPED_NAV_EVENTS.suspend, { detail: payload }))

    notifyScopedNavObservers(SCOPED_NAV_OBSERVER_EVENTS.onScopeSuspended, { scopeId, newScope })

    return scopeData
  }

  const currentScope = () => {
    return scopeStack.value[scopeStack.value.length - 1]
  }

  const getScopeById = scopeId => {
    return scopeStack.value.find(s => s.scopeId === scopeId)
  }

  const isActiveScope = scopeId => {
    const current = currentScope()
    if (!current) return false
    if (current.scopeId === scopeId) return true

    if (current.activationType === SCOPED_NAV_STATES.partial && scopeStack.value.length > 2) {
      const parentScope = scopeStack.value[scopeStack.value.length - 2]
      if (parentScope.scopeId === scopeId && parentScope.activationType === SCOPED_NAV_STATES.active) return true
    }

    return false
  }

  const isCurrentScope = scopeId => {
    const scope = currentScope()
    return scope && scope.scopeId === scopeId
  }

  const getScopes = () => {
    return scopeStack.value
  }

  return {
    activateScope,
    deactivateScope,
    resumeScope,
    suspendScope,
    getScopeById,
    currentScope,
    isCurrentScope,
    isActiveScope,
    getScopes,
  }
})
