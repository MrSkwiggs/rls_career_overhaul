<!-- bngButton - a button control -->
<template>
  <button
    ref="btnDOMElRef"
    :accent="accent"
    :class="{
      'show-hold': showHold,
      'hold-vertical': holdVertical,
      'bng-button': true,
      empty: !slots.default && !label,
      'l-icon': iconLeft || icon,
      'r-icon': iconRight,
      'external-icon': externalIcon,
      'fallback-hold-offset': props.accent === 'custom' && needsFallbackHoldOffset,
    }"
    :disabled="disabled"
    v-bng-sound-class="!disabled && !noSound && 'bng_click_hover_generic'"
  >
    <svg v-if="showHold" class="hold-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 12" preserveAspectRatio="xMidYMid">
      <path d="M1,1 L8,2 L16,1 L8,11 z" />
    </svg>
    <BngOldIcon v-if="useOldIcons && (iconLeft || icon)" :type="iconLeft || icon" />
    <BngIcon class="icon" v-else-if="!useOldIcons && (iconLeft || icon || externalIcon)" :type="iconLeft || icon" :externalImage="externalIcon" />
    <template v-if="isPlainTextSlot">
      <span class="label">
        <slot />
      </span>
    </template>
    <template v-else-if="!isPlainTextSlot">
      <slot />
    </template>
    <span v-if="label && !isPlainTextSlot" class="label">{{ label }}</span>
    <span v-if="uiNavEvent">{{ uiNavEvent }}</span>
    <BngOldIcon span v-if="useOldIcons && iconRight" :type="iconRight" />
    <BngIcon class="icon" v-else-if="!useOldIcons && iconRight" :type="iconRight" />
    <div class="background"></div>
  </button>
</template>

<script>
export const ACCENTS = {
  main: "main",
  secondary: "secondary",
  outlined: "outlined",
  text: "text",
  attention: "attention",
  attentionghost: "attentionghost",
  attentionoutlined: "attentionoutlined",
  ghost: "ghost",
  menu: "menu",
  custom: "custom",
}
</script>

<script setup>
import { useSlots, watch, watchEffect, ref, useAttrs, computed } from "vue"
import { BngOldIcon, BngIcon } from "@/common/components/base"
import { watchUINavEventChange } from "@/services/uiNav"
import { vBngSoundClass } from "@/common/directives"

const slots = useSlots()

const uiNavEvent = ref()
const btnDOMElRef = ref()

const attrs = useAttrs()
const useOldIcons = computed(() => "oldIcons" in attrs)

const unwatch = watchUINavEventChange(btnDOMElRef, ({ eventName, action }) => {})

defineExpose({
  getElement() {
    return btnDOMElRef.value
  },
})

const isPlainTextSlot = ref(false)
// This function will check if the slot is a single text node
function checkIfPlainText() {
  const slotContent = slots.default ? slots.default() : []
  const isText = slotContent.length === 1 && typeof slotContent[0].type === "symbol" && String(slotContent[0].type).indexOf("v-txt") > -1
  isPlainTextSlot.value = isText && slotContent[0].children.trim().length > 0
}

watch(() => slots.default, checkIfPlainText)
checkIfPlainText()

const props = defineProps({
  accent: {
    type: String,
    default: "main",
    validator: v => Object.values(ACCENTS).includes(v) || v === "",
  },
  iconLeft: [Object, String],
  iconRight: [Object, String],
  label: String,
  icon: [Object, String], // string is used if oldIcons attribute is specified
  externalIcon: String,
  showHold: Boolean,
  holdVertical: Boolean,
  disabled: Boolean,
  noSound: Boolean,
})

const needsFallbackHoldOffset = ref(true)

watchEffect(() => {
  if (btnDOMElRef.value && props.accent === 'custom') {
    const style = window.getComputedStyle(btnDOMElRef.value)
    const value = style.getPropertyValue('--bng-button-custom-hold-offset').trim()
    if (value) {
      needsFallbackHoldOffset.value = false
    }
  }
})
</script>

<style lang="scss" scoped>
@use "sass:math";
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

$button-main-enabled: var(--bng-orange-500);
$button-main-hold-fill: var(--bng-orange-300);
$button-main-active: var(--bng-orange-600);
$button-main-hover: var(--bng-orange-b400);
$button-main-disabled: var(--bng-cool-gray-400);

$button-secondary-enabled: var(--bng-ter-blue-gray-700);
$button-secondary-active: var(--bng-ter-blue-gray-800);
$button-secondary-hover: var(--bng-ter-blue-gray-600);
$button-secondary-disabled: var(--bng-cool-gray-800);

$button-attention-enabled: var(--bng-add-red-600);
$button-attention-active: var(--bng-add-red-700);
$button-attention-hover: var(--bng-add-red-500);
$button-attention-disabled: var(--bng-add-red-700);

$button-attention-ghost-fg: var(--bng-add-red-500);
$button-attention-ghost-enabled: var(--bng-off-black);
$button-attention-ghost-active: var(--bng-off-black);
$button-attention-ghost-hover: var(--bng-add-red-700);
$button-attention-ghost-disabled: var(--bng-off-black);

$button-ghost-enabled: transparent;
$button-ghost-active: transparent;
$button-ghost-hover: var(--bng-orange-700);
$button-ghost-disabled: transparent;

$button-text-enabled: var(--bng-off-black);
$button-text-active: var(--bng-off-black);
$button-text-hover: var(--bng-orange-600);
$button-text-disabled: var(--bng-off-black);

$button-menu-enabled: transparent;
$button-menu-active: var(--bng-ter-blue-gray-500);
$button-menu-hover: var(--bng-ter-blue-gray-500);
$button-menu-disabled: transparent;

$button-outlined-enabled: var(--bng-black-o4);
$button-outlined-active: var(--bng-orange-800);
$button-outlined-hover: var(--bng-orange-600);
$button-outlined-disabled: var(--bng-black-o6);
$button-outlined-border-enabled: var(--bng-cool-gray-600);
$button-outlined-border-active: var(--bng-orange-700);
$button-outlined-border-hover: var(--bng-orange-b400);
$button-outlined-border-disabled: rgba(var(--bng-cool-gray-800-rgb), 0.8);

// Custom button accent, use carefully and only if you know what you are doing
// Custom accent background color variables
$button-custom-enabled: var(--bng-button-custom-enabled, transparent);
$button-custom-active: var(--bng-button-custom-active, transparent);
$button-custom-hover: var(--bng-button-custom-hover, transparent);
$button-custom-disabled: var(--bng-button-custom-disabled, transparent);

// Custom accent opacity variables
$button-custom-enabled-opacity: var(--bng-button-custom-enabled-opacity, 1);
$button-custom-hover-opacity: var(--bng-button-custom-hover-opacity, 1);
$button-custom-active-opacity: var(--bng-button-custom-active-opacity, 1);
$button-custom-disabled-opacity: var(--bng-button-custom-disabled-opacity, 1);
$button-custom-border-enabled: var(--bng-button-custom-border-enabled, transparent);
$button-custom-border-hover: var(--bng-button-custom-border-hover, transparent);
$button-custom-border-active: var(--bng-button-custom-border-active, transparent);
$button-custom-border-disabled: var(--bng-button-custom-border-disabled, transparent);


// focus frame
$f-offset: 5px;
$rad: $border-rad-1;
// focus frame when holding
// $hold-rad: calc($rad * 1.1);
// $hold-f-offset: calc($f-offset * 1.4);
$hold-rad: 4px;
$hold-f-offset: $f-offset;

// Custom accent border radius
$button-custom-border-radius: var(--bng-button-custom-border-radius, #{$rad} #{$rad} #{$rad} #{$rad});

// Custom background image for buttons, overriden by any hold state
.bng-button {
  > .background {
    background-image: var(--bng-button-bg-image, unset);
    background-size: var(--bng-button-bg-size, unset);
    background-position: var(--bng-button-bg-position, unset);
  }
}

.show-hold {
  $hold-grad: #fffd 50%, transparent 50%;
  --btn-hold-fill: #ddd3 0%, #eee7 45%, #fffa 50%, transparent 50%;

  .hold-arrow {
    position: absolute;
    top: -$hold-f-offset * 1.8;
    left: 0;
    width: 100%;
    height: $hold-f-offset * 2.25;
    transition: top 150ms;
    pointer-events: none;
    z-index: 1;
    path {
      fill: var(--bng-cool-gray-200);
      stroke: #0008;
      stroke-width: 1px;
    }
  }

  &::after {
    content: "";
    display: inline-block;
    position: absolute;
    top: -$hold-f-offset;
    left: -$hold-f-offset;
    right: -$hold-f-offset;
    bottom: -$hold-f-offset;

    @include rounded-clip($hold-rad, $rad, $hold-f-offset);

    background-color: #fff5;
    background-image: linear-gradient(90deg, $hold-grad);
    background-repeat: no-repeat;
    opacity: 1;
    // reset time
    transition: background-position 300ms, opacity 0ms 300ms;
    pointer-events: none;
  }
  > .background {
    background-image: linear-gradient(90deg, var(--btn-hold-fill));
    background-size: calc(200% + $hold-f-offset * 2) 100%;
    transition: background-position 300ms, opacity 0ms 300ms;
  }
  &::after {
    background-size: 200% 100%;
  }
  > .background, &::after {
    background-position: 100% 50%;
  }
  &.hold-vertical {
    > .background {
      background-image: linear-gradient(0deg, var(--btn-hold-fill));
      background-size: 100% calc(200% + $hold-f-offset * 2);
    }
    &::after {
      background-size: 100% 200%;
      background-image: linear-gradient(0deg, $hold-grad);
    }
    > .background, &::after {
      background-position: 50% 0%;
    }
  }

  // focus frame flash
  &::before {
    background-color: rgba(#fff, 0);
    transition: background-color 500ms;
  }

  // when starting to hold
  &.hold-start {
    > .background, &::after {
      background-position: 80% 50%;
      transition: none;
    }
    &.hold-vertical > .background, &.hold-vertical::after {
      background-position: 50% 20%;
    }
  }

  // while holding
  &.hold-active {
    .hold-arrow {
      top: -$hold-f-offset * 1.2;
      path {
        fill: #fff;
      }
    }
    &::after {
      opacity: 1;
    }
    > .background, &::after {
      background-position: 0% 50%;
      transition: background-position var(--hold-time, 1s);
    }
    &.hold-vertical > .background, &.hold-vertical::after {
      background-position: 50% 100%;
    }
    // when not focused, emulate focus frame for flash effect on hold-complete
    // NOTE: add :not(:focus-visible) only when our CEF supports it, otherwise this rule will be completely ignored
    &:not(:focus):not(.focus-visible)::before {
      content: "";
      display: block;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      border-radius: var(--bng-corners-1);
      pointer-events: none;
    }
  }
  // NOTE: add &:focus-visible only when our CEF supports it, otherwise this rule will be completely ignored
  &.hold-active, &:focus, &.focus-visible {
    .hold-arrow {
      // keep arrow above the focus frame
      z-index: 202;
    }
  }

  // when completed
  &.hold-completed {
    &::after {
      transition: background-position 0ms 100ms, opacity 100ms;
    }

    // while still holding
    &.hold-active {
      &::after {
        background-position: 0% 50%;
      }
      &.hold-vertical::after {
        background-position: 50% 100%;
      }

      // focus frame flash
      &::before {
        background-color: rgba(#fff, 0.5);
        transition: background-color 100ms;
      }
    }
  }
}

.bng-button {
  color: white;
  box-sizing: border-box;
  font-family: var(--fnt-defs);
  font-size: 1rem; // default value to be overriden with the parent component's styles
  line-height: 1.5rem; // default value to be overriden with the parent component's styles
  // min-height: 2em; Button size should be driven by the line-height. If you need it to be taller - override the line-height
  padding: var(--bng-button-padding, 0.5em);
  padding-top: var(--bng-button-padding-top, 0.3em);
  padding-bottom: var(--bng-button-padding-bottom, 0.325em); // move the text up a little to compensate for lowercase alignment
  border: 0;
  border-radius: $rad; // Focus frame radius uses this variable to adjust, keep it
  overflow: visible;
  display: inline-flex;
  flex-flow: var(--bng-content-flow, row) nowrap;
  align-items: var(--bng-content-align, baseline);
  justify-content: center;
  position: relative;
  flex: 0 0 auto;
  background: transparent;
  isolation: isolate;

  > .background {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: $rad;
    background-color: $button-main-enabled;
    opacity: 1;
    z-index: -1;
    pointer-events: none;
  }

  :not(.background) {
    z-index: 1;
  }

  .icon {
    align-self: var(--bng-icon-align, baseline);
    font-size: var(--bng-icon-size, 1.5em);
    line-height: var(--bng-icon-line-height, 1em);
    transform: translateY(0.025em);
    font-style: normal;
    font-weight: 500;
    z-index: 1;
  }
  &.allcaps {
    text-transform: uppercase;
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
    & > .label {
      padding-left: 0.125rem;
      padding-right: 0.125rem;
    }
    .icon {
      transform: none;
    }
  }
  &.large {
    font-family: "Overpass", var(--fnt-defs);
    font-size: 1.5em;
    line-height: 1.25em;
    font-weight: 700;
    font-style: italic;
    padding-top: 0.35em;
    padding-bottom: 0.4em;
    .icon {
      font-weight: 500;
    }
    &.straight {
      font-style: normal;
    }
  }
  &.small {
    font-size: 0.875em;
    line-height: 1.15em;
    font-weight: 500;
    padding: 0.125em;
    padding-top: 0.125em;
    padding-bottom: 0.13em;
  }
  & > .label {
    display: inline-block;
    flex: 0.15 1 auto;
    word-wrap: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    z-index: 1;
  }

  &:not(.empty) {
    min-width: var(--bng-button-min-width, 6em);
    max-width: var(--bng-button-max-width, 20em);
  }

  & > * {
    flex: 0 0 auto;
  }

  & .bngicon {
    min-width: 1.5em;
    min-height: 1.5em;
  }

  &.l-icon:not(.empty) {
    text-align: left;
    .icon {
      padding-right: 0.2em;
    }
    .bngicon {
      margin-right: 0.2em;
    }
  }
  &.r-icon:not(.empty) {
    .icon {
      padding-left: 0.2em;
    }
    .bngicon {
      margin-left: 0.2em;
    }
  }

  &.no-hover:hover {
    cursor: default !important;
    opacity: inherit;
    > .background {
      background-color: inherit;
    }
  }

  &.external-icon {
    align-items: center;
  }

  // Focus frame offset is set here, with this mixin
  @include modify-focus($rad, $f-offset);

  &:focus {
    > .background {
      border: none;
    }
  }

  &:not(.no-hover):hover {
    > .background {
      background-color: $button-main-hover;
      opacity: 1;
    }
  }

  &:active,
  &.hold-active {
    > .background{
      background-color: $button-main-active;
    }
  }

  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &[accent="main"] {
    --btn-hold-fill: #{$button-main-enabled} 40%, #{$button-main-hold-fill} 50%, transparent 50%;
  }

  &[accent="secondary"] {
    > .background {
      background-color: $button-secondary-enabled;
    }
    --btn-hold-fill: #{$button-secondary-enabled} 40%, var(--bng-ter-blue-gray-500) 47%, var(--bng-ter-blue-gray-400) 50%, transparent 50%;

    &:not(.no-hover):hover {
      > .background {
        background-color: $button-secondary-hover;
      }
    }

    &:active,
    &.hold-active {
      > .background {
        background-color: $button-secondary-active !important;
      }
    }

    &:disabled {
      > .background{
        background-color: $button-secondary-disabled;
      }
      opacity: 0.5;
      pointer-events: none;
    }
  }

  &[accent="attention"] {
    > .background{
      background-color: $button-attention-enabled;
    }
    --btn-hold-fill: #{$button-attention-enabled} 40%, var(--bng-add-red-500) 47%, var(--bng-add-red-400) 50%, transparent 50%;

    &:not(.no-hover):hover {
      > .background {
        background-color: $button-attention-hover;
      }
    }

    &:active,
    &.hold-active {
      > .background {
        background-color: $button-attention-active !important;
      }
    }

    &:disabled {
      > .background {
        background-color: $button-attention-disabled;
      }
      opacity: 0.5;
      pointer-events: none;
    }
  }

  &[accent="attentionghost"] {
    --bng-icon-color: #{$button-attention-ghost-fg};
    color: var(--bng-add-red-500);
    > .background{
      background-color: $button-attention-ghost-enabled;
      opacity: 0;
    }
    --btn-hold-fill: #{$button-attention-ghost-enabled} 40%, var(--bng-add-red-700) 47%, var(--bng-add-red-500) 50%, transparent 50%;

    &:not(.no-hover):hover {
      > .background {
        background-color: $button-attention-ghost-hover;
        opacity: 0.4;
      }
    }

    &:active,
    &.hold-active {
      > .background {
        background-color: $button-attention-ghost-active !important;
        opacity: 1 !important;
      }
    }

    &:disabled {
      > .background {
        background-color: $button-attention-ghost-disabled;
      }
      opacity: 0.4;
      pointer-events: none;
    }
  }

  &[accent="ghost"] {
    > .background{
      background-color: $button-ghost-enabled;
      opacity: 1;
    }
    --btn-hold-fill: #{$button-ghost-enabled} 40%, var(--bng-orange-700) 47%, var(--bng-orange-500) 50%, transparent 50%;

    &:not(.no-hover):hover {
      > .background {
        background-color: $button-ghost-hover;
        opacity: 0.4;
      }
    }

    &:active,
    &.hold-active {
      > .background {
        background-color: $button-ghost-active !important;
        opacity: 0.6 !important;
      }
    }

    &:disabled {
      > .background {
        background-color: $button-ghost-disabled;
      }
      opacity: 0.4;
      pointer-events: none;
    }
  }

  &[accent="custom"] {
    margin: var(--bng-button-custom-margin, 0.25rem);
    > .background{
      background-color: $button-custom-enabled;
      opacity: $button-custom-enabled-opacity;
      border-radius: $button-custom-border-radius;
      border: 0.125rem solid $button-custom-border-enabled;
    }
    --btn-hold-fill: #{$button-custom-enabled} 40%, var(--bng-button-custom-hover) 47%, var(--bng-button-custom-active) 50%, transparent 50%;

    &:not(.no-hover):hover {
      > .background {
        background-color: $button-custom-hover;
        opacity: $button-custom-hover-opacity;
        border: 0.125rem solid $button-custom-border-hover;
      }
    }

    &.show-hold {
      --custom-hold-offset: var(--bng-button-custom-hold-offset, $hold-f-offset);

      .hold-arrow {
        top: calc(-1 * var(--custom-hold-offset) - 0.25rem);
        pointer-events: none;
      }

      &.hold-active {
        .hold-arrow {
          top: calc(-1 * var(--custom-hold-offset));
        }
      }

      &::after {
        top: calc(-1 * var(--custom-hold-offset));
        left: calc(-1 * var(--custom-hold-offset));
        right: calc(-1 * var(--custom-hold-offset));
        bottom: calc(-1 * var(--custom-hold-offset));
      }
      &.fallback-hold-offset::after {
        @include rounded-clip($hold-rad, $rad, $hold-f-offset);
      }
    }

    &:active,
    &.hold-active {
      > .background {
        background-color: $button-custom-active !important;
        opacity: $button-custom-active-opacity !important;
        border: 0.125rem solid $button-custom-border-active !important;
      }
    }

    &:disabled {
      > .background {
        background-color: $button-custom-disabled;
        border: 0.125rem solid $button-custom-border-disabled;
      }
      opacity: $button-custom-disabled-opacity;
      pointer-events: none;
    }
  }

  &[accent="outlined"],
  &[accent="attentionoutlined"] {
    --btn-hold-fill: #7D9FB588 40%, #7D9FB5 50%, transparent 50%;

    > .background{
      background-color: $button-outlined-enabled;
      border: 0.125rem solid $button-outlined-border-enabled;
    }

    &:not(.no-hover):hover {
      > .background {
        background-color: $button-outlined-hover;
        border: 0.125rem solid $button-outlined-border-hover;
      }
    }

    &:active,
    &.hold-active {
      > .background {
        background-color: $button-outlined-active !important;
        border: 0.125rem solid $button-outlined-border-active !important;
      }
    }

    &:disabled {
      > .background {
        background-color: $button-outlined-disabled;
        border: 0.125rem solid $button-outlined-border-disabled;
      }
      opacity: 0.5;
      pointer-events: none;
    }
  }

  &[accent="attentionoutlined"] {
    color: var(--bng-add-red-400);

    > .background{
      background-color: $button-attention-enabled;
      border: 0.125rem solid $button-attention-enabled;
    }

    &:not(.no-hover):hover {
      color: var(--bng-off-white);
      > .background {
        background-color: $button-ghost-hover;
        border: 0.125rem solid $button-attention-hover;
        opacity: 0.5;
      }
    }

    &:active,
    &.hold-active {
      color: var(--bng-off-white) !important;
      > .background {
        background-color: $button-outlined-active !important;
        border: 0.125rem solid $button-attention-active !important;
        opacity: 0.6 !important;
      }
    }

    &:disabled {
      > .background {
        background-color: $button-outlined-disabled;
        border: 0.125rem solid $button-attention-disabled;
      }
      opacity: 0.5;
      pointer-events: none;
    }
  }

  &[accent="text"] {
    > .background{
      background-color: $button-text-enabled;
      opacity: 0.4;
    }

    &:not(.no-hover):hover {
      > .background{
        background-color: $button-text-hover;
        opacity: 0.6;
      }
    }

    &:active,
    &.hold-active {
      > .background{
        background-color: $button-text-active !important;
        opacity: 1 !important;
      }
    }

    &:disabled {
      > .background{
        background-color: $button-text-disabled;
      }
      opacity: 0.4;
      pointer-events: none;
    }
  }

  &:not([accent="menu"]):not([accent="custom"]) {
    margin: var(--bng-button-margin, 0.25rem);
  }

  &[accent="menu"] {
    display: flex;
    justify-content: stretch;
    // width: 100%;
    margin: 0.125rem;
    text-align: left;
    // @include modify-focus($rad, 0.0rem);

    > .background {
      background-color: $button-menu-enabled;
      opacity: 0.4;
    }

    &.selected {
      color: #f60;
    }

    &:not(.no-hover):hover,
    &:focus {
      > .background {
        background-color: $button-menu-hover;
        opacity: 0.4;
      }
    }

    &:active,
    &.hold-active {
      > .background {
        background-color: $button-menu-active !important;
        opacity: 1 !important;
      }
    }

    &:disabled {
      > .background {
        background-color: $button-menu-disabled;
      }
      opacity: 0.4;
      pointer-events: none;
    }
  }
}

:deep(span[ui-event]) {
  padding-right: var(--bng-ui-event-padding-override,0.25em);
}
</style>
