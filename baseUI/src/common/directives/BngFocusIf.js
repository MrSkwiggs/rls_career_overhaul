// this directive focuses on an element
import { NAVIGABLE_ELEMENTS_SELECTOR } from "@/services/crossfire"
import { nextTick } from "vue"

export default (el, { value }) =>
  value &&
  nextTick(() => {
    const shouldFocus = typeof value === "object" ? value.value : value
    const findNavItem = typeof value === "object" ? value.findNavItem : false

    if (!el || !shouldFocus) return

    let targetEl = el

    if (findNavItem) {
      const navItems = el.querySelectorAll(NAVIGABLE_ELEMENTS_SELECTOR)
      if (navItems && navItems.length > 0) targetEl = navItems[0]
    }

    targetEl.focus()
    const blur = () => {
      targetEl.classList.remove("focus-visible")
      targetEl.removeEventListener("blur", blur)
    }
    targetEl.addEventListener("blur", blur)
    targetEl.classList.add("focus-visible")
  })
