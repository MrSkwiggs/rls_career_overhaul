// Rate limiting functions (generic)

export const debounce = (func, wait, immediate) => {
  let timeout
  function call(...args) {
    const context = this
    const later = () => {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    let callNow = immediate && !timeout
    timeout && window.clearTimeout(timeout)
    timeout = window.setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
  call.cancel = () => timeout && window.clearTimeout(timeout)
  return call
}

export const throttle = (func, wait) => {
  let context, args, timeout, result, previous = 0
  const later = () => {
    previous = new Date()
    timeout = null
    result = func.apply(context, args)
  }
  return function (..._args) {
    const now = new Date()
    const remaining = wait - (now - previous)
    context = this
    args = _args
    if (remaining <= 0) {
      window.clearTimeout(timeout)
      timeout = null
      previous = now
      result = func.apply(context, args)
    } else if (!timeout) {
      timeout = window.setTimeout(later, remaining)
    }
    return result
  }
}
