<template>
  <BngCard
    v-bng-scoped-nav="{ canDeactivate, canBubbleEvent }"
    v-bng-sound-class="'bng_hover_generic'"
    v-bng-disabled="internalDisabled"
    :backgroundImage="preview"
    :footerStyles="cardFooterStyles"
    :hideFooter="!expanded && !isManage"
    :class="{ 'profile-card-active': active, 'manage-active': isManage, 'profile-outdated': incompatibleVersion }"
    :animateFooterDelay="expanded ? '0s' : '0.1s'"
    animateFooterType="slide"
    class="profile-card"
    @activate="onScopeChanged(true)"
    @deactivate="onScopeChanged(false)"
    @focusin.self="onFocused(true)"
    @focusout.self="onFocused(false)"
    @mouseover="onHover(true)"
    @mouseleave="onHover(false)">
    <div class="profile-card-cover">
      <div class="profile-card-container">
        <div class="profile-card-title">{{ $ctx_t(id) }}</div>
        <div v-if="!isManage" class="profile-card-date">
          <span v-if="active">{{ $ctx_t("ui.career.nowplaying") }}</span>
          <span v-else>{{ $ctx_t("ui.career.lastplayed") }} {{ lastPlayedDescription }}</span>
        </div>
      </div>
    </div>
    <div class="profile-card-content" v-bng-on-ui-nav:menu,back="goBack">
      <div v-if="isManage" class="profile-manage">
        <div v-if="currentMenu === MENU_ITEMS.RENAME" class="profile-manage-rename">
          <BngInput
            v-model="saveName"
            :maxlength="PROFILE_NAME_MAX_LENGTH"
            :validate="validateFn"
            :errorMessage="nameError"
            externalLabel="Save Name"
            @keydown.enter.prevent />
        </div>
        <div v-else-if="currentMenu === MENU_ITEMS.DELETE" class="profile-manage-delete">
          <span>
            {{ $ctx_t("ui.career.deletePrompt") }}
          </span>
          <BngButton
            v-bng-on-ui-nav:ok.asMouse.focusRequired
            v-bng-sound-class="'bng_click_generic'"
            :label="$ctx_t('ui.common.yes')"
            accent="attention"
            @click="deleteProfile" />
          <BngButton
            v-bng-on-ui-nav:ok.asMouse.focusRequired
            v-bng-sound-class="'bng_cancel_generic'"
            :label="$ctx_t('ui.common.no')"
            accent="secondary"
            @click="goBack" />
        </div>
        <div v-else class="profile-manage-main">
          <BngButton
            v-bng-on-ui-nav:ok.asMouse.focusRequired
            v-bng-sound-class="'bng_click_generic'"
            accent="secondary"
            :label="$ctx_t('ui.career.rename')"
            :disabled="active"
            @click="() => (currentMenu = MENU_ITEMS.RENAME)" />
          <BngButton
            v-bng-on-ui-nav:ok.asMouse.focusRequired
            v-bng-sound-class="'bng_click_generic'"
            accent="secondary"
            :label="$ctx_t('ui.career.delete')"
            :disabled="active"
            @click="() => (currentMenu = MENU_ITEMS.DELETE)" />
          <BngButton :label="$ctx_t('ui.career.mods')" accent="secondary" disabled />
          <BngButton :label="$ctx_t('ui.career.backup')" accent="secondary" disabled />
        </div>
      </div>
      <ProfileStatus v-else :branches="branches" :beamXP="beamXP" :vouchers="vouchers" :vehicleCount="vehicleCount" :money="money" :insuranceScore="insuranceScore" />
      <!--
      <div v-if="expanded" class="profile-card-content-footer">
        <span><BngIcon :type="icons.car" /> × {{ vehicleCount }}</span>
      </div>
    -->
    </div>
    <template #buttons>
      <template v-if="isManage">
        <BngButton
          v-if="currentMenu === MENU_ITEMS.RENAME"
          v-bng-on-ui-nav:ok.asMouse.focusRequired
          v-bng-sound-class="'bng_click_generic'"
          :disabled="nameError !== null || saveName === props.id"
          @click="updateProfileName">
          Save
        </BngButton>
        <BngButton v-bng-on-ui-nav:ok.asMouse.focusRequired v-bng-sound-class="'bng_cancel_generic'" accent="outlined" @click="goBack"> Back </BngButton>
      </template>
      <template v-else>
        <BngButton v-bng-on-ui-nav:ok.asMouse.focusRequired v-bng-sound-class="'bng_click_generic'" accent="outlined" @click="enableManage">Manage </BngButton>
        <BngButton
          v-bng-on-ui-nav:ok.asMouse.focusRequired
          v-bng-sound-class="'bng_click_generic'"
          @click="$emit('load', id)"
          :disabled="active || incompatibleVersion"
          >Load
        </BngButton>
      </template>
    </template>
  </BngCard>
</template>

<script>
const MENU_ITEMS = {
  RENAME: "rename",
  DELETE: "delete",
}
</script>

<script setup>
import { computed, inject, ref, watch, nextTick, reactive } from "vue"
import { BngButton, BngCard, BngInput, BngIcon, icons } from "@/common/components/base"
import { vBngScopedNav, vBngSoundClass, vBngOnUiNav, vBngDisabled } from "@/common/directives"
import { timeSpan } from "@/utils/datetime"
import { lua } from "@/bridge"
import { PROFILE_NAME_MAX_LENGTH } from "../../stores/profilesStore"
import ProfileStatus from "./ProfileStatus.vue"

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  creationDate: {
    type: String,
    required: true,
  },
  incompatibleVersion: Boolean,
  outdatedVersion: {
    type: Boolean,
    required: true,
  },
  preview: {
    type: String,
    default: "/ui/modules/career/profilePreview_WCUSA.jpg",
  },
  beamXP: Object,
  vouchers: Object,
  vehicleCount: Number,
  money: Object,
  insuranceScore: Object,
  active: Boolean,
  branches: Array,
  disabled: Boolean,
})

const emit = defineEmits(["card:activate", "load", "rename"])

const isActivated = ref(false)
const isManage = ref(false)
const currentMenu = ref(null)
const expanded = ref(false)
const internalDisabled = ref(false)
const cardStates = reactive({
  focused: false,
  hovered: false,
})

const validateName = inject("validateName")
const nameError = ref(null)

const lastPlayedDescription = computed(() => timeSpan(props.date))

watch(
  () => props.disabled,
  value => {
    nextTick(() => {
      internalDisabled.value = value
      if (value) expanded.value = false
    })
  }
)

const onScopeChanged = value => {
  isActivated.value = value
}

const cardFooterStyles = {
  "background-color": "hsla(217, 22%, 12%, 1)",
}

// TODO: seems hacky but will be updated when input validation has been improved
const validateFn = name => {
  let res = validateName(name)

  // if unedited, don't show error
  if (name === props.id) res = null

  if (!res) {
    nameError.value = null
  } else {
    nameError.value = res
  }

  return !res
}

const canDeactivate = () => {
  return !isManage.value
}

// allow to navigate to menu even if inside the card but not in manage menu
const canBubbleEvent = e => {
  return e.detail.name === "menu" && !isManage.value
}

function onFocused(focused) {
  cardStates.focused = focused
  updatedExpanded()
}

function onHover(hover) {
  cardStates.hovered = hover
  updatedExpanded()
}

function updatedExpanded() {
  const enable = cardStates.focused || cardStates.hovered
  if (!enable && (isActivated.value || isManage.value)) return
  expanded.value = enable
}

function enableManage(enable = true) {
  nextTick(() => (isManage.value = enable))
  if (enable && !isActivated.value) isActivated.value = true
  emit("card:activate", enable)
}

function goBack() {
  saveName.value = props.id

  if (currentMenu.value) {
    currentMenu.value = null
  } else if (isManage.value) {
    enableManage(false)
  } else {
    return true
  }
}

// START Manage Menu
const saveName = ref(props.id)

const deleteProfile = () => {
  lua.career_saveSystem.removeSaveSlot(props.id)
  lua.career_career.sendAllCareerSaveSlotsData()
}

const updateProfileName = () => emit("rename", saveName.value)
// END Manage Menu
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

.profile-card {
  font-size: calc-ui-rem();

  // temp
  border-radius: calc-ui-rem(0.5) !important;
  :deep(.bng-button) {
    font-size: calc-ui-rem() !important;
    line-height: calc-ui-rem(1.5) !important;
    margin: calc-ui-rem(0.25) !important;
    &,
    .background {
      border-radius: calc-ui-rem(0.25) !important;
    }
  }
  :deep(.bng-progress-bar) {
    font-size: calc-ui-rem() !important;
  }

  &.profile-card-active {
    :deep() {
      > :last-child {
        border-bottom: 0.3em solid var(--bng-orange-400);
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }
    }
  }

  &.manage-active {
    .profile-card-cover {
      flex: 0.5 0.0001 auto;
    }

    .profile-card-content {
      flex: 1 1 auto;
      justify-content: start;


    }
  }

  &.profile-outdated {
    background-color: #808080 !important;
    background-blend-mode: luminosity;
  }
}

.profile-card[disabled="disabled"] {
  pointer-events: none;
}

.profile-card-cover {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1em 0;
  flex: 1 0.0001 auto;
  border-radius: var(--bng-corners-1) var(--bng-corners-1) 0 0;
  overflow: hidden;
  color: #fff;

  > .profile-card-container {
    position: absolute;
    display: flex;
    flex-direction: column;
    max-width: 80%;
    align-items: flex-start;
    font-family: "Overpass", var(--fnt-defs);

    > .profile-card-title {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      max-width: 100%;
      font-weight: 900;
      font-size: 2em;
      letter-spacing: 0.02em;
      line-height: 1.2em;
      padding: 0 0.5em;
      background-color: var(--bng-black-6);
      font-family: "Overpass", var(--fnt-defs);
      overflow: hidden;
    }

    > .profile-card-date {
      letter-spacing: 0.02em;
      line-height: 1.2em;
      padding: 0.25em 1em;
      background-color: var(--bng-black-6);
    }
  }
}

.profile-card-content {
  display: flex;
  flex: 0.0001 1 auto;
  flex-flow: column;
  justify-content: space-between;
  align-items: stretch;
  // padding: 0 1em 1em;
  overflow: hidden;
  // background: hsla(217, 22%, 12%, 1);

  .profile-card-content-footer {
    background: hsla(217, 22%, 12%, 1);
    color: white;
    padding: 0.5em 0.5em 0.5em 0.5em;
    margin-top: auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

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
    margin-right: calc-ui-rem(0.75);
  }
}
</style>
