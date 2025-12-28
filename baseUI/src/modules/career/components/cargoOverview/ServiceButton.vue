<template>
  <AspectRatio class="svc-container" ratio="4:2.3" bng-nav-item tabindex="0">
    <BngIcon class="svc-icon" :type="icon" />
    <BngIcon class="svc-arrow" :type="icons.fastTravel" />
    <div class="svc-label">
      {{ label }}
    </div>
  </AspectRatio>
</template>

<script setup>
import { computed } from "vue"
import { BngIcon, icons } from "@/common/components/base"
import { AspectRatio } from "@/common/components/utility"

const props = defineProps({
  label: String,
  icon: Object,
  iconFromId: String,
})

const iconId = {
  openDealership: icons.carDealer,
  repair: icons.garage02, // icons.garage03
  reputation: icons.chartBars,
}

const icon = computed(() => props.icon || iconId[props.iconFromId] || icons.garage01)
</script>

<style lang="scss" scoped>
.svc-container {
  width: 13em;
  background-color: var(--bng-ter-blue-gray-500);
  border-radius: var(--bng-corners-2);
  overflow: hidden;
  &::before {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #0006;
  }
  &:hover, &:focus {
    &::before {
      background-color: #0004;
    }
    .svc-arrow {
      right: 3%;
      color: #f60;
    }
  }
}

.svc-icon,
.svc-arrow {
  position: absolute;
  font-size: 4em;
}
.svc-icon {
  top: 15%;
  left: 21%;
}
.svc-arrow {
  top: 15%;
  right: 7%;
  transition: right 400ms, color 400ms;
}

.svc-label {
  display: block;
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  padding: 0.3em 0.4em 0.2em 0.4em;
  font-size: 1.2em;
  font-weight: 600;
  font-style: italic;
  background-color: #0004;
}
</style>
