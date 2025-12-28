import { computed, ref, watch, watchEffect, toRaw } from "vue"
import { defineStore } from "pinia"
import { lua, useBridge } from "@/bridge"

export const useMissionDetailsStore = defineStore("missionDetails", () => {
  const { events } = useBridge()

  const missions = ref([])
  const selectedMissionId = ref(null)
  const preselectedPage = ref(null)

  const userSettingsModel = ref({})
  const repairOptions = ref(null)
  const startOptionModel = ref(null)
  const activeObjectives = ref({})
  const context = ref(null)
  let sameUserSettingsAsLast = ref(false)
  // TODO: Change this and rename into basic info
  const selectedMission = computed(() => {
    if (!missions.value || missions.value.length === 0) return null

    const missionIndex = missions.value.findIndex(x => x.id === selectedMissionId.value)

    if (missionIndex === -1) return null

    const data = missions.value[missionIndex]
/*
    const ratings =
      data.currentProgressKey &&
      data.formattedProgress &&
      data.formattedProgress.formattedProgressByKey &&
      data.formattedProgress.formattedProgressByKey[data.currentProgressKey]
        ? data.formattedProgress.formattedProgressByKey[data.currentProgressKey]
        : null
*/
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      missionTypeLabels: [data.missionTypeLabel],
      images: data.previews,
      //ratings: ratings,
      startableDetails: {
        startable: data.unlocks.startable,
      },
      order: missionIndex,
      leagues: data.leagues,
      hasRules: data.hasRules,
      //currentProgressKey: data.currentProgressKey,
    }
  })

  const currentMission = computed(() => {
    if (!missions.value || missions.value.length === 0) return null

    const missionIndex = missions.value.findIndex(x => x.id === selectedMissionId.value)

    if (missionIndex === -1) return null

    return missions.value[missionIndex]
  })

  const entryFee = ref()
  const missionBasicInfo = computed(() => {
    if (!currentMission.value) return null

    // console.log('currentMission', JSON.stringify(currentMission.value, null, 2))

    if (currentMission.value.parentInfo) {
      return {
        id: currentMission.value.id,
        name: currentMission.value.parentInfo.name,
        icon: currentMission.value.parentInfo.icon,
        description: currentMission.value.parentInfo.description,
        missionTypeLabels: [currentMission.value.parentInfo.missionTypeLabel],
        images: currentMission.value.parentInfo.previews,
        additionalAttributes: currentMission.value.parentInfo.additionalAttributes,
        entryFee: entryFee.value,
        official: currentMission.value.official,
        author: currentMission.value.author,
        date: currentMission.value.parentInfo.date,
      }

    } else {
      return {
        id: currentMission.value.id,
        name: currentMission.value.name,
        icon: currentMission.value.icon,
        description: currentMission.value.description,
        missionTypeLabels: [currentMission.value.missionTypeLabel],
        images: currentMission.value.previews,
        additionalAttributes: currentMission.value.additionalAttributes,
        entryFee: entryFee.value,
        official: currentMission.value.official,
        author: currentMission.value.author,
        date: currentMission.value.date,
      }
    }
  })

  const missionProgressFromMission = (mission, activeObjectives) => {
    if (
      !mission ||
      !mission.formattedProgress ||
      !mission.formattedProgress.unlockedStars ||
      !mission.formattedProgress.unlockedStars.stars ||
       mission.formattedProgress.unlockedStars.disabled
    )
      return null

    const stars = mission.formattedProgress.unlockedStars.stars

    if (!stars || !stars.length ||stars.length === 0) return null

    let activeStars = []

    for (let star of stars) {
      let info = {
        enabled: false,
        order: star.globalStarIndex,
        isDefaultStar: star.isDefaultStar,
        key: star.key,
        label: star.label,
        rewards: star.rewards,
        unlocked: star.unlocked,
        count: star.count,
      }

      if (activeObjectives && activeObjectives.starInfo && activeObjectives.starInfo[star.key]) {
        info.enabled = activeObjectives.starInfo[star.key].enabled
        info.message = activeObjectives.starInfo[star.key].message
        info.visible = activeObjectives.starInfo[star.key].visible
        info.label = activeObjectives.starInfo[star.key].label
        info.rewards = activeObjectives.starInfo[star.key].rewards
      }

      activeStars.push(info)
    }

    return {
      stars: activeStars,
      message: activeObjectives.message,
      showMessage: activeStars.filter(x => !x.visible).length > 0,
    }
  }

  const missionProgress = computed(() => {
    return missionProgressFromMission(currentMission.value, activeObjectives.value)
  })

  const missionSettings = computed(() => {
    if (!currentMission.value || !currentMission.value.userSettings || currentMission.value.userSettings.length === 0) {
      return undefined;
    }

    return currentMission.value.userSettings;
  })

  const missionStartableDetails = computed(() => {
    if (!currentMission.value) {
      //console.log("no mission")
      return null
    }

    if (context.value === 'availableMissions') {
      const startable = currentMission.value.unlocks.startable

      if (!repairOptions.value && !startable) {
        console.log("no repair ooptions")
        return null
      }

      if (startOptionModel.value === "defaultStart"){
        let ret = { startableVisible: currentMission.value.unlocks.startable, startableEnabled: true }
        //console.log("default start", ret)
        return ret
      }

      const needsRepair = repairOptions.value ? repairOptions.value.length > 0 : false
      const repairType = repairOptions.value ? repairOptions.value.find(x => x.type === startOptionModel.value) : null
      //console.log("regular value")
      return {
        needsRepair,
        repairOptions: repairOptions.value,
        selectedRepairTypeLabel: repairType ? repairType.label : null,
        selectedRepairType: startOptionModel.value,

        startableVisible: true,
        startableEnabled: !needsRepair || repairType.enabled,
      }
    } else if (context.value === 'ongoingMission') {
      //console.log(currentMission.value.lastUserSettings)
      //console.log("ongoing mission")
      return {
        startableVisible: false,
        abandonVisible: true,
        restartVisible: true,
        continueVisible: true,
      }
    }
  })

  const formattedProgress = computed(() => {
    if (!currentMission.value) return null
    return currentMission.value.formattedProgress
  })

  const currentProgressKey = ref()
  const currentProgressKeyTranslation = ref()
  const currentProgress = ref()

  events.on("missionProgressKeyChanged", data => {
    currentProgressKey.value = data.progressKey
    currentProgressKeyTranslation.value = data.translation
    currentProgress.value = data.progress

    })

  const availableVehicles = computed(() => {
    return currentMission.value.userSettings && Array.isArray(currentMission.value.userSettings) ? currentMission.value.userSettings.filter(x => x.isVehicleSelector) : undefined
  })

  events.on("missionStartingOptionsForUserSettingsReady", data => {
    //console.log("missionStartingOptionsForUserSettingsReady", data)
    repairOptions.value = data.options && Array.isArray(data.options) && data.options.length > 0 ? data.options.filter(x => x.type) : null
    startOptionModel.value = repairOptions.value && repairOptions.value.length > 0 ? repairOptions.value[0].type : null
    entryFee.value = data.options && data.entryFee ? data.entryFee : null
  })

  const stopSelectedMissionWatcher = watch(
    () => selectedMissionId.value,
    () => {
      if (!currentMission.value) return

      const updatedSettings = {}
      if(currentMission.value.userSettings && currentMission.value.userSettings.length)
        currentMission.value.userSettings.forEach(x => (updatedSettings[x.key] = x.value))
      userSettingsModel.value = updatedSettings
    }
  )

  const stopSettingsWatcher = watch(
    () => userSettingsModel.value,
    async () => {
      // Get Active Stars
      const settings = Object.keys(userSettingsModel.value).map(key => ({ key, value: userSettingsModel.value[key] }))
      //console.log("stopSettingsWatcher", settings)

      const activeStars = await lua.extensions.gameplay_missions_missionScreen.getActiveStarsForUserSettings(selectedMissionId.value, settings)
      activeObjectives.value = { ...activeObjectives.value, ...activeStars }

      // Get Start/Repair Options
      lua.extensions.gameplay_missions_missionScreen.changeUserSettings(selectedMissionId.value, settings)
      lua.extensions.gameplay_missions_missionScreen.requestStartingOptionsForUserSettings(selectedMissionId.value, settings)


      // check if the current settings are the ones we last started with - if ongoing mission
      if (context.value === "ongoingMission") {
        sameUserSettingsAsLast.value = true


        for (let key in userSettingsModel.value) {
          sameUserSettingsAsLast.value = sameUserSettingsAsLast.value && currentMission.value && currentMission.value.lastUserSettings && (userSettingsModel.value[key] == currentMission.value.lastUserSettings[key])
        }
        for (let key in currentMission.value.lastUserSettings) {
          sameUserSettingsAsLast.value = sameUserSettingsAsLast.value && currentMission.value && currentMission.value.lastUserSettings && (userSettingsModel.value[key] == currentMission.value.lastUserSettings[key])
        }
      }
    },
    { deep: true }
  )

  const changeSettings = (key, value) => {
    userSettingsModel.value[key] = value
    if (currentMission.value.userSettings) {
      currentMission.value.userSettings.forEach(x => {
        if (x.key === key) {
          x.value = value
          if (x.type === 'select') {
            for (let option of x.values) {
              if (option.v === value) {
                x.currentOption = option
                break
              }
            }
          }
        }
      })
    }
  }

  const changeRepairType = type => (startOptionModel.value = type)

  const selectMission = missionId => {
    if (selectedMissionId.value === missionId) return
    selectedMissionId.value = missionId
    //console.log("###", missionId, missions.value)
  }

  const selectPreviousMission = () => {
    const index = missions.value.findIndex(x => x.id === selectedMissionId.value)
    const previousIndex = index > 0 ? index - 1 : missions.value.length - 1
    selectMissionByIndex(previousIndex)
  }

  const selectNextMission = () => {
    const index = missions.value.findIndex(x => x.id === selectedMissionId.value)
    const nextIndex = index < missions.value.length - 1 ? index + 1 : 0
    selectMissionByIndex(nextIndex)
  }

  const startMission = () => {
    const settings = Object.keys(userSettingsModel.value).map(key => ({ key, value: userSettingsModel.value[key] }))
    const startingOptions = startOptionModel.value ? { repair: {type: startOptionModel.value}} : {}
    lua.extensions.gameplay_missions_missionScreen.startMissionById(selectedMissionId.value, settings, startingOptions)
  }

  const abandonMission = () => {
    lua.extensions.gameplay_missions_missionScreen.stopMissionById(selectedMissionId.value, false, true)
  }


  const restartMission = () => {
    lua.core_recoveryPrompt.buttonPressed("restartMission", {type : "none"})
  }

  const reconfigureMission = () => {
    const settings = Object.keys(userSettingsModel.value).map(key => ({ key, value: userSettingsModel.value[key] }))
    lua.extensions.gameplay_missions_missionScreen.startFromWithinMission(selectedMissionId.value, settings)
  }

  const missionCards = ref([])
  const showMissionCards = ref(false)
  const isTutorialEnabled = ref(false)
  const customRecoveryOptionsActiveState = ref({})
  const hideReconfigureButton = ref(false)
  const hideRecoveryOptions = ref(false)

  const init = async () => {
    const data = await lua.extensions.gameplay_missions_missionScreen.getMissionScreenData()
    // console.log("mission details data", JSON.stringify(data.customRecoveryOptionsActiveState, null, 2))
    context.value = data.context
    let preselectedMissionId = null

    if (Array.isArray(data)) {
      missions.value = data
    } else if (data.hasOwnProperty("missions")) {
      missions.value = data.missions
      preselectedMissionId = data.selectedMissionId
      preselectedPage.value = data.selectedPage
    } else if (data.hasOwnProperty("mission")) {
      missions.value = [data.missions]
      preselectedMissionId = data.mission.id
      preselectedPage.value = data.selectedPage
    }

    // Convert boolean settings to select settings for all missions
    if (missions.value) {
      missions.value.forEach(mission => {
        if (mission.userSettings && mission.userSettings.length > 0) {
          // Filter out vehicle selectors and convert boolean settings to select settings
          mission.userSettings = mission.userSettings
            .map(setting => {
              if (setting.type === 'bool') {
                setting.type = 'select'
                setting.values = setting.value ? [
                  { l: setting.trueLabel || 'Enabled', v: true },
                  { l: setting.falseLabel || 'Disabled', v: false }
                ] : [
                  { l: setting.falseLabel || 'Disabled', v: false },
                  { l: setting.trueLabel || 'Enabled', v: true }
                ]
                setting.currentOption = {
                  l: setting.value ? (setting.trueLabel || 'Enabled') : (setting.falseLabel || 'Disabled'),
                  v: setting.value
                };
              }
              return setting;
            });
        }
      });
    }

    isTutorialEnabled.value = data.isTutorialEnabled

    if (missions.value) selectedMissionId.value = preselectedMissionId ? preselectedMissionId : missions.value[0].id

    userSettingsModel.value = {}
    customRecoveryOptionsActiveState.value = data.customRecoveryOptionsActiveState
    missionCards.value = data.missionCards
    showMissionCards.value = data.showMissionCards
    hideReconfigureButton.value = data.hideReconfigureButton
    hideRecoveryOptions.value = data.hideRecoveryOptions
  }

  function selectMissionByIndex(index) {
    if (index < 0 || index > missions.value.length - 1) {
      console.warn("Selected mission id not valid", index)
      return
    }

    selectedMissionId.value = missions.value[index].id
  }

  function dispose() {
    stopSelectedMissionWatcher()
    stopSettingsWatcher()
    events.off("missionStartingOptionsForUserSettingsReady")
    missionCards.value = []
  }

  return {
    missions,
    context,
    // availableMissions,
    selectedMission,
    missionBasicInfo,
    missionProgressFromMission,
    missionProgress,
    missionSettings,
    sameUserSettingsAsLast,
    missionStartableDetails,
    currentProgressKey,
    currentProgressKeyTranslation,
    currentProgress,
    formattedProgress,
    availableVehicles,
    userSettingsModel,

    missionCards,
    showMissionCards,
    isTutorialEnabled,
    customRecoveryOptionsActiveState,
    hideReconfigureButton,
    hideRecoveryOptions,
    preselectedPage,
    selectMission,
    selectPreviousMission,
    selectNextMission,
    startMission,
    abandonMission,
    reconfigureMission,
    restartMission,
    changeSettings,
    changeRepairType,
    init,
    dispose,
  }
})
