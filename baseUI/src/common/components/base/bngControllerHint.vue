<template>
  <div
    v-if="devFamily"
    class="bng-controller-hint"
    :class="{ 'bng-controller-hint-dark': dark }"
  >

    <!--
      simple controller svg as an example
      TODO: replace with an actual controllers
    -->
    <svg
      v-if="devFamily === 'xbox'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="20 140 460 220"
    >
      <rect x="60" y="180" width="380" height="140" rx="20" fill="#bcbcbc" stroke="#333" stroke-width="8"/>
      <!-- D-pad base -->
      <circle cx="120" cy="250" r="28" fill="#222"/>
      <!-- D-pad Up, Down, Left, Right -->
      <rect :class="actions.upov.class" x="114" y="222" width="12" height="20" rx="3" fill="#444"/>
      <rect :class="actions.dpov.class" x="114" y="258" width="12" height="20" rx="3" fill="#444"/>
      <rect :class="actions.lpov.class" x="98" y="242" width="20" height="12" rx="3" fill="#444"/>
      <rect :class="actions.rpov.class" x="122" y="242" width="20" height="12" rx="3" fill="#444"/>
      <!-- Start/Select -->
      <rect :class="actions.btn_start.class" x="210" y="240" width="18" height="10" rx="3" fill="#888"/>
      <rect :class="actions.btn_back.class" x="240" y="240" width="18" height="10" rx="3" fill="#888"/>
      <!-- A/B -->
      <circle :class="actions.btn_a.class" cx="340" cy="230" r="18" fill="#22a"/>
      <circle :class="actions.btn_b.class" cx="380" cy="270" r="18" fill="#22a"/>

      <!-- Lines and Text Labels -->
      <g class="bng-controller-hint-labels">
        <!-- D-pad Up -->
        <template v-if="actions.upov?.shown">
          <line x1="120" y1="202" x2="120" y2="170" stroke="#666" stroke-width="2"/>
          <text x="120" y="165" text-anchor="middle">{{ $tt(actions.upov?.label) }}</text>
        </template>
        <!-- D-pad Down -->
        <template v-if="actions.dpov?.shown">
          <line x1="120" y1="298" x2="120" y2="320" stroke="#666" stroke-width="2"/>
          <text x="120" y="335" text-anchor="middle">{{ $tt(actions.dpov?.label) }}</text>
        </template>
        <!-- D-pad Left -->
        <template v-if="actions.lpov?.shown">
          <line x1="78" y1="250" x2="50" y2="250" stroke="#666" stroke-width="2"/>
          <text x="45" y="255" text-anchor="end">{{ $tt(actions.lpov?.label) }}</text>
        </template>
        <!-- D-pad Right -->
        <template v-if="actions.rpov?.shown">
          <line x1="142" y1="250" x2="170" y2="250" stroke="#666" stroke-width="2"/>
          <text x="175" y="255" text-anchor="start">{{ $tt(actions.rpov?.label) }}</text>
        </template>
        <!-- Start Button -->
        <template v-if="actions.btn_start?.shown">
          <line x1="219" y1="270" x2="219" y2="300" stroke="#666" stroke-width="2"/>
          <text x="219" y="315" text-anchor="middle">{{ $tt(actions.btn_start?.label) }}</text>
        </template>
        <!-- Back/Select Button -->
        <template v-if="actions.btn_back?.shown">
          <line x1="249" y1="270" x2="249" y2="300" stroke="#666" stroke-width="2"/>
          <text x="249" y="315" text-anchor="middle">{{ $tt(actions.btn_back?.label) }}</text>
        </template>
        <!-- A Button -->
        <template v-if="actions.btn_a?.shown">
          <line x1="340" y1="212" x2="340" y2="180" stroke="#666" stroke-width="2"/>
          <text x="340" y="175" text-anchor="middle">{{ $tt(actions.btn_a?.label) }}</text>
        </template>
        <!-- B Button -->
        <template v-if="actions.btn_b?.shown">
          <line x1="380" y1="288" x2="380" y2="320" stroke="#666" stroke-width="2"/>
          <text x="380" y="335" text-anchor="middle">{{ $tt(actions.btn_b?.label) }}</text>
        </template>
      </g>
    </svg>

  </div>
</template>

<script setup>
import { computed } from "vue"
// import { ACTIONS_BY_UI_EVENT } from "@/bridge/libs/UINavEvents"
import { ACTIONS_BY_UI_EVENT } from "@/services/uiNav"
import { DEFAULT_LABELS } from "@/services/infoBar"
import useControls, { DEVICE_CONTROLS } from "@/services/controls"
import logger from "@/services/logger"

const Controls = useControls()

const props = defineProps({
  device: String,
  actions: [Array, String], // ["action", { action, label }, ...] or "action"
  dark: Boolean,
})

const available = [
  "xbox",
]

const devName = computed(() => {
  if (!props.device) return Controls.lastDevice
  let devName = props.device
  if (!/\d$/.test(devName)) {
    devName = Controls.lastDevices.find(dev => dev.startsWith(devName))
    if (!devName) devName = props.device + "0"
  }
  return devName
})

const devFamily = computed(() => {
  const viewerObj = Controls.makeViewerObj({
    device: devName.value,
    uiEvent: "back",
  })
  const family = viewerObj?.family
  if (!family || !available.includes(family)) return null
  return family
})

defineExpose({
  displayed: computed(() => !!devFamily.value),
})

const actions = computed(() => {
  let actions = props.actions
  if (!actions || !devFamily.value) return {}
  if (typeof actions === "string") actions = [actions]
  else if (!Array.isArray(actions) || actions.length === 0) return {}

  const bindings = {}

  // prepare data
  const allEvents = Object.keys(ACTIONS_BY_UI_EVENT)
  const allActions = Object.values(ACTIONS_BY_UI_EVENT)
  for (const action of actions) {
    if (!action) continue
    let item = action
    if (typeof item === "string") item = { action: item }
    else if (!item.action && !item.event) continue
    else item = { ...item }

    // action
    const actIdx = allEvents.indexOf(item.event || item.action)
    if (actIdx > -1) {
      item.event = allEvents[actIdx]
      item.action = allActions[actIdx]
    }
    if (!allActions.includes(item.action)) continue

    // binding
    const binding = Controls.findBindingForAction(item.action, devName.value)
    if (!binding) continue

    // label
    if (!item.event || item.event === item.action) {
      const idx = allActions.indexOf(item.action)
      if (idx > -1) item.event = allEvents[idx]
    }
    if (!item.label) item.label = DEFAULT_LABELS[item.event] || item.event || item.action

    // state
    item.shown = true
    item.class = {
      flash: item.flash,
    }

    bindings[binding.control.toLowerCase()] = item
  }

  logger.debug("resolved actions:", bindings)

  // add missing events as inactive
  for (const keyName of DEVICE_CONTROLS[devFamily.value]) {
    const key = keyName.toLowerCase()
    if (key in bindings) continue
    bindings[key] = { class: { inactive: true } }
  }

  return bindings
})
</script>

<style lang="scss" scoped>
.bng-controller-hint {
  position: relative;
  width: 100%;
  height: 100%;

  --line-color: #ccc;
  --text-color: #fff;
  &.bng-controller-hint-dark {
    --line-color: #444;
    --text-color: #333;
  }

  svg {
    width: 100%;
    height: 100%;

    .inactive {
      fill: none;
      stroke: #444;
    }

    .flash {
      animation: flash 0.5s ease-in-out infinite alternate;
    }

    .bng-controller-hint-labels {
      line {
        stroke: var(--line-color);
      }

      text {
        font-family: "Overpass", sans-serif;
        font-size: 14px;
        font-weight: 600;
        user-select: none;
        fill: var(--text-color);
      }
    }
  }

  @keyframes flash {
    0% { opacity: 1; }
    100% { opacity: 0.5; }
  }
}


</style>
