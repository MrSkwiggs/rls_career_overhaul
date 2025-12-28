/**
 * Deferred work detection system that ensures all async operations
 * triggered by stream handlers are completed before signaling the game engine.
 *
 * Uses a 3-phase approach:
 * 1. Framework-specific scheduling (Vue.nextTick, Angular $timeout)
 * 2. Framework state monitoring (Angular digest queues, phases)
 * 3. General async queue tail insertion (microtasks, macrotasks, animation frames)
 *
 * This ensures that implicit rendering work (like ng-repeat updates) is properly
 * awaited before considering a listener "complete".
 */
class DeferredWorkChecker {
  /**
   * @param {StreamCoordinator} coordinator - Reference to coordinator for completion callbacks
   */
  constructor(coordinator) {
    this.coordinator = coordinator
  }

  /**
   * Initiates the 3-phase deferred work detection process for a listener.
   * @param {string} handlerId - Unique identifier for the handler being checked
   */
  waitForCompletion(handlerId) {
    if (this.coordinator.debug) console.log(`Starting deferred completion check for ${handlerId}`)
    this.scheduleAfterFrameworks(handlerId)
  }

  /**
   * Performs shared deferred work detection for all sync-complete listeners.
   * Much more efficient than per-listener detection with many listeners.
   * @param {Function} onComplete - Callback to invoke when all deferred work is done
   */
  waitForSharedCompletion(onComplete) {
    this.coordinator.perf && this.coordinator.perfStart("DeferredWorkChecker", "waitForSharedCompletion")
    if (this.coordinator.debug) console.log("Starting shared deferred work detection")
    const wrappedCallback = this.coordinator.perf ? () => {
      this.coordinator.perfFinish("DeferredWorkChecker", "waitForSharedCompletion")
      onComplete()
    } : onComplete
    this.scheduleSharedAfterFrameworks(wrappedCallback)
  }

  scheduleAfterFrameworks(handlerId) {
    const pendingChecks = []
    let completedChecks = 0
    const settings = this.coordinator.deferredSettings

    const onFrameworkComplete = (frameworkName) => {
      completedChecks++
      if (this.coordinator.debug) {
        console.log(`${frameworkName} framework check completed for ${handlerId} (${completedChecks}/${pendingChecks.length})`)
      }

      if (completedChecks === pendingChecks.length) {
        this.waitForFrameworkIdle(handlerId)
      }
    }

    // Angular framework scheduling
    const angularTimeout = this.coordinator.getAngularTimeout()
    if (settings.angularTimeout && this.coordinator.angularRootScope && angularTimeout) {
      pendingChecks.push("Angular")
      angularTimeout(() => onFrameworkComplete("Angular"), 0)
    }

    // Vue framework scheduling
    if (settings.vueNextTick && window.Vue?.nextTick) {
      pendingChecks.push("Vue")
      window.Vue.nextTick(() => onFrameworkComplete("Vue"))
    }

    if (pendingChecks.length === 0) {
      this.checkAsyncQueues(handlerId)
    }
  }

  scheduleSharedAfterFrameworks(onComplete) {
    this.coordinator.perf && this.coordinator.perfStart("DeferredWorkChecker", "scheduleSharedAfterFrameworks")
    const pendingChecks = []
    let completedChecks = 0
    const settings = this.coordinator.deferredSettings

    const onFrameworkComplete = (frameworkName) => {
      completedChecks++
      if (this.coordinator.debug) {
        console.log(`Shared ${frameworkName} framework check completed (${completedChecks}/${pendingChecks.length})`)
      }

      if (completedChecks === pendingChecks.length) {
        this.coordinator.perf && this.coordinator.perfFinish("DeferredWorkChecker", "scheduleSharedAfterFrameworks")
        this.waitForSharedFrameworkIdle(onComplete)
      }
    }

    // Angular framework scheduling
    const angularTimeout = this.coordinator.getAngularTimeout()
    if (settings.angularTimeout && this.coordinator.angularRootScope && angularTimeout) {
      pendingChecks.push("Angular")
      angularTimeout(() => onFrameworkComplete("Angular"), 0)
    }

    // Vue framework scheduling
    if (settings.vueNextTick && window.Vue?.nextTick) {
      pendingChecks.push("Vue")
      window.Vue.nextTick(() => onFrameworkComplete("Vue"))
    }

    if (pendingChecks.length === 0) {
      this.coordinator.perf && this.coordinator.perfFinish("DeferredWorkChecker", "scheduleSharedAfterFrameworks")
      this.checkSharedAsyncQueues(onComplete)
    }
  }

  waitForFrameworkIdle(handlerId, retryCount = 0) {
    const maxRetries = 10
    const settings = this.coordinator.deferredSettings

    if (retryCount >= maxRetries) {
      if (this.coordinator.debug) console.warn(`Max retries reached for ${handlerId}, proceeding anyway`)
      this.checkAsyncQueues(handlerId)
      return
    }

    // check if Angular is busy
    if (settings.angularBusyCheck && this.isAngularBusy()) {
      setTimeout(() => this.waitForFrameworkIdle(handlerId, retryCount + 1), 10)
    } else {
      this.checkAsyncQueues(handlerId)
    }
  }

  waitForSharedFrameworkIdle(onComplete, retryCount = 0) {
    if (retryCount === 0 && this.coordinator.perf) {
      this.coordinator.perfStart("DeferredWorkChecker", "waitForSharedFrameworkIdle")
    }

    const maxRetries = 10
    const settings = this.coordinator.deferredSettings

    if (retryCount >= maxRetries) {
      if (this.coordinator.debug) console.warn(`Max retries reached for shared deferred check, proceeding anyway`)
      this.coordinator.perf && this.coordinator.perfFinish("DeferredWorkChecker", "waitForSharedFrameworkIdle")
      this.checkSharedAsyncQueues(onComplete)
      return
    }

    // check if Angular is busy
    if (settings.angularBusyCheck && this.isAngularBusy()) {
      setTimeout(() => this.waitForSharedFrameworkIdle(onComplete, retryCount + 1), 10)
    } else {
      this.coordinator.perf && this.coordinator.perfFinish("DeferredWorkChecker", "waitForSharedFrameworkIdle")
      this.checkSharedAsyncQueues(onComplete)
    }
  }

  /**
   * Checks if Angular is currently busy with digest cycles or queue processing.
   * Monitors internal Angular state to ensure we don't signal completion while
   * the framework is still rendering or processing updates.
   * @returns {boolean} true if Angular is busy, false otherwise
   */
  isAngularBusy() {
    const rootScope = this.coordinator.angularRootScope
    if (!rootScope) return false
    this.coordinator.perf && this.coordinator.perfStart("DeferredWorkChecker", "isAngularBusy")
    const isBusy = (
      rootScope.$$phase !== null ||
      (rootScope.$$asyncQueue?.length > 0) ||
      (rootScope.$$postDigestQueue?.length > 0) ||
      (rootScope.$$applyAsyncQueue?.length > 0)
    )
    this.coordinator.perf && this.coordinator.perfFinish("DeferredWorkChecker", "isAngularBusy")
    return isBusy
  }

  /**
   * Final phase: Performs queue tail insertion across all JavaScript async queues
   * to ensure any remaining deferred work is completed before signaling done.
   * Includes microtasks, macrotasks, animation frames, and framework-specific queues.
   * @param {string} handlerId - Unique identifier for the handler being checked
   */
  checkAsyncQueues(handlerId) {
    const pendingQueues = new Set()
    let completed = false
    const settings = this.coordinator.deferredSettings

    const onQueueDrained = (queueName) => {
      if (completed) return
      pendingQueues.delete(queueName)

      if (pendingQueues.size === 0) {
        completed = true
        this.coordinator.finishListenerProcessing(handlerId)
      }
    }

    const timeoutId = setTimeout(() => {
      if (!completed) {
        completed = true
        if (this.coordinator.debug) console.warn(`Timeout waiting for deferred work in ${handlerId}, forcing completion`)
        this.coordinator.finishListenerProcessing(handlerId)
      }
    }, 300)

    const scheduleQueueCheck = (queueName, scheduleFunction) => {
      pendingQueues.add(queueName)
      scheduleFunction(() => {
        clearTimeout(timeoutId)
        onQueueDrained(queueName)
      })
    }

    // Core JavaScript async queues
    if (settings.microtask) {
      scheduleQueueCheck("microtask", callback => Promise.resolve().then(callback))
    }
    if (settings.macrotask) {
      scheduleQueueCheck("macrotask", callback => setTimeout(callback, 0))
    }

    if (settings.animationFrame && typeof requestAnimationFrame !== "undefined") {
      scheduleQueueCheck("animationFrame", callback => requestAnimationFrame(callback))
    }

    // Vue-specific queues
    if (settings.vueNextTickQueue && window.Vue?.nextTick) {
      scheduleQueueCheck("vue-nextTick", callback => window.Vue.nextTick(callback))
    }

    // Angular-specific queues
    const angularRootScope = this.coordinator.angularRootScope
    if (angularRootScope) {
      if (settings.angularEvalAsync && angularRootScope.$evalAsync) {
        scheduleQueueCheck("angular-evalAsync", callback => angularRootScope.$evalAsync(callback))
      }

      const angularTimeout = this.coordinator.getAngularTimeout()
      if (settings.angularTimeoutQueue && angularTimeout) {
        scheduleQueueCheck("angular-timeout", callback => angularTimeout(callback, 0))
      }
    }

    if (pendingQueues.size === 0) {
      clearTimeout(timeoutId)
      this.coordinator.finishListenerProcessing(handlerId)
    }
  }

  /**
   * Shared version of checkAsyncQueues - performs queue tail insertion once for all listeners.
   * Much more efficient than individual per-listener async queue detection.
   * @param {Function} onComplete - Callback to invoke when all async queues are drained
   */
  checkSharedAsyncQueues(onComplete) {
    this.coordinator.perf && this.coordinator.perfStart("DeferredWorkChecker", "checkSharedAsyncQueues")
    const pendingQueues = new Set()
    let completed = false
    const settings = this.coordinator.deferredSettings

    const onQueueDrained = (queueName) => {
      if (completed) return
      pendingQueues.delete(queueName)

      if (this.coordinator.debug && pendingQueues.size > 0) {
        console.log(`Shared queue ${queueName} drained, ${pendingQueues.size} remaining`)
      }

      if (pendingQueues.size === 0) {
        completed = true
        if (this.coordinator.debug) console.log("All shared async queues drained")
        this.coordinator.perf && this.coordinator.perfFinish("DeferredWorkChecker", "checkSharedAsyncQueues")
        onComplete()
      }
    }

    const timeoutId = setTimeout(() => {
      if (!completed) {
        completed = true
        if (this.coordinator.debug) console.warn("Timeout waiting for shared deferred work, forcing completion")
        this.coordinator.perf && this.coordinator.perfFinish("DeferredWorkChecker", "checkSharedAsyncQueues")
        onComplete()
      }
    }, 300)

    const scheduleQueueCheck = (queueName, scheduleFunction) => {
      pendingQueues.add(queueName)
      scheduleFunction(() => {
        clearTimeout(timeoutId)
        onQueueDrained(queueName)
      })
    }

    // JS async queues
    if (settings.microtask) {
      scheduleQueueCheck("microtask", callback => Promise.resolve().then(callback))
    }
    if (settings.macrotask) {
      scheduleQueueCheck("macrotask", callback => setTimeout(callback, 0))
    }

    if (settings.animationFrame && typeof requestAnimationFrame !== "undefined") {
      scheduleQueueCheck("animationFrame", callback => requestAnimationFrame(callback))
    }

    // Vue-specific queues
    if (settings.vueNextTickQueue && window.Vue?.nextTick) {
      scheduleQueueCheck("vue-nextTick", callback => window.Vue.nextTick(callback))
    }

    // Angular-specific queues
    const angularRootScope = this.coordinator.angularRootScope
    if (angularRootScope) {
      if (settings.angularEvalAsync && angularRootScope.$evalAsync) {
        scheduleQueueCheck("angular-evalAsync", callback => angularRootScope.$evalAsync(callback))
      }

      const angularTimeout = this.coordinator.getAngularTimeout()
      if (settings.angularTimeoutQueue && angularTimeout) {
        scheduleQueueCheck("angular-timeout", callback => angularTimeout(callback, 0))
      }
    }

    if (pendingQueues.size === 0) {
      clearTimeout(timeoutId)
      if (this.coordinator.debug) console.log("No shared async queues to check, completing immediately")
      this.coordinator.perf && this.coordinator.perfFinish("DeferredWorkChecker", "checkSharedAsyncQueues")
      onComplete()
    } else {
      if (this.coordinator.debug) console.log(`Checking ${pendingQueues.size} shared async queues: [${[...pendingQueues].join(", ")}]`)
    }
  }
}

export default DeferredWorkChecker
