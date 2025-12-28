<template>
  <div v-if="managementDetails && managementDetails.buttonInfo && managementDetails.buttonInfo.length > 0" class="management-details">
    <div v-if="managementDetails.details" class="current-vehicle-info">
      <div class="info-row">
        <span class="label">Current Vehicle:</span>
        <span class="value">{{ managementDetails.details.currentVehicleName }}</span>
      </div>
    </div>

    <div class="buttons-section">
      <div v-for="button in managementDetails.buttonInfo" :key="button.buttonId" class="button-container">
        <BngButton :accent="button.accent || 'secondary'" :label="button.label" :icon="button.icon" @click="handleButtonClick(button.buttonId)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { BngButton, BngCardHeading, BngCard } from "@/common/components/base"

const props = defineProps({
  managementDetails: {
    type: Object,
    default: null,
  },
  executeButton: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(["button-click"])

// managementDetails is now passed as a prop

const handleButtonClick = buttonId => {
  props.executeButton(buttonId)
  emit("button-click", buttonId)
}
</script>

<style scoped lang="scss">
.management-details {
  position: relative;
  color: white;
  display: flex;
  flex-direction: column;
  background: none;
  overflow: visible;
  gap: 0.5rem;
}

.current-vehicle-info {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.vehicle-preview {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.vehicle-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row .label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.info-row .value {
  font-size: 0.9rem;
  font-weight: 500;
  color: white;
}

.buttons-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  width: 100%;
}

.button-container {
  width: 100%;
}

.button-container :deep(.bng-button) {
  max-width: unset;
  width: 100%;
  align-items: center;
  margin: 0 !important;
}

.button-container :deep(.bng-button .label) {
  text-align: center;
}

.button-container :deep(.bng-button .icon) {
  transform: none;
}
</style>
