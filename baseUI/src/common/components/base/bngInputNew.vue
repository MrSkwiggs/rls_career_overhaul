<template>
  <div
    v-bng-disabled="disabled"
    v-bng-scoped-nav="{ activated: scopeActivated, canActivate: canActivateScope }"
    :class="{
      'has-value': !isEmptyRawValue,
      'bng-input-readonly': readonly,
      'bng-input-invalid': validationState && !validationState.valid,
    }"
    class="bng-input"
    @activate="onScopeActivated"
    @deactivate="onScopeDeactivated">
    <label v-if="(label || externalLabel || slots.label) && !floatingLabel" class="external-label" @click="activateInput" @mousedown.prevent>
      <slot name="label">{{ label || externalLabel }}</slot>
    </label>

    <span v-if="leadingIcon || slots.leadingIcon" class="leading-icon" @click="activateInput" @mousedown.prevent>
      <slot name="leading-icon">
        <BngIcon :type="leadingIcon" />
      </slot>
    </span>

    <span
      v-if="type === INPUT_TYPES.number && !readonly && !disabled"
      :class="{ 'spinner-active': numberInputState.isDownActive }"
      class="input-spinner input-spinner-down"
      @mousedown.prevent>
      <slot name="spinner-down" :changeValue="() => onSpinnerChangeValue(-1)">
        <BngButton
          v-bng-click="{ clickCallback: () => onSpinnerChangeValue(-1), holdCallback: () => onSpinnerChangeValue(-1) }"
          bng-no-nav="true"
          accent="text">
          <BngBinding v-if="!noStepBindings" controller uiEvent="focus_d" />
          <BngIcon v-if="!showIfController || noStepBindings" :type="stepIcons.down" />
        </BngButton>
      </slot>
    </span>

    <span v-if="prefix || slots.prefix" class="prefix" @click="activateInput" @mousedown.prevent>
      <slot name="prefix">{{ prefix }}</slot>
    </span>

    <div class="input-container" :style="inputStyle">
      <input
        ref="input"
        v-bng-text-input
        v-bng-on-ui-nav-focus:vertical.repeat="dir => onUINavChangeValue(dir)"
        v-model="rawValue"
        :readonly="readonly"
        :disabled="disabled"
        :placeholder="placeholder"
        :maxlength="maxLength"
        type="text"
        @focusin="$emit('focus')"
        @focusout="$emit('blur')"
        @keydown.arrow-up="onArrowKeysChangeValue(1)"
        @keydown.arrow-down="onArrowKeysChangeValue(-1)"
        @keydown.enter="onEnterDown"
        @keydown="onKeyDown" />
      <label v-if="(label && floatingLabel) || typeof floatingLabel === 'string' || slots.label" class="floating-label">
        <slot name="label">{{ label || floatingLabel }}</slot>
      </label>
    </div>

    <span v-if="suffix || slots.suffix" class="suffix" @click="activateInput" @mousedown.prevent>
      <slot name="suffix">{{ suffix }}</slot>
    </span>

    <span v-if="trailingIcon || slots.trailingIcon" class="trailing-icon" @click="activateInput" @mousedown.prevent>
      <slot name="trailing-icon">
        <BngIcon :type="trailingIcon" />
      </slot>
    </span>

    <span
      v-if="type === INPUT_TYPES.number && !readonly && !disabled"
      :class="{ 'spinner-active': numberInputState.isUpActive }"
      class="input-spinner input-spinner-up"
      @mousedown.prevent>
      <slot name="spinner-up" :changeValue="() => onSpinnerChangeValue(1)">
        <BngButton v-bng-click="{ clickCallback: () => onSpinnerChangeValue(1), holdCallback: () => onSpinnerChangeValue(1) }" bng-no-nav="true" accent="text">
          <BngBinding v-if="!noStepBindings" controller uiEvent="focus_u" />
          <BngIcon v-if="!showIfController || noStepBindings" :type="stepIcons.up" />
        </BngButton>
      </slot>
    </span>

    <span v-if="showExternalButton" class="external-button">
      <slot name="external-button" :externalButtonFn="externalButtonFn">
        <BngButton
          v-if="!readonly"
          v-bng-on-ui-nav:ok.asMouse.focusRequired
          v-bng-disabled="isEmptyRawValue"
          :icon="icons.mathMultiply"
          :disabled="disabled"
          accent="attention"
          @click="externalButtonFn"
          @mousedown.prevent />
      </slot>
    </span>

    <span v-if="(validationState && !validationState.valid && validationState.errorMessage) || slots.errorMessage" class="error-message">
      <slot name="error-message">{{ validationState.errorMessage }}</slot>
    </span>
  </div>
</template>

<script>
export const INPUT_TYPES = {
  text: "text",
  number: "number",
}
export const STEP_ICON_TYPES = {
  arrowUpDown: "arrowUpDown",
  arrowLeftRight: "arrowLeftRight",
  plusMinus: "plusMinus",
}

const STEP_ICON_TYPES_MAP = {
  [STEP_ICON_TYPES.arrowUpDown]: {
    up: "arrowSmallUp",
    down: "arrowSmallDown",
  },
  [STEP_ICON_TYPES.arrowLeftRight]: {
    up: "arrowSmallRight",
    down: "arrowSmallLeft",
  },
  [STEP_ICON_TYPES.plusMinus]: {
    up: "plus",
    down: "minus",
  },
}

const NUMBER_PATTERN = /^\d+(\.d+)?$/
const NUMBER_INPUT_KEYS = /^[0-9\.\-]$/
const ERROR_TYPES = {
  invalidformat: "invalidformat",
  outofrange: "outofrange",
  required: "required",
  custom: "custom",
}
const ERROR_MESSAGES = {
  [ERROR_TYPES.invalidformat]: "Invalid format",
  [ERROR_TYPES.outofrange]: "Value must be between {min} and {max}",
  [`${ERROR_TYPES.outofrange}-min`]: "Value must be greater than {min}",
  [`${ERROR_TYPES.outofrange}-max`]: "Value must be less than {max}",
  [ERROR_TYPES.required]: "Value is required",
}
const ALLOW_DEFAULT_BEHAVIOR_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Backspace", "Delete"]
const NUMBER_INPUT_MODES = {
  spinner: "spinner",
  arrowKeys: "arrowKeys",
  uinav: "uinav",
}
</script>

<script setup>
import { computed, ref, useSlots, watch, nextTick, reactive, onUnmounted } from "vue"
import { storeToRefs } from "pinia"
import { vBngOnUiNav, vBngDisabled, vBngTextInput, vBngScopedNav, vBngClick, vBngOnUiNavFocus } from "@/common/directives"
import { BngBinding, BngButton, BngIcon, icons } from "@/common/components/base"
import { useDirty } from "@/services/dirty"
import { debounce } from "@/utils/rateLimit"
import useControls from "@/services/controls"

/**
 * @description
 *
 * @param {Number | String} modelValue - only use either modelValue or value, not both
 * @param {Number | String} value - one-way binding useful for readonly inputs. only use either modelValue or value, not both
 * @param {String} label - The label of the input.
 * @param {Boolean} floatingLabel - Whether the label is floating.
 * @param {String} prefix - The prefix of the input.
 * @param {String} suffix - The suffix of the input.
 * @param {Number} step - The step of the number input. The precision of the value will be determined by the step value.
 * For example, if the step is 0.01, the value will be rounded to 2 decimal places.
 */
const props = defineProps({
  // only use either modelValue or value, not both
  modelValue: {
    type: [Number, String],
    default: undefined,
  },
  // one-way binding useful for readonly inputs if you do not want
  //  to create a ref variable just for to the modelValue
  value: {
    type: [Number, String],
    default: undefined,
  },
  type: {
    type: String,
    default: INPUT_TYPES.text,
    validator(value) {
      return Object.keys(INPUT_TYPES).includes(value)
    },
  },
  showExternalButton: {
    type: Boolean,
    default: true,
  },
  floatingLabel: [
    Boolean,
    // `floatingLabel` as string value is for backwards compatibility only
    // TODO: Remove this once we have a proper migration
    String,
  ],
  externalButtonFn: Function,
  // `externalLabel` is for backwards compatibility only
  // TODO: Remove this once we have a proper migration
  externalLabel: String,
  label: String,
  prefix: String,
  suffix: String,
  leadingIcon: Object,
  trailingIcon: Object,
  maxLength: {
    type: [Number, String],
    default: null,
    validator(value) {
      if (value === null) return true
      return typeof parseInt(value) === "number" && parseInt(value) >= 0
    },
  },
  readonly: Boolean,
  disabled: Boolean,
  required: Boolean,
  placeholder: String,

  // validation purposes
  validate: Function,
  // for backwards compatibility only
  // include the errorMessage as a return value from the validate function
  // TODO: Remove this once we have a proper migration
  errorMessage: String,

  // props below are only applicable if type is number
  min: {
    type: Number,
    default: undefined,
  },
  max: {
    type: Number,
    default: undefined,
  },
  step: {
    type: Number,
    default: 1,
  },
  stepIconType: {
    type: String,
    default: STEP_ICON_TYPES.arrowUpDown,
    validator(value) {
      return Object.keys(STEP_ICON_TYPES).includes(value)
    },
  },
  noStepBindings: Boolean,
})

const emit = defineEmits([
  "update:modelValue",
  "change",
  "error",
  "blur",
  "focus",
  // valueChanged is for backwards compatibility only
  // TODO: Remove this once we have a proper migration
  "valueChanged",
])

const slots = useSlots()

const Controls = useControls()
const { showIfController } = storeToRefs(Controls)

const input = ref(null)

const scopeActivated = ref(false)
const rawValue = ref(null)
const validationState = ref(null)
const isProgrammaticChange = ref(false)
const numberInputState = reactive({
  inputType: null,
  isUpActive: false,
  isDownActive: false,
})

const value = computed({
  get: () => props.modelValue,
  set: emitChange,
})
const isEmptyRawValue = computed(() => isEmpty(rawValue.value))

const inputStyle = computed(() => ({
  "max-width": props.maxLength ? `${props.maxLength}ch` : "initial",
}))

const stepIcons = computed(() => STEP_ICON_TYPES_MAP[props.stepIconType])

const exposed = useDirty(value)
exposed.scopeActivated = scopeActivated
defineExpose(exposed)

// validate and set the modelValue for any changes in the raw value
// here we can control when to do the validation
watch(
  () => rawValue.value,
  newValue => {
    if (isProgrammaticChange.value) {
      isProgrammaticChange.value = false
      return
    }

    // validate the value for number inputs
    const res = validate(newValue)
    validationState.value = res

    // emit change event if rawValue is different from the modelValue, otherwise, this is likely due to sync with the modelValue
    // allow value to be updated even if not valid as long as the error is not an invalid format
    if (rawValue.value != props.modelValue && (res.valid || res.error !== ERROR_TYPES.invalidformat)) value.value = res.value
  }
)

// sync the rawValue with the modelValue changes
watch(
  () => props.modelValue,
  modelValue => {
    if (modelValue != rawValue.value) {
      isProgrammaticChange.value = true
      rawValue.value = isEmpty(modelValue) ? null : String(modelValue)
    }
  },
  { immediate: true }
)

// sync the rawValue with the value prop changes
// this assumes that the modelValue is not set
watch(
  () => props.value,
  () => {
    if (props.modelValue !== undefined) return

    if (props.value != rawValue.value) {
      isProgrammaticChange.value = true
      rawValue.value = props.value
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  resetInputState.cancel()
})

const activateInput = () => {
  if (props.disabled || props.readonly) return
  nextTick(() => input.value.focus())
}

const canActivateScope = () => !props.readonly && !props.disabled

const externalButtonFn = () => {
  if (props.externalButtonFn) {
    props.externalButtonFn()
  } else if (props.type === INPUT_TYPES.number) {
    rawValue.value = props.min || 0
  } else {
    rawValue.value = null
  }
  activateInput()
}

function onScopeActivated(event) {
  scopeActivated.value = true
}

function onScopeDeactivated(event) {
  scopeActivated.value = false
  nextTick(() => cleanValue())
}

const resetInputState = debounce(() => {
  numberInputState.inputType = null
  numberInputState.isUpActive = false
  numberInputState.isDownActive = false
}, 150)

function onUINavChangeValue(dir) {
  if (numberInputState.inputType && numberInputState.inputType !== NUMBER_INPUT_MODES.uinav) return
  numberInputState.inputType = NUMBER_INPUT_MODES.uinav
  updateNumValue(dir)
  resetInputState()
}

function onArrowKeysChangeValue(dir) {
  if (numberInputState.inputType && numberInputState.inputType !== NUMBER_INPUT_MODES.arrowKeys) return
  numberInputState.inputType = NUMBER_INPUT_MODES.arrowKeys
  updateNumValue(dir)
  resetInputState()
}

function onSpinnerChangeValue(dir) {
  if (numberInputState.inputType && numberInputState.inputType !== NUMBER_INPUT_MODES.spinner) return
  numberInputState.inputType = NUMBER_INPUT_MODES.spinner
  updateNumValue(dir)
  resetInputState()
}

function updateNumValue(dir) {
  if (props.type !== INPUT_TYPES.number || props.disabled || props.readonly) return
  if (dir === 1) {
    numberInputState.isUpActive = true
    changeNumValue(props.step)
  } else {
    numberInputState.isDownActive = true
    changeNumValue(-props.step)
  }
}

function onEnterDown(event) {
  event.preventDefault()
  scopeActivated.value = false
}

function onKeyDown(event) {
  if (ALLOW_DEFAULT_BEHAVIOR_KEYS.includes(event.key)) return

  if (event.key === "Enter") event.preventDefault()

  // TODO: Discuss e/E exponentiation in number inputs. Currrently disabled.
  const rawValueString = typeof rawValue.value !== "string" && !isNullOrUndefined(rawValue.value) ? rawValue.value.toString() : rawValue.value
  if (
    props.type === INPUT_TYPES.number &&
    (!NUMBER_INPUT_KEYS.test(event.key) ||
      (event.key === "." && (isNullOrUndefined(rawValueString) || rawValueString.includes("."))) ||
      (event.key === "." && !NUMBER_PATTERN.test(rawValueString)))
  ) {
    event.preventDefault()
  }
}

function changeNumValue(diff) {
  if (props.type !== INPUT_TYPES.number) return
  // set initial value if the input is empty
  if (isEmpty(rawValue.value)) {
    if (diff < 0) rawValue.value = !isNullOrUndefined(props.max) ? props.max : 0
    else rawValue.value = !isNullOrUndefined(props.min) ? props.min : 0
    return
  }

  // validate the raw value
  const { valid, value: validatedValue, error } = validate(rawValue.value)

  if (!valid && error !== ERROR_TYPES.outofrange) {
    rawValue.value = 0
    return
  }

  const decimalTokens = props.step.toString().split(".")
  const stepDecimalPlaces = decimalTokens.length > 1 ? decimalTokens[1].length : 0
  const newValue = Number((validatedValue + diff).toFixed(stepDecimalPlaces))
  const { valid: isValidRange } = validateRange(newValue)

  if (isValidRange || (diff < 0 && newValue >= props.max) || (diff > 0 && newValue <= props.min)) rawValue.value = newValue
}

/*
  Clean the final value, useful for blur event.
  Remove all non-numeric characters like dangling decimal point for number inputs.
*/
function cleanValue() {
  if (isNullOrUndefined(rawValue.value)) return

  if (props.type === INPUT_TYPES.number) {
    const rawValueString = typeof rawValue.value === "string" ? rawValue.value : rawValue.value.toString()
    // if last value is a decimal point, remove it
    if (rawValueString.endsWith(".")) {
      rawValue.value = rawValueString.slice(0, -1)
    }
  }
}

function validate(value) {
  let valid = true
  let newValue = value
  let errorMessage = null

  if (isEmpty(value) && props.required) return { valid: false, error: ERROR_TYPES.required }

  // if not required and the value is empty just return to avoid further validation
  if (isEmpty(value) && props.type === INPUT_TYPES.number) return { valid: true, value: undefined }

  if (props.type === INPUT_TYPES.number && typeof value === "string") {
    if (value.includes(".")) {
      newValue = parseFloat(value)
    } else {
      newValue = parseInt(value)
    }

    if (isNaN(newValue)) return { valid: false, error: ERROR_TYPES.invalidformat }
  }

  if (props.type === INPUT_TYPES.number) {
    const res = validateRange(newValue)
    return { ...res, value: newValue }
  }

  if (props.validate) {
    const res = props.validate(value)
    if (typeof res === "boolean") {
      valid = res
      errorMessage = props.errorMessage
    } else if (typeof res === "object") {
      if ("valid" in res) console.warn("`validate` function must return a boolean `valid` property. Ignoring validation result...")
      valid = res.valid || true
      if (!valid) errorMessage = "errorMessage" in res ? res.errorMessage : props.errorMessage
    }
  }

  return { valid, value: newValue, errorMessage }
}

function validateRange(value) {
  const lessThanMin = props.min && value < props.min
  const greaterThanMax = props.max && value > props.max
  let valid = true,
    errorMessage = null

  if (!isNullOrUndefined(props.min) && !isNullOrUndefined(props.max) && (lessThanMin || greaterThanMax)) {
    errorMessage = ERROR_MESSAGES[ERROR_TYPES.outofrange].replace("{min}", props.min).replace("{max}", props.max)
    valid = false
  } else if (lessThanMin) {
    errorMessage = ERROR_MESSAGES[`${ERROR_TYPES.outofrange}-min`].replace("{min}", props.min)
    valid = false
  } else if (greaterThanMax) {
    errorMessage = ERROR_MESSAGES[`${ERROR_TYPES.outofrange}-max`].replace("{max}", props.max)
    valid = false
  }

  return { valid, error: !valid ? ERROR_TYPES.outofrange : null, errorMessage }
}

function isEmpty(val) {
  return val === null || val === undefined || val === ""
}

function isNullOrUndefined(val) {
  return val === null || val === undefined
}

function emitChange(value) {
  emit("update:modelValue", value)
  emit("change", value)
  // valueChanged is for backwards compatibility only
  // TODO: Remove this once we have a proper migration
  emit("valueChanged", value)
}
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

// Reset Angular styles leaking in
// TODO: Remove this once the global Angular styles is removed
.bng-input input {
  // all: unset;
  background: unset;
  border: none;
}

$text-color: var(--bng-off-white);
$label-color: var(--bng-cool-gray-200);
$input-border-color: var(--bng-off-white);
$border-width: 0.0625em; // 1px
$border-color: var(--bng-cool-gray-500);
$background-color: var(--bng-cool-gray-900);

$focused-input-border-color: var(--bng-orange-500);
$focused-border-color: var(--bng-orange-500);
$focused-border-width: 0.125em; // 2px
$focused-background-color: var(--bng-cool-gray-850);

$invalid-input-border-color: var(--bng-add-red-550);
$invalid-label-color: var(--bng-add-red-550);
$invalid-background-color: rgba(var(--bng-add-red-800-rgb), 0.5);

$disabled-text-color: var(--bng-cool-gray-200);
$disabled-label-color: var(--bng-cool-gray-200);
$disabled-border-color: var(--bng-cool-gray-750);
$disabled-background-color: rgba(var(--bng-cool-gray-500-rgb), 0.5);

$alternate-background-color: var(--bng-cool-gray-700);
$alternate-border-color: var(--bng-cool-gray-500);

$input-padding: calc-ui-rem(0.25);

.bng-input {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc-ui-rem(2.25);
  border-radius: calc-ui-rem(0.25) calc-ui-rem(0.25) 0 0;
  font-size: calc-ui-rem();
  color: $text-color;
  cursor: default;
}

label {
  position: absolute;
  left: 0;
  font-size: calc-ui-rem();
  color: $label-color;
  white-space: nowrap;

  &.external-label {
    top: calc-ui-rem(-1.5);
  }

  &.floating-label {
    top: calc-ui-rem(0.5);
    left: $input-padding;
    pointer-events: none;
  }
}

.error-message {
  position: absolute;
  bottom: calc-ui-rem(-1.125);
  left: 0;
  width: 100%;
  height: 1em;
  color: $invalid-label-color;
  font-weight: 400;
  pointer-events: none;
}

.input-spinner {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: calc-ui-rem(3);
  margin: 0 calc-ui-rem(0.25);

  :deep(.bng-button) {
    margin: 0;
    min-width: calc-ui-rem(2);
    width: 100%;
    height: 100%;
  }

  // TODO: This is a hack and needs more feedback on how to handle this properly
  &.spinner-active {
    :deep(.bng-binding-icon),
    :deep(.icon-base) {
      color: $focused-input-border-color !important;
    }
  }
}

.leading-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $input-padding;
  height: 100%;
}

.external-button {
  :deep(button) {
    margin: 0 calc-ui-rem(0.25) !important;
    padding-top: calc-ui-rem(0.35);
    padding-bottom: calc-ui-rem(0.45);
  }
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  height: 100%;
  width: 100%;
  padding: 0 calc-ui-rem(0.25);
  padding-top: calc-ui-rem(0.25);
  max-width: var(--bng-input-max-width);
  background: $background-color;

  &::before {
    background: $input-border-color;
  }
}

input {
  width: 100%;
  height: 100%;
  padding: 0;
  color: $text-color;
  cursor: text;
  pointer-events: auto;

  &::before {
    display: none;
  }

  &::-webkit-inner-spin-button {
    display: none;
  }
}

// Floating label
.bng-input.has-value > .input-container {
  padding-top: 0;

  > .floating-label {
    top: calc-ui-rem(-0.125);
    font-size: calc-ui-rem(0.75);
    font-weight: 400;
  }
}

// Alternate background color
.prefix,
.suffix,
.trailing-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $input-padding;
  height: 100%;
  background: $alternate-background-color;

  &::before {
    background: $alternate-border-color;
  }
}

.bng-input:has(> .external-label) {
  margin-top: calc-ui-rem(1.5);
}

.bng-input {
  &:has(.prefix) > .trailing-icon {
    background: $background-color;
  }
}

// BngInput's border radius
.input-container,
.suffix,
.prefix,
.trailing-icon {
  position: relative;

  &::before {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: $border-width;
    pointer-events: none;
  }
}

.bng-input {
  .prefix {
    border-top-left-radius: calc-ui-rem(0.25);
  }

  &:not(:has(.prefix)) > .input-container {
    border-top-left-radius: calc-ui-rem(0.25);
  }

  > .trailing-icon {
    border-top-right-radius: calc-ui-rem(0.25);
  }

  &:not(:has(.trailing-icon)) > .prefix {
    border-top-right-radius: calc-ui-rem(0.25);
  }

  &:not(:has(.trailing-icon)):not(:has(.prefix)) > .input-container {
    border-top-right-radius: calc-ui-rem(0.25);
  }

  &:has(input:focus) {
    .prefix,
    .suffix,
    .trailing-icon,
    .input-container {
      &::before {
        background: $focused-border-color;
        height: $focused-border-width;
      }
    }
  }
}

// .suffix,
// .prefix,
// .trailing-icon,
// .leading-icon {
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 0 calc-ui-rem(0.5);
//   height: 100%;
// }

// .leading-icon {
//   border-bottom: none;
// }

// .prefix,
// .suffix {
//   padding: 0 calc-ui-rem(0.25);
//   // font-family: var(--fnt-mono);
// }

// // bottom borders
// .inner-container,
// .prefix,
// .suffix,
// .trailing-icon {
//   position: relative;

//   &::before {
//     content: "";
//     position: absolute;
//     bottom: 0;
//     left: 0;
//     width: 100%;
//     height: $border-width;
//     background: $input-border-color;
//     pointer-events: none;
//   }
// }

// alternating background colors
// .bng-input {
//   // set items after the input container to be grey
//   > .inner-container + *:not(.external-button):not(label) {
//     background: $alternate-background-color;
//     &::before {
//       background: $alternate-border-color;
//     }
//   }

//   > .prefix {
//     background: $alternate-background-color;
//     &::before {
//       background: $alternate-border-color;
//     }
//   }

//   > .trailing-icon {
//     background: $background-color;
//     &::before {
//       background: $input-border-color;
//     }
//   }
// }

// BngInput's border radius
// .bng-input {
//   > :first-child:not(.leading-icon) {
//     border-top-left-radius: calc-ui-rem(0.25);
//   }

//   > .leading-icon + * {
//     border-top-left-radius: calc-ui-rem(0.25);
//   }

//   > :last-child:not(.external-button) {
//     border-top-right-radius: calc-ui-rem(0.25);
//   }

//   &:has(.external-button) > :nth-last-child(2) {
//     border-top-right-radius: calc-ui-rem(0.25);
//   }
// }

// invalid input
// .bng-input.bng-input-invalid {
//   label {
//     color: $invalid-label-color !important;
//   }

//   > .inner-container {
//     background: $invalid-background-color !important;
//   }

//   > .suffix,
//   > .prefix,
//   > .trailing-icon,
//   > .inner-container {
//     &::before {
//       background: $invalid-label-color !important;
//     }
//   }

//   &:has(.error-message) {
//     margin-bottom: 1.5em;
//   }
// }

// reset button positioning
// .bng-input .external-button {
//   :deep(button) {
//     margin: 0 calc-ui-rem(0.25) !important;
//     padding-top: calc-ui-rem(0.35);
//     padding-bottom: calc-ui-rem(0.45);
//   }
// }

// label positioning
// .bng-input {
//   &:has(.external-label) {
//     margin-top: calc-ui-rem(1.5);

//     > .external-label {
//       top: calc-ui-rem(-1.5);
//       left: 0;
//     }
//   }

//   // minimize translate to the top
//   &.has-value:has(.inner-container > .floating-label) {
//     .inner-container {
//       padding-top: calc-ui-rem(0.5);
//     }

//     .inner-container > .floating-label {
//       font-size: calc-ui-rem(0.75);
//       font-weight: 400;
//       transform: translateY(calc-ui-rem(-1.25));
//     }
//   }
// }

// // focus styling. only apply focus styling if any other element except the reset button is focused
// .bng-input:not(.bng-input-readonly) {
//   &:has(input:focus) {
//     .inner-container,
//     .prefix,
//     .suffix,
//     .trailing-icon {
//       &::before {
//         background: $focused-border-color;
//         height: $focused-border-width;
//       }
//     }
//   }
// }

// .bng-input[disabled] {
//   pointer-events: none;
//   color: $disabled-text-color;

//   .suffix,
//   .prefix,
//   .trailing-icon,
//   .inner-container {
//     &::before {
//       background: $disabled-border-color !important;
//     }
//   }
// }
</style>
