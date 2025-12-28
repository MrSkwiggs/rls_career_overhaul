<!-- BigMapView - Main view component for the bigmap module -->
<template>
  <div class="bigmap-view">
    <BigMap />
  </div>
</template>

<script setup>
import BigMap from '../components/BigMap.vue'
</script>

<style lang="scss" scoped>
.bigmap-view {
  width: 100%;
  height: 100%;
}
</style>