<!-- bngCardHeading - a heading for a bngCard component -->
<template>
  <h2 :class="{ 'card-heading': true, [`heading-style-${type}`]: true, outline: outline }">
    <slot>BNG Card Heading</slot>
  </h2>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: "line",
    validator: v => ["line", "ribbon", "none"].includes(v) || v === "",
  },
  outline: {
    type: Boolean,
    default: false,
  }
})
</script>

<style lang="scss" scoped>
.card-heading.heading-style-none {
  padding-left:0.5em;
}
.card-heading {
  font-size: 1.5rem;
  line-height: 1.5em;
  font-weight: 800;
  font-style: italic;
  text-align: left;

  position: relative;
  margin: 0.65em 0 0.5em 0;
  padding-left: 1.6em;
  padding-right: 0.75em;
  overflow: hidden;

  flex: 0 0 auto;
  &.heading-style-line::before, &.heading-style-ribbon::before {
    content: " ";
    transform: matrix(0.94, 0, -0.38, 1, 0, 0);
    width: 0.5em;
    position: absolute;
    height: 1em;
    left: 0.65em;
    top: 0.25em;
  }
  &.heading-style-line {
    &::before {
      background: var(--bng-orange-b400);
      width: 0.5em;
      left: 0.65em;
    }
    &.outline::before {
      background: transparent;
      box-sizing: border-box;
      border: 0.1875rem solid var(--bng-orange-b400);
    }
  }
  &.heading-style-ribbon {
    &::before {
      background: var(--bng-orange-b400);
      width: 1.5em;
      left: -0.35em;
    }
    &.outline::before {
      background: transparent;
      box-sizing: border-box;
      border: 0.1875rem solid var(--bng-orange-b400);
    }
  }
}
</style>
