import { reactive, watch } from "vue"
import { useBridge } from "@/bridge"
import { sleep } from "@/utils"
import { debounce } from "@/utils/rateLimit"

class Settings {
  /** @type {Object} Reactive options list */
  options = reactive({})
  /** @type {Object} Reactive values list */
  values = reactive({})

  _previousValues = {}
  _changedValues = {}
  _watcher = null
  _syncPending = false

  inited = false
  loaded = false
  _lua

  constructor(eventBus = undefined, lua = undefined) {
    if (eventBus && lua) this.init(eventBus, lua)
  }

  init(eventBus = undefined, lua = undefined) {
    if (this.inited || this.loaded) return
    this.inited = true
    if (!eventBus || !lua) {
      const bridge = useBridge()
      if (!eventBus) eventBus = bridge.events
      if (!lua) lua = bridge.lua
    }
    eventBus.on("SettingsChanged", data => {
      Object.assign(this.options, data.options)
      Object.assign(this.values, data.values)
      this._previousValues = this.clone(data.values)
      this._changedValues = {}
      if (!this._watcher) {
        // delayed watcher creation to start watching only after the first data is received
        this._watcher = watch(
          () => this.values,
          () => this._syncChanges(),
          { deep: true, flush: "sync" }
        )
      }
      this.loaded = true
    })
    this._syncChangesDebounced = debounce(this._syncChangesImmediate, 100)
    this._lua = lua
    this.update()
  }

  async waitForData() {
    while (!this.inited || !this.loaded) await sleep(10)
  }

  async update() {
    if (!this._lua) return
    return await this._lua.settings.notifyUI()
  }

  clone(data) {
    return JSON.parse(JSON.stringify(data))
  }

  /**
   * Read non-mutable clone of the data
   * @param {string} [field=null] Field name. If not specified, all settings will be returned.
   * @returns {*} Setting(s)
   */
  getValue(field = null) {
    if (!this.loaded) return
    if (field && !(field in this.values))
      return null
    return this.clone(field ? this.values[field] : this.values)
  }

  /**
   * @type {boolean} Whether there are pending changes
   */
  get changesPending() {
    this._syncChangesImmediate()
    return Object.keys(this._changedValues).length > 0
  }

  /**
   * @type {Object} Pending changes
   */
  get pendingChanges() {
    this._syncChangesImmediate()
    return this.clone(this._changedValues)
  }

  _syncChanges() {
    this._syncPending = true
    this._syncChangesDebounced()
  }

  _syncChangesDebounced = () => { } // gets set in constructor

  _syncChangesImmediate() {
    if (!this._syncPending) return
    this._syncPending = false
    for (const key in this.values) {
      if (this._previousValues[key] !== this.values[key]) {
        this._changedValues[key] = this.values[key]
      } else if (key in this._changedValues) {
        delete this._changedValues[key]
      }
    }
  }

  /**
   * Applies either pending or specified settings.
   * If `values` are specified, they will be applied **without** pending changes.
   * If you wish to send all of the values, use `settings.apply(settings.values)`.
   * @param {Object} [values=undefined] Specify to change values without having to use settings.values
   */
  async apply(values = undefined) {
    if (!this.loaded) return
    let res
    if (values) {
      res = this.clone(values)
      // Object.assign(this.values, res)
    } else {
      if (!this.changesPending) return // nothing changed
      res = { ...this._changedValues }
      this._changedValues = {}
    }
    Object.assign(this._previousValues, res)
    return await this._lua.settings.setState(res)
  }
}

const settings = new Settings()

export function useSettings() {
  settings.init()
  return settings
}

export async function useSettingsAsync() {
  settings.init()
  await settings.waitForData()
  return settings
}
