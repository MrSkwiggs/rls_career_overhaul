<template>
  <ComputerWrapper :path="['Repair']" :title="`Repair ${repairStore.vehicleData.name}`" back @back="close">
    <BngCard v-if="repairStore.vehicleData.name" class="repairMain blue-background">
      <div class="content blue-background">
        <div class="title">Vehicle Repair</div>
        <div class="vehicle-info">
          <InsuranceVehTile class="vehicle-tile" :vehicle="repairStore.vehicleData">
            <template #rightContent>
              <div class="right-info-wrapper">
                <div class="damage-estimate-wrapper">
                  <span class="damage-estimate-text">
                    Damage Estimate:
                  </span>
                  <span class="damage-estimate-value">
                    <BngUnit class="red-price" :money="repairStore.vehicleData.damageCost" />
                  </span>
                </div>
                <div v-if="!repairStore.vehicleData.isInsured">
                  <span class="not-insured-text">
                    Not Insured!
                  </span>
                </div>
              </div>
            </template>
          </InsuranceVehTile>
        </div>

        <div>
          <div class="repair-options-title">Repair Options</div>
          <div class="repair-options">
            <div v-for="(repairOption, key) in repairStore.repairOptions" :key="key"
              class="repair-option"
              :class="{ selected: selectedRepairOptionKey === key }"
              @click="onRepairOptionClick(key)"
            >
              <div class="icon-wrapper">
                <BngIcon :type="repairOption.useInsurance ? icons.shieldCheckmark : icons.wrench" />
              </div>
              <div>
                <div class="option-text-wrapper" v-if="repairOption.useInsurance">
                  <div class="bigger-text">
                    Insurance Claim
                  </div>
                  <div class="smaller-text">
                    {{ repairOption.insuranceName }}
                  </div>
                  <div class="bigger-text" style="margin-top: -5px;">
                    Deductible : <BngUnit class="unit-no-padding" :money="repairStore.repairOptions.insuranceRepairData.deductible" />
                  </div>
                </div>
                <div class="option-text-wrapper" v-else>
                  <div class="bigger-text">
                    Private Repair
                  </div>
                  <div class="smaller-text">
                    No Policy Impact
                  </div>
                  <div class="bigger-text">
                    Full Damage Cost
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentRepairOption">
          <CoverageOption
          :coverageOption="currentRepairOption.repairTimeOptions"
          :key="`repairTime-${selectedRepairOptionKey}`"
          v-model="selectedRepairTimeOptionIndex"
          :simpleSelect="true"
          :showPerkMode="'none'"
          />
        </div>

        <div class="details-wrapper">
          <div class="detail-wrapper">
            <h3>Insurance Impact</h3>
            <div class="item">
              <span>
                <div class="item-label">Driver Score Change</div>
                <div class="accident-forgivenesses-text" v-if="currentRepairOption.useInsurance"> {{ accidentForgivenessesText }}</div>
              </span>
              <span class="item-value" :class="{ 'red-text': currentRepairOption.useInsurance && repairStore.futureDriverScore < repairStore.driverScore }">
                <template v-if="currentRepairOption.useInsurance">
                  {{ repairStore.futureDriverScore === repairStore.driverScore ? "No Change (" + repairStore.driverScore + ")" : repairStore.driverScore + " → " + repairStore.futureDriverScore }}
                </template>
                <template v-else>
                  No Change ({{ repairStore.driverScore }})
                </template>
              </span>
            </div>
            <div v-if="repairStore.repairOptions.insuranceRepairData" class="item">
              <span class="item-label">Premium Impact</span>
              <span class="item-value">
                <template v-if="currentRepairOption.useInsurance && repairStore.repairOptions.insuranceRepairData.futurePremium !== repairStore.repairOptions.insuranceRepairData.currentPremium">
                  <BngUnit :money="repairStore.repairOptions.insuranceRepairData.currentPremium" /> → <BngUnit class="red-price" :money="repairStore.repairOptions.insuranceRepairData.futurePremium" />
                </template>
                <template v-else>
                  No Change (<BngUnit :money="repairStore.repairOptions.insuranceRepairData.currentPremium" />)
                </template>
              </span>
            </div>
            <div v-if="currentRepairOption.useInsurance" class="renews-in-wrapper">
              <span class="renews-in-name">{{ currentRepairOption.insuranceName }} renews in </span>
              <span class="renews-in-value">{{ renewsInFormatted }}</span>
            </div>
          </div>
          <div class="detail-wrapper">
            <h3>Vehicle Repair</h3>
            <div class="item">
              <span class="item-label">Repair Option</span>
              <span class="item-value">{{ currentRepairOption.useInsurance ? "Insurance (" + currentRepairOption.insuranceName + ")" : "Private" }}</span>
            </div>
            <div class="item">
              <span class="item-label">Repair Time</span>
              <span class="item-value">{{ selectedRepairTimeOption?.choiceText }} (<BngUnit :money="selectedRepairTimeOption?.premiumInfluence" />)</span>
            </div>
            <div v-if="currentRepairOption.useInsurance" class="item">
              <span class="item-label">Deductible</span>
              <span class="item-value"><BngUnit :money="repairStore.repairOptions.insuranceRepairData.deductible" /></span>
            </div>
            <div v-else class="item">
              <span class="item-label">Vehicle Damage</span>
              <span class="item-value"><BngUnit :money="repairStore.vehicleData.damageCost" /></span>
            </div>
            <div class="item total-cost">
              <span>Total Cost</span>
              <span class="item-value"><BngUnit :money="selectedRepairTimeOption?.totalPrice" /></span>
            </div>
          </div>
        </div>

        <BngButton class="bigger-button confirm-repair-button" accent="custom" :disabled="!selectedRepairTimeOption?.canPay || !repairStore.vehicleData.needsRepair" @click="startRepair(selectedRepairOptionKey, selectedRepairTimeOptionIndex)">
          <div v-if="!repairStore.vehicleData.needsRepair">
            Vehicle doesn't need repair
          </div>
          <div v-else-if="!selectedRepairTimeOption?.canPay">
            Insufficient funds
            <div class="confirm-repair-money-wrapper">
              <BngUnit :money="selectedRepairTimeOption?.totalPrice" />
            </div>
          </div>
          <div v-else>
            Confirm Repair
            <div class="confirm-repair-money-wrapper">
              <BngUnit :money="selectedRepairTimeOption?.totalPrice" />
            </div>
          </div>
        </BngButton>
      </div>
    </BngCard>
  </ComputerWrapper>
</template>

<script setup>
import { lua, useBridge } from "@/bridge"
import { BngButton, BngCard, BngIcon, icons } from "@/common/components/base"
import ComputerWrapper from "./ComputerWrapper.vue"
import { useRepairStore } from "../stores/repairStore"
import { onMounted, onUnmounted, ref, computed, watch } from "vue"
import { BngUnit } from "@/common/components/base"
import { useComputerStore } from "../stores/computerStore"
import { vBngOnUiNav, vBngClick,vBngFocusIf } from "@/common/directives"
import { InsuranceIdentity, CoverageOption, InsuranceVehTile } from "@/modules/career/components"

const { units } = useBridge()

const computerStore = useComputerStore()
const repairStore = useRepairStore()

const selectedRepairOptionKey = ref(null)
const selectedRepairTimeOptionIndex = ref(1)

const currentRepairOption = computed(() => {
  if (!selectedRepairOptionKey.value || !repairStore.repairOptions) return null
  return repairStore.repairOptions[selectedRepairOptionKey.value]
})

const accidentForgivenessesText = computed(() => {
  if (!repairStore.repairOptions.insuranceRepairData.accidentForgivenesses > 0) {
    return "(No Accident Forgivenesses left)"
  }else{
    return "(" + repairStore.repairOptions.insuranceRepairData.accidentForgivenesses + " Accident Forgivenesses left)"
  }
})

const selectedRepairTimeOption = computed(() => {
  if (!currentRepairOption.value?.repairTimeOptions?.choices) return null
  return currentRepairOption.value.repairTimeOptions.choices.find(choice => choice.id === selectedRepairTimeOptionIndex.value)
})

const renewsInFormatted = computed(() => {
  if (!currentRepairOption.value?.renewsIn) return ''
  return units.buildString('length', currentRepairOption.value.renewsIn * 1000, 0)
})

// watch for repairOptions to be loaded and set the first insurance option as default
watch(() => repairStore.repairOptions, (newOptions) => {
  if (newOptions && Object.keys(newOptions).length > 0 && !selectedRepairOptionKey.value) {
    // find the first option that uses insurance
    const insuranceKey = Object.keys(newOptions).find(key => newOptions[key].useInsurance)
    // fall back to first option if no insurance option is found
    const selectedKey = insuranceKey || Object.keys(newOptions)[0]
    selectedRepairOptionKey.value = selectedKey
    // set the initial repair time option index from the data
    if (newOptions[selectedKey]?.repairTimeOptions?.currentValueId) {
      selectedRepairTimeOptionIndex.value = newOptions[selectedKey].repairTimeOptions.currentValueId
    }
  }
}, { immediate: true })

// watch for repair option changes and reset the time option index
watch(() => selectedRepairOptionKey.value, (newKey) => {
  if (newKey && repairStore.repairOptions[newKey]?.repairTimeOptions?.currentValueId) {
    selectedRepairTimeOptionIndex.value = repairStore.repairOptions[newKey].repairTimeOptions.currentValueId
  } else {
    selectedRepairTimeOptionIndex.value = 1
  }
})

const onRepairOptionClick = (key) => {
  selectedRepairOptionKey.value = key
}

const close = () => {
  lua.career_modules_insurance_repairScreen.closeMenu()
}

const startRepair = (repairOptionKey, repairTimeOptionIndex) => {
  if (!selectedRepairTimeOption.value) return
  lua.career_modules_insurance_repairScreen.startRepairInGarage(repairStore.vehicleData.invVehId, {
    repairTime: selectedRepairTimeOption.value.value,
    isInsuranceRepair: currentRepairOption.value.useInsurance,
    cost: {
      repairTimeCost: selectedRepairTimeOption.value.premiumInfluence,
      deductible: currentRepairOption.value.useInsurance
        ? repairStore.repairOptions.insuranceRepairData.deductible
        : repairStore.vehicleData.damageCost
    }
  })
}

onMounted(() => {
  repairStore.getRepairData()
})

onUnmounted(() => {
  repairStore.resetStore()
})


</script>

<style lang="scss">
@import '@/../../../ui/ui-vue/src/modules/career/components/insurance/insuranceStyle.css';
</style>

<style scoped lang="scss">
.content {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  overflow: auto;
  width: 100%;
}

.right-info-wrapper{
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.damage-estimate-wrapper{
  display: flex;
  flex-direction: row;
  align-items: center;
  :deep(.info-item){
    margin: 0 !important;
    padding: 0 !important;
  }
}


.vehicle-tile{
  width: 100%;
}
.blue-background{
  background-color: var(--blue-shade-100);
}

.item{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.total-cost{
  font-size: 1.2rem;
  font-weight: 600;
  border-top: 1px solid var(--bng-cool-gray-700);
}

.title{
  font-size: 2rem;
  font-weight: 600;
  align-self: center;
  text-align: center;
  width: 100%;
}

.renews-in-wrapper{
  margin-top: 0.625rem;
  text-align: right;
}

.not-insured-text{
  font-size: 1.2rem;
  font-weight: 600;
  opacity: 1;
  color: var(--bng-add-red-500);
}

.renews-in-name{
  font-size: 0.9rem;
  font-weight: 400;
  opacity: 0.7;
}

.renews-in-value{
  font-size: 1rem;
  font-weight: 800;
  color: var(--bng-add-blue-300);
}

.accident-forgivenesses-text{
  font-size: 0.8rem;
  font-weight: 300;
  opacity: 0.7;
}

.repair-options-title{
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.7rem;
}

.red-text{
  color: var(--bng-add-red-500);
}

.confirm-repair-money-wrapper{
  font-size: 1.2rem;
  font-weight: 600;
}

.damage-estimate-value{
  font-size: 1.4rem;
}

.item-value{
  font-size: 1.12rem;
  font-weight: 600;
}

.vehicle-name{
  font-size: 1.5rem;
  font-weight: 600;
}

.damage-estimate-text{
  font-size: 1rem;
  font-weight: 400;
  opacity: 0.7;
}

.bigger-text{
  font-size: 1.2rem;
  font-weight: 600;
}

.smaller-text{
  font-size: 0.9rem;
  font-weight: 400;
  opacity: 0.7;
}

.item-label{
  font-weight: 400;
  opacity: 0.7;
}

.unit-no-padding :deep(*) {
  padding: 0 !important;
  margin: 0 !important;
}

:deep(.red-price *) {
  color: var(--bng-add-red-500) !important;
  padding: 0 !important;
  font-weight: 600;
}

.icon-wrapper{
  font-size: 2.5rem;
}

.details-wrapper{
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
  margin-top: 0.7rem;
}

.detail-wrapper{
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  flex: 1;

  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  background-color: var(--blue-shade-100);
  padding: 0.625rem;
}

.vehicle-info {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.repair-option{
  gap: 0.625rem;
  border-radius: var(--bng-corners-3);
  padding: 0.625rem;


  display: flex;
  flex-direction: row;
  align-items: center;
  border: 2px solid var(--bng-cool-gray-700);
  background-color: var(--bng-cool-gray-800);
  cursor: pointer;
  min-width: 20rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--orange-shade-50);
    border: 2px solid var(--orange-shade-10);
  }

  &.selected {
    background-color: var(--orange-shade-50);
    border: 2px solid var(--orange-shade-10);
  }
}

.option-text-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.repair-options{
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
}

.repairOptions {
  height: 100%;
}

.priceOption {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.9375rem 0;
}

/* FIXME: There is a CSS conflict with AngularJS CSS with this class name */
.career-status-value {
  display: flex;
  justify-content: left;
  flex-flow: row nowrap;
  align-items: baseline;
  & > :first-child {
    margin-right: 0.125rem;
  }
}

.veh-part-caption {
  display: flex;
  flex-flow: row nowrap;
  justify-content: stretch;
  align-items: center;
  overflow: hidden;
  width: 100%;
  height: 5rem;
  $preview: 10rem; // thumbnail width
  .veh-preview {
    width: $preview;
    align-self: stretch;
    background-size: auto 110%;
    background-position: 50% 50%;
    background-repeat: no-repeat;
  }
}

.repairMain {
  width: 60%;
  height: 100%;
  padding: 0.625rem;
  color: white;
  overflow-y: hidden;
  & :deep(.card-cnt) {
    display: flex;
    flex-flow: row nowrap;
  }
}

.repairOption {
  padding: 0.0625rem 1.25rem 0 1.25rem;
  background-color: rgba(83, 83, 83, 0.465);
  border-radius: var(--bng-corners-2);
  margin: 1.5625rem 0.625rem 1.5625rem 0;
}

.bigger-button{
  padding: 0.9375rem 1.5625rem;
  --bng-button-border-radius: var(--bng-corners-2);
  --bng-button-custom-border-radius: var(--bng-corners-2);
}

.confirm-repair-button {
  --bng-button-custom-enabled: var(--orange-shade-20);
  --bng-button-custom-hover: var(--orange-shade-10);
  --bng-button-custom-active: var(--orange-shade-10);
  --bng-button-custom-disabled: var(--bng-cool-gray-800);
  --bng-button-max-width: none;
  display: flex;
  width: 98%;
  align-self: center;

  &:disabled > * {
    opacity: 0.7;
  }
}
</style>
