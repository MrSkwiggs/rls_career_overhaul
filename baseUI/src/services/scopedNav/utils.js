import { NO_NAV_ATTR, NAVIGABLE_ELEMENTS_SELECTOR } from "@/services/crossfire"
import { ATTR_NAME, BNG_ON_UI_NAV_ATTR, PASSTHROUGH_EXCLUDED_EVENTS, SCOPED_NAV_ATTR, UI_SCOPE_ATTR } from "./constants"

export const getScopeProperties = el => {
  if (!el || !el.hasAttribute(UI_SCOPE_ATTR)) return undefined

  return {
    scopeId: el.getAttribute(UI_SCOPE_ATTR),
    isScopedNav: el.hasAttribute(SCOPED_NAV_ATTR),
  }
}

export const findParentScope = (el, scopedNavOnly = false) => {
  let parent = el.parentElement

  while (parent) {
    // Check for bng-scoped-nav first (full-featured)
    const scopedNavId = parent.getAttribute(SCOPED_NAV_ATTR)
    if (scopedNavId) {
      return {
        scopeId: scopedNavId,
        element: parent,
        isScopedNav: true,
      }
    }

    // Then check for bng-ui-scope (basic boundary)
    if (!scopedNavOnly) {
      const uiScopeId = parent.getAttribute(UI_SCOPE_ATTR)
      if (uiScopeId) {
        return {
          scopeId: uiScopeId,
          element: parent,
          isScopedNav: false,
        }
      }
    }

    parent = parent.parentElement
  }

  return null
}

export const isNavigable = el =>
  (!el.hasAttribute(NO_NAV_ATTR) || el.getAttribute(NO_NAV_ATTR) === "false") && (!el.hasAttribute("disabled") || el.getAttribute("disabled") === "false")

export const isDirectChild = (el, child) => {
  // const parentScope = child.closest(`[${ATTR_NAME}]`)
  // // if child's closest bng-scoped-nav is itself, get its parent's closest bng-scoped-nav
  // if (parentScope === child) return child.parentElement.closest(`[${ATTR_NAME}]`) === el
  // return parentScope === el
  return child.parentElement.closest(`[${ATTR_NAME}]`) === el
}

export const getNavItems = (el, navigableOnly = true) => {
  const matches = el.querySelectorAll(NAVIGABLE_ELEMENTS_SELECTOR)
  return Array.from(matches).filter(child => {
    if (!isNavigable(child) && navigableOnly) return false
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

export const getPassthroughEvents = el => {
  const navItems = getNavItems(el, false)
  if (navItems.length === 0) return false

  // check that all bng-nav-item elements are bound to UINav event
  let boundEvents = []

  for (const elem of navItems) {
    // all nav items must be bound to a UINav event to allow event passthrough
    const uiNavEvents = elem[BNG_ON_UI_NAV_ATTR]
      ? Object.values(elem[BNG_ON_UI_NAV_ATTR])
          .map(x => x.eventNames)
          .flat()
          .filter(name => !PASSTHROUGH_EXCLUDED_EVENTS.includes(name))
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
