<template>
  <span
    v-if="display"
    class="binding-wrapper"
    :class="{
      'binding-theme-dark': dark,
      'binding-theme-light': !dark,
      'with-variants': viewerVariants.length > 1,
      'vertical': vertical,
    }"
    :ui-event="uiEvent"
  >
    <span
      v-for="(viewerObjs, index) in viewerVariants"
      :key="index"
      class="binding-container"
      :class="{
        'combo-binding': viewerObjs.length > 1,
      }"
    >
      <template v-for="(viewerObj, index) in viewerObjs" :key="index">
        <!-- control uses a generic representation -->
        <kbd v-if="viewerObj && viewerObj.controlSegments">
          <span v-for="(seg, i) in viewerObj.controlSegments" :key="i" :class="seg.class">{{ seg.value }}</span>
        </kbd>
        <!-- control uses a dedicated icon -->
        <BngIcon
          v-else-if="viewerObj && viewerObj.special"
          class="bng-binding-icon"
          :type="icons[viewerObj.ownIcon]"
          :color="iconColor"
        />
        <!-- control is not assigned, fallback to empty display -->
        <BngIcon
          v-else-if="!viewerObj && showUnassigned"
          class="bng-binding-icon n-a"
          :type="icons.NA"
          :color="iconColor"
        />
        <span v-if="index < viewerObjs.length - 1" class="combo-separator">+</span>
      </template>
    </span>
  </span>
  <!-- <span v-else>{{ props }}</span> -->
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted, inject } from "vue"
import { storeToRefs } from "pinia"
import { BngIcon, icons } from "@/common/components/base"
import { default as useControls, CONTROL_LABELS } from "@/services/controls"
import { useUINavTracker } from "@/services/uiNavTracker"
import { uniqueId } from "@/services/uniqueId"

const $simplemenu = inject("$simplemenu")
const Controls = useControls()
const { showIfController, lastControllersSignature } = storeToRefs(Controls)

const props = defineProps({
  action: String,
  showUnassigned: Boolean,
  device: [String, Array],
  deviceKey: String,
  dark: Boolean,
  deviceMask: [String, Function],
  controller: Boolean, // use this instead of deviceMask to check for any controller
  uiEvent: String,
  trackIgnore: Boolean,
  unassignedText: {
    default: "[N/A]",
    type: String,
  },
  viewerObj: Object,
  imagePack: String,
  actionVariants: Boolean,
  useLastDevice: { type: Boolean, default: true },
  vertical: Boolean,
})

const iconColors = {
  dark: "var(--bng-off-black)",
  light: "var(--bng-off-white)",
}
const iconColor = computed(() => iconColors[props.dark ? "dark" : "light"])
const iconColorInverted = computed(() => iconColors[props.dark ? "light" : "dark"])

const controllerOnly = computed(() => props.controller || $simplemenu.value)

const MULTI_ID = "[PLUS]" // this is a special case for multi-control keyboard bindings
const MULTI_LABEL = "+" // iconfont glyph

const LABELS_BIG = [ // list of controls that should become bigger
  // MULTI_ID,
  "enter",
  "tab",
  "capslock",
  "backspace",
  "lshift",
  "rshift",
  "left",
  "right",
  "up",
  "down",
  "space",
  "grave",
  "comma",
  "period",
].map(c => CONTROL_LABELS[c] || c)

const LABELS_OFFSET = [ // list of controls that should be offset from the bottom
  "space",
].map(c => CONTROL_LABELS[c] || c)

const rgxSanitize = s => s.replace(/[-.+*$^?:|[\](){}]/g, "\\$&")

const LABELS_RGX = new RegExp("(" + [MULTI_ID, ...LABELS_BIG, ...LABELS_OFFSET].map(rgxSanitize).join("|") + ")", "g")

const viewerObj = computed(() => {
  if (props.viewerObj) return props.viewerObj
  if (controllerOnly.value && showIfController.value) {
    const opts = { ...props }
    opts.controller = true
    opts._controllerSignature = lastControllersSignature.value
    return Controls.makeViewerObj(opts)
  }
  return Controls.makeViewerObj(props)
})
const viewerVariants = computed(() => {
  if (!viewerObj.value) return []
  // handle variants if any
  let variants = viewerObj.value.variants || [viewerObj.value]
  // handle multiControls if any
  variants = variants.map(obj => obj.multiControls || [obj])
  // build a better label for enlarged characters
  for (const objs of variants) {
    for (const obj of objs) {
      // note: it mutates the original binding, so to update things at runtime - temporarily remove !obj.controlSegments condition
      //       but for optimal performance in production - keep it as is
      if (obj && (!obj.special || obj.ownLabel) && !obj.controlSegments) {
        let control = obj.ownLabel || obj.control
        control = control.replace(/ \+ /g, MULTI_ID)
        obj.controlSegments = String(control).split(LABELS_RGX).filter(Boolean).map(segment => ({
          value: segment === MULTI_ID ? MULTI_LABEL : segment,
          class:
            (LABELS_BIG.includes(segment) ? "label-bigger " : "") +
            (LABELS_OFFSET.includes(segment) ? "label-offset " : "") +
            (segment === MULTI_ID ? "label-multi " : ""),
        }))
      }
    }
  }
  return variants
})

const display = computed(() => {
  let res = !!viewerObj.value
  if (viewerObj.value) {
    if (props.deviceMask) {
      const dev = viewerObj.value.devName
      if (typeof props.deviceMask === "function") res = props.deviceMask(dev)
      else res = dev.startsWith(props.deviceMask)
    } else if (controllerOnly.value) {
      res = showIfController.value
    }
  }
  return res || props.showUnassigned
})

defineExpose({
  displayed: display,
})

const eventName = computed(() => {
  if (props.action) return props.action
  if (props.uiEvent) return props.uiEvent
  return null
})

const uiNavTracker = useUINavTracker()
const ownerId = uniqueId("bngBinding")
let trackedEvent = ""

const track = (eventName = null) => {
  if (trackedEvent) {
    uiNavTracker.removeIgnore(trackedEvent, ownerId)
    trackedEvent = ""
  }
  if (props.trackIgnore || !display.value) return
  if (eventName) {
    if (trackedEvent === eventName) return
    trackedEvent = eventName
    uiNavTracker.addIgnore(trackedEvent, ownerId)
  }
}

watch(
  () => props.trackIgnore,
  val => track(val ? null : eventName.value)
)
watch(
  display,
  () => track(eventName.value)
)
watch(
  eventName,
  (val, prev) => {
    prev && track()
    val && track(val)
  }
)

onMounted(() => track(eventName.value))
onUnmounted(() => track())
</script>

<style lang="scss" scoped>
.binding-wrapper {
  &.with-variants {
    display: inline-flex;
  }
  &.vertical {
    display: inline-flex;
    flex-direction: column;
    justify-content: space-around;
  }
}

.binding-container {
  font-style: normal;
  text-decoration: none;
}

kbd {
  vertical-align: middle;
  display: inline-block;
  margin-right: 0.125em;
  margin-left: 0.125em;
  min-width: 1em;
  // height: 1.25em;
  padding: 0 0.25em;
  font-family: var(--fnt-mono);
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  border-radius: var(--bng-corners-1);
  border: 1px solid transparent;
  user-select: none;
  line-height: 1em;
  text-transform: uppercase;
  box-sizing: border-box;
  white-space: nowrap;
  transform: translateY(-0.0625em);
  & > span {
    font-size: 0.875em;
    line-height: 100%;
    padding: 0.125em;
    position: relative;
    height: 1.25em;
    transform: translateY(0.0625em);
  }
  .bng-binding-icon {
    --bng-icon-size: 1.25em;
    top: 0.1em;
  }

  .label-bigger,
  .label-offset {
    display: inline-block;
  }
  .label-bigger {
    transform: scale(1.25) translateY(5%);
  }
  .label-offset {
    transform: translateY(-10%);
  }
  .label-bigger.label-offset {
    transform: scale(1.25) translateY(-10%);
  }
  .label-multi {
    padding-left: 0;
    padding-right: 0;
  }
}

.binding-theme-dark kbd {
  background: rgb(80, 80, 80);
  background: -moz-linear-gradient(top, rgb(60, 60, 60), rgb(80, 80, 80));
  background: -webkit-gradient(linear, left top, left bottom, from(rgb(60, 60, 60)), to(rgb(80, 80, 80)));
  color: rgb(250, 250, 250);
}

.binding-theme-light kbd {
  background: none;
  color: var(--bng-color-text, var(--bng-off-white-brighter));
  background-color: var(--bng-color-bg, rgba(var(--bng-off-black-rgb), 0.375));
  border-style: solid;
  border-color: var(--bng-color-border, var(--bng-cool-gray-300));
  border-width: 0.078125rem 0.078125rem 0.1875rem 0.078125rem;
  position: relative;
}

.bng-binding-icon {
  font-size: 2em;
  line-height: 1em;
  display: inline-block;
  vertical-align: baseline;
  transform: none;
  &.n-a {
    --bng-icon-size: 1.75em;
    --bng-icon-color: var(--bng-color-text, var(--bng-cool-gray-400));
  }
  font-weight: 400 !important;
}

.combo-binding {
  position: relative;
  display: inline-flex;
  flex-flow: row nowrap;
  align-items: center;
  border-radius: var(--bng-corners-1);
  border: 1px solid #0008;
  &.binding-theme-light {
    border-color: #fff8;
  }
  > kbd {
    margin-top: round(0.1em, 1px);
    margin-bottom: round(0.1em, 1px);
    border: none;
  }
  .combo-separator {
    font-family: "bngIcons", var(--fnt-mono);
    font-size: 0.6em;
    margin-left: 0.25em;
    margin-right: 0.25em;
  }
}
</style>
