import { watch, nextTick } from "vue"
import { storeToRefs } from "pinia"
import useControls from "@/services/controls"
import { isNavigable, navigate, collectRects, focusOnElement, scrollFix, isOccluded } from "@/services/crossfire"

const direction = "right" // default direction for crossfire

const focusClass = "focus-visible"

let isController = { value: false } // will become computed after init

const now = () => new Date().getTime()

let inited = false
let gamepadInited = false
const elms = [] // { elm, priority, time }


function setFocus(elm, enable = true) {
  if (enable) {
    elm.classList.add(focusClass)
    if (elm === document.activeElement) return
  } else {
    elm.classList.remove(focusClass)
    if (elm !== document.activeElement) return
  }
  try {
    if (enable) {
      focusOnElement(elm)
    // } else if (elm.nodeName !== "INPUT" || (elm.nodeName === "INPUT" && elm.type.toLowerCase() !== "text")) {
    //   elm.blur()
    }
  } catch (err) { }
}

/**
 * Sets focus and enables focus frame if appropriate.
 * @param {Element} elm Element to focus on
 * @param {boolean} [enable=true] Whether to enable focus frame
 */
function setFocusExternal(elm, enable = true, attemptScroll = true) {
  if (!elm) return false
  !gamepadInited && gamepadInit()
  if (enable && !isController.value) {
    if (attemptScroll) {
      // when we don't have a controller connected, do a scroll at least
      // console.log("scrollFix", isOccluded(elm), elm, new Error().stack)
      isOccluded(elm, true) && scrollFix({ dom: elm, rect: elm.getBoundingClientRect() }, "down")
    }
    return false
  }
  setFocus(elm, enable)
  return true
}
export { setFocusExternal as setFocus }

/**
 * Ensures focus and focus frame are there when appropriate.
 * @param {Element} elm Element to check focus on
 * @param {boolean} [onNextTick=true] Whether to apply changes on next tick or immediately
 * @example `onUpdated(() => ensureFocus(elementRef.value))`
 */
export function ensureFocus(elm, onNextTick = true) {
  if (!elm) return
  !gamepadInited && gamepadInit()
  if (!isController.value) return
  if (document.activeElement === elm && !elm.classList.contains(focusClass)) {
    if (onNextTick) {
      nextTick(() => elm && setFocus(elm))
    } else {
      setFocus(elm)
    }
  }
}

function gamepadInit() {
  if (gamepadInited) return
  gamepadInited = true
  isController = storeToRefs(useControls()).focusIfController
}

function init() {
  if (inited) return
  inited = true
  gamepadInit()
  // focusing on active or first element when gamepad becomes connected
  watch(isController, val => {
    const active = document.activeElement
    // in case we already had something focused with crossfire
    if (isNavigable(active)) {
      const focused = active.classList.contains(focusClass)
      if (val && !focused) {
        setFocus(active, true)
      } else if (!val && focused) {
        setFocus(active, false)
      }
      return
    }
    if (val) {
      // find the most priority element to focus on
      if (priorityFocus()) return
      // use default crossfire action
      if (navigate(collectRects(direction), direction)) {
        window.requestAnimationFrame(() => setFocus(document.activeElement, true))
      }
    }
  })
}

export function priorityFocus() {
  collectRects(direction)
  for (const { elm } of elms) {
    if (isNavigable(elm)) {
      setFocus(elm, true)
      return true
    }
  }
  return false
}

export function wantsFocus(elm, priority) {
  // if (typeof priority === "undefined") priority = 0
  // else if (typeof priority !== "number" || isNaN(priority)) return
  // init if not done that yet
  if (!inited) init()
  // modify or create
  const dat = elms.find(itm => itm.element === elm) || { elm, time: now() }
  const isNew = !("priority" in dat)
  if (typeof priority !== "number" || isNaN(priority)) {
    if (!isNew) {
      const idx = elms.findIndex(itm => itm.elm === elm)
      if (idx > -1) elms.splice(idx, 1)
    }
    return
  }
  dat.priority = priority
  if (isNew) elms.push(dat)
  // sort by priority or time
  elms.sort((a, b) => b.priority - a.priority || b.time - a.time)
  // setup crossfire, so it'll recognise elements for isNavigable, and to make elements focusable
  collectRects(direction, elm.parentNode)
  // focus
  if (isNew && isController.value && !isNavigable(document.activeElement)) {
    priorityFocus()
  }
}

export function unwantsFocus(elm) {
  const idx = elms.findIndex(itm => itm.elm === elm)
  if (idx === -1) return
  elms.splice(idx, 1)
  // focus
  if (isController.value && !isNavigable(document.activeElement)) {
    priorityFocus()
  }
}

export function initFocusVisible() {
  const ensure = true // flag to ensure focus is maintained during the attempt to focus (patch to help with alternative engine)
  // note: there's another quirk with that engine that sometimes makes it focus one more time right after previous attempt was finished, and it's somehow a "different" target
  const raf = window.requestAnimationFrame
  let curFocused = null
  let holdFocus = false

  function notify(type, target, relatedTarget) {
    const evt = new CustomEvent("uinav-" + type, {
      bubbles: true,
      cancelable: true,
      detail: {
        target,
        relatedTarget,
      }
    })
    document.dispatchEvent(evt)
  }

  // document.addEventListener("uinav-focus", evt => console.log("uinav-focus", evt), true)
  // document.addEventListener("uinav-blur", evt => console.log("uinav-blur", evt), true)

  function procFocus(target, relatedTarget) {
    if (target && target === curFocused) return
    if (relatedTarget === target) relatedTarget = undefined
    if (relatedTarget) doBlur(relatedTarget)
    if (curFocused) {
      if (!relatedTarget || relatedTarget !== curFocused) relatedTarget = curFocused
      doBlur(curFocused)
      curFocused = null
    }
    if (!target) return
    try {
      // console.log("procFocus", target)

      // ensure that target is focusable
      if (target.disabled) return
      if ("tabIndex" in target) {
        if (typeof target.tabIndex === "string" && target.tabIndex === "-1") return
        if (typeof target.tabIndex === "number" && target.tabIndex === -1) return
        if (target.tabIndex === "") return
      } else if ("contentEditable" in target) {
        if (typeof target.contentEditable === "string" && target.contentEditable !== "true") return
        if (typeof target.contentEditable === "boolean" && !target.contentEditable) return
      } else {
        return
      }
      const style = window.getComputedStyle(target)
      if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") return

      // set focus-visible class
      if (isController.value) target.classList.add(focusClass)
      curFocused = target

      if (!focusRegistry.includes(target)) focusRegistry.push(target)

      if (ensure && document.activeElement !== curFocused) {
        // ensure will help with some weirdness by attempting to keep the focus on the target
        holdFocus = true
        let holdFocusCounter = 0
        raf(function check() {
          if (!curFocused || holdFocusCounter > 10 || document.activeElement === curFocused) {
            holdFocus = false
            if (!curFocused || target !== curFocused) {
              // console.log("procFocus ABORT - target changed")
              doBlur(target)
            } else {
              notify("focus", curFocused, relatedTarget)
              // console.log("procFocus DONE")
            }
          } else {
            // console.log("procFocus retrying to focus...")
            holdFocusCounter++
            curFocused.focus()
            raf(check)
          }
        })
      } else {
        notify("focus", target, relatedTarget)
        // console.log("procFocus DONE")
      }
    } catch (e) { }
  }

  function doBlur(target) {
    if (!target) return
    if (holdFocus && target === curFocused) return
    try {
      // console.log("doBlur", target)
      target.classList.remove(focusClass)
      if (target === curFocused) curFocused = null
      const idx = focusRegistry.indexOf(target)
      if (idx !== -1) {
        focusRegistry.splice(idx, 1)
        notify("blur", target)
      }
    } catch (e) { }
  }

  document.addEventListener("focusin", evt => procFocus(evt.target, evt.relatedTarget), true)
  document.addEventListener("focusout", evt => doBlur(evt.target), true)

  const focusRegistry = []
  const originalFocus = HTMLElement.prototype.focus.__original__ || HTMLElement.prototype.focus
  const originalBlur = HTMLElement.prototype.blur.__original__ || HTMLElement.prototype.blur
  HTMLElement.prototype.focus = function (...args) {
    const target = this
    const prevFocused = document.activeElement
    // check focus-visible for safety
    if (!prevFocused.classList.contains(focusClass)) {
      if (focusRegistry.length > 0) {
        focusRegistry.forEach(elm => elm !== target && elm.blur())
      } else {
        document.querySelectorAll("." + focusClass).forEach(elm => elm !== target && doBlur(elm))
      }
    }
    originalFocus.apply(target, args)
    procFocus(target, prevFocused)
    // if (!focusRegistry.includes(this)) focusRegistry.push(this)
  }
  HTMLElement.prototype.blur = function (...args) {
    doBlur(this)
    originalBlur.apply(this, args)
    // const idx = focusRegistry.indexOf(this)
    // if (idx !== -1) focusRegistry.splice(idx, 1)
  }
  HTMLElement.prototype.focus.__original__ = originalFocus
  HTMLElement.prototype.blur.__original__ = originalBlur
}
