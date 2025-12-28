import { nextTick } from "vue"

/**
 * @typedef {Object} ConflictResolution Conflict resolution options
 * @property {string} rejectThis Reject the current promise with an error (Default)
 * @property {string} rejectOthers Reject other promises with an error
 * @property {string} resolveThis Resolve the current promise with no arguments (aka silent rejection)
 * @property {string} resolveOthers Resolve other promises with no arguments (aka silent rejection)
 * @property {string} replaceWithReject Replace the existing function call with a new one. Others will be rejected with error.
 * @property {string} replaceWithResolve Replace the existing function call with a new one. Others will be silently rejected.
 * @property {string} merge Result will be taken from an already running function, as soon as it will be called
 */

/**
 * Queue service for sequential function execution with conflict resolution
 * @example
 * // no argument or 0 means that queue will be processed on nextTick
 * const queue = new Queue()
 * // 100ms means that queue will be processed on 100ms
 * const queue = new Queue(100)
 * // 10 means that only 10 items will be processed at a time
 * const queue = new Queue(0, 10)
 *
 * // tick and concurrency can be changed at any time
 * queue.tick = 100
 * queue.concurrency = 10
 *
 * // safely shuffle queue
 * queue.shuffle()
 *
 * // enqueue a function call
 * queue.enqueue("test", (arg1, arg2) => {
 *   console.log(arg1, arg2)
 * }, [arg1, arg2])
 *
 * // with conflict resolution
 * queue.enqueue("test", () => {
 *   console.log("test1")
 * }, [], {
 *   "test": queue.resolution.replaceWithResolve
 * })
 *
 * // create a promise that will be resolved or rejected when the function is called
 * queue.promise("test", () => {
 *   console.log("test")
 * })
 *
 * // with conflict resolution
 * queue.promise("test", () => {
 *   console.log("test")
 * }, [], {
 *   "test": queue.resolution.replaceWithResolve
 * })
 *
 * // create a wrapper function with promise
 * const test = queue.wrap("test", (arg1, arg2) => {
 *   console.log("test")
 * })
 * test(arg1, arg2)
 *
 * // with conflict resolution
 * const test = queue.wrap("test", (arg1, arg2) => {
 *   console.log("test")
 * }, {
 *   "test": queue.resolution.merge
 * })
 * test(arg1, arg2)
 */
export class ExecQueue {
  /** @type {ConflictResolution} */
  resolution = {
    rejectThis: "rejectThis",
    rejectOthers: "rejectOthers",
    resolveThis: "resolveThis",
    resolveOthers: "resolveOthers",
    replaceWithReject: "replaceWithReject",
    replaceWithResolve: "replaceWithResolve",
    merge: "merge",
  }

  _queue = []
  _processing = false
  _tick = 0
  _tickFunc = nextTick
  _runningCount = 0
  _concurrency = 1

  /**
   * @param {number} tick Tick interval in ms (0 for vue's nextTick)
   */
  constructor(tick = 0, concurrency = 1) {
    this.tick = tick
    this.concurrency = concurrency
  }

  /** Tick interval in ms (0 for vue's nextTick) */
  get tick() {
    return this._tick
  }
  /** Tick interval in ms (0 for vue's nextTick) */
  set tick(val) {
    if (typeof val !== "number") val = 0
    this._tick = val
    this._tickFunc = val === 0
      ? func => nextTick(func.bind(this))
      : func => setTimeout(func.bind(this), this._tick)
  }

  /** Concurrency limit */
  get concurrency() {
    return this._concurrency
  }
  /** Concurrency limit */
  set concurrency(val) {
    if (typeof val !== "number" || val < 1) val = 1
    this._concurrency = val
  }

  /** Shuffle queue */
  shuffle() {
    this._shuffle = true
  }

  async process() {
    if (this._processing || this._queue.length === 0) return
    this._processing = true
    if (this._shuffle) {
      this._queue = this._queue.sort(() => Math.random() - 0.5)
      this._shuffle = false
    }
    while (this._runningCount < this._concurrency && this._queue.length > 0) {
      const item = this._queue.shift()
      if (!item) break
      item.running = true
      this._runningCount++
      this._processItem(item) // async
    }
  }

  async _processItem(item) {
    try {
      const result = await item.func(...item.args)
      item.resolves?.forEach(resolve => resolve?.(result))
    } catch (err) {
      if (item.rejects.length > 0) {
        item.rejects?.forEach(reject => reject?.(err))
      } else {
        console.error(err)
      }
    } finally {
      this._runningCount--
      this._tickFunc(() => {
        this._processing = false
        this.process()
      })
    }
  }

  /**
   * Enqueue a function call.
   * Queue will be ran on the specified tick right after enqueue gets called.
   * @param {string} name - Function name
   * @param {Function} func - Function to call
   * @param {any[]} args - Function arguments
   * @param {Object<string, ConflictResolution>} conflicts - Conflict resolution options: `{ "functionName": "conflictResolution" }`
   * @param {Function} resolve - Resolve function
   * @param {Function} reject - Reject function
   */
  enqueue(name, func, args = [], conflicts = {}, resolve = null, reject = null) {
    if (typeof conflicts === "object" && Object.keys(conflicts).length > 0) {
      for (let i = this._queue.length - 1; i >= 0; i--) {
        const item = this._queue[i]
        if (!(item.name in conflicts)) continue
        switch (conflicts[item.name]) {
          case this.resolution.merge:
            resolve && item.resolves.push(resolve)
            reject && item.rejects.push(reject)
            return
          default:
          case this.resolution.rejectThis:
            reject?.(new Error(`Function ${item.name} is rejected due to conflict`))
            return
          case this.resolution.resolveThis:
            resolve?.()
            return
          case this.resolution.rejectOthers:
            if (!item.running) {
              item.rejects?.forEach(reject => reject?.(new Error(`Function ${item.name} is rejected due to conflict`)))
              this._queue.splice(i, 1)
            }
            break
          case this.resolution.resolveOthers:
          case this.resolution.replaceWithResolve:
            if (!item.running) {
              item.resolves?.forEach(resolve => resolve?.())
              this._queue.splice(i, 1)
            }
            break
          case this.resolution.replaceWithReject:
            item.rejects?.forEach(reject => reject?.(new Error(`Function ${item.name} is replaced`)))
            this._queue.splice(i, 1)
            break
        }
      }
    }
    this._queue.push({ name, func, args, resolves: [resolve], rejects: [reject] })
    if (!this._processing) {
      this._processing = true
      this._tickFunc(() => {
        this._processing = false
        this.process()
      })
    }
  }

  /**
   * Create a promise that will be resolved or rejected when the function is called.
   * @param {string} name Function name
   * @param {Function} func Function to call
   * @param {any[]} args Function arguments
   * @param {Object<string, ConflictResolution>} conflicts Conflict resolution options: `{ "functionName": "conflictResolution" }`
   */
  promise(name, func, args = [], conflicts = {}) {
    return new Promise((resolve, reject) => this.enqueue(name, func, args, conflicts, resolve, reject))
  }

  /**
   * Create a wrapper function with promise.
   * @param {string} name Function name
   * @param {Function} func Function to call
   * @param {Object<string, ConflictResolution>} conflicts Conflict resolution options: `{ "functionName": "conflictResolution" }`
   * @returns {Function} Wrapped function
   */
  wrap(name, func, conflicts = {}) {
    return async (...args) => await this.promise(name, func, args, conflicts)
  }
}
