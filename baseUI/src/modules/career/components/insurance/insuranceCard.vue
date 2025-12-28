<template>
  <div
    class="insurance-card-container"
    :class="{
      selected: isSelected,
      'no-insurance-card': hasNoInsurance,
      'current-provider': isCurrentProvider
    }"
    :style="cardStyles"
    @click="selectCard"
    bng-nav-item
  >
    <div class="top-pill"
      v-if="pillText !== null"
      :class="{
        'no-insurance': hasNoInsurance,
        'orange-pill': insuranceData.groupDiscountData?.willHaveGroupDiscountForTheFirstTime,
        'current-provider-pill': isCurrentProvider
      }"
    >
      <div>
        {{ pillText }}
      </div>
    </div>
    <div class="content">
      <InsuranceIdentity class="insurance-identity" :insuranceData="insuranceData" />

      <div class="separator"></div>

      <div class="insurance-perks-div">
        <div class="perks-header" :class="{ 'no-insurance': hasNoInsurance }" v-if="hasNoInsurance">
          {{ !hasNoInsurance ? "Included Benefits" : "Consequences" }}
        </div>
        <InsurancePerks :insuranceData="insuranceData" />
      </div>

      <div class="separator"></div>

      <div
        v-if="hasNoInsurance && insuranceData.leavingInsuranceInfo && !isCurrentProvider"
        class="leaving-insurance-wrapper"
      >
        <div class="leaving-insurance-title">Cancellation Refund</div>
        <div class="breakdown-items-wrapper">
          <div class="breakdown-item">
            <span>
              Unused coverage ({{ leavingInsuranceRenewsInFormatted }})
            </span>
            <span class="orange-price">
              + <BngUnit :money="insuranceData.leavingInsuranceInfo.coverageRefundPrice" />
            </span>
          </div>
          <div class="breakdown-item">
            <span>
              Early Cancellation Fee (25%)
            </span>
            <span class="red-price">
              - <BngUnit :money="insuranceData.leavingInsuranceInfo.earlyTerminationPenalty" />
            </span>
          </div>
          <div class="breakdown-item total">
            <span class="breakdown-item-label-total">
              You'll receive
            </span>
            <span class="breakdown-item-value-total green-price">
              <BngUnit :money="insuranceData.leavingInsuranceInfo.netRefundPrice" />
            </span>
          </div>
        </div>
      </div>

      <div v-if="hasNoInsurance" class="no-insurance-wrapper">
        <span class="no-insurance-warning"> You will pay full repair costs </span>
        <span> No coverage or benefits included </span>
      </div>

      <div
        v-if="!hasNoInsurance && insuranceData.groupDiscountData?.mainText"
        class="group-discount-wrapper"
      >
        <div>
          <span class="group-discount-icon-wrapper">
            <BngIcon :type="icons.checkmark" />
          </span>
          <span class="group-discount-main-text">
            {{ insuranceData.groupDiscountData?.mainText }}
          </span>
        </div>
        <div>
          <span class="grey-small-text">
            Currently Insured :
          </span>
          <span>
            <BngIcon class="vehicles-icon" :type="icons.car" />
          </span>
          <span class="tier-text">
            {{ insuranceData.carsInsuredCount }}
          </span>
          <template v-if="insuranceData.groupDiscountData?.currentTierData?.id > 0">
            <span class="vertical-separator">
              |
            </span>
            <span class="tier-text">
              Tier {{ insuranceData.groupDiscountData?.currentTierData?.id }}
            </span>
            <span class="discount-text">
              - {{ insuranceData.groupDiscountData?.currentTierData?.discount * 100 }}% off
            </span>
          </template>
        </div>
        <div class="grey-small-text">
          {{ insuranceData.groupDiscountData?.secondaryText }}
        </div>
      </div>

      <div v-if="!hasNoInsurance" class="price-details-wrapper">
        <div class="price-tile">
          <span class="price-tile-title">Deductible</span>
          <div v-if="insuranceData.baseDeductibledData?.oldPrice" class="old-price-wrapper">
            <div class="old-price">
              <BngUnit :money="insuranceData.baseDeductibledData.oldPrice" />
              <div class="strike"></div>
            </div>
          </div>
          <div class="price-tile-value-wrapper">
            <BngUnit
              :money="insuranceData.baseDeductibledData.price"
              :class="insuranceData.baseDeductibledData.oldPrice ? 'green-price' : 'orange-price'"
            />
          </div>
          <div class="deductible-tips">
            <div>
              - You pay your deductible for each crash repair
            </div>
            <div>
              - Customize this value after purchase
            </div>
          </div>
          <div v-if="insuranceData.baseDeductibledData.perkData" class="deductible-discount">
            {{ insuranceData.baseDeductibledData.perkData.discount * 100 }}% discount applied
          </div>
        </div>
        <div class="price-tile">
          <span class="price-tile-title">{{ insuranceData.amountDue > 0 ? 'Amount Due' : 'Credit Received' }}</span>
          <div class="price-tile-value-wrapper">
            <BngUnit :money="Math.abs(insuranceData.amountDue)" class="green-price" />
          </div>
          <div class="premium-extra-info">
            <div>
              Total policy :
              <BngUnit :money="insuranceData.futurePremiumDetails.totalPriceWithDriverScore" />
            </div>
            <div>
              <span>Renews in : </span>
              <span class="renewal-distance">
                {{ renewsInFormatted }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="background" :class="{ 'no-insurance': hasNoInsurance }"></div>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { BngIcon, icons, BngUnit } from "@/common/components/base"
import { useBridge } from "@/bridge"
import { InsurancePerks, InsuranceIdentity } from "@/modules/career/components"
import { hexToRgb } from "@/utils/colorUtils"

const props = defineProps({
  insuranceData: Object,
  isSelected: Boolean,
  isCurrentProvider: {
    type: Boolean,
    default: false
  }
})

const { units } = useBridge()

const emit = defineEmits(['select'])

const hasNoInsurance = computed(() => props.insuranceData?.id === -1)

const pillText = computed(() => {
  if (props.isCurrentProvider) {
    return "CURRENT PROVIDER"
  }
  if (props.insuranceData.groupDiscountData) {
    if (props.insuranceData.groupDiscountData?.willHaveGroupDiscountForTheFirstTime) {
      return "MULTI-VEHICLE DISCOUNT AVAILABLE"
    } else if (props.insuranceData.groupDiscountData?.willBumpTheirDiscount) {
      return "BIGGER DISCOUNT AVAILABLE"
    } else if (props.insuranceData.groupDiscountData?.currentTierData && props.insuranceData.groupDiscountData?.currentTierData.id > 0) {
      return "MULTI-VEHICLE DISCOUNT ACTIVE"
    }
  }
  return null
})

const renewsInFormatted = computed(() => {
  if (!props.insuranceData?.renewsIn) return ''
  return units.buildString('length', props.insuranceData.renewsIn * 1000, 0)
})

const leavingInsuranceRenewsInFormatted = computed(() => {
  if (!props.insuranceData?.leavingInsuranceInfo?.renewsIn) return ''
  return units.buildString('length', props.insuranceData.leavingInsuranceInfo.renewsIn * 1000, 0)
})

const selectCard = () => {
  emit('select', props.insuranceData.id)
}

const cardStyles = computed(() => {
  const styles = {}

  // if (!hasNoInsurance.value && props.insuranceData.color) {
  //   styles['border-top'] = `0.7rem solid ${props.insuranceData.color}`
  // }

  if (!hasNoInsurance.value && props.insuranceData.color) {
    styles['--insurance-card-rgb'] = hexToRgb(props.insuranceData.color)
  }

  return styles
})
</script>

<style scoped lang="scss">
.insurance-card-container {
  position: relative;
  background: transparent;
  border-radius: var(--bng-corners-3);
  // border: 2px solid var(--bng-ter-blue-gray-800);
  overflow: visible;
  padding: 0.625rem;
  margin-top: 0.8rem;
  width: 60rem;
  min-height: 48rem;
  cursor: pointer;
  // opacity: 0.8;
  transition: opacity 0.3s ease;
  // transform: scale(0.975);

  .content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    z-index: 1;
  }

  .background {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    transform-origin: center;
    border-radius: var(--bng-corners-3);
    overflow: hidden;
    box-shadow: inset 0 0 0 0 var(--bng-orange-500);
    background-image: linear-gradient(
      180deg,
      rgba(var(--insurance-card-rgb), 1) 0,
      rgba(var(--insurance-card-rgb), 1) 0.7rem,
      rgba(var(--insurance-card-rgb), 0.5) 0.72rem,
      rgba(var(--insurance-card-rgb), 0.19) 10%,
      rgba(var(--insurance-card-rgb), 0.06) 35%,
      transparent 50%,
      transparent 100%
    );

    background-color: var(--bng-ter-blue-gray-900);
    transform: scale(0.99);
    border: 2px solid var(--bng-ter-blue-gray-700);
    transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
    opacity: 0.5;

    &.no-insurance {
      background-color: var(--bng-add-red-900);
      border: 1px solid var(--bng-add-red-600);
    }
  }

  &.selected {
    opacity: 1;
    .background {
      transform: scale(1.01);
      box-shadow: inset 0 0 0 3px var(--bng-orange-500);
      // border: 2px solid var(--bng-orange-500);
      background-image: linear-gradient(
        180deg,
        rgba(var(--insurance-card-rgb), 1) 0,
        rgba(var(--insurance-card-rgb), 1) 0.7rem,
        rgba(var(--insurance-card-rgb), 0.5) 0.72rem,
        rgba(var(--insurance-card-rgb), 0.19) 10%,
        rgba(var(--insurance-card-rgb), 0.06) 35%,
        transparent 50%,
        transparent 100%
      );
      opacity: 1;
    }
  }

  .top-pill {
    position: absolute;
    z-index: 2;
    position: absolute;
    top: -0.75rem;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, rgba(93, 192, 107, 1) 0%, rgba(67, 148, 108, 1) 100%);
    color: white;
    padding: 0.375rem 1rem;
    padding-top: 0.5rem;
    border-radius: 1.25rem;
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03125rem;
    z-index: 20;
    white-space: nowrap;

    display: flex;
    flex-direction: row;
    gap: 0.3125rem;

    &.no-insurance {
      background: linear-gradient(135deg, rgba(181, 50, 41, 1) 0%, rgb(135, 31, 23) 100%);
    }

    &.orange-pill {
      background: linear-gradient(135deg, rgba(225, 180, 61, 1) 0%, rgba(232, 123, 53, 1) 100%);
    }

    &.current-provider-pill {
      background: linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 1) 100%);
    }
  }
}

.breakdown-item-label-total {
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 0.3125rem;
}

.top-pill-icon {
  margin-top: -0.1875rem;
}

.breakdown-item-value-total {
  font-size: 1.3rem;
}

.separator {
  width: auto;
  height: 1px;
  background-color: rgba(31, 36, 52, 1);
  margin: 0.5em 0 0.75em 0;
}

.breakdown-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  font-weight: 300;

  &.total {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.vertical-separator {
  margin: 0 0.3125rem;
}

.leaving-insurance-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--bng-corners-3);
  padding: 1.25rem 1.25rem;
  margin: 1.25rem 1.25rem;
  background-color: var(--bng-add-red-900);
}

.icon-name-slogan-wrapper {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 1.25rem;
  margin-top: 0.625rem;
}

.leaving-insurance-title {
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
}

.insurance-icon-wrapper {
  font-size: 3rem;
  transform: translateY(0.625rem);
}

.insurance-slogan {
  font-size: 1rem;
  font-weight: 300;
  text-align: center;
  font-style: italic;
  opacity: 0.6;
}

.group-discount-wrapper {
  border: 2px solid rgba(21, 33, 72, 1);
  border-radius: 0.3125rem;

  height: 6rem;

  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 0.625rem;
  padding: 0.625rem 1rem;
  padding-bottom: 1.25rem;

  font-weight: 600;
  font-size: 0.6rem;

  > div {
    display: flex;
    align-items: center;
  }

  background-color: var(--blue-500);
}

.grey-small-text {
  font-size: 0.86rem;
  font-weight: 300;
  text-align: left;
  opacity: 0.6;
}

.vehicles-icon {
  color: var(--bng-orange-300);
  margin-right: 0.3125rem;
  font-size: 1.1rem;
}

.tier-text {
  font-size: 0.9rem;
}

.discount-text {
  font-size: 1.1rem;
  font-weight: 500;
  text-align: left;
  margin-left: 0.3125rem;
}

.breakdown-items-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-discount-main-text {
  font-size: 1.4rem;
  font-weight: 600;
  text-align: left;
}

.group-discount-icon-wrapper {
  background-color: rgb(232, 123, 52);
  border-radius: 0.9375rem;
  padding: 0.3125rem;
  margin-right: 0.625rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.group-discount-secondary-text {
  font-size: 1.05rem;
  font-weight: 300;
  text-align: left;
  opacity: 0.8;
}

.price-details-wrapper {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
}

.price-tile {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  background-color: var(--blue-500);
  border-radius: 0.4375rem;
  padding: 0.625rem;
}

.renewal-distance {
  font-weight: 600;
  color: rgb(101, 146, 214);
}

.price-tile-title {
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
}

.deductible-discount {
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 0.625rem;
  color: rgba(119, 219, 137, 1);
}

.price-tile-value-wrapper {
  font-size: 1.6rem;
  font-weight: 600;
  text-align: center;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.3125rem;
}

:deep(.orange-price *) {
  color: var(--bng-orange-300) !important;
  padding: 0 !important;
}
:deep(.green-price *) {
  color: var(--bng-add-green-400) !important;
  padding: 0 !important;
}
:deep(.red-price *) {
  padding: 0 !important;
  color: var(--bng-add-red-400) !important;
}

:deep(.old-price *) {
  color: var(--bng-ter-blue-gray-500) !important;
  padding: 0 !important;
}

.deductible-tips {
  font-size: 0.8rem;
  font-weight: 300;
  text-align: left;
  opacity: 0.6;

  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
}

.old-price-wrapper {
  text-align: center;
}

.old-price {
  display: inline-block;
  position: relative;
}

.strike {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--bng-cool-gray-500);
  transform: translateY(-50%);
}

.premium-extra-info {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  padding: 0.1875rem;

  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
}

.perk-icon-wrapper {
  font-size: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-insurance-wrapper {
  font-size: 0.8rem;
  font-weight: 300;
  text-align: center;

  border: 1px solid var(--bng-add-red-500);
  border-radius: 0.3125rem;

  display: flex;
  flex-direction: column;
  gap: 0.3125rem;

  padding: 0.625rem;
}

.no-insurance-warning {
  font-size: 1.5rem;
  font-weight: 900;
  text-align: center;
  opacity: 1;

  color: var(--bng-add-red-500);
}

.perks-header {
  display: flex;
  justify-content: center;
  font-size: 1.5rem;
  width: 100%;
  margin-bottom: 0.625rem;

  &.no-insurance {
    color: var(--bng-add-red-500);
    font-weight: 600;
    font-size: 1.2rem;
  }
}

.insurance-card {
  position: relative;
  // Prevent global focus frame - we use .selected for visual feedback
  &::before {
    content: none !important;
  }
}

.insurance-name {
  font-size: 2rem;
  font-weight: 600;
  text-align: center;
  margin-top: 0.625rem;
}

.price-details {
  margin-top: 1.25rem;
  margin-bottom: 0.9375rem;
  text-align: left;
  width: 100%;
}

.deductible,
.renewal-price {
  display: flex;
  align-items: center;
  gap: 0;
  margin-left: 0.625rem;
}

.deductible-price,
.premium-price {
  font-size: 0.7rem;
}

.insurance-price {
  font-size: 1.2rem;
  font-weight: 600;
  text-align: right;
  width: 100%;
  right: -5rem;
}

.label {
  color: var(--bng-orange-300);
  font-weight: 600;
  font-size: 0.7rem;
  margin-right: 0.3125rem;
}

.price {
  font-size: 0.5rem;
}

.bottom-right {
  font-size: 0.7rem;
}

.cars-insured {
  font-size: 1rem;
  font-weight: 300;
  text-align: center;
  width: fit-content;
}

.group-discount {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3125rem;

  background: rgba(255, 255, 255, 0.237);
  border-radius: 0.625rem;
  padding: 0.125rem 0.3125rem;
}
</style>
