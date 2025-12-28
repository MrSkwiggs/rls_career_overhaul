<template>
  <div class="popup-content">
    <div class="top-info">
      <div class="top-info-title">
        Select Deductible: <span class="top-info-veh-name">{{ props.vehicleData.name }}</span>
      </div>
      <div class="top-info-value-and-insurance">
        Value: <BngUnit :money="props.vehicleData.initialValue" /> • Policy: {{ props.insuranceData.name }}
      </div>
      <div class="top-info-description">
        Choose how much you'll pay out-of-pocket when repairing this vehicle. Lower deductibles cost more per km.
      </div>
    </div>

    <div class="section">
      <div>
        <div class="header title">
          Choose Your Deductible
        </div>
        <div class="under-title">
          You pay this amount per repair.
        </div>
      </div>
      <div>
        <CoverageOption class="coverage-option"
        v-for="coverageOption in props.vehicleData.insuranceData.coverageOptionsData.currentCoverageOptionsSanitized"
        :key="coverageOption.name"
        :coverageOption="coverageOption"
        :onlyShowMainText="true"
        :changedCoverageOptions="changedCoverageOptions"
        :dontShowName="true"
        @choiceClick="onChoiceClick"
        @toggleChange="onToggleChange"
      />
      </div>
    </div>

    <div class="section">
      <div class="title">
        Policy Impact
      </div>
      <div class="contribution-wrapper">
        <div class="contribution-item" :class="{ 'green': computedNewInsurancePremiumDiff < 0, 'red': computedNewInsurancePremiumDiff > 0 }">
          <div class="contribution-item-title">
            Insurance Premium
          </div>
          <div class="contribution-item-value">
            <BngUnit :money="props.insuranceData.currentPremiumDetails.totalPriceWithDriverScore" />
            <div v-if="computedNewInsurancePremiumDiff !== 0 && !isNaN(computedNewInsurancePremiumDiff)" class="price-diff-container">
              →
            </div>
            <BngUnit  v-if="computedNewInsurancePremiumDiff !== 0 && !isNaN(computedNewInsurancePremiumDiff)" :money="newInsurancePremiumDetails.totalPriceWithDriverScore" />
          </div>
        </div>
        <div class="contribution-item" :class="{ 'green': computedNewInsurancePremiumDiff < 0, 'red': computedNewInsurancePremiumDiff > 0 }">
          <div class="contribution-item-title">
            Vehicle Contribution
          </div>
          <div class="contribution-item-value">
            <BngUnit :money="props.vehicleData.insuranceData.currentPremiumPrice" />
            <div v-if="computedNewPremiumDiff !== 0 && !isNaN(computedNewPremiumDiff)" class="price-diff-container">
              →
            </div>
            <BngUnit v-if="computedNewPremiumDiff !== 0 && !isNaN(computedNewPremiumDiff)" :money="newPremiumPrice" />
          </div>
        </div>
      </div>
    </div>

    <div class="buttons">
      <BngButton class="gray-button bigger-button" accent="custom" @click="closePopup">
        Cancel
      </BngButton>
      <BngButton class="save-button bigger-button" accent="custom" @click="onSaveClick" :disabled="!props.insuranceData.canPayPaperworkFees || !hasChangedCoverageOptions">
        <template v-if="!props.insuranceData.canPayPaperworkFees">
          Insufficient funds
        </template>
        <template v-else>
          Apply for <BngUnit :money="props.insuranceData.paperworkFees" />
        </template>
      </BngButton>
      <BngButton class="gray-button bigger-button" accent="custom" @click="openSwitchProvider">
        Switch Provider
      </BngButton>
    </div>
  </div>
</template>

<script setup>
import { BngButton, BngUnit } from "@/common/components/base"
import { InsuranceIdentity, CoverageOption, ChooseInsuranceMain, InsuranceVehTile } from "@/modules/career/components"
import { ref, onMounted, computed } from "vue"
import { lua } from "@/bridge"
import { addPopup } from "@/services/popup"

const props = defineProps({
  insuranceData: {
    type: Object,
    required: true,
  },
  vehicleData: {
    type: Object,
    required: true,
  },
})
const newPremiumPrice = ref(0)
const newInsurancePremiumDetails = ref({
  totalPriceWithDriverScore: 0
})

const computedNewPremiumDiff = computed(() => {
  return newPremiumPrice.value - props.vehicleData.insuranceData.currentPremiumPrice
})

const computedNewInsurancePremiumDiff = computed(() => {
  return newInsurancePremiumDetails.value.totalPriceWithDriverScore - props.insuranceData.currentPremiumDetails.totalPriceWithDriverScore
})

const hasChangedCoverageOptions = computed(() => {
  if (!props.vehicleData?.insuranceData?.coverageOptionsData?.currentCoverageOptionsSanitized) return false

  return props.vehicleData.insuranceData.coverageOptionsData.currentCoverageOptionsSanitized.some(option => {
    return changedCoverageOptions.value[option.key] !== option.currentValueId
  })
})

const emit = defineEmits(["return"])

const closePopup = () => {
  emit("return", true)
}

const changedCoverageOptions = ref({})

const updatePremiumPrice = async () => {
  const result = await lua.career_modules_insurance_insurance.calculateVehiclePremium(
    props.vehicleData.id,
    null,
    changedCoverageOptions.value
  )
  newPremiumPrice.value = result.cost

  const newInsurancePremiumDetailsResult = await lua.career_modules_insurance_insurance.calculateInsurancePremium(
    props.insuranceData.id,
    null,
    {
      [props.vehicleData.id]: changedCoverageOptions.value
    }
  )
  newInsurancePremiumDetails.value = newInsurancePremiumDetailsResult
}

const onChoiceClick = (coverageOption, choice) => {
  changedCoverageOptions.value[coverageOption.key] = choice.id
  updatePremiumPrice()
}

const onToggleChange = (coverageOption, newValue) => {
  const targetChoiceIndex = coverageOption.choices.findIndex(choice => choice.value === newValue)
  if (targetChoiceIndex !== -1) {
    changedCoverageOptions.value[coverageOption.key] = targetChoiceIndex + 1
  }

  updatePremiumPrice()
}

const onSaveClick = () => {
  lua.career_modules_insurance_insurance.saveNewVehicleCoverageOptions(
    props.vehicleData.id,
    changedCoverageOptions.value
  )
  emit("return", true)
}

const openSwitchProvider = () => {
  addPopup(ChooseInsuranceMain, {
    menuMode: 'change',
    params: { vehicleId: props.vehicleData.id }
  })
}

// copy the current coverage options to the temporary state
onMounted(() => {
  props.vehicleData.insuranceData.coverageOptionsData.currentCoverageOptionsSanitized.forEach(option => {
    changedCoverageOptions.value[option.key] = option.currentValueId
  })
  updatePremiumPrice()
})
</script>

<style lang="scss">
@import "insuranceStyle.css";
</style>

<style scoped lang="scss">
.popup-content {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  background: linear-gradient(135deg, var(--bng-cool-gray-800) 0%, var(--blue-shade-100) 100%);
  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  padding: 1.2rem;
  color: white;
  width: 35rem;
  max-width: 90vw;
  max-height: 90vh;
}

.contribution-wrapper{
  display: flex;
  flex-direction: row;
  gap: 1.2rem;
}

.coverage-option{
  :deep(.choice) {
    padding-top: 1.15rem;
    padding-bottom: 1.15rem;
  }
}

.title{
  font-size: 1.6rem;
  font-weight: 600;
}

.top-info{
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid var(--bng-cool-gray-700);
}

.top-info-veh-name{
  color: var(--orange-shade-10);
}

.top-info-value-and-insurance{
  font-weight: 400;
  color: var(--bng-cool-gray-300);
  font-size: 1rem;
  --units-icon-color: var(--bng-cool-gray-300);
}

.top-info-description{
  font-size: 0.85rem;
  font-weight: 300;
  color: var(--bng-cool-gray-300);
}

.contribution-item-value{
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.6rem;
}

.section-b{
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}


.under-title{
  font-size: 1rem;
  font-weight: 400;
  opacity: 0.5;
  margin-top: 0.6rem;
}

.buttons {
  display: flex;
  flex-direction: row;
  gap: 0.6rem;
  justify-content: center;
  align-items: center;
  margin-top: 1.2rem;
}

.bigger-button {
  padding: 0.9rem 1.5rem;
  font-size: 1rem;
  --bng-button-border-radius: var(--bng-corners-2);
  --bng-button-custom-border-radius: var(--bng-corners-2);
}

.top-info-title{
  font-size: 1.3rem;
  font-weight: 600;
}

.contribution-item-title{
  margin-left: 0.35rem;
}

.save-button {
  --bng-button-custom-enabled: var(--orange-shade-20);
  --bng-button-custom-hover: var(--orange-shade-10);
  --bng-button-custom-active: var(--orange-shade-10);
  --bng-button-custom-disabled: var(--bng-cool-gray-800);
  --bng-button-custom-disabled-opacity: 0.7;

  :deep(.info-item) {
    padding: 0;
    margin: 0;
  }
}

.gray-button {
  --bng-button-custom-enabled: var(--bng-cool-gray-700);
  --bng-button-custom-hover: var(--bng-cool-gray-600);
  --bng-button-custom-active: var(--bng-cool-gray-600);
  --bng-button-custom-disabled: var(--bng-cool-gray-800);
}

.contribution-item{
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  padding: 0.6rem;

  &.green{
    border-color: var(--bng-add-green-500);
    background-color: var(--bng-add-green-900);
  }
  &.red{
    border-color: var(--bng-add-red-400);
    background-color: var(--bng-add-red-900);
  }
}

.top-buttons{
  display: flex;
  flex-direction: row;
  gap: 0.6rem;
  justify-content: center;
}

.section{
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.insurance-identity {
  border-radius: var(--bng-corners-3);
  border: 1px solid var(--bng-cool-gray-700);
  padding: 0rem 0rem 1.25rem 0rem;
  background-color: var(--bng-ter-blue-gray-900);
  width: 100%;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0.7;
}
</style>