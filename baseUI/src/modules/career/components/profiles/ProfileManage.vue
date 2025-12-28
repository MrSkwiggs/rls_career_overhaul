<template>
  <div class="profile-manage">
    <div v-if="currentMenu === MENU_ITEMS.RENAME" v-bng-on-ui-nav:back="goBack" class="profile-manage-rename">
      <BngInput v-model="saveName" v-bng-focus-if="{ value: true, findNavItem: true }" :externalLabel="$ctx_t('ui.career.saveName')" />
    </div>
    <div v-else-if="currentMenu === MENU_ITEMS.DELETE" v-bng-on-ui-nav:back="goBack" class="profile-manage-delete">
      <span>
        {{ $ctx_t("ui.career.deletePrompt") }}
      </span>
      <BngButton v-bng-focus-if="true" v-bng-sound-class="'bng_click_generic'" :label="$ctx_t('ui.common.yes')" accent="attention" @click="deleteProfile" />
      <BngButton v-bng-sound-class="'bng_cancel_generic'" :label="$ctx_t('ui.common.no')" accent="secondary" @click="goBack" />
    </div>
    <div v-else v-bng-on-ui-nav:back="requestClose" class="profile-manage-main">
      <BngButton
        v-bng-sound-class="'bng_click_generic'"
        v-bng-focus-if="true"
        :label="$ctx_t('ui.career.rename')"
        accent="secondary"
        @click="changeMenu(MENU_ITEMS.RENAME, true)"
        :disabled="active" />
      <BngButton
        v-bng-sound-class="'bng_click_generic'"
        :label="$ctx_t('ui.career.delete')"
        accent="secondary"
        @click="changeMenu(MENU_ITEMS.DELETE, true)"
        :disabled="active" />
      <BngButton :label="$ctx_t('ui.career.mods')" accent="secondary" disabled />
      <BngButton :label="$ctx_t('ui.career.backup')" accent="secondary" disabled />
    </div>
  </div>
</template>

<script>
const MENU_ITEMS = {
  RENAME: "rename",
  DELETE: "delete",
}
</script>

<script setup>
import { computed, inject, ref } from "vue"
import { lua } from "@/bridge"
import { BngButton, BngInput } from "@/common/components/base"
import { vBngSoundClass } from "@/common/directives"
import { vBngOnUiNav, vBngUiNavFocus, vBngFocusIf } from "@/common/directives"
// import { useUINavScope } from "@/services/uiNav"

const props = defineProps({
  profileId: {
    type: String,
    required: true,
  },
  active: Boolean,
})

const emit = defineEmits(["activeMenuChanged", "requestClose"])
const isSaveNameValid = inject("isSaveNameValidFn")

// useUINavScope("profile-manage-scope")

// null is the root menu
const currentMenu = ref(null)

const saveName = ref(props.profileId)
const saveNameDisabled = computed(() => {
  if (props.profileId === saveName.value) return true
  return !isSaveNameValid(saveName.value)
})

const goBack = () => changeMenu(null)
const changeMenu = (menu, lock, closeManage = false) => {
  currentMenu.value = menu
  emit("activeMenuChanged", {
    menu,
    buttons: menu ? menuContextActionItems[menu] : undefined,
    lock,
    closeManage,
  })
}

// UINav back event for the root menu has to be handled here
// otherwise, putting it at root(i.e. ProfileManage component) will cause the back event
// to be processed twice, skipping root menu from sub-menu (delete and rename) and immediately closing `ProfileManage` view
const requestClose = () => {
  if (!currentMenu.value) emit("requestClose")
}

const deleteProfile = () => {
  lua.career_saveSystem.removeSaveSlot(props.profileId)
  lua.career_career.sendAllCareerSaveSlotsData()
}

const updateProfileName = async () => {
  await lua.career_saveSystem.renameSaveSlot(props.profileId, saveName.value)
  changeMenu(null, false, true)
  await lua.career_career.sendAllCareerSaveSlotsData()
}

const menuContextActionItems = {
  rename: [
    {
      props: { label: "Save", disabled: saveNameDisabled },
      events: { click: updateProfileName },
      soundClass: "bng_click",
    },
    {
      props: { label: "Cancel", accent: "outlined" },
      events: {
        click: goBack,
      },
      soundClass: "bng_cancel_generic",
      id: "cancel",
    },
  ],
  delete: [
    {
      props: {
        label: "Back",
        accent: "outlined",
      },
      events: { click: goBack },
      soundClass: "bng_cancel_generic",
    },
  ],
}

const onBack = () => {
  if (!currentMenu.value) {
    return true
  } else {
    goBack()
  }
}
</script>

<style lang="scss" scoped>
.profile-manage {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  justify-content: space-between;
  align-items: stretch;
  min-height: 12.5em;
  padding: 1em 0 1em 1em;
  color: #fff;
  background: hsla(217, 22%, 12%, 1);

  > .profile-manage-main {
    display: flex;
    flex-direction: column;
  }

  > .profile-manage-delete {
    display: flex;
    flex-direction: column;
  }

  > .profile-manage-rename {
    margin-right: 0.75rem;
  }
}
</style>
