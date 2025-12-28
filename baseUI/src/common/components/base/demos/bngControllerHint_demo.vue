<template>
  <div class="controller-demo" :class="{ 'controller-demo-dark': dark }">
    <div class="controls">
      <BngSwitch v-model="dark">Dark</BngSwitch>
      <BngSwitch v-model="flash">Flash back button</BngSwitch>
      <span v-if="!controllerHintRef?.displayed">Connect Xbox controller to see the demo</span>
    </div>
    <BngControllerHint ref="controllerHintRef" device="xinput" :actions="actions" :dark="dark" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { BngControllerHint, BngSwitch } from "@/common/components/base"

const controllerHintRef = ref()

const flash = ref(false)
const dark = ref(false)

const actions = computed(() => [
  "ok",
  "menu",
  { action: "back", label: "Custom back label", flash: flash.value },
])
</script>

<style lang="scss" scoped>
.controller-demo {
  display: flex;
  flex-flow: row wrap;
  gap: 1em;
  > * {
    width: 40em;
  }
  .controls {
    flex: 0 0 100%;
    width: 100%;
  }
  &.controller-demo-dark {
    > *:not(.controls) {
      background-color: #fff8;
    }
  }
}
</style>
