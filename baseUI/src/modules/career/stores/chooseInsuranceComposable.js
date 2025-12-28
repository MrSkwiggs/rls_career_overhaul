import { ref, onUnmounted } from "vue"
import { useBridge, lua } from "@/bridge"

// Module-level state: shared across all component instances
// This is necessary because VehiclePurchaseMain and ChooseInsuranceMain
// create separate composable instances, but need to share navigation context
const sharedMode = ref(null)
const sharedContext = ref(null)

export default function useChooseInsurance() {
  const { events } = useBridge()

  const insurancesData = ref([])
  const purchaseData = ref({})
  const vehicleInfo = ref({})
  const defaultInsuranceId = ref(null)
  const firstSelectedInsuranceId = ref(null)
  const driverScoreData = ref({})
  const currentInsuranceId = ref(null)

  const handleChooseInsuranceData = data => {
    insurancesData.value = data.applicableInsurancesData
    purchaseData.value = data.purchaseData
    vehicleInfo.value = data.vehicleInfo
    driverScoreData.value = data.driverScoreData
    defaultInsuranceId.value = data.defaultInsuranceId
    firstSelectedInsuranceId.value = data.defaultInsuranceId
    currentInsuranceId.value = data.currentInsuranceId
  }

  function openChooseInsuranceMenu(menuMode, params) {
    sharedMode.value = menuMode
    sharedContext.value = params

    lua.career_modules_insurance_insurance.openChooseInsuranceScreen()
  }

  function requestDataForCurrentContext() {
    if (sharedMode.value === 'purchase' && sharedContext.value) {
      lua.career_modules_insurance_insurance.sendChooseInsuranceDataToTheUI(
        sharedContext.value.purchaseType,
        sharedContext.value.shopId,
        sharedContext.value.insuranceId
      )
    } else if (sharedMode.value === 'change' && sharedContext.value) {
      lua.career_modules_insurance_insurance.sendChangeInsuranceDataToTheUI(sharedContext.value.vehicleId)
    }
  }

  events.on("chooseInsuranceData", handleChooseInsuranceData)

  onUnmounted(() => {
    events.off("chooseInsuranceData", handleChooseInsuranceData)
  })

  return {
    openChooseInsuranceMenu,
    requestDataForCurrentContext,
    insurancesData,
    purchaseData,
    vehicleInfo,
    defaultInsuranceId,
    firstSelectedInsuranceId,
    driverScoreData,
    currentInsuranceId,
    mode: sharedMode,
    context: sharedContext,
  }
}
