<template>
  <div class="popup-content">
    <div class="popup-header">
      <BngCardHeading type="ribbon">
        {{ mode === "purchase" ? "Insure your " : "Switch insurance for your " }}
        {{ vehicleInfo.Name }}
      </BngCardHeading>
    </div>
    <div class="content-wrapper">
      <BngOverflowContainer
        ref="overflowRef"
        class="insurance-shelf"
        :scroll-speed="10"
        :initial-index="selectedShelfIndex"
        use-bindings-only
        show-arrows
        no-wheel
      >
        <InsuranceCard
          v-for="(insurance, index) in insurancesData"
          :key="insurance.id"
          :insuranceData="insurance"
          :isSelected="selectedInsuranceId === insurance.id"
          :vehicleInfo="vehicleInfo"
          :isCurrentProvider="mode === 'change' && currentInsuranceId === insurance.id"
          class="insurance-card"
          @click="onShelfClick(insurance.id, index)"
        />
      </BngOverflowContainer>
    </div>
    <div class="buttons-wrapper">
      <div class="button-container">
        <BngButton @click="cancel" :accent="ACCENTS.attention">Cancel</BngButton>
        <BngButton @click="viewCostBreakdown" :disabled="selectedShelfIndex === 0 || (mode === 'change' && selectedInsuranceId === currentInsuranceId)" :accent="ACCENTS.secondary">View Cost Breakdown</BngButton>
        <BngButton :disabled="!selectedInsuranceId || (mode === 'change' && selectedInsuranceId === currentInsuranceId)" @click="continueWithInsurance">{{ buttonText }}</BngButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { BngButton, ACCENTS, BngOverflowContainer, BngCardHeading } from "@/common/components/base"
import useChooseInsurance from "../stores/chooseInsuranceComposable"
import { lua, useBridge } from "@/bridge"
import { InsuranceCard, PurchaseInsuranceDetails, ChangeInsuranceDetails } from "@/modules/career/components"
import { addPopup, closeLastPopups } from "@/services/popup"
import { useUINavBlocker } from "@/services/uiNavTracker"
import { DOM_UI_NAVIGATION_EVENT } from "@/services/uiNav"

const uiNavBlocker = useUINavBlocker()
uiNavBlocker.ensureNoBlock(["tab_l", "tab_r"])

//FIXME: This is a temporary solution to handle tab navigation. We need to find a better way to handle this.
const overflowRef = ref(null)
const onTabNav = (evt) => {
  if (evt.detail.value !== 1) return
  console.log("onTabNav", evt.detail)
  console.log("overflowRef", overflowRef.value)
  if (evt.detail.name === 'tab_l') overflowRef.value?.activatePrev()
  if (evt.detail.name === 'tab_r') overflowRef.value?.activateNext()
}

const props = defineProps({
  menuMode: {
    type: String,
    required: true
  },
  params: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(["return"])

const { units } = useBridge()

const selectedInsuranceId = ref(null)
const selectedShelfIndex = ref(0)

const {
  insurancesData,
  purchaseData,
  defaultInsuranceId,
  firstSelectedInsuranceId,
  vehicleInfo,
  requestDataForCurrentContext,
  mode,
  context,
  driverScoreData,
  currentInsuranceId,
} = useChooseInsurance()

onMounted(() => {
  window.addEventListener(DOM_UI_NAVIGATION_EVENT, onTabNav)
  mode.value = props.menuMode
  context.value = props.params

  // directly request insurance data without changing UI state
  if (props.menuMode === 'purchase' && props.params) {
    lua.career_modules_insurance_insurance.sendChooseInsuranceDataToTheUI(
      props.params.purchaseType,
      props.params.shopId,
      props.params.insuranceId
    )
  } else if (props.menuMode === 'change' && props.params) {
    lua.career_modules_insurance_insurance.sendChangeInsuranceDataToTheUI(props.params.vehicleId)
  }
})

// Sync shelf index with insurance selection
watch(selectedShelfIndex, (newIndex) => {
  if (insurancesData.value[newIndex]) {
    selectedInsuranceId.value = insurancesData.value[newIndex].id
  }
})

// set default selected insurance when data loads
watch(defaultInsuranceId, (defaultId) => {
  if (defaultId !== null) {
    selectedInsuranceId.value = defaultId

    const index = insurancesData.value.findIndex(ins => ins.id === defaultId)
    if (index !== -1) {
      selectedShelfIndex.value = index
    }
  }
}, { immediate: true })


const onShelfClick = (insuranceId, index) => {
  // when clicking on the centered insurance card, proceed with selection
  selectedInsuranceId.value = insuranceId
  selectedShelfIndex.value = index
}

const buttonText = computed(() => {
  if (mode.value === "change") {
    if (selectedInsuranceId.value === -1) {
      return "Remove Coverage"
    } else if (selectedInsuranceId.value === currentInsuranceId.value) {
      return "Current Provider"
    } else {
      return "Move vehicle here"
    }
  }
  return "Select this option"
})

const viewCostBreakdown = () => {
  if (mode.value === "purchase") {
    addPopup(PurchaseInsuranceDetails, { insuranceData: insurancesData.value[selectedShelfIndex.value], vehicleInfo: vehicleInfo.value, driverScoreData: driverScoreData.value })
  } else {
    addPopup(ChangeInsuranceDetails, {
      insuranceData: insurancesData.value[selectedShelfIndex.value],
      vehicleInfo: vehicleInfo.value,
      driverScoreData: driverScoreData.value,
    })
  }
}

const continueWithInsurance = () => {
  if (mode.value === "purchase") {
    if (selectedInsuranceId.value !== null && selectedInsuranceId.value !== undefined) {
      // update the insurance selection without reopening it since we are in a popup
      lua.career_modules_vehicleShopping.updateInsuranceSelection(selectedInsuranceId.value)
    }
    emit("return", true)
  } else if (mode.value === "change") {
    if (selectedInsuranceId.value && context.value?.vehicleId) {
      lua.career_modules_insurance_insurance.changeInvVehInsurance(context.value.vehicleId, selectedInsuranceId.value)
    }

    closeLastPopups(3)
  }
}

const cancel = () => {
  emit("return", true)
}

onUnmounted(() => {
  window.removeEventListener(DOM_UI_NAVIGATION_EVENT, onTabNav)
  // ensure shared context is cleared when popup is closed
  mode.value = null
  context.value = null
})

</script>

<style scoped lang="scss">
.popup-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  // background: linear-gradient(135deg, var(--bng-cool-gray-800) 0%, var(--blue-shade-100) 100%);
  background-color: #111;
  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  // padding: 0.5rem 1.25rem;
  color: white;
  width: fit-content;
  min-width: 75rem;
  overflow: hidden;
  max-width: 90vw;
  height: 85%;
}

.popup-header {
  flex: 0 0 auto;
  background-color: #000e;
  > * {
    margin: 0.2em 0;
    font-size: 1.8rem;
  }
}

.content-wrapper {
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden auto;
}

.insurance-shelf {
  --bng-overflow-container-background: #111;
  --bng-overflow-container-fade-color: #111;
  --bng-overflow-container-fade-color-hover: var(--bng-orange-600);
  --binding-font-size: 1.5em;
  --bng-overflow-container-gap: 0.25em;

  width: 100%;
  max-width: 100%;
  font-size: 1rem;
  flex: 0 0 auto;

  :deep(.shelf-container) {
    overflow: visible;
  }
}

.insurance-card {
  width: 34rem;
  min-height: unset;
  flex: 0 0 auto;
  z-index: unset !important;
}

.buttons-wrapper {
  flex: 0 0 auto;
  justify-content: flex-end;
  justify-content: center;
  align-items: center;
  justify-content: center;
}

.button-container {
  padding: 0.5rem 1.25rem;
  display: flex;
  gap: 0.625rem;
  justify-content: flex-end;

  :deep(button) {
    padding: 0.75rem 1.5rem;
    font-size: 1.1rem;
  }
}

</style>
