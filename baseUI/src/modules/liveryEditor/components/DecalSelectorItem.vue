<template>
  <BngImageTile v-bind="props" />
</template>

<script>
export default {
  width: 8,
  height: 8,
  margin: 0.25,
}
</script>

<script setup>
import { BngImageTile } from "@/common/components/base"

const props = defineProps({
  externalImage: String,
})
</script>

<style lang="scss" scoped></style>
