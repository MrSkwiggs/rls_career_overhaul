import { nextTick } from "vue"
import { handleUINavEvent as sendToCrossfire, NAVIGABLE_ELEMENTS_SELECTOR, NO_CHILD_NAV_ATTR, MONITORED_UI_NAV_EVENTS } from "@/services/crossfire"
import { uniqueSafeId } from "@/services/uniqueId"
import { ensureFocus, setFocus } from "@/services/uiNavFocus"
import { UI_EVENTS, UI_EVENT_GROUPS } from "@/bridge/libs/UINavEvents"
import { useUINavTracker } from "@/services/uiNavTracker"
import { vBngOnUiNav } from "@/common/directives"
import { useScopedNav, NAV_EVENTS, NAV_STATES, ACTIVATION_TYPES } from "@/services/scopedNav"
import { usePopover } from "@/services/popover"

const BNG_ON_UI_NAV_ATTR = "__BngOnUiNav"
const SCOPED_NAV_ATTR = "__bngScopedNav"
const ATTR_NAME = "bng-scoped-nav"
const BNG_UI_SCOPE_ATTR = "bng-ui-scope"
const BNG_NAV_ITEM_ATTR = "bng-nav-item"
const BNG_NO_NAV_ATTR = "bng-no-nav"
const BNG_SCOPED_NAV_AUTOFOCUS_ATTR = "bng-scoped-nav-autofocus"
const NO_BIND_EVENTS = ["ok", "back"]

const BNG_SCOPED_NAV_EVENTS = [UI_EVENT_GROUPS.focusMove, UI_EVENT_GROUPS.focusMoveScalar, UI_EVENTS.ok, UI_EVENTS.back, UI_EVENTS.menu]

const SCOPED_NAV_EVENTS = {
  activate: "activate",
  deactivate: "deactivate",
  suspend: "suspend",
  resume: "resume",
}

/**
 * @name BngScopedNav
 * @description Traps focus within a container element and only allow navigation between its child elements if it is activated.
 * @param {Object} value - The value of the directive.
 * @param {boolean} value.activated - (optional) Whether the container element is initially activated.
 * @param {Function} value.canActivate - (optional) Allows customizing the activation logic.
 * @param {Function} value.canDeactivate - (optional) Allows customizing the deactivation logic.
 * @emits {activate} - Emitted when the container element is activated.
 * @emits {deactivate} - Emitted when the container element is deactivated.
 * @attr {boolean} data-scoped-nav-activated - Set in dom element. Indicates whether the container element is currently activated.
 *
 * @example
 * <div v-bng-scoped-nav="{ activated: true }">
 *   <button>Button 1</button>
 *   <button>Button 2</button>
 * </div>
 */
export default {
  beforeMount: beforeMount,
  mounted: mounted,
  updated: updated,
  beforeUnmount: beforeUnmount,
}

function onActivate(el, event) {
  // console.log("onActivate", el, event)
  const scopedNav = useScopedNav()
  const args = event.detail.args

  if (event.detail.activationType === ACTIVATION_TYPES.full || event.detail.activationType === ACTIVATION_TYPES.popup) {
    el[SCOPED_NAV_ATTR].bubbleUiNavEvents = false
    el.dataset.status = NAV_STATES.active
    setEnabledUiEvents(el, false)
    enableNavigation(el)

    if (scopedNav.getGamepadActiveStatus()) {
      if (!args || (!args.noAutoFocus && (!document.activeElement || el === document.activeElement || !el.contains(document.activeElement)))) {
        // TODO: This is likely a hack to make sure to wait for rerenders to complete (need to sync with updated lifecyclehook)
        // also prevents cascade of focus events after activating scope via okHandler
        setTimeout(() => {
          const focusedItem = focusFirstOrDefaultItem(el)
          // if no item was successfully focused, remove the focus from the container element to prevent behavior making it look like it's stuck
          if (!focusedItem && el === document.activeElement) focusElement(el, false)
        }, 200)
      }
    } else {
      // remove focus from the active element if mouse was used
      focusElement(document.activeElement, false, true)
    }
  } else if (event.detail.activationType === ACTIVATION_TYPES.partial) {
    el.dataset.status = NAV_STATES.partial
    el[SCOPED_NAV_ATTR].bubbleUiNavEvents = true
    enableNavigation(el, false)
    setEnabledUiEvents(el)
  } else {
    console.error(`Invalid scoped nav activation type: ${event.detail.activationType}`, event.detail)
    return
  }

  emitEvent(el, SCOPED_NAV_EVENTS.activate, event.detail)
}

function onDeactivate(el, event) {
  // console.log("onDeactivate", el, event)
  el.dataset.status = NAV_STATES.inactive
  enableNavigation(el, false)
  setEnabledUiEvents(el, false)
  el[SCOPED_NAV_ATTR].markForDeactivation = false
  el[SCOPED_NAV_ATTR].bubbleUiNavEvents = false

  // TODO: Check if this should be done here or globally
  // if the scope has an item with focus visible, remove the focus
  // this is for scenarios where for example, an input is focused with no focus frame style
  removeFocusWithin(el)

  emitEvent(el, SCOPED_NAV_EVENTS.deactivate, event.detail)
}

function onSuspend(el, event) {
  // console.log("onSuspend", el, event)
  el.dataset.status = NAV_STATES.suspended
  emitEvent(el, SCOPED_NAV_EVENTS.suspend, event.detail)
}

function onResume(el, event) {
  // console.log("onResume", el, event)
  const args = event.detail.args

  el.dataset.status = NAV_STATES.active

  enableNavigation(el)

  if (!args || !args.noAutoFocus) {
    const lastActiveNavItem = el[SCOPED_NAV_ATTR].lastActiveNavItem
    if (lastActiveNavItem && el.contains(lastActiveNavItem) && document.contains(lastActiveNavItem)) {
      focusElement(el[SCOPED_NAV_ATTR].lastActiveNavItem, true, true)
    } else {
      focusFirstOrDefaultItem(el)
    }
  }

  // // TODO: Check if it's needed to check if this scope is the top full scope
  // if (el[SCOPED_NAV_ATTR].lastActiveNavItem && el.contains(el[SCOPED_NAV_ATTR].lastActiveNavItem) && (!args || !args.noAutoFocus)) {
  //   // console.log("focusing last active nav item", el[SCOPED_NAV_ATTR].lastActiveNavItem)
  //   // nextTick(() => setFocus(el[SCOPED_NAV_ATTR].lastActiveNavItem))
  //   focusElement(el[SCOPED_NAV_ATTR].lastActiveNavItem, true, true)
  //   // focusFirstOrDefaultItem(el)
  // }

  emitEvent(el, SCOPED_NAV_EVENTS.resume, event.detail)
}

function onFocusIn(el, event) {
  // console.log("onFocusIn", el, event)
  const scopedNav = useScopedNav()
  const scopeId = el[SCOPED_NAV_ATTR].scopeId
  const scopeData = scopedNav.getScopeById(scopeId)

  // check if scope is already activated and target is a direct child of el, do nothing
  const closestScope = event.target.closest(`[${ATTR_NAME}]`)
  const isChild = el.contains(event.target) && closestScope === el && closestScope !== event.target

  // if focus is on popup container do nothing since this is likely just the initial setup
  if (!scopeData && el[SCOPED_NAV_ATTR].popup && event.target === el) {
    // console.log("focus is on popup container. do nothing")
    return
  }

  // scope is already activated and focus in on a direct child element of el, or
  // scope is a popup and focus in on a direct child element of el, do nothing
  if ((scopedNav.isTopFullScope(scopeId) || (scopedNav.isTopScope(scopeId) && el[SCOPED_NAV_ATTR].popup)) && isChild) {
    // console.log("focus is on a direct child element of el. do nothing")
    el[SCOPED_NAV_ATTR].lastActiveNavItem = event.target
    return
  }
  // scope is only partially activated, fully activate the scope
  else if (scopedNav.isTopScope(scopeId) && scopeData.activationType === ACTIVATION_TYPES.partial && isChild && el[SCOPED_NAV_ATTR].canActivate()) {
    // console.log("scope is only partially activated, fully activate the scope")
    scopedNav.activateScope(scopeId, el)
    return
  }

  // check if focus is on a direct child element of el, otherwise, do nothing
  if (event.target !== el && isChild && el[SCOPED_NAV_ATTR].canActivate()) {
    // console.log("focus is on a direct child element of el, activate the scope")
    handleDirectFocus(el, event)
    return
  }

  let shouldActivate = true

  // check if related target is a child of a nested scoped nav
  if (event.relatedTarget && el.contains(event.relatedTarget)) {
    // console.log("related target is a child of a nested scoped nav")
    const relTargetScopeEl = event.relatedTarget.closest(`[${ATTR_NAME}]`)
    const relTargetScopeId = relTargetScopeEl ? relTargetScopeEl[SCOPED_NAV_ATTR].scopeId : null

    // if related target's scope is still fully activated, do nothing, since this is likely a mouse click
    // that caused a focusout event
    if (relTargetScopeId && scopedNav.isTopFullScope(relTargetScopeId)) {
      // console.log("related target's scope is still fully activated, do nothing")
      shouldActivate = false
    }
  }

  if (event.target === el && shouldActivate && !el[SCOPED_NAV_ATTR].noPartial) {
    // console.log("target is the container element and should activate")
    scopedNav.activateScope(scopeId, el, ACTIVATION_TYPES.partial)
  }
}

function onFocusOut(el, event) {
  // console.log("onFocusOut", el, event)

  // check if the target is a child of el and not a child of a nested scoped nav
  if (event.target.closest(`[${ATTR_NAME}]`) !== el) {
    // console.log("target is a child of a nested scoped nav. do nothing", el)
    return
  }

  // if related target is a child of el, do nothing
  if (event.relatedTarget && el.contains(event.relatedTarget) && el !== event.relatedTarget) {
    // console.log("relatedTarget is a child of el. do nothing", el)
    return
  }

  // if the relatedTarget is a child of another unrelated scoped nav, only mark this scope for deactivation
  // since tryActivateScope will handle everything
  // check that the relatedTarget is not the same as its closest scope, meaning the new focus target is a container element
  const relatedTargetScope = event.relatedTarget && event.relatedTarget.closest(`[${ATTR_NAME}]`)
  if (event.target !== el && relatedTargetScope && event.relatedTarget !== relatedTargetScope && relatedTargetScope !== el && !el[SCOPED_NAV_ATTR].popup) {
    // console.log("relatedTarget is a child of another scoped nav. do nothing", el)
    el[SCOPED_NAV_ATTR].markForDeactivation = true
    // console.log("marking for deactivation", el[SCOPED_NAV_ATTR])
    return
  }

  const scopedNav = useScopedNav()
  const scopeId = el[SCOPED_NAV_ATTR].scopeId
  const scopeData = scopedNav.getScopeById(scopeId)
  // if no related target and current scope is partially activated, deactivate the scope
  // empty scopeData means the scope was never partially activated likely due to noPartial property set to true
  if (scopeData && scopedNav.isTopScope(scopeId) && scopeData && scopeData.activationType === ACTIVATION_TYPES.partial) {
    // console.log("no related target and current scope is partially activated. deactivate the scope", el)
    scopedNav.deactivateTopScope()
  }
}

function onUINavFocus(el, event) {
  // console.log("onUINavFocus", el, event)

  const target = event.detail.target
  const relatedTarget = event.detail.relatedTarget

  if (!(el.contains(target) || el === target)) {
    // console.log("target is not el or not a child of el. do nothing...")
    return
  }

  const scopedNav = useScopedNav()
  const scopeId = el[SCOPED_NAV_ATTR].scopeId
  const scopeData = scopedNav.getScopeById(scopeId)

  // check if scope is already activated and target is a direct child of el, do nothing
  const closestScope = target.closest(`[${ATTR_NAME}]`)
  const isChild = el.contains(target) && closestScope === el && closestScope !== target

  // if focus is on popup container do nothing since this is likely just the initial setup
  if (!scopeData && el[SCOPED_NAV_ATTR].popup && target === el) {
    // console.log("focus is on popup container. do nothing")
    return
  }

  // scope is already activated and focus in on a direct child element of el, or
  // scope is a popup and focus in on a direct child element of el, do nothing
  if ((scopedNav.isTopFullScope(scopeId) || (scopedNav.isTopScope(scopeId) && el[SCOPED_NAV_ATTR].popup)) && isChild) {
    // console.log("focus is on a direct child element of el. do nothing")
    el[SCOPED_NAV_ATTR].lastActiveNavItem = target
    return
  }
  // scope is only partially activated, fully activate the scope
  else if (scopedNav.isTopScope(scopeId) && scopeData.activationType === ACTIVATION_TYPES.partial && isChild && el[SCOPED_NAV_ATTR].canActivate()) {
    // console.log("scope is only partially activated, fully activate the scope")
    scopedNav.activateScope(scopeId, el)
    return
  }

  // check if focus is on a direct child element of el, otherwise, do nothing
  if (target !== el && isChild && el[SCOPED_NAV_ATTR].canActivate()) {
    // console.log("focus is on a direct child element of el, activate the scope")
    handleDirectFocus(el, event)
    return
  }

  let shouldActivate = true

  // check if related target is a child of a nested scoped nav
  if (relatedTarget && el.contains(relatedTarget)) {
    // console.log("related target is a child of a nested scoped nav")
    const relTargetScopeEl = relatedTarget.closest(`[${ATTR_NAME}]`)
    const relTargetScopeId = relTargetScopeEl ? relTargetScopeEl[SCOPED_NAV_ATTR].scopeId : null

    // if related target's scope is still fully activated, do nothing, since this is likely a mouse click
    // that caused a focusout event
    if (relTargetScopeId && scopedNav.isTopFullScope(relTargetScopeId)) {
      // console.log("related target's scope is still fully activated, do nothing")
      shouldActivate = false
    }
  }

  if (target === el && shouldActivate && !el[SCOPED_NAV_ATTR].noPartial) {
    // console.log("target is the container element and should activate")
    scopedNav.activateScope(scopeId, el, ACTIVATION_TYPES.partial)
  }
}

function onUINavFocusOut(el, event) {
  // console.log("onUINavFocusOut", el, event)

  const target = event.detail.target

  // check if the target is a child of el and not a child of a nested scoped nav
  if (target.closest(`[${ATTR_NAME}]`) !== el) {
    // console.log("target is a child of a nested scoped nav. do nothing", el)
    return
  }

  const scopedNav = useScopedNav()
  const scopeId = el[SCOPED_NAV_ATTR].scopeId
  const scopeData = scopedNav.getScopeById(scopeId)
  // if current scope is partially activated, deactivate the scope
  // empty scopeData means the scope was never partially activated likely due to noPartial property set to true
  if (scopeData && scopedNav.isTopScope(scopeId) && scopeData && scopeData.activationType === ACTIVATION_TYPES.partial) {
    // console.log("current scope is partially activated. deactivate the scope", el)
    scopedNav.deactivateTopScope()
  }
}

// handle scenarios where focus is directly set to a nav item and scoped nav is inactive
// likely due to mouse click or programmatic focus
function handleDirectFocus(el, event) {
  // console.log("handleDirectFocus", el, event)
  // if the event target is the container element, return
  const target = event.detail.target
  if (target === el) return

  // if the event target is not a direct child of the container element or
  // is a child of a nested bng-scoped-nav element, return
  const closestScopedNav = target.closest(`[${ATTR_NAME}]`)
  if (closestScopedNav !== el) return

  const scopedNav = useScopedNav()
  const scopeId = el[SCOPED_NAV_ATTR].scopeId
  const parentScopes = getParentScopes(el)

  scopedNav.tryActivateScope(scopeId, el, parentScopes)
}

function beforeMount(el, binding, vnode) {
  const scopeId = uniqueSafeId()
  const applyStyles = binding.value && binding.value.applyStyles !== false
  initElement(scopeId, el, { status: NAV_STATES.inactive }, applyStyles)
}

function mounted(el, binding, vnode) {
  // console.log("mounted", el, binding, vnode)
  setBindings(el, binding)
  // updateElementProperties(el)
  attachDomEvents(el)
  attachScopedNavEvents(el)
  attachUiNavHandlers(el, binding, vnode)
  enableNavigation(el, false)

  // check binding value for activated
  if (binding.value) {
    const activated = binding.value.activated
    if (activated) autoEnable(el, binding)
  }
}

function updated(el, binding, vnode) {
  // console.log("updated", el, binding, vnode)
  setBindings(el, binding)
  // updateElementProperties(el)

  const scopedNav = useScopedNav()
  const scopeId = el[SCOPED_NAV_ATTR].scopeId
  const scopeData = scopedNav.getScopeById(scopeId)

  if (binding.value && typeof binding.value.activated === "boolean") autoEnable(el, binding)
  // if scope is not in stack, disable navigation. this is to disable navigation for dynamic content
  else if (!scopeData) enableNavigation(el, false)

  // if already activated, this is likely a re-render, so update container style or status
  nextTick(() => updateContainerState(el, binding, vnode))
}

function beforeUnmount(el, binding, vnode) {
  const scopedNav = useScopedNav()
  const scopeId = el[SCOPED_NAV_ATTR].scopeId

  disposeDomEvents(el)

  // scope may have already been deactivated or removed from stack during 'focusout' event
  // check if scope is still in stack, if so, deactivate it
  if (scopedNav.getScopeById(scopeId)) scopedNav.deactivateScope(scopeId, { isUnmount: true })

  disposeScopedNavEvents(el)
}

function updateContainerState(el, binding, vnode) {
  // console.log("updateContainerState", el, binding, vnode)
  const scopedNav = useScopedNav()
  const scopeId = el[SCOPED_NAV_ATTR].scopeId

  if (scopedNav.isTopFullScope(scopeId) && !el[SCOPED_NAV_ATTR].markForDeactivation) {
    // enable navigation
    enableNavigation(el)

    if (scopedNav.getGamepadActiveStatus()) {
      setTimeout(() => {
        const activeElement = document.activeElement
        const focusedItem = getFocusedItem(el)
        // if (!activeElement || el === activeElement || !el.contains(activeElement) || !focusedItem) focusFirstOrDefaultItem(el)
        if (activeElement && el !== activeElement && isDirectChild(el, activeElement)) ensureFocus(activeElement)
        else focusFirstOrDefaultItem(el)
      }, 200)
    } else {
      focusElement(document.activeElement, false)
    }
  }
}

function autoEnable(el, binding) {
  // console.log("autoEnable", el, binding)
  const scopedNav = useScopedNav()
  const scopeId = el[SCOPED_NAV_ATTR].scopeId
  const scopeData = scopedNav.getScopeById(scopeId)

  const activated = !!binding.value.activated

  // check if the scope is a popup and not activated yet, activate it
  if (activated && el[SCOPED_NAV_ATTR].popup && !scopeData) {
    // check if the popup's target element is the current fully activated top scope,
    // if not, deactivate that scope and its ancestor scopes if not related to the popup's target element scope
    popUnrelatedScopes(el)
    scopedNav.activateScope(scopeId, el, ACTIVATION_TYPES.popup)
  }
  // check if the scope is not activated or only partially activated, if so, activate it
  else if (activated && (!scopeData || scopeData.activationType === ACTIVATION_TYPES.partial) && el[SCOPED_NAV_ATTR].canActivate()) {
    scopedNav.tryActivateScope(scopeId, el, getParentScopes(el))
  }
  // check if the scope is the top scope, is fully activated, and activated is false
  else if (
    !activated &&
    scopeData &&
    scopeData.activationType === ACTIVATION_TYPES.full &&
    scopedNav.isTopScope(scopeId) &&
    el[SCOPED_NAV_ATTR].canDeactivate()
  ) {
    scopedNav.deactivateTopScope(scopeId)
    // nextTick(() => setFocus(el))
    if (!el[SCOPED_NAV_ATTR].noPartial) focusElement(el, true, true)
  }
}

function updateElementProperties(el) {
  if (el[SCOPED_NAV_ATTR].noPartial) {
    el.removeAttribute(BNG_NAV_ITEM_ATTR)
    el.tabIndex = -1
  } else {
    el.setAttribute(BNG_NAV_ITEM_ATTR, "")
    el.tabIndex = 0
  }
}

function getPopoverData(el) {
  const popover = usePopover()
  const popoverName = el.getAttribute("data-bng-popover-name")

  if (!popoverName) {
    console.warn("popovername is not set on the element", el)
    return
  }

  const targetEl = popover.popovers[popoverName].target
  if (!targetEl) {
    console.warn(`target element not found for popover "${popoverName}"`, el)
    return
  }

  return {
    popoverName,
    popoverTarget: targetEl,
  }
}

function popUnrelatedScopes(el) {
  // console.log("popUnrelatedScopes", el)
  const scopedNav = useScopedNav()
  // const popover = usePopover()
  // const popoverName = el.getAttribute("data-bng-popover-name")

  // if (!popoverName) {
  //   console.warn("popovername is not set on the element", el)
  //   return
  // }

  // const targetEl = popover.popovers[popoverName].target
  // if (!targetEl) {
  //   console.warn(`target element not found for popover "${popoverName}"`, el)
  //   return
  // }
  const popoverData = getPopoverData(el)
  if (!popoverData) return

  const { popoverTarget: targetEl } = popoverData

  // get nearest scope element of targetEl
  const targetScopeEl = targetEl.closest(`[${ATTR_NAME}]`)
  if (targetScopeEl) {
    // get nearest scope id
    const targetScopeId = targetScopeEl ? targetScopeEl[SCOPED_NAV_ATTR].scopeId : null
    if (!targetScopeId) {
      console.warn(`target element has no scope id`, el)
      return
    }

    const scopeData = scopedNav.getScopeById(targetScopeId)
    if (scopeData) {
      // deactivate all scopes except the target scope
      // console.log("deactivating scopes before", targetScopeId)
      scopedNav.resumeScope(targetScopeId, { noAutoFocus: true })
    } else {
      // activate the target scope
      // console.log("activating target scope", targetScopeId)
      scopedNav.tryActivateScope(targetScopeId, targetScopeEl, getParentScopes(targetScopeEl), ACTIVATION_TYPES.full, { noAutoFocus: true })
    }
  } else {
    // pop all scopes in stack
    // console.log("popping all scopes")
    scopedNav.deactivateAllScopes()
  }
}

function setBindings(el, binding) {
  let canActivate = () => true
  let canDeactivate = () => true

  if (binding.value) {
    if (binding.value.canActivate) canActivate = binding.value.canActivate
    if (binding.value.canDeactivate) canDeactivate = binding.value.canDeactivate
    if (binding.value.noPartial) el[SCOPED_NAV_ATTR].noPartial = !!binding.value.noPartial
    if (binding.value.popup) el[SCOPED_NAV_ATTR].popup = !!binding.value.popup
  }

  el[SCOPED_NAV_ATTR].canActivate = canActivate
  el[SCOPED_NAV_ATTR].canDeactivate = canDeactivate
}

function focusFirstOrDefaultItem(el) {
  // console.log("focusFirstNavItem", el)
  // find the specified autofocus item if any, otherwise focus the first nav item
  const navItems = getNavItems(el)
  let autofocusItem = navItems.find(item => item.hasAttribute(BNG_SCOPED_NAV_AUTOFOCUS_ATTR) && item.getAttribute(BNG_SCOPED_NAV_AUTOFOCUS_ATTR) !== "false")

  if (!autofocusItem || !isNavigable(autofocusItem)) {
    // get first item that isn't disabled
    autofocusItem = navItems.length > 0 ? navItems[0] : null
    // console.log("no autofocus item found. getting first nav item", autofocusItem)
  }

  if (autofocusItem) focusElement(autofocusItem)

  return autofocusItem
}

function initElement(scopeId, el, data, applyStyles = true) {
  el[SCOPED_NAV_ATTR] = { scopeId, ...data }

  el.setAttribute(ATTR_NAME, scopeId)
  el.setAttribute(BNG_UI_SCOPE_ATTR, scopeId)
  el.setAttribute(BNG_NAV_ITEM_ATTR, "")
  el.setAttribute(NO_CHILD_NAV_ATTR, "true")

  if (applyStyles) {
    // set to relative to allow showing of focus border
    nextTick(() => {
      const allowedPos = ["relative", "absolute", "fixed", "sticky"]
      const style = window.getComputedStyle(el, null)
      if (!allowedPos.includes(style.position)) el.style.position = "relative"
    })
  }

  el.dataset.status = data.status
  el.tabIndex = 0
}

function attachScopedNavEvents(el) {
  const onScopedNavActivate = e => onActivate(el, e)
  el.addEventListener(NAV_EVENTS.activate, onScopedNavActivate)
  el[SCOPED_NAV_ATTR].onActivate = onScopedNavActivate

  const onScopedNavDeactivate = e => onDeactivate(el, e)
  el.addEventListener(NAV_EVENTS.deactivate, onScopedNavDeactivate)
  el[SCOPED_NAV_ATTR].onDeactivate = onScopedNavDeactivate

  const onScopedNavSuspend = e => onSuspend(el, e)
  el.addEventListener(NAV_EVENTS.suspend, onScopedNavSuspend)
  el[SCOPED_NAV_ATTR].onSuspend = onScopedNavSuspend

  const onScopedNavResume = e => onResume(el, e)
  el.addEventListener(NAV_EVENTS.resume, onScopedNavResume)
  el[SCOPED_NAV_ATTR].onResume = onScopedNavResume
}

function disposeScopedNavEvents(el) {
  el.removeEventListener("activate", el[SCOPED_NAV_ATTR].onActivate)
  el.removeEventListener("deactivate", el[SCOPED_NAV_ATTR].onDeactivate)
  el.removeEventListener("suspend", el[SCOPED_NAV_ATTR].onSuspend)
  el.removeEventListener("resume", el[SCOPED_NAV_ATTR].onResume)
}

function attachDomEvents(el) {
  // const onDomFocusIn = e => onFocusIn(el, e)
  // el[SCOPED_NAV_ATTR].onDomFocusIn = onDomFocusIn
  // el.addEventListener("focusin", onDomFocusIn)

  // const onDomFocusOut = e => onFocusOut(el, e)
  // el[SCOPED_NAV_ATTR].onDomFocusOut = onDomFocusOut
  // el.addEventListener("focusout", onDomFocusOut)

  const onDomFocusIn = e => onUINavFocus(el, e)
  el[SCOPED_NAV_ATTR].onDomFocusIn = onDomFocusIn
  document.addEventListener("uinav-focus", onDomFocusIn)

  const onDomFocusOut = e => onUINavFocusOut(el, e)
  el[SCOPED_NAV_ATTR].onDomFocusOut = onDomFocusOut
  document.addEventListener("uinav-blur", onDomFocusOut)
}

function disposeDomEvents(el) {
  // el.removeEventListener("focusin", el[SCOPED_NAV_ATTR].onDomFocusIn)
  // el.removeEventListener("focusout", el[SCOPED_NAV_ATTR].onDomFocusOut)
  document.removeEventListener("uinav-focus", el[SCOPED_NAV_ATTR].onDomFocusIn)
  document.removeEventListener("uinav-blur", el[SCOPED_NAV_ATTR].onDomFocusOut)
}

function enableNavigation(el, enable = true) {
  // set container as non-navigable if enable is true
  if (!el[SCOPED_NAV_ATTR].noPartial) enableNavItem(el, !enable)

  if (enable) {
    el.removeAttribute(NO_CHILD_NAV_ATTR)
  } else {
    el.setAttribute(NO_CHILD_NAV_ATTR, "true")
  }
  // getNavItems(el).forEach(item => enableNavItem(item, enable))
}

function enableNavItem(el, enable = true) {
  if (enable) {
    el.removeAttribute(BNG_NO_NAV_ATTR)
  } else {
    el.setAttribute(BNG_NO_NAV_ATTR, "true")
  }
  el.tabIndex = enable ? 0 : -1
}

function getParentScopes(el) {
  const parentScopes = []
  let parentScope = el.parentElement

  do {
    parentScope = parentScope.closest(`[${ATTR_NAME}]`)

    if (!parentScope) break

    const scopeId = parentScope[SCOPED_NAV_ATTR].scopeId
    parentScopes.push({ scopeId, element: parentScope })
    parentScope = parentScope.parentElement
  } while (parentScope)

  return parentScopes
}

function getNavItems(el) {
  const matches = el.querySelectorAll(NAVIGABLE_ELEMENTS_SELECTOR)
  return Array.from(matches).filter(child => {
    if (!isNavigable(child)) return false
    // check that a child element is not a child of another nested bng-scoped-nav
    // otherwise, if closest [bng-scoped-nav] element of a child element is itself,
    // then the child element is still a child of the current [bng-scoped-nav] or container
    // const parentScope = child.closest(`[${ATTR_NAME}]`)
    // // if child's closest bng-scoped-nav is itself, get its parent's closest bng-scoped-nav
    // if (parentScope === child) return child.parentElement.closest(`[${ATTR_NAME}]`) === el
    // return parentScope === el
    return isDirectChild(el, child)
  })
}

function isDirectChild(el, child) {
  const parentScope = child.closest(`[${ATTR_NAME}]`)
  // if child's closest bng-scoped-nav is itself, get its parent's closest bng-scoped-nav
  if (parentScope === child) return child.parentElement.closest(`[${ATTR_NAME}]`) === el
  return parentScope === el
}

function isNavigable(el) {
  return (
    (!el.hasAttribute(BNG_NO_NAV_ATTR) || el.getAttribute(BNG_NO_NAV_ATTR) === "false") &&
    // (!el.hasAttribute("tabindex") || el.getAttribute("tabindex") != "-1") &&
    (!el.hasAttribute("disabled") || el.getAttribute("disabled") === "false")
  )
}

function setEnabledUiEvents(el, enable = true) {
  const boundEvents = getBoundUiNavEvents(el)

  const uiNavTracker = useUINavTracker()
  const ownerId = el[SCOPED_NAV_ATTR].scopeId

  if (boundEvents && boundEvents.length > 0 && enable) {
    boundEvents.forEach(event => uiNavTracker.addEvent(event, ownerId, el))
    el[SCOPED_NAV_ATTR].disablePassthrough = false
    el[SCOPED_NAV_ATTR].passthroughEvents = boundEvents
  } else {
    if (boundEvents && boundEvents.length > 0) boundEvents.forEach(event => uiNavTracker.removeEvent(event, ownerId, el))
    el[SCOPED_NAV_ATTR].disablePassthrough = true
    el[SCOPED_NAV_ATTR].passthroughEvents = []
  }
}

function getBoundUiNavEvents(el) {
  // check that all bng-nav-item elements are bound to UINav event
  let boundEvents = []
  const navItems = getNavItems(el)

  for (const elem of navItems) {
    // all nav items must be bound to a UINav event to allow event passthrough
    if (elem[BNG_NO_NAV_ATTR]) {
      boundEvents = []
      break
    }

    const uiNavEvents = elem[BNG_ON_UI_NAV_ATTR]
      ? Object.values(elem[BNG_ON_UI_NAV_ATTR])
          .map(x => x.eventNames)
          .flat()
          .filter(name => !NO_BIND_EVENTS.includes(name))
      : []

    const isDuplicate = uiNavEvents.some(event => boundEvents.includes(event))

    // no duplicate UINav events between nav items to allow event passthrough
    if (uiNavEvents.length === 0 || isDuplicate) {
      boundEvents = []
      break
    }

    // Add unique events to boundEvents array. for scenarios where multiple events are bound to the same element
    uiNavEvents.forEach(event => {
      if (!boundEvents.includes(event)) boundEvents.push(event)
    })
  }

  return boundEvents
}

function removeFocusWithin(el) {
  const focusedItem = getFocusedItem(el)
  if (focusedItem) {
    // setFocus(focusedItem, false)
    focusElement(focusedItem, false)
  }
}

function getFocusedItem(el) {
  const focusedItem = el.querySelector(".focus-visible")
  return focusedItem
}

function getUiNavEventsByEl(el) {
  // all nav items must be bound to a UINav event to allow event passthrough
  if (el[BNG_NO_NAV_ATTR]) return undefined

  const uiNavEvents = el[BNG_ON_UI_NAV_ATTR]
    ? Object.values(el[BNG_ON_UI_NAV_ATTR])
        .map(x => x.eventNames)
        .flat()
    : []

  const boundEvents = []
  uiNavEvents.forEach(ev => {
    if (!boundEvents.includes(ev)) boundEvents.push(ev)
  })

  return boundEvents
}

function handleFocusNavigationEvent(el, e) {
  // console.log("handleFocusNavigationEvent", el, e)
  const scopeId = el[SCOPED_NAV_ATTR].scopeId
  const scopedNav = useScopedNav()
  const scopeData = scopedNav.getScopeById(scopeId)
  let targetScope = el

  scopedNav.reportFocusNavigation()

  if (scopeData.activationType === ACTIVATION_TYPES.partial) {
    const fullScope = scopedNav.getTopFullScope()
    targetScope = fullScope ? fullScope.element : null
  }

  if (
    scopeData.activationType === ACTIVATION_TYPES.full &&
    (!document.activeElement || !el.contains(document.activeElement) || document.activeElement === el)
  ) {
    focusFirstOrDefaultItem(el)
  } else {
    e.detail.sendToCrossfire = false

    // send to crossfire if active element is not the scoped nav container
    // or if the uinav event is not bound to the active element
    const uiNavEvents = !document.activeElement.hasAttribute(ATTR_NAME) ? getElementUiNavEvents(document.activeElement) : []
    if (document.activeElement === el || !uiNavEvents.includes(e.detail.name)) sendToCrossfire(e, targetScope)
  }
}

function handlePassthroughEvents(el, e) {
  // console.log("handlePassthroughEvents", el, e)
  const scopedNav = useScopedNav()
  const fullScope = scopedNav.getTopFullScope()
  const targetScope = fullScope ? fullScope.element : null

  sendToCrossfire(e, targetScope)
}

function handleChildItemEvent(el, e) {
  // console.log("handleChildItemEvent", el, e)
  emitEvent(e.target, e.type, e.detail)
}

function isEventBoundToChildItem(el, e) {
  const scopedNav = useScopedNav()
  const scopeId = el[SCOPED_NAV_ATTR].scopeId
  const boundEvents = getUiNavEventsByEl(e.target)
  return el !== e.target && scopedNav.isTopFullScope(scopeId) && boundEvents && boundEvents.length > 0 && boundEvents.includes(e.detail.name)
}

function isPassthroughEvent(el, e) {
  return (
    e.detail.name &&
    el[SCOPED_NAV_ATTR].passthroughEvents &&
    el[SCOPED_NAV_ATTR].passthroughEvents.length > 0 &&
    !el[SCOPED_NAV_ATTR].passthroughEvents.includes(e.detail.name)
  )
}

function attachUiNavHandlers(el, binding, vnode) {
  const scopeId = el[SCOPED_NAV_ATTR].scopeId
  const scopedNav = useScopedNav()

  const generalHandler = e => {
    // console.log("generalHandler", el, e)
    const scopeData = scopedNav.getScopeById(scopeId)

    // ignore if uinav event is back or ok since they have their own handlers
    // if (e.detail.name === UI_EVENTS.back || e.detail.name === UI_EVENTS.ok) return false
    if (e.detail.name === UI_EVENTS.ok) return false
    if (e.detail.name === UI_EVENTS.back || e.detail.name === UI_EVENTS.menu) return scopeData && scopeData.activationType === ACTIVATION_TYPES.partial

    if (e.target !== el && el.contains(e.target) && !e.target.hasAttribute(ATTR_NAME) && isEventBoundToChildItem(el, e)) {
      handleChildItemEvent(el, e)
    } else if (isFocusNavigationEvent(e)) {
      handleFocusNavigationEvent(el, e)
    } else if (isPassthroughEvent(el, e)) {
      handlePassthroughEvents(el, e)
      // } else if (scopeData && scopeData.activationType === ACTIVATION_TYPES.partial) {
      //   // TODO: This doesn't seem to be reachable because the event bubbling is already handled in the uiNavHandlers wrapper
      //   // Keep this here for now as references for as this is more ideal later on
      //   // bubbleEventToParent(el, e)
      // }
    }
  }

  function okHandler(e) {
    // console.log("okHandler", el, e)

    const scopeId = el[SCOPED_NAV_ATTR].scopeId
    const scopeData = scopedNav.getScopeById(scopeId)

    // if already activated, pass the event to cross fire
    if (scopeData && (scopedNav.isTopFullScope(scopeId) || (scopedNav.isTopScope(scopeId) && el[SCOPED_NAV_ATTR].popup))) {
      // console.log("okHandler is top full scope. sending to crossfire")
      const targetElement = e.target ? e.target : el

      // check if the target element has uinav ok event bound, rethrow event if so, otherwise send to crossfire
      if (targetElement !== el && targetElement === document.activeElement) {
        const targetUiNavEvents = getElementUiNavEvents(targetElement)
        if (targetUiNavEvents.includes(UI_EVENTS.ok)) {
          // console.log("okHandler target element has uinav ok event bound. rethrowing event", targetElement)
          e.detail.scopedNav = { alreadyProcessed: true }
          emitEvent(e.target, e.type, e.detail)
        } else {
          // console.log("okHandler target element does not have uinav ok event bound. sending to crossfire", targetElement)
          e.detail.sendToCrossfire = false
          sendToCrossfire(e, targetElement)
        }
      }
    }
    // if not activated, activate the scope
    else if ((!scopeData || scopeData.activationType === ACTIVATION_TYPES.partial) && el[SCOPED_NAV_ATTR].canActivate()) {
      // console.log("okHandler activating scope")
      const navigableItems = getNavItems(el)
      if (!navigableItems || navigableItems.length === 0) {
        // console.warn("No navigable items found on activate")
      }
      scopedNav.activateScope(scopeId, el)
    }
  }

  function backHandler(e) {
    // console.log("backHandler", e, el)
    const scopeData = scopedNav.getScopeById(scopeId)

    if (scopeData && scopeData.activationType === ACTIVATION_TYPES.partial) {
      // need to rethrow event to parent scope since the event is not bubbling up
      // const parentScope = scopedNav.getTopFullScope()
      // if (parentScope) emitEvent(parentScope.element, e.type, e.detail)
      return true
    }

    if (!el[SCOPED_NAV_ATTR].canDeactivate()) return

    if (scopedNav.getGamepadActiveStatus() || el[SCOPED_NAV_ATTR].popup) {
      // console.log("gamepad active or popup. deactivate scope")
      scopedNav.deactivateScope(scopeId)
      if (scopeData.activationType === ACTIVATION_TYPES.full) {
        // TODO: This is a hack to ensure that when a fully active scope receives focus in the container element itself
        // for example, via mouse click, it should be partially activated after deactivation
        // if the scope is already the active element, manually partially activate this scope

        if (!el[SCOPED_NAV_ATTR].noPartial) {
          if (document.activeElement === el) scopedNav.activateScope(scopeId, el, ACTIVATION_TYPES.partial)
          focusElement(el, true, true)
        }

        // nextTick(() => setFocus(el))
        // if (!el[SCOPED_NAV_ATTR].noPartial) focusElement(el, true, true)
      }
    } else {
      // resume the root scope if game pad is not active
      // console.log("gamepad not active. deactivating all scopes")
      scopedNav.deactivateAllScopes()
    }
  }

  // set uinav event bindings
  const okBinding = {
    arg: UI_EVENTS.ok,
    modifiers: { focusRequired: true },
    value: okHandler,
  }
  vBngOnUiNav.mounted(el, okBinding, vnode)

  const backBinding = {
    arg: [UI_EVENTS.back, UI_EVENTS.menu].join(","),
    value: backHandler,
  }
  vBngOnUiNav.mounted(el, backBinding, vnode)

  const generalEvents = [...MONITORED_UI_NAV_EVENTS, UI_EVENTS.ok, UI_EVENTS.back, UI_EVENTS.menu]
  const crossfireBinding = {
    arg: generalEvents.join(","),
    value: generalHandler,
  }
  vBngOnUiNav.mounted(el, crossfireBinding, vnode)
}

function focusElement(el, focus = true, useNextTick) {
  // console.log("focusElement", el, focus, useNextTick)
  const scopedNav = useScopedNav()

  if (focus && !scopedNav.getGamepadActiveStatus()) return

  if (useNextTick) {
    nextTick(() => setFocus(el, focus))
  } else {
    setFocus(el, focus)
  }
}

function emitEvent(el, name, value) {
  el.dispatchEvent(
    new CustomEvent(name, {
      detail: value,
      cancelable: true,
      bubbles: false,
    })
  )
}

function getElementUiNavEvents(el) {
  if (!el || !el[BNG_ON_UI_NAV_ATTR]) return []

  return Object.values(el[BNG_ON_UI_NAV_ATTR])
    .map(x => x.eventNames)
    .flat()
}

function isFocusNavigationEvent(e) {
  return (
    UI_EVENT_GROUPS.focusMove.includes(e.detail.name) ||
    UI_EVENT_GROUPS.focusMoveScalar.includes(e.detail.name) ||
    UI_EVENT_GROUPS.moveScalar.includes(e.detail.name)
  )
}
