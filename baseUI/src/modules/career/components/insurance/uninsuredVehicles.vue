<template>
  <div class="popup-content">
    <div class="popup-header">
      <span class="header-title">Uninsured Vehicles</span>
    </div>

    <div class="warning-message">
      These vehicles have no insurance coverage. Add coverage to protect against repair costs.
    </div>

    <div v-if="props.uninsuredData.carsUninsured && props.uninsuredData.carsUninsured.length > 0" class="vehicle-list">
      <InsuranceVehTile
        v-for="(vehicle, index) in props.uninsuredData.carsUninsured"
        :key="index"
        :vehicle="vehicle"
        class="uninsured-vehicle-item"
      >
        <template #extra-info>
          <div class="no-coverage-warning">
            No coverage - you pay full repair costs
          </div>
        </template>
        <template #rightContent>
          <BngButton
            class="add-coverage-button bigger-button"
            accent="custom"
            @click="openAddCoverage(vehicle)"
          >
            <BngIcon class="button-icon" :type="icons.shieldCheckmark" />
            Add Coverage
          </BngButton>
        </template>
      </InsuranceVehTile>
    </div>

    <div v-else class="no-vehicles-wrapper">
      <BngIcon class="success-icon" :type="icons.checkmark" />
      <div class="success-title">All Vehicles Insured</div>
      <div class="success-message">You don't have any uninsured vehicles.</div>
    </div>

    <div class="closeButton">
      <BngButton class="close-button" accent="custom" @click="closePopup">
        Back
      </BngButton>
    </div>
  </div>
</template>

<script setup>
import { BngIcon, icons, BngButton, BngUnit } from "@/common/components/base"
import { ChooseInsuranceMain, InsuranceVehTile } from "@/modules/career/components"
import { addPopup } from "@/services/popup"

const props = defineProps({
  uninsuredData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["return"])

const closePopup = () => {
  emit("return", true)
}

const openAddCoverage = (vehicle) => {
  addPopup(ChooseInsuranceMain, {
    menuMode: 'change',
    params: { vehicleId: vehicle.id }
  })
}
</script>

<style scoped lang="scss">
.popup-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: linear-gradient(135deg, var(--bng-cool-gray-800) 0%, var(--blue-shade-100) 100%);
  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  padding: 32px;
  color: white;
  width: 50em;
  max-height: 80vh;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.8em;
  font-weight: 700;
}

.header-icon {
  font-size: 1.2em;
  color: var(--bng-add-red-400);
}

.header-title {
  color: white;
}

.warning-message {
  text-align: center;
  color: var(--bng-add-red-300);
  font-size: 1em;
  margin-bottom: 8px;
}

.vehicle-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  max-height: 500px;
}

.uninsured-vehicle-item {
  background: linear-gradient(180deg, var(--bng-add-red-800) 0%, var(--bng-add-red-700) 100%) !important;
  border: 2px solid var(--bng-add-red-700) !important;

  &:hover {
    border-color: var(--bng-add-red-600) !important;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  }

  :deep(.vehicle-thumbnail-wrapper) {
    width: 120px;
    height: 80px;
    border: 2px solid var(--bng-add-red-700);
  }

  :deep(.vehicle-name) {
    font-size: 1.4em;
    font-weight: 700;
    color: white;
  }

  :deep(.vehicle-value) {
    font-size: 0.85em;
    color: var(--bng-add-red-300);
  }
}

.no-coverage-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75em;
  color: var(--bng-add-red-400);
  margin-top: 4px;
}

.warning-small-icon {
  font-size: 1em;
}

.button-icon {
  font-size: 1.5em;
  margin-right: 0.5rem;
}

.bigger-button {
  padding: 6px 15px;
  --bng-button-border-radius: var(--bng-corners-2);
  --bng-button-custom-border-radius: var(--bng-corners-2);
}

.add-coverage-button {
  --bng-button-custom-enabled: var(--orange-shade-20);
  --bng-button-custom-hover: var(--orange-shade-10);
  --bng-button-custom-active: var(--orange-shade-10);
  --bng-button-custom-disabled: var(--bng-cool-gray-800);
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-vehicles-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  gap: 16px;
}

.success-icon {
  font-size: 4em;
  color: var(--bng-add-orange-400);
}

.success-title {
  font-size: 1.5em;
  font-weight: 700;
  color: white;
}

.success-message {
  font-size: 1em;
  color: var(--bng-cool-gray-400);
}

.close-button {
  --bng-button-custom-enabled: var(--bng-cool-gray-700);
  --bng-button-custom-hover: var(--bng-cool-gray-600);
  --bng-button-custom-active: var(--bng-cool-gray-800);
  width: 100%;
  padding: 12px 32px;
  font-size: 1.1em;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.closeButton {
  margin-top: 8px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>