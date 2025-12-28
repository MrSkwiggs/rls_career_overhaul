/**
 * Handles profiling and analysis of stream listener invocations.
 * Captures call stacks, tracks listener performance, and provides throttling capabilities.
 *
 * This is a separate system from the watchdog and uses copied (not imported) stack trace logic
 * to maintain independence and avoid circular dependencies.
 */
class ListenerProfiler {
  /**
   * @param {StreamCoordinator} coordinator - Reference to the main coordinator
   */
  constructor(coordinator) {
    this.coordinator = coordinator
    this.profiles = new Map() // listenerId -> profile data
    this.uiAppProfiles = new Map() // uiAppName -> profile data with instance tracking
    this.callHistory = [] // recent listener calls for debugging
    this.maxHistorySize = 100

    // Stack trace constants (copied from watchdog to maintain independence)
    this.STACK_TRACE_SKIP_LINES = 5 // Skip Error, captureStackTrace, profileCall, wrapHandler, and listener wrapper
    this.STACK_TRACE_REGEX_FULL = /at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/
    this.STACK_TRACE_REGEX = /at\s+(.+):(\d+):(\d+)/
  }

  /**
   * Triggers the debounced retroactive setup.
   * Called when Angular stream listeners are detected.
   */
  triggerRetroactiveSetup() {
    // Delegate to UI app profiler if available
    this.coordinator.uiApps?.triggerRetroactiveSetup()
  }

  /**
   * Captures call stack for a listener invocation (copied logic from watchdog)
   * @returns {Object|null} Stack trace data with filePaths, fullStack, and hasAnonymous
   */
  captureStackTrace() {
    // Enable stack capturing automatically when UI apps only mode is enabled
    if (!this.coordinator.profilerSettings.callStackGathering && !this.coordinator.profilerSettings.uiAppsOnly) return null

    const error = new Error()
    const stack = error.stack

    if (!stack) return null

    const lines = stack.split("\n")
    const relevantLines = lines.slice(this.STACK_TRACE_SKIP_LINES)
    const filePaths = []
    let hasAnonymous = false

    // Extract file paths
    for (const line of relevantLines) {
      let match = line.match(this.STACK_TRACE_REGEX_FULL)
      let functionName, filePath, lineNum, column
      if (match) {
        functionName = match[1]
        filePath = match[2]
        lineNum = match[3]
        column = match[4]
      } else {
        match = line.match(this.STACK_TRACE_REGEX)
        if (match) {
          functionName = "anonymous"
          filePath = match[1]
          lineNum = match[2]
          column = match[3]
        } else {
          continue // skip unparseable lines
        }
      }

      const isAnonymous =
        functionName?.includes("anonymous") ||
        functionName?.includes("<anonymous>") ||
        !functionName ||
        functionName.trim() === ""

      if (isAnonymous) {
        hasAnonymous = true
      }

      filePaths.push({
        functionName,
        filePath,
        line: lineNum,
        column,
        isAnonymous
      })
    }

    if (filePaths.length > 0 && this.coordinator.debug) {
      console.log("Stack trace captured:", filePaths.length, "paths")
    }

    return {
      filePaths,
      fullStack: stack,
      hasAnonymous
    }
  }



  /**
   * Profiles a listener call using pre-stored UI app association from registration time
   * @param {string} listenerId - Unique identifier for the listener
   * @param {Function} originalHandler - The original listener function
   * @returns {Function} Wrapped function that includes profiling
   */
  profileCall(listenerId, originalHandler) {
    const startTime = performance.now()

    // Get UI app association from registration time
    const uiApp = this.coordinator.listenerUIApps.get(listenerId)

    if (this.coordinator.debug) console.log(`Profiling ${listenerId}, UI app:`, uiApp ? `"${uiApp.name}"` : 'none')

    // If UI apps only mode is enabled and no UI app match, skip profiling
    if (this.coordinator.profilerSettings.uiAppsOnly && !uiApp) {
      return originalHandler
    }

    // Update general profile data
    let profile = this.profiles.get(listenerId)
    if (!profile) {
      profile = {
        listenerId,
        callCount: 0,
        totalTime: 0,
        avgTime: 0,
        errors: 0,
        uiApp: uiApp ? { name: uiApp.name, id: uiApp.id } : null,
      }
      this.profiles.set(listenerId, profile)
    }

    profile.callCount++

    if (uiApp) {
      let uiAppProfile = this.uiAppProfiles.get(uiApp.name)
      if (!uiAppProfile) {
        uiAppProfile = {
          name: uiApp.name,
          instances: new Set(),
          callCount: 0,
          totalTime: 0,
          avgTime: 0,
          errors: 0,
          listeners: new Set()
        }
        this.uiAppProfiles.set(uiApp.name, uiAppProfile)
      }
      uiAppProfile.instances.add(uiApp.id)
      uiAppProfile.listeners.add(listenerId)
    }

    // Store call history
    const callRecord = {
      listenerId,
      timestamp: Date.now(),
      startTime,
      uiApp: uiApp ? { name: uiApp.name, id: uiApp.id } : null,
    }

    // Return wrapper that completes timing
    const profiler = this
    return function(...args) {
      const context = this

      try {
        const result = originalHandler.apply(context, args)

        // Complete timing
        const endTime = performance.now()
        const duration = endTime - startTime
        profile.totalTime += duration
        profile.avgTime = profile.totalTime / profile.callCount

        if (uiApp) {
          const uiAppProfile = profiler.uiAppProfiles.get(uiApp.name)
          if (uiAppProfile) {
            uiAppProfile.callCount++
            uiAppProfile.totalTime += duration
            uiAppProfile.avgTime = uiAppProfile.totalTime / uiAppProfile.callCount

            if (profiler.coordinator.debug) console.log(`Updated UI app "${uiApp.name}" stats: calls=${uiAppProfile.callCount}, time=${uiAppProfile.totalTime.toFixed(2)}ms`)
          }
        }

        callRecord.duration = duration
        callRecord.success = true

        if (profiler.coordinator.debug) {
          const appInfo = uiApp ? ` (UI app: ${uiApp.name}#${uiApp.id})` : ""
          console.log(`Listener ${listenerId} completed in ${duration.toFixed(2)}ms${appInfo}`)
        }

        return result
      } catch (error) {
        profile.errors++

        if (uiApp) {
          const uiAppProfile = profiler.uiAppProfiles.get(uiApp.name)
          if (uiAppProfile) {
            uiAppProfile.errors++
          }
        }

        callRecord.error = error
        callRecord.success = false

        if (profiler.coordinator.debug) {
          const appInfo = uiApp ? ` (UI app: ${uiApp.name}#${uiApp.id})` : ""
          console.error(`Listener ${listenerId} failed${appInfo}:`, error)
        }

        throw error
      } finally {
        // Add to call history (keeping only recent calls)
        profiler.callHistory.push(callRecord)
        if (profiler.callHistory.length > profiler.maxHistorySize) {
          profiler.callHistory.shift()
        }
      }
    }
  }

  /**
   * Checks if a listener should be throttled (placeholder for future implementation)
   * @returns {boolean} true if the listener should be throttled
   */
  shouldThrottle() {
    if (!this.coordinator.profilerSettings.listenerThrottling) return false

    // TODO: Implement throttling logic based on:
    // - Call frequency from specific source files
    // - Performance impact (duration) 
    // - Error rate
    // - Configurable throttling rules

    return false
  }

  /**
   * Gets profiling statistics for all listeners
   * @returns {Object} Comprehensive profiling data
   */
  getStats() {
    const stats = {
      totalListeners: this.profiles.size,
      totalCalls: 0,
      totalTime: 0,
      avgTime: 0,
      listeners: [],
      recentCalls: this.callHistory.slice(-20),
      uiApps: [],
      uiAppsOnly: this.coordinator.profilerSettings.uiAppsOnly,
      totalUIAppsDetected: this.coordinator.uiApps?.uiAppsCache?.size || 0,
    }

    for (const [listenerId, profile] of this.profiles) {
      stats.totalCalls += profile.callCount
      stats.totalTime += profile.totalTime

      stats.listeners.push({
        listenerId,
        callCount: profile.callCount,
        totalTime: profile.totalTime.toFixed(2),
        avgTime: profile.avgTime.toFixed(2),
        errors: profile.errors,
        uiApp: profile.uiApp,
      })
    }

    for (const [uiAppName, uiAppProfile] of this.uiAppProfiles) {
      stats.uiApps.push({
        name: uiAppName,
        instanceIds: [...uiAppProfile.instances],
        instanceCount: uiAppProfile.instances.size,
        callCount: uiAppProfile.callCount,
        totalTime: uiAppProfile.totalTime.toFixed(2),
        avgTime: uiAppProfile.avgTime.toFixed(2),
        errors: uiAppProfile.errors,
        listenerCount: uiAppProfile.listeners.size,
        listenerIds: [...uiAppProfile.listeners]
      })
    }

    stats.avgTime = stats.totalCalls > 0 ? (stats.totalTime / stats.totalCalls).toFixed(2) : 0

    // sort listeners by total time (most expensive first)
    stats.listeners.sort((a, b) => parseFloat(b.totalTime) - parseFloat(a.totalTime))

    // sort UI apps by total time (most expensive first)
    stats.uiApps.sort((a, b) => parseFloat(b.totalTime) - parseFloat(a.totalTime))

    return stats
  }


  /**
   * Clears all profiling data
   */
  clearStats() {
    this.profiles.clear()
    this.uiAppProfiles.clear()
    this.callHistory.length = 0
    this.coordinator.listenerUIApps.clear()
  }
}

export default ListenerProfiler
