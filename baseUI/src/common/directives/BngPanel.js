import { vBngOnUiNav } from "@/common/directives"
// import { UI_EVENTS } from "@/bridge/libs/UINavEvents.js"
import { UI_EVENTS } from "@/services/uiNav"
import { ref, watch, nextTick } from "vue"
import { handleUINavEvent as sendToCrossfire, NAVIGABLE_ELEMENTS_SELECTOR } from "@/services/crossfire"
import { setFocus } from "@/services/uiNavFocus"

export const PANEL_DETAIL = Symbol("PANEL_DETAIL")
const IS_PANEL_ATTR = 'is-bng-panel'

const DEFAULT_OPTS = {
  intiallyOpen: false,
  navEventToOpen: UI_EVENTS.ok,
  navEventToClose: UI_EVENTS.back,
}

export default (panelEl, binding, vnode) => {
  if (panelEl[PANEL_DETAIL]) return

  const opts = { ...DEFAULT_OPTS, ...binding.value }
  const isOpen = ref(opts.intiallyOpen)

  const setOpen = (state = true, wasManual = true) => {
    const wasOpen = isOpen.value
    isOpen.value = state
    if (wasManual) {
      if (isOpen.value) {
        const goto = panelEl.querySelector(NAVIGABLE_ELEMENTS_SELECTOR)
        goto && nextTick(()=>goto.focus())
      } else {
        setFocus(panelEl)
      }
    }
    // When dealing with nested panels - it's a good idea to name them (v-bng-panel="{name:'panelName'}") - will assist with the panelOpen/Close events
    // to check which panel is relevant
    if (wasOpen!== isOpen.value) {
      const activePanel = document.activeElement.closest(`[${IS_PANEL_ATTR}]`)
      if (activePanel) opts.activeName = activePanel[PANEL_DETAIL].name
      panelEl.dispatchEvent(new CustomEvent(isOpen.value ? "panelopen" : "panelclose", { bubbles: true, detail: opts }))
    }
    return false
  }

  const openPanel = () => {
    if (!isOpen.value) return setOpen()
    return true
  }
  const closePanel = () => {
    if (isOpen.value) return setOpen(false)
    return true
  }
  const topLevelHandler = e => {
    let bubble = true
    if (isOpen.value) {
      e.detail.sendToCrossfire = false
      sendToCrossfire(e, panelEl)
      bubble = false
    }
    return bubble
  }

  // set up UI Nav Event Handlers

  // v-bng-on-ui-nav:ok.focusRequired="open"
  const openBinding = {
    arg: opts.navEventToOpen,
    modifiers: { focusRequired: true },
    value: openPanel,
  }
  vBngOnUiNav.mounted(panelEl, openBinding, vnode)

  // v-bng-on-ui-nav:back="close"
  const closeBinding = {
    arg: opts.navEventToClose,
    value: closePanel,
  }
  vBngOnUiNav.mounted(panelEl, closeBinding, vnode)

  // v-bng-on-ui-nav:*="topHandle"
  const crossfireBinding = {
    arg: "*",
    value: topLevelHandler,
  }
  vBngOnUiNav.mounted(panelEl, crossfireBinding, vnode)

  // set handlers on element to handle 'normal' events and open/close panel accordingly
  panelEl.addEventListener("focusout", e => {
    if (!panelEl.contains(e.relatedTarget) && isOpen.value) {
      setOpen(false, false)
    } else if (panelEl != document.activeElement && panelEl.contains(document.activeElement)) {
      setOpen(true, false)
    }
    e.stopPropagation()
  })
  panelEl.addEventListener("focusin", e => {
    if (panelEl != document.activeElement && panelEl.contains(document.activeElement)) setOpen(true, false)
    e.stopPropagation()
  })
  panelEl.addEventListener("mousedown", e => {
    if (e.target == e.currentTarget && isOpen.value && panelEl.contains(document.activeElement)) {
      document.activeElement.focus()
      e.preventDefault()
    }
  })

  // set bng-nav-item attribute
  panelEl.setAttribute("bng-nav-item", "")

  // set bng-no-nav [true/false] attribute based on open status
  watch(isOpen, (isOpen, wasOpen) => (wasOpen != isOpen) && panelEl.setAttribute("bng-no-nav", isOpen))

  // mark element as panel, and store some details
  panelEl.setAttribute(IS_PANEL_ATTR, "")
  panelEl[PANEL_DETAIL] = {
    isOpen,
    ...opts
  }

  // initially open if set to do so
  if (opts.intiallyOpen) setOpen()
}
