// BngBlur Directive - for blurring parts of the background behind the UI element

import { debounce } from "@/utils/rateLimit"
import { isVisibleFast, observePosition } from "@/utils/DOM"
import { gameBlurrer } from "@/bridge"
import logger from "@/services/logger"

const elemBlurs = new WeakMap()

export default {
  mounted: (el, binding) => {
    let id,
      blurAmount = 1
    const blurUpdateWrapper = debounce(updateBlur, 50)
    let resizeObserver, removePositionObserver

    function observe() {
      if (!resizeObserver) {
        resizeObserver = new ResizeObserver(blurUpdateWrapper)
        resizeObserver.observe(el)
      }
      if (!removePositionObserver) {
        removePositionObserver = observePosition(el, blurUpdateWrapper)
      }
    }
    function unobserve() {
      resizeObserver && resizeObserver.disconnect()
      removePositionObserver && removePositionObserver()
      resizeObserver = null
      removePositionObserver = null
    }

    elemBlurs.set(el, { blurUpdateWrapper, processBlurVal, observe, unobserve })

    processBlurVal(binding.value)
    window.addEventListener("resize", blurUpdateWrapper)

    function processBlurVal(val) {
      switch (typeof val) {
        case "undefined":
          val = 1
          break
        case "boolean":
          val = val ? 1 : 0
          break
        case "number":
          if (val < 0 || val > 1) {
            logger.error(`Attempted to use v-bng-blur with a number out of range 0..1: ${val}\nSee stack:`, logger.STACK_TRACE)
            val = 1
          }
          break
        default:
          logger.error(`Attempted to use v-bng-blur with a non-number, non-boolean value: ${val}\nSee stack:`, logger.STACK_TRACE)
          val = 0
      }
      blurAmount = val
      blurUpdateWrapper()
    }

    function calcBlur() {
      const rect = el.getBoundingClientRect()
      if (
        // valid size (at least 1px)
        rect.width > 0 &&
        rect.height > 0 &&
        // on screen (for at least 1px)
        rect.bottom > 0 &&
        rect.top < window.screen.height &&
        rect.right > 0 &&
        rect.left < window.screen.width
      ) {
        return [
          rect.left / window.screen.width, // x
          rect.top / window.screen.height, // y
          rect.width / window.screen.width, // width
          rect.height / window.screen.height, // height
          blurAmount,
        ]
      }
      return null
    }

    function updateBlur() {
      if (blurAmount && isVisibleFast(el)) {
        observe()
        const blur = calcBlur()
        if (!id && blur) {
          id = gameBlurrer.register(blur)
        } else if (!blur) {
          gameBlurrer.unregister(id)
          id = null
        } else {
          gameBlurrer.update(id, blur)
        }
      } else {
        unobserve()
        if (id) {
          gameBlurrer.unregister(id)
          id = null
        }
      }
    }
  },

  updated: (el, binding) => {
    const elemBlur = elemBlurs.get(el)
    if (elemBlur && binding.value != binding.oldValue) elemBlur.processBlurVal(binding.value)
  },

  unmounted: (el, binding) => {
    const elemBlur = elemBlurs.get(el)
    if (elemBlur) {
      elemBlur.unobserve()
      elemBlur.processBlurVal(0)
      window.removeEventListener("resize", elemBlur.blurUpdateWrapper)
      elemBlurs.delete(el)
    }
  },
}
