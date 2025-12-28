/**
 * Minimal Stream Coordinator with defer-only approach.
 * Ensures Angular/Vue/JS deferred work completes before signaling game engine.
 */
export default class {

  /////////////////////////////////////////////////// SETUP ///

  constructor() {
    this.processing = false // primary flag of work going on
    this.pending = 0 // counter for deferred operations to track their completion
    this.finishCallback = null // callback provided with afterBroadcast(cb)

    this.angularRootScope = window.globalAngularRootScope
    this.angularTimeout = null // Angular $timeout service
    this.angularTimeoutRetry = null // one-time retry timer (do not empty it)
    this.angularTimeoutWarned = false

    // safety timeouts to prevent deadlocks
    this.safetyTimeout = 2000 // ms
    this.safetyTimer = null

    this.warned = false // in case of critical warning, warn only once
  }

  /**
   * Manually set Angular root scope for interception (called in angular's main.js)
   * @param {Object} rootScope - Angular root scope instance
   */
  setAngularRootScope(rootScope) {
    this.angularRootScope = rootScope
    this.angularTimeout = null // reset timeout service
    if (this.angularTimeoutRetry) {
      clearTimeout(this.angularTimeoutRetry)
      // reset retry timer since we definitely have angular available
      this.angularTimeoutRetry = null
    }
  }

  /**
   * Gets Angular $timeout service via dependency injection
   */
  getAngularTimeout() {
    if (this.angularTimeout !== null) {
      return typeof this.angularTimeout === "function" ? this.angularTimeout : null
    }

    let code

    if (this.angularTimeoutRetry) {
      code = "retry"
      clearTimeout(this.angularTimeoutRetry)
    }

    try {
      if (typeof window.angular !== "undefined" && window.angular.element) {
        const injector = window.angular.element(document).injector()
        if (injector) {
          this.angularTimeout = injector.get("$timeout")
          // if warned before, log that we succeeded after retry
          if (this.angularTimeoutWarned) console.log("Stream Coordinator: Angular $timeout service resolved after retry")
          return this.angularTimeout
        } else {
          code = "no-injector"
        }
      } else {
        code = "no-angular"
      }
    } catch (error) {
      code = "error"
    }

    // normally, we never reach this point

    this.angularTimeout = false // mark as unavailable to avoid repeated attempts

    // if no timout has happened yet, set a one-time retry timer
    if (!this.angularTimeoutRetry) {
      // if we got here due to F5, this timeout should be canceled in a few ticks due to angular catch-up
      this.angularTimeoutRetry = setTimeout(() => {
        // this will make next $timeout request attempt to repeat one time
        if (!this.angularTimeout) this.angularTimeout = null
      }, 5000)
    }

    // this warning might appear in logs no more than three times
    // 1 - likely streams started too early (e.g. F5 was pressed)
    // 2 - after angular reports that it's ready
    // 3 - due to retry timer
    // those might happen in no particular order, therefore we add a code to it
    console.warn(`Stream Coordinator: Angular $timeout service not available (${code})`)
    this.angularTimeoutWarned = true
    return null
  }

  //////////////////////////////////////////////// TRIGGERS ///

  /**
   * Called before broadcasting stream events
   */
  beforeBroadcast() {
    if (this.processing) return
    this.processing = true
    this.finishCallback = null
    this.pending = 0

    // force completion if stuck
    if (this.safetyTimer) clearTimeout(this.safetyTimer)
    this.safetyTimer = setTimeout(() => {
      if (this.processing) this.forceComplete()
    }, this.safetyTimeout)
  }

  /**
   * Called after broadcasting stream events
   */
  afterBroadcast(callback) {
    if (callback && typeof callback === "function") {
      this.finishCallback = () => {
        this.finishCallback = undefined
        // this approach acts better for correct execution time
        // especially during locked-up threads
        Promise.resolve().then(callback)
      }
    } else {
      this.finishCallback = undefined
    }
    if (!this.processing) {
      this.finishCallback?.()
      return
    }
    this.startDeferredWork()
  }

  ////////////////////////////////////////////// DETECTIONS ///

  /**
   * Starts the deferred work detections
   */
  startDeferredWork() {
    this.pending = 0

    // waits for Angular DOM updates (ng-repeat, etc.)
    // we use $timeout(0) instead of $evalAsync() because it's the only way to ensure that the DOM is updated by angular
    const angularTimeout = this.getAngularTimeout()
    if (angularTimeout) {
      if (!this.angularRootScope) { // for safety
        this.angularRootScope = window.globalAngularRootScope
      }
      if (this.angularRootScope) { // we don't want to waste any cycles when angular is not working
        this.pending++
        angularTimeout(() => this.onOperationComplete(), 0)
      }
    }

    // waits for Vue reactivity updates
    if (window.Vue?.nextTick) {
      this.pending++
      window.Vue.nextTick(() => this.onOperationComplete())
    }

    // nothing pending - warn once and complete
    if (this.pending === 0) {
      if (!this.warned) {
        this.warned = true
        console.warn("Stream Coordinator: No Angular $timeout() nor Vue.nextTick() detected, using only Promise microtask instead")
      }
      this.complete()
    }
  }

  /**
   * Called when each deferred operation completes
   */
  onOperationComplete() {
    if (!this.processing) return
    this.pending--
    if (this.pending <= 0) {
      this.complete()
    }
  }

  ////////////////////////////////////////////// COMPLETION ///

  /**
   * Completes stream processing and signals game engine
   */
  complete() {
    if (!this.processing) return

    // clear safety timer
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer)
      this.safetyTimer = null
    }

    // Promise microtask - waits for promise-based async work
    Promise.resolve().then(() => {
      this.processing = false

      // signal game engine
      // window.uiFrameDone?.()
      window.beamng?.uiFrameCallback?.()

      // execute callback
      this.finishCallback?.()
    })
  }

  /**
   * Force completion
   */
  forceComplete() {
    this.complete()
  }
}
