import { icons } from "@/common/components/base"

const FIRST_LAYER_ACTIONS = [
  {
    value: "edit",
    label: "Edit",
    icon: icons.edit,
    validator: () => true,
  },
  {
    value: "order",
    label: "Change Order",
    icon: icons.order,
  },
  {
    value: "rename",
    label: "Rename",
    icon: icons.rename,
  },
  {
    value: "highlight",
    label: "Highlight On",
    icon: icons.eyeSolidOpened,
    toggleAction: true,
    inactiveLabel: "Highlight Off",
    inactiveIcon: icons.eyeSolidClosed,
  },
  {
    value: "visibility",
    label: "Enabled",
    icon: icons.eyeOutlineOpened,
    toggleAction: true,
    inactiveLabel: "Hidden",
    inactiveIcon: icons.eyeOutlineClosed,
  },
  {
    value: "delete",
    label: "Delete",
    icon: icons.trashBin2,
  },
]

function filterActions(actions, filters) {
  const filteredActions = []

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]
    if (filters.includes(action.value) || action.validator()) {
      if (action.items) action.items = filterActions(action.items, filters)

      filteredActions.push(action)
    }
  }

  return filteredActions
}

export const buildActionsDrawer = filters => {
  return filterActions(FIRST_LAYER_ACTIONS, filters)
}
