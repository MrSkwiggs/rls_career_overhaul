<!-- Progress Popup - a simple popup asking for showing a modal progress bar to the user -->
<template>
  <div :class="['popup']" :bng-ui-scope="scopeName" v-bng-on-ui-nav:back,menu="handleCancelWithBack">
    <div class="popup-content">
      <div class="popup-title" v-if="title">{{ title }}</div>
      <div class="popup-body">
        <div class="popup-message" v-if="msg">{{ msg }}</div>
        <BngProgressBar
          :value="progressValue"
          :min="min"
          :max="max"
          :indeterminate="indeterminate"
          :show-value-label="!indeterminate && !!valueLabelFormat"
          :value-label-format="valueLabelFormat" />
      </div>
      <div class="popup-buttons">
        <BngButton
          v-if="buttons && buttons.length"
          v-for="(button, index) in buttons"
          :key="index"
          v-bind="{ ...(index == defaultButtonIndex && { id: DEFAULT_BUTTON_ID }), ...button.extras }"
          @click="$emit('return', typeof button.value == 'function' ? button.value(text) : button.value)">
          {{ button.label }}
        </BngButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { BngButton, BngProgressBar } from "@/common/components/base"
import { vBngOnUiNav } from "@/common/directives"
import { usePopupUINavScopeName } from "@/services/uiNav"
import { uniqueId } from "@/services/uniqueId"
import { useUINavBlocker } from "@/services/uiNavTracker"

const navBlocker = useUINavBlocker()
navBlocker.allowOnly(["focus_u", "focus_d", "focus_l", "focus_r", "back", "menu", "ok"])

const emit = defineEmits(["return"])
const DEFAULT_BUTTON_ID = uniqueId("___DEFAULT", "_")

const props = defineProps({
  title: String,
  message: String,
  buttons: Array,
  indeterminate: Boolean,
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100,
  },
  initialValue: {
    type: Number,
    default: 0,
  },
  valueLabelFormat: {
    type: [String, Function],
    default: () => val => `${val}%`,
  },
  timeout: {
    type: Number,
    default: 0,
  },
  cancellable: Boolean,
  tunnel: Object,
})

const defaultButtonIndex = props.buttons.findIndex(button => button.extras && button.extras.default)
const cancelButton = props.buttons.find(button => button.extras && button.extras.cancel)

if (~defaultButtonIndex) {
  onMounted(() => {
    document.querySelector(`#${DEFAULT_BUTTON_ID}`).focus()
  })
}

const scopeName = usePopupUINavScopeName("_progressPopup", props)

const progressValue = ref(props.initialValue)
const msg = ref(props.message)

const handleCancelWithBack = e => {
  props.cancellable && close()
}

const close = () => emit("return", cancelButton ? cancelButton.value : null)

props.tunnel.update = (value, message = undefined) => {
  progressValue.value = +value
  if (message !== undefined) msg.value = message
}

props.tunnel.done = close
props.tunnel.ready = true

if (props.timeout) setTimeout(close, props.timeout * 1000)
</script>

<style lang="scss" scoped>
$border-rad: 0.75em;

.popup {
  position: relative;
  display: inline-block;
  min-width: 20em;
  max-width: 40em;
  border: 0.3em;
  color: #fff;
  border-radius: $border-rad;

  transition: box-shadow 200ms;
  box-shadow: 0 1em 0em 1em rgba(#000, 0);
  &.popup-active {
    box-shadow: 0 1em 4em 1em rgba(#000, 0.3);
  }

  &.popup-inactive {
    filter: grayscale(50%);
    .popup-content > * {
      opacity: 0.5;
    }
  }

  .popup-content {
    display: block;
    width: 100%;
    height: 100%;
    background-color: #252525;
    border-radius: $border-rad;
    overflow: hidden;
  }

  .popup-message {
    padding: 0 0 1em 0;
    text-align: left;
  }

  .popup-title {
    background: #333;
    padding: 0.3em;
    font-size: 1.2em;
    text-align: center;
  }

  .popup-body {
    margin: 1em 0;
    padding: 0 1em;
    text-align: center;
  }

  .popup-buttons {
    margin: 1em 0 0.5em 0;
    padding: 0 1em;
    text-align: center;
  }
}
</style>
