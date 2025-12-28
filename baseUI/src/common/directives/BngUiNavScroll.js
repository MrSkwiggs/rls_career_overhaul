import { SCROLL_ATTR, SCROLL_FORCE_ATTR, SCROLL_EVENT_H, SCROLL_EVENT_V } from "@/services/crossfire"
import { useUINavTracker, useUiNavLabel } from "@/services/uiNavTracker"
import { uniqueId } from "@/services/uniqueId"

const SCROLL_PROP = "__bngUiNavScroll"
// const SCROLL_STRING = "ui.mainmenu.navbar.scroll_label"

function enableScroll(id, el) {
  const tracker = useUINavTracker()
  // const labeler = useUiNavLabel()
  tracker.addEvent(SCROLL_EVENT_H, id, el)
  tracker.addEvent(SCROLL_EVENT_V, id, el)
  tracker.addForceUnblock(SCROLL_EVENT_H, id)
  tracker.addForceUnblock(SCROLL_EVENT_V, id)
  // labeler.registerLabel(el, [SCROLL_EVENT_H, SCROLL_EVENT_V], SCROLL_STRING)
}
function disableScroll(id, el) {
  const tracker = useUINavTracker()
  // const labeler = useUiNavLabel()
  tracker.removeEvent(SCROLL_EVENT_H, id, el)
  tracker.removeEvent(SCROLL_EVENT_V, id, el)
  tracker.removeForceUnblock(SCROLL_EVENT_H, id)
  tracker.removeForceUnblock(SCROLL_EVENT_V, id)
  // labeler.clearLabels(el, [SCROLL_EVENT_H, SCROLL_EVENT_V])
}

export default {
  mounted(element, { arg, value, modifiers }) {
    const prev = element[SCROLL_PROP] || {}
    const dir = {
      id: prev.id || uniqueId(SCROLL_PROP),
      forced: modifiers.force,
      enable: () => enableScroll(dir.id, element),
      disable: () => disableScroll(dir.id, element),
    }
    element[SCROLL_PROP] = dir
    if (prev.forced) {
      element.removeEventListener("focusin", prev.enable)
      element.removeEventListener("focusout", prev.disable)
    }
    if (typeof value === "boolean" && !value) {
      if (prev.id) prev.disable()
      dir.forced = false
      return
    }
    if (dir.forced) {
      element.setAttribute(SCROLL_FORCE_ATTR, "")
      dir.enable()
    } else {
      element.setAttribute(SCROLL_ATTR, "")
      element.addEventListener("focusin", dir.enable)
      element.addEventListener("focusout", dir.disable)
    }
  },
  beforeUnmount(element) {
    const dir = element[SCROLL_PROP]
    if (!dir) return
    if (!dir.forced) {
      element.removeEventListener("focusin", dir.enable)
      element.removeEventListener("focusout", dir.disable)
    }
    dir.disable()
    delete element[SCROLL_PROP]
  },
}
