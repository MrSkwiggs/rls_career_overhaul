<template>
  <BngButton :label="undefined">
    <span>{{ label }}</span>
    <BngBinding v-if="showBinding" :uiEvent="uiEvent" :deviceMask="deviceMask" class="button-binding" />
  </BngButton>
</template>

<script setup>
import { BngButton, BngBinding } from "@/common/components/base"

defineProps({
  uiEvent: String,
  deviceMask: String,
  action: String,
  label: String,
  showBinding: {
    type: Boolean,
    default: true,
  },
})
</script>

<style lang="scss" scoped>
:deep() {
  .button-binding {
    margin-left: 0.5rem;
  }
}
</style>
