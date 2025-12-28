// InfoBar service - provides data and control methods for infobar
import { ref, watch } from "vue"
import { defineStore, storeToRefs } from "pinia"
import logger from "@/services/logger"
import { useBridge } from "@/bridge"
import { icons } from "@/common/components/base"
import { useUINavTracker } from "@/services/uiNavTracker"
import useControls from "@/services/controls"
// import { ACTIONS_BY_UI_EVENT } from "@/bridge/libs/UINavEvents"
import { ACTIONS_BY_UI_EVENT } from "@/services/uiNav"
import { SCROLL_EVENT_H, SCROLL_EVENT_V } from "@/services/crossfire"

const SCOPED_CHANGED_EVENT_NAME = "scopeChanged"

const EVENT_CROSSFIRE_MAP = {
  ok: "select",
  back: "back",
  tab_l: "tabLeft",
  tab_r: "tabRight",
}

export const CROSSFIRE_HINTS = {
  // dpad: { id: "dpad", content: { type: "icon", props: { type: icons.xboxDDefaultSolid }, label: "Navigate" } },
  select: { id: "select", content: { type: "binding", props: { uiEvent: "ok" }, label: "Select" } },
  back: { id: "back", content: { type: "binding", props: { uiEvent: "back" }, label: "Back" } },
  tabLeft: { id: "tabLeft", content: { type: "binding", props: { uiEvent: "tab_l" }, label: "Tab left" } },
  tabRight: { id: "tabRight", content: { type: "binding", props: { uiEvent: "tab_r" }, label: "Tab right" } },
}

export const CROSSFIRE_HINTS_ALL = Object.values(CROSSFIRE_HINTS)

// list of default labels as translation ids
// prefer inputActions section of the translation
export const DEFAULT_LABELS = {
  focus_u: "ui.inputActions.controllerui.focus_u.title",
  focus_r: "ui.inputActions.controllerui.focus_r.title",
  focus_d: "ui.inputActions.controllerui.focus_d.title",
  focus_l: "ui.inputActions.controllerui.focus_l.title",
  pause: "ui.inputActions.general.pause.title",
  menu: "ui.inputActions.controllerui.menu.title",
  back: "ui.inputActions.controllerui.back.title",
  details: "ui.inputActions.controllerui.details.title",
  advanced: "ui.inputActions.controllerui.advanced.title",
  camera: "ui.inputActions.controllerui.camera.title",
  logs: "ui.inputActions.controllerui.logs.title",
  tab_l: "ui.inputActions.controllerui.tab_l.title",
  tab_r: "ui.inputActions.controllerui.tab_r.title",
  modifier: "ui.inputActions.controllerui.modifier.title",
  zoom_out: "ui.inputActions.controllerui.zoom_out.title",
  zoom_in: "ui.inputActions.controllerui.zoom_in.title",
  subtab_l: "ui.inputActions.controllerui.subtab_l.title",
  subtab_r: "ui.inputActions.controllerui.subtab_r.title",
  center_cam: "ui.inputActions.controllerui.center_cam.title",
  action_4: "ui.inputActions.controllerui.action_4.title",
  move_ud: "ui.inputActions.controllerui.move_ud.title",
  move_lr: "ui.inputActions.controllerui.move_lr.title",
  focus_ud: "ui.inputActions.controllerui.focus_ud.title",
  focus_lr: "ui.inputActions.controllerui.focus_lr.title",
  rotate_h_cam: "ui.inputActions.controllerui.rotate_h_cam.title",
  rotate_v_cam: "ui.inputActions.controllerui.rotate_v_cam.title",
  ok: "ui.inputActions.controllerui.ok.title",
  cancel: "ui.inputActions.controllerui.cancel.title",
  action_2: "ui.inputActions.controllerui.action_2.title",
  action_3: "ui.inputActions.controllerui.action_3.title",
  context: "ui.inputActions.controllerui.context.title",
}

const HINT_GROUPS = () => [ // function for late init because of icons
  {
    names: ["back", "menu"],
    label: "ui.inputActions.controllerui.back.title",
  },
  {
    names: ["focus_u", "focus_d", "focus_r", "focus_l", "focus_lr", "focus_ud"],
    label: "ui.mainmenu.navbar.navigate",
    // content: [
    //   { type: "icon", props: { type: icons.xboxDDefaultSolid }, label: "ui.mainmenu.navbar.navigate" },
    //   { type: "icon", props: { type: icons.xboxThumbL }, label: "ui.mainmenu.navbar.navigate" },
    //   // { type: "binding", props: { deviceKey: "dpad" }, label: "ui.mainmenu.navbar.navigate" },
    //   // { type: "binding", props: { deviceKey: "thumbl" }, label: "ui.mainmenu.navbar.navigate" },
    // ],
    controllerOnly: true,
  },
  {
    // all uiEvent names should match in order to be grouped
    names: ["focus_u", "focus_d", "focus_r", "focus_l"],
    // replaces the "content" property for this group
    label: "ui.mainmenu.navbar.navigate",
    // content: { type: "icon", props: { type: icons.xboxDDefaultSolid }, label: "ui.mainmenu.navbar.navigate" },
    // content: { type: "binding", props: { uiEvent: "dpad" }, label: "ui.mainmenu.navbar.navigate" },
    // if content is not specified, the hint's bindings will be listed in full
    // controllerOnly: true,
  },
  {
    names: ["focus_lr", "focus_ud"],
    label: "ui.mainmenu.navbar.navigate",
    // content: { type: "icon", props: { type: icons.xboxThumbL }, label: "ui.mainmenu.navbar.navigate" },
    // content: { type: "binding", props: { uiEvent: "thumbl" }, label: "ui.mainmenu.navbar.navigate" },
    controllerOnly: true,
  },
  {
    // names: ["rotate_h_cam", "rotate_v_cam"],
    names: [SCROLL_EVENT_H, SCROLL_EVENT_V],
    label: "ui.mainmenu.navbar.scroll_label",
    // content: { type: "icon", props: { type: icons.xboxThumbR }, label: "ui.mainmenu.navbar.scroll_label" },
    controllerOnly: true,
  },
  {
    names: ["tab_r", "tab_l"],
    label: "ui.mainmenu.navbar.navigate",
    controllerOnly: true,
  },
  // {
  //   names: ["focus_lr", "focus_ud"],
  //   // content: { type: "icon", props: { type: icons.xboxView }, label: "ui.mainmenu.navbar.navigate" },
  // },
  // {
  //   names: ["move_ud", "move_lr"],
  // },
  // {
  //   names: ["zoom_in", "zoom_out"],
  // },
]

const AUTOID = "__auto"
const AUTOIDS = {
  binding: `${AUTOID}_binding`,
  group: `${AUTOID}_group`,
  labelGroup: `${AUTOID}_label_group`,
}

// enables the display of multiple bindings for the same action
const DISPLAY_ACTION_VARIANTS = false

export const useInfoBar = defineStore("infoBar", () => {
  const { events } = useBridge()
  const Controls = useControls()
  const { isControllerUsed, lastDevice } = storeToRefs(Controls)

  const hintGroups = HINT_GROUPS()
  const visible = ref(false)
  const showSysInfo = ref(false)
  const withAngular = ref(false)
  const hintsList = ref([])

  const hints = ref([])

  watch([isControllerUsed, lastDevice], () => _groupHints())

  const getControlGroup = (uiEvents, groupLabel) => {
    try {
      // if (!isControllerUsed.value) return null

      // to avoid extra processing, map all events and check they're all available
      const actions = uiEvents.map(event => ACTIONS_BY_UI_EVENT[event]).filter(Boolean)
      if (actions.length !== uiEvents.length) return null

      // Build viewer objects for all bindings by requesting variants
      // see also: Hint.vue
      const viewerObjsRaw = actions.map(action => Controls.makeViewerObj({ action, actionVariants: DISPLAY_ACTION_VARIANTS, useLastDevice: true }))
      const viewerObjs = viewerObjsRaw.flatMap(vo => (vo?.variants ? vo.variants : (vo ? [vo] : [])))

      const matchingItems = []

      const devNames = viewerObjs.reduce((res, obj) => obj && !res.includes(obj.devName) ? [...res, obj.devName] : res, [])
      for (const devName of devNames) {
        if (!devName) continue

        const devViewerObjs = viewerObjs.filter(obj => obj && obj.devName === devName && obj.ownGroups)
        if (devViewerObjs.length === 0) continue

        const groups = devViewerObjs[0].ownGroups
        let controls = devViewerObjs.map(obj => obj.control)
        for (const group of groups) {
          if (!group.controls.every(control => controls.includes(control))) continue
          controls = controls.filter(control => !group.controls.includes(control))
          let item
          if (group.label) {
            item = {
              type: "binding",
              props: {
                viewerObj: {
                  icon: devViewerObjs[0].icon,
                  ownLabel: group.label,
                }
              },
              label: groupLabel,
            }
          } else {
            item = {
              type: "icon",
              props: { type: icons[group.icon] },
              label: groupLabel,
            }
          }
          matchingItems.push(item)
        }
      }

      if (matchingItems.length === 0) return null
      return matchingItems.length === 1 ? matchingItems[0] : matchingItems
    } catch (err) {
      logger.error("Error in checkForControlGroup:", err)
      return null
    }
  }

  const _groupHints = () => {
    const res = []
    const groupCandidates = {}
    const labelGroups = {}

    // A label is custom if:
    // 1. It exists and
    // 2. It's not auto-generated (autoLabel is false) and
    // 3. It's different from the default label for this event
    const isCustomLabel = content => content && !content.autoLabel && content?.props?.uiEvent && content.label !== DEFAULT_LABELS[content?.props?.uiEvent]

    // First pass - try to group by labels
    for (const hint of hintsList.value) {
      const normalizedHint = !hint.content ? { content: hint } : hint
      const { content } = normalizedHint

      if (!content?.props?.uiEvent || !content.label) {
        res.push(normalizedHint)
        continue
      }

      // Try to group by label first
      const labelKey = content.label
      if (!labelGroups[labelKey]) {
        labelGroups[labelKey] = {
          hints: [normalizedHint],
          position: res.length,
        }
      } else {
        labelGroups[labelKey].hints.push(normalizedHint)
      }
    }

    const selectMatchingGroup = matchingGroups =>
      matchingGroups.length < 1 || isControllerUsed.value
      ? matchingGroups[0]
      : (matchingGroups.find(group => !group.controllerOnly) || matchingGroups.at(-1))

    // Process label groups
    for (const [label, group] of Object.entries(labelGroups)) {
      const action = group.hints[0].action
      if (group.hints.length > 1) {
        const events = group.hints.map(h => h.content.props.uiEvent)

        // Find any group with content that matches a subset of our events
        const matchingGroup = selectMatchingGroup(hintGroups.filter(g =>
          g.content &&
          g.names.every(name => events.includes(name)) &&
          events.filter(e => g.names.includes(e)).length === g.names.length
        ))

        if (matchingGroup) {
          // Skip this entire group if controllerOnly is true and no controller is connected
          if (matchingGroup.controllerOnly && !isControllerUsed.value) continue

          // Get group content and ensure we get the label
          const groupContent = Array.isArray(matchingGroup.content) ? matchingGroup.content[0] : matchingGroup.content
          // Prefer explicit group label when provided, otherwise fall back
          const groupLabel = matchingGroup.label || groupContent?.label || group.hints[0]?.content?.label

          // Try to find a control group for these events
          const groupEvents = group.hints.map(h => h.content.props.uiEvent)

          // Create labeled bindings with the group label
          const labeledBindings = group.hints.map(h => {
            // Make sure we create a COMPLETELY NEW object to avoid reference issues
            const newContent = {
              id: h.id,
              type: h.content.type,
              props: {...h.content.props},
            }

            // Preserve custom labels
            newContent.label = isCustomLabel(h.content) ? h.content.label : groupLabel

            return newContent
          })

          // Try to find a controller icon
          const controlGroup = getControlGroup(groupEvents, groupLabel)

          if (controlGroup) {
            const content = Array.isArray(controlGroup) ? controlGroup.map(item => ({...item})) : [{...controlGroup}]

            // If any candidate has a non-default custom label, use it (do not override explicit group label)
            const customLabelItem = group.hints.find(h => isCustomLabel(h.content))
            if (customLabelItem) {
              content.forEach(item => {
                item.label = customLabelItem.content.label
              })
            }

            res.splice(group.position, 0, {
              id: `${AUTOIDS.labelGroup}_${label}`,
              content: content,
              action,
            })
          } else {
            // Make sure the id has EXACTLY this structure
            res.splice(group.position, 0, {
              id: `${AUTOIDS.labelGroup}_${label}`,
              content: labeledBindings,
              action,
            })
          }
        } else {
          // No matching group found, add all hints with their labels
          res.splice(group.position, 0, {
            id: `${AUTOIDS.labelGroup}_${label}`,
            content: group.hints.map(h => h.content),
            action,
          })
        }
      } else {
        // If only one hint with this label, process it through normal grouping
        const hint = group.hints[0]
        const uiEvent = hint.content?.props?.uiEvent

        const isNoGroup = uiEvent => uiNavTracker.activeEvents.find(e => e.name === uiEvent)?.nogroup

        // If nogroup is set, don't attempt to group it
        if (isNoGroup(uiEvent)) {
          res.push(hint)
          continue
        }

        const matchingGroup = selectMatchingGroup(hintGroups.filter(group => group.names.includes(uiEvent)))

        if (!matchingGroup) {
          res.push(hint)
          continue
        }

        const groupId = matchingGroup.names.join(",")
        if (!(groupId in groupCandidates)) {
          groupCandidates[groupId] = {
            hints: [],
            content: [],
            position: res.length,
          }
        }

        const groupCandidate = groupCandidates[groupId]
        groupCandidate.hints.push(hint)
        groupCandidate.content.push(hint.content)

        if (groupCandidate.hints.length === matchingGroup.names.length) {
          // Skip this entire group if controllerOnly is true and no controller is connected
          if (matchingGroup.controllerOnly && !isControllerUsed.value) {
            // Don't add anything to the results for this group
            delete groupCandidates[groupId]
            continue
          }

          // Check if any hint in this group has nogroup flag
          const anyNogroup = groupCandidate.hints.some(h => isNoGroup(h.content?.props?.uiEvent))

          if (anyNogroup) {
            // If any hint has nogroup, don't group them
            res.splice(groupCandidate.position, 0, ...groupCandidate.hints)
          } else {
            // Try to get the label from the matching group's content
            const groupContent = Array.isArray(matchingGroup.content) ? matchingGroup.content[0] : matchingGroup.content

            // Always use the group's label when available, fall back to candidate's label
            const groupLabel = matchingGroup.label || groupContent?.label || groupCandidate.hints[0]?.content?.label

            // Create labeled content with the guaranteed group label
            const labeledContent = groupCandidate.content.map(item => {
              // Create a completely new object
              const newContent = {
                id: item.id,
                type: item.type,
                props: {...item.props},
              }

              // Preserve custom labels
              if (isCustomLabel(item)) {
                newContent.label = item.label
              } else {
                newContent.label = groupLabel
              }

              return newContent
            })

            const groupEvents = groupCandidate.hints.map(h => h.content.props.uiEvent)
            const controlGroup = getControlGroup(groupEvents, groupLabel)

            if (controlGroup) {
              const content = Array.isArray(controlGroup) ? controlGroup.map(icon => ({...icon})) : [{...controlGroup}]

              const customLabelItem = groupCandidate.content.find(item => isCustomLabel(item))
              if (customLabelItem) content.forEach(icon => icon.label = customLabelItem.label)

              res.splice(groupCandidate.position, 0, {
                id: `${AUTOIDS.group}_${groupId}`,
                content: content,
                action,
              })
            } else {
              res.splice(groupCandidate.position, 0, {
                id: `${AUTOIDS.group}_${groupId}`,
                content: labeledContent,
                action,
              })
            }
          }
          delete groupCandidates[groupId]
        }
      }
    }

    // Add any remaining ungrouped candidates
    for (const group of Object.values(groupCandidates)) {
      res.splice(group.position, 0, ...group.hints)
    }

    hints.value = res
    // logger.debug("[infoBar] grouped hints", res)
  }

  const uiNavTracker = useUINavTracker()

  /**
   * Empty the hints array.
   *
   * @return     {Object}  -
   */
  const clearHints = () => {
    hintsList.value = []
    _addTrackedEvents()
  }

  /**
   * Add hint(s).
   *
   * @param      {object, array<object>}  hintOrHints          The hint or hints to add
   * @param      {string, number}         [idOrPos=undefined]  The hint id or index at which to add [optional]
   * @param      {boolean}                [before=false]       True if the hints are to be added before the hint with
   *                                                           given id
   */
  const addHints = (hintOrHints, idOrPos = undefined, before = false) => {
    if (hintOrHints === CROSSFIRE_HINTS_ALL) {
      logger.warn("Approach with CROSSFIRE_HINTS_ALL is deprecated and crossfire hints are added by default.")
      return
    }
    const toAdd = [hintOrHints].flat() // allow for single or multiple hints in hintOrHints
      .map(hint => {
        if (typeof hint !== "object") return hint
        const content = hint.content || hint
        const uiEvent = content?.props?.uiEvent
        if (uiEvent) {
          if (!content.label) {
            content.autoLabel = true
            if (uiEvent in DEFAULT_LABELS) {
              content.label = DEFAULT_LABELS[uiEvent]
            } else {
              content.label = uiEvent.replaceAll("_", " ").toUpperCase()
            }
          }
        }
        return hint
      })

    // no position specified - add at end
    if (idOrPos === undefined) {
      hintsList.value = hintsList.value.concat(toAdd)
      // numeric position specified
    } else if (typeof idOrPos === "number") {
      hintsList.value.splice(idOrPos, 0, ...toAdd)
      // id specified - add hints before or after hint if found (don't add them otherwise)
    } else if (typeof idOrPos === "string") {
      const foundIndex = _findHintIndex(idOrPos)
      if (foundIndex > -1) hintsList.value.splice(foundIndex + (before ? 0 : 1), 0, ...toAdd)
    }

    _groupHints()
  }

  /**
   * Update a hint
   *
   * @param      {string, number}  idOrPos      The hint id or position in hint array
   * @param      {object}          updatedHint  The updated hint
   */
  const updateHint = (idOrPos, updatedHint) => {
    // position given
    if (typeof idOrPos === "number") {
      hintsList.value[idOrPos] = updatedHint
      // id given
    } else {
      const foundIndex = _findHintIndex(idOrPos)
      hintsList.value[foundIndex] = updatedHint
    }
    _groupHints()
  }

  /**
   * Removes hint(s).
   *
   * @param      {Array}   ids     The ids of hints to remove
   * @return     {Object}  -
   */
  const removeHints = (...ids) => {
    ids.forEach(id => {
      const foundIndex = _findHintIndex(id)
      if (foundIndex > -1) hintsList.value.splice(foundIndex, 1)
    })
    _groupHints()
  }

  /**
   * Flash hint(s) - draw attention to one or more hints
   *
   * @param      {Array}  ids     The ids of the hints to flash
   */
  const flashHints = (...ids) => {
    _setFlash(false, ids)
    setTimeout(() => _setFlash(true, ids), 0)
  }
  const _setFlash = (state, ids) =>
    ids.forEach(id => {
      const foundIndex = _findHintIndex(id)
      if (foundIndex > -1) hintsList.value[foundIndex].flash = state
    })

  const highlightHints = (state, ...ids) => {
    /* will 'highlight' a hint(s) - make a particular hint highlighted */
  }

  /**
   * Finds a hint index in the array.
   *
   * @param      {any}     id      The id of the hint
   * @return     {number}  index if found or -1 if not
   */
  const _findHintIndex = id => hintsList.value.findIndex(h => h.id === id)

  events.on(SCOPED_CHANGED_EVENT_NAME, data => {
    logger.debug("[infoBar] received data", data)
    if (!data) return

    clearHints()
    data.forEach(ev => {
      let content
      if (ev.label) {
        content = { content: { type: "binding", props: { uiEvent: ev.event }, label: ev.label } }
      } else {
        content = CROSSFIRE_HINTS[EVENT_CROSSFIRE_MAP[ev.event]]
      }
      addHints(content)
    })
  })

  function _addTrackedEvents() {
    const activeEvents = uiNavTracker.activeEvents
    // remove hints for events that are no longer active
    hintsList.value = hintsList.value
      .filter(hint => !hint.id?.startsWith(AUTOID) && activeEvents.some(e => e.name === hint.content.props.uiEvent))

    const currentBindings = hintsList.value
      .filter(hint => hint.content?.type === "binding")
      .map(hint => hint.content.props.uiEvent)

    const newEvents = activeEvents
      .filter(({ name }) => !currentBindings.includes(name))
      .map(({ name, label, nogroup, action }) => ({
        id: `${AUTOIDS.binding}_${name}`,
        content: {
          type: "binding",
          props: { uiEvent: name },
          label,
          // Mark labels from active events as non-auto if they come from UI components
          autoLabel: !label || label === DEFAULT_LABELS[name],
        },
        nogroup,
        action,
      }))
    // logger.debug("[infoBar] newEvents", newEvents.map(e => e.content.props.uiEvent + ": " + e.content.label))

    // add new events that aren't already shown
    addHints(newEvents)
  }

  // watch for changes in active events in uiNavTracker
  watch(() => uiNavTracker.activeEvents, _addTrackedEvents, { deep: true })

  return {
    visible,
    hintsList,
    hints,
    showSysInfo,
    withAngular,

    clearHints,
    addHints,
    updateHint,
    removeHints,

    flashHints,
    highlightHints,
  }
})
