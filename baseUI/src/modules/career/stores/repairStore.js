import { computed, inject, ref } from "vue"
import { defineStore } from "pinia"
import { lua } from "@/bridge"

export const useRepairStore = defineStore("repair", () => {
  // States
  const repairOptions = ref({})
  const vehicleData = ref({})
  const playerAttributes = ref({})
  const driverScoreTierData = ref({})
  const futureDriverScore = ref(0)
  const driverScore = ref(0)

  const resetStore = () => {
    repairOptions.value = {}
    vehicleData.value = {}
    playerAttributes.value = {}
    driverScoreTierData.value = {}
    futureDriverScore.value = 0
    driverScore.value = 0
  }

  const getRepairData = () => {
    resetStore()
    lua.career_modules_insurance_repairScreen.getRepairData().then(data => {
      repairOptions.value = data.repairOptions
      vehicleData.value = data.vehicleData
      playerAttributes.value = data.playerAttributes
      driverScoreTierData.value = data.driverScoreTierData
      futureDriverScore.value = data.futureDriverScore
      driverScore.value = data.driverScore
    })
  }

  return {
    repairOptions,
    vehicleData,
    playerAttributes,
    getRepairData,
    driverScoreTierData,
    futureDriverScore,
    driverScore,
    resetStore,
  }
})
