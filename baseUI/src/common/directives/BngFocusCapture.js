import { collectRects, isNavigable } from "@/services/crossfire"
import useControls from "@/services/controls"
import { setFocus } from "@/services/uiNavFocus"
import { watch, nextTick } from "vue"
import { storeToRefs } from "pinia"
import { uniqueId } from "@/services/uniqueId"

const EVENTS = {
  focus: ["uinav-focus", "focus", "focusin", "click"],
  hide: ["mouseenter"],
  show: ["uinav-blur", "blur", "focusout", "mouseleave"],
}
const EVENT_CALLS = Object.entries(EVENTS).reduce((res, [name, events]) => {
  events.forEach(event => res[event] = name)
  return res
}, {})

const ID = "__bngFocusCapture"
const elms = {}
let isController // computed

function setupController() {
  if (isController) return
  isController = storeToRefs(useControls()).isControllerUsed // this is a special case, in which we need to use either isControllerUsed or isControllerAvailable
  watch(isController, val => {
    for (const data of Object.values(elms)) {
      if (val) data.show()
      else data.hide()
    }
  })
}

function getClosestNavigable(elm) {
  const target = collectRects("down", elm).down[0]?.dom
  return target && isNavigable(target) ? target : null
}

function update(data, value, firstTime = false) {
  if (typeof value === "function") {
    // setup custom handler
    // data.handler = () => value(data.parent) || getClosestNavigable(data.parent) // don't, since we want cancel any kind of navigation when custom handler is used
    data.handler = () => {
      let elm = value(data.parent)
      return elm?.$el || elm
    }
    delete data.disabled
  } else if (typeof value === "boolean" && !value) {
    data.disabled = true
  } else {
    delete data.disabled
  }
  // sync state
  if (data.disabled) {
    data.hide()
    if (!firstTime) { // if disabled right from the start, there's nothing to remove
      data.capture.remove()
      for (const event in EVENT_CALLS) {
        data.parent.removeEventListener(event, data[EVENT_CALLS[event]])
      }
    }
  } else {
    data.parent.appendChild(data.capture)
    data.show()
    for (const event in EVENT_CALLS) {
      data.parent.addEventListener(event, data[EVENT_CALLS[event]])
    }
  }
}

export default {
  mounted(elm, { arg, value }) {
    setupController()

    const id = uniqueId(ID)
    const parent = elm
    const capture = document.createElement("div")

    const data = {
      id,
      shown: true,
      parent,
      capture,
      handler: () => getClosestNavigable(data.parent),
    }

    elms[id] = data
    parent[ID] = id

    // setup capture element
    capture.className = "bng-focus-capture"
    capture.style.setProperty("position", "absolute", "important")
    capture.style.setProperty("display", "block", "important")
    capture.style.setProperty("top", "0%", "important")
    capture.style.setProperty("left", "0%", "important")
    capture.style.setProperty("width", "100%", "important")
    capture.style.setProperty("height", "100%", "important")
    // capture.style.setProperty("border", "1px dashed #f0f", "important") // for debug
    capture.style.setProperty("z-index", (arg && /^\d+$/.test(arg) ? arg : "1000"), "important")
    capture.style.setProperty("pointer-events", "all", "important")
    capture.setAttribute("bng-nav-item", "")
    capture.setAttribute("tabindex", "0")

    // focus handler
    data.focus = () => {
      data.hide()
      if (!isController.value) return
      const active = document.activeElement
      if (active !== data.capture && data.parent.contains(active)) return
      // console.log("focus", active)
      if (data.handler) {
        let elm = data.handler(data.parent)
        if (elm) nextTick(() => setFocus(elm))
      }
    }

    // hide/show capture element
    data.hide = () => {
      if (!data.shown) return
      data.shown = false
      capture.style.setProperty("pointer-events", "none", "important")
    }
    data.show = (evt) => {
      if (data.shown) return
      data.shown = true
      if (data.disabled || !isController.value) return
      const active = document.activeElement
      if (data.parent.contains(active)) return // when mouseleave happens while focused inside
      const target = evt?.relatedTarget || evt?.target || active
      if (!data.parent.contains(target)) {
        capture.style.setProperty("pointer-events", "all", "important")
      }
    }

    update(data, value, true)
  },
  updated(elm, { arg, value }) {
    const id = elm[ID]
    if (!id) return
    const data = elms[id]
    if (!data) return
    update(data, value)
  },
  unmounted(elm) {
    const id = elm[ID]
    if (!id) return
    delete elm[ID]
    const data = elms[id]
    if (!data) return
    data.capture.remove()
    for (const event in EVENT_CALLS) {
      data.parent.removeEventListener(event, data[EVENT_CALLS[event]])
    }
    delete elms[id]
  },
}
