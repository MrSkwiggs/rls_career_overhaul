import { useScopeCoordinator } from "./coordinator"
import { SCOPE_TYPES, INPUT_MODES, SCOPE_STATUS  } from "./types"
import { getNavigableElements, isNavigable, isAvailable } from "@/services/crossfire"
import logger from "@/services/logger"

export class FocusObserver {
  constructor() {
    this.coordinator = useScopeCoordinator()
    this.focusCache = new WeakMap()
    this.debouncedActions = new Map()
    this.isProcessingFocus = false

    this.setupEventListeners()
    this.coordinator.addObserver(this)
  }

  setupEventListeners() {
    // Focus event handling - just observe, don't navigate
    document.addEventListener("uinav-focus", this.handleFocusIn.bind(this), { passive: true })
    document.addEventListener("uinav-blur", this.handleFocusOut.bind(this), { passive: true })

    // UI navigation events - observe for scope state changes only
    document.addEventListener("ui_nav", this.handleUINavEvent.bind(this), { passive: true })
  }

  /**
   * Handle focus in events - React to focus changes for scope activation
   * @param {CustomEvent} e
   */
  handleFocusIn(e) {
    if (this.isProcessingFocus) return

    const { target } = e.detail
    const scope = this.findParentScope(target)

    if (!scope) return

    this.debounceFocusAction(`focus-${scope.id}`, () => {
      this.handleScopeFocusChange(scope, target)
    })
  }

  /**
   * Handle focus out events - React to focus leaving for scope deactivation
   * @param {CustomEvent} e
   */
  handleFocusOut(e) {
    const { target } = e.detail
    const scope = this.findParentScope(target)

    if (!scope) return

    // Only handle container scopes that auto-deactivate on focus loss
    if (scope.config.type === SCOPE_TYPES.CONTAINER) {
      this.debounceFocusAction(
        `blur-${scope.id}`,
        () => {
          // Check if focus has actually left the container
          const currentFocus = document.activeElement
          if (scope.status !== "inactive" && !scope.element.contains(currentFocus)) {
            this.coordinator.deactivateScope(scope.id, {
              reason: "focus-left-container",
              resumePrevious: true,
            })
          }
        },
        100
      ) // Longer delay for blur to allow focus to settle
    }
  }

  /**
   * Handle UI navigation events - React for scope state management only
   * @param {CustomEvent} e
   */
  handleUINavEvent(e) {
    if (!this.coordinator.enabled.value) return
    // TODO: Implement scenario for ui nav events and in mouse mode
  }

  /**
   * Find parent scope for element
   * @private
   */
  findParentScope(element) {
    const scopeElement = element.closest("[bng-scoped-nav]")
    if (!scopeElement) return null

    const scopeId = scopeElement.getAttribute("bng-scoped-nav")
    return this.coordinator.scopes.get(scopeId)
  }

  /**
   * Handle scope focus changes - just state management, no navigation
   * @private
   */
  async handleScopeFocusChange(scope, target) {
    // Container scopes auto-activate when child receives focus
    if (scope.config.type === SCOPE_TYPES.CONTAINER) {
      if (scope.status === SCOPE_STATUS.INACTIVE) {
        await this.coordinator.activateScope(scope.id, {
          activationType: SCOPE_STATUS.ACTIVE,
          focus: false, // Don't interfere with current focus
        })

        logger.debug("FocusObserver: auto-activated container scope", scope.id)
      }
    }

    // Always update last active element
    scope.lastActiveElement = target

    // Cache focus info for performance
    this.focusCache.set(target, {
      scopeId: scope.id,
      timestamp: Date.now(),
    })
  }

  /**
   * Debounced focus actions to prevent rapid state changes
   * @private
   */
  debounceFocusAction(key, action, delay = 50) {
    if (this.debouncedActions.has(key)) {
      clearTimeout(this.debouncedActions.get(key))
    }

    const timeoutId = setTimeout(() => {
      try {
        action()
      } catch (error) {
        logger.error("FocusObserver: error in debounced action", error)
      }
      this.debouncedActions.delete(key)
    }, delay)

    this.debouncedActions.set(key, timeoutId)
  }

  /**
   * Observer method for scope activation
   */
  scopeActivated({ scope, options }) {
    logger.debug("FocusObserver: scope activated", scope.id, options)

    // Update global navigation state based on scope type
    this.updateNavigationState(scope, true)

    // Auto-focus management if requested and no current focus interference
    if (scope.config.autoFocus !== false && options.focus !== false) {
      this.ensureScopeFocus(scope)
    }
  }

  /**
   * Observer method for scope deactivation
   */
  scopeDeactivated({ scope, options }) {
    logger.debug("FocusObserver: scope deactivated", scope.id, options)

    // Update global navigation state
    this.updateNavigationState(scope, false)

    // Clear any pending debounced actions for this scope
    this.clearScopeActions(scope.id)
  }

  /**
   * Observer method for input mode changes
   */
  inputModeChanged({ mode, controllerInfo }) {
    logger.debug("FocusObserver: input mode changed", mode, controllerInfo)

    // Update navigation behavior based on input mode
    const currentScope = this.coordinator.getCurrentScope()
    if (currentScope) {
      this.updateNavigationState(currentScope, true)
    }
  }

  /**
   * Update global navigation state (enable/disable scope boundaries)
   * @private
   */
  updateNavigationState(scope, isActive) {
    // This could be used to update UINavEvents or Crossfire state
    // For example, setting navigation boundaries or filtering events

    if (scope.config.type === SCOPE_TYPES.NONAV && isActive) {
      // For nonav scopes, we might want to disable certain navigation events
      logger.debug("FocusObserver: nonav scope active, navigation limited")
    }
  }

  /**
   * Ensure proper focus within a scope without manual navigation
   * @private
   */
  ensureScopeFocus(scope) {
    // Don't interfere if something is already properly focused
    const currentFocus = document.activeElement
    if (currentFocus && scope.element.contains(currentFocus) && isAvailable(currentFocus)) {
      return
    }

    // Find appropriate focus target
    let focusTarget = scope.lastActiveElement

    // Validate last active element
    if (!focusTarget || !document.contains(focusTarget) || !scope.element.contains(focusTarget)) {
      // Look for auto-focus element
      focusTarget = scope.element.querySelector('[bng-scoped-nav-autofocus]:not([bng-scoped-nav-autofocus="false"])')

      // Fallback to first navigable element in scope
      if (!focusTarget) {
        const navigableElements = getNavigableElements(scope.element).filter(el => isAvailable(el) && this.isDirectChild(scope.element, el))
        focusTarget = navigableElements[0]
      }
    }

    // Set focus without interfering with navigation
    if (focusTarget && isAvailable(focusTarget)) {
      setTimeout(() => {
        this.isProcessingFocus = true
        focusTarget.focus()
        setTimeout(() => {
          this.isProcessingFocus = false
        }, 0)
      }, 0)
    }
  }

  /**
   * Check if element is direct child of scope
   * @private
   */
  isDirectChild(scopeElement, childElement) {
    const closestScope = childElement.closest("[bng-scoped-nav]")
    return closestScope === scopeElement
  }

  /**
   * Clear all debounced actions for a scope
   * @private
   */
  clearScopeActions(scopeId) {
    const actionsToDelete = []
    for (const [key, timer] of this.debouncedActions) {
      if (key.includes(scopeId)) {
        clearTimeout(timer)
        actionsToDelete.push(key)
      }
    }
    actionsToDelete.forEach(key => this.debouncedActions.delete(key))
  }

  /**
   * Cleanup method
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener("uinav-focus", this.handleFocusIn)
    document.removeEventListener("uinav-blur", this.handleFocusOut)
    document.removeEventListener("ui_nav", this.handleUINavEvent)

    // Clear caches and timers
    this.focusCache = new WeakMap()

    // Clear all debounced actions
    this.debouncedActions.forEach(timer => clearTimeout(timer))
    this.debouncedActions.clear()

    // Remove from coordinator observers
    this.coordinator.removeObserver(this)
  }
}

// Singleton pattern
let focusObserverInstance = null

export function useFocusObserver() {
  if (!focusObserverInstance) {
    focusObserverInstance = new FocusObserver()
  }
  return focusObserverInstance
}
