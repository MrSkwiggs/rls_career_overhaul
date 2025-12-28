<template>
  <div class="popup-content">
    <div class="popup-header">
      <div class="top-info">
        <div class="top-info-title">
          Vehicles Insured By <span class="top-info-policy-name">{{ props.insuranceData.name }}</span>
        </div>
        <div class="top-info-description">
          Click any vehicle to adjust its deductible • Total Value: <BngUnit :money="props.insuranceData.totalInsuranceVehsValue" />
        </div>
      </div>

      <BngButton
        class="policy-coverage-button"
        accent="custom"
        @click="openEditPolicy"
      >
        Policy Coverage
      </BngButton>
    </div>

    <div class="vehicle-list">
      <InsuranceVehTile
        v-for="(vehicle, index) in props.insuranceData.carsInsured"
        :key="index"
        :vehicle="vehicle"
      >
        <template #rightContent>
          <BngButton
            class="edit-coverage-button bigger-button"
            accent="custom"
            :disabled="vehicle.needsRepair"
            @click="!vehicle.needsRepair && openEditVehicleCoverage(vehicle)"
          >
            {{ vehicle.needsRepair ? 'Edit Coverage (Needs repair)' : 'Edit Coverage' }}
          </BngButton>
        </template>
      </InsuranceVehTile>
    </div>

    <div class="closeButton">
      <BngButton class="close-button" accent="custom" @click="closePopup">
        Cancel
      </BngButton>
    </div>
  </div>
</template>

<script setup>
import { BngIcon, icons, BngButton, ACCENTS, BngUnit } from "@/common/components/base"
import { InsuranceIdentity, EditVehicleCoverage, InsuranceVehTile, EditPolicy } from "@/modules/career/components"
import { addPopup } from "@/services/popup"

const props = defineProps({
  insuranceData: {
    type: Object,
    required: true,
  },
  driverScoreData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["return"])

const closePopup = () => {
  emit("return", true)
}

const openEditVehicleCoverage = (vehicle) => {
  addPopup(EditVehicleCoverage, { insuranceData: props.insuranceData, vehicleData: vehicle })
}

const openEditPolicy = () => {
  addPopup(EditPolicy, { insuranceData: props.insuranceData, driverScoreData: props.driverScoreData })
  closePopup()
}

</script>

<style lang="scss">
@import '@/../../../ui/ui-vue/src/modules/career/components/insurance/insuranceStyle.css';
</style>

<style scoped lang="scss">
.insurance-identity {
  margin-bottom: 1.25rem;
  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  padding: 0rem 0rem 1.25rem 0rem;
  background-color: var(--bng-ter-blue-gray-900);
  width: 95%;
}

:deep(.insurance-identity) {
  padding: 1.25rem;
}

.section{
  border : 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.popup-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: linear-gradient(135deg, var(--bng-cool-gray-800) 0%, var(--blue-shade-100) 100%);
  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  padding: 1.25rem;
  color: white;
  width: 40rem;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 3rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid var(--bng-cool-gray-700);

  .header-text {
    opacity: 0.7;
  }
}

.top-info{
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.top-info-title{
  font-size: 1.3rem;
  font-weight: 600;
}

.top-info-policy-name{
  color: var(--orange-shade-10);
}

.top-info-description{
  font-size: 0.85rem;
  font-weight: 300;
  color: var(--bng-cool-gray-300);
  --units-icon-color: var(--bng-cool-gray-300);
}

.vehicle-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  max-height: 31.25rem;
}

.insured-vehicles-header{
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.625rem;
  justify-content: space-between;
  font-size: 1.4rem;
  font-weight: 600;
}

.vehicle-header-icon {
  margin-right: 0.625rem;
}

.total-value {
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.7;
}

.no-vehicles {
  text-align: center;
  padding: 2.5rem;
  opacity: 0.7;
  font-style: italic;
}

.close-button {
  --bng-button-custom-enabled: var(--bng-cool-gray-800);
  --bng-button-custom-hover: var(--bng-cool-gray-600);
  --bng-button-custom-active: var(--bng-cool-gray-600);
  width: 100%;
}

.closeButton {
  text-align: center;
  margin-top: 1rem;
}

.bigger-button {
  padding: 0.375rem 0.9375rem;
  --bng-button-border-radius: var(--bng-corners-2);
  --bng-button-custom-border-radius: var(--bng-corners-2);
}

.edit-coverage-button {
  --bng-button-custom-enabled: var(--orange-shade-20);
  --bng-button-custom-hover: var(--orange-shade-10);
  --bng-button-custom-active: var(--orange-shade-10);
  --bng-button-custom-disabled: var(--bng-cool-gray-700);
  --bng-button-custom-disabled-opacity: 1;
}

.policy-coverage-button {
  --bng-button-custom-enabled: var(--orange-shade-20);
  --bng-button-custom-hover: var(--orange-shade-10);
  --bng-button-custom-active: var(--orange-shade-10);
  --bng-button-border-radius: var(--bng-corners-2);
  --bng-button-custom-border-radius: var(--bng-corners-2);
  padding: 0.2rem 0.9375rem;
}
</style>