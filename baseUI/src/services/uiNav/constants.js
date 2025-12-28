/**
 * Core constants defining the interface between Lua and UI
 * This is the ONLY UINav-related file that should be in bridge
 */

// Event names used in Lua ↔ UI communication
export const UI_NAV_ACTION_GROUP = "UINavActions"
export const GAME_UI_NAVIGATION_EVENT = "UINavigation"
export const GAME_UI_NAV_MAP_ENABLED_EVENT = "MenuActionMapEnabled"
export const DOM_UI_NAVIGATION_EVENT = "ui_nav"

export const ACTIONS_BY_UI_EVENT = {
  focus_u: "menu_item_up",
  focus_r: "menu_item_right",
  focus_d: "menu_item_down",
  focus_l: "menu_item_left",
  // 'pause': 'pause', // FIXME: does not exist
  menu: "toggleMenues",
  back: "menu_item_back",
  details: "cui_details",
  advanced: "cui_advanced",
  camera: "cui_camera",
  logs: "cui_logs",
  tab_l: "menu_tab_left",
  tab_r: "menu_tab_right",
  modifier: "cui_modifier",
  // 'zoom_out': 'cui_zoom_out', // FIXME: does not exist
  // 'zoom_in': 'cui_zoom_in', // FIXME: does not exist
  // 'subtab_l': 'cui_subtab_l', // FIXME: does not exist
  // 'subtab_r': 'cui_subtab_r', // FIXME: does not exist
  // 'center_cam': 'center_camera', // FIXME: does not exist
  action_4: "cui_action_4",
  // 'move_ud': 'cui_move_ud', // FIXME: does not exist
  // 'move_lr': 'cui_move_lr', // FIXME: does not exist
  // 'focus_ud': 'menu_item_radial_y',
  // 'focus_lr': 'menu_item_radial_x',
  focus_ud: "menu_item_focus_ud",
  focus_lr: "menu_item_focus_lr",
  rotate_h_cam: "menu_item_radial_right_x",
  rotate_v_cam: "menu_item_radial_right_y",
  ok: "menu_item_select",
  cancel: "cui_cancel",
  action_2: "cui_action_2",
  action_3: "cui_action_3",
  context: "cui_context",
  gameplay_interact: "cui_gameplay_interact",
}
export const UI_EVENTS_BY_ACTION = Object.assign({}, ...Object.entries(ACTIONS_BY_UI_EVENT).map(([k, v]) => ({ [v]: k })))
/**
 * UI Events available in the UI Nav system
 * @readonly
 * @enum
 */
export const UI_EVENTS = {
  /** Move focus up to nearest UI element */
  focus_u: "focus_u",
  /** Move focus right to nearest UI element */
  focus_r: "focus_r",
  /** Move focus down to nearest UI element */
  focus_d: "focus_d",
  /** Move focus left to nearest UI element */
  focus_l: "focus_l",
  /** Pause/unpause */
  pause: "pause",
  /** Activate the menu (or possibly 'select') */
  menu: "menu",
  /** 'Cancel' or return back to previous screen */
  back: "back",
  /** View details */
  details: "details",
  /** Advanced */
  advanced: "advanced",
  /** Camera switch */
  camera: "camera",
  /** View logs */
  logs: "logs",
  /** Move to the previous tab to the left */
  tab_l: "tab_l",
  /** Move to the next tab to the right */
  tab_r: "tab_r",
  /** Modifier key has been pressed/released */
  modifier: "modifier",
  /** Zoom out */
  zoom_out: "zoom_out",
  /** Zoom in */
  zoom_in: "zoom_in",
  /** Move to the previous subtab to the left */
  subtab_l: "subtab_l",
  /** Move to the next subtab to the right */
  subtab_r: "subtab_r",
  /** Centre the camera */
  center_cam: "center_cam",
  /** Quaternary action */
  action_4: "action_4",
  /** Move vertically (up/down) using a scalar input */
  move_ud: "move_ud",
  /** Move horizontally (left/right) using a scalar input */
  move_lr: "move_lr",
  /** Move focus vertically (up/down) using a scalar input  (usually radial menu) */
  focus_ud: "focus_ud",
  /** Move focus horizontally (left/right) using a scalar input  (usually radial menu) */
  focus_lr: "focus_lr",
  /** Scroll menu horizontally / Rotate camera on horizontal-axis (scalar input) */
  rotate_h_cam: "rotate_h_cam",
  /** Scroll menu vertically / Rotate camera on vertical-axis (scalar input) */
  rotate_v_cam: "rotate_v_cam",
  /** Accept/click/take the currently selected item */
  ok: "ok",
  /** Cancel */
  cancel: "cancel",
  /** Secondary action */
  action_2: "action_2",
  /** Tertiary action */
  action_3: "action_3",
  /** Toggle context menu / take context specific action */
  context: "context",
  /** Gameplay interaction action */
  gameplay_interact: "gameplay_interact",
}

/**
 * UI Event groups available in the UI Nav system
 * @readonly
 * @enum
 */
export const UI_EVENT_GROUPS = {
  /** Non-scalae Focus Move events */
  focusMove: [UI_EVENTS.focus_u, UI_EVENTS.focus_d, UI_EVENTS.focus_l, UI_EVENTS.focus_r],
  /** Scalar Focus Move events (usually radial menu) */
  focusMoveScalar: [UI_EVENTS.focus_ud, UI_EVENTS.focus_lr],
  /** Scalar Move events */
  moveScalar: [UI_EVENTS.move_ud, UI_EVENTS.move_lr],
  /** All navigation events (focusMove, focusMoveScalar, moveScalar) */
  navigation: [
    UI_EVENTS.focus_u,
    UI_EVENTS.focus_d,
    UI_EVENTS.focus_l,
    UI_EVENTS.focus_r,
    UI_EVENTS.focus_ud,
    UI_EVENTS.focus_lr,
    UI_EVENTS.move_ud,
    UI_EVENTS.move_lr,
  ],
  /** All UI Events */
  allEvents: Object.keys(ACTIONS_BY_UI_EVENT),
}

export const NAV_ACTIONS = ["focus_u", "focus_d", "focus_l", "focus_r"]

// Handler-specific constants
export const VALUE_BASED_EVENTS = ["zoom_out", "zoom_in", "subtab_l", "subtab_r", "move_ud", "move_lr", "focus_ud", "focus_lr", "rotate_h_cam", "rotate_v_cam"]

// DOM attributes
export const UI_SCOPE_ATTR = "bng-ui-scope"
export const UI_EVENT_ATTR = "ui-nav-event"
