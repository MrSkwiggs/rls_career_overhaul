PoiList - Component for displaying and filtering POIs

<template>
  <div class="poi-list">
    <div class="poi-list-content" ref="poiListContainer">
      <div
        v-for="section in groupData"
        :key="section.key"
        class="filter-section"
      >
        <div class="filter-header">
          <BngIcon :type="section.icon" />
          <span>{{ section.title ? $tt(section.title) : '' }}</span>
        </div>

        <!-- Groups for this filter -->
        <div
          v-for="group in section.groups"
          :key="group.key"
          class="mission-group"
        >
          <BngCardHeading
            class="mission-group-header"
            type="ribbon" outline
          >
            {{ $t(group.label) }}
          </BngCardHeading>

          <!-- POI Items -->
          <div class="poi-list-items">
            <PoiCard
              v-for="poiId in group.elementIds"
              :key="poiId"
              :data-poi-id="poiId"
              :shown="shownCards.has(poiId)"
              :poi="processedPoiData[poiId]"
              @select="selectPoi"
              @hover="onHover"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from "vue"
import { BngCardHeading, BngIcon, icons } from "@/common/components/base"
import PoiCard from "./PoiCard.vue"
import { $translate } from "@/services/translation"

const props = defineProps({
  store: {
    type: Object,
    required: true
  }
})

const poiListContainer = ref(null)
const shownCards = ref(new Set())

const {
  groupData,
  poiData,
  selectedPoi,
  selectPoi,
  onHover,
  debugLog
} = props.store

const processedPoiData = computed(() => {
  const processed = {}

  if (!poiData.value) return processed

  for (const [poiId, poi] of Object.entries(poiData.value)) {
    if (!poi) continue

    processed[poiId] = {
      id: poi.id || poiId,
      name: poi.name ? $translate.instant(poi.name) : '',
      icon: poi.icon ? icons[poi.icon] : icons._empty,
      thumbnail: poi.thumbnailFile,
      formattedProgress: poi.formattedProgress,
      aggregatePrimary: poi.aggregatePrimary?.label && poi.aggregatePrimary?.value
        ? {
            label: $translate.instant(poi.aggregatePrimary.label),
            value: $translate.instant(poi.aggregatePrimary.value)
          }
        : null,
      isSelected: selectedPoi.value?.id === poi.id
    }
  }

  return processed
})

debugLog("PoiList", "Component initialized", {
  groupDataCount: groupData.value?.length || 0,
  poiDataCount: Object.keys(poiData.value || {}).length,
  processedPoiCount: Object.keys(processedPoiData.value).length
})

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const poiId = entry.target.getAttribute("data-poi-id")
    if (poiId && entry.isIntersecting) {
      shownCards.value.add(poiId)
    } else {
      shownCards.value.delete(poiId)
    }
  }
}, {
  threshold: 0.1,
  rootMargin: "10px"
})

const setupObserver = () => {
  if (!poiListContainer.value) return
  const elms = poiListContainer.value.querySelectorAll("[data-poi-id]")
  const ids = []
  for (const elm of elms) {
    const poiId = elm.getAttribute("data-poi-id")
    if (poiId) {
      ids.push(poiId)
      observer.observe(elm)
    }
  }
  // cleanup
  for (const id of shownCards.value) {
    if (!ids.includes(id)) {
      shownCards.value.delete(id)
    }
  }
}

watch(poiListContainer, cont => cont && nextTick(setupObserver), { immediate: true })

watch([groupData, processedPoiData], () => {
  nextTick(() => {
    observer.disconnect()
    setupObserver()
  })
}, { immediate: false })

onUnmounted(() => {
  shownCards.value.clear()
  observer.disconnect()
})
</script>

<style lang="scss" scoped>
.poi-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  // background-color: rgba(40, 40, 40, 0.9);
  border-radius: 0 0  0.5rem 0;
  color: white;
  overflow: hidden;
}

.poi-list-content {
  flex: 1;
  overflow-y: auto;
  text-overflow: ellipsis;
}

.filter-section {
  margin-bottom: 1rem;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: rgba(60, 60, 60, 0.95);
  color: white;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  :deep(.bng-icon) {
    font-size: 1.2em;
  }
}

.mission-group {
  margin-bottom: 1rem;
}

.mission-group-header {
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
}

.poi-list-items {
  padding: 0 0.5rem;
  gap: 0.25rem;
  display: flex;
  flex-direction: column;
}
</style>