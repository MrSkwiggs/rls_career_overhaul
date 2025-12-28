import { findParentScope, getScopeProperties } from "./utils"
import { SCOPED_NAV_PROPERTY_NAME, SCOPED_NAV_TYPES, SCOPED_NAV_STATES, SCOPED_NAV_ATTR } from "./constants"
import { useScopedNav, registerScopedNavObserver } from "./scopedNav"
import { onBeforeUnmount, onMounted } from "vue"

let focusDebounceTimer = null
let pendingFocusAction = null
let focusListenersInitialized = false
let isActivatingScope = false
let isDeactivatingScope = false
const FOCUS_DEBOUNCE_TIME = 200

const focusManagerId = "focusManager"

const clearFocusDebounce = () => {
  if (focusDebounceTimer) {
    clearTimeout(focusDebounceTimer)
    focusDebounceTimer = null
  }
  pendingFocusAction = null
}

const debouncedFocusAction = action => {
  clearFocusDebounce()

  pendingFocusAction = action
  focusDebounceTimer = setTimeout(() => {
    if (pendingFocusAction) {
      pendingFocusAction()
      pendingFocusAction = null
    }
    focusDebounceTimer = null
  }, FOCUS_DEBOUNCE_TIME)
}

export function useFocusManager() {
  const scopedNav = useScopedNav()

  const onUINavFocus = e => {
    // logger.debug("onUINavFocus", e)
    // console.log("onUINavFocus", e)
    const { target, relatedTarget } = e.detail

    // TODO: This is a hack and a quick fix to prevent closing scoped nav when the focus is within the dashmenu
    // check if the target is a child of the dashmenu, if so, do nothing
    if (isWithinDashmenu(target)) return

    // TODO: This is a hack and a quick fix to ignore items within a popup
    if (isWithinPopup(target)) return

    let targetScope = findParentScope(target, true)
    let scopeElement = targetScope && targetScope.isScopedNav ? targetScope.element : null
    const scopedNavProps = scopeElement && scopeElement[SCOPED_NAV_PROPERTY_NAME] ? scopeElement[SCOPED_NAV_PROPERTY_NAME] : null

    if (scopedNavProps) scopeElement[SCOPED_NAV_PROPERTY_NAME].lastActiveElement = target

    if (isActivatingScope || isDeactivatingScope || shouldSkipFocusHandling(scopedNavProps)) {
      clearFocusDebounce()
      return
    }

    debouncedFocusAction(() => handleFocusAction(target, targetScope, scopeElement, scopedNav))
  }

  const onUINavBlur = e => {
    const { target } = e.detail
    const scopeProperties = getScopeProperties(target)
    const currScope = scopedNav.currentScope()

    if (shouldHandleBlur(scopeProperties, currScope)) {
      target[SCOPED_NAV_PROPERTY_NAME].passthroughActive = false
      scopedNav.deactivateScope(scopeProperties.scopeId, { resumePrevious: true })
    }
  }

  function addFocusListeners() {
    if (focusListenersInitialized) return
    document.addEventListener("uinav-focus", onUINavFocus)
    document.addEventListener("uinav-blur", onUINavBlur)

    registerScopedNavObserver(focusManagerId, {
      onBeforeScopeActivated: () => {
        clearFocusDebounce()
        isActivatingScope = true
      },
      onScopeActivated: () => {
        // clear any pending focus action if any, because the target may already be stale
        clearFocusDebounce()
        isActivatingScope = false
      },
      onBeforeScopeDeactivated: () => {
        clearFocusDebounce()
        isDeactivatingScope = true
      },
      onScopeDeactivated: () => {
        clearFocusDebounce()
        isDeactivatingScope = false
      }
    })

    focusListenersInitialized = true
  }

  function removeFocusListeners() {
    if (!focusListenersInitialized) return
    document.removeEventListener("uinav-focus", onUINavFocus)
    document.removeEventListener("uinav-blur", onUINavBlur)
    focusListenersInitialized = false
  }

  function setup() {
    addFocusListeners()
  }

  function dispose() {
    removeFocusListeners()
  }

  onMounted(() => {
    // console.log("focusManager setup")
    setup()
  })

  onBeforeUnmount(() => {
    // console.log("focusManager dispose")
    dispose()
  })

  return {
    setup,
    dispose,
  }
}

// Helper functions (same as before)
function isWithinDashmenu(target) {
  const dashmenu = document.getElementById("dashmenu")
  return dashmenu?.contains(target)
}

function isWithinPopup(target) {
  return !!target.closest("dialog")
}

function shouldSkipFocusHandling(scopedNavProps) {
  return scopedNavProps?.type === SCOPED_NAV_TYPES.popover
}

function shouldHandleBlur(scopeProperties, currScope) {
  return scopeProperties?.isScopedNav && currScope?.scopeId === scopeProperties.scopeId && currScope?.activationType === SCOPED_NAV_STATES.partial
}

function handleFocusAction(target, targetScope, scopeElement, scopedNavStore) {
  // TODO: quick fix for now. add to properly remove the scope from the stack  without the need for the next focus event
  // need to check if the target doesn't exist in dom anymore. This can happen when a component is unmounted
  // the next focus event will be triggered and update the scope stack
  if (!document.contains(target) && !document.contains(scopeElement)) {
    return
  }

  const activeScope = scopedNavStore.currentScope()

  if (activeScope?.element === target) {
    return
  }

  let existingScope
  let scopes = scopedNavStore.getScopes()
  for (let i = scopes.length - 1; i >= 0; i--) {
    const scope = scopes[i]
    if (scope.element === scopeElement) {
      existingScope = scope
      break
    }
  }

  if (existingScope && activeScope && existingScope.scopeId !== activeScope.scopeId) {
    scopedNavStore.resumeScope(existingScope.scopeId)
    return
  }

  scopes = scopedNavStore.getScopes()
  for (let i = scopes.length - 1; i >= 0; i--) {
    const scope = scopes[i]
    if (scope.element === target || scope.element.contains(target) || scopeElement === scope.element || scope.element.contains(scopeElement)) break
    scopedNavStore.deactivateScope(scope.scopeId)
  }

  scopes = scopedNavStore.getScopes()
  if (targetScope && targetScope.isScopedNav) {
    const lastScope = scopes.length > 0 ? scopes[scopes.length - 1] : null

    if (
      lastScope &&
      activeScope &&
      activeScope.scopeId === lastScope.scopeId &&
      targetScope.scopeId !== lastScope.scopeId &&
      lastScope.activationType !== SCOPED_NAV_STATES.suspended
    ) {
      scopedNavStore.suspendScope(lastScope.scopeId, { scopeId: targetScope.scopeId, scopeElement })
    }

    if ((!activeScope || activeScope.scopeId !== targetScope.scopeId) && scopeElement[SCOPED_NAV_PROPERTY_NAME].canActivate()) {
      scopedNavStore.activateScope(targetScope.scopeId, scopeElement)
    }
  }

  if (target.hasAttribute(SCOPED_NAV_ATTR)) {
    const allowPartialActivation = target[SCOPED_NAV_PROPERTY_NAME].passthroughEnabled
    const canActivate = target[SCOPED_NAV_PROPERTY_NAME].canActivate()

    target[SCOPED_NAV_PROPERTY_NAME].passthroughActive = true

    if (allowPartialActivation && canActivate) {
      const partialScope = getScopeProperties(target)
      scopedNavStore.activateScope(partialScope.scopeId, target, { activationType: SCOPED_NAV_STATES.partial })
    }
  }
}
