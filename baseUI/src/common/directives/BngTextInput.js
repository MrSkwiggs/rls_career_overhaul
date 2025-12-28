import { useBridge } from "@/bridge"
import { useSteamDeckInput } from "@/services/steamdeck"
import { uniqueId } from "@/services/uniqueId"

let bridge
let focused = false
const elms = {}
const elmid = "__BNG_TEXT_INPUT" // see also beamng-core.js

const focus = id => async () => {
  elms[id].active = true
  if (!focused) {
    await bridge.lua.setCEFTyping(true)
    focused = true
  }
}
const blur = id => async () => {
  elms[id].active = false
  if (focused) {
    focused = Object.values(elms).some(e => e.active)
    if (!focused) await bridge.lua.setCEFTyping(false)
  }
}

export default {
  mounted(el) {
    if (!bridge) {
      bridge = useBridge()
      bridge.events.on("CEFTypingLostFocus", () => focused && document.activeElement.blur())
    }
    const id = el[elmid] || (el[elmid] = uniqueId())
    elms[id] = {
      el,
      active: false,
      onFocus: focus(id),
      onBlur: blur(id),
    }
    el.addEventListener("focus", elms[id].onFocus)
    el.addEventListener("blur", elms[id].onBlur)
    useSteamDeckInput(el)
  },
  beforeUnmount(el) {
    const id = el[elmid]
    if (elms[id]) {
      el.removeEventListener("focus", elms[id].onFocus)
      el.removeEventListener("blur", elms[id].onBlur)
      elms[id].onBlur()
      delete elms[id]
    }
  },
}
