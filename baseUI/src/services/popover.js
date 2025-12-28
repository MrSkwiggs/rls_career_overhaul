import { computed, nextTick, onMounted, onUnmounted, ref, toRef, watch, effectScope } from "vue"
import { defineStore } from "pinia"
import { arrow, autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/vue"

const ARROW_POSITION = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
}

export const usePopover = defineStore("popover", () => {
  const _counter = ref(0)
  const _currentPopover = ref(null)
  const popovers = ref({})

  const currentPopover = computed(() => _currentPopover.value)

  const register = (name, popover, popoverPlacement = undefined, options = {}) => {
    if (popovers.value[name]) {
      // console.warn(`unable to register ${name} which already exists`)
      return
    }

    popovers.value[name] = {
      element: popover,
      target: null,
      placement: popoverPlacement || "bottom",
      show: false,
    }

    const target = toRef(popovers.value[name], "target")
    const placement = toRef(popovers.value[name], "placement")

    const popoverInstance = buildPopover(popover, target, placement, options)

    const scope = effectScope()
    let show
    scope.run(() => {
      show = computed(() => popovers.value[name].show)
    })

    const dispose = () => {
      scope.stop()
      popoverInstance.dispose()
    }
    popovers.value[name].dispose = dispose

    _counter.value++

    return { show, update: popoverInstance.update, placement: popoverInstance.placement }
  }

  const bind = (popoverName, el, options) => {
    const scope = effectScope()
    let hidden, isBound, popoverElement

    scope.run(() => {
      hidden = computed(() => popovers.value[popoverName] ? !popovers.value[popoverName].show : undefined)
      isBound = computed(() => popovers.value[popoverName] ? popovers.value[popoverName].target === el : undefined)
      popoverElement = computed(() => popovers.value[popoverName] ? popovers.value[popoverName].element : undefined)
    })

    /// FIXME: the following breaks the career vehicle selector
    // if (popovers.value[popoverName]) {
    //   popovers.value[popoverName].target = el
    //   popovers.value[popoverName].placement = options.placement
    // }

    const show = () => {
      if (!isBound.value) {
        popovers.value[popoverName].target = el
        popovers.value[popoverName].placement = options.placement
      }
      popovers.value[popoverName].show = true
    }

    const hide = () => {
      if (isBound.value) {
        popovers.value[popoverName].show = false
      } else {
        // console.warn("[popover] not bound to", el)
      }
    }

    const toggle = (forceValue = undefined) => {
      let doShow = forceValue
      if (typeof doShow !== "boolean") doShow = !isBound.value || !popovers.value[popoverName].show
      if (doShow) show()
      else hide()
    }

    const isShown = () => !!popovers.value[popoverName].show

    const unbind = () => {
      scope.stop()
    }

    return { popoverElement, hidden, isBound, show, hide, toggle, isShown, unbind }
  }

  const unregister = name => {
    if (popovers.value[name]) {
      popovers.value[name].dispose()
      delete popovers.value[name]
    }
  }

  const isShown = name => (name in popovers.value ? popovers.value[name].show : false)

  const show = (name, target) => {
    if (name in popovers.value) {
      popovers.value[name].show = true
      if (target) popovers.value[name].target = target
      _currentPopover.value = popovers.value[name]
    }
  }

  const hide = name => {
    if (name in popovers.value) {
      popovers.value[name].show = false
      _currentPopover.value = null
    }
  }

  const toggle = (name, forceValue = undefined) => {
    if (name in popovers.value) {
      popovers.value[name].show = typeof forceValue === "boolean" ? forceValue : !popovers.value[name].show
      _currentPopover.value = popovers.value[name].show ? popovers.value[name] : null
    }
  }

  const hideAll = (startsWith = undefined) => {
    let keys = Object.keys(popovers.value)
    if (startsWith) keys = keys.filter(name => name.startsWith(startsWith))
    keys.forEach(name => popovers.value[name].show && hide(name))
  }

  const getPopover = name => popovers.value[name]

  const counter = computed(() => _counter.value)

  return {
    popovers,
    currentPopover,
    bind,
    register,
    unregister,
    isShown,
    show,
    hide,
    toggle,
    hideAll,
    getPopover,
    counter,
  }
})

function buildPopover(popover, reference, placementArg, options) {
  const middleware = buildMiddleware(popover, options)
  const { floatingStyles, middlewareData, update, placement } = useFloating(reference, popover, {
    placement: placementArg,
    middleware,
    whileElementsMounted: autoUpdate,
  })

  const watchers = []

  watchers.push(
    watch(floatingStyles, async styles => {
      // console.log("watch floatingStyles", styles)
      if (!popover.value) return
      await nextTick(() => {
        Object.keys(styles).forEach(styleName => (popover.value.style[styleName] = styles[styleName]))
      })
    })
  )

  if (options.arrow) {
    watchers.push(
      watch(middlewareData, async middlewareData => {
        // console.log("watch middlewareData", middlewareData)
        const left = middlewareData.arrow && middlewareData.arrow.x != null ? `${middlewareData.arrow.x}px` : ""
        const top = middlewareData.arrow && middlewareData.arrow.y != null ? `${middlewareData.arrow.y}px` : ""
        const side = middlewareData.offset.placement.split("-")[0]
        const arrowSide = ARROW_POSITION[side]

        await nextTick(() => {
          applyStyles(options.arrow.value, {
            left: left,
            top: top,
            right: "",
            bottom: "",
            [arrowSide]: `-${options.arrow.value.offsetWidth / 2}px`,
          })
        })
      })
    )
  }

  const dispose = () => {
    watchers.forEach(unwatch => unwatch())
  }

  return {
    placement,
    update,
    dispose,
  }
}

const arrowOffset = options => ({
  name: "arrowOffset",
  options,
  fn({ ...state }) {
    const arrOffset = Math.sqrt(2 * options.element.value.offsetWidth ** 2) / 2
    const side = state.placement.startsWith("left") || state.placement.startsWith("top") ? -1 : 1

    if (state.placement.startsWith("left") || state.placement.startsWith("right")) return { x: state.x + side * arrOffset }
    else if (state.placement.startsWith("top") || state.placement.startsWith("bottom")) return { y: state.y + side * arrOffset }
  },
})

function buildMiddleware(popover, options) {
  const middleware = [flip(), shift()]

  const offsetValue = options.offset || 0
  middleware.push(offset(offsetValue))

  if (options.arrow) {
    middleware.push(arrowOffset({ element: options.arrow }))
    middleware.push(arrow({ element: options.arrow }))
  }

  return middleware
}

function applyStyles(el, styles) {
  Object.keys(styles).forEach(styleName => (el.style[styleName] = styles[styleName]))
}

export const usePopoverHelper = function () {
  const popover = usePopover()
  const opened = []

  function outsider(evt) {
    const target = evt.relatedTarget || evt.target
    for (const name of opened) {
      if (!popover.isShown(name)) continue
      const elm = popover.popovers[name].element
      if (elm && !elm.contains(target)) hide(name)
    }
  }

  function show(name, target = undefined) {
    const idx = opened.indexOf(name)
    if (idx === -1) opened.push(name)
    popover.show(name, target)
  }

  function hide(name) {
    const idx = opened.indexOf(name)
    if (idx !== -1) opened.splice(idx, 1)
    popover.hide(name)
  }

  onMounted(() => {
    document.addEventListener("click", outsider)
    document.addEventListener("focusout", outsider)
  })
  onUnmounted(() => {
    document.removeEventListener("click", outsider)
    document.removeEventListener("focusout", outsider)
  })

  return {
    show,
    hide,
  }
}
