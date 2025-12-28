const DELAY = 300 // time window for double click
const EVENTS_IN = ["uinav-focus", "focus", "focusin"]
const EVENTS_OUT = ["uinav-blur", "blur", "focusout"]

const elems = new Map()
let globInit = false

function initGlobals() {
  globInit = true
  let running = false
  const targets = { in: [], out: [] }
  function preventer() {
    // check for element and if it's in capture mode, stop the timer if it's running
    for (const [part, list] of Object.entries(targets)) {
      if (list.length === 0) continue
      // console.log("preventer", part, list)
      for (const target of list) {
        for (const [uid, data] of elems) {
          if (!data.capture || !data.timer || !data.element) continue
          if (part === "in") {
            if (data.element === target || data.element.contains(target)) continue
          } else {
            // only skip clearing if blur is NOT from our element or children
            if (data.element !== target && !data.element.contains(target)) continue
          }
          clearTimeout(data.timer)
          data.timer = null
          break
        }
      }
      list.splice(0)
    }
  }
  function handler(evt, eventIn) {
    // gather targets from all events that fired at the same frame and run preventer on the next frame
    if (elems.size === 0) return // don't do anything if no elements are registered
    const target = evt.detail?.target || evt.target
    if (!target) return
    const part = eventIn ? "in" : "out"
    if (!targets[part].includes(target)) targets[part].push(target)
    if (running) return
    running = true
    window.requestAnimationFrame(() => {
      preventer()
      running = false
    })
  }
  EVENTS_IN.forEach(evt => document.addEventListener(evt, evt => handler(evt, true), true))
  EVENTS_OUT.forEach(evt => document.addEventListener(evt, evt => handler(evt, false), true))
}

function createHandler(data) {
  if (data.capture) {
    // click capture mode (a bit less performant)
    return evt => {
      if (evt.detail?.doubleToSingle) return
      evt.preventDefault()
      evt.stopImmediatePropagation()
      if (data.timer) {
        clearTimeout(data.timer)
        data.timer = null
        data.callback?.()
      } else {
        data.timer = setTimeout(() => {
          data.timer = null
          const click = new CustomEvent("click", {
            ...evt,
            bubbles: true,
            cancelable: true,
            detail: { doubleToSingle: true },
          })
          data.element.dispatchEvent(click)
        }, DELAY)
      }
    }
  } else {
    // normal mode (a bit more performant)
    return () => {
      if (data.timer) {
        clearTimeout(data.timer)
        data.timer = null
      }
      const now = Date.now()
      if (data.time && now - data.time <= DELAY) {
        data.time = 0
        data.callback?.()
        return
      }
      data.time = now
    }
  }
}

function update(vnode, callback = undefined, mod = {}) {
  !globInit && initGlobals()
  const el = vnode?.el
  if (!el) return
  const uid = vnode?.component?.uid || vnode?.key || el
  const capture = !!mod.capture
  const data = elems.get(uid) || { }
  if (data.handler && data.element === el && callback && "callback" in data && data.callback === callback && data.capture === capture) {
    // ignore "false" update that sometimes happen in vue
    return
  }
  if (!("element" in data)) {
    // first time
    data.element = el
    data.callback = callback
    data.capture = capture
  }
  if (data.handler && (!callback || data.capture !== capture || data.element !== el)) {
    // remove handler if no callback or capture mode changed
    delete data.callback // for slow event handling
    el.removeEventListener("click", data.handler, { capture: data.capture })
    elems.delete(uid)
  }
  if (!callback) return // no callback, nothing to do
  if (!data.handler) {
    // fresh start (first time or when capture mode changed)
    data.capture = capture
    data.handler = createHandler(data)
    el.addEventListener("click", data.handler, { capture })
    elems.set(uid, data)
  } else {
    // update callback only
    data.callback = callback
  }
}

export default {
  mounted: (el, { value, modifiers, arg } = {}, vnode) => update(vnode || { el }, value, { capture: arg === "capture", ...modifiers }),
  updated: (el, { value, modifiers, arg } = {}, vnode) => update(vnode || { el }, value, { capture: arg === "capture", ...modifiers }),
  unmounted: (el, vnode) => update(vnode || { el }),
}
