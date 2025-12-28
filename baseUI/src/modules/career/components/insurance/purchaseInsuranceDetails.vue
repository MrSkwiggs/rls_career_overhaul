<template>
  <div class="insurance-details-wrapper" bng-ui-scope="insuranceDetailsPopup">
    <div class="card-content">
      <div class="header">
        <div class="header-left">
          <div class="policy-details">
            Policy details
          </div>
          <div class="insurance-identity">
            <span class="insurance-name">{{ props.insuranceData.name }}</span>
            <span class="name-slogan-seperator"></span>
            <span class="insurance-slogan">{{ props.insuranceData.slogan }}</span>
          </div>
          <div class="covers-renew-info">
            <span>Covers {{ props.insuranceData.carsInsuredCount }} Vehicles</span>
            <span class="covers-renew-seperator"></span>
            <span>Renews every {{ renewsEveryFormatted }}</span>
          </div>
        </div>
        <div class="header-right">
          <div class="action-type">Adding vehicle</div>
          <div class="vehicle-name">{{ props.vehicleInfo.Name }}</div>
          <div class="vehicle-value blue-price">Value : <BngUnit :money="props.vehicleInfo.Value" /></div>
        </div>
      </div>


      <div v-if="props.insuranceData.groupDiscountData.willHaveGroupDiscountForTheFirstTime || props.insuranceData.groupDiscountData.willBumpTheirDiscount || props.insuranceData.groupDiscountData.currentTierData.id > 0" class="group-discount-wrapper">
        <div class="group-discount-header">
          <div class="group-discount-icon-wrapper">
            <BngIcon :type="icons.checkmark" />
          </div>
          <div class="group-discount-text-wrapper">
            <div class="group-discount-main-text">
              {{ groupDiscountText }}
            </div>
            <div class="group-discount-secondary-text">
              Insurance discounts are based on the total value of your fleet.
            </div>
          </div>
        </div>

        <div class="tiers-wrapper">
          <div class="textual-tiers-wrapper">
            <div class="tier" v-for="tier in props.insuranceData.groupDiscountData.groupDiscountTiers" :key="tier.id">
              <div class="tier-number">
                Tier {{ tier.id }}
              </div>
              <div class="money-bracket">
                <span>{{ tier.min / 1000 }}k</span>
                <span v-if="tier.max">-{{ tier.max / 1000 }}k</span>
                <span v-else>+</span>
              </div>
            </div>
          </div>
          <InsuranceTiers :tiers="props.insuranceData.groupDiscountData.groupDiscountTiers" />
        </div>

        <div class="current-after-discount-price">
          <div class="tier-discount-price">
            <div class="section-label deactivated">
              Current Tier
            </div>
            <div class="policy-value">
              Policy Value :
              <BngUnit :money="props.insuranceData.totalInsuranceVehsValue" />
            </div>
            <div class="policy-tier">
              Tier {{ Math.max(props.insuranceData.groupDiscountData.currentTierData.id, 0) }} - {{ props.insuranceData.groupDiscountData.currentTierData.discount * 100 }}% off
            </div>
          </div>
          <div class="tier-discount-price isFutureTier">
            <div class="section-label">
              After Purchase
            </div>
            <div class="policy-value">
              Policy Value :
              <BngUnit :money="props.insuranceData.totalInsuranceVehsValue + props.insuranceData.vehicleValue" />
            </div>
            <div class="policy-tier isFuture">
              Tier {{ props.insuranceData.groupDiscountData.futureTierData.id }} - {{ props.insuranceData.groupDiscountData.futureTierData.discount * 100 }}% off
            </div>
          </div>
        </div>
      </div>

      <div class="price-breakdown-wrapper">
        <div class="prices-breakdown-header">
          <div class="breakdown-item">
            <div class="section-label">
              Vehicle
            </div>
            <div class="breakdown-details">
              <div class="breakdown-item-value">
                <span class="breakdown-label">
                  Coverage Cost
                </span>
                <span class="breakdown-value">
                  <BngUnit :money="props.insuranceData.nonProRatedVehiclePremium" />
                </span>
              </div>
              <div class="breakdown-item-value orange">
                <span class="breakdown-label">
                  Pro-rated Renewal
                </span>
                <span class="breakdown-value">
                  × {{ props.insuranceData.proRatedPercentage }}%
                </span>
              </div>
              <div v-if="props.insuranceData.groupDiscountData?.currentTierData.id > 0" class="breakdown-item-value orange">
                <span class="breakdown-label">
                    Tier {{ props.insuranceData.groupDiscountData?.currentTierData.id }} discount
                </span>
                <span class="breakdown-value">
                  - {{ props.insuranceData.groupDiscountData?.currentTierData.discount * 100 }}%
                </span>
              </div>
              <div class="breakdown-item-value result">
                <span class="breakdown-label">
                  Policy Add-On Cost
                </span>
                <span class="breakdown-value result">
                  <BngUnit :money="props.insuranceData.proRatedVehiclePremium" />
                </span>
              </div>
            </div>
          </div>
          <div class="breakdown-item">
            <div class="section-label">
              New Premium
            </div>
            <div class="breakdown-details">
              <div v-if="props.insuranceData.futurePremiumDetails.items.vehsCoverage" class="breakdown-item-value">
                <div class="breakdown-label">
                  Vehicles Coverage
                </div>
                <div class="breakdown-value strikethrough-container" :class="{ 'strikethrough-grey': props.insuranceData.futurePremiumDetails.groupDiscountSavings > 0 }">
                  <BngUnit :money="props.insuranceData.futurePremiumDetails.items.vehsCoverage.priceWithoutGroupDiscount" />
                  <div v-if="props.insuranceData.futurePremiumDetails.groupDiscountSavings > 0" class="strikethrough-line"></div>
                </div>
              </div>
              <div v-if="props.insuranceData.futurePremiumDetails.items.vehsCoverage && props.insuranceData.futurePremiumDetails.groupDiscountSavings > 0" class="breakdown-item-value">
                <div class="breakdown-label">
                  {{ props.insuranceData.futurePremiumDetails.items.vehsCoverage.name }}
                  <span>: Tier {{ props.insuranceData.groupDiscountData.currentTierData.id }} <span class="tier-discount-badge">({{ props.insuranceData.groupDiscountData.currentTierData.discount * 100 }}% off)</span></span>
                </div>
                <div class="breakdown-value green-price">
                  <BngUnit :money="props.insuranceData.futurePremiumDetails.items.vehsCoverage.price" />
                </div>
              </div>
              <template v-for="(item, key) in props.insuranceData.futurePremiumDetails.items" :key="key">
                <div v-if="key !== 'vehsCoverage'" class="breakdown-item-value">
                  <div class="breakdown-label">
                    {{ item.name }}
                  </div>
                  <div class="breakdown-value">
                    <BngUnit :money="item.price" />
                  </div>
                </div>
              </template>
              <div class="breakdown-item-value subtotal">
                <div class="breakdown-label">
                  Subtotal
                </div>
                <div class="breakdown-value">
                  <BngUnit :money="props.insuranceData.futurePremiumDetails.totalPrice" />
                </div>
              </div>
              <div class="breakdown-item-value">
                <div class="breakdown-label">
                  Driver Score Adjustment
                </div>
                <div class="breakdown-value" :class="driverScoreClass">
                  {{ driverScoreAdjustmentText }}
                </div>
              </div>
              <div class="breakdown-item-value result">
                <div class="breakdown-label">
                  Total Premium
                </div>
                <div class="breakdown-value">
                  <BngUnit :money="props.insuranceData.futurePremiumDetails.totalPriceWithDriverScore" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="sum-to-pay">
          <span>Amount due today</span>
          <span class="sum-to-pay-value">
            <BngUnit class="green-price" :money="props.insuranceData.addVehiclePrice"/>
          </span>
        </div>
      </div>

      <div class="closeButton">
        <BngButton :accent="ACCENTS.primary" @click="closePopup">
          Close
        </BngButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { BngCard, BngUnit, BngButton, ACCENTS, BngIcon, icons } from "@/common/components/base"
import { useUINavScope } from "@/services/uiNav"
import { InsuranceTiers } from "@/modules/career/components"
import { computed } from "vue"
import { useBridge } from "@/bridge"

const { units } = useBridge()

useUINavScope("insuranceDetailsPopup")


const props = defineProps({
  insuranceData: Object,
  vehicleInfo: Object,
  driverScoreData: Object,
})

const emit = defineEmits(["return"])

const closePopup = () => {
  emit("return", true)
}

const driverScoreAdjustmentText = computed(() => {
  const multiplier = props.driverScoreData.tier.multiplier
  if (multiplier < 1.0) {
    return `↓${((1 - multiplier) * 100).toFixed(0)}%`
  } else if (multiplier > 1.0) {
    return `↑${((multiplier - 1) * 100).toFixed(0)}%`
  }
  return "0%"
})

const driverScoreClass = computed(() => {
  const multiplier = props.driverScoreData.tier.multiplier
  if (multiplier < 1.0) {
    return "driver-score-discount"
  } else if (multiplier > 1.0) {
    return "driver-score-penalty"
  }
  return ""
})

const groupDiscountText = computed(() => {
  if (props.insuranceData.groupDiscountData){
    if (props.insuranceData.groupDiscountData.willHaveGroupDiscountForTheFirstTime) {
      return "Multi-vehicle discount available"
    }else if (props.insuranceData.groupDiscountData.willBumpTheirDiscount){
      return "Bigger discount available"
    }else if (props.insuranceData.groupDiscountData.currentTierData && props.insuranceData.groupDiscountData.currentTierData.id > 0){
      return "Multi-vehicle discount active"
    }
  }
  return null
})

const renewsEveryFormatted = computed(() => {
  if (!props.insuranceData?.renewsEvery) return ''
  return units.buildString('length', props.insuranceData.renewsEvery * 1000, 0)
})
</script>

<script>
import { popupPosition, popupContainer } from "@/services/popup"
export default {
  wrapper: {
    fade: true,
    blur: true,
    style: popupContainer.default,
  },
  position: [popupPosition.center, popupPosition.center],
}
</script>

<style lang="scss">
@import 'insuranceStyle.css';
</style>

<style scoped lang="scss">
.insurance-details-wrapper {
  color: white;
  width: 60rem;
  height: 95vh;
}

:deep(.blue-price *) {
  color: var(--blue-200) !important;
}

:deep(.bng-card-wrapper) {
  --bg-opacity: 1 !important;
}

.header {
  display:flex;
  flex-direction: row;
  justify-content: space-between;
}

.driver-score-discount {
  color: var(--bng-add-green-400);
  font-weight: 700;
}

.driver-score-penalty {
  color: var(--bng-add-red-400);
  font-weight: 700;
}

.breakdown-details{
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 100%;
}

.card-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: var(--blue-500);
  border-radius: var(--bng-corners-3);
}

.group-discount-header{
  display: flex;
  align-items: center;

  font-weight: 600;
  font-size: 0.8rem;
}

.policy-details{
  font-size: 2.3rem;
  font-weight: 600;
}

.header-right{
  background-color: var(--blue-400);
  border: 1px solid var(--blue-300);
  border-radius: var(--bng-corners-2);
  padding: 1rem;
}

.action-type{
  color: var(--grey-200);
  margin-bottom: 0.625rem;
}

.current-after-discount-price{
  display: flex;
  flex-direction: row;
  gap: 1.875rem;
}


.vehicle-value{
  color: var(--blue-200)
}

.group-discount-main-text{
  font-size: 1.3rem;
  font-weight: 600;
  text-align: left;
}

.insurance-identity{
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.money-bracket{
  color: var(--grey-200);
}

.header-left{
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 0.75rem;
}

.section-label{
  color: white;
  font-size: 1.4rem;
  font-weight: 800;

  &.deactivated{
    opacity: 0.8;
  }
}

.covers-renew-info{
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.8rem;
  color: var(--grey-200);
}

.covers-renew-seperator{
  width: 0.25rem;
  height: 0.25rem;
  background-color: var(--grey-200);
  border-radius: 50%;
}

.insurance-name{
  color: var(--grey-200);
  font-size: 1.3rem;
  font-weight: 500;
}

.insurance-slogan{
  color: var(--grey-200);
  font-style: italic;
}

.tier-discount-price{
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 6rem;
  gap: 0.5rem;
  justify-content: space-between;

  padding: 0.5rem 0rem;

  color: var(--grey-200);

  background-color: var(--grey-400);
  border: 1px solid var(--grey-300);
  border-radius: var(--bng-corners-3);

  &.isFutureTier{
    background-color: var(--green-500);
    border: 3px solid var(--green-300);
    border-radius: var(--bng-corners-3);

    color: var(--grey-200);
  }
}

.breakdown-item{
  border: 1px solid var(--grey-300);
  border-radius: var(--bng-corners-3);
  padding: 0.625rem;
  flex: 1;
  align-items: center;
  justify-content: flex-start;
  background-color: var(--grey-400);
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.name-slogan-seperator{
  width: 1.2rem;
  height: 0.125rem;
  background-color: var(--grey-200);
}

.policy-tier{
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--bng-orange-300);
  &.isFuture{
    color: var(--green-300);
  }
}

.sum-to-pay{
  background-color: var(--green-500);
  border: 3px solid var(--green-300);
  border-radius: var(--bng-corners-3);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem 0.9rem;
  color: white;

  font-size: 1.5rem;
  font-weight: 800;
}

:deep(.green-price *) {
  color: var(--green-300) !important;
}

:deep(.info-item) {
  --paddings: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1 !important;
}

.group-discount-icon-wrapper {
  background-color: rgba(232, 123, 52, 1);
  border-radius: 0.9375rem;
  padding: 0.3125rem;
  margin-right: 0.625rem;
}

.group-discount-secondary-text{
  font-size: 0.9rem;
  font-weight: 300;
  text-align: left;
  opacity: 0.8;
}

.group-discount-wrapper{
  background-color: var(--blue-600);
  border: 1px solid var(--blue-300);
  border-radius: var(--bng-corners-3);
  padding: 1rem 1rem;

  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tiers-wrapper{
  display:flex;
  flex-direction:column;
  gap: 0.625rem;
}

.tier{
  display:flex;
  flex: 1;
  flex-direction:column;
  align-items: center;
  justify-content: center;
}

.textual-tiers-wrapper{
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
}

.price-breakdown-wrapper{
  background-color: var(--grey-400);
  border: 1px solid var(--grey-300);
  border-radius: var(--bng-corners-3);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.prices-breakdown-header{
  display: flex;
  gap: 1.25rem;
  flex-direction: row;
}

.breakdown-value{
  &.result{
    color: var(--green-300);
    font-weight: 800;
  }
}

.strikethrough-container {
  position: relative;
}

.strikethrough-grey {
  :deep(*) {
    opacity: 0.7;
  }
}

.strikethrough-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: currentColor;
  opacity: 0.7;
}

.tier-discount-badge {
  color: var(--green-300);
  font-weight: 600;
}

.breakdown-label {
  display: flex;
  align-items: center;
}

.breakdown-item-value{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 0.625rem;
  width: 100%;

  &.result{
    font-weight:800;
    border-top: 1px solid white;
    padding-top: 0.3125rem;
  }

  &.subtotal{
    font-weight:400;
    border-top: 1px solid rgba(255, 255, 255, 0.671);
    padding-top: 0.3125rem;
    opacity: 0.8;
  }

  &.orange{
    color: var(--bng-orange-300)
  }
}

.tier-discount{
  width: 95%;
  text-align: center;
  border-radius: var(--bng-corners-2);
  background-color: var(--grey-300);
  padding-top: 0.625rem;
  padding-bottom: 0.5rem;
  &.isCurrent{
    background-color: var(--bng-orange-400);
  }
}

.sum-to-pay-value{
  font-size: 1.5rem;
  font-weight: 1000;
  padding: 0 !important;
}

.closeButton {
  text-align: center;
}
</style>