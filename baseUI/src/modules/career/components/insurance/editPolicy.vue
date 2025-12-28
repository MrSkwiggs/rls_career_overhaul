<template>
  <div class="popup-content">
    <div class="top-banner">
      <div class="top-info">
        <div class="top-info-title">
          Edit Policy: <span class="top-info-policy-name">{{ props.insuranceData.name }}</span>
        </div>
        <div class="top-info-description">
          These settings apply to all vehicles under this policy. Set deductibles per vehicle by clicking "Edit Vehicles"
        </div>
      </div>

      <BngButton
        class="edit-vehicles-button"
        accent="custom"
        @click="openVehicleList"
      >
        Edit Vehicles
      </BngButton>
    </div>

    <!-- <div class="perks section">
      Active policy perks :
      <InsurancePerks :insuranceData="props.insuranceData" :noDescription="true" />
    </div> -->

    <div class="customize-coverage section">
      <CoverageOption
        v-for="coverageOption in props.insuranceData.coverageOptionsData"
        :key="coverageOption.name"
        :coverageOption="coverageOption"
        :changedCoverageOptions="changedCoverageOptions"
        @choiceClick="onChoiceClick"
        @toggleChange="onToggleChange"
      />
    </div>

    <div class="premium-details section">
      <div class="premium-details-header">
        Premium Breakdown
      </div>
      <div class="premium-details-content">
        <div class="premium-details-item" v-for="(detail, key) in props.insuranceData.currentPremiumDetails.items" :key="key">
          <div class="premium-details-left">
            <div class="premium-details-label">
              {{ detail.name }}
            </div>
          </div>
          <div class="premium-details-right">
            <div v-if="computedNewPremiumDiffs[key] && computedNewPremiumDiffs[key].priceDiff !== 0" class="price-diff-container">
              <span class="arrow" :class="{ 'green-price': computedNewPremiumDiffs[key].priceDiff < 0, 'red-price': computedNewPremiumDiffs[key].priceDiff > 0 }">
                {{ computedNewPremiumDiffs[key].priceDiff > 0 ? '↑' : '↓' }}
              </span>
              <BngUnit
                class="price-diff"
                :class="{ 'green-price': computedNewPremiumDiffs[key].priceDiff < 0, 'red-price': computedNewPremiumDiffs[key].priceDiff > 0 }"
                :money="computedNewPremiumDiffs[key].priceDiff"
              />
            </div>
            <BngUnit :money="newPremiumDetails?.items?.[key]?.price || detail.price" />
          </div>
        </div>
        <div class="premium-details-total premium-details-item">
          <div class="premium-details-left">
            <div>
              Final Premium
            </div>
            <div class="driver-score-details-wrapper">
              <span class="driver-score-details">
                Base Premium : <BngUnit :money="props.insuranceData.currentPremiumDetails.totalPrice" />
                × Driver Score {{ props.driverScoreData.score }} @
              </span>
              <span class="driver-score" :class="driverScoreColorClass">
                 {{ Math.round(props.driverScoreData.tier.multiplier * 100) }}%
              </span>
            </div>
          </div>
          <div class="premium-details-right">
            <div v-if="computedTotalPriceDiff !== 0" class="price-diff-container">
              <span class="arrow" :class="{ 'green-price': computedTotalPriceDiff < 0, 'red-price': computedTotalPriceDiff > 0 }">
                {{ computedTotalPriceDiff > 0 ? '↑' : '↓' }}
              </span>
              <BngUnit
                class="price-diff"
                :class="{ 'green-price': computedTotalPriceDiff < 0, 'red-price': computedTotalPriceDiff > 0 }"
                :money="computedTotalPriceDiff"
              />
            </div>
            <BngUnit :money=" newPremiumDetails?.totalPriceWithDriverScore || props.insuranceData.currentPremiumDetails.totalPriceWithDriverScore" />
          </div>
        </div>
      </div>
    </div>
    <div class="buttons">
      <BngButton class="cancel-button bigger-button" accent="custom" @click="closePopup">
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
    </div>
  </div>
</template>

<script setup>
import { InsuranceIdentity, CoverageOption, VehicleInsuranceList } from "@/modules/career/components"
import { BngIcon, icons, BngUnit, BngButton } from "@/common/components/base"
import { ref, onMounted, computed } from "vue"
import { lua } from "@/bridge"
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

const changedCoverageOptions = ref({})
const newPremiumDetails = ref({})

const computedNewPremiumDiffs = computed(() => {
  if (!newPremiumDetails.value?.items) return {}

  const diffs = {}
  for (const key in newPremiumDetails.value.items) {
    const newPrice = newPremiumDetails.value.items[key]?.price || 0
    const oldPrice = props.insuranceData.currentPremiumDetails.items[key]?.price || 0
    diffs[key] = {
      priceDiff: newPrice - oldPrice,
      newPrice: newPrice,
      oldPrice: oldPrice,
    }
  }
  return diffs
})

const computedTotalPriceDiff = computed(() => {
  if (!newPremiumDetails.value?.totalPrice) return 0
  return newPremiumDetails.value.totalPrice - props.insuranceData.currentPremiumDetails.totalPrice
})

const driverScoreColorClass = computed(() => {
  const multiplier = props.driverScoreData?.tier?.multiplier
  if (!multiplier) return ''
  if (multiplier < 1) return 'driver-score-good'
  if (multiplier > 1) return 'driver-score-bad'
  return ''
})

const hasChangedCoverageOptions = computed(() => {
  if (!props.insuranceData?.coverageOptionsData) return false

  return props.insuranceData.coverageOptionsData.some(option => {
    return changedCoverageOptions.value[option.key] !== option.currentValueId
  })
})

// copy the current coverage options to the temporary state
onMounted(() => {
  if (props.insuranceData?.coverageOptionsData) {
    props.insuranceData.coverageOptionsData.forEach(option => {
      changedCoverageOptions.value[option.key] = option.currentValueId
    })
  }
})

const emit = defineEmits(["return"])

const closePopup = () => {
  emit("return", true)
}

const openVehicleList = () => {
  addPopup(VehicleInsuranceList, { insuranceData: props.insuranceData, driverScoreData: props.driverScoreData })
  closePopup()
}

const onSaveClick = () => {
  lua.career_modules_insurance_insurance.saveNewInsuranceCoverageOptions(props.insuranceData.id, changedCoverageOptions.value)
  emit("return", true)
}

const updatePremiumDetails = async () => {
  const result = await lua.career_modules_insurance_insurance.calculateInsurancePremium(
    props.insuranceData.id,
    changedCoverageOptions.value,
    null
  )
  newPremiumDetails.value = result
}

const onToggleChange = (coverageOption, newValue) => {
  // Find the choice that matches the new value
  const targetChoiceIndex = coverageOption.choices.findIndex(choice => choice.value === newValue)
  if (targetChoiceIndex !== -1) {
    changedCoverageOptions.value[coverageOption.key] = targetChoiceIndex + 1
    updatePremiumDetails()
  }
}

const onChoiceClick = (coverageOption, choice) => {
  changedCoverageOptions.value[coverageOption.key] = choice.id
  updatePremiumDetails()
}
</script>

<style scoped lang="scss">

.popup-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: linear-gradient(135deg, var(--bng-cool-gray-800) 0%, var(--blue-shade-100) 100%);
  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  padding: 1rem;
  color: white;
  width: 40rem;
  height: fit-content;
}

.premium-details-total{
  border-top: 2px solid var(--bng-cool-gray-500);
  padding-top: 0.8rem;
  font-weight: 600;
  font-size: 1.1rem;
  opacity: 1;
}

.driver-score-details{
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 300;
  opacity: 0.7;
}

.driver-score{
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.7;

  &.driver-score-good{
    color: var(--bng-add-green-300);
  }

  &.driver-score-bad{
    color: var(--bng-add-red-400);
  }
}

.section{
  border : 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  padding: 0.625rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.insurance-identity{
  border-radius: var(--bng-corners-3);
  border: 1px solid var(--bng-cool-gray-700);
  padding: 0rem 0rem 1.25rem 0rem;
  background-color: var(--bng-ter-blue-gray-900);

  :deep(.insurance-icon) {
    width: 50%;
  }
  width: 100%;
}

.premium-details-label{
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.7;
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
}

.driver-score-details-wrapper{
  display: flex;
  flex-direction: row;
  gap: 0.3125rem;
  align-items: center;
}

.switch-wrapper{
  width: 5rem;
}

.premium-details-header{
  font-size: 1.3rem;
  font-weight: 600;
}

.premium-details-item{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.premium-details-right{
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.625rem;
}

.price-diff-container{
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.3125rem;
}

.arrow{
  font-size: 1.2rem;
  font-weight: 600;

  &.green-price{
    color: var(--bng-add-green-500) !important;
  }

  &.red-price{
    color: var(--bng-add-red-400) !important;
  }
}

:deep(.green-price *) {
  color: rgba(119, 219, 137, 1) !important;
}

:deep(.red-price *) {
  color: var(--bng-add-red-400) !important;
}

.adjust-icon{
  font-size: 2.4rem;
  color: var(--orange-shade-20);
}

.top-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 5rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid var(--bng-cool-gray-700);
}

.customize-coverage{
  border: 1px solid var(--orange-shade-20);
}

.header{
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.title{
  font-size: 1.7rem;
  font-weight: 600;
}

.description{
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.7;
}

.buttons {
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
  justify-content: center;
  margin-top: 0.3rem;
}

.bigger-button {
  padding: 0.9375rem 1.5625rem;
  --bng-button-border-radius: var(--bng-corners-2);
  --bng-button-custom-border-radius: var(--bng-corners-2);
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

.cancel-button {
  --bng-button-custom-enabled: var(--bng-cool-gray-700);
  --bng-button-custom-hover: var(--bng-cool-gray-600);
  --bng-button-custom-active: var(--bng-cool-gray-600);
  --bng-button-custom-disabled: var(--bng-cool-gray-800);
}

.edit-vehicles-button {
  --bng-button-custom-enabled: var(--orange-shade-20);
  --bng-button-custom-hover: var(--orange-shade-10);
  --bng-button-custom-active: var(--orange-shade-10);
  --bng-button-border-radius: var(--bng-corners-2);
  --bng-button-custom-border-radius: var(--bng-corners-2);
  padding: 0.2rem 0.9375rem;
}

</style>