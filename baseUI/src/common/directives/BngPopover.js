import { usePopover } from "@/services/popover"

const HOVER_SHOW_EVENTS = ["mouseover", "focus"]
const HOVER_HIDE_EVENTS = ["mouseleave", "blur"]
const TOGGLE_EVENTS = ["click"]

/**
 * @brief BngPopup
 * @description a directive that transforms an element/component into a popup and anchors it to a target element/component
 */
export default {
  mounted: setup,
  updated: setup,
  onBeforeUnmount: dispose,
}

function setup(el, binding) {
  dispose(el)

  if (!binding.value) return

  setPopoverProperties(el, binding)
  bindPopover(el)
  attachListeners(el, binding.modifiers)
}

function dispose(el) {
  if (el.__popover) {
    if (el.__popover.unregister) el.__popover.unbind()
    removeListeners(el)
  }
}

function attachListeners(el, modifiers) {
  el.__popover.showHandler = event => {
    if (el.contains(event.target)) {
      el.__popover.show()
    }
  }

  el.__popover.hideHandler = event => {
    if (!el.contains(event.relatedTarget)) {
      el.__popover.hide()
    }
  }

  el.__popover.toggleHandler = event => {
    if (el.contains(event.target)) {
      el.__popover.toggle()
    }
  }

  el.__popover.clickOutside = event => {
    if (!el.contains(event.target) && (!el.__popover.element.value || !el.__popover.element.value.contains(event.target))) {
      el.__popover.hide()
    }
  }

  if (modifiers.click) {
    TOGGLE_EVENTS.forEach(eventName => {
      el.addEventListener(eventName, el.__popover.toggleHandler)
    })
    TOGGLE_EVENTS.forEach(eventName => {
      window.addEventListener(eventName, el.__popover.clickOutside)
    })
  } else {
    HOVER_SHOW_EVENTS.forEach(eventName => el.addEventListener(eventName, el.__popover.showHandler))
    HOVER_HIDE_EVENTS.forEach(eventName => el.addEventListener(eventName, el.__popover.hideHandler))
  }
}

function removeListeners(el) {
  if (el.__popover.toggleHandler) {
    TOGGLE_EVENTS.forEach(eventName => {
      el.removeEventListener(eventName, el.__popover.toggleHandler)
    })
    TOGGLE_EVENTS.forEach(eventName => {
      window.removeEventListener(eventName, el.__popover.clickOutside)
    })
  }

  if (el.__popover.showHandler) {
    HOVER_SHOW_EVENTS.forEach(eventName => el.removeEventListener(eventName, el.__popover.showHandler))
  }

  if (el.__popover.hideHandler) {
    HOVER_SHOW_EVENTS.forEach(eventName => el.removeEventListener(eventName, el.__popover.hideHandler))
  }
}

function bindPopover(el) {
  const popover = usePopover()
  const popoverBind = popover.bind(el.__popover.name, el, getOptions(el))

  Object.assign(el.__popover, {
    toggle: popoverBind.toggle,
    show: popoverBind.show,
    isShown: popoverBind.isShown,
    hide: popoverBind.hide,
    toggle: popoverBind.toggle,
    hidden: popoverBind.hidden,
    element: popoverBind.popoverElement,
    unbind: popoverBind.unbind,
  })
}

function setPopoverProperties(el, binding) {
  el.__popover = {
    name: getPopoverName(binding),
    placement: getPlacement(binding),
  }
}

const getOptions = el => {
  return {
    placement: el.__popover.placement,
  }
}

const getPlacement = binding => {
  if (binding.arg) return binding.arg

  return binding.placement ? binding.placement : "left"
}

const getPopoverName = binding => {
  if (typeof binding.value === "string") return binding.value
  return binding.value.name
}
