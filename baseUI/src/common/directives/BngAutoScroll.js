/**
 * @brief   automatically scrolls a list to the specified position
 * @argument   **top** automatically scrolls list to the top
 * @argument   **bottom** automatically scrolls list to the bottom
 * @tutorial   usage1   `v-bng-auto-scroll:top`
 * @tutorial   usage2   `v-bng-auto-scroll:bottom`
 */
function scroll(el, binding) {
  const direction = binding.arg

  // check if the element has anything to scroll
  if (el.scrollHeight <= el.clientHeight) return

  if (direction === "top") {
    if (el.scrollTop > 0) el.scrollTop = 0
  } else if (direction === "bottom") {
    if (el.scrollTop < el.scrollHeight) el.scrollTop = el.scrollHeight
  }
}

export default scroll
