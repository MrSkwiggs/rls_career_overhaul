const observed = new WeakMap()
const observers = new WeakMap()

function createObserver(root = null, rootMargin = "0px") {
  return new IntersectionObserver(entries => {
    for (const entry of entries) {
      const data = observed.get(entry.target)
      if (!data) {
        entry.target.observer?.unobserve(entry.target)
        return
      }
      if (data.onChange) {
        data.onChange(entry.isIntersecting)
      } else {
        const displayValue = entry.isIntersecting ? ["display", "", ""] : ["display", "none", "important"]
        entry.target.style.setProperty(...displayValue)
        entry.target.querySelectorAll("*").forEach((child) => {
          child.style.setProperty(...displayValue)
        })
      }
    }
  }, {
    root,
    rootMargin,
    threshold: 0,
  })
}

const defaultObserver = createObserver()

function getObserver(root, rootMargin) {
  if (!root) return defaultObserver

  const key = `${rootMargin}`
  let rootObservers = observers.get(root)

  if (!rootObservers) {
    rootObservers = new Map()
    observers.set(root, rootObservers)
  }

  if (!rootObservers.has(key)) {
    rootObservers.set(key, createObserver(root, rootMargin))
  }

  return rootObservers.get(key)
}

function update(el, value) {
  const data = observed.get(el)
  if (!data) return

  data.observer?.unobserve(el)
  data.observer = null

  let root = null
  let rootMargin = "100px"

  if (value && typeof value === "object") {
    data.enabled = value.enabled !== undefined ? !!value.enabled : true
    data.onChange = typeof value.onChange === "function" ? value.onChange : null
    root = value.root || null
    rootMargin = value.rootMargin || rootMargin
  } else if (typeof value === "boolean") {
    data.enabled = value
    data.onChange = null
  } else {
    data.enabled = true
    data.onChange = null
  }

  if (data.enabled) {
    data.observer = getObserver(root, rootMargin)
    data.observer.observe(el)
  }
}

export default {
  mounted(el, { value }) {
    observed.set(el, {
      enabled: true,
      onChange: null,
      observer: null,
    })
    update(el, value)
  },
  updated(el, { value }) {
    update(el, value)
  },
  unmounted(el) {
    const data = observed.get(el)
    if (data) {
      data.observer?.unobserve(el)
      observed.delete(el)
    }
  }
}
