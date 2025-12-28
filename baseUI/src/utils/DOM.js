// Useful DOM utilities
function isRef(r) {
  return !!(r && r.__v_isRef === true)
}

export const isVisibleFast = node => !!(node.offsetWidth && node.offsetHeight)

export function isVisible(node, _style = null) {
  let tmp = node
  if (!_style) _style = document.defaultView.getComputedStyle(tmp, null)
  while (tmp.tagName !== "HTML") {
    if (!tmp.isConnected || tmp.nodeType !== Node.ELEMENT_NODE) return false
    _style = document.defaultView.getComputedStyle(tmp, null)
    if (_style.display === "none" || _style.visibility === "hidden" || _style.opacity === "0") return false
    tmp = tmp.parentNode
  }
  return true
}

export function isOccluded(element, rect, dontIgnoreOffscreen) {
  // returns true only when element is on viewport AND other HTML element is occluding it on screen (preventing user from seeing/clicking it)
  // "dontIgnoreOffscreen" - if we should not assume it's visible (not occluded) when offscreen
  const x = (rect.left + rect.right) / 2,
    y = (rect.top + rect.bottom) / 2
  const topElement = document.elementFromPoint(x, y)
  if (!topElement)
    // outside viewport
    return !!dontIgnoreOffscreen
  let tmp = topElement
  while (tmp.tagName !== "HTML") {
    // check if we clicked on our desired element, or any of its ancestors
    if (tmp == element) return false
    if (tmp.tagName === "MD-TOOLTIP" || tmp.noOcclude)
      // nasty tooltips...
      return false
    tmp = tmp.parentNode
  }
  return true
}

export function dispatchKey(key, elem=window.document) {
  // key should be ther number of the keycode one wants to dispatch
  if (typeof key !== 'number') {
    throw new Error('Invalid key')
  }

  // Default to document
  let target = elem || document

  // actual event to be dipatched
  let ev = document.createEvent('KeyboardEvent')

  // Hack Idea from: http://stackoverflow.com/questions/10455626/keydown-simulation-in-chrome-fires-normally-but-not-the-correct-key/10520017#10520017
  // Basically what this does is it overwrites the inhereted in cef buggy and not working property keyCode
  Object.defineProperty(ev, 'keyCode', {
    get : function() {
      return this.keyCodeVal
    }
  })

  // Also tested with keypress, but apparently that does not work in cef for arrow keys but only most other ones
  ev.initKeyboardEvent('keydown', true, true)

  // Used for the getter of the keyCode property
  // Stored as ownproperty so the function execution does not leave an open closure
  ev.keyCodeVal = key

  // Dispatch keypress and return if it worked
  return target.dispatchEvent(ev)
}


export const eventDispatcherForElement = element => (type, extras = {}) => (isRef(element) ? element.value : element).dispatchEvent(Object.assign(new Event(type), extras))


// const posConflictingRules = [":first-child", ":last-child", ":nth-child"]
export function observePosition(element, callback) {
  const trackDiv = document.createElement("div")
  setCss(trackDiv, {
    position: "fixed",
    width: "2px",
    height: "2px",
    padding: "0",
    margin: "0",
    border: "0",
    outline: "0",
    'pointer-events': "none",
  }, true)

  // those classes might help make css exclusions
  element.classList.add("bng-pos-observed")
  trackDiv.className = "bng-pos-observer"

  if (element.children.length) {
    element.insertBefore(trackDiv, element.firstChild)
  } else {
    element.appendChild(trackDiv)
  }

  if (window.BNG_Logger) {
    window.BNG_Logger.assert(
      // () => !getCssRules(trackDiv).some(rule => posConflictingRules.some(sel => rule.includes(sel))),
      () => !isAffectedByCss(trackDiv),
      "Position observer can break styles inside your element! Please adjust your styles using .bng-pos-observed and/or .bng-pos-observer selectors\n", element
    )
  }

  const fixPosition = () => {
    const rect = trackDiv.getBoundingClientRect()
    setCss(trackDiv, {
      'margin-left': `${parseFloat(trackDiv.style.marginLeft || "0") - rect.left - 1}px`,
      'margin-top': `${parseFloat(trackDiv.style.marginTop || "0") - rect.top - 1}px`,
    }, true)
  }
  fixPosition()

  const intersectionObserver = new IntersectionObserver(
    entries => {
      const visiblePixels = Math.round(entries[0].intersectionRatio * 4)
      if (visiblePixels !== 1) {
        fixPosition()
        callback()
      }
    },
    { threshold: [0.125, 0.375, 0.625, 0.875] }
  )
  intersectionObserver.observe(trackDiv)

  return () => {
    intersectionObserver.disconnect()
    trackDiv.remove()
    element.classList.remove("bng-pos-observed")
  }
}
window.observePosition = observePosition

/** Safely sets the styles and supports !important flag */
export function setCss(element, rules, important = undefined) {
  if (window.BNG_Logger) {
    window.BNG_Logger.assert(
      () => !Object.values(rules).some(val => val.endsWith(" !important")),
      "Rule values cannot have !important in them. Please set important flag instead.", rules
    )
  }
  if (important) {
    if (window.BNG_Logger) {
      window.BNG_Logger.assert(
        () => !Object.keys(rules).some(name => name !== name.toLowerCase()),
        "Rule names must be in kebab-case (as in CSS itself)", rules
      )
    }
    for (const key in rules) {
      element.style.setProperty(key, rules[key], "important")
    }
  } else {
    Object.assign(element.style, rules)
  }
}

/** Gets style rule selectors that match the element.
 * @returns {Array<String>} List of rule selectors.
 */
export function getCssRules(elm) {
  const res = []
  for (const { cssRules: rules } of [...document.styleSheets]) {
    for (const { selectorText } of [...rules]) {
      elm.matches(selectorText) && res.push(selectorText)
    }
  }
  return res
}

/** Checks if element is affected by unwanted styles.
 * @param {HTMLElement} element             Element to test.
 * @param {HTMLElement} [parent=undefined]  Parent node to insert clone into. Defaults to parentNode, which is useful to check against rules like :first-child, :nth-child or similar.
 * @param {boolean} [fast=false]            If true, skips cloning nested elements.
 * @returns {boolean}
 */
export function isAffectedByCss(element, parent = undefined, fast = false) {
  if (!element || !element.isConnected || (!parent && !element.parentNode)) return false
  parent = parent || element.parentNode
  const clone = element.cloneNode(!fast)
  parent.insertBefore(clone, element)
  const orig = window.getComputedStyle(element)
  const cloned = window.getComputedStyle(clone)
  let affected = false
  for (const prop of orig) {
    if (orig[prop] !== cloned[prop]) {
      affected = true
      break
    }
  }
  parent.removeChild(clone)
  return affected
}
