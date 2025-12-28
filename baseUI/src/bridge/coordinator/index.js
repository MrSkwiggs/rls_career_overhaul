import ListenerProfiler from "./profiler.js"
import ListenerInterceptor from "./interceptor.js"
import DeferredWorkChecker from "./defer.js"
import UIAppProfiler from "./profiler-uiapps.js"

const ms2sec = ms => (ms / 1000).toFixed(3).replace(/[.0]+$/, "")

/**
 * Main coordinator for stream listener synchronization with UI flow.
 * Tracks active listeners, manages stream update cycles, and signals the game engine
 * when all listeners have completed processing (including deferred work).
 */
export class StreamCoordinator {
  /**
   * @param {Object} vueEventBus - TinyEmitter instance used for Vue event handling
   */
  constructor(vueEventBus) {
    this.debug = false // enable debug logging (very verbose)

    this.perf = true // enable performance measurements

    // game engine signal throttling (50/20 sounds fine)
    // can be configured at runtime with throttleConfig(delayMs, delayMinMs)
    this.signalDelay = 0 // target delay (ms, 0 = no delay)
    this.signalDelayMin = 0 // minimum delay (ms)

    // whether to signal the game engine
    // when it is disabled, continuous signaling is disabled too
    this.signalingEnabled = false

    // reset by timeout
    this.safetyTimeout = 500 // timeout to check if there are no listeners but marked as active (ms, 0 = disabled)
    this.safetyForceTimeout = 2000 // timeout to force reset if stuck for too long regardless of listeners (ms, 0 = disabled)

    // deferred work detection settings
    // can be configured at runtime with deferConfig(boolean|object)
    this.deferredSettings = {
      // framework scheduling phase - essential for DOM updates
      angularTimeout: true,       // [impact: low] Use Angular $timeout(0) scheduling - critical for ng-repeat etc.
      vueNextTick: true,          // [impact: low] Use Vue.nextTick() scheduling - critical for Vue UI

      // framework state monitoring - essential for completion detection
      angularBusyCheck: false,    // [impact: low-high] Monitor Angular digest cycles and queues - prevents premature completion

      // async queue tail insertion - common patterns, minimal overhead
      microtask: true,            // [impact: lowest] Promise.resolve().then() - very common, keep enabled
      macrotask: false,           // [impact: medium] setTimeout(0) - seems to be a contributor to async queues time
      animationFrame: false,      // [impact: high] requestAnimationFrame() - expensive, not needed for most UI
      vueNextTickQueue: false,    // [impact: medium] Vue.nextTick() queue check - redundant
      angularEvalAsync: false,    // [impact: medium] Angular $evalAsync() queue - important for digest, but redundant with angularTimeout
      angularTimeoutQueue: false, // [impact: medium] Angular $timeout() queue - redundant with angularTimeout
    }

    // listener profiling settings
    // can be configured at runtime with profilerConfig(boolean|object)
    this.profilerSettings = {
      callStackGathering: false, // Capture call stack for each listener invocation
      listenerThrottling: false, // Enable throttling of specific listeners (not implemented yet)
      uiAppsOnly: true,          // Profile UI apps only (uses DOM enumeration to match call stacks)
    }

    this.processing = false // main flag of work going on
    this.continuousSignaling = false // continuous signaling to the game engine when processing=false
    this.continuousMode = "raf" // "raf" or "timeout"
    this.continuousId = null
    this.activeListeners = new Set()
    this.syncCompleteListeners = new Set()  // Track listeners that finished sync execution
    this.pendingSharedDeferredCheck = false  // Prevent multiple shared deferred checks
    this.completionCallbacks = []
    this.finishCallback = undefined
    this.vueEventBus = vueEventBus
    this.angularRootScope = window.globalAngularRootScope
    this.angularTimeout = null // $timeout - will be resolved lazily
    this.listenerUIApps = new Map() // listenerId -> uiApp data
    this.perfMetrics = new Map() // key -> { count, totalTime, minTime, maxTime, avgTime }
    this.perfStartTimes = new Map() // key -> startTime (for active measurements)

    /// modules (can be disabled)
    /// note: they should go in this order
    // this.profiler = new ListenerProfiler(this) // uses uiApps
    // this.uiApps = new UIAppProfiler(this) // profiler extension
    this.defer = new DeferredWorkChecker(this) // stand-alone
    // this.interceptor = new ListenerInterceptor(this, vueEventBus) // uses defer through coordinator

    // initiate continuous signaling on startup
    this.startContinuousSignaling()

    // FIXME: remove this when c++ side signal will be available
    window.signalTest = () => {
      this.signalingEnabled = !this.signalingEnabled
      console.log(`signalTesting ${this.signalingEnabled ? "enabled" : "disabled"}`)
      this.startContinuousSignaling()
    }
  }

  /**
   * Manually set Angular root scope for interception when globalAngularRootScope isn't available yet
   * @param {Object} rootScope - Angular root scope instance
   */
  setAngularRootScope(rootScope) {
    this.angularRootScope = rootScope
    this.angularTimeout = null // reset timeout service cache
    this.interceptor?.interceptAngularListeners()
  }

  /**
   * Gets Angular $timeout service via dependency injection
   * @returns {Function|null} Angular $timeout service or null if not available
   */
  getAngularTimeout() {
    if (this.angularTimeout !== null) {
      return typeof this.angularTimeout === "function" ? this.angularTimeout : null
    }

    try {
      // seems like the only way to get it
      if (typeof window.angular !== "undefined" && window.angular.element) {
        const injector = window.angular.element(document).injector()
        if (injector) {
          this.angularTimeout = injector.get("$timeout")
          if (this.debug) console.log("Angular $timeout service resolved via injector")
          return this.angularTimeout
        }
      }

      // mark as unavailable to avoid repeated attempts
      this.angularTimeout = false
      if (this.debug) console.warn("Angular $timeout service not available")
      return null
    } catch (error) {
      if (this.debug) console.warn("Failed to get Angular $timeout service:", error)
      this.angularTimeout = false
      return null
    }
  }

  /**
   * Jobs to do before broadcasting streams.
   * This should be used externally.
   */
  beforeBroadcast() {
    this.startStreamUpdate()
  }

  /**
   * Jobs to do after broadcasting streams.
   * This should be used externally.
   * @param {Function} [callback] - Callback to run after all processing is done
   */
  afterBroadcast(callback = undefined) {
    if (callback && typeof callback !== "function") callback = undefined

    if (!this.processing && !this.defer) {
      callback?.()
      return
    }

    if (callback) {
      this.finishCallback = () => {
        this.finishCallback = undefined
        callback()
      }
    }

    if (this.defer && this.countStreamListeners().tracked.total === 0) {
      setTimeout(() => this.startSharedDeferredCheck(true), 0) // force=true bypasses sync-complete listener check
    }
  }

  /**
   * Marks the beginning of a stream update cycle.
   */
  startStreamUpdate() {
    if (this.processing) return
    this.stopContinuousSignaling()
    this.processing = true

    // reset tracking state for new stream update
    this.activeListeners.clear()
    this.syncCompleteListeners.clear()
    this.pendingSharedDeferredCheck = false

    // for throttler only
    this.streamUpdateTime = this.signalDelay > 0 ? Date.now() : 0

    const counts = this.countStreamListeners()

    if (this.debug) {
      if (counts.tracked.total > 0) {
        console.log(`Stream update cycle triggered.\nAwaiting completion of ${counts.tracked.total} listeners: Vue ${counts.tracked.vue}, Angular ${counts.tracked.angular}`)
      } else if (this.defer) {
        console.log("Stream update cycle triggered. Awaiting completion of deferred work (no listeners tracking)")
      } else {
        console.log("No tracked listeners or deferred work to do, immediately completing stream update cycle")
      }
    }

    if (counts.tracked.total === 0 && !this.defer) {
      this.finishProcessing()
      return
    }

    // reset if stuck for too long
    if (this.safetyTimeout > 0) {
      if (this.safetyTimer) clearTimeout(this.safetyTimer)
      this.safetyTimer = setTimeout(() => {
        if (!this.processing || this.activeListeners.size > 0) return
        // console.warn(`Stream update has been active for ${ms2sec(this.safetyTimeout)}s with no active listeners - forcing reset`)
        this.stopStreamUpdate()
      }, this.safetyTimeout)
    }
    if (this.safetyForceTimeout > 0) {
      if (this.safetyForceTimer) clearTimeout(this.safetyForceTimer)
      this.safetyForceTimer = setTimeout(() => {
        if (!this.processing) return
        if (this.activeListeners.size > 0) {
          console.warn(`Stream update stuck for ${ms2sec(this.safetyForceTimeout)}s with ${this.activeListeners.size} active listeners - force clearing`)
          if (this.debug) console.warn(`Stuck listener IDs:`, [...this.activeListeners])
          this.activeListeners.clear()
          this.syncCompleteListeners.clear()
          this.pendingSharedDeferredCheck = false
          this.completionCallbacks.forEach(callback => callback())
          this.completionCallbacks = []
        }
        this.stopStreamUpdate()
      }, this.safetyForceTimeout)
    }
  }

  stopStreamUpdate() {
    this.processing = false
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer)
      this.safetyTimer = null
    }
    if (this.safetyForceTimer) {
      clearTimeout(this.safetyForceTimer)
      this.safetyForceTimer = null
    }
    this.finishCallback?.()
    this.startContinuousSignaling()
  }

  /**
   * Starts continuous frame-by-frame signaling to the game engine.
   * Called when stream processing is idle (processing = false).
   */
  startContinuousSignaling() {
    if (!this.signalingEnabled) return // FIXME: remove the flag when c++ side signal will be available
    if (this.continuousSignaling || this.processing) return
    this.continuousSignaling = true
    const signalLoop = () => {
      if (!this.signalingEnabled) return // FIXME: remove the flag when c++ side signal will be available
      if (!this.continuousSignaling || this.processing) return
      window.uiFrameDone?.()
      if (this.continuousMode === "raf") {
        this.continuousId = requestAnimationFrame(signalLoop)
      } else {
        this.continuousId = setTimeout(signalLoop, 0)
      }
    }
    signalLoop()
    if (this.debug) console.log("Started continuous frame signaling")
  }

  /**
   * Stops continuous frame-by-frame signaling to the game engine.
   * Called when stream processing starts (processing = true).
   */
  stopContinuousSignaling() {
    if (!this.continuousSignaling) return
    this.continuousSignaling = false
    if (this.continuousId) {
      if (this.continuousMode === "raf") {
        cancelAnimationFrame(this.continuousId)
      } else {
        clearTimeout(this.continuousId)
      }
      this.continuousId = null
    }
    if (this.debug) console.log("Stopped continuous frame signaling")
  }

  finishProcessing() {
    if (!this.processing) return

    const signal = () => {
      if (this.debug) console.log("Stream update cycle completed. Signaling game engine...")
      this.processing = false
      if (this.signalingEnabled) window.uiFrameDone?.() // FIXME: remove the flag when c++ side signal will be available
      this.finishCallback?.()
      this.startContinuousSignaling()
    }

    let delay = 0
    if (this.signalDelay > 0) delay = this.signalDelay - (Date.now() - this.streamUpdateTime)
    if (this.signalDelayMin > 0 && delay < this.signalDelayMin) delay = this.signalDelayMin
    if (delay > 0) {
      if (this.debug) console.log(`Applying ${delay}ms delay before signaling engine`)
      setTimeout(signal, delay)
    } else {
      signal()
    }
  }

  /**
   * Called by intercepted listeners to register that processing has started.
   * @param {string} listenerId - Unique identifier for the listener
   */
  startListenerProcessing(listenerId) {
    this.activeListeners.add(listenerId)
    if (this.debug) console.log(`Listener started: ${listenerId} (${this.activeListeners.size} active)`)
  }

  /**
   * Called when a listener completes its synchronous execution.
   * When all listeners finish sync work, triggers shared deferred detection.
   * @param {string} listenerId - Unique identifier for the listener
   */
  finishSyncProcessing(listenerId) {
    if (!this.activeListeners.has(listenerId)) {
      if (this.debug) console.warn(`Sync completion for unknown listener: ${listenerId}`)
      return
    }

    this.syncCompleteListeners.add(listenerId)
    if (this.debug) console.log(`Listener sync complete: ${listenerId} (${this.syncCompleteListeners.size}/${this.activeListeners.size})`)

    // If all listeners finished sync work, start shared deferred check
    if (this.syncCompleteListeners.size === this.activeListeners.size) {
      this.startSharedDeferredCheck()
    }
  }

  /**
   * Initiates a single shared deferred work detection for all listeners.
   * Much more efficient than per-listener deferred checks with 20+ listeners.
   * @param {boolean} force - If true, bypasses sync-complete listener check (for interceptor-less mode)
   */
  startSharedDeferredCheck(force = false) {
    if (!this.defer) return

    if (this.pendingSharedDeferredCheck) {
      if (this.debug) console.log("Shared deferred check already in progress")
      return
    }

    if (!force && this.syncCompleteListeners.size === 0) {
      if (this.debug) console.log("No sync-complete listeners for shared deferred check")
      return
    }

    if (this.debug) {
      const listenerCount = this.syncCompleteListeners.size
      if (force && listenerCount === 0) {
        console.log("Starting forced shared deferred check (no listener tracking)")
      } else {
        console.log(`Starting shared deferred check for ${listenerCount} listeners`)
      }
    }

    this.pendingSharedDeferredCheck = true
    this.defer.waitForSharedCompletion(() => {
      this.finishAllListeners()
    })
  }

  /**
   * Completes all sync-finished listeners at once after shared deferred work is done.
   * Resets tracking state and signals completion.
   */
  finishAllListeners() {
    const completedListeners = [...this.syncCompleteListeners]

    // clear tracking state
    for (const listenerId of completedListeners) {
      this.activeListeners.delete(listenerId)
    }
    this.syncCompleteListeners.clear()
    this.pendingSharedDeferredCheck = false

    if (this.debug) console.log(`Completed ${completedListeners.length} listeners`)

    // signal completion if all listeners are done
    if (this.activeListeners.size === 0) {
      this.completionCallbacks.forEach(callback => callback())
      this.completionCallbacks = []
      this.finishProcessing()
    }
  }

  /**
   * Called when listener processing completes (including all deferred work).
   * This is now primarily used for error cases or async promise completion.
   * Normal flow uses shared deferred detection via finishAllListeners().
   * @param {string} listenerId - Unique identifier for the listener
   */
  finishListenerProcessing(listenerId) {
    if (!this.activeListeners.has(listenerId)) {
      if (this.debug) console.warn(`Attempted to finish unknown listener: ${listenerId}`)
      return
    }

    this.activeListeners.delete(listenerId)
    this.syncCompleteListeners.delete(listenerId) // Remove from sync tracking too

    if (this.debug) console.log(`Listener individually finished: ${listenerId} (${this.activeListeners.size} remaining)`)

    if (this.activeListeners.size === 0) {
      // All listeners completed (possibly through mixed shared + individual completion)
      this.syncCompleteListeners.clear()
      this.pendingSharedDeferredCheck = false
      this.completionCallbacks.forEach(callback => callback())
      this.completionCallbacks = []
      this.finishProcessing()
    }
  }

  /**
   * Enables or disables detailed console logging.
   * @param {boolean} enabled - Whether to enable debug output
   */
  setDebug(enabled) {
    this.debug = enabled
  }

  /**
   * Starts performance measurement for a named operation.
   * @param {string} className - Name of the class being measured
   * @param {string} funcName - Name of the function being measured
   */
  perfStart(className, funcName) {
    if (!this.perf) return
    const key = `[${className}] ${funcName}`
    this.perfStartTimes.set(key, performance.now())
  }

  /**
   * Finishes performance measurement and updates metrics.
   * @param {string} className - Name of the class being measured
   * @param {string} funcName - Name of the function being measured
   */
  perfFinish(className, funcName) {
    if (!this.perf) return
    const key = `[${className}] ${funcName}`
    const startTime = this.perfStartTimes.get(key)
    if (startTime === undefined) {
      if (this.debug) console.warn(`Performance measurement not started for: ${key}`)
      return
    }

    const duration = performance.now() - startTime
    this.perfStartTimes.delete(key)

    let metrics = this.perfMetrics.get(key)
    if (!metrics) {
      metrics = {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        avgTime: 0
      }
      this.perfMetrics.set(key, metrics)
    }

    metrics.count++
    metrics.totalTime += duration
    metrics.minTime = Math.min(metrics.minTime, duration)
    metrics.maxTime = Math.max(metrics.maxTime, duration)
    metrics.avgTime = metrics.totalTime / metrics.count
  }

  /**
   * Displays performance metrics for all measured operations.
   */
  showPerf() {
    if (!this.perf) {
      console.log("Performance monitoring is disabled. Enable with: coordinator.perf = true")
      return
    }

    if (this.perfMetrics.size === 0) {
      console.log("No performance metrics collected yet")
      return
    }

    const report = ["=== Stream Coordinator Performance Metrics ==="]
    const sortedMetrics = [...this.perfMetrics.entries()].sort((a, b) => b[1].totalTime - a[1].totalTime)

    sortedMetrics.forEach(([key, metrics]) => {
      report.push(`${key}:`)
      report.push(`  Calls: ${metrics.count}`)
      report.push(`  Total: ${metrics.totalTime.toFixed(2)}ms`)
      report.push(`  Avg: ${metrics.avgTime.toFixed(2)}ms`)
      report.push(`  Min: ${metrics.minTime.toFixed(2)}ms`)
      report.push(`  Max: ${metrics.maxTime.toFixed(2)}ms`)
      report.push("")
    })

    const totalOperations = [...this.perfMetrics.values()].reduce((sum, m) => sum + m.count, 0)
    const totalTime = [...this.perfMetrics.values()].reduce((sum, m) => sum + m.totalTime, 0)
    report.push(`Total operations: ${totalOperations}, Total time: ${totalTime.toFixed(2)}ms`)

    console.log(report.join("\n"))
  }

  /**
   * Clears all performance metrics.
   */
  clearPerf() {
    this.perfMetrics.clear()
    this.perfStartTimes.clear()
    console.log("Performance metrics cleared")
  }

  /**
   * Manually force cleanup of stuck listeners (for debugging)
   */
  forceCleanup() {
    const stuckCount = this.activeListeners.size
    if (stuckCount > 0) {
      console.warn(`Manually clearing ${stuckCount} stuck listeners:`, [...this.activeListeners])
      this.activeListeners.clear()
      this.syncCompleteListeners.clear()
      this.pendingSharedDeferredCheck = false
      this.completionCallbacks.forEach(callback => callback())
      this.completionCallbacks = []
      this.stopStreamUpdate()
      return stuckCount
    }
    return 0
  }

  /**
   * Throttle settings
   * @param {number} target - Target delay in ms (0 = no delay)
   * @param {number} minimal - Minimal delay in ms (0 = no delay)
   * @returns {Object} Current settings
   */
  throttleConfig(target = undefined, minimal = undefined) {
    if (typeof target === "number") {
      this.signalDelay = target
    }
    if (typeof minimal === "number") {
      this.signalDelayMin = minimal
    }
    return {
      target: this.signalDelay,
      minimal: this.signalDelayMin,
    }
  }

  /**
   * Deferred work detection settings
   * @param {Object|boolean} newSettings - Optional object to update settings, or boolean to enable/disable all settings
   * @returns {Object} Current settings
   */
  deferConfig(newSettings) {
    const type = typeof newSettings
    if (type === "boolean") {
      // apply all
      for (const key in this.deferredSettings) {
        this.deferredSettings[key] = newSettings
      }
      return this.deferredSettings
    } else if (type === "object" && !Array.isArray(newSettings)) {
      // apply specific
      Object.assign(this.deferredSettings, newSettings)
    }
    return this.deferredSettings
  }

  /**
   * Listener profiling settings
   * @param {Object|boolean} newSettings - Optional object to update settings, or boolean to enable/disable all settings
   * @returns {Object} Current settings
   */
  profilerConfig(newSettings) {
    const type = typeof newSettings
    if (type === "boolean") {
      // apply all
      for (const key in this.profilerSettings) {
        this.profilerSettings[key] = newSettings
      }
      return this.profilerSettings
    } else if (type === "object" && !Array.isArray(newSettings)) {
      // apply specific
      Object.assign(this.profilerSettings, newSettings)
    }
    return this.profilerSettings
  }

  /**
   * Prints current status to console including listener counts and active processing.
   */
  showStatus() {
    const status = ["Stream listener coordinator status:"]

    if (this.interceptor) {
      const counts = this.countStreamListeners()
      status.push(`  Tracked listeners: Vue ${counts.tracked.vue}, Angular ${counts.tracked.angular}, Total: ${counts.tracked.total}`)
      status.push(`  Raw listeners: Vue ${counts.raw.vue}, Angular ${counts.raw.angular}, Total: ${counts.raw.total}`)
      status.push(`  Coverage: ${counts.coverage}% of listeners are wrapped and tracked`)
    } else {
      const counts = this.countStreamListeners()
      status.push(`  Listener interceptor: disabled`)
      status.push(`  Raw listeners: Vue ${counts.raw.vue}, Angular ${counts.raw.angular}, Total: ${counts.raw.total}`)
    }

    status.push(`  Deferred work detection: ${this.defer ? "enabled" : "disabled"}`)
    status.push(`  Stream update cycle active: ${this.processing}`)
    status.push(`  Currently processing ${this.activeListeners.size} listeners`)

    if (this.perf && this.perfMetrics.size > 0) {
      const totalOperations = [...this.perfMetrics.values()].reduce((sum, m) => sum + m.count, 0)
      const totalTime = [...this.perfMetrics.values()].reduce((sum, m) => sum + m.totalTime, 0)
      const avgTime = totalOperations > 0 ? totalTime / totalOperations : 0
      status.push(`  Performance: ${totalOperations} ops, ${totalTime.toFixed(1)}ms total, ${avgTime.toFixed(2)}ms avg`)
    }

    console.log(status.join("\n"))
  }

  showUiApps() {
    return this.uiApps?.report() || console.log("UI app profiling is disabled")
  }

  /**
   * Counts stream listeners showing both tracked (wrapped) and raw (original) counts.
   * @returns {Object} Comprehensive listener statistics
   */
  countStreamListeners() {
    const tracked = { // listeners we actually wrap and monitor
      vue: this.interceptor?.trackedVueListeners || 0,
      angular: this.interceptor?.trackedAngularListeners || 0,
      total: 0,
    }
    const raw = { // total listeners in the underlying systems
      vue: 0,
      angular: 0,
      total: 0,
    }

    if (this.vueEventBus?.e) {
      const vueListeners = this.vueEventBus.e["onStreamsUpdate"]
      raw.vue = vueListeners ? vueListeners.length : 0
    }

    if (this.angularRootScope?.$$listenerCount) {
      raw.angular = this.angularRootScope.$$listenerCount["streamsUpdate"] || 0
    }

    tracked.total = tracked.vue + tracked.angular
    raw.total = raw.vue + raw.angular

    return {
      tracked,
      raw,
      coverage: raw.total > 0 ? Math.round((tracked.total / raw.total) * 100) : 100 // % coverage
    }
  }

  /**
   * Returns a Promise that resolves when all active listeners complete processing.
   * @returns {Promise} Promise that resolves when all listeners are done
   */
  waitForAllListeners() {
    return new Promise((resolve) => {
      if (this.activeListeners.size === 0) {
        resolve()
        return
      }

      this.completionCallbacks.push(resolve)
    })
  }
}

export default StreamCoordinator
