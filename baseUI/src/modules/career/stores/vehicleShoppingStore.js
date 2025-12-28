import { ref } from "vue"
import { defineStore } from "pinia"
import { lua } from "@/bridge"

export const useVehicleShoppingStore = defineStore("vehicleShopping", () => {
  // States
  const selectedSellerId = ref("")
  const currentSeller = ref({})
  const vehicleShoppingData = ref({})
  const filteredVehicles = ref([])
  const filteredSoldVehicles = ref([])
  const buildFilteredListByKey = (data, key) => {
    if (!data || !data[key]) return []

    const filteredList = Object.keys(data[key]).reduce((result, itemKey) => {
      const item = data[key][itemKey]
      if (selectedSellerId.value) {
        if (item.sellerId === selectedSellerId.value) result.push(item)
      } else {
        result.push(item)
      }
      return result
    }, [])

    if (filteredList.length) filteredList.sort((a, b) => a.Value - b.Value)
    return filteredList
  }

  const updateListsFromData = () => {
    filteredVehicles.value = buildFilteredListByKey(vehicleShoppingData.value, 'vehiclesInShop')
    filteredSoldVehicles.value = buildFilteredListByKey(vehicleShoppingData.value, 'soldVehicles')
  }

  const setSelectedSellerId = (sellerId) => {
    selectedSellerId.value = sellerId
    updateListsFromData()
    currentSeller.value = vehicleShoppingData.value.uiDealershipsData.find(dealership => dealership.id === sellerId)
  }

  // Actions
  const requestVehicleShoppingData = async () => {
    vehicleShoppingData.value = await lua.career_modules_vehicleShopping.getShoppingData()
    updateListsFromData()
  }

  return {
    vehicleShoppingData,
    filteredVehicles,
    filteredSoldVehicles,
    currentSeller,
    requestVehicleShoppingData,
    setSelectedSellerId,
  }
})
