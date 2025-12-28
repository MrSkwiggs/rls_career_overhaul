/**
 * UINav Service - Main export barrel file
 * Provides centralized access to the UINav system
 */

import { getUINavServiceInstance } from "./uiNavService.js"

// Main service (singleton)
export { UINavService, setUINavServiceInstance, getUINavServiceInstance } from "./uiNavService.js"

// Individual classes (for testing or advanced usage)
export { UINavEventProcessor } from "./eventProcessor.js"
export { UINavActionHandlers } from "./actionHandlers.js"

// Handler system - export the singleton instance
export { default as UINavHandlers } from "./handlers/index.js"

// Vue composables
export { usePopupUINavScopeName, useUINavScope, watchUINavEventChange } from "./composables.js"

// Constants (re-export for convenience)
export {
  GAME_UI_NAVIGATION_EVENT,
  GAME_UI_NAV_MAP_ENABLED_EVENT,
  DOM_UI_NAVIGATION_EVENT,
  ACTIONS_BY_UI_EVENT,
  UI_EVENTS_BY_ACTION,
  UI_EVENTS,
  UI_EVENT_GROUPS,
  UI_SCOPE_ATTR,
  UI_EVENT_ATTR,
  VALUE_BASED_EVENTS,
  NAV_ACTIONS,
} from "./constants.js"

// Utility functions
export { isOnOffEvent, checkOn, normalizeEventDescriptor, handlePropagation, eventMatchesDescriptor, getDescriptorEventNameText } from "./utils.js"

// Utility function for backward compatibility
export const eventFirer = uiEvent => value => {
  const service = getUINavServiceInstance()
  return service.fireEvent(uiEvent, value)
}
