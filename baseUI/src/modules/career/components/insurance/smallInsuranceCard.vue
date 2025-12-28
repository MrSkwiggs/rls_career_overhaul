<template>
  <div class="small-insurance-card" :class="{ 'no-vehicles': buttonsDisabled }" :style="{ 'border-top': `0.7rem solid ${props.insuranceData.color}`, 'background': `linear-gradient(180deg, ${props.insuranceData.color}80 0%, ${props.insuranceData.color}30 10%, ${props.insuranceData.color}10 35%, var(--bng-cool-gray-800) 50%, var(--blue-shade-100) 100%)` }">
    <InsuranceIdentity class="insurance-identity" :insuranceData="props.insuranceData" />

    <div class="premium-wrapper">
      <div class="breakdown-item">
        <span>Premium / {{ renewsEveryFormatted }}</span>
        <span class="breakdown-item-value">
          <div class="premium-value-wrapper">
            <BngUnit :money="props.insuranceData.currentPremiumDetails.totalPriceWithDriverScore" />
          </div>
        </span>
      </div>
      <div class="breakdown-item">
        <span>Renews in </span>
        <span class="breakdown-item-value">
          <template v-if="props.insuranceData.carsInsuredCount === 0">
            -
          </template>
          <template v-else>
            {{ renewsInFormatted }}
          </template>
        </span>
      </div>
      <div class="breakdown-item">
        <span>Vehicle Coverage</span>
        <span class="breakdown-item-value">
          <BngUnit :money="props.insuranceData.totalInsuranceVehsValue" />
        </span>
      </div>
      <div class="breakdown-item">
        <span>Vehicles</span>
        <span class="breakdown-item-value orange-text">
          {{ props.insuranceData.carsInsuredCount }}
        </span>
      </div>
    </div>
    <div class="perks">
      <InsurancePerks :insuranceData="props.insuranceData" :noDescription="true" />
    </div>

    <div class="group-discount-wrapper" :class="{'disabled': props.insuranceData.groupDiscountData.currentTierData.id === -1}">
      <div v-if="props.insuranceData.carsInsuredCount === 0" class="grey-text">
        No vehicles insured under this policy
      </div>
      <div v-else-if="props.insuranceData.carsInsuredCount === 1" class="grey-text">
        Add a second vehicle to unlock Tier 1 ({{ props.insuranceData.groupDiscountData.groupDiscountTiers[0].discount * 100 }}%) coverage savings.
      </div>
      <template v-else>
        <div class="group-discount">
          MULTI-VEHICLE DISCOUNT
        </div>
        <div class="group-discount-savings">
          Savings :<BngUnit :money="props.insuranceData.currentPremiumDetails.groupDiscountSavings" />
        </div>
        <div class="breakdown-item">
          <span class="grey-text" v-if="tierToDisplay.max">
            Your coverage falls in the {{ tierToDisplay.min / 1000 }}k - {{ tierToDisplay.max / 1000 }}k range
          </span>
          <span class="grey-text" v-else>
            Your coverage falls in the {{ tierToDisplay.min / 1000 }}k+ range
          </span>
        </div>
        <div>
          <InsuranceTiers :showTier="true" :tiers="props.insuranceData.groupDiscountData.groupDiscountTiers" />
        </div>
      </template>
    </div>

    <div class="buttons">
      <BngButton class="edit-policy-button bigger-button" accent="custom" @click="openEditPolicy" :disabled="buttonsDisabled">
        <BngIcon class="button-icon" :type="icons.adjust" :class="{'disabled': buttonsDisabled}"/>
        <span class="button-text" :class="{'disabled': buttonsDisabled}">Edit Policy</span>
      </BngButton>
      <BngButton class="see-vehicles-button bigger-button" accent="custom" @click="openVehicleList" :disabled="buttonsDisabled">
        <BngIcon class="button-icon" :type="icons.car" :class="{'disabled': buttonsDisabled}"/>
        <span class="button-text" :class="{'disabled': buttonsDisabled}">See Vehicles</span>
      </BngButton>
    </div>
  </div>
</template>

<script setup>
import { BngIcon, icons, BngUnit, BngButton } from "@/common/components/base"
import { computed } from "vue"
import { InsuranceTiers, InsurancePerks, InsuranceIdentity, VehicleInsuranceList, EditPolicy } from "@/modules/career/components"
import { addPopup } from "@/services/popup"
import { useBridge } from "@/bridge"

const { units } = useBridge()

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

const renewsEveryFormatted = computed(() => {
  return units.buildString('length', props.insuranceData.renewsEvery * 1000, 0)
})

const renewsInFormatted = computed(() => {
  return units.buildString('length', props.insuranceData.renewsIn * 1000, 0)
})

const buttonsDisabled = computed(() => {
  return props.insuranceData.carsInsuredCount === 0
})

const openVehicleList = () => {
  addPopup(VehicleInsuranceList, { insuranceData: props.insuranceData, driverScoreData: props.driverScoreData })
}

const openEditPolicy = () => {
  addPopup(EditPolicy, { insuranceData: props.insuranceData, driverScoreData: props.driverScoreData })
}

// if the player hasn't reached any discount tier, display the first tier anyway
const tierToDisplay = computed(() => {
  if (props.insuranceData.groupDiscountData.currentTierData.id > 0) {
    return props.insuranceData.groupDiscountData.currentTierData
  }else{
    return props.insuranceData.groupDiscountData.groupDiscountTiers[0]
  }
})
</script>

<style lang="scss">
@import '@/../../../ui/ui-vue/src/modules/career/components/insurance/insuranceStyle.css';
</style>

<style scoped lang="scss">
.small-insurance-card{
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  width: 30em;
  min-width: 20em;
  max-width: 100%;

  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  padding: 1.25rem;
  background: linear-gradient(135deg, var(--bng-cool-gray-800) 0%, var(--blue-shade-100) 100%);

  &.no-vehicles {
    opacity: 0.5;
    filter: grayscale(1);
  }
}

.buttons{
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.8rem;
  width: 100%;
  overflow: hidden;
}

.bigger-button{
  flex: 1;
  min-width: 0;
  padding: 0.6rem 1rem;
  font-size: 1rem;
  --bng-button-border-radius: var(--bng-corners-2);
  --bng-button-custom-border-radius: var(--bng-corners-2);
}

.breakdown-item-value{
  font-weight: 600;
  font-size: 1.2rem;
}

.orange-text{
  color: var(--orange-shade-20);
}

.edit-policy-button {
  --bng-button-custom-enabled: var(--orange-shade-20);
  --bng-button-custom-hover: var(--orange-shade-10);
  --bng-button-custom-active: var(--orange-shade-10);
  --bng-button-custom-disabled: var(--bng-cool-gray-800);
}

.insurance-identity {
  width: 100%;
}

.see-vehicles-button {
  --bng-button-custom-enabled: var(--bng-cool-gray-700);
  --bng-button-custom-hover: var(--bng-cool-gray-600);
  --bng-button-custom-active: var(--bng-cool-gray-600);
  --bng-button-custom-disabled: var(--bng-cool-gray-800);
}

.button-text{
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &.disabled {
    opacity: 0.5;
  }
}

.button-icon{
  font-size: 1.2em;
  margin-right: 0.5rem;
  flex-shrink: 0;

  &.disabled{
    opacity: 0.5;
  }
}

.group-discount{
  align-self: center;
}

.group-discount-savings{
  align-self: center;
  font-size: 1.15em;
  font-weight: 300;
  color: var(--green-300);
  margin-top: -0.2rem;

  :deep(.info-item) {
    padding: 0;
    margin: 0;
  }
}

:deep(.group-discount-savings *) {
  color: var(--green-300) !important;
}

.highlighted-blue-text{
  font-weight: 700;
  font-size: 1.3em;
  color: var(--blue-shade-10);
}

.group-discount-wrapper{
  background-color: var(--blue-shade-100);
  padding: 0.8rem 1.25rem;
  border-radius: var(--bng-corners-3);
  min-height: 12rem;

  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  &.disabled{
    opacity: 0.3;
  }
}

.grey-text{
  text-align: center;
  opacity: 0.8;
  font-weight: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.perk{
  align-items: center;
  display: flex;
  flex-direction: row;
}

:deep(.insurance-identity) {
  border-radius: var(--bng-corners-3);
  border: 1px solid var(--bng-cool-gray-700);
  padding: 0rem 0rem 1.25rem 0rem;
  background-color: var(--blue-shade-100);
}

.perks{
  border-top: 1px solid var(--bng-cool-gray-700);
  padding-top: 1.25rem;
  margin-top: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.premium-wrapper{
  background-color: var(--blue-shade-100);
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  border-radius: var(--bng-corners-3);
  gap: 0.7rem;
}

.premium-value-wrapper{
  font-size: 1.4em;
}

:deep(.premium-value-wrapper *) {
  font-weight: 700 !important;
}

.breakdown-item{
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
  justify-content: space-between;
  align-items: center;
}

.perk-text{
  margin-left: 0.625rem;
  font-size: 0.8em;
  align-items: center;
  opacity: 0.8;
}
</style>