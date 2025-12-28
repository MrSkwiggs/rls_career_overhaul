import { nextTick } from "vue"
import { handleUINavEvent as sendToCrossfire, NO_CHILD_NAV_ATTR, NO_NAV_ATTR, isOccluded } from "@/services/crossfire"
import { uniqueId } from "@/services/uniqueId"
import logger from "@/services/logger"
import { vBngOnUiNav } from "@/common/directives"
// import { UI_EVENTS, UI_EVENT_GROUPS } from "@/bridge/libs/UINavEvents"
import { UI_EVENTS, UI_EVENT_GROUPS } from "@/services/uiNav"
import { useScopedNav, SCOPED_NAV_EVENTS, SCOPED_NAV_STATES, SCOPED_NAV_TYPES } from "@/services/scopedNav"
import * as utils from "@/services/scopedNav/utils"
import { ensureFocus, setFocus } from "@/services/uiNavFocus"
import { usePopover } from "@/services/popover"
import { debounce } from "@/utils/rateLimit"

const PROPERTY_NAME = "_bngScopedNav"
const ATTR_NAME = "bng-scoped-nav"
const AUTOFOCUS_ATTR = "bng-scoped-nav-autofocus"
const UI_SCOPE_ATTR = "bng-ui-scope"
const NAV_ITEM_ATTR = "bng-nav-item"
const BNG_ON_UI_NAV_ATTR = "__BngOnUiNav"

const DEFAULT_AUTO_FOCUS_DELAY = 100

const EVENTS_UINAV_MAP = {
  activate: [UI_EVENTS.ok],
  deactivate: [UI_EVENTS.back],
  navigation: [...UI_EVENT_GROUPS.focusMove, ...UI_EVENT_GROUPS.focusMoveScalar],
}

const NAV_EVENTS = {
  activate: "activate",
  deactivate: "deactivate",
  suspend: "suspend",
  resume: "resume",
}

export const ACTIONS_ON_SUSPEND = {
  allowNavigationLastNavItem: "allowNavigationLastNavItem",
  allowNavigationByAttribute: "allowNavigationByAttribute",
  disableNavigation: "disableNavigation",
}

/**
 * @name BngScopedNav
 * @param {Object} value
 * @param {string} value.scopeId - (optional) Custom scope identifier. If not provided, a unique ID will be generated.
 * @param {string} value.type - The type of scoped nav.check NAV_TYPES
 * @param {boolean} value.activated - (optional) Dynamically set the state of the scope.
 * @param {boolean} value.activateOnMount - (optional) Whether the container element is initially activated on mount.
 * @param {boolean} value.actionsOnSuspend
 * @param {number} value.autoFocusDelay - (optional) Delay the auto focus by the specified number of milliseconds. Default is 100.
 * @param {Array} value.bubbleWhitelistEvents - (optional) Set either bubbleWhitelist or bubbleBlacklist. Events that are allowed to bubble up to the parent scope.
 * @param {Array} value.bubbleBlacklistEvents - (optional) Set either bubbleWhitelist or bubbleBlacklist. Events that are not allowed to bubble up to the parent scope.
 * @param {Array} value.forcePassthroughEvents - (optional) Will force allow the specified child handlers to be triggered
 * @param {Function} value.canActivate - (optional) A function that returns a boolean value indicating whether the scope can be activated.
 * @param {Function} value.canDeactivate - (optional) A function that returns a boolean value indicating whether the scope can be deactivated.
 * @param {Function} value.canIgnoreEvent - (optional) A function that returns a boolean value indicating whether the event should be handled or ignored.
 * @param {Function} value.canBubbleEvent - (optional) A function that returns a boolean value indicating whether the event should be allowed to bubble up to the parent scope.
 */
export default {
  beforeMount: beforeMount,
  mounted: mounted,
  updated: updated,
  beforeUnmount: beforeUnmount,
  unmounted: unmounted,
}

const getDefaultOptions = () => {
  return {
    type: SCOPED_NAV_TYPES.normal,
    activateOnMount: false,
    actionsOnSuspend: [ACTIONS_ON_SUSPEND.disableNavigation],
    bubbleWhitelistEvents: [],
    bubbleBlacklistEvents: [],
    forcePassthroughEvents: [], // FIXME: not implemented
    canActivate: () => true,
    canDeactivate: () => true,
    autoFocusDelay: DEFAULT_AUTO_FOCUS_DELAY,
  }
}

const canBubbleEventInternal = (el, e) => {
  const { bubbleWhitelistEvents, canBubbleEvent } = el[PROPERTY_NAME]

  if (canBubbleEvent && typeof canBubbleEvent === "function") return canBubbleEvent(e)
  else if (bubbleWhitelistEvents && Array.isArray(bubbleWhitelistEvents) && bubbleWhitelistEvents.length > 0)
    return bubbleWhitelistEvents.includes(e.detail.name)
  else return false
}

const shouldBubbleToNextScope = (el, e) => {
  const scopedNav = useScopedNav()
  const currentScope = scopedNav.currentScope()
  const { scopeId, type } = el[PROPERTY_NAME]

  const isActive = currentScope && currentScope.scopeId === scopeId
  const isPartial = isActive && currentScope.activationType === SCOPED_NAV_STATES.partial
  const isContainer = type === SCOPED_NAV_TYPES.container
  const isInactiveAndFocused = document.activeElement === el && !isActive

  return !currentScope || isInactiveAndFocused || canBubbleEventInternal(el, e) || isPartial || isContainer
}

const getOptions = (el, binding, vnode) => {
  const options = { ...getDefaultOptions(), ...binding.value }

  if (!Object.values(SCOPED_NAV_TYPES).includes(options.type)) {
    console.error(`Invalid scoped nav type: ${options.type}`)
    return undefined
  }

  return options
}

const applyOptions = (el, options) => {
  const attributes = {}

  switch (options.type) {
    case SCOPED_NAV_TYPES.normal:
      attributes[NAV_ITEM_ATTR] = ""
      attributes[NO_CHILD_NAV_ATTR] = "true"
      break
    case SCOPED_NAV_TYPES.nonav:
      attributes[NO_NAV_ATTR] = "true"
      attributes[NO_CHILD_NAV_ATTR] = "true"
      break
  }

  Object.keys(attributes).forEach(attr => el.setAttribute(attr, attributes[attr]))
}

const findAutoFocusItem = navItems => navItems.find(item => item.hasAttribute(AUTOFOCUS_ATTR) && item.getAttribute(AUTOFOCUS_ATTR) !== "false")

const getAutoFocusItem = el => findAutoFocusItem(utils.getNavItems(el))

const getFirstOrDefaultNavItem = el => {
  let navItems
  let isAutoFocusItem = false

  // on-demand items fetcher
  const getNavItems = () => navItems || (navItems = utils.getNavItems(el))

  const getLastActive = () => {
    // last active element has highest priority to acquire focus
    const elm = el[PROPERTY_NAME].lastActiveElement
    if (elm && !document.contains(elm)) return null
    return elm
  }
  const getAutoFocus = () => {
    // if the last active element is not in the document, find the first auto-focusable item
    const elm = findAutoFocusItem(getNavItems())
    if (elm && !utils.isNavigable(elm)) return null
    isAutoFocusItem = !!elm
    return elm
  }
  const getFirst = () => {
    // if either the last active element or the first auto-focusable item is not navigable, default to the first navigable item
    return getNavItems()[0]
  }

  // sequence of methods to get the focus item
  const sequence = [
    getLastActive,
    getAutoFocus,
  ]

  // reverse the sequence if we'd like to prefer auto-focus item
  if (el[PROPERTY_NAME].preferAutoFocus) {
    sequence.reverse()
  }

  // add the first navigable item search
  sequence.push(getFirst)

  // run the sequence
  for (const func of sequence) {
    const elm = func()
    if (elm) {
      return { focusItem: elm, isAutoFocusItem }
    }
  }

  return { focusItem: null, isAutoFocusItem: false }
}

const setEnabledNavigation = (el, enabled, settings = { applyToChildItems: false, filterElements: undefined }) => {
  const { type } = el[PROPERTY_NAME]

  if (type === SCOPED_NAV_TYPES.nonav) {
    logger.warn("Cannot toggle navigation settings for nonav type", el, enabled, type)
    return
  }

  if (settings.applyToChildItems) {
    const navItems = utils.getNavItems(el, false)
    navItems.forEach(item => {
      if (settings.filterElements && settings.filterElements.includes(item)) return

      if (!item[PROPERTY_NAME]) {
        const currentValue = item.hasAttribute(NO_NAV_ATTR) ? item.getAttribute(NO_NAV_ATTR) : undefined
        item[PROPERTY_NAME] = {
          originalNoNav: currentValue,
          hadOriginalNoNav: currentValue !== undefined,
        }
      }

      if (enabled) {
        if (!item[PROPERTY_NAME].hadOriginalNoNav) item.removeAttribute(NO_NAV_ATTR)
        else item.setAttribute(NO_NAV_ATTR, item[PROPERTY_NAME].originalNoNav)
        item[PROPERTY_NAME].noNavSetByDirective = false
      } else {
        if (!item[PROPERTY_NAME].hadOriginalNoNav || item[PROPERTY_NAME].originalNoNav !== "true") {
          item.setAttribute(NO_NAV_ATTR, "true")
          item[PROPERTY_NAME].noNavSetByDirective = true
        }
      }
    })
  } else {
    if (enabled) {
      el.removeAttribute(NO_CHILD_NAV_ATTR)
      if (type === SCOPED_NAV_TYPES.normal) el.setAttribute(NO_NAV_ATTR, "true")
    } else {
      el.setAttribute(NO_CHILD_NAV_ATTR, "true")
      if (type === SCOPED_NAV_TYPES.normal) el.removeAttribute(NO_NAV_ATTR)
    }
  }
}

const focusFirstOrDefaultNavItem = el => {
  const { autoFocusDelay } = el[PROPERTY_NAME]
  nextTick(() => {
    setTimeout(() => {
      const { focusItem, isAutoFocusItem } = getFirstOrDefaultNavItem(el)
      // setFocus already checks if the element is occluded
      if (focusItem) setFocus(focusItem, true, isAutoFocusItem)
    }, autoFocusDelay)
  })
}

const ensureFocusOrFocusDefault = el => {
  if (document.activeElement && utils.isDirectChild(el, document.activeElement)) {
    ensureFocus(document.activeElement, true)
  } else {
    focusFirstOrDefaultNavItem(el)
  }
}

// #region Vue lifecycle hooks
function beforeMount(el, binding, vnode) {
  const options = getOptions(el, binding, vnode)
  if (!options) return

  const scopeId = options.scopeId || uniqueId("scoped-nav")
  el[PROPERTY_NAME] = { scopeId, ...options }
  el[PROPERTY_NAME].shouldBubbleEvent = e => shouldBubbleToNextScope(el, e)
  el.setAttribute(ATTR_NAME, scopeId)
  el.setAttribute(UI_SCOPE_ATTR, scopeId)

  applyOptions(el, options)
}

function mounted(el, binding, vnode) {
  addUINavEventListeners(el, binding, vnode)
  addScopedNavEventListeners(el)

  const scopedNav = useScopedNav()
  const options = getOptions(el, binding, vnode)

  if (options.type === SCOPED_NAV_TYPES.normal) {
    configurePartialActivation(el)
  } else if (options.type === SCOPED_NAV_TYPES.container) {
    configureContainer(el, false)
  }

  if (options.activateOnMount) {
    nextTick(() => scopedNav.activateScope(el[PROPERTY_NAME].scopeId, el))
  }
}

const handleDefaultUpdate = (el, binding, vnode) => {
  const scopedNav = useScopedNav()
  const activeScope = scopedNav.currentScope()
  const { scopeId, type } = el[PROPERTY_NAME]

  if (!activeScope || activeScope.scopeId !== scopeId || activeScope.activationType !== SCOPED_NAV_STATES.active) return

  ensureFocusOrFocusDefault(el)
}

function updated(el, binding, vnode) {
  // logger.debug("updated", el, binding, vnode)

  const options = getOptions(el, binding, vnode)

  const { scopeId } = el[PROPERTY_NAME]
  const scopedNav = useScopedNav()
  if (options.activated === true && !scopedNav.isActiveScope(scopeId)) {
    // resumeOrActivate

    const suspendedScope = scopedNav.getScopeById(scopeId)
    if (suspendedScope) {
      // TODO: hack for vehicle selector, dropdown requires double clicks,
      // check if a popup is open and if so, don't resume the scope
      const popover = usePopover()
      const hasOpenPopover = Object.values(popover.popovers).filter(x => x.show === true).length > 0
      if (hasOpenPopover) return
      scopedNav.resumeScope(scopeId, el)
    } else {
      scopedNav.activateScope(scopeId, el, { activationType: SCOPED_NAV_STATES.active, suspendParentScopes: true })
    }
  } else if (options.activated === false && scopedNav.isActiveScope(scopeId)) {
    scopedNav.deactivateScope(scopeId, { resumePrevious: true })
  } else if (!scopedNav.isActiveScope(scopeId) && options.type === SCOPED_NAV_TYPES.container) {
    configureContainer(el, false)
  }

  nextTick(() => {
    const activeScope = scopedNav.currentScope()
    if (activeScope && activeScope.scopeId === scopeId) {
      handleDefaultUpdate(el, binding, vnode)
    }
  })
}

function beforeUnmount(el, binding, vnode) {
  removeScopedNavEventListeners(el)

  // force deactivate the scope if it is still in the stack
  const scopedNav = useScopedNav()
  const scopeData = scopedNav.getScopeById(el[PROPERTY_NAME].scopeId)

  if (scopeData) {
    const { type } = el[PROPERTY_NAME]
    scopedNav.deactivateScope(el[PROPERTY_NAME].scopeId, { resumePrevious: type === SCOPED_NAV_TYPES.popover })
    el.dispatchEvent(new CustomEvent(NAV_EVENTS.deactivate, { detail: { force: true, reason: "unmounted" } }))
  }
}

function unmounted(el, binding, vnode) {}
// #endregion

// #region Scoped Nav Event Handlers
const handlePartialActivation = (el, event) => {
  // el[PROPERTY_NAME].passthroughActive = true
  el[PROPERTY_NAME].forceBubble = true
}

const handleNormalActivation = (el, event) => {
  el[PROPERTY_NAME].forceBubble = false
  nextTick(() => {
    setEnabledNavigation(el, true)
    if (!document.activeElement || el === document.activeElement || !el.contains(document.activeElement)) {
      focusFirstOrDefaultNavItem(el)
    }
  })
}

const configurePartialActivation = el => {
  const passthroughEvents = utils.getPassthroughEvents(el)
  el[PROPERTY_NAME].passthroughEnabled = passthroughEvents.length > 0
  el[PROPERTY_NAME].passthroughEvents = passthroughEvents
}

const configureContainer = (el, activated) => {
  // if a child item with autofocus is found, set other child items to non-navigable
  if (el[PROPERTY_NAME].containerSetup) el[PROPERTY_NAME].containerSetup.cancel()

  el[PROPERTY_NAME].containerSetup = debounce(() => {
    const autoFocusItem = getAutoFocusItem(el)
    if (autoFocusItem) {
      setEnabledNavigation(el, activated, { applyToChildItems: true, filterElements: [autoFocusItem] })
    }
  }, 100)

  el[PROPERTY_NAME].containerSetup()
}

const handleContainerActivation = (el, event) => {
  configureContainer(el, true)
}

const handleNoNavActivation = (el, event) => {}

const onActivate = (el, event) => {
  // logger.debug("onActivate", el, event)
  const { type } = el[PROPERTY_NAME]
  const { activationType } = event.detail

  if (activationType === SCOPED_NAV_STATES.partial) {
    handlePartialActivation(el, event)
  } else if (type === SCOPED_NAV_TYPES.normal) {
    handleNormalActivation(el, event)
  } else if (type === SCOPED_NAV_TYPES.container) {
    handleContainerActivation(el, event)
  } else if (type === SCOPED_NAV_TYPES.nonav) {
    handleNoNavActivation(el, event)
  }

  el.dispatchEvent(new CustomEvent(NAV_EVENTS.activate, { detail: event.detail }))
}

const onDeactivate = (el, event) => {
  // logger.debug("onDeactivate", el, event)
  const { type } = el[PROPERTY_NAME]

  if (type === SCOPED_NAV_TYPES.normal && event.detail.activationType === SCOPED_NAV_STATES.active) {
    setEnabledNavigation(el, false)
  } else if (type === SCOPED_NAV_TYPES.container) {
    configureContainer(el, false)
  }

  el[PROPERTY_NAME].forceBubble = false
  el.dispatchEvent(new CustomEvent(NAV_EVENTS.deactivate, { detail: event.detail }))
}

const onSuspend = (el, event) => {
  // logger.debug("onSuspend", el, event)

  const { actionsOnSuspend, type } = el[PROPERTY_NAME]
  let filterElements = []

  if (actionsOnSuspend.includes(ACTIONS_ON_SUSPEND.allowNavigationLastNavItem)) {
    const lastActiveElement = el[PROPERTY_NAME].lastActiveElement
    if (lastActiveElement && document.contains(lastActiveElement)) filterElements.push(lastActiveElement)
  }

  setEnabledNavigation(el, false, { applyToChildItems: true, filterElements })
}

const onResume = (el, event) => {
  // logger.debug("onResume", el, event)
  // check the suspend action
  const { actionsOnSuspend, type } = el[PROPERTY_NAME]
  let filterElements = []

  if (actionsOnSuspend.includes(ACTIONS_ON_SUSPEND.allowNavigationLastNavItem)) {
    const lastActiveElement = el[PROPERTY_NAME].lastActiveElement
    if (lastActiveElement && document.contains(lastActiveElement)) filterElements.push(lastActiveElement)
  }

  setEnabledNavigation(el, true, { applyToChildItems: true, filterElements })
  ensureFocusOrFocusDefault(el)
}

function addScopedNavEventListeners(el) {
  const eventHandlers = {
    [SCOPED_NAV_EVENTS.activate]: event => onActivate(el, event),
    [SCOPED_NAV_EVENTS.deactivate]: event => onDeactivate(el, event),
    [SCOPED_NAV_EVENTS.suspend]: event => onSuspend(el, event),
    [SCOPED_NAV_EVENTS.resume]: event => onResume(el, event),
  }

  Object.keys(eventHandlers).forEach(eventName => {
    if (!el[PROPERTY_NAME].scopedNavListeners) el[PROPERTY_NAME].scopedNavListeners = {}
    el.addEventListener(eventName, eventHandlers[eventName])
    el[PROPERTY_NAME].scopedNavListeners[eventName] = eventHandlers[eventName]
  })
}

function removeScopedNavEventListeners(el) {
  if (!el || !el[PROPERTY_NAME] || !el[PROPERTY_NAME].scopedNavListeners) return

  Object.keys(el[PROPERTY_NAME].scopedNavListeners).forEach(eventName => {
    el.removeEventListener(eventName, el[PROPERTY_NAME].scopedNavListeners[eventName])
    delete el[PROPERTY_NAME].scopedNavListeners[eventName]
  })
}
// #endregion

// #region uinav handlers
const allowsNavigation = el => {
  const { type } = el[PROPERTY_NAME]
  const navigableScopeTypes = [SCOPED_NAV_TYPES.normal, SCOPED_NAV_TYPES.container, SCOPED_NAV_TYPES.popover]
  return navigableScopeTypes.includes(type)
}

const processNavigationEvent = (el, e) => {
  // logger.debug("processNavigationEvent", el, e)
  const scopedNav = useScopedNav()
  const currentScope = scopedNav.currentScope()
  const { scopeId } = el[PROPERTY_NAME]

  if (!allowsNavigation(el)) return false

  if (document.activeElement === el && currentScope.scopeId === scopeId) {
    focusFirstOrDefaultNavItem(el)
  } else {
    // e.stopPropagation() // sometimes events pass through despite being processed here
    // repro: new options, navigate in content of various categories (it's not consistent, so you have to find it)
    sendToCrossfire(e, el)
    // e.detail.sendToCrossfire = false
  }
}

const isNavigationEvent = e => UI_EVENT_GROUPS.navigation.includes(e.detail.name)

const getUINavEventsByEl = el => {
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

const hasBoundEvent = (el, eventName) => {
  const boundEvents = getUINavEventsByEl(el)
  return boundEvents && boundEvents.length > 0 && boundEvents.includes(eventName)
}

const isUINavEventBoundToChild = (el, e) => {
  const { scopeId } = el[PROPERTY_NAME]
  const scopedNav = useScopedNav()
  const currentScope = scopedNav.currentScope()

  return (
    currentScope &&
    currentScope.scopeId === scopeId &&
    e.target !== el &&
    el.contains(e.target) &&
    e.target === document.activeElement &&
    hasBoundEvent(e.target, e.detail.name)
  )
}

const generalHandler = (el, e) => {
  // logger.debug("generalHandler", el, e)
  let shouldBubble = false

  if (isUINavEventBoundToChild(el, e) && !e.target.hasAttribute(ATTR_NAME)) {
    // logger.debug("generalHandler isUINavEventBoundToChild", el, e)
    // do nothing since this is bound to child
    // TODO: Need to revisit and make sure this is the correct way to handle this
    // e.stopPropagation()
  } else if (shouldBubbleToNextScope(el, e)) {
    // logger.debug("generalHandler shouldBubbleToNextScope", el, e)
    shouldBubble = true
  } else if (isNavigationEvent(e)) {
    // logger.debug("generalHandler isNavigationEvent", el, e)
    processNavigationEvent(el, e)
  }

  // e.bubbleToNextScope = shouldBubble
  return shouldBubble
}

const processOkChildHandler = (el, e) => {
  if (!isUINavEventBoundToChild(el, e)) {
    sendToCrossfire(e, e.target)
    e.detail.sendToCrossfire = false
    // e.stopPropagation()
  }
}

const okHandler = (el, e) => {
  // logger.debug("okHandler", el, e)

  if (e.detail.value !== 1) return shouldBubbleToNextScope(el, e)

  const scopedNav = useScopedNav()
  const scopeId = el[PROPERTY_NAME].scopeId
  const currentScope = scopedNav.currentScope()

  // TODO: Need to check for nested scopes like in career profiles
  if (
    currentScope &&
    currentScope.scopeId === scopeId &&
    currentScope.activationType === SCOPED_NAV_STATES.active &&
    ((document.activeElement && utils.isDirectChild(el, document.activeElement)) || (e.target && utils.isDirectChild(el, e.target)))
  ) {
    // logger.debug("okHandler already in scope", scopeId)
    processOkChildHandler(el, e)
  } else if (el[PROPERTY_NAME].canActivate() && el[PROPERTY_NAME].type === SCOPED_NAV_TYPES.normal && document.activeElement === el) {
    scopedNav.activateScope(scopeId, el)
    // logger.debug("okHandler activated scope", scopeId)
  }

  return shouldBubbleToNextScope(el, e)
}

const backHandler = (el, e) => {
  // logger.debug("backHandler", el, e)
  if (e.detail.value !== 1) return

  const scopedNav = useScopedNav()
  const { scopeId, type, canDeactivate } = el[PROPERTY_NAME]
  const currentScope = scopedNav.currentScope()

  if (currentScope && currentScope.scopeId === scopeId && currentScope.activationType === SCOPED_NAV_STATES.active) {
    // logger.debug("backHandler currentScope, canDeactivate", scopeId, canDeactivate())
    if (canDeactivate()) {
      // logger.debug("backHandler deactivating scope", scopeId)
      scopedNav.deactivateScope(scopeId, { resumePrevious: true, executingScope: scopeId })
      if (type === SCOPED_NAV_TYPES.normal) nextTick(() => setFocus(el))
    }
    // e.stopPropagation()
  } else if (e.target !== el && utils.isDirectChild(el, e.target)) {
    // logger.debug("backHandler isDirectChild", el, e)
    // e.stopPropagation()
    return false
  } else {
    // logger.debug("backHandler bubbling to next scope", el, e)
    // e.bubbleToNextScope = true
    return true
  }
}

const uiNavEventsHandler = (el, e) => {
  const uiNavEvent = e.detail.name
  if (EVENTS_UINAV_MAP.activate.includes(uiNavEvent)) return okHandler(el, e)
  else if (EVENTS_UINAV_MAP.deactivate.includes(uiNavEvent)) return backHandler(el, e)
  else return generalHandler(el, e)
}

function addUINavEventListeners(el, binding, vnode) {
  const { bubbleWhitelistEvents } = el[PROPERTY_NAME]
  const genericHandlers = [...EVENTS_UINAV_MAP.activate, ...EVENTS_UINAV_MAP.deactivate, ...EVENTS_UINAV_MAP.navigation]
  // bubbleWhitelistEvents.forEach(event => {
  //   if (!genericHandlers.includes(event)) genericHandlers.push(event)
  // })

  const generalUINavBinding = {
    arg: genericHandlers.join(","),
    value: e => uiNavEventsHandler(el, e),
  }
  vBngOnUiNav.mounted(el, generalUINavBinding, vnode)
}
// #endregion
