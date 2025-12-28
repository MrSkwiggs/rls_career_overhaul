<!-- bngInput - an input control -->
<template>
  <div class="bng-input-wrapper" v-bng-disabled="disabled">
    <span
      v-if="externalLabel"
      class="external-label"
      :style="[leadingIcon ? { 'margin-left': '3em' } : {}]"
      data-testid="external-label"
    >
      {{ externalLabel }}
    </span>
    <div class="icons-input-wrapper">
      <BngIcon v-if="leadingIcon" class="outside-icon" :type="leadingIcon" data-testid="leading-icon" />
      <!-- bng-highlight-container is required for focus highlight because bng-input-container
           has overflow hidden for the prefix, suffix or trailing icon to respect the border radius -->
      <div
        tabindex="disabled ? -1 : 0"
        class="bng-highlight-container"
        :class="{ 'bng-input-focused': isInputFieldFocused, 'has-error': hasError }"
        @keydown.enter="onInputFieldFocusOut"
      >
        <div class="bng-input-container">
          <span v-if="prefix" class="prefix-suffix-container">
            <span data-testid="prefix">{{ prefix }}</span>
          </span>
          <div class="bng-input-group">
            <input
              ref="input"
              class="bng-input"
              :class="{ 'bng-input-empty': !hasValue, 'bng-input-error': hasError }"
              data-testid="input"
              :value="value"
              :type="type"
              :min="numMin"
              :max="numMax"
              :step="numStep"
              :maxlength="charMax"
              @input="onValueChanged"
              @focusin="onInputFieldFocusIn"
              @focusout="onInputFieldFocusOut"
              :placeholder="placeholder"
              :disabled="disabled"
              :readonly="readonly"
              v-bng-text-input
            />
            <div v-if="type === 'number'" class="number-actions">
              <BngIcon
                :type="iconsByTag.arrow.arrowLargeUp"
                :class="{ 'number-action-disabled': readonly }"
                class="number-action up-action"
                v-bng-click="{ clickCallback: onArrowUpClicked, holdCallback: onArrowUpClicked }"
              />
              <BngIcon
                :type="iconsByTag.arrow.arrowLargeDown"
                class="number-action down-action"
                :class="{ 'number-action-disabled': readonly }"
                v-bng-click="{ clickCallback: onArrowDownClicked, holdCallback: onArrowDownClicked }"
              />
            </div>
            <span v-if="floatingLabel" class="floating-label" data-testid="floating-label">
              {{ floatingLabel }}
            </span>
            <span v-if="hasError && errorMessage" class="error-message">{{ errorMessage }}</span>
            <span class="input-border"></span>
          </div>
          <span v-if="suffix" class="prefix-suffix-container">
            <span data-testid="suffix">{{ suffix }}</span>
          </span>
          <span v-if="trailingIcon && !trailingIconOutside" class="trailing-icon">
            <BngIcon :type="trailingIcon" class="input-icon" data-testid="trailing-icon" />
          </span>
        </div>
      </div>
      <BngIcon
        v-if="trailingIcon && trailingIconOutside"
        :type="trailingIcon"
        class="outside-icon"
        data-testid="external-trailing-icon"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue"
import { BngIcon } from "@/common/components/base"
import { iconsByTag } from "@/common/components/base/bngIcon.vue"
import { vBngClick, vBngTextInput, vBngDisabled } from "@/common/directives"
import { roundDec, roundDecSample, round } from "@/utils/maths"
import { useDirty } from "@/services/dirty"

const props = defineProps({
  modelValue: [String, Number],
  type: {
    type: String,
    default: "text",
    validator(value) {
      return ["text", "number"].includes(value)
    },
  },

  // only applicable if type is number
  min: [Number, String],
  max: [Number, String],
  step: {
    type: [Number, String],
    default: 1,
  },
  decimals: Number,

  maxlength: [Number, String],

  readonly: Boolean,

  floatingLabel: String,
  externalLabel: String,
  placeholder: String,
  initialValue: String,
  leadingIcon: Object,
  prefix: String,
  suffix: String,
  trailingIcon: Object,
  trailingIconOutside: Boolean,
  disabled: Boolean,
  validate: Function,
  errorMessage: String,
})

const emitter = defineEmits(["update:modelValue", "valueChanged", "change", "focus", "blur"])
const input = ref()
const value = ref(props.initialValue || props.modelValue)
const isInputFieldFocused = ref(false)

const numMin = computed(() => (props.type === "number" ? +props.min : null))
const numMax = computed(() => (props.type === "number" ? +props.max : null))
const numStep = computed(() => (props.type === "number" ? roundDec(+props.step, 15) : null))
const numDecimals = computed(() => (props.type === "number" ? props.decimals : null))
const charMax = computed(() => (props.type === "text" ? props.maxlength : null)) // we don't need to convert this one

// const decimals = computed(() => {
//   if (props.type !== "number") return 0
//   let dec = props.decimals
//   if (typeof dec === "number" && dec !== 0) return dec
//   if (typeof props.step === "number") dec = props.step.toString().split(".")[1]?.length || 15
//   if (isNaN(dec)) dec = 15
//   return dec || 0
// })

const hasValue = computed(() => value.value !== "" && value.value !== undefined && value.value !== null)
const hasError = computed(() => (typeof props.validate === "function" ? !props.validate(value.value) : false))

if (props.type === "number") {
  const type = typeof value.value
  if (type === "string" && /^\d+(?:\.?\d+)?$/.test(value.value)) value.value = +value.value
  else if (type !== "number") value.value = 0
  if (numMin.value > numMax.value) console.error("BngInput: min cannot be greater than max")
}

defineExpose(useDirty(value))

let lastNotify

function notify(val) {
  if (props.readonly || lastNotify === val) return
  lastNotify = val
  emitter("update:modelValue", val)
  emitter("valueChanged", val)
  emitter("change", val)
}

watch(
  () => props.modelValue,
  newVal => {
    if (props.type === "number") {
      newVal = numClamp(newVal)
    }

    value.value = newVal
    lastNotify = newVal
  },
  { immediate: true }
)

function numClamp(val) {
  if (isNaN(val)) val = 0
  // floating point error fix
  if (typeof numDecimals.value === "number" && !isNaN(numDecimals.value)) {
    val = roundDec(val, numDecimals.value)
  } else if (typeof numStep.value === "number" && !isNaN(numStep.value)) {
    val = roundDecSample(val, numStep.value)
  // } else {
  //   val = round(val)
  }
  // validate
  if (typeof numMin.value === "number" && !isNaN(numMin.value) && val < numMin.value) val = numMin.value
  if (typeof numMax.value === "number" && !isNaN(numMax.value) && val > numMax.value) val = numMax.value
  return val
}

function increment(by) {
  let val = numClamp(+value.value + by)
  if (value.value === val) return
  value.value = val
  input.value = val
  notify(val)
}

const onArrowUpClicked = () => increment(numStep.value)
const onArrowDownClicked = () => increment(-numStep.value)

function onValueChanged($event) {
  let val = $event.target.value
  if (props.type === "number") {
    val = +val
    let prev = val
    val = numClamp(val)
    if (val !== prev) input.value = val
  }
  value.value = val
  notify(val)
}

function onInputFieldFocusIn() {
  isInputFieldFocused.value = true
  emitter("focus")
}

function onInputFieldFocusOut() {
  isInputFieldFocused.value = false
  // note: this sequence may help to detect that value change happened because of blur
  emitter("blur")
  notify(value.value)
}
</script>

<style scoped lang="scss">
// START RESET

.bng-input {
  color: initial;
  background-color: initial;
  border-width: initial;
  border-radius: initial;
  padding: initial;
  transition: initial;
  -webkit-tap-highlight-color: initial;
  &[type="number"] {
    appearance: textfield;
  }
}

*:focus::before {
  content: none;
  display: initial;
  position: initial;
  top: initial;
  bottom: initial;
  left: initial;
  right: initial;
  border-radius: initial;
  border: initial;
  pointer-events: initial;
  z-index: initial;
}

// END RESET

$default-text-color: var(--bng-off-white);
$default-label-color: var(--bng-cool-gray-200);
$default-input-border-color: var(--bng-off-white);
$default-bottom-border-color: var(--bng-cool-gray-500);
$default-bottom-border-width: 0.0625em; // 1px

$disabled-text-color: var(--bng-off-white);
$disabled-background-color: rgba(var(--bng-cool-gray-500-rgb), 0.5);
$disabled-label-color: var(--bng-cool-gray-300);
$disabled-input-border-color: var(--bng-cool-gray-500);

$has-error-text-color: var(--bng-off-white);
$has-error-background-color: var(--bng-add-red-800);
$has-error-label-color: var(--bng-add-red-400);
$has-error-input-border-color: var(--bng-add-red-500);

$focused-outline-color: var(--bng-orange-500);
$focused-background-color: var(--bng-cool-gray-850);
$focused-label-color: var(--bng-add-orange-200);
$focused-input-border-color: var(--bng-orange-500);
$focused-bottom-border-width: 0.125em; // 2px

$has-value-label-color: var(--bng-cool-gray-300);
$has-value-input-border-color: var(--bng-cool-gray-500);

$input-container-background-color: rgba(var(--bng-cool-gray-900-rgb), 0.5);
$prefix-suffix-background-color: rgba(var(--bng-cool-gray-700-rgb), 1);
$min-input-width: 7em;
$input-border-z-index: 1;
$input-height: var(--input-height, 2.5em);

$icon-border-z-index: 1;
$icon-max-height: 1.5em;

* {
  box-sizing: border-box;
}

%input-focus-highlight {
  content: "";
  position: absolute;
  display: block;
  top: -0.125em; // -2px
  left: -0.125em; // -2px
  right: -0.125em; // -2px
  bottom: -0.25em; // -4px
  border: 0.125em solid $focused-outline-color;
  border-radius: $focused-bottom-border-width;
}

.bng-input-wrapper {
  display: flex;
  flex-direction: column;

  &[disabled] {
    opacity: 0.5;
    pointer-events: none;
  }

  > .external-label {
    display: inline-block;
    padding: 0.25em 0; // 4px 0
  }

  > .icons-input-wrapper {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    align-items: center;
    height: $input-height;

    > .outside-icon {
      padding: 0 0.5em;
      font-size: 1.25em;
    }

    .input-icon {
      display: inline-block;
      max-height: $icon-max-height;
      width: 1.5em;
      text-align: center;
      font-size: 1.25em;
    }
  }

  &:not(:hover):not(:focus-within) .number-actions {
    opacity: 0;
  }
}

// set input container highlight on focus
.bng-highlight-container {
  position: relative;
  flex-grow: 1;
  height: 100%;

  &.bng-input-focused {
    > .bng-input-container {
      background-color: $focused-background-color;
      // bng-input-group container border at the bottom
      &::after,
      // trailing icon border at the bottom
      > .trailing-icon::before,
      > .bng-input-group > .input-border {
        height: $focused-bottom-border-width;
        background: $focused-input-border-color;
      }
    }
  }
}

.bng-input-container {
  position: relative;
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  background-color: $input-container-background-color;
  border-radius: 0.25em 0.25em 0 0;
  // overflow: hidden;

  // border at the bottom
  &::after {
    content: "";
    display: block;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: $default-bottom-border-width;
    background-color: $default-bottom-border-color;
  }

  > .bng-input-group {
    position: relative;
    flex-grow: 1;
    height: 100%;

    .bng-input {
      display: inline-block;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0.5em 0.25em;
      background-color: transparent;
      border: none;
      color: $default-text-color;
      font-size: 1em;

      ~ .number-actions {
        position: absolute;
        right: 0;
        top: 0;
        display: flex;
        flex-direction: column;
        height: 100%;

        .number-action {
          display: flex;
          font-size: 0.75em;
          cursor: pointer;
          line-height: 100%;
          flex: 1 0 auto;
          align-items: flex-start;
          padding: 0 0.125em;

          &:active {
            background-color: $focused-outline-color !important;
          }

          &.number-action-disabled {
            pointer-events: none;
            opacity: 0.5;
          }
        }
        > .up-action {
          align-items: flex-end;
        }
      }

      // States
      &.bng-input-empty {
        ~ .floating-label {
          top: calc(50% - 0.625em);
          left: 0.25em;
          font-size: 1em;
        }
      }

      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      // Only set floating label when at the top to red
      &.bng-input-error:not(.bng-input-empty) {
        ~ .floating-label {
          color: $has-error-label-color;
        }
      }

      &.bng-input-error {
        background-color: $has-error-background-color;

        ~ .input-border {
          background-color: $has-error-input-border-color;
        }

        ~ .error-message {
          display: inline-block;
          color: $has-error-label-color;
        }
      }
    }

    > .floating-label {
      position: absolute;
      pointer-events: none;
      top: 0;
      left: 0.5em;
      font-size: 0.7em;
    }

    > .input-border {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: $default-bottom-border-width;
      background-color: $default-input-border-color;
      z-index: $input-border-z-index;
    }
  }

  > .prefix-suffix-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background-color: $prefix-suffix-background-color;
    padding: 0 0.25em;
    font-family: var(--fnt-mono);
  }

  > .trailing-icon {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 0.25em;

    // trailing icon border at the bottom
    &::before {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: $default-bottom-border-width;
      background-color: $default-input-border-color;
      z-index: $icon-border-z-index;
    }
  }
}
</style>
