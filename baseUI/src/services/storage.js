import { reactive } from "vue"

/**
 * Storage class for storing values in localStorage.
 *
 * @example
 * // creating a storage with a namespace
 * const storage = new Storage("my-app")
 *
 * // getting and setting
 * storage.get("name") // undefined
 * storage.get("name", "n/a") // "n/a" -- default value specified
 * storage.set("name", "John Doe")
 * storage.get("name") // "John Doe"
 * storage.get("createdAt", () => Date.now()) // 1751532028330 -- function was executed to get the default value
 *
 * // checking and deleting
 * storage.has("name") // true
 * storage.del("name")
 * storage.has("name") // false
 *
 * @example
 * // defining values that will be updated if changed from elsewhere
 * const storage = new Storage("my-app", {
 *   // define keys and their default values
 *   name: "n/a",
 *   age: 0,
 *   createdAt: () => Date.now(), // function defaults are executed when needed
 * })
 *
 * storage.values // this is the vue reactive object with values defined above
 * storage.assign({ ... }) // this will update the .values object, can be called anytime (if called with no argument - it will clean everything up)
 *
 * storage.values.name // "n/a" -- default value
 * storage.values.age // 0 -- default value
 * storage.values.createdAt // 1751532028330 -- function was executed
 * storage.values.name = "John Doe" // will be saved to localStorage
 * storage.values.age = 30 // will be saved to localStorage
 * storage.values.name // "John Doe"
 * storage.values.age // 30
 * storage.values.name = "Jane Doe"
 * storage.values.age = 25
 *
 * @param {string} name Name of the storage
 * @param {Object} values Keys and their default values for the storage (useful for vue reactivity)
 */
export default class Storage {
  constructor(name, values = {}) {
    this.storage = window.localStorage
    this.name = name
    this.assign(values)
  }

  assign(values = {}) {
    if (!this._values) {
      this._values = {}
      this.values = reactive({})
    }

    const keys = Object.keys(values)

    for (const key in this._values) {
      delete this.values[key]
    }
    this._values = {}

    if (keys.length === 0) {
      if (this._listener) {
        window.removeEventListener("storage", this._listener)
        this._listener = null
      }
      return
    }

    const that = this

    for (const key in values) {
      this._values[key] = {
        exists: this.has(key),
        value: this.get(key, values[key]),
        defaultValue: values[key],
      }
      Object.defineProperty(this.values, key, {
        get() {
          const item = that._values[key]
          return item.exists ? item.value : that.evalDefaultValue(item.defaultValue)
        },
        set(value) {
          const item = that._values[key]
          if (value === item.value) return
          item.exists = true
          item.value = value
          that.set(key, value)
        },
        enumerable: true,
        configurable: true
      })
    }

    if (!this._listener) {
      this._listener = () => {
        for (const key in this._values) {
          const item = this._values[key]
          const newExists = that.has(key)
          const newValue = that.get(key, item.defaultValue)
          if (item.exists !== newExists || item.value !== newValue) {
            item.exists = newExists
            item.value = newValue
            that.values[key] = newValue // trigger vue reactivity
          }
        }
      }
      window.addEventListener("storage", this._listener)
    }
  }

  evalDefaultValue(defaultValue) {
    return typeof defaultValue === "function" ? defaultValue() : defaultValue
  }

  getKey(key) {
    return this.name + ":" + key
  }

  has(key) {
    return this.storage.getItem(this.getKey(key)) !== null
  }

  get(key, defaultValue = undefined) {
    const data = this.storage.getItem(this.getKey(key))
    try {
      return data !== null ? JSON.parse(data) : this.evalDefaultValue(defaultValue)
    } catch (error) {
      console.warn(`Error parsing storage data for key: ${key}\n`, error)
      return this.evalDefaultValue(defaultValue)
    }
  }

  set(key, value) {
    const data = JSON.stringify(value)
    this.storage.setItem(this.getKey(key), data)
  }

  del(key) {
    this.storage.removeItem(this.getKey(key))
  }
}
