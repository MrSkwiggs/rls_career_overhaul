<template>
  <div class="paint-settings">
    <BngColorPicker v-model="color" view="luminosity" />
    <div>
      <BngButton @click="setColor">Save</BngButton>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngButton, BngColorPicker } from "@/common/components/base"
import { lua } from "@/bridge"
import Paint from "@/utils/paint"

const LUA_FILL_LAYER = lua.extensions.ui_liveryEditor_layers_fill

const paint = new Paint()
const color = ref({
  hue: 0.5,
  saturation: 1.0,
  luminosity: 0.5,
})

function setColor() {
  paint.hsl = [color.value.hue, color.value.saturation, color.value.luminosity]
  LUA_FILL_LAYER.updateLayer({ color: paint.rgba })
}
</script>

<style lang="scss" scoped>
.paint-setting {
  position: relative;
  display: flex;
  width: 20rem;
  height: 10rem;
  margin-left: -8px;
}
</style>
