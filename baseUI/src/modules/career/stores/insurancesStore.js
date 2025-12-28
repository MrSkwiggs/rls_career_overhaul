import { ref } from "vue"
import { defineStore } from "pinia"
import { useBridge, lua } from "@/bridge"

export const useInsurancesStore = defineStore("insurances", () => {
  const { events } = useBridge()

  let invVehsInsurancesData = ref({})
  let plClassesData = ref({})
  let uninsuredVehsData = ref({})
  let driverScoreData = ref({})
  // Actions

  function requestInitialData() {
    lua.career_modules_insurance_insurance.sendUIData()
  }

  // Lua events
  events.on("insurancesData", data => {
    invVehsInsurancesData.value = data.invVehsInsurancesData
    plClassesData.value = data.plClassesData
    uninsuredVehsData.value = data.uninsuredVehsData
    driverScoreData.value = data.driverScoreData
  })

  const closeMenu = lua.career_modules_insurance_insurance.closeMenu

  const dispose = () => {
    events.off("insurancesData")
  }

  return {
    dispose,
    requestInitialData,
    closeMenu,
    invVehsInsurancesData,
    plClassesData,
    uninsuredVehsData,
    driverScoreData,
  }
})
