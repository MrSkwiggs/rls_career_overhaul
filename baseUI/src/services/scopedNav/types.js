/**
 * @typedef {Object} ScopeConfig
 * @property {string} id - Unique scope identifier
 * @property {'normal' | 'container' | 'nonav' | 'popover'} type - Scope type
 * @property {HTMLElement} element - DOM element for the scope
 * @property {number} [priority=0] - Activation priority
 * @property {Function} [canActivate] - Validation function for activation
 * @property {Function} [canDeactivate] - Validation function for deactivation
 * @property {Function} [bubbleEvents] - Events allowed to bubble up
 * @property {string[]} [blockEvents] - Events blocked from bubbling
 * @property {boolean} [autoFocus=true] - Auto focus on activation
 * @property {boolean} [persistent=false] - Persist across navigation
 */

/**
 * @typedef {Object} ScopeState
 * @property {string} id - Scope ID
 * @property {'active' | 'suspended' | 'inactive'} state - Current status
 * @property {'full' | 'partial'} activationType - Activation type
 * @property {HTMLElement} [lastActiveElement] - Last focused element
 * @property {Object} metadata - Additional scope data
 */

/**
 * @typedef {Object} NavigationAction
 * @property {'activate' | 'deactivate' | 'suspend' | 'resume' | 'switch'} type
 * @property {string} scopeId
 * @property {Object} [options]
 * @property {number} [priority=0]
 */

export const SCOPE_TYPES = {
  NORMAL: "normal",
  CONTAINER: "container",
  POPOVER: "popover",
  NONAV: "nonav",
}

export const SCOPE_STATUS = {
  ACTIVE: "active",
  PARTIAL: "partial",
  SUSPENDED: "suspended",
  INACTIVE: "inactive",
}

export const INPUT_MODES = {
  MOUSE: "mouse",
  CONTROLLER: "controller",
  HYBRID: "hybrid",
}