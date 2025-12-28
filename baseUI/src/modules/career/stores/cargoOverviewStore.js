import { computed, ref, watch } from "vue"
import { defineStore } from "pinia"
import { lua, useBridge } from "@/bridge"
import { openConfirmation, addPopup } from "@/services/popup"
import CargoLoadPopup from "../components/cargoOverview/CargoLoadPopup.vue"
import CargoScreenSettings from "../components/cargoOverview/CargoScreenSettings.vue"
// custom 'forEach' to check if it's an array first - some empty data from Lua seems to come back as an empty object rather than []
const _forEach = (arr, func) => Array.isArray(arr) && arr.length > 0 && arr.forEach(func)

export const useCargoOverviewStore = defineStore("cargoOverview", () => {
  const { events } = useBridge()

  // States
  const cargoData = ref()
  const dropDownData = ref({})
  const newCargoAvailable = ref(false)
  const cargoHighlighted = ref(false)
  const automaticRoute = ref(false)
  const detailedDropOff = ref(false)
  const tutorialInfo = ref()
  const facilityGroupingKey = ref("destinations")
  const facilitySortingKey = ref("rewardMoney")

  const playerGroupings = ['containers', 'tasklist','ungrouped']
  const playerGroupingKey = ref("tasklist")
  const playerSortingKey = ref("cardId")

  let facilityId
  let parkingSpotPath


  let facilityFilter = {value:"facility-info",label:"Facility Info", showInFilterTabs:true, isFacilityPage:true}
  let filterSets = ref({})
  let filterSetsByValue = ref({})
  let selectedFilterRef = ref()
  let selectedFilter = ref(facilityFilter)
  const selectFilter = (f) => {
    lua.career_modules_delivery_general.setSetting("selectedFilterKey", f)
    lua.career_modules_delivery_cargoScreen.setCargoScreenTab(f)
    for(let filter of filterSets.value) {
      if(filter.value == f[0]) {
        let prevGrouping = facilityGroupingKey.value
        let prevSorting = facilitySortingKey.value


        selectedFilter.value = filter
        if(!filter.isFacilityPage) {
          if(!filter.groupings.includes(prevGrouping)) {
            facilityGroupingKey.value = filter.groupings[0]
          }
          if(!cargoData.value.facilityCardGroupSets[facilityGroupingKey.value].sortings.includes(prevSorting)) {
            facilitySortingKey.value = cargoData.value.facilityCardGroupSets[facilityGroupingKey.value].sortings[0]
          }
          if(selectedCargo.value && selectedCargo.value.isFacilityCard) {
            let contained = selectedCargo.value.filterTags[filter.value]
            if(contained) {
              for(let groupKey of filter.groupings) {
                for(let group of cargoData.value.facilityCardGroupSets[groupKey].groups){
                    contained = contained || group.cardIdsUnsorted.includes(selectedCargo.value.cardId)
                }
              }
            }
            if(!contained) {
              selectedCargo.value = undefined
            }
          }
        }
      }
    }
  }

  const facilityGroupings = computed(() => selectedFilter.value ? selectedFilter.value.groupings : [])
  const nextFacilityGrouping = () => {
    let groups = facilityGroupings.value
    facilityGroupingKey.value = groups[(groups.indexOf(facilityGroupingKey.value) + 1) % groups.length]
  }
  const facilitySortings = computed(() => cargoData.value && facilityGroupingKey.value && cargoData.value.facilityCardGroupSets && cargoData.value.facilityCardGroupSets[facilityGroupingKey.value] ? cargoData.value.facilityCardGroupSets[facilityGroupingKey.value].sortings : [])
  const nextFacilitySorting = () => {
    let group = facilitySortings.value
    facilitySortingKey.value = group[(group.indexOf(facilitySortingKey.value) + 1) % group.length]
  }

  const nextPlayerGrouping = () => {
    let groups = playerGroupings
    playerGroupingKey.value = groups[(groups.indexOf(playerGroupingKey.value) + 1) % groups.length]
  }
  const playerSortings = computed(() => cargoData.value && facilityGroupingKey.value && cargoData.value.playerCardGroupSets && cargoData.value.playerCardGroupSets[facilityGroupingKey.value] ? cargoData.value.playerCardGroupSets[facilityGroupingKey.value].sortings : [])
  const nextPlayerSorting = () => {
    let group = cargoData.value.playerCardGroupSets[facilityGroupingKey.value]
    playerSortingKey.value = group[(group.indexOf(playerSortingKey.value) + 1) % group.length]
  }

  const currentFilterTutorialInfo = computed(() => {
    if (!tutorialInfo.value || !selectedFilter.value) return null
    const info = tutorialInfo.value[selectedFilter.value.value]
    if (!info || !info.unlocked || !info.isActive) return null
    return info
  })

  const openCargoScreenSettings = () => {
    addPopup(CargoScreenSettings)
  }


  const sortedParcelOffersByCargoType = computed(() => {
    if (!cargoData.value || !cargoData.value.facility || !cargoData.value.facility.outgoingCargo) return {}
    let sorted = {}

    // Grouping cargos by cargoType
    _forEach(cargoData.value.facility.outgoingCargo, cargo => {
      if (!sorted[cargo.type]) sorted[cargo.type] = []
      sorted[cargo.type].push(cargo)

    })
    // Sorting each list by remaining offer time
    for (let cargoType in sorted) {
      sorted[cargoType] = sortByProperty(sorted[cargoType])
    }

    return sorted
  })

  const sortedVehicleOffers = computed(() => {
    if (!cargoData.value || !cargoData.value.facility) return []
    return sortByProperty(cargoData.value.facility.vehicleOffers)
  })

  const sortedTrailerOffers = computed(() => {
    if (!cargoData.value || !cargoData.value.facility) return []
    return sortByProperty(cargoData.value.facility.trailerOffers)
  })

  const sortedAcceptedOffers = computed(() => {
    if (!cargoData.value) return []
    return sortByProperty(cargoData.value.player.acceptedOffers)
  })

  const loanerOffers = computed(() => {
    if (!cargoData.value || !cargoData.value.facility || !cargoData.value.facility.loanableVehicles) return []
    let result = []
    result = result.concat(cargoData.value.facility.loanableVehicles)
    return result
  })


  const menuClosed = () => {
    cargoData.value = undefined
    dropDownData.value = {}
    selectedFilter.value = facilityFilter
    selectedCargo.value = undefined
    lua.career_modules_delivery_cargoScreen.showCargoRoutePreview(undefined)
    loadingPrompt && loadingPrompt.close(null)
  }

  // Actions
  const requestCargoData = (_facilityId, _parkingSpotPath, updateMaxTimeStamp) => {
    facilityId = _facilityId
    parkingSpotPath = _parkingSpotPath
    lua.career_modules_delivery_cargoScreen.requestCargoDataForUi(facilityId, parkingSpotPath, updateMaxTimeStamp)
    if (updateMaxTimeStamp != false) newCargoAvailable.value = false

  }
  const requestCargoDataSimple = () => {
    requestCargoData(facilityId, parkingSpotPath, false)
  }

  const moveCargoToLocation = (cargoId, targetLocation, skipRequest) => {
    lua.career_modules_delivery_cargoScreen.moveCargoFromUi(cargoId, targetLocation)
    if(!skipRequest) requestCargoData(facilityId, parkingSpotPath, false)
  }

  const requestMoveCargoToLocation = (cargoId, moveData, skipRequest) => {
    //console.log(cargoId, moveData, skipRequest)
    if (moveData.extraData) {
      openThrowAwayPopup(cargoId, moveData.location, "Throw this cargo away with a " + moveData.extraData.penalty.toFixed(2) + " penalty?")
    } else {
      moveCargoToLocation(cargoId, moveData.location, skipRequest)
    }
  }

  async function openThrowAwayPopup(cargoId, targetLocation, message) {
    const res = await openConfirmation(null, message)
    if (res) {
      moveCargoToLocation(cargoId, targetLocation)
    } else {
      // the value of the dropdown needs to be reset here and we do it in the lazy way by resetting all the cargo data
      setCargoData()
    }
  }

  const setCargoData = data => {
    let previousCardId
    if(selectedCargo.value) {
      previousCardId = selectedCargo.value.cardId
    }
    if (data) cargoData.value = data

    dropDownData.value = {}
    if (!cargoData.value.player) return
    if (!cargoData.value.player.vehicles) return

    getAutomaticRoute(data.settings.automaticRoute)
    getDetailedDropOff(data.settings.detailedDropOff)

    // we call this here to redraw the best route
    if (automaticRoute.value) {
      setAutomaticRoute(automaticRoute.value)
    }

    filterSets.value = data.filterSets
    filterSets.value.unshift(facilityFilter)

    for(let filter of filterSets.value) {
      filterSetsByValue.value[filter.value] = filter
    }

    if(!selectedFilter.value)
      selectedFilter.value = filterSets.value[0]

    //re-select previous card if we can
    if(previousCardId) {
      onCargoSelected(cargoData.value.cardsById[previousCardId])
    }

    tutorialInfo.value = data.tutorialInfo
  }

  const highlightedCards = ref({})
  const highlightCardIds = highlightedIdMap => {
    highlightedCards.value = highlightedIdMap
  }

  const highlightFacilityIds = highlightedIdMap => {
    cargoHighlighted.value = Object.keys(highlightedIdMap).length > 0

    if (cargoData.value && cargoData.value.facility) {
      _forEach(cargoData.value.facility.materialStorageData, storage => {
        storage.highlight = false
        _forEach(storage.locations, loc => {
          loc.highlight = highlightedIdMap && highlightedIdMap[loc.id]
          storage.highlight = storage.highlight || loc.highlight
        })
      })
    }
  }

  const focusedCargo = ref()
  const hoveredCargo = ref()
  const selectedCargo = ref()
  const onCargoHovered = (cargo) => {
    // if(!cargo && selectedCargo.value)
    //   focusedCargo.value = selectedCargo.value
    // else
      focusedCargo.value = cargo
    highlightRoute(focusedCargo.value)
  }

  const onCargoSelected = (cargo) => {
    selectedCargo.value = cargo
  }

  const highlightRoute = (card) => {
    if(card ) {
      lua.career_modules_delivery_cargoScreen.showRoutePreview(card.route)
    } else {
      lua.career_modules_delivery_cargoScreen.showRoutePreview(undefined)
    }
  }


  const setAutomaticRoute = (newValue, oldValue) => {
    if (newValue == oldValue) return
    lua.career_modules_delivery_general.setAutomaticRoute(newValue)
  }

  watch(() => automaticRoute.value, setAutomaticRoute)

  const getAutomaticRoute = enabled => {
    automaticRoute.value = enabled
  }

  const setDetailedDropOff = (newValue, oldValue) => {
    if (newValue == oldValue) return
    lua.career_modules_delivery_general.setDetailedDropOff(newValue)
  }

  watch(() => detailedDropOff.value, setDetailedDropOff)

  const getDetailedDropOff = enabled => {
    detailedDropOff.value = enabled
  }

  const setGroupingAndSorting = () => {
    /**
    lua.career_modules_delivery_general.setSetting("facilityGroupingIdx", facilityGroupingIdx.value)
    lua.career_modules_delivery_general.setSetting("facilitySortingIdx", facilitySortingIdx.value)
    lua.career_modules_delivery_general.setSetting("playerGroupingIdx", playerGroupingIdx.value)
    lua.career_modules_delivery_general.setSetting("playerSortingIdx", playerSortingIdx.value)
    **/
  }






  // actions from cargo screen




  const cardClicked = card => {
    switch (card.cardType) {
      case "parcelGroup":
        loadCargoAuto(card)
        break
      case "vehicleOffer":
        loadOffer(card)
        break
      case "storage":
        loadStorageCustom(card)
        break
    }
  }

  const cardDeselect = () => onCargoSelected()

  const cardHovered = card => {
    onCargoHovered(card)
  }

  const clearLoad = cargo => {
    for (let id of cargo.ids) {
      lua.career_modules_delivery_cargoScreen.clearTransientMoveForCargo(id)
    }
    requestCargoDataSimple()
  }

  const throwAway = card => {
    loadingPrompt = addPopup(CargoLoadPopup,{cargo: card, throwAway: true}).promise
  }

  const changeDistribution = cargo => {

    // find the card that has the id that this player cargo is coming from
    for(const [id, card] of Object.entries(cargoData.value.cardsById)) {
      if(card.isFacilityCard && card.cardType == "parcelGroup") {
        if(card.ids.includes(cargo.ids[0])) {
          loadCargoCustom(card)
          return
        }
      }
    }
  }

  const modifyMaterialLoad = cargo => {
    // find the card that has the id that this player cargo is coming from
    for(const [id, card] of Object.entries(cargoData.value.cardsById)) {
      if(card.isFacilityCard && card.cardType == "storage" && card.storage.materialType == cargo.materialType) {
          loadStorageCustom(card)
          return
      }
    }
  }

  const loadCargoAuto = cargo => {
    // clear all transient moves for this group
    for (let id of cargo.ids) {
      lua.career_modules_delivery_cargoScreen.clearTransientMoveForCargo(id)
    }
    //if(cargo.transientMoveCounts <= 0) {
      let idx = 0
      for(let loc of cargo.autoLoadLocations) {
        lua.career_modules_delivery_cargoScreen.moveCargoFromUi(cargo.ids[idx], loc)
        idx++;
      }
    //}
    requestCargoDataSimple()

  }

  let loadingPrompt = null
  const loadCargoCustom = (card) => {
    if(card.transientMove) {
      let cargoId = card.ids[0]
      for(const [id, otherCard] of Object.entries(cargoData.value.cardsById)) {
        if(otherCard.isFacilityCard && otherCard.cardType == "parcelGroup" && otherCard.ids.includes(cargoId)) {
          loadingPrompt = addPopup(CargoLoadPopup,{cargo: otherCard}).promise
          return
        }
      }
    } else {
      loadingPrompt = addPopup(CargoLoadPopup,{cargo: card}).promise
    }
  }
  const loadStorageCustom = (storageData) => {
    loadingPrompt = addPopup(CargoLoadPopup,{storageData: storageData}).promise
  }
  const loadOffer = (offer) => {
    //loadingPrompt = addPopup(CargoLoadPopup,{cargo: cargo}).promise
    lua.career_modules_delivery_cargoScreen.toggleOfferForSpawning(offer.id)
    requestCargoDataSimple()
  }

  const loadLoaner = (offer) => {
    //loadingPrompt = addPopup(CargoLoadPopup,{cargo: cargo}).promise
    lua.career_modules_loanerVehicles.markForSpawning(offer)
    requestCargoDataSimple()
  }

  const returnLoaner = vehId => {
    lua.career_modules_loanerVehicles.returnVehicle(vehId).then(() => {
      requestCargoDataSimple()
    })
  }

  async function abandonOffer(card) {
    let message = "Abandon " + card.name + "? There is a " + card.abandonInfo.penaltyMoney + "$ penalty."
    const res = await openConfirmation(null, message)
    if (res) {
      lua.career_modules_delivery_cargoScreen.abandonAcceptedOffer(card.abandonInfo.vehId)
      requestCargoDataSimple()
    }
  }


  const dispose = () => {
    events.off("cargoDataForUiReady")
    events.off("newCargoAvailable")
    events.off("sendHighlightedCardIds")
    events.on("requestCargoDataSimple")
  }

  events.on("automaticRouteSet", getAutomaticRoute)
  events.on("cargoDataForUiReady", setCargoData)
  events.on("newCargoAvailable", () => (newCargoAvailable.value = true))
  events.on("sendHighlightedCardIds", highlightCardIds)
  events.on("requestCargoDataSimple",requestCargoDataSimple)

  return {
    cargoData,
    tutorialInfo,
    sortedParcelOffersByCargoType,
    sortedVehicleOffers,
    sortedTrailerOffers,
    sortedAcceptedOffers,
    onCargoHovered,
    onCargoSelected,
    loanerOffers,
    dropDownData,
    newCargoAvailable,
    cargoHighlighted,
    automaticRoute,
    detailedDropOff,
    setGroupingAndSorting,
    requestCargoData,
    requestCargoDataSimple,
    requestMoveCargoToLocation,
    menuClosed,
    dispose,
    focusedCargo,
    selectedCargo,

    cardClicked,
    cardHovered,
    cardDeselect,
    clearLoad,
    changeDistribution,
    loadCargoAuto,
    loadCargoCustom,
    throwAway,
    loadStorageCustom,
    loadOffer,
    abandonOffer,
    loadLoaner,
    returnLoaner,
    modifyMaterialLoad,

    filterSets,
    filterSetsByValue,
    selectedFilterRef,
    selectedFilter,
    selectFilter,
    highlightedCards,
    openCargoScreenSettings,

    nextFacilityGrouping,
    nextFacilitySorting,
    nextPlayerGrouping,
    nextPlayerSorting,
    facilityGroupingKey,
    facilitySortingKey,
    playerGroupingKey,
    playerSortingKey,
    facilityGroupings,
    facilitySortings,
    playerGroupings,
    playerSortings,
    currentFilterTutorialInfo,

  }
})
