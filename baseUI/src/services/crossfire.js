import { isVisibleFast, isVisible, isOccluded as isNodeOccluded, dispatchKey } from "../utils/DOM.js"
export { isVisibleFast }

export const NAVIGABLE_ELEMENTS_SELECTOR =
  "[is-bng-panel], [bng-nav-item], [ng-click], [href], [bng-all-clicks], [bng-all-clicks-no-nav], " +
  "[ui-sref], input, textarea, button, md-option, md-slider, md-select, md-checkbox"

// this disables navigation on the element itself
// usage: <div bng-no-nav>
export const NO_NAV_ATTR = "bng-no-nav"

// this disables navigation on the element's children, but not on the element itself
// usage: <div bng-no-child-nav="true">
export const NO_CHILD_NAV_ATTR = "bng-no-child-nav"

// this allows to "extend" navigable hot area to its container
// but keep in mind that container must be defined
export const NAV_PRIORITY_CONTAINER_ATTR = "bng-nav-priority-container"
export const NAV_PRIORITY_ATTR = "bng-nav-priority-item" // TODO: unused atm, implement later

const MENU_NAVIGATION_CLASS = "menu-navigation"

const IGNORE_TAGS = ["HTML", "BODY"]

// use bng-no-nav="true" to disable elements from navigation

/// Gamepad scroll (GE-3992)
// To allow something to scroll, add to that element "bng-nav-scroll" attribute.
// To enforce scroll on a non-parent element, add the "bng-nav-scroll-force" attribute to a target element. Multiple elements with this attribute can co-exist at once, but only the first scrollable will be scrolled.
// They both can be safely defined on a single element.
// To dynamically enable/disable scrolling, use bng-nav-scroll="false" (on both normal and forced).
/// Behaviour notes:
// - When there's nothing to scroll in an element, it does not catch the bindings.
// - If an element can't be scrolled, it tries to search for another one (inc. areas with "bng-nav-scroll-force" attr).
// - When focused inside an element with "bng-nav-scroll" attr and it has something to scroll, it is prioritised over an element with "bng-nav-scroll-force".
export const SCROLL_ATTR = "bng-nav-scroll" // attribute name that allows scrolling with a right thumbstick
export const SCROLL_FORCE_ATTR = "bng-nav-scroll-force" // attribute name that enforces scrolling in that area regardless of what focused but respecting the focused navigableScroll

const DIR = {
  LEFT: "left",
  UP: "up",
  RIGHT: "right",
  DOWN: "down"
}

const DIR_KEYS = {
  [DIR.LEFT]: 37,
  [DIR.UP]: 38,
  [DIR.RIGHT]: 39,
  [DIR.DOWN]: 40,
}

const AXIS_H = "horizontal"
const AXIS_V = "vertical"

export const SCROLL_EVENT_H = "rotate_h_cam"
export const SCROLL_EVENT_V = "rotate_v_cam"

const UI_SCROLL_EVENT_ACTIONS = {
  [SCROLL_EVENT_H]: AXIS_H,
  [SCROLL_EVENT_V]: AXIS_V,
}
const UI_SCROLL_ACTION_EVENTS = {
  [AXIS_H]: SCROLL_EVENT_H,
  [AXIS_V]: SCROLL_EVENT_V,
}

const SCALAR_EVENT_H = "focus_lr"
const SCALAR_EVENT_V = "focus_ud"

const UI_SCALAR_EVENT_ACTIONS = {
  [SCALAR_EVENT_H]: AXIS_H,
  [SCALAR_EVENT_V]: AXIS_V,
}

const UI_NAV_EVENT_ACTIONS = {
  "focus_u": "up",
  "focus_d": "down",
  "focus_l": "left",
  "focus_r": "right",
  "ok": "confirm",
  "tab_l": "tab_l",
  "tab_r": "tab_r",
}

export const MONITORED_UI_NAV_EVENTS = [
  ...Object.keys(UI_NAV_EVENT_ACTIONS),
  ...Object.keys(UI_SCALAR_EVENT_ACTIONS),
  // ...Object.keys(UI_SCROLL_EVENT_ACTIONS),
]

const THUMBSTICK_DEADZONE = 0.5 // set to 0 to use default deadzone set in options
const THUMBSTICK_INITIAL_DELAY = 1000
const THUMBSTICK_REPEAT_DELAY = 250

const thumbstickState = {
  time: 0,
  axis: null,
  value: 0,
  isHolding: false
}

const lastScalarValue = {
  horizontal: 0,
  vertical: 0
}

const TRACKER_ID = "crossfire" // for UiNavTracker

export function focusOnElement(elem) {
  // note: contentEditable can have many values, so to definitely enable focus-visible we're going to force-change it in any case
  // TODO: check and update to use setAttribute instead of directly accessing the property
  const contentEditable = elem.contentEditable
  const tabIndex = elem.tabIndex
  elem.contentEditable = true
  elem.tabIndex = 0
  elem.focus()
  elem.tabIndex = tabIndex
  elem.contentEditable = contentEditable
}

function getNavigableElements(root = null, forceAll = false) {
  let res = [...(root || document.body).querySelectorAll(NAVIGABLE_ELEMENTS_SELECTOR)]
  if (!forceAll) {
    res = res.filter(elem => {
      const dontNavInside = elem.parentNode.closest(`[${NO_CHILD_NAV_ATTR}="1"], [${NO_CHILD_NAV_ATTR}="true"]`)
      if (dontNavInside) return false
      let noNav = elem.attributes.getNamedItem(NO_NAV_ATTR)
      return !noNav || noNav.value !== "true"
    })
  }
  //console.log('getNavigateableElements', res)
  return res
}


export function isNavigable(elem, forceAll = false) {
  if (!elem) return false
  if (IGNORE_TAGS.includes(elem.nodeName || elem.tagName)) return false
  if (elem.classList.contains(MENU_NAVIGATION_CLASS)) return true
  const parent = elem.parentNode
  if (!parent) return false
  const children = getNavigableElements(parent, forceAll)
  for (let child of children) if (child === elem) return true
  return false
}
export { isNavigable as isNavigatable }


export function uncollectRects() {
  const ns = getNavigableElements()
  for (let node of ns) {
    node.classList.remove(MENU_NAVIGATION_CLASS)
  }
}

let warnPrioNesting = window.beamng && !window.beamng.shipping

export function collectRects(direction, parent, forceAll = false) {
  const links = {}
  if (direction) {
    links[direction] = []
  } else {
    links.up = []
    links.down = []
    links.left = []
    links.right = []
  }
  const prioNodes = new WeakSet()
  const ns = getNavigableElements(parent, forceAll)
  for (let node of ns) {
    // prevent invisible navigation
    if (!isAvailable(node)) {
      node.classList.remove(MENU_NAVIGATION_CLASS)
      continue
    }
    let rectNode = node
    // check priorities
    const prioNode = node.closest(`[${NAV_PRIORITY_CONTAINER_ATTR}]`)
    if (prioNode && prioNode !== node && !prioNodes.has(prioNode)) {
      // prevent multiple priority items per container
      prioNodes.add(prioNode)
      // warn about nesting
      if (!warnPrioNesting) {
        const parent = prioNode.parentNode.closest(`[${NAV_PRIORITY_CONTAINER_ATTR}]`)
        if (parent) {
          console.warn("Priority container nesting is not supported. Please remove the nested priority container.\nParent:", parent, "\nChild:", prioNode)
          warnPrioNesting = true
        }
      }
      // prevent rect override if we're already inside of a priority container
      const active = document.activeElement
      if (!active || !prioNode.contains(active)) {
        // TODO: check if container has priority item defined and remove from prioNodes if `node` is not the one
        rectNode = prioNode
      }
      // console.log("priority", node, prioNode)
    }
    // calculate
    const rect = rectNode.getBoundingClientRect() // TODO: cache these (read=all of these DOM calls, as they force a reflow=expensive), as they are super expensive
    // prevent offscreen navigation
    if (rect.right < 0 || rect.bottom < 0 || rect.left > screen.width || rect.top > screen.height) {
      node.classList.remove(MENU_NAVIGATION_CLASS)
      continue
    }
    node.classList.add(MENU_NAVIGATION_CLASS)
    node.tabIndex = 0 // make element focusable
    const lnk = { dom: node, rect }
    if (links.up) links.up.push(lnk)
    if (links.down) links.down.push(lnk)
    if (links.left) links.left.push(lnk)
    if (links.right) links.right.push(lnk)
  }
  if (links.up) links.up.sort((a, b) => a.rect.top - b.rect.top)
  if (links.down) links.down.sort((a, b) => a.rect.bottom - b.rect.bottom)
  if (links.left) links.left.sort((a, b) => a.rect.left - b.rect.left)
  if (links.right) links.right.sort((a, b) => a.rect.right - b.rect.right)
  // console.log(direction ? links[direction] : links)
  return links
}


export function isAvailable(node) {
  if (!isVisibleFast(node)) return false
  const style = document.defaultView.getComputedStyle(node, null)
  if (style["pointer-events"] === "none") return false
  if (!isVisible(node, style)) return false
  if (!isOccluded(node)) return true
  return false
}

export function isOccluded(node, dontIgnoreOffscreen = false) {
  const rects = node.getClientRects()
  for (let rect of rects) {
    if (!isNodeOccluded(node, rect, dontIgnoreOffscreen)) return false
  }
  return true
}


function getDistanceFast(curr, goal, direction, usePerpendicular = false) {
  let dx = Math.min(goal.right, curr.right) - Math.max(goal.left, curr.left)
  let dy = Math.min(goal.bottom, curr.bottom) - Math.max(goal.top, curr.top)

  if (dx === goal.right - goal.left) dx = curr.right - goal.left
  if (dy === goal.bottom - goal.top) dy = curr.bottom - goal.top

  let res = Infinity

  if (direction === DIR.DOWN && goal.bottom > curr.bottom) res = Math.max(0, goal.bottom - curr.top) - dx
  else if (direction === DIR.UP && goal.top < curr.top) res = Math.max(0, curr.top - goal.bottom) - dx
  else if (direction === DIR.RIGHT && goal.right > curr.right) res = Math.max(0, goal.left - curr.right) - dy
  else if (direction === DIR.LEFT && goal.left < curr.left) res = Math.max(0, curr.left - goal.right) - dy

  // perpendicular distance and modifier
  if (usePerpendicular && isFinite(res)) {
    const mod = 1.5
    if (direction === DIR.LEFT || direction === DIR.RIGHT) {
      // this helps on far passes, when something is obscured by another element on 1D marching
      res += Math.abs((curr.top + curr.bottom) / 2 - (goal.top + goal.bottom) / 2) * mod
    // } else {
    //   // vertical addition should be used only when necessary (there's no need for that atm)
    //   res += Math.abs((curr.left + curr.right) / 2 - (goal.left + goal.right) / 2) * mod
    }
  }

  return res
}


export function navigate(links, direction, activeOverride) {
  return links[direction] ? navigateNext(links[direction], direction, activeOverride) : false
}


function navigateNext(links, direction, activeOverride = null) {
  const active = activeOverride || document.activeElement

  if (active.nodeName === "BODY" || active.nodeName === "DIALOG") {
    window.requestAnimationFrame(() => {
      //locate first button (closest to topleft corner), and set its focus
      let firstLink = null
      let firstElementDistance = Number.MAX_SAFE_INTEGER
      for (let link of links) {
        const distance = link.rect.top * link.rect.top + link.rect.left * link.rect.left
        if (distance > firstElementDistance) continue
        firstElementDistance = distance
        firstLink = link
      }
      if (!firstLink) {
        console.log("Couldn't locate any button anywhere. Menu navigation won't work")
        return
      }
      // console.log("Focusing on a first button:", firstLink)
      focusOnElement(firstLink.dom)
      scrollFix(firstLink, direction)
    })
    return true
  }

  /// If a list item has arrow elements navigate to those with left and right
  // if (active.nodeName === "MD-LIST-ITEM" && (direction === DIR_LEFT || direction === DIR_RIGHT)) {
  //   for (let i = 0; i < links.length; i += 1) {
  //     if (active.contains(links[i].dom )) {
  //       if (direction === DIR_LEFT && links[i].dom.classList.contains(DIR_LEFT)) {
  //         focusOnElement(links[i].dom)
  //         scrollFix(links[i], direction)
  //         return
  //       } else if (direction === DIR_RIGHT && links[i].dom.classList.contains(DIR_RIGHT)) {
  //         focusOnElement(links[i].dom)
  //         scrollFix(links[i], direction)
  //         return
  //       }
  //     }
  //   }
  // }

  if (
    (active.nodeName === "MD-SLIDER" && (direction === DIR.LEFT || direction === DIR.RIGHT)) ||
    (active.nodeName === "MD-OPTION" && (direction === DIR.UP || direction === DIR.DOWN)) ||
    (active.nodeName === "INPUT" && active.type === "range" && (direction === DIR.LEFT || direction === DIR.RIGHT))
  ) {
    fireKey(active, direction)
    return true
  }

  const { nearestLink, fixScroll } = findNext(links, direction, active)

  if (nearestLink) {
    // console.log("Focussing on a button:", nearestLink)
    focusOnElement(nearestLink.dom)
    fixScroll?.()
    return nearestLink.dom
  } else {
    // patch for stuck md elements
    // repro: use controller, open any angular dropdown, press Back on controller, try to navigate anywhere
    if (links.length === 0) { // note: this condition won't work if debug is open
      const mdBackdrops = [...document.querySelectorAll("md-backdrop, .md-scroll-mask")]
      if (mdBackdrops.length > 0) {
        for (const el of mdBackdrops) {
          try {
            el.parentNode.removeChild(el)
          } catch (err) { }
        }
        return navigateNext(links, direction, activeOverride)
      }
    }
    return false
  }
}


export function findNext(links, direction, activeOverride = null) {
  const active = activeOverride || document.activeElement
  let activeRect = active.getBoundingClientRect()
  let fixScroll = true

  if (isScrolling(direction) && isOccluded(active, activeRect, true)) {
    // changes nav behaviour for occluded elements if we're scrolling with gamepad
    let axis, boundsame, boundchange
    switch (direction) {
      case DIR.UP:
      case DIR.DOWN:
        axis = "vertical"
        boundsame = ["left", "right"]
        boundchange = ["top", "bottom"]
        break
      case DIR.LEFT:
      case DIR.RIGHT:
        axis = "horizontal"
        boundsame = ["top", "bottom"]
        boundchange = ["left", "right"]
        break
    }
    // sometimes it fails (test case: career profiles with tooltip on a side)
    if (navScrolling[axis].area) {
      const bounds = navScrolling[axis].area.bounds
      const axisBound = activeRect[boundchange[1]] < bounds[0] ? 0 : 1
      activeRect = {
        [boundsame[0]]: activeRect[boundsame[0]],
        [boundsame[1]]: activeRect[boundsame[1]],
        [boundchange[0]]: bounds[axisBound],
        [boundchange[1]]: bounds[axisBound],
      }
      fixScroll = false
    }
  }

  const dir = direction === DIR.RIGHT || direction === DIR.DOWN ? 1 : -1
  const len = links.length
  const start = dir === 1 ? 0 : len - 1
  let minDistance = Infinity
  let nearestLink = null
  for (let i = start; 0 <= i && i < len; i += dir) {
    // don't navigate to current element again
    if (links[i].dom === active) continue
    const distance = getDistanceFast(activeRect, links[i].rect, direction, true)
    if (distance < minDistance) {
      minDistance = distance
      nearestLink = links[i]
    }
  }

  return {
    nearestLink,
    fixScroll: fixScroll ? () => scrollFix(nearestLink, direction) : null,
  }
}

const navScrolling = {
  // runtime variables, compatible with crossfire's "link" object
  running: false,
  listening: { vertical: false, horizontal: false },
  dom: null,
  rect: null,
  vertical: { active: false, amount: 0, area: null },
  horizontal: { active: false, amount: 0, area: null },
  hint: { show: false },
}


function drawScrollHint() {
  const show = isScrolling()
  if (navScrolling.hint.show === show) return
  navScrolling.hint.show = show
  let elem = document.getElementById("xf_scroll") // not caching just in case
  if (elem) elem.style.display = show ? "" : "none"
}


// this function is called on thumbstick event
export function navigateScroll(axis, amount) {
  // navScrolling[axis].active = Math.abs(amount) > 0.2
  // if (!navScrolling[axis].active) {
  //   navScrolling[axis].area = null
  //   return
  // }
  if (axis === AXIS_V) amount = -amount
  navScrolling[axis].amount = amount * 15
  if (Math.abs(navScrolling[axis].amount) < 1) {
    navScrolling[axis].active = false
    return
  }
  navScrolling[axis].active = true
  const dom = document.activeElement
  if (navScrolling.dom !== dom) {
    navScrolling.dom = dom
    navScrolling.rect = dom.getBoundingClientRect()
    navScrolling[axis === AXIS_H ? AXIS_V : AXIS_H].active = false
  }
  const area = findScrollable(navScrolling, axis, true)
  navScrolling[axis].area = area
  if (!area) {
    navScrolling[axis].active = false
    return
  }
  if (navScrolling.running) return true
  window.requestAnimationFrame(function scrl() {
    let set = {}
    for (let axis of [AXIS_V, AXIS_H]) {
      const cur = navScrolling[axis]
      if (!cur.active || !cur.area) continue
      let pos = cur.area.parent[cur.area.readby] + navScrolling[axis].amount
      if (pos > cur.area.fullsize) cur.active = false
      else set[cur.area.moveby] = pos
    }
    navScrolling.running = Object.keys(set).length > 0
    if (navScrolling.running) {
      area.parent.scrollTo({ ...set, behavior: "instant" })
      document.dispatchEvent(new CustomEvent("mdtooltiphide")) // to hide opened tooltips (see angular-material.js)
      window.requestAnimationFrame(scrl)
    }
  })
  return true // we initiated some scrolling
}


function scrollCatch(axis, enable) {
  if (navScrolling.listening[axis] === enable) return
  // console.log(`want to ${enable ? "enable" : "disable"} ${axis} scroll catch...`)
  const cur = isScrolling()
  navScrolling.listening[axis] = enable
  if (cur === isScrolling()) return
  // this will hook the events to UI only, preventing the camera from moving
  bngApi.engineLua(`local o = scenetree.findObject("MenuScrollActionMap"); if o then o:${enable ? "push" : "pop"}() end`)
  if (window.bngVue.uiNavTracker) {
    // TODO: test
    if (enable) window.bngVue.uiNavTracker.addEvent(UI_SCROLL_ACTION_EVENTS[axis], TRACKER_ID)
    else window.bngVue.uiNavTracker.removeEvent(UI_SCROLL_ACTION_EVENTS[axis], TRACKER_ID)
  }
  // console.log(`scroll catch ${enable ? "enabled" : "disabled"} (called by ${axis} scroll event)`)
}


function isScrolling(direction = undefined) {
  let scrolling = false
  if (!direction) scrolling = navScrolling.listening.horizontal || navScrolling.listening.vertical
  else if (direction === DIR.UP || direction === DIR.DOWN) scrolling = navScrolling.listening.vertical
  else if (direction === DIR.LEFT || direction === DIR.RIGHT) scrolling = navScrolling.listening.horizontal
  return scrolling
}
function isScrollListening(axis = undefined) {
  let listening = false
  if (!axis) listening = navScrolling.listening.horizontal || navScrolling.listening.vertical
  else listening = navScrolling.listening[axis]
  return listening
}


function findScrollable(link, axis, thumbstick) {
  // default axis is vertical
  if (axis !== AXIS_V && axis !== AXIS_H) axis = AXIS_V
  const opts = axis === AXIS_H
    ? { moveby: "left", readby: "scrollLeft", size: "width", scroll: "scrollWidth", client: "clientWidth", overflow: "overflow-x" }
    : { moveby: "top", readby: "scrollTop", size: "height", scroll: "scrollHeight", client: "clientHeight", overflow: "overflow-y" }
  let forced = false
  // find scrollable parent
  let parent, fullsize, size
  let node = link.dom?.parentNode
  function setParent(node) {
    if (!node) return
    if (thumbstick) {
      let noNav = node.attributes.getNamedItem(SCROLL_ATTR)
      if (noNav && noNav.value === "false") return
    }
    const styles = document.defaultView.getComputedStyle(node, null)
    // console.log(styles.position, node, node.getBoundingClientRect())
    if (styles[opts.overflow] === "auto" || styles[opts.overflow] === "scroll") {
      fullsize = node[opts.scroll]
      size = node[opts.client]
      // console.log(fullsize, size, node)
      if (fullsize > size) parent = node
    }
  }
  while (node && node.isConnected && node.nodeType === Node.ELEMENT_NODE) {
    // with thumbstick, only look for elements with the scroll attribute
    // without thumbstick, check all parents for scrollability
    // and on top of that, check if elements has anything to scroll to dive further when we're at the end of scroll
    if (!thumbstick || node.attributes.getNamedItem(SCROLL_ATTR)) {
      setParent(node)
      if (parent) break
    }
    node = node.parentNode
  }
  if (!parent) {
    const elems = document.querySelectorAll(`[${SCROLL_FORCE_ATTR}]`)
    for (let elem of elems) {
      setParent(elem)
      if (parent) {
        forced = true
        break
      }
    }
  }
  scrollCatch(axis, !!parent)
  drawScrollHint()
  if (!parent) return null
  let start = 0
  const styles = document.defaultView.getComputedStyle(parent, null)
  // autoscrolling misbehaves? check if position style is defined here
  if (["relative", "absolute", "static", "fixed"].includes(styles.position)) start += parent.getBoundingClientRect()[opts.moveby]
  // calculate the size of view bounds to ensure items visibility
  const pad = link.rect ? Math.max(size / 4, link.rect[opts.size]) : (size / 4)
  const bounds = [start + pad, start + size - pad]
  /// DEBUG
  // const id = `xfline_dbg`
  // let elem = document.getElementById(id)
  // if (!elem) {
  //   elem = document.createElement("div")
  //   elem.setAttribute("id", id)
  //   elem.style.position = "absolute"
  //   elem.style.pointerEvents = "none"
  //   elem.style.zIndex = 1000000
  //   document.body.appendChild(elem)
  // }
  // if (axis === AXIS_H) {
  //   elem.style.top = elem.style.bottom = 0
  //   elem.style.left = `${parent.style.left + bounds[0]}px`
  //   elem.style.width = `${bounds[1] - bounds[0]}px`
  // } else {
  //   elem.style.left = elem.style.right = 0
  //   elem.style.top = `${parent.style.top + bounds[0]}px`
  //   elem.style.height = `${bounds[1] - bounds[0]}px`
  // }
  // elem.style[axis === AXIS_H ? "borderLeft" : "borderTop"] =
  //   elem.style[axis === AXIS_H ? "borderRight" : "borderBottom"] =
  //   "2px dashed magenta"
  /// /DEBUG
  return {
    parent,
    moveby: opts.moveby,
    readby: opts.readby,
    bounds,
    fullsize,
    start: 0,
    finish: fullsize - size,
    forced,
  }
}


// scrolls the items into a narrower view
export function scrollFix(link, direction) {
  const area = findScrollable(link, direction === DIR.UP || direction === DIR.DOWN ? AXIS_V : AXIS_H)
  if (!area) {
    // find if there are something else for thumbstick scroll
    if (document.querySelector(`[${SCROLL_ATTR}], [${SCROLL_FORCE_ATTR}]`))
      findScrollable(link, direction === DIR.LEFT || direction === DIR.RIGHT ? AXIS_V : AXIS_H)
    return
  }
  if (area.forced) return // prevent scrolling forced area with focus on a different element
  let mov = -1
  if (direction === DIR.UP || direction === DIR.DOWN) {
    if (link.rect.top < area.bounds[0]) mov = Math.max(area.parent.scrollTop - area.bounds[0] + link.rect.top, area.start)
    else if (link.rect.bottom > area.bounds[1]) mov = Math.min(area.parent.scrollTop - area.bounds[1] + link.rect.bottom, area.finish)
  } else {
    if (link.rect.left < area.bounds[0]) mov = Math.max(area.parent.scrollLeft - area.bounds[0] + link.rect.left, area.start)
    else if (link.rect.right > area.bounds[1]) mov = Math.min(area.parent.scrollLeft - area.bounds[1] + link.rect.right, area.finish)
  }
  // console.log(JSON.stringify({direction, /*fullheight, height, top, pad,*/ scrolled: area.parent.scrollTop, area.bounds, l_top: link.rect.top, l_bottom: link.rect.bottom, movy}, null, 2))
  if (mov > -1) area.parent.scrollTo({ [area.moveby]: mov, behavior: "instant" }) // smooth|instant
}


function fireKey(element, direction) {
  let key = DIR_KEYS[direction]
  key && dispatchKey(key, element)
}

// Helper function to clear the timer
function clearThumbstickTimer() {
  if (thumbstickState.timer) {
    clearTimeout(thumbstickState.timer)
    thumbstickState.timer = null
  }
}

// TODO: finalize event repeater
function processThumbstickMovement(axis, value, restrictTo) {
  // Invert Y axis values
  if (axis === AXIS_V) {
    value = -value
  }

  const direction = axis === AXIS_H ? (value > 0 ? DIR.RIGHT : DIR.LEFT) : (value > 0 ? DIR.DOWN : DIR.UP)
  const currentDirection = `${axis}:${direction}`

  // If direction changed, reset the timer
  if (currentDirection !== thumbstickState.lastDirection) {
    clearThumbstickTimer()
    thumbstickState.lastDirection = currentDirection
    thumbstickState.isInitial = true
  }

  // Process the movement
  const RESULT = navigate(collectRects(direction, restrictTo), direction)
  if (!RESULT) {
    console.log("Navigation failed")
  }

  // Set up the next movement timer
  // const delay = thumbstickState.isInitial ? THUMBSTICK_INITIAL_DELAY : THUMBSTICK_REPEAT_DELAY
  // thumbstickState.isInitial = false

  // thumbstickState.timer = setTimeout(() => {
  //   if (Math.abs(value) > THUMBSTICK_DEADZONE) {
  //     processThumbstickMovement(axis, value, restrictTo)
  //   }
  // }, delay)
}

let lastTime = 0, lastStack = ""

export function handleUINavEvent(e, restrictTo = undefined) {
  const d = e.detail
  // const globalAngularRootScope = window.globalAngularRootScope
  let handled = false

  // handle scalar thumbstick input
  if (d.name in UI_SCALAR_EVENT_ACTIONS) {
    const axis = UI_SCALAR_EVENT_ACTIONS[d.name]
    const value = d.value
    if (value !== 0 && THUMBSTICK_DEADZONE > 0 && Math.abs(value) > THUMBSTICK_DEADZONE) {
      const adjustedValue = (axis === AXIS_V ? -value : value) > 0 ? 1 : -1
      const direction = axis === AXIS_H
        ? (adjustedValue > 0 ? DIR.RIGHT : DIR.LEFT)
        : (adjustedValue > 0 ? DIR.DOWN : DIR.UP)

      if (lastScalarValue[axis] !== adjustedValue) {
        lastScalarValue[axis] = adjustedValue
        navigate(collectRects(direction, restrictTo), direction)
      }
    } else {
      lastScalarValue[axis] = 0
    }
    handled = true
  }

  // simple navigation, clicks, tabs
  if (d.name in UI_NAV_EVENT_ACTIONS) {
    const action = UI_NAV_EVENT_ACTIONS[d.name]

    switch (action) {

      // Navigate
      case "up":
      case "down":
      case "left":
      case "right":
        if (d.value == 1) {
          /// in case you will find crossfire skipping elements, try to uncomment this
          // const time = Date.now()
          // const stack = new Error().stack
          // if (time - lastTime < 50) {
          //   console.log("too fast!", time - lastTime, "\nprev:", lastStack, "\nnew:", stack)
          // }
          // lastStack = stack
          // lastTime = time
          navigate(collectRects(action, restrictTo), action)
          handled = true
        }
        break

      // Click
      case "confirm":
        if (d.value == 1) {
          const activeEl = document.activeElement
          if (isNavigable(activeEl)) {
            if (typeof activeEl.click === "function") {
              activeEl.click()
            } else {
              activeEl.dispatchEvent(new CustomEvent("click"))
            }
          }
          handled = true
        }
        break

      // Tab left and right (TODO - move away from Angular broadcast here, eventually)
      // case "tab_l":
      //   if (d.value == 1) {
      //     globalAngularRootScope && globalAngularRootScope.$broadcast("$tabLeft")
      //     handled = true
      //   }
      //   break
      // case "tab_r":
      //   if (d.value == 1) {
      //     globalAngularRootScope && globalAngularRootScope.$broadcast("$tabRight")
      //     handled = true
      //   }
      //   break

    }

  // scroll scrollable areas
  } else if (d.name in UI_SCROLL_EVENT_ACTIONS) {
    const axis = UI_SCROLL_EVENT_ACTIONS[d.name]
    navigateScroll(axis, d.value)
    // wth? it's very expensive to do on every tick
    // handled = !!findScrollable(navScrolling, UI_SCROLL_EVENT_ACTIONS[SCROLL_EVENT_H], true) ||
    //           !!findScrollable(navScrolling, UI_SCROLL_EVENT_ACTIONS[SCROLL_EVENT_V], true) ||
    //           navScrolling.horizontal.active || navScrolling.vertical.active
    // proper way to check
    // handled = isScrolling()
    // even better in case of uinav
    handled = isScrollListening(axis)
  }

  if (handled) {
    e.preventDefault()
  }

}
