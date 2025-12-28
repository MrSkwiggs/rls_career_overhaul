<!-- Prompt Popup - a simple popup asking for some input from the user -->
<template>
  <div :class="['popup']" :bng-ui-scope="scopeName" v-bng-on-ui-nav:back,menu="handleCancelWithBack">
    <div class="popup-content">
      <div class="popup-title" v-if="title">{{ title }}</div>
      <div class="popup-body">
        <div class="popup-message" v-if="message">{{ message }}</div>
        <BngInput :id="INPUT_ID" v-model="text" :maxlength="maxLength" v-on:keyup.enter="handleEnterButton(text)" :validate="validate" :error-message="errorMessage" />
      </div>
      <div class="popup-buttons">
        <BngButton
          v-for="(button, index) in buttons"
          :key="index"
          v-bind="{ ...(index == defaultButtonIndex && { id: DEFAULT_BUTTON_ID }), ...button.extras }"
          :disabled="disableWhenInvalid && index > 0 && validate && !validate(text)"
          @click="$emit('return', typeof button.value == 'function' ? button.value(text) : button.value)"
          >{{ button.label }}</BngButton
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { BngButton, BngInput } from "@/common/components/base"
import { vBngOnUiNav } from "@/common/directives"
import { usePopupUINavScopeName } from "@/services/uiNav"
import { uniqueId } from "@/services/uniqueId"

const emit = defineEmits(["return"])
const DEFAULT_BUTTON_ID = uniqueId("___DEFAULT", "_")
const INPUT_ID = uniqueId("___INPUT", "_")

const props = defineProps({
  buttons: Array,
  message: String,
  title: String,
  maxLength: Number,
  defaultValue: undefined,
  validate: Function,
  errorMessage: String,
  disableWhenInvalid: Boolean,
})

const scopeName = usePopupUINavScopeName("_promptPopup", props)

const text = ref(props.defaultValue || "")

const defaultButtonIndex = props.buttons.findIndex(button => button.extras && button.extras.default)
const cancelButton = props.buttons.find(button => button.extras && button.extras.cancel)

const handleEnterButton = (text) => {
  if (!(props.disableWhenInvalid && props.validate && !props.validate(text))) {
    emit("return", text)
  }
}

const handleCancelWithBack = e => {
  emit("return", cancelButton ? cancelButton.value : null)
}

onMounted(() => {
  document.querySelector(`#${INPUT_ID} input`).focus()
})
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
