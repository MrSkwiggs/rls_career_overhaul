<template>
  <div class="generic-mission-data">
    <template v-for="(element, index) in displayElements" :key="index">
      <BngSimpleDataDisplay v-if="element"
        :label="$tt(element.title)"
        :value="getElementValue(element)"
        :icon="element.icon"
        :minutes="element.minutes"
        :seconds="element.seconds"
        :milliseconds="element.milliseconds"
        class="mission-data-item">
      </BngSimpleDataDisplay>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { $translate } from "@/services"
import { useEvents } from '@/services/events'
import { useBridge,  } from '@/bridge'
import BngSimpleDataDisplay from '@/common/components/appsUtilities/bngSimpleDataDisplay.vue'

const events = useEvents()
const { lua } = useBridge()

const displayElements = ref([])

// Function to get element value
const getElementValue = (element) => {
  if (element.minutes || element.seconds) {
    return ''
  }

  if (typeof(element.txt) === 'number') {
    return element.txt
  }
  if (element.style === 'text' || element.style === undefined) {
    return $translate.instant(element.txt)
  }

  return 'Error: Unsupported style'
}

// Event handlers
const handleMissionDataChanged = (data) => {
  if (data) {
    // Ensure the array is large enough
    while (displayElements.value.length <= data.index) {
      displayElements.value.push(null)
    }
    // Update the element at the specified index
    displayElements.value[data.index] = data.element
  }
}

const handleMissionDataReset = () => {
  displayElements.value = []
}

onMounted(() => {
  events.on('SetGenericMissionData', handleMissionDataChanged)
  events.on('SetGenericMissionDataResetAll', handleMissionDataReset)

  // Request all current data
  lua.extensions.load('ui_apps_genericMissionData')
  lua.ui_apps_genericMissionData.sendAllData()

})
</script>

<style lang="scss" scoped>
.generic-mission-data {
  display: flex;
  flex-flow: row wrap reverse;
  font-family: 'Overpass', var(--fnt-defs);
  padding: 0.25rem 0.25rem;
  width: auto;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  gap: 0.5rem;
  align-content: flex-start;
  justify-content: flex-start;
  color: var(--bng-off-white);

  .mission-data-item {
    flex: 0 0 auto;
  }
}
</style>
