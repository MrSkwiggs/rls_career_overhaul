<template>
  <div class="layout-wrapper layout-safezones">
    <div class="layout-content">
      <slot>Content here</slot>
    </div>
  </div>
</template>

<script>
export const LAYOUT_ALIGNMENTS = {
  // setting value : justify-content value
  left: "flex-start",
  right: "flex-end",
  center: "center",
}
</script>

<style lang="scss">
// set defaults for --layout-content-* in App.vue instead
$content-max-width: var(--layout-content-width);
$content-h-position: var(--content-h-position, var(--layout-content-alignment));
$content-flow: var(--content-flow, row);

// safezones
$safezone-sides: var(--safezone-sides, 1em);
$safezone-top: var(--safezone-top, 0.5em);
$safezone-bottom: var(--safezone-bottom, 0.5em);

// sides
$sides-start: var(--sides-start, #0008);
$sides-end: var(--sides-end, transparent);

.layout-wrapper {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: hidden;

  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
  justify-content: $content-h-position;

  > .layout-content {
    flex: 1 1 auto;
    position: relative;
    display: flex;
    flex-flow: $content-flow;
    flex-wrap: nowrap;
    width: 100%;
    max-width: max(33.4%, $content-max-width);
    min-height: 0;
    overflow: hidden;
  }
}

.layout-safezones {
  margin-top: $safezone-top;
  margin-bottom: $safezone-bottom;
  padding-left: $safezone-sides;
  padding-right: $safezone-sides;
}

.layout-sides {
  &::before, &::after {
    flex: 1 1 auto;
    content: "";
    background-size: 100% auto;
    background-repeat: repeat-y;
    background-position-y: 0%;
  }

  &::before {
    background-image: linear-gradient(-90deg, $sides-start, $sides-end);
    background-position-x: 100%;
  }

  &::after {
    background-image: linear-gradient(90deg, $sides-start, $sides-end);
    background-position-x: 0%;
  }
}
</style>
