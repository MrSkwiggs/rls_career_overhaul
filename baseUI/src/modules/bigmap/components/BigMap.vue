BigMap - Main container component for the bigmap feature

<template>
  <div class="bigmap-container">
    <BngScreenHeading
      class="bigmap-heading"
      :preheadings="translatedPreheadings"
      :divider="true"
      type="line"
    >
      {{ currentFilterTitle }}
    </BngScreenHeading>
    <div class="bigmap-content">
      <div class="bigmap-left-content">
        <PoiFilters :store="store" @toggleGroupVisibility="handleToggleGroupVisibility" />
        <div class="bigmap-poilist-outline">
          <BngDrawer v-model="isPoiListVisible" position="left" blur :header="$tt('bigMap.sideMenu.pois')">
            <PoiList class="bigmap-poilist" :store="store" />
          </BngDrawer>
        </div>
      </div>

      <div class="bigmap-center-outline">
      </div>
        <div class="bigmap-details-outline" v-if="isDetailsVisible">
          <PoiDetails
            :store="store"
            @set-route="onSetRoute"
            @teleport="onTeleport"
          />
        </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue"
import { BngScreenHeading, BngDrawer } from "@/common/components/base"
import PoiList from "./PoiList.vue"
import PoiDetails from "./PoiDetails.vue"
import PoiFilters from "./PoiFilters.vue"
import useBigMap from "../composables/useBigMap"

const store = useBigMap()

const {
  isPoiListVisible,
  isDetailsVisible,
  translatedPreheadings,
  currentFilterTitle,
  onSetRoute,
  onTeleport,
  toggleGroupVisibility,
  initialize,
  cleanup,
  debugLog
} = store

const handleToggleGroupVisibility = (groupKey) => {
  debugLog('BigMap', 'Toggle group visibility', groupKey)
  toggleGroupVisibility(groupKey)
}

onMounted(() => {
  debugLog('BigMap', 'Component mounted, initializing bigmap')
  initialize()
})

onUnmounted(() => {
  debugLog('BigMap', 'Component unmounted, cleaning up bigmap')
  cleanup()
})
</script>

<style lang="scss" scoped>
$width: 25rem;

.bigmap-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bigmap-heading {
  flex: 0 0 auto;
}

.bigmap-content {
  flex: 1 1 auto;
  display: flex;
  overflow: hidden;
  margin-bottom: 5rem;
}

.bigmap-left-content {
  flex: 0 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  gap: 0.5rem;
}

.bigmap-poilist-outline {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
}

.bigmap-poilist {
  width: $width;
  height: 100%;
  overflow: hidden;
}

.bigmap-center-outline {
  flex: 1;
  border-radius: 0;
  box-sizing: border-box;
  padding: 0.5rem;
}

.bigmap-details-outline {
  width: $width;
  flex: none;
  border-radius: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-self: flex-end;
}
</style>