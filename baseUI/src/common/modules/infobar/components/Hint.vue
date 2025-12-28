<template>
  <BngButton
    ref="hintRef"
    v-show="bindingDisplayed"
    class="hint"
    :class="{ 'flash-on': data.flash }"
    :accent="ACCENTS.text"
    :disabled="!data.action"
    @click.stop="onClick"
    bng-no-nav
    tabindex="-1"
  >
    <div class="hint-content">
      <div class="binding-container" v-if="bindingView.length > 0">
        <template v-for="(item, idx) in bindingView" :key="idx">
          <span class="rich">
            <BngIcon
              v-if="item.type === 'icon'"
              class="icon"
              v-bind="{ ...PROP_DEFAULTS[item.type], ...item.props }"
            />
            <BngBinding
              v-for="(viewerObj, index) in item.viewerObjs" :key="index"
              ref="bindingRefs"
              class="binding"
              v-bind="{ ...PROP_DEFAULTS[item.type], ...item.props, viewerObj }"
              track-ignore
            />
            <span v-if="item.hold" class="text">{{ item.hold ? "[hold]" : "" }}</span>
          </span>
        </template>
      </div>
      <template v-if="labelView">
        <span class="hint-text">
          {{ $tt(labelView) }}
        </span>
      </template>
    </div>
  </BngButton>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue"
import { BngBinding, BngIcon, BngButton, ACCENTS } from "@/common/components/base"
import { NAVIGABLE_ELEMENTS_SELECTOR } from "@/services/crossfire"
import { setFocus } from "@/services/uiNavFocus"
import useControls from "@/services/controls"

const Controls = useControls()

const props = defineProps({
  data: Object,
})

const PROP_DEFAULTS = {
  icon: { color: "white" },
  binding: {
    showUnassigned: true,
    dark: false,
  },
}

const hintRef = ref(null)
const bindingRefs = ref([])

/*
// Expected Hint Structure
{
  id: String,  // id for the hint
  content: Object/String/Array  // Object (icon or binding) or String (simple label) or Array (array of Objects and/or Strings to allow combinations of icons, bindings, labels),
  action: Function,
  [bngClickOpts: Object]  // Optional - for dealing with long press stuff. Don't worry about this yet - it's low priority and more of a "nice to have"
}

// Icon Object
{
  type: 'icon',
  [props: Object],  // props that would normally be passed to a BngIcon
  [label: String], // optional label
}

// Binding Object
{
  type: 'binding',
  [props: Object],  // props that would normally be passed to a BngBinding
  [label: String], // optional label
  [hold: Boolean]  // optional - will display a 'HOLD' message alongside binding if True
}
*/

const hintContent = computed(() => {
  const hints = (props.data ? [props.data.content].flat() : [])
  const res = []
  let label
  for (const hint of hints) {
    if (typeof hint === "string") {
      label = hint
    } else {
      if (hint.label) label = hint.label
      res.push({
        ...hint,
        label: undefined,
      })
    }
  }
  label && res.push(label)
  return res
})

const bindingView = computed(() => {
  // void (Controls.lastDevice) // trigger reactivity (no need since it is now done in infobar.js)
  const res = hintContent.value.filter(item => typeof item !== "string")
  for (const item of res) {
    if (item.type === "binding") {
      if (item.props?.viewerObj) {
        item.viewerObjs = [item.props.viewerObj]
        continue
      }
      const viewerObjs = Controls.makeViewerObj({
        ...PROP_DEFAULTS[item.type],
        ...item.props,
        // see also: infoBar.js
        actionVariants: true,
        useLastDevice: true,
      })
      if (viewerObjs?.variants) {
        item.viewerObjs = viewerObjs.variants
      } else {
        item.viewerObjs = [viewerObjs]
      }
    }
  }
  return res
})
const labelView = computed(() =>
  hintContent.value.find(item => typeof item === "string") ||
  bindingView.value.find(item => item.label)?.label
)

const bindingDisplayed = computed(() => {
  // show when all bindings are displayed
  if (bindingRefs.value.some(ref => ref.displayed)) return true
  // show when there is an icon
  if (bindingView.value.some(item => item.type === "icon")) return true
  // show when there is a label
  if (labelView.value) return true
  // hide otherwise
  return false
})

function onClick(evt) {
  if (lastFocused && document.body.contains(lastFocused) && !setFocus(lastFocused, true, false)) {
    // if the last focused element is there but not focusable with setFocus, attempt to focus anyway
    try {
      lastFocused.focus?.()
    } catch (err) { }
  }
  // note: this is a special function that accepts a PointerEvent or a value (see uiNavTracker's addEvent function)
  props.data.action?.(evt)
}

let lastFocused
function trackFocus(evt) {
  let target = evt?.detail?.target || evt?.target || document.activeElement
  if (!target) {
    lastFocused = null
    return
  }
  // change target to the closest navigable element to decrease processing amount later on
  target = target.closest(NAVIGABLE_ELEMENTS_SELECTOR)
  if (!target) {
    lastFocused = null
    return
  }
  if (target === lastFocused) return
  const button = hintRef.value?.getElement?.()
  if (target !== button && !button.contains(target)) lastFocused = target
}

onMounted(() => window.addEventListener("uinav-focus", trackFocus))
onBeforeUnmount(() => window.removeEventListener("uinav-focus", trackFocus))
</script>

<style lang="scss" scoped>
.hint {
  margin: 0 !important;
  padding-top: 0;
  padding-bottom: 0;
  min-width: none;
  height: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;

  opacity: 1 !important;
  &:not(:hover):deep(.background) {
    background-color: transparent !important;
    transition: background-color 0s ease-out;
  }

  .binding-container {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
  }

  .hint-content {
    display: flex;
    align-items: center;
    flex-flow: row nowrap;
    gap: 0.25em;
    max-width: 100%;
    .hint-text {
      white-space: nowrap;
      text-overflow: ellipsis;
      flex: 1 auto;
      overflow: hidden;
    }

    @media (max-width: 940px) {
      flex-direction: column;
      font-size: 0.8em;
      line-height: 1;
    }
  }

  // this will appear only when icon is shown
  .rich {
    line-height: 1em;
    .icon {
      height: 1em;
      margin-right: 0.2em;
    }
    .binding {
      margin-top: -0.1em;
      margin-right: 0.1em;
      padding-right: 0;
    }
    .text {
      display: inline;
    }
  }

  :deep(.flash-on) {
    .icon-base,
    .icon-base + span {
      // color:#fc0 !important;
      animation: flash 1s ease-out 0s 2 forwards !important;
      @keyframes flash {
        0%, 100% {
          color: inherit;
        }
        15%, 50% {
          color: var(--bng-orange-400);
        }
      }
    }
  }
}
</style>
