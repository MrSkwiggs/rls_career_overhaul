/**
 * @brief BngTooltip
 * @description a directive that adds a tooltip to an element
 * @usage `v-bng-tooltip:top="top text"`
 * @usage `v-bng-tooltip:left="left text"`
 * @usage `v-bng-tooltip:right="right text"`
 * @usage `v-bng-tooltip:bottom="bottom text"`
 * @usage `v-bng-tooltip:top="{'text': 'tooltip text', hideDelay: 500}"
 * @usage `v-bng-tooltip="{'text': 'tooltip text', hideDelay: 500, position: 'top'}"
 */

import { ref } from "vue"
import { usePopover } from "@/services/popover"
import { $content } from "@/services"
import { uniqueId } from "@/services/uniqueId"

const DEFAULT_POSITION = "left"
const TOOLTIP_ATTR_NAME = "data-bng-tooltip"
const CONTENT_ATTR_NAME = "data-bng-tooltip-content"
const ARROW_ATTR_NAME = "data-bng-tooltip-arrow"

const SHOW_TOOLTIP_EVENTS = ["mouseover", "focusin"]
const HIDE_TOOLTIP_EVENTS = ["mouseout", "focusout"]

const DATA_PROP = "__bngTooltip"
const POPOVER_CONTAINER = ".popover-container"

export default {
  beforeMount(el) {
    initTooltipData(el)
  },
  mounted(el, binding, vnode) {
    setupBindings(el, binding)
    setupTooltip(el)
    setListeners(el)
  },
  beforeUpdate(el, binding) {
    setupBindings(el, binding)

    // if no value, remove tooltip
    if (el[DATA_PROP].text === undefined) {
      removeTooltip(el)
    } else {
      updateTooltipElement(el)
    }
  },
  updated(el) {
    const data = el[DATA_PROP]
    if (data.update) requestAnimationFrame(() => data.update())
  },
  beforeUnmount(el) {
    SHOW_TOOLTIP_EVENTS.forEach(eventName => el.removeEventListener(eventName, el.__showTooltip))
    HIDE_TOOLTIP_EVENTS.forEach(eventName => el.removeEventListener(eventName, el.__hideTooltip))
    const data = el[DATA_PROP]
    if (data.dispose) data.dispose()
    removeTooltip(el)
  },
}

function setListeners(el) {
  const data = el[DATA_PROP]
  if (!data.showTooltip) {
    data.showTooltip = event => {
      // cancel pending
      if (data.hideDelay) {
        clearTimeout(data.hideDelay)
        data.hideDelay = null
      }
      if (data.tooltipAnimationFrame) {
        cancelAnimationFrame(data.tooltipAnimationFrame)
        data.tooltipAnimationFrame = null
      }

      if (el.contains(event.target) && !data.tooltipElRef.value) {
        queueTooltipUpdate(el, true)
      }
    }
    SHOW_TOOLTIP_EVENTS.forEach(eventName => el.addEventListener(eventName, data.showTooltip, true))
  }

  if (!data.hideTooltip) {
    data.hideTooltip = event => {
      // cancel pending
      if (data.tooltipAnimationFrame) {
        cancelAnimationFrame(data.tooltipAnimationFrame)
        data.tooltipAnimationFrame = null
      }

      if (!el.contains(event.relatedTarget) && data.tooltipElRef.value) {
        queueTooltipUpdate(el, false)
      }
    }
    HIDE_TOOLTIP_EVENTS.forEach(eventName => el.addEventListener(eventName, data.hideTooltip, true))
  }
}

function setupBindings(el, binding) {
  if (binding.value) {
    const bindingValues = getBindings(binding)
    el[DATA_PROP].text = bindingValues.text
    el[DATA_PROP].hideDelayTime = bindingValues.hideDelay
    el[DATA_PROP].position = bindingValues.position
    el[DATA_PROP].isBBCode = bindingValues.isBBCode
    el[DATA_PROP].style = bindingValues.style
  } else {
    resetTooltipData(el)
  }
}

function queueTooltipUpdate(el, shouldShow) {
  const data = el[DATA_PROP]

  // Cancel any pending frame
  if (data.tooltipAnimationFrame) {
    cancelAnimationFrame(data.tooltipAnimationFrame)
  }

  // Update pending state
  data.pendingTooltipState = shouldShow

  // Queue the update
  data.tooltipAnimationFrame = requestAnimationFrame(() => {
    if (data.pendingTooltipState) {
      showTooltip(el)
    } else {
      hideTooltip(el)
    }
    data.tooltipAnimationFrame = null
    data.pendingTooltipState = null
  })
}

function showTooltip(el) {
  const data = el[DATA_PROP]
  if (!data.text) return

  addTooltip(el)

  const popover = usePopover()
  popover.show(data.popoverName, el)
}

function hideTooltip(el) {
  const data = el[DATA_PROP]
  const hideFn = () => {
    removeTooltip(el)
  }

  if (data.hideDelayTime && typeof data.hideDelayTime === "number" && data.hideDelayTime > 0) {
    data.hideDelay = setTimeout(() => {
      hideFn()
      data.hideDelay = null
    }, data.hideDelayTime)
  } else {
    hideFn()
  }
}

function setupTooltip(el) {
  const data = el[DATA_PROP]

  const popover = usePopover()
  const popoverInstance = popover.register(data.popoverName, data.tooltipElRef, data.position, {
    arrow: data.arrowElRef,
    offset: 4,
  })

  if (!popoverInstance) {
    console.error("Failed to register tooltip")
    return
  }

  el[DATA_PROP].update = popoverInstance.update
  el[DATA_PROP].dispose = () => popover.unregister(data.popoverName)

  popover.bind(data.popoverName, el, { placement: data.position })
}

function updateTooltipElement(el) {
  // if tooltip is not being shown, ignore update
  if (!el[DATA_PROP].tooltipElRef.value) return

  if (el[DATA_PROP].tooltipElRef.value) {
    const updatedContent = parseText(el[DATA_PROP].text, el[DATA_PROP].isBBCode)
    const spanEl = el[DATA_PROP].tooltipElRef.value.querySelector("span")
    spanEl.innerHTML = updatedContent
  }
}

function addTooltip(el) {
  const data = el[DATA_PROP]
  data.tooltipElRef.value = createTooltip(data)

  // get the popover container
  let popoverContainer = document.querySelector(POPOVER_CONTAINER)
  if (!popoverContainer) {
    console.warn("Popover container not found, using parent element")
    popoverContainer = el.parentElement
  }

  el[DATA_PROP].arrowElRef.value = createArrow()
  data.tooltipElRef.value.appendChild(el[DATA_PROP].arrowElRef.value)
  popoverContainer.appendChild(data.tooltipElRef.value)
}

function removeTooltip(el) {
  const data = el[DATA_PROP]

  // set show state to false in popover service so they are in sync
  const popover = usePopover()
  popover.hide(data.popoverName)

  if (data.tooltipElRef.value) {
    data.tooltipElRef.value.remove()
    data.tooltipElRef.value = null
  }

  data.update && data.update()
}

function createTooltip(data) {
  const container = document.createElement("div")
  if (data.style) Object.keys(data.style).forEach(key => container.style.setProperty(key, data.style[key]))

  container.setAttribute(TOOLTIP_ATTR_NAME, "")
  container.appendChild(createContent(data.text, data.isBBCode))

  return container
}

function createContent(text, isBBCode) {
  const content = document.createElement("span")
  // TODO: add support for passthrough styles
  Object.assign(content.style, {})
  content.innerHTML = parseText(text, isBBCode)
  content.setAttribute(CONTENT_ATTR_NAME, "")
  return content
}

function createArrow() {
  const arrow = document.createElement("span")
  // TODO: add support for passthrough styles
  Object.assign(arrow.style, {})
  arrow.setAttribute(ARROW_ATTR_NAME, "")
  return arrow
}

function parseText(text, isBBCode) {
  return isBBCode ? $content.bbcode.parse(text) : text
}

const getBindings = binding => {
  const position = binding.arg ? binding.arg : DEFAULT_POSITION
  let hideDelay,
    text,
    isBBCode = false,
    style = {}

  if (typeof binding.value === "object") {
    hideDelay = binding.value?.hideDelay || 0
    text = binding.value?.text || undefined
    isBBCode = binding.value?.isBBCode || false
    style = binding.value?.style || {}
  } else {
    text = binding.value
  }

  return { text, position, hideDelay, isBBCode, style }
}

function initTooltipData(el) {
  el[DATA_PROP] = {
    popoverName: uniqueId("bng-tooltip"),
    tooltipElRef: ref(null),
    arrowElRef: ref(null),
  }

  resetTooltipData(el)
}

function resetTooltipData(el) {
  el[DATA_PROP].text = undefined
  el[DATA_PROP].style = {}
  el[DATA_PROP].isBBCode = false
  el[DATA_PROP].hideDelayTime = undefined
  el[DATA_PROP].position = undefined
  el[DATA_PROP].hideDelay = null
  el[DATA_PROP].tooltipAnimationFrame = null
}
