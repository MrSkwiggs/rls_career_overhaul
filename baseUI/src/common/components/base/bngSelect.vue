<!-- bngSelect - a select box control -->
<template>
  <div
    ref="elContainer"
    class="bng-select"
    bng-nav-item
    v-bng-on-ui-nav:[navLeftEvent].focusRequired="goPrev"
    v-bng-on-ui-nav:[navRightEvent].focusRequired="goNext"
    v-bng-disabled="disabled"
  >
    <slot name="previousButton" :click="goPrev" :disabled="isLeftDisabled">
      <BngButton
        bng-no-nav="true"
        :disabled="disabled || isLeftDisabled"
        :accent="ACCENTS.text"
        :mute="$attrs.mute"
        data-testid="previous-btn"
        @click="goPrev">
        <BngIcon :type="leftBinding?.displayed ? icons.arrowSmallLeft : icons.arrowLargeLeft" :class="leftIconClass" />
        <BngBinding ref="leftBinding" v-if="navLeftEvent && navLeftEvent !== 'focus_l'" :uiEvent="navLeftEvent" controller />
      </BngButton>
    </slot>
    <div
      ref="elContent"
      class="bng-select-content"
      :class="{ 'label-clickable': labelClickable }"
      v-bng-sound-class="!disabled && labelClickable && 'bng_click_hover_generic'"
      v-bng-popover:bottom.click="labelPopover"
      @click.stop="labelClickable && emit('label-click')"
    >
      <slot name="display" :label="current.label" :value="current.value">
        <span class="label select">{{ current.label }}</span>
        <label flavour></label>
      </slot>
    </div>
    <slot name="nextButton" :click="goNext" :disabled="isRightDisabled">
      <BngButton
        bng-no-nav="true"
        :disabled="disabled || isRightDisabled"
        :accent="ACCENTS.text"
        :mute="$attrs.mute"
        data-testid="next-btn"
        @click="goNext">
        <BngBinding ref="rightBinding" v-if="navRightEvent && navRightEvent !== 'focus_r'" :uiEvent="navRightEvent" controller />
        <BngIcon :type="rightBinding?.displayed ? icons.arrowSmallRight : icons.arrowLargeRight" :class="rightIconClass" />
      </BngButton>
    </slot>
    <div class="bng-select-indicator">
      <div
        v-for="idx in options.length" :key="idx"
        :class="{ active: idx - 1 === index }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue"
import { vBngOnUiNav, vBngDisabled, vBngSoundClass, vBngPopover } from "@/common/directives"
import { BngButton, ACCENTS, icons, BngBinding, BngIcon } from "@/common/components/base"
import { clamp } from "@/utils/maths"

const leftBinding = ref()
const rightBinding = ref()

const vModel = defineModel({
  type: [Object, Boolean, Number, String],
  default: undefined,
})

const props = defineProps({
  value: undefined,
  options: {
    type: Array,
    required: true,
  },
  config: {
    type: Object,
    // default is for super simple options where opt = label = value
    default: () => ({
      value: opt => opt,
      label: opt => opt,
    }),
  },
  loop: Boolean,
  labelClickable: Boolean,
  labelPopover: String,
  disabled: Boolean,
  navLeftEvent: {
    type: String,
    default: "focus_l"
  },
  navRightEvent: {
    type: String,
    default: "focus_r"
  },
})

const elContainer = ref()
const elContent = ref()

const findOptionValue = (valueToFind, opts) =>
  Math.max(
    0,
    opts.findIndex(opt => props.config.value(opt) === valueToFind)
  )

const index = ref(getInitialValue())

const current = computed(() => ({
  option: props.options[index.value],
  value: props.config.value(props.options[index.value]),
  label: props.config.label(props.options[index.value]),
}))

const leftIconClass = computed(() => ({
  'with-binding': leftBinding.value?.displayed
}))

const rightIconClass = computed(() => ({
  'with-binding': rightBinding.value?.displayed
}))

const isLeftDisabled = props.loop ? false : computed(() => index.value == 0)
const isRightDisabled = props.loop ? false : computed(() => index.value == props.options.length - 1)

const emit = defineEmits(["change", "valueChanged", "label-click"])

const goPrev = () => {
  if (!props.disabled && !isLeftDisabled.value) changeIndex(-1)
}
const goNext = () => {
  if (!props.disabled && !isRightDisabled.value) changeIndex(1)
}

defineExpose({
  goNext,
  goPrev,
  getElement: () => elContainer.value,
  getContentElement: () => elContent.value,
})

watch(
  () => props.value,
  () => (index.value = props.value !== null && props.value !== undefined ? findOptionValue(props.value, props.options) : 0)
)

watch(
  vModel,
  val => (index.value = val !== null && val !== undefined ? findOptionValue(val, props.options) : 0)
)

watch(() => index.value, updateValue)

function updateValue() {
  emit("valueChanged", current.value.value, current.value.label, current.value.option)
  emit("change", current.value.value, current.value.label, current.value.option)
  vModel.value = current.value.value
}

function changeIndex(offset) {
  if (props.loop) {
    index.value = (props.options.length + index.value + offset) % props.options.length
  } else {
    index.value = clamp(index.value + offset, 0, props.options.length - 1)
  }
}

function getInitialValue() {
  if (vModel.value !== null && vModel.value !== undefined) return findOptionValue(vModel.value, props.options)
  return "value" in props ? findOptionValue(props.value, props.options) : 0
}
</script>

<style lang="scss" scoped>
@use "@/styles/modules/density" as *;
@use "@/styles/modules/mixins" as *;

.bng-select {
  --ind-size: var(--indicator-size, 3px);
  --ind-pad: var(--indicator-padding, 2.75em);

  $b-rad: $border-rad-1;
  $f-offset: 0.25rem;

  position: relative;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  border-radius: $b-rad + $f-offset;
  padding: 0.25rem;
  // padding-bottom: calc(0.25em + var(--ind-size));
  height: auto; // Overrided to avoid beamng.controls.css pollution
  background: rgba(black, 0.6);
  user-select: none;

  // Modify the focus frame radius and offset based on switch corner radius
  @include modify-focus($b-rad, $f-offset);

  > .bng-select-content {
    flex: 1 1 auto;
    display: block;
    text-align: center;
    overflow: hidden;

    &.label-clickable {
      cursor: pointer;
      &:hover > .label {
        color: var(--bng-orange);
      }
    }

    > .label {
      display: inline-block;
      max-width: 100%;
      font-size: var(--font-size, 1.25rem);
      padding: 0 0.25rem;
      text-align: center;
      color: white;
      min-width: 3em;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }

  & > .bng-button {
    flex: 0 0 auto;
    padding-left: 0.25em;
    padding-right: 0.25em;
    --bng-button-min-width: 0;
    --bng-ui-event-padding-override: 0;
  }

  &[disabled],
  &[disabled] > * {
    pointer-events: none;
    cursor: default;
    opacity: 0.7;
  }
}

.bng-select-indicator {
  position: absolute;
  box-sizing: border-box;
  left: 0%;
  bottom: 0.1em;
  padding: 0 var(--ind-pad);
  width: 100%;
  height: var(--ind-size);
  gap: var(--ind-size);
  display: flex;
  flex-flow: row nowrap;
  justify-content: stretch;
  pointer-events: none;
  overflow: hidden;

  > * {
    flex: 1 1 auto;
    height: var(--ind-size);
    background-color: #fff4;
    transition: background-color 200ms;
    &.active {
      background-color: var(--bng-orange);
    }
  }
}

.with-binding {
  width: 0.5em;
  transform: translateX(-50%);
}
</style>
