import { uniqueId } from "../../services/uniqueId.js"

/**
 * Handles Vue and Angular event systems to intercept stream listener registrations.
 * Wraps original handlers with tracking logic to monitor processing lifecycle and deferred work.
 */
class ListenerInterceptor {
  /**
   * @param {StreamCoordinator} coordinator - Reference to the main coordinator for callbacks
   * @param {Object} vueEventBus - TinyEmitter instance for Vue event interception
   */
  constructor(coordinator, vueEventBus) {
    this.coordinator = coordinator
    this.vueEventBus = vueEventBus
    this.vueIntercepted = false
    this.angularIntercepted = false
    this.wrappedHandlers = new Map() // global map for all Angular scopes
    this.trackedAngularListeners = 0
    this.trackedVueListeners = 0

    this.interceptVueListeners()
    this.interceptAngularListeners()
    if (this.coordinator.debug) console.log("Stream listener interception activated")
  }

  interceptVueListeners() {
    if (this.vueIntercepted) {
      if (this.coordinator.debug) console.log("Vue listeners already intercepted, skipping")
      return
    }

    if (!this.vueEventBus) {
      if (this.coordinator.debug) console.warn("Cannot intercept Vue listeners - vueEventBus not available")
      return
    }

    const originalOn = this.vueEventBus.on
    const originalOff = this.vueEventBus.off
    const wrappedHandlers = new Map()

    const interceptor = this
    this.vueEventBus.on = function(eventName, handler) {
      if (eventName === "onStreamsUpdate") {
        // TODO: vue UI apps are wrapped in Angular, so we need a way to enumerate them
        const handlerId = uniqueId("vue")
        interceptor.trackedVueListeners++
        interceptor.captureListenerRegistration(handlerId) // capture registration context for UI app matching
        const wrappedHandler = interceptor.wrapHandler(handler, handlerId)
        wrappedHandlers.set(handler, wrappedHandler)
        if (interceptor.coordinator.debug) console.log(`Intercepted Vue stream listener: ${handlerId} (tracked: ${interceptor.trackedVueListeners})`)
        return originalOn.call(this, eventName, wrappedHandler)
      }
      return originalOn.call(this, eventName, handler)
    }

    this.vueEventBus.off = function(eventName, handler) {
      if (eventName === "onStreamsUpdate" && wrappedHandlers.has(handler)) {
        const wrappedHandler = wrappedHandlers.get(handler)
        wrappedHandlers.delete(handler)
        interceptor.trackedVueListeners--
        if (interceptor.coordinator.debug) console.log(`Removed Vue stream listener (tracked: ${interceptor.trackedVueListeners})`)
        return originalOff.call(this, eventName, wrappedHandler)
      }
      return originalOff.call(this, eventName, handler)
    }

    // safety check: ensure Vue override didn't break anything
    try {
      this.vueEventBus.on('testEvent', function() {})
      this.vueEventBus.off('testEvent')
      if (this.coordinator.debug) console.log("Vue override safety check: PASSED")
    } catch (error) {
      console.error("Vue override safety check FAILED:", error)
      // Revert the override
      this.vueEventBus.on = originalOn
      this.vueEventBus.off = originalOff
      this.trackedVueListeners = 0
      return
    }

    this.vueIntercepted = true
    if (this.coordinator.debug) console.log("Vue stream listener interception enabled")
  }

  interceptAngularListeners() {
    if (this.angularIntercepted) {
      if (this.coordinator.debug) console.log("Angular listeners already intercepted, skipping")
      return
    }

    const rootScope = this.coordinator.angularRootScope

    if (!rootScope) {
      if (this.coordinator.debug) console.warn("Cannot intercept Angular listeners - no rootScope available")
      return
    }

    try {
      // get the Scope prototype to intercept ALL scopes (rootScope, childScopes, isolatedScopes, etc.)
      const ScopePrototype = rootScope.constructor.prototype

      const original$on = ScopePrototype.$on
      const original$off = ScopePrototype.$off || null

      const interceptor = this

      ScopePrototype.$on = function(eventName, handler) {
        const scope = this // Preserve scope context
        if (eventName === "streamsUpdate") {
          const handlerId = uniqueId("angular")
          interceptor.trackedAngularListeners++
          interceptor.captureListenerRegistration(handlerId)
          const wrappedHandler = interceptor.wrapHandler(handler, handlerId)
          interceptor.wrappedHandlers.set(handler, wrappedHandler)
          interceptor.coordinator.uiApps?.triggerRetroactiveSetup()
          if (interceptor.coordinator.debug) console.log(`Intercepted Angular stream listener: ${handlerId} (tracked: ${interceptor.trackedAngularListeners})`)
          return original$on.call(scope, eventName, wrappedHandler)
        }
        return original$on.call(scope, eventName, handler)
      }

      if (original$off) {
        ScopePrototype.$off = function(eventName, handler) {
          const scope = this // Preserve scope context
          if (eventName === "streamsUpdate" && interceptor.wrappedHandlers.has(handler)) {
            const wrappedHandler = interceptor.wrappedHandlers.get(handler)
            interceptor.wrappedHandlers.delete(handler)
            interceptor.trackedAngularListeners--
            if (interceptor.coordinator.debug) console.log(`Removed Angular stream listener (tracked: ${interceptor.trackedAngularListeners})`)
            return original$off.call(scope, eventName, wrappedHandler)
          }
          return original$off.call(scope, eventName, handler)
        }
      }

      // safety check: ensure prototype override didn't break anything
      try {
        const testScope = rootScope.$new()
        testScope.$on('testEvent', function() {})
        testScope.$destroy()
        if (this.coordinator.debug) console.log("Angular prototype override safety check: PASSED")
      } catch (error) {
        console.error("Angular prototype override safety check FAILED:", error)
        // revert the prototype override
        ScopePrototype.$on = original$on
        if (original$off) {
          ScopePrototype.$off = original$off
        }
        this.trackedAngularListeners = 0
        return
      }

      if (this.coordinator.debug) console.log("Angular stream listener interception enabled")
      this.angularIntercepted = true

      // handle existing listeners that were registered before interception
      const counts = this.coordinator.countStreamListeners()
      if (counts.raw.angular > counts.tracked.angular) {
        const unwrapped = counts.raw.angular - counts.tracked.angular
        if (this.coordinator.debug) {
          console.log(`🔄 Found ${unwrapped} existing unwrapped listeners (will complete immediately on stream updates)`)
        }
      }
    } catch (error) {
      console.error("Error during Angular prototype interception:", error)
    }
  }

  /**
   * Captures listener registration context to identify which UI app is registering this listener.
   * Called during $on() interception, not during listener execution.
   * @param {string} handlerId - Unique identifier for the listener being registered
   */
  captureListenerRegistration(handlerId) {
    if (!this.coordinator.profilerSettings.uiAppsOnly || !this.coordinator.uiApps) return

    const stackTrace = this.coordinator.profiler.captureStackTrace()
    if (!stackTrace) return

    // enumerate UI apps and try to match registration stack trace
    this.coordinator.uiApps.enumerateUIApps()
    const uiApp = this.coordinator.uiApps.matchUIApp(stackTrace)

    if (uiApp) {
      // Store the UI app association for this listener
      this.coordinator.listenerUIApps.set(handlerId, uiApp)
      if (this.coordinator.debug) console.log(`Registered listener ${handlerId} from UI app "${uiApp.name}"`)
    } else if (this.coordinator.debug) {
      console.log(`Listener ${handlerId} from non-UI app source`)
    }
  }

  /**
   * Creates a tracking wrapper around the original handler function.
   * Handles both synchronous and asynchronous handlers, ensuring proper
   * lifecycle tracking. Uses shared deferred work detection.
   * @param {Function} originalHandler - The original stream event handler
   * @param {string} handlerId - Unique identifier for this handler instance
   * @returns {Function} Wrapped handler that includes tracking logic
   */
  wrapHandler(originalHandler, handlerId) {
    const interceptor = this
    return function(...args) {
      const context = this // Angular scope or Vue context
      const isAngular = args.length === 2 // Angular: (event, data), Vue: (data)
      const streamData = isAngular ? args[1] : args[0]

      interceptor.coordinator.startListenerProcessing(handlerId)

      // apply profiling if enabled
      const shouldProfile = !!interceptor.coordinator.profiler && (
        interceptor.coordinator.profilerSettings.callStackGathering ||
        interceptor.coordinator.profilerSettings.listenerThrottling ||
        interceptor.coordinator.profilerSettings.uiAppsOnly
      )

      const profiledHandler = shouldProfile
        ? interceptor.coordinator.profiler.profileCall(handlerId, originalHandler)
        : originalHandler

      if (interceptor.coordinator.debug && shouldProfile) console.log(`Profiling enabled for ${handlerId}`)

      try {
        // pass all original arguments to preserve Angular (event, data) or Vue (data) signature
        const result = profiledHandler.apply(context, args)

        if (result?.then) {
          // async handler - wait for promise completion, then mark sync complete
          result
            .then(() => {
              interceptor.coordinator.finishSyncProcessing(handlerId)
            })
            .catch((error) => {
              console.error(`Async stream handler ${handlerId} failed:`, error)
              interceptor.coordinator.finishListenerProcessing(handlerId)
            })
        } else {
          // sync handler - immediately mark as sync complete
          interceptor.coordinator.finishSyncProcessing(handlerId)
        }
      } catch (error) {
        console.error(`Stream handler ${handlerId} failed:`, error)
        if (interceptor.coordinator.debug) {
          console.error(`Handler context:`, typeof context, context?.constructor?.name || 'unknown')
          console.error(`Stream data:`, streamData ? `object with ${Object.keys(streamData).length} keys` : 'undefined/null')
        }
        interceptor.coordinator.finishListenerProcessing(handlerId)
      }
    }
  }
}

export default ListenerInterceptor
