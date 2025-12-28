<template>
  <BngButton>
    <BngBinding v-if="uiEvent" :uiEvent="uiEvent" :accent="ACCENTS.secondary" deviceMask="xinput" />
  </BngButton>
</template>

<script setup>
import { ACCENTS, BngBinding, BngButton } from "@/common/components/base"

defineProps({
  uiEvent: String,
})
</script>
