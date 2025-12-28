<template>
  <div
    v-for="entry in entries"
    :class="getModifierClass(entry)"
  >
    <div v-for="(action, actionIdx) in entry.actions" :key="actionIdx">
      <BngIcon v-if="actionIdx > 0" type="mathPlus" />
      <BngBinding
        :action="action.actionName"
        :device="action.device"
        :device-key="action.deviceKey"
        :show-unassigned="false"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { BngBinding, BngIcon } from '@/common/components/base'
import useControls from '@/services/controls'

const Controls = useControls()
const { isControllerUsed } = storeToRefs(Controls)

const props = defineProps({
  modifierActionInfos: {
    type: Object,
    required: true,
  },
})

const controllerActions = computed(() => {
  const mod1Active = props.modifierActionInfos['customModifier1']?.active
  const mod2Active = props.modifierActionInfos['customModifier2']?.active

  const mod1Disabled = props.modifierActionInfos['customModifier1']?.disabled
  const mod2Disabled = props.modifierActionInfos['customModifier2']?.disabled
  const mod1modifier2Disabled = props.modifierActionInfos['modifier1modifier2']?.disabled

  return [
    {
      actions: [{ actionName: 'customModifier2'}],
      active: !mod2Disabled && mod2Active && !mod1Active,
      disabled: mod2Disabled,
    },
    {
      actions: [{ actionName: 'customModifier2' }, {actionName: 'customModifier1'}],
      active: !mod1modifier2Disabled && mod1Active && mod2Active,
      disabled: mod1modifier2Disabled
    },
    {
      actions: [{ actionName: 'customModifier1' }],
      active: !mod1Disabled && mod1Active && !mod2Active,
      disabled: mod1Disabled,
    },
  ]
})

const kbmActions = computed(() => {
  const shiftActive = props.modifierActionInfos['shift']?.active !== undefined
  const ctrlActive = props.modifierActionInfos['ctrl']?.active !== undefined
  const altActive = props.modifierActionInfos['alt']?.active !== undefined
  return [
    { active: ctrlActive, actions: [{ actionName: 'kbmModifier1', device: 'keyboard0', deviceKey: 'ctrl' }] },
    //{ active: shiftActive, actions: [{ actionName: 'kbmModifier2', device: 'keyboard0', deviceKey: 'shift' }] },
    { active: altActive, actions: [{ actionName: 'kbmModifier3', device: 'keyboard0', deviceKey: 'alt' }] },
  ]
})

const entries = computed(() => (isControllerUsed.value ? controllerActions.value : kbmActions.value))

const getModifierClass = (entry) => {
  let cls = 'modifier-tile'
  if (entry.active) {
    cls += ' active'
  }
  if (entry.disabled) {
    cls += ' disabled'
  }
  return cls
}
</script>

<style lang="scss" scoped>
.modifier-tile {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25em 0.5em;
  position: relative;
  min-width: 0;

  // vertical separators between tiles
  & + .modifier-tile {
    border-left: 1px solid rgba(var(--bng-cool-gray-700-rgb), 0.7);
  }

  &.active {
    background-color: var(--bng-orange-b400);
  }

  &.disabled {
    opacity: 0.5;
    filter: grayscale(0.8);
    pointer-events: none;
  }

  :deep(.binding-wrap) {
    // ensure the binding uses the light style on dark background
    background: none;
    border-radius: var(--bng-corners-1);
  }
}
</style>
