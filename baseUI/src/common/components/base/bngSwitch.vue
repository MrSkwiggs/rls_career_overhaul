<template>
  <div
    ref="bngSwitch"
    v-bng-on-ui-nav:ok.asMouse.focusRequired
    bng-nav-item
    v-bng-disabled="disabled"
    class="bng-switch"
    :class="{
      'bng-switch-on': isSwitchOn,
      'with-background': !alwaysTransparent,
      'with-label': label || slots.default,
      'label-position-before': labelBefore,
      'inline-switch': (!label && !slots.default) || inline,
    }"
    :tabindex="disabled ? -1 : 0"
    @click="onClicked">
    <div class="bng-switch-control"></div>
    <template v-if="slots.default || label">
      <div class="bng-switch-label" :class="['label-alignment-' + labelAlignment]">
        <slot>
          <span v-if="label">{{ label }}</span>
        </slot>
      </div>
    </template>
  </div>
</template>

<script>
export const LABEL_ALIGNMENTS = {
  START: "start",
  END: "end",
  CENTER: "center",
}
</script>

<script setup>
import { computed, onUpdated, ref, useSlots } from "vue"
import { vBngDisabled, vBngOnUiNav } from "@/common/directives"
import { ensureFocus } from "@/services/uiNavFocus"

const props = defineProps({
  modelValue: [Boolean, Number, String],
  /** @description For static switches only and will not change the switches value on click. Use modelValue to automatically change the value on click.*/
  checked: {
    type: Boolean,
    default: false,
  },
  label: String,
  /** @description Positions the label before the switch control if set to true. */
  labelBefore: Boolean,
  /** @description Sets the width to the content's width otherwise fills the parent's width. Default is true */
  labelAlignment: {
    type: String,
    default: LABEL_ALIGNMENTS.END,
    validator: value => Object.values(LABEL_ALIGNMENTS).includes(value),
  },
  inline: {
    type: Boolean,
    default: true,
  },
  alwaysTransparent: Boolean,
  disabled: Boolean,
  valueOn: {
    type: [Boolean, Number, String],
    default: undefined,
  },
  valueOff: {
    type: [Boolean, Number, String],
    default: undefined,
  },
})

const emit = defineEmits(["update:modelValue", "change", "valueChanged"])
const slots = useSlots()

const bngSwitch = ref(null)

const valOn = computed(() => (typeof props.valueOn === "undefined" ? true : props.valueOn))
const valOff = computed(() => (typeof props.valueOff === "undefined" ? false : props.valueOff))

const isSwitchOn = computed(() => (props.modelValue != null ? props.modelValue === valOn.value : props.checked))

function onClicked() {
  if (props.disabled) return

  const newValue = !isSwitchOn.value ? valOn.value : valOff.value

  if (props.modelValue != null) emit("update:modelValue", newValue)

  emit("valueChanged", newValue)
  emit("change", newValue)
}

onUpdated(() => ensureFocus(bngSwitch.value))
</script>

<style lang="scss" scoped>
$knob-background-color: var(--bng-cool-gray-600);
$knob-on-background-color: var(--bng-orange-600);
$knob-disabled-color: var(--bng-cool-gray-800);
$knob-disabled-background-color: var(--bng-cool-gray-700);
$on-background-color: (var(--bng-cool-gray-700));

@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

.bng-switch {
  $f-offset: 0.25rem;
  $rad: $border-rad-1;

  position: relative;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  cursor: pointer;

  // Modify the focus frame radius and offset based on switch corner radius
  @include modify-focus($rad, $f-offset);

  &.inline-switch {
    display: inline-flex;
    justify-content: flex-start;
  }

  &.with-label {
    padding: 0.3em 0.5em;
    border-radius: var(--bng-corners-2);
    border: 0.125em solid transparent;
    background-clip: padding-box;

    &.label-position-before {
      flex-direction: row-reverse;

      > .bng-switch-label {
        padding-left: 0;
        padding-right: 0.5em;
      }
    }
  }

  &.bng-switch-on {
    &.with-background.with-label {
      background: $on-background-color;
    }

    > .bng-switch-control {
      background: $knob-on-background-color;
      border-color: transparent;
      background-clip: padding-box;

      &::after {
        left: 0.5em;
      }
    }
  }

  &[disabled] {
    border-color: transparent;
    background-clip: padding-box;
    pointer-events: none;
    opacity: 0.7;
  }
}

.bng-switch-control {
  position: relative;
  height: 0.75rem;
  width: 1.25rem;
  padding: 0.0625rem 0.0625rem 0.0625rem 0.0625rem;
  flex-shrink: 0;
  justify-content: flex-start;
  align-items: center;
  background: $knob-background-color;
  border-radius: 2rem;

  &::after {
    position: absolute;
    display: block;
    top: 0.0625rem;
    left: 0.0625rem;
    content: "";
    border-radius: 50%;
    background: var(--bng-off-white);
    width: 0.625rem;
    height: 0.625rem;
    transition: all 0.15s ease-in-out;
  }
}

.bng-switch-label {
  display: flex;
  flex-grow: 1;
  padding-left: 0.5em;
  color: var(--bng-off-white);
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;

  &.label-alignment-start {
    justify-content: flex-start;
  }

  &.label-alignment-end {
    justify-content: flex-end;
  }

  &.label-alignment-center {
    justify-content: center;
  }

  span {
    display: inline-block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}
</style>
