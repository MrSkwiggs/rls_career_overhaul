<template>
  <div class="content">
    <div class="top-banner">
      <div class="top-banner-left">
        <div class="title">
          Change Insurance
        </div>
        <div class="insurance-details">
          <span class="insurance-name">
            {{ props.insuranceData.name }}
          </span>
          <span class="name-slogan-seperator"></span>
          <span class="insurance-slogan">
            "{{ props.insuranceData.slogan }}"
          </span>
        </div>
        <div>
          <span class="small-grey-text">
            Covers {{ props.insuranceData.carsInsuredCount }} Vehicles
          </span>
          <span class="dot-seperator"></span>
          <span class="small-grey-text">
            Renews every {{ renewsEveryFormatted }}
          </span>
        </div>
      </div>
      <div class="top-banner-right">
        <div class="information-wrapper">
          <div class="small-grey-text">
            Driver Score
          </div>
          <div class="information-value">
            {{ props.driverScoreData.score }}:  {{ props.driverScoreData.tier.risk }}
          </div>
          <div class="driver-score-tier">
            {{ props.driverScoreData.tier.name }}
          </div>
          <div class="premium-effect">
            <span class="small-grey-text">
              Premium Effect :
            </span>
            <span class="premium-effect-value" :class="{ 'saving': premiumSavingPercent > 0, 'increase': premiumSavingPercent < 0 }">
              {{ premiumSavingPercent > 0 ? `${premiumSavingPercent.toFixed(0)}% saving` : premiumSavingPercent < 0 ? `${Math.abs(premiumSavingPercent).toFixed(0)}% increase` : 'No change' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="switching-details-wrapper">
      <div class="three-columns-grid">
        <div class="switching-column column-leaving">
          <div class="column-header">
            <span>←</span> Leaving {{ leavingInsuranceName }}
          </div>
          <div class="column-details">
            <div class="detail-item">
              <span class="detail-label">Vehicles:</span>
              <span class="detail-value">{{ leavingInfo.vehicleCount }} → {{ leavingInfo.newVehicleCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Discount Tier:</span>
              <span class="detail-value" :class="{ 'tier-change-down': tierDropped }">
                {{ leavingInfo.discountTierData.id }} → {{ leavingInfo.newDiscountTierData.id }}
              </span>
            </div>
            <div class="detail-item divider-above">
              <span class="detail-label">Coverage refund:</span>
              <span class="detail-value-positive">+<BngUnit :money="leavingInfo.coverageRefundPrice" /></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Cancellation fee (25%):</span>
              <span class="detail-value-negative">-<BngUnit :money="leavingInfo.earlyTerminationPenalty" /></span>
            </div>
            <div class="detail-item divider-above">
              <span class="detail-label-bold">Net Refund:</span>
              <span class="detail-value-positive-bold"><BngUnit :money="leavingInfo.netRefundPrice" /></span>
            </div>
            <div class="detail-note">
              {{ leavingRenewsInFormatted }} unused
            </div>
          </div>
        </div>

        <div class="switching-column column-vehicle">
          <div class="column-header column-header-center">Moving Vehicle</div>

          <div class="vehicle-display-box">
            <img :src="props.vehicleInfo?.thumbnail" alt="" class="vehicle-thumbnail" />
          </div>

          <div class="column-details">
            <div class="detail-item">
              <span class="detail-label">Vehicle:</span>
              <span class="detail-value-bold">{{ props.vehicleInfo.Name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Value:</span>
              <span class="detail-value-bold"><BngUnit :money="props.vehicleInfo.Value" /></span>
            </div>
            <div class="detail-item divider-above">
              <span class="detail-label">Joining mid-cycle:</span>
              <span class="detail-value-highlight">× {{ proRatedPercentage }}%</span>
            </div>
            <div class="detail-note">
              {{ renewsInFormatted }} remaining in cycle
            </div>
          </div>
        </div>

        <div class="switching-column column-joining">
          <div class="column-header">
            Joining {{ props.insuranceData.name }} <span>→</span>
          </div>
          <div class="column-details">
            <div class="detail-item">
              <span class="detail-label">Vehicles:</span>
              <span class="detail-value">{{ props.insuranceData.carsInsuredCount }} → {{ props.insuranceData.carsInsuredCount + 1 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Discount Tier:</span>
              <span class="detail-value" :class="{ 'tier-change-up': tierIncreased }">
                {{ currentTierId }} → {{ futureTierId }}
              </span>
            </div>
            <div class="detail-item divider-above">
              <span class="detail-label">Add vehicle cost:</span>
              <span class="detail-value-negative">+<BngUnit :money="props.insuranceData.addVehiclePrice" /></span>
            </div>
            <div class="detail-item divider-above">
              <span class="detail-label">Driver Score Impact:</span>
              <span class="detail-value-impact" :class="driverScoreImpactClass">
                {{ driverScoreImpactText }}
              </span>
            </div>
            <div class="detail-item divider-above">
              <span class="detail-label-bold">New Policy Premium:</span>
              <span class="detail-value-bold"><BngUnit :money="props.insuranceData.futurePremiumDetails.totalPriceWithDriverScore" /></span>
            </div>
            <div class="detail-note">
              {{ renewsInFormatted }} until renewal
            </div>
          </div>
        </div>
      </div>

      <div class="final-amount-box" :class="props.insuranceData.netSwitchingCost > 0 ? 'amount-credit' : 'amount-payment'">
        <div class="final-amount-content-row">
          <div>
            <div class="final-amount-label">{{ props.insuranceData.netSwitchingCost > 0 ? 'Credit Received Today' : 'Amount Due Today' }}</div>
            <div class="final-amount-breakdown">
              <BngUnit :money="leavingInfo.netRefundPrice" /> refund - <BngUnit :money="props.insuranceData.addVehiclePrice" /> new cost
            </div>
          </div>
          <div class="final-amount-total" :class="props.insuranceData.netSwitchingCost < 0 ? 'negative' : 'positive'">
            <BngUnit :money="Math.abs(props.insuranceData.netSwitchingCost)" />
          </div>
        </div>
      </div>
    </div>

    <div class="buttons">
      <BngButton class="gray-button bigger-button" accent="custom" @click="closePopup">
        Cancel
      </BngButton>
      <BngButton class="save-button bigger-button" accent="custom" @click="onSwitchClick">
        Switch for
        <div v-if="props.insuranceData.netSwitchingCost < 0">
          <BngUnit :money="Math.abs(props.insuranceData.netSwitchingCost)" />
        </div>
      </BngButton>
    </div>
  </div>
</template>

<style lang="scss">
@import '@/../../../ui/ui-vue/src/modules/career/components/insurance/insuranceStyle.css';
</style>

<script setup>
import { computed } from "vue"
import { BngButton, BngIcon, icons, BngUnit } from "@/common/components/base"
import { lua, useBridge } from "@/bridge"

const { units } = useBridge()

const props = defineProps({
  insuranceData: {
    type: Object,
    required: true
  },
  vehicleInfo: {
    type: Object,
    default: () => ({})
  },
  driverScoreData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(["return", "switch"])

const premiumSavingPercent = computed(() => {
  const multiplier = props.driverScoreData?.tier?.multiplier || 1.0
  return (1 - multiplier) * 100
})

const leavingInfo = computed(() => props.insuranceData.leavingInsuranceInfo || null)
const leavingInsuranceName = computed(() => leavingInfo.value?.currentInsuranceName || "Current Insurance")

const tierDropped = computed(() => {
  if (!leavingInfo.value) return false
  return leavingInfo.value.discountTierData?.id > leavingInfo.value.newDiscountTierData?.id
})

const tierIncreased = computed(() => {
  const current = props.insuranceData.groupDiscountData?.currentTierData?.id || 0
  const future = props.insuranceData.groupDiscountData?.futureTierData?.id || current
  return future > current
})

const currentTierId = computed(() => props.insuranceData.groupDiscountData?.currentTierData?.id || 0)
const futureTierId = computed(() => {
  return props.insuranceData.groupDiscountData?.futureTierData?.id ||
         props.insuranceData.groupDiscountData?.currentTierData?.id || 0
})

const proRatedPercentage = computed(() => {
  return Math.round(props.insuranceData.proRatedPercentage || 100)
})

const driverScoreImpactPercent = computed(() => {
  const multiplier = props.driverScoreData?.tier?.multiplier || 1.0
  return (1 - multiplier) * 100
})

const driverScoreImpactClass = computed(() => {
  if (driverScoreImpactPercent.value > 0) return 'saving'
  if (driverScoreImpactPercent.value < 0) return 'increase'
  return 'neutral'
})

const driverScoreImpactText = computed(() => {
  if (driverScoreImpactPercent.value > 0) {
    return `↓${driverScoreImpactPercent.value.toFixed(0)}%`
  }
  if (driverScoreImpactPercent.value < 0) {
    return `↑${Math.abs(driverScoreImpactPercent.value).toFixed(0)}%`
  }
  return '0%'
})

const renewsEveryFormatted = computed(() => {
  if (!props.insuranceData?.renewsEvery) return ''
  return units.buildString('length', props.insuranceData.renewsEvery * 1000, 0)
})

const renewsInFormatted = computed(() => {
  if (!props.insuranceData?.renewsIn) return ''
  return units.buildString('length', props.insuranceData.renewsIn * 1000, 0)
})

const leavingRenewsInFormatted = computed(() => {
  if (!leavingInfo.value?.renewsIn) return ''
  return units.buildString('length', leavingInfo.value.renewsIn * 1000, 0)
})

const closePopup = () => {
  emit("return", true)
}

const onSwitchClick = () => {
  lua.career_modules_insurance_insurance.changeInvVehInsurance(props.vehicleInfo.invVehId, props.insuranceData.id)
  emit("return", true)
}
</script>

<style scoped lang="scss">
.content{
  display: flex;
  flex-direction: column;
  gap: 2.1875rem;
  background: linear-gradient(135deg, var(--bng-cool-gray-800) 0%, var(--blue-shade-100) 100%);
  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  padding: 1.25rem;
  color: white;
}

.information-wrapper{
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  padding: 0.625rem;
}

.top-banner-right{
  display: flex;
  flex-direction: row;
  gap: 1.25rem;
}

.top-banner{
  display: flex;
  flex-direction: row;
  gap: 1.25rem;
  justify-content: space-between;
}

.dot-seperator{
  display: inline-block;
  width: 4px;
  height: 4px;
  background-color: var(--grey-200);
  border-radius: 50%;
  margin: 0 0.5rem;
  vertical-align: middle;
}

.top-banner-left{
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.title{
  font-size: 1.9rem;
  font-weight: 600;
}

:deep(.orange-price *) {
  color: var(--bng-orange-400) !important;
}

:deep(.detail-value-positive *) {
  color: var(--bng-ter-peach-200) !important;
}

:deep(.detail-value-positive-bold *) {
  color: var(--bng-add-green-400) !important;
}

:deep(.detail-value-negative *) {
  color: var(--bng-add-red-400) !important;
}

:deep(.detail-value-large.positive *) {
  color: var(--bng-add-green-300) !important;
}

:deep(.detail-value-large.negative *) {
  color: var(--bng-add-red-400) !important;
}

:deep(.final-amount-total.positive *) {
  color: var(--bng-add-green-300) !important;
}

:deep(.final-amount-total.negative *) {
  color: var(--bng-add-red-400) !important;
}

.insurance-details{
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
  align-items: center;
}

.insurance-name{
  font-size: 1.5rem;
  font-weight: 600;
}

.insurance-slogan{
  font-size: 1rem;
  font-weight: 300;
  font-style: italic;
  opacity: 0.8;
}

.name-slogan-seperator{
  display: inline-block;
  width: 1.2rem;
  height: 2px;
  background-color: var(--grey-200);
}

.buttons {
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
  justify-content: center;
  align-items: center;
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

.information-value{
  margin-bottom: -0.3125rem;
}

.small-grey-text{
  font-size: 0.9rem;
  font-weight: 200;
  opacity: 0.7;
}

.vehicle-value{
  font-size: 1rem;
  font-weight: 400;
  opacity: 1;
  color: var(--bng-orange-400);
}

.premium-effect-value {
  &.saving {
    color: var(--bng-add-green-400);
  }

  &.increase {
    color: var(--bng-add-red-400);
  }
}

.removal-warning-wrapper {
  background: var(--bng-add-red-900);
  border: 2px solid var(--bng-add-red-600);
  border-radius: var(--bng-corners-2);
  padding: 1rem;
}

.warning-header-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.warning-icon {
  color: var(--bng-add-red-400);
  font-size: 1.625rem;
  flex-shrink: 0;
}

.warning-title {
  color: var(--bng-add-red-400);
  font-weight: 600;
  font-size: 1.225rem;
  margin-bottom: 0.25rem;
}

.warning-subtitle {
  color: var(--bng-cool-gray-200);
  font-size: 0.975rem;
}

.cancellation-details-box {
  background: var(--bng-black-o6);
  border-radius: var(--bng-corners-2);
  padding: 0.75rem;
  border: 1px solid var(--bng-add-red-700);
}

.details-box-title {
  color: white;
  font-weight: 600;
  font-size: 0.975rem;
  margin-bottom: 0.5rem;
}

.details-rows {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  color: var(--bng-cool-gray-400);
}

.detail-label-bold {
  color: white;
  font-weight: 600;
}

.detail-value {
  color: white;
  font-weight: 500;
}

.detail-value-bold {
  color: white;
  font-weight: 600;
}

.detail-value-positive {
  color: var(--bng-ter-peach-200);
}

.detail-value-positive-bold {
  color: var(--bng-add-green-400);
  font-weight: 600;
}

.detail-value-negative {
  color: var(--bng-add-red-400);
}

.detail-value-large {
  font-weight: 600;
  font-size: 1.35rem;

  &.positive {
    color: var(--bng-add-green-300);
  }

  &.negative {
    color: var(--bng-add-red-400);
  }
}

.divider-above {
  border-top: 1px solid var(--bng-cool-gray-700);
  padding-top: 0.25rem;
  margin-top: 0.25rem;
}

.divider-above-heavy {
  border-top: 2px solid var(--bng-cool-gray-600);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

.no-insurance-notice {
  margin-top: 0.75rem;
  background: var(--bng-black-o6);
  border-radius: var(--bng-corners-2);
  padding: 0.75rem;
  border: 1px solid var(--bng-ter-yellow-600);
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.notice-icon {
  color: var(--bng-ter-yellow-300);
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.notice-text {
  color: var(--bng-ter-yellow-200);
  font-size: 0.85rem;
}

.switching-details-wrapper {
  background: var(--bng-black-o4);
  border-radius: var(--bng-corners-2);
  padding: 0.75rem;
  border: 1px solid var(--bng-cool-gray-700);
}

.three-columns-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.switching-column {
  border-radius: var(--bng-corners-2);
  padding: 0.75rem;
  border: 1px solid;
}

.column-leaving {
  background: var(--bng-add-red-900);
  border-color: var(--bng-add-red-700);
}

.column-vehicle {
  background: var(--bng-cool-gray-800);
  border-color: var(--bng-cool-gray-600);
}

.column-joining {
  background: var(--bng-add-green-900);
  border-color: var(--bng-add-green-700);
}

.column-header {
  font-weight: 600;
  font-size: 0.975rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.column-leaving .column-header {
  color: var(--bng-add-red-400);
}

.column-header-center {
  color: white;
  justify-content: center;
}

.column-joining .column-header {
  color: var(--bng-ter-peach-200);
}

.column-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.vehicle-display-box {
  position: relative;
  background: linear-gradient(to bottom right, var(--bng-cool-gray-700), var(--bng-cool-gray-900));
  height: 6.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--bng-corners-2);
  margin-bottom: 0.75rem;
  border: 1px solid var(--bng-cool-gray-600);
  overflow: hidden;
}

.vehicle-thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 50%;
}

.vehicle-display-icon {
  color: var(--bng-cool-gray-500);
  font-size: 2.75rem;
}

.detail-note {
  font-size: 0.85rem;
  color: var(--bng-cool-gray-500);
  margin-top: 0.375rem;
}

.detail-value-highlight {
  color: var(--bng-ter-peach-300);
  font-weight: 600;
}

.detail-value-impact {
  font-weight: 600;

  &.saving {
    color: var(--bng-add-green-400);
  }

  &.increase {
    color: var(--bng-add-red-400);
  }

  &.neutral {
    color: var(--bng-cool-gray-400);
  }
}

.tier-change-down {
  color: var(--bng-add-red-400);
}

.tier-change-up {
  color: var(--bng-add-green-300);
}

.neutral {
  color: var(--bng-cool-gray-400);
}

.final-amount-box {
  margin-top: 0.75rem;
  border-radius: var(--bng-corners-2);
  padding: 0.75rem;
  border: 2px solid;

  &.amount-credit {
    background: var(--bng-add-green-900);
    border-color: var(--bng-add-green-600);
  }

  &.amount-payment {
    background: var(--bng-add-red-900);
    border-color: var(--bng-add-red-600);
  }
}

.final-amount-content-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.final-amount-label {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

.final-amount-breakdown {
  font-size: 0.85rem;
  color: var(--bng-cool-gray-400);
  margin-top: 0.125rem;
}

.final-amount-total {
  font-weight: 600;
  font-size: 1.6rem;

  &.positive {
    color: var(--bng-add-green-300);
  }

  &.negative {
    color: var(--bng-add-red-400);
  }
}
</style>