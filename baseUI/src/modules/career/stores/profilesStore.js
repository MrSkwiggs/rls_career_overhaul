import { computed, ref } from "vue"
import { defineStore } from "pinia"
import { lua } from "@/bridge"
import { $translate } from "@/services"

export const PROFILE_NAME_MAX_LENGTH = 100
export const PROFILE_NAME_PATTERN = /^[a-zA-Z0-9_]+$/

export const useProfilesStore = defineStore("profiles", () => {
  async function loadProfile(profileName, tutorialEnabled, isAdd = false) {
    console.log("profileStore.loadProfile", profileName, tutorialEnabled, isAdd)
    if (!profileName) {
      console.warn("profileStore.loadProfile: profileName is required. Not loading profile.")
      return false
    }

    if (profileName.length > PROFILE_NAME_MAX_LENGTH && isAdd) {
      console.warn("profileStore.loadProfile: profileName is too long. Not loading profile.")
      return false
    }

    console.log("profileStore.loadProfile: creating or loading career and starting", profileName)
    if (/^ +| +$/.test(profileName)) profileName = profileName.replace(/^ +| +$/g, "")
    const createOrLoadCareerAndStartResult = await lua.career_career.createOrLoadCareerAndStart(profileName, null, tutorialEnabled)
    console.log("profileStore.loadProfile: createOrLoadCareerAndStartResult", createOrLoadCareerAndStartResult)

    // TODO: The event should be done on lua side and add a listener here to broadcast this event
    const toastrMessage = isAdd ? "added" : "loaded"
    window.globalAngularRootScope.$broadcast("toastrMsg", {
      type: "info",
      msg: $translate.contextTranslate(`ui.career.notification.${toastrMessage}`),
      config: {
        positionClass: "toast-top-right",
        toastClass: "beamng-message-toast",
        timeOut: 5000,
        extendedTimeOut: 1000,
      },
    })
  }

  return { loadProfile }
})
