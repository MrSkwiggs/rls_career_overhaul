// services/scopedNav/api.js
import { useScopeCoordinator } from "./coordinator"
import { INPUT_MODES, SCOPE_STATUS } from "./types"

/**
 * Main API for scoped navigation
 */
export function useScopedNavigation() {
  const coordinator = useScopeCoordinator()

  return {
    // === CORE SCOPE MANAGEMENT ===

    /**
     * Switch to a specific scope by name/ID
     * @param {string} scopeId - Target scope identifier
     * @param {Object} options - Switch options
     * @param {boolean} options.exclusive - Deactivate other scopes
     * @param {boolean} options.focus - Auto-focus on switch
     * @param {'active'|'partial'} options.activationType - Activation type
     */
    switchScope: (scopeId, options = {}) => coordinator.switchScope(scopeId, options),

    /**
     * Activate a scope
     * @param {string} scopeId
     * @param {Object} options
     */
    activateScope: (scopeId, options = {}) => coordinator.activateScope(scopeId, options),

    /**
     * Deactivate a scope
     * @param {string} scopeId
     * @param {Object} options
     */
    deactivateScope: (scopeId, options = {}) => coordinator.deactivateScope(scopeId, options),

    // === GLOBAL CONTROL ===

    /**
     * Enable scoped navigation globally
     */
    enable: () => coordinator.setEnabled(true),

    /**
     * Disable scoped navigation globally
     */
    disable: () => coordinator.setEnabled(false),

    /**
     * Check if scoped navigation is enabled
     */
    isEnabled: () => coordinator.enabled.value,

    // === INPUT MODE MANAGEMENT ===

    /**
     * Set input mode to mouse
     */
    setMouseMode: () => coordinator.setInputMode(INPUT_MODES.MOUSE),

    /**
     * Set input mode to controller
     */
    setControllerMode: () => coordinator.setInputMode(INPUT_MODES.CONTROLLER),

    /**
     * Set input mode to hybrid (auto-detect)
     */
    setHybridMode: () => coordinator.setInputMode(INPUT_MODES.HYBRID),

    /**
     * Get current input mode
     */
    getInputMode: () => coordinator.inputMode.value,

    // === STATE INSPECTION ===

    /**
     * Get currently active scope
     */
    getCurrentScope: () => coordinator.getCurrentScope(),

    /**
     * Get all active scopes
     */
    getActiveScopes: () => coordinator.getActiveScopes(),

    /**
     * Get scope stack (activation order)
     */
    getScopeStack: () => coordinator.scopeStack.value,

    /**
     * Get scope by ID
     */
    getScope: scopeId => coordinator.scopes.get(scopeId),

    /**
     * Check if scope is active
     */
    isScopeActive: scopeId => {
      const scope = coordinator.scopes.get(scopeId)
      return scope && scope.status !== SCOPE_STATUS.INACTIVE
    },

    // === ADVANCED FEATURES ===

    /**
     * Create scope group for batch operations
     * @param {string[]} scopeIds
     */
    createScopeGroup: scopeIds => ({
      activate: () => Promise.all(scopeIds.map(id => coordinator.activateScope(id))),
      deactivate: () => Promise.all(scopeIds.map(id => coordinator.deactivateScope(id))),
      toggle: () => {
        const allActive = scopeIds.every(id => {
          const scope = coordinator.scopes.get(id)
          return scope && scope.status !== SCOPE_STATUS.INACTIVE
        })

        if (allActive) {
          return Promise.all(scopeIds.map(id => coordinator.deactivateScope(id)))
        } else {
          return Promise.all(scopeIds.map(id => coordinator.activateScope(id)))
        }
      },
    }),

    /**
     * Add observer for scope events
     * @param {Object} observer
     */
    addObserver: observer => coordinator.addObserver(observer),

    /**
     * Remove observer
     * @param {Object} observer
     */
    removeObserver: observer => coordinator.removeObserver(observer),

    // === UTILITY METHODS ===

    /**
     * Find scope containing element
     * @param {HTMLElement} element
     */
    findScopeForElement: element => {
      const scopeElement = element.closest("[bng-scoped-nav]")
      if (!scopeElement) return null

      const scopeId = scopeElement.getAttribute("bng-scoped-nav")
      return coordinator.scopes.get(scopeId)
    },

    /**
     * Debug: Get internal state
     */
    debug: () => ({
      enabled: coordinator.enabled.value,
      inputMode: coordinator.inputMode.value,
      scopeCount: coordinator.scopes.size,
      stackDepth: coordinator.scopeStack.value.length,
      scopes: Array.from(coordinator.scopes.entries()),
    }),
  }
}

// Convenience exports for common operations
export const scopedNav = useScopedNavigation()
