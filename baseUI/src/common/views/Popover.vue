<template>
  <div class="popover-container">
    <!-- <component v-for="popoverContent of popover.popovers" :is="popoverContent"></component> -->
  </div>
</template>

<script setup>
import { BngPopoverContent } from "@/common/components/base"
import { usePopover } from "@/services/popover"

const popover = usePopover()
</script>

<style lang="scss" scoped>
.popover-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  pointer-events: none;

  color: var(--bng-off-white);
}
</style>
