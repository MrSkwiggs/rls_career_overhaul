<!-- bngScreenHeading - a main heading for a UI screen -->
<template>
  <div
    class="bng-screen-heading"
    :class="{
      [`heading-style-${type}`]: true,
      prehead: preheadings,
    }">
    <slot name="preheadings"> </slot>

    <span class="header" v-bng-blur="blurVal">
      <div :class="`decorator type${type}`">
        <svg v-if="type === '1'" class="decorator-item" width="100%" height="100%" viewBox="0 0 32 40" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.6328 40H1.62891L14.0039 6H14.002L11.8174 0H26.8174L29.001 6H29.0078L16.6328 40Z" fill="var(--bng-orange-400)"/>
        </svg>
        <svg v-if="type === '2'" class="decorator-item" width="100%" height="100%" viewBox="0 0 36 40" preserveAspectRatio="xMaxYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.6366 0H34.0094L26.73 20H11.3572L18.6366 0Z" fill="#DA5706"/>
          <path d="M19.4504 40H4.07812L11.3572 20L4.07812 0H19.4504L26.7295 20L19.4504 40Z" fill="var(--bng-orange-400)"/>
        </svg>
        <svg v-if="type === '3'" class="decorator-item" width="100%" height="100%" viewBox="0 0 36 40" preserveAspectRatio="xMaxYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.6366 0H34.0094L26.73 20H11.3572L18.6366 0Z" fill="#DA5706"/>
          <path d="M19.4504 40H4.07812L11.3572 20L4.07812 0H19.4504L26.7295 20L19.4504 40Z" fill="var(--bng-orange-400)"/>
        </svg>
      </div>
      <h1>
        <slot></slot>
      </h1>
    </span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { vBngBlur, vBngTooltip } from "@/common/directives"
import { BngButton, BngBinding, BngIcon, ACCENTS, icons } from "@/common/components/base"

const blurVal = ref(false)

onMounted(() => window.setTimeout(() => (blurVal.value = true), ~~+props.blurDelay))

const emit = defineEmits(["hint"]) // Generic hint click event

const props = defineProps({
  blurDelay: Number,
  preheadings: Array,
  divider: Boolean,
  type: {
    type: String,
    default: "1",
    validator: v => ["1", "2", "3"].includes(v) || v === "",
  },
  // Generic hint API
  hintVisible: Boolean,
  hintLabel: String,
  hintIcon: String,
  hintAccent: String,
  hintBindingEvent: String,
})

const preheadings = computed(() => Array.isArray(props.preheadings) && props.preheadings.length > 0 ? props.preheadings : null)

// Compute final hint values
const computedHintVisible = computed(() => props.hintVisible ?? false)
const computedHintLabel = computed(() => props.hintLabel ?? "")
const computedHintIcon = computed(() => props.hintIcon ?? icons.arrowLargeLeft)
const computedHintAccent = computed(() => props.hintAccent ?? ACCENTS.outlined)

const onHintClick = () => {
  emit("hint")
}
</script>

<style scoped lang="scss">
$heading-background-color: var(--bng-heading-background, var(--bng-off-black));
$heading-background-opacity: var(--bng-heading-background-opacity, 0.6);
$heading-content-color: var(--bng-heading-content-color, var(--bng-off-white-brighter));
$divider-color: var(--bng-cool-gray-300);
$divider-height: 0.9em;

$decoration-color: var(--bng-orange-400);
$font-top-line-space: 1px;

.bng-screen-heading {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow: visible;
  font-family: Overpass, var(--fnt-defs);
  color: $heading-content-color;
  // min-height: 3.5em;
  flex: 0 0 auto;
  margin-top: 0.5rem;
  gap: 0.25rem;

  --bng-button-min-width: 0;
  --bng-button-margin: 0;
  --bng-icon-color: var(--bng-off-white-brighter);
  --bng-icon-size: 1.25em;

  &.heading-style-ribbon {
    &::before {
      width: 6em;
      left: -3em;
    }
  }
  // Header
  > .header {
    position: relative;
    background: none;
    padding: 0 0.5em 0 0;
    margin: 0;
    font-weight: 800;
    font-style: italic;
    display: inline-flex;
    align-items: flex-start;
    font-size: 2em;
    line-height: 1.25em;
    & > h1 {
      margin: 0;
      margin-top: 0.2rem;
      font-size: 1em;
      z-index: 2;
    }
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: $heading-background-color;
      border-radius: var(--bng-corners-1);
      opacity: $heading-background-opacity;
      z-index: 0;
    }
    .decorator {
      font-size: 1em;
      height: 1.25em;
      width: 1.25em;


      flex: 0 0 auto;
      z-index: 1;
      &.type1 {
        width: 1em;
      }
      &.type2 {
        width: 1.25em;
      }
      &.type3 {
        width: 0.75em;
      }
      .decorator-item {
        width: 100%;
        height: 100%;
      }
    }
  }
}
</style>
