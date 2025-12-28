<!-- PoiDetails - Component for displaying detailed POI information -->
<template>
  <div v-if="selectedPoisList.length >= 1" class="poi-icons" v-bng-blur="true">
    <div
      v-for="(poi, index) in selectedPoisList"
      :key="poi.id || index"
      class="poi-icon"
      :class="{ 'active': index === currentPoiIndex }"
      @click="selectPoi(index)"
    >
      <BngSpriteIcon :src="'map_' + poi.spriteIcon" style="width: 100%; height: 100%" />
    </div>
  </div>
  <div class="poi-details" v-if="selectedPoi" v-bng-blur="true">
    <!-- Display icons for multiple POIs if there are more than one -->
    <div class="poi-content">
      <bngAdvCardHeading class="poi-details-header" type="line" :preheadings="preheadings">
        {{ safeTranslate(selectedPoi.name) }}
      </bngAdvCardHeading>
      <div class="poi-scrollable">
        <AspectRatio
          class="poi-thumbnail"
          v-if="preview"
          ratio="16:9"
          :externalImage="preview"
          imageMode="cover"
        >
          <div class="poi-aggregate-display" v-if="aggregatePrimary || selectedPoi.formattedProgress">
            <div class="poi-stars" v-if="selectedPoi.formattedProgress">
              <div class="stars">
                <BngMainStars
                  v-if="selectedPoi.formattedProgress.unlockedStars"
                  :individualStars="selectedPoi.formattedProgress.unlockedStars.defaults"
                  class="main-stars"
                  :scale="0.8"
                  reverse
                />
                <BngMainStars
                  v-if="selectedPoi.formattedProgress.unlockedStars && selectedPoi.formattedProgress.unlockedStars.totalBonusStarCount > 0"
                  :individualStars="selectedPoi.formattedProgress.unlockedStars.bonus"
                  class="bonus-stars"
                  :scale="0.8"
                />
              </div>
            </div>
            <div v-else-if="aggregatePrimary" class="aggregate-primary">
              <span class="label">{{ $t(aggregatePrimary.label) }}:</span>
              <span class="value">{{ $t(aggregatePrimary.value) }}</span>
            </div>
          </div>
        </AspectRatio>

        <div class="poi-description" v-if="selectedPoi.description">
          {{ safeTranslate(selectedPoi.description) }}
        </div>

      </div>

      <div class="poi-actions">
        <BngButton v-for="action in selectedPoi.actions"  :key="action.id"
          :accent="ACCENTS.secondary"
          :icon-right="action.icon"
          :label="action.label"
          @click="onAction(action)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { vBngBlur } from "@/common/directives"
import { ref, computed } from 'vue'
import { $translate } from '@/services/translation'
import { BngButton, ACCENTS, icons, BngSpriteIcon, BngMainStars } from '@/common/components/base'
import bngAdvCardHeading from '@/modules/missions/components/bngAdvCardHeading.vue'
import AspectRatio from '@/common/components/utility/aspectRatio.vue'



const props = defineProps({
  store: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['setRoute', 'teleport'])

// Get selectedPoi from the store
const { selectedPoi, selectedPoiIds, poiData, debugLog } = props.store

// Add debug logging for component lifecycle
debugLog('PoiDetails', 'Component initialized', {
  selectedPoiId: selectedPoi.value?.id,
  selectedPoiIdsCount: selectedPoiIds.value?.length || 0
})

// Computed list of currently selected POIs
const selectedPoisList = computed(() => {
  if (!selectedPoiIds.value || selectedPoiIds.value.length === 0) {
    return selectedPoi.value ? [selectedPoi.value] : []
  }

  // Get POIs from the selectedPoiIds list
  const pois = []
  for (const poiId of selectedPoiIds.value) {
    const poi = poiData.value[poiId]
    if (poi) {
      pois.push(poi)
    }
  }

  debugLog('PoiDetails', 'Final pois list', pois)
  return pois
})

// Current POI index in the list
const currentPoiIndex = computed(() => {
  if (selectedPoisList.value.length <= 1) return 0

  // Find the index of the currently selected POI in the selectedPoisList
  const index = selectedPoisList.value.findIndex(poi =>
    poi.id === selectedPoi.value?.id
  )
  return index >= 0 ? index : 0
})

// Function to select a different POI from the list
const selectPoi = (index) => {
  if (index >= 0 && index < selectedPoisList.value.length) {
    const newSelectedPoi = selectedPoisList.value[index]
    selectedPoi.value = newSelectedPoi
  }
}

const preheadings = computed(() => {
  const headings = []
  if (selectedPoi.value?.label) {
    headings.push($translate.instant(selectedPoi.value.label))
  }
  return headings
})

const preview = computed(() => {
  if (selectedPoi.value?.previewFiles?.length > 0) {
    return selectedPoi.value.previewFiles[0]
  }
  return selectedPoi.value?.thumbnailFile || null
})

// Helper function to safely handle translations
const safeTranslate = (key) => {
  if (!key) return ''
  try {
    // Handle different types of translation keys
    if (typeof key === 'string') {
      return $translate.instant(key)
    } else if (typeof key === 'object' && key.txt) {
      return $translate.contextTranslate(key)
    } else {
      return $translate.contextTranslate(key)
    }
  } catch (e) {
    console.warn('Translation failed for key:', key, e)
    return typeof key === 'string' ? key : (key?.txt || '')
  }
}

const aggregatePrimary = computed(() => {
  const poi = selectedPoi.value
  return poi?.aggregatePrimary?.label && poi?.aggregatePrimary?.value ? poi.aggregatePrimary : null
})

const onSetRoute = () => {
  emit('setRoute', selectedPoi.value)
}

const onTeleport = () => {
  emit('teleport', selectedPoi.value)
}

const onAction = (action) => {
  props.store.executePoiAction(action.actionId)
}
</script>

<style lang="scss" scoped>
.poi-details {
  background: rgba(40, 40, 40, 0.9);
  border-radius: 0.5rem 0 0 0.5rem;
  padding: 0.5rem;
  color: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.poi-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.poi-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem 0 0 0.5rem;
}

.poi-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  border: 2px solid transparent;
  background: rgba(0, 0, 0, 0.3);

  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
  }

  &.active {
    border-color: var(--bng-orange-300);
    box-shadow: 0 0 0.5rem rgba(255, 165, 0, 0.3);
  }
}

.poi-icon-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.25rem;
}

.poi-icon-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.poi-scrollable {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0;
  margin-bottom: 0.5rem;
}

.poi-details-header {
  background: rgba(0, 0, 0, 0.6);
  margin: -1rem -1rem 0.5rem -1rem;
  padding-top: 0.5rem;
  :deep(.decorator) {
    margin-bottom: 0;
  }
}

.poi-thumbnail {
  border-radius: 0.5rem;
}

.poi-description {
  flex: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem;
  text-align: justify;
  position: relative;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;

}

.poi-aggregate-display {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  z-index: 1;
}

.poi-stars {
}

.aggregate-primary {
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0,0,0,0.6);
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;

  .label {
    font-weight: 300;
  }

  .value {
  }
}

.stars {
  display: flex;
  flex-flow: row;
  gap: 0.5rem;
  & > * {
    min-height: fit-content;
    max-width: fit-content;
    background-color: rgba(0,0,0,0.6);
    border-radius: 0.5rem;
  }
  > .main-stars {
    --star-color: var(--bng-ter-yellow-50);
  }
  > .bonus-stars {
    --star-color: var(--bng-add-blue-400);
  }
}

.poi-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.25rem;
  flex-wrap: wrap;
}

.stat-label {
  font-weight: 600;
  color: var(--bng-orange-300);
  min-width: 100px;
}

.stat-value {
  color: white;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.poi-actions {
  display: flex;
  flex-direction: column;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  :deep(.bng-button) {
    width: 100%;
    max-width: 100%;
  }
}
</style>