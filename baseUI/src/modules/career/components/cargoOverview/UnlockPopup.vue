<template>
  <div class="unlock-wrapper" bng-ui-scope="cargoUnlockPopup">
    <BngCard>
      <BngCardHeading type="ribbon"> Level Up! </BngCardHeading>
      <div class="cardContent">
        <h3>{{reward.unlockPopupHeader}}</h3>
        Unlocks:
        <UnlockCard v-for="item in reward.branchLevels[reward.animationData.level-1].unlocks" class="tier-unlocks-item" :data="item" />
        <div class="acceptButton">
          <BngButton v-bng-on-ui-nav:ok="acceptClickHandler" :accent="ACCENTS.primary" @click="acceptClickHandler">
            <BngBinding ui-event="ok" deviceMask="xinput" /><span>Continue</span>
          </BngButton>
        </div>
      </div>
    </BngCard>
  </div>
</template>

<script setup>
import { BngButton, ACCENTS, BngCard, BngCardHeading, BngBinding } from "@/common/components/base"
import { vBngOnUiNav } from "@/common/directives"
import { useUINavScope } from "@/services/uiNav"
import UnlockCard from "../progress/UnlockCard.vue"

useUINavScope("cargoUnlockPopup")

const emit = defineEmits(["return"])

const props = defineProps({
  reward: Object,
})

const acceptClickHandler = () => {
  emit("return", true)
}

</script>

<script>
import { popupPosition, popupContainer } from "@/services/popup"
export default {
  wrapper: {
    fade: true, // everything but popup will fade away (become semi-transparent and desaturated)
    blur: true, // fullscreen in-game blur
    style: popupContainer.default, // can be multiple in array
  },
  position: [popupPosition.center, popupPosition.center], // can be single w/o array
}
</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

$text-color: white;

.unlock-wrapper {
  color: white;
  max-width: 32em;
}

:deep(.bng-card-wrapper)  {
  --bg-opacity: 1 !important;
}

.acceptButton {
  text-align: center;
}

.cardContent {
  padding: 1em;
}

</style>
