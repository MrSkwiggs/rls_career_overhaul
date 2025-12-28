<template>
  <div class="insurance-details-wrapper" bng-ui-scope="insuranceDetailsPopup">
    <BngCard>
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
              <span>Covers {{ props.insuranceData.carsInsured }} Vehicles</span>
              <span class="covers-renew-seperator"></span>
              <span>Renews every 100 kms</span>
            </div>
          </div>
          <div class="header-right">
            <div class="action-type">Adding vehicle</div>
            <div class="vehicle-name">{{ props.insuranceData.vehicleName }}</div>
            <div class="vehicle-value">Value : {{ props.insuranceData.vehicleValue }} €</div>
          </div>
        </div>


        <div v-if="props.insuranceData.groupDiscountData.willHaveGroupDiscountForTheFirstTime || props.insuranceData.groupDiscountData.willBumpTheirDiscount || props.insuranceData.groupDiscountData.currentTierData.id > 0" class="group-discount-wrapper">
          <div class="group-discount-header">
            <div class="group-discount-icon-wrapper">
              <BngIcon :type="icons.checkmark" />
            </div>
            <div class="group-discount-text-wrapper">
              <div class="group-discount-main-text">
                Multi-Vehicle Discount Active
              </div>
              <div class="group-discount-secondary-text">
                Insurance discounts are based on the total value of your fleet.
              </div>
            </div>
          </div>

          <div class="tiers">
            <div class="tier" v-for="tier in props.insuranceData.groupDiscountData.groupDiscountTiers" :key="tier.id">
              <div class="tier-number">
                Tier {{ tier.id }}
              </div>
              <div class="money-bracket">
                <span>{{ tier.min / 1000 }}k</span>
                <span v-if="tier.max">-{{ tier.max / 1000 }}k</span>
                <span v-else>+</span>
              </div>
              <div class="tier-discount" :class="{'isCurrent':tier.isCurrent}">
                {{ tier.discount * 100 }} %
              </div>
            </div>
          </div>

          <div class="current-after-discount-price">
            <div class="tier-discount-price">
              <div class="section-label deactivated">
                Current Tier
              </div>
              <div class="policy-value">
                Policy Value : {{ props.insuranceData.totalInsuranceVehsValue }} €
              </div>
              <div class="policy-tier">
                Tier {{ props.insuranceData.groupDiscountData.currentTierData.id }} - {{ props.insuranceData.groupDiscountData.currentTierData.discount * 100 }}% off
              </div>
            </div>
            <div class="tier-discount-price isFutureTier">
              <div class="section-label">
                After Purchase
              </div>
              <div class="policy-value">
                Policy Value : {{ props.insuranceData.totalInsuranceVehsValue + props.insuranceData.vehicleValue }} €
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
              <div class="breakdown-item-value">
                <span class="breakdown-label">
                  Coverage Cost
                </span>
                <span class="breakdown-value">
                  {{ props.insuranceData.nonProRatedVehiclePremium }} €
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
              <div class="breakdown-item-value result">
                <span class="breakdown-label">
                  Policy Add-On Cost
                </span>
                <span class="breakdown-value result">
                  {{ props.insuranceData.proRatedVehiclePremium }} €
                </span>
              </div>
            </div>
            <div class="breakdown-item">
              <div class="section-label">
                Policy
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
    </BngCard>
  </div>
</template>

<script setup>
import { BngCard, BngUnit, BngButton, ACCENTS, BngIcon, icons } from "@/common/components/base"
import { useInsuranceDetailsStore } from "../stores/insuranceDetailsStore"
import { useUINavScope } from "@/services/uiNav"

useUINavScope("insuranceDetailsPopup")

const insuranceDetailsStore = useInsuranceDetailsStore()

const props = defineProps({
  insuranceData: Object,
})

const emit = defineEmits(["return"])

const closePopup = () => {
  emit("return", true)
}
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

<style scoped lang="scss">
.insurance-details-wrapper {
  --blue-200: rgba(112, 163, 244, 1);
  --blue-300: rgba(48, 74, 139, 1);
  --blue-400: rgba(28, 39, 74, 1);
  --blue-500: rgba(25, 33, 50, 1);
  --blue-600: rgba(5, 9, 25, 1);

  --grey-200: rgba(204, 208, 213, 1);
  --grey-300: rgba(57, 65, 80, 1);
  --grey-400: rgba(33, 41, 54, 1);

  --green-300: rgba(119, 219, 137, 1);
  --green-500: rgba(22, 42, 41, 1);

  color: white;
  width: 50em;
}

:deep(.bng-card-wrapper) {
  --bg-opacity: 1 !important;
}

.header {
  display:flex;
  flex-direction: row;
  justify-content: space-between;
}

.card-content {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  background-color: var(--blue-500);
}

.group-discount-header{
  display: flex;
  align-items: center;

  font-weight: 600;
  font-size: 0.8em;
}

.policy-details{
  font-size: 2.3em;
  font-weight: 600;
}

.header-right{
  background-color: var(--blue-400);
  border: 1px solid var(--blue-300);
  border-radius: var(--bng-corners-2);
  padding: 1em;
}

.action-type{
  color: var(--grey-200);
  margin-bottom: 10px;
}

.current-after-discount-price{
  display: flex;
  flex-direction: row;
  gap: 30px;
}


.vehicle-value{
  color: var(--blue-200)
}

.group-discount-main-text{
  font-size: 1.6em;
  font-weight: 600;
  text-align: left;
}

.insurance-identity{
  display: flex;
  align-items: center;
  gap: 10px;
}

.money-bracket{
  color: var(--grey-200);
}

.header-left{
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 12px;
}

.section-label{
  color: white;
  font-size: 1.4em;
  font-weight: 800;

  &.deactivated{
    opacity: 0.8;
  }
}

.covers-renew-info{
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8em;
  color: var(--grey-200);
}

.covers-renew-seperator{
  width: 4px;
  height: 4px;
  background-color: var(--grey-200);
  border-radius: 50%;
}

.insurance-name{
  color: var(--grey-200);
  font-size: 1.3em;
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
  height:6em;
  gap: 5px;
  justify-content: space-between;

  padding: 20px 0px;

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
  background-color: var(--grey-400);
  border: 1px solid var(--grey-300);
  border-radius: var(--bng-corners-3);
  padding: 10px;
  flex: 1;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.name-slogan-seperator{
  width: 1.2em;
  height: 2px;
  background-color: var(--grey-200);
}

.policy-tier{
  font-weight: 600;
  font-size: 1.1em;
  color: var(--bng-orange-300);
  &.isFuture{
    color: var(--green-300);
  }
}

.sum-to-pay{
  background-color: var(--green-500);
  border: 3px solid var(--green-300);
  border-radius: var(--bng-corners-3);
  padding: 10px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 20px 30px;
  color: white;

  font-size: 1.5em;
  font-weight: 800;
}

:deep(.green-price *) {
  color: var(--green-300) !important;
}

.group-discount-icon-wrapper {
  background-color: rgba(232, 123, 52, 1);
  border-radius: 15px;
  padding: 5px;
  margin-right: 10px;
}

.group-discount-secondary-text{
  font-size: 1.15em;
  font-weight: 300;
  text-align: left;
  opacity: 0.8;
}

.group-discount-wrapper{
  background-color: var(--blue-600);
  border: 1px solid var(--blue-300);
  border-radius: var(--bng-corners-3);
  padding: 30px 15px;

  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tiers{
  display:flex;
  flex-direction:row;
}

.tier{
  flex: 1;
  display:flex;
  flex-direction:column;
  align-items: center;
  justify-content: center;
}


.price-breakdown-wrapper{
  background-color: var(--grey-400);
  border: 1px solid var(--grey-300);
  border-radius: var(--bng-corners-3);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.prices-breakdown-header{
  display: flex;
  gap: 20px;
  flex-direction: row;
}

.breakdown-value{
  &.result{
    color: var(--green-300);
    font-weight: 800;
  }
}

.breakdown-item-value{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 10px;
  width: 100%;

  &.result{
    font-weight:800;
    border-top: 1px solid white;
    padding-top: 5px;
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
  padding-top:10px;
  padding-bottom:8px;
  &.isCurrent{
    background-color: var(--bng-orange-400);
  }
}

.sum-to-pay-value{
  font-size: 1.5em;
  font-weight: 1000;
  padding: 0 !important;
}

.closeButton {
  text-align: center;
  margin-top: 1em;
}
</style>