<!-- bngAdvCardHeading - a main heading for Mission details screen -->
<!-- TODO - rename this to something more related if it is to be mission details screen only, or if generic - move to components, add demo etc. -->
<template>
  <div class="bng-screen-header" :class="{ [`heading-style-${type}`]: true, prehead: preheadings }">
    <div class="decorator"></div>
    <span v-if="preheadings" class="pre-header" :class="{ 'with-divider': divider }">
      <BngIcon v-if="icon" :type="icon" class="pre-header-icon" />
      <span class="location" v-for="preheading in preheadings" :key="preheading">
        {{ preheading }}
      </span>
    </span>
    <h1 class="header"><slot></slot></h1>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue"
import { BngIcon } from "@/common/components/base"

const blurVal = ref(false)

onMounted(() => window.setTimeout(() => (blurVal.value = true), ~~+props.blurDelay))

const props = defineProps({
  blurDelay: Number,
  preheadings: Array,
  divider: Boolean,
  icon: String,
  type: {
    type: String,
    default: "line",
    validator: v => ["line", "ribbon"].includes(v) || v === "",
  },
})
</script>

<style scoped lang="scss">
$heading-background-color: rgba(0, 0, 0, 0.6);

$divider-color: var(--bng-off-white);
$divider-height: 0.9em;

$decoration-color: #ff6600;
$font-top-line-space: 1px;

.bng-screen-header {
  position: relative;
  display: grid;
  grid-template:
    "decorator preheader" auto
    "decorator header" auto / auto 1fr;
  // overflow: hidden;
  font-family: Overpass, var(--fnt-defs);
  color: var(--bng-off-white);
  min-height: 3.5em;
  flex: 0 0 auto;
  line-height: 1.25em;
  z-index: 2;

  .decorator {
    position: relative;
    grid-area: decorator;
    grid-row-end: span 2;
    width: 4.5rem;
    overflow: hidden;
    margin-bottom: -2rem;
    &::before {
      content: "";
      position: absolute;
      top: 0;
      right: 1em;
      width: 5em;
      height: 25em;
      background: $decoration-color;
      transform-origin: right top;
      transform: matrix(0.94, 0, -0.38, 1, 0, 0);
    }
    &::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      width: 0.5em;
      height: 25em;
      background: $decoration-color;
      transform-origin: right top;
      transform: matrix(0.94, 0, -0.38, 1, 0, 0);
    }
  }

  > .pre-header {
    display: inline-block;
    padding: 0.5em 0.5em 0 0.5em;
    border-top-left-radius: var(--bng-corners-1);
    border-top-right-radius: var(--bng-corners-1);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: var(--bng-corners-1);
    font-weight: 400;
    display: flex;
    align-items: center;
    gap: 0.5em;

    .pre-header-icon {
      font-size: 1.2em;
      transform: translateY(-0.05em) translateX(0.25em);

    }

    > .location:not(:last-child) {
      padding-right: 0.5em;
    }

    &.with-divider > .location:not(:last-child) {
      position: relative;
      padding-right: 1.34em;

      &::after {
        content: "";
        position: absolute;
        top: calc(50% - ($divider-height / 2) - $font-top-line-space);
        right: 0.6em;
        width: 0.1em;
        height: $divider-height;
        background: $divider-color;
        transform: matrix(0.94, 0, -0.37, 1, 0, 0);
      }
    }
  }

  > .header {
    padding: 0.5rem 0.75rem 0.5rem 0;
    margin: 0;
    font-weight: 800;
    font-style: italic;
    font-size: 2em;
    line-height: 1.25em;
  }
}
</style>
