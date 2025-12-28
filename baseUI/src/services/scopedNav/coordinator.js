import { reactive, ref, watch } from "vue"
import { ExecQueue } from "@/services/queue"
import { INPUT_MODES, SCOPE_STATUS } from "./types"
import useControls from "@/services/controls"
import logger from "@/services/logger"

export class ScopeCoordinator {
  constructor() {
    this.queue = new ExecQueue(0, 1) // Single-threaded execution
    this.scopes = reactive(new Map())
    this.scopeStack = ref([])
    this.enabled = ref(true)
    this.inputMode = ref(INPUT_MODES.HYBRID)
    this.observers = new Set()
    this.controls = useControls()

    this.setupInputModeDetection()
  }

  /**
   * Global enable/disable toggle
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    logger.debug("ScopeCoordinator: setEnabled", enabled)
    this.enabled.value = enabled

    if (!enabled) {
      this.queue.promise("deactivateAll", () => this.deactivateAllScopes("global-disable"))
    }
  }

  /**
   * Register a new scope
   * @param {Object} config - Scope configuration
   */
  registerScope(config) {
    const state = {
      id: config.id,
      status: SCOPE_STATUS.INACTIVE,
      activationType: "full",
      config,
      element: config.element,
      lastActiveElement: null,
      metadata: {},
    }

    this.scopes.set(config.id, state)
    logger.debug("ScopeCoordinator: scope registered", config.id)
  }

  /**
   * Unregister a scope and clean up
   * @param {string} scopeId
   */
  unregisterScope(scopeId) {
    const scope = this.scopes.get(scopeId)
    if (!scope) return

    // Deactivate if currently active
    if (scope.status === SCOPE_STATUS.ACTIVE) {
      this.deactivateScope(scopeId, { reason: "unregistered" })
    }

    this.scopes.delete(scopeId)
    this.scopeStack.value = this.scopeStack.value.filter(id => id !== scopeId)

    logger.debug("ScopeCoordinator: scope unregistered", scopeId)
  }

  /**
   * Activate a scope with queued execution
   * @param {string} scopeId
   * @param {Object} options
   */
  async activateScope(scopeId, options = {}) {
    if (!this.enabled.value) {
      logger.debug("ScopeCoordinator: navigation disabled, ignoring activation", scopeId)
      return
    }

    return this.queue.promise(
      "activateScope",
      async () => {
        await this.performActivation(scopeId, options)
      },
      [],
      {
        [`deactivate-${scopeId}`]: this.queue.resolution.replaceWithResolve,
      }
    )
  }

  /**
   * Deactivate a scope
   * @param {string} scopeId
   * @param {Object} options
   */
  async switchScope(targetScopeId, options = {}) {
    return this.queue.promise("switch", async () => {
      await this.performScopeSwitch(targetScopeId, options)
    })
  }

  /**
   * Suspend a scope
   * @param {string} scopeId
   * @param {Object} newScope
   */
  async suspendScope(scopeId, newScope) {
    return this.queue.promise("suspend", async () => {
      await this.performSuspension(scopeId, newScope)
    })
  }

  /**
   * Resume a suspended scope
   * @param {string} scopeId
   * @returns
   */
  async resumeScope(scopeId) {
    return this.queue.promise("resume", async () => {
      await this.performResume(scopeId)
    })
  }

  /**
   * Internal scope switching logic
   * @private
   */
  async performScopeSwitch(targetScopeId, options = {}) {
    const targetScope = this.scopes.get(targetScopeId)
    if (!targetScope) {
      throw new Error(`Scope ${targetScopeId} not found`)
    }

    logger.debug("ScopeCoordinator: switching to scope", targetScopeId, options)

    // Handle exclusive switching
    if (options.exclusive) {
      const activeScopes = this.getActiveScopes()
      for (const scope of activeScopes) {
        if (scope.id !== targetScopeId) {
          await this.performDeactivation(scope.id, { reason: "exclusive-switch" })
        }
      }
    }

    // Activate target scope
    await this.performActivation(targetScopeId, {
      activationType: options.activationType || SCOPE_STATUS.ACTIVE,
      focus: options.focus !== false,
      suspendParentScopes: options.suspendParentScopes,
    })
  }

  /**
   * Internal activation logic
   * @private
   */
  async performActivation(scopeId, options = {}) {
    const scope = this.scopes.get(scopeId)
    if (!scope) {
      throw new Error(`Scope ${scopeId} not found`)
    }

    // Validate activation
    if (scope.config.canActivate && !scope.config.canActivate()) {
      logger.debug("ScopeCoordinator: activation blocked by canActivate", scopeId)
      return
    }

    // Handle parent scope suspension
    if (options.suspendParentScopes) {
      await this.suspendParentScopes(scope)
    }

    // Update state
    scope.status = options.activationType || SCOPE_STATUS.ACTIVE
    scope.activationType = options.activationType === SCOPE_STATUS.PARTIAL ? "partial" : "full"

    // Update stack
    if (!this.scopeStack.value.includes(scopeId)) {
      this.scopeStack.value.push(scopeId)
    }

    this.notifyObservers("scopeActivated", { scope, options })
    logger.debug("ScopeCoordinator: scope activated", scopeId, scope.status)
  }

  /**
   * Internal deactivation logic
   * @private
   */
  async performDeactivation(scopeId, options) {
    const scope = this.scopes.get(scopeId)
    if (!scope) return

    // Validate deactivation
    if (scope.config.canDeactivate && !scope.config.canDeactivate()) {
      logger.debug("ScopeCoordinator: deactivation blocked by canDeactivate", scopeId)
      return
    }

    // Update state
    scope.status = SCOPE_STATUS.INACTIVE
    // TODO: Need to check if this will cause issues if the scope does not own the active element
    scope.lastActiveElement = document.activeElement

    // Remove from stack
    this.scopeStack.value = this.scopeStack.value.filter(id => id !== scopeId)

    // Resume previous scope if needed
    if (options.resumePrevious && this.scopeStack.value.length > 0) {
      const previousScopeId = this.scopeStack.value[this.scopeStack.value.length - 1]
      await this.resumeScope(previousScopeId)
    }

    this.notifyObservers("scopeDeactivated", { scope, options })
    logger.debug("ScopeCoordinator: scope deactivated", scopeId)
  }

  /**
   * Internal suspension logic
   * @private
   */
  async performSuspension(scopeId, newScope) {
    const scope = this.scopes.get(scopeId)
    if (!scope) return

    if (scope.status === SCOPE_STATUS.SUSPENDED) {
      logger.warn(`Scope ${scopeId} already suspended`)
      return
    }

    scope.status = SCOPE_STATUS.SUSPENDED
    this.notifyObservers("scopeSuspended", { scope, newScope })
    logger.debug("ScopeCoordinator: scope suspended", scopeId)
  }

  /**
   * Internal resume logic
   * @private
   */
  async performResume(scopeId) {
    const scope = this.scopes.get(scopeId)
    if (!scope) return

    // Deactivate any scopes that came after this one
    const scopeIndex = this.scopeStack.value.indexOf(scopeId)
    if (scopeIndex !== -1) {
      const scopesToDeactivate = this.scopeStack.value.slice(scopeIndex + 1)
      for (const id of scopesToDeactivate) {
        await this.performDeactivation(id)
      }
    }

    scope.status = SCOPE_STATUS.ACTIVE
    scope.activationType = "full"

    this.notifyObservers("scopeResumed", { scope })
    logger.debug("ScopeCoordinator: scope resumed", scopeId)
  }

  /**
   * Suspend parent scopes when activating a child
   * @private
   */
  async suspendParentScopes(scope) {
    const scopeIndex = this.scopeStack.value.indexOf(scope.id)
    if (scopeIndex === -1) return

    const parentScopes = this.scopeStack.value.slice(0, scopeIndex)
    for (const parentId of parentScopes) {
      const parentScope = this.scopes.get(parentId)
      if (parentScope && parentScope.element.contains(scope.element)) {
        await this.performSuspension(parentId, { scopeId: scope.id })
      }
    }
  }

  /**
   * Deactivate all scopes
   * @private
   */
  async deactivateAllScopes(reason) {
    const activeScopes = this.getActiveScopes()
    for (const scope of activeScopes) {
      await this.performDeactivation(scope.id, { reason })
    }
  }

  /**
   * Get current active scope
   */
  getCurrentScope() {
    const currentId = this.scopeStack.value[this.scopeStack.value.length - 1]
    return currentId ? this.scopes.get(currentId) : null
  }

  /**
   * Get all active scopes
   */
  getActiveScopes() {
    return Array.from(this.scopes.values()).filter(scope => scope.status !== SCOPE_STATUS.INACTIVE)
  }

  /**
   * Check if scope is active
   * @param {string} scopeId
   */
  isActiveScope(scopeId) {
    const current = this.getCurrentScope()
    if (!current) return false
    if (current.id === scopeId) return true

    if (current.activationType === SCOPE_STATUS.PARTIAL && this.scopeStack.value.length > 1) {
      const parentScope = this.scopes.get(this.scopeStack.value[this.scopeStack.value.length - 2])
      if (parentScope && parentScope.id === scopeId && parentScope.status === SCOPE_STATUS.ACTIVE) {
        return true
      }
    }

    return false
  }

  /**
   * Get scope by id
   * @param {string} scopeId
   */
  getScopeById(scopeId) {
    return this.scopes.get(scopeId)
  }

  /**
   * Observer pattern implementation
   */
  addObserver(observer) {
    this.observers.add(observer)
    return () => this.observers.delete(observer)
  }

  removeObserver(observer) {
    this.observers.delete(observer)
  }

  notifyObservers(event, data) {
    this.observers.forEach(observer => {
      if (observer[event]) {
        try {
          observer[event](data)
        } catch (error) {
          logger.error(`Error in scoped nav observer ${event}`, error)
        }
      }
    })
  }

  /**
   * Force input mode based on controls service state
   */
  syncWithControlsService() {
    const isControllerUsed = this.controls.isControllerUsed.value
    const targetMode = isControllerUsed ? INPUT_MODES.CONTROLLER : INPUT_MODES.MOUSE
    this.setInputMode(targetMode)
  }

  /**
   * Setup input mode detection
   * @private
   */
  setupInputModeDetection() {
    watch(
      () => this.controls.isControllerUsed.value,
      isControllerUsed => {
        const newMode = isControllerUsed ? INPUT_MODES.CONTROLLER : INPUT_MODES.MOUSE
        this.setInputMode(newMode)
      },
      { immediate: true }
    )

    // Additional fallback: Listen for direct UI nav events
    document.addEventListener("ui_nav", this.handleUINavEvent.bind(this), { passive: true })

    // Mouse fallbacck detection (in case controls service doesn't catch it)
    document.addEventListener("mousedown", this.handleMouseEvent.bind(this), { passive: true })
  }

  /**
   * Handle UI nav events for controller detection
   * @private
   */
  handleUINavEvent(e) {
    // Only switch to controller mode if we detect actual controller events
    if (this.isControllerEvent(e)) {
      this.setInputMode(INPUT_MODES.CONTROLLER)
    }
  }

  /**
   * Handle mouse events for mouse detection
   * @private
   */
  handleMouseEvent(e) {
    // Only switch to mouse mode if not already in controller mode
    // The controls service should handle this, but this is a fallback
    if (this.inputMode.value !== INPUT_MODES.CONTROLLER) {
      this.setInputMode(INPUT_MODES.MOUSE)
    }
  }

  /**
   * Check if event is from controller (fallback method)
   * @private
   */
  isControllerEvent(e) {
    const controllerEvents = ["focus_u", "focus_d", "focus_l", "focus_r", "ok", "back", "focus_ud", "focus_lr"]
    return controllerEvents.includes(e.detail?.name)
  }

  /**
   * Set input mode with enhanced logic
   * @param {'mouse' | 'controller' | 'hybrid'} mode
   */
  setInputMode(mode) {
    if (this.inputMode.value === mode) return

    // Validate mode against controls service state
    if (mode === INPUT_MODES.CONTROLLER && !this.controls.isControllerAvailable.value) {
      logger.debug("ScopeCoordinator: Controller mode requested but no controller available")
      return
    }

    logger.debug("ScopeCoordinator: inputMode changed", {
      from: this.inputMode.value,
      to: mode,
      controllerAvailable: this.controls.isControllerAvailable.value,
      controllerUsed: this.controls.isControllerUsed.value,
    })

    this.inputMode.value = mode
    this.notifyObservers("inputModeChanged", {
      mode,
      controllerInfo: {
        available: this.controls.isControllerAvailable.value,
        used: this.controls.isControllerUsed.value,
        lastDevice: this.controls.lastDevice.value,
      },
    })
  }

  /**
   * Cleanup method
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener("ui_nav", this.handleUINavEvent)
    document.removeEventListener("mousedown", this.handleMouseEvent)

    // Clean other resources
    this.queue.clear?.()
    this.scopes.clear()
    this.observers.clear()
    this.scopeStack.value = []
  }
}

// Allow only single instance
let coordinatorInstance = null

export function useScopeCoordinator() {
  if (!coordinatorInstance) {
    coordinatorInstance = new ScopeCoordinator()
  }
  return coordinatorInstance
}
