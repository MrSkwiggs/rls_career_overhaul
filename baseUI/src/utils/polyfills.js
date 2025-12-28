// Polyfills for JS features not available in old CEF

// Object.fromEntries
if (!("fromEntries" in Object)) {
  Object.fromEntries = function fromEntries(iterable) {
    return [...iterable].reduce((obj, [key, val]) => {
      obj[key] = val
      return obj
    }, {})
  }
} else {
  console.info('Object.fromEntries polyfill was not needed')
}

// Array.prototype.at
if (!("at" in Array.prototype)) {
  Object.defineProperty(Array.prototype, "at", {
    value: function (index) {
      if (index >= 0) {
        return this[index]
      } else {
        return this[this.length + index]
      }
    },
  })
} else {
  console.info('Array.prototype.at polyfill was not needed')
}

// Array.prototype.findLastIndex
if (!("findLastIndex" in Array.prototype)) {
  Object.defineProperty(Array.prototype, "findLastIndex", {
    value: function (callback, thisArg) {
      for (let i = this.length - 1; i >= 0; i--) {
        if (callback.call(thisArg, this[i], i, this)) return i
      }
      return -1
    },
  })
} else {
  console.info('Array.prototype.findLastIndex polyfill was not needed')
}
