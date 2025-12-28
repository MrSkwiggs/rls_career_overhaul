<template>
  <WizardView
    title="Input Changes"
    class="wizard-view"
    :show-progress="false"
    finish-button-text="ui.common.continue"
    @wizard-finish="handleFinish"
  >
    <WizardStep
      id="buttonLayout"
      title="Extended Modifier Buttons"
      type="confirmation"
    >
      <div class="description" v-bng-ui-nav-scroll>
        <p>
          We updated the default button layout for Xbox and Playstation controllers using modifier buttons. Below you see the new default layout.
        </p>
        <p>
          <strong class="warning-text">If you made any changes to the default layout on Xbox or Playstation, we suggest you review your current layout and then either edit it or reset to the default if needed.</strong>
        </p>
        <BngButton :accent="ACCENTS.primary" @click="goToControls">
          Go to Controls
        </BngButton>
      </div>

      <div class="image-section">
        <h4>New Button Layout</h4>
        <div class="image-row">
          <img :src="getAssetURL('images/buttonLayout1.jpg')" alt="Button Layout" class="button-layout-image" />
          <img :src="getAssetURL('images/buttonLayout2.jpg')" alt="Button Layout" class="button-layout-image" />
        </div>
      </div>
    </WizardStep>
  </WizardView>
</template>

<script setup>
import { onMounted } from "vue"
import { WizardView, WizardStep } from "@/common/modules/wizard"
import { BngButton, ACCENTS } from "@/common/components/base"
import { vBngUiNavScroll } from "@/common/directives"
import { useSettings } from "@/services/settings"
import { getAssetURL } from "@/utils"

const settings = useSettings()

const handleFinish = async () => {
  await settings.apply({ showedInputLayoutPopupV37: true })
  window.bngVue.gotoGameState("menu.mainmenu")
}

const goToControls = async () => {
  await settings.apply({ showedInputLayoutPopupV37: true })
  window.bngVue.gotoGameState("menu.options.controls.bindings")
}

onMounted(async () => {
  await settings.waitForData()
})
</script>

<style scoped lang="scss">
.wizard-view {
  --wizard-width: 200rem;
  --wizard-height: 100rem;
}

.description {
  line-height: 1.6;
  overflow: hidden auto;

  @media (max-height: 700px) {
    min-height: 4em;
  }

  &.disabled-hint {
    opacity: 0.75;
    font-style: italic;
  }

  .warning-text {
    color: var(--bng-add-red-400);
  }
}

.image-section {
  text-align: center;

  h4 {
    color: var(--bng-off-white);
    margin-bottom: 1rem;
    font-size: 1.125rem;
    font-weight: 500;
  }

  .image-row {
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .button-layout-image {
    width: 48%;
    height: auto;
    display: block;
    border-radius: 0.5rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
}
</style>