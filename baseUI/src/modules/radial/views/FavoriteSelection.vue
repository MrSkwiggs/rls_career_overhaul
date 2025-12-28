<template>
  <div class="backgroundContainer" >

    <div class="recovery-wrapper" bng-ui-scope="favoriteSelection" v-if="data.dynamicSlotKey">
      <BngCard>
        <BngCardHeading type="ribbon"> Assign Action to: {{ data.dynamicSlotData.breadcrumbs[0] }} </BngCardHeading>
        <div class="current-action-container">
          <div class="current-action-label">Currently Assigned Action:</div>
          <div v-if="data.dynamicSlotData.mode === 'uniqueAction' &&data.uniqueAction">
            <BngIcon v-if="data.uniqueAction.icon" :type="icons[data.uniqueAction.icon]" />
            {{ data.uniqueAction.title ? $translate.instant(data.uniqueAction.title) : data.uniqueAction.niceName }}
          </div>
          <div v-if="data.dynamicSlotData.mode === 'recentActions'">
            <BngIcon :type="icons.timer" />
            Most Recent Action
          </div>
          <div v-if="data.dynamicSlotData.mode === 'empty'">
            <BngIcon :type="icons.circleSlashed" />
            Empty
          </div>
        </div>
        <div class="divider">

        </div>
        <div class="content" v-if="data.items">
          <FavoriteSelectionItem :data="data.items" @added-function="addedFunction" @removed-function="removeFunction"/>
        </div>

        <BngButton class="cancel-button" v-bng-on-ui-nav:back,menu.asMouse @click="close()" :accent="'attention'">
          <BngBinding
            class="input-icon"
            ui-event="back"
            controller
            />
          Cancel
        </BngButton>
      </BngCard>
    </div>
  </div>
</template>

<script setup>
import { BngButton, ACCENTS, BngCard, BngCardHeading, BngImageTile, BngDivider, BngUnit, icons, BngIcon, BngBinding } from "@/common/components/base"
import { onMounted, ref, onUnmounted } from "vue"
import { lua, useBridge } from "@/bridge"
import { vBngDisabled, vBngFocusIf, vBngOnUiNav, vBngClick,vBngBlur } from "@/common/directives"
import { useGameContextStore } from "@/services"
import { openConfirmation } from "@/services/popup"
import { useUINavScope, getUINavServiceInstance, UI_EVENTS } from "@/services/uiNav"
// import { default as UINavEvents, UI_EVENTS } from "@/bridge/libs/UINavEvents"

import { $translate } from "@/services/translation"
import { Accordion, AccordionItem } from "@/common/components/utility"
import FavoriteSelectionItem from "../components/FavoriteSelectionItem.vue"

const { events } = useBridge()

useUINavScope("favoriteSelection")

const emit = defineEmits(["return"])
const gameContextStore = useGameContextStore()
const { closeRecoveryPrompt } = gameContextStore

let data = ref({})

const updateFavoritePopupData = () => {
  lua.core_quickAccess.getDynamicSlotConfigurationData().then(value => (data.value = value))
}

events.on("radialFavoriteSelectionPopupData", updateFavoritePopupData)

const addedFunction = (item) => {
  let config = {
    uniqueID: item.uniqueID,
    level: item.level,
    type: item.type,
    mode: item.mode || "uniqueAction",
  }
  console.log("addedFunction", config)
  lua.core_quickAccess.setDynamicSlotConfiguration(data.value.dynamicSlotKey, config)
  emit("return", true)
}

const removeFunction = () => {
  lua.core_quickAccess.removeActionFromQuickAccess(data.value.slotIndex)
  emit("return", true)
}

const close = () => {
  emit("return", true)
}

const setEmpty = () => {
  let config = {
    mode: "empty",
  }
  lua.core_quickAccess.setDynamicSlotConfiguration(data.value.dynamicSlotKey, config)
  emit("return", true)
}

const setRecentActions = (type) => {
  let config = {
    mode: "recentActions",
    type: type
  }
  lua.core_quickAccess.setDynamicSlotConfiguration(data.value.dynamicSlotKey, config)
  emit("return", true)
}

const start = () => {
  updateFavoritePopupData()
}

const kill = () => {
  events.off("radialFavoriteSelectionPopupData", updateFavoritePopupData)
  if (window.bngVue.getCurrentRoute().name == "unknown") getUINavServiceInstance().setFilteredEventsAllExcept(UI_EVENTS.menu, UI_EVENTS.pause, UI_EVENTS.center_cam)
  // UINavEvents.setFilteredEvents.allExcept(UI_EVENTS.menu, UI_EVENTS.pause, UI_EVENTS.center_cam)
}

onMounted(start)
onUnmounted(kill)
</script>

<script>
import { popupPosition, popupContainer } from "@/services/popup"
export default {
  wrapper: {
    fade: true, // everything but popup will fade away (become semi-transparent and desaturated)
    blur: true, // fullscreen in-game blur
    style: popupContainer.transparent, // can be multiple in array
  },
  position: [popupPosition.center, popupPosition.center], // can be single w/o array
}
</script>

<style scoped lang="scss">
@use "@/styles/modules/density" as *;
@use "@/styles/modules/mixins" as *;

.backgroundContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh; /* Full viewport height */
  width: 100vw; /* Full viewport width */
  background: rgba(0, 0, 0, 0.521);
}
.recovery-wrapper {
  color: white;
  width: 40rem;
  :deep(.bng-card) {
    background-color: rgba(0, 0, 0, 0.8);
  }

  .current-action-container {
    display: flex;
    flex-flow: column;
    align-items: center;
    justify-content: center;
    padding: 0.5em 0.5em;
    padding-top: 0;
    font-size: 1.4rem;
    .current-action-label {
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.5);
    }
  }
  .divider {
    content: none;
    background: rgba(255, 255, 255, 0.25);
    height: 1px;
    width: 100%;
  }

  .content {
    height: 70vh;
    overflow: auto;
    display: flex;
    flex-flow: column;
    align-content: baseline;
    justify-content: flex-start;
    padding: 0.5em 0.5em;
  }


  .item-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 2.25rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--bng-corners-1);
    transition: background-color 0.2s ease;
    box-sizing: border-box;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }

  .item-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
    padding: 0.5rem;
  }

  .select-button {
    min-width: 10rem;
    height: 2.0rem;
    font-size: 1rem;
  }

  .cancel-button {
    max-width: 100%;
  }
}

.favorite-selection-item {
  width: 100%;
}
.item-content {
  display: flex;
  align-items: center;
}
.item-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 2rem;
}
.indented {
  margin-left: 1rem;
}
</style>
