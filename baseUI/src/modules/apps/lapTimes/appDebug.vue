<template>
  <div class="laptimes-app" style="overflow-y: scroll;">
    <div class="laptimes-header">
      <h2>Lap Times Debug</h2>
    </div>

    <!-- Basic Info Component -->
    <BasicInfo :fastData="fastData" :slowData="slowData" :staticData="staticData" />

    <!-- Best Times Component -->
    <BestTimes :slowData="slowData" />

    <!-- Lap Times Component -->
    <LapTimes :fastData="fastData" :slowData="slowData" :staticData="staticData" />

    <!-- Segment Times Component -->
    <SegmentTimes :fastData="fastData" :slowData="slowData" :staticData="staticData" />

    <!-- Placement Component -->
    <Placement :fastData="fastData" :slowData="slowData" :staticData="staticData" :placementData="placementData" />

    <!-- Raw Data Component (for debugging) -->
    <RawData :fastData="fastData" :slowData="slowData" :staticData="staticData" :placementData="placementData" />
  </div>
</template>

<script setup>
import { useEvents, useStreams } from '@/services/events'
import { ref, onMounted, onUnmounted } from 'vue'
import BasicInfo from './components/BasicInfo.vue'
import BestTimes from './components/BestTimes.vue'
import LapTimes from './components/LapTimes.vue'
import SegmentTimes from './components/SegmentTimes.vue'
import Placement from './components/Placement.vue'
import RawData from './components/RawData.vue'

const events = useEvents()

// Stream data refs
const fastData = ref({})
const slowData = ref({})
const staticData = ref({})
const placementData = ref({})

onMounted(() => {
  // Subscribe to all four lapTimes streams
  useStreams(["lapTimes_fast", "lapTimes_slow", "lapTimes_static", "lapTimes_placement"], (streams) => {
    if (streams.lapTimes_fast) {
      fastData.value = streams.lapTimes_fast
    }
    if (streams.lapTimes_slow) {
      slowData.value = streams.lapTimes_slow
    }
    if (streams.lapTimes_static) {
      staticData.value = streams.lapTimes_static
    }
    if (streams.lapTimes_placement) {
      placementData.value = streams.lapTimes_placement
    }
  })
})

onUnmounted(() => {
  // Cleanup if needed
})
</script>

<style scoped lang="scss">
@use "./common.scss";
</style>