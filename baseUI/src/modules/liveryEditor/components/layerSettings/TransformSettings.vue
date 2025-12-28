<template>
  <LayerSettingsBase>
    <template #heading>Transform</template>
    <template>
      <div class="setting-item item-column">
        <div class="slider-text-container">
          <BngInput v-model="scaleX" :min="0" :max="6" :step="0.01" type="number" prefix="X" />
        </div>
      </div>
      <div class="setting-item item-column">
        <div class="slider-text-container">
          <BngInput v-model="scaleY" type="number" prefix="Y" :min="0" :max="6" :step="0.01" />
        </div>
      </div>
    </template>
  </LayerSettingsBase>
</template>

<script setup>
import { BngInput } from "@/common/components/base"
import { LayerSettingsBase } from "."
import { ref } from "vue"

const scaleX = ref(0.5)
const scaleY = ref(0.5)
</script>

<style lang="scss" scoped></style>
