<template>
  <div class="center-wrap">
    <div class="primary">
      <MenuButton
        bng-scoped-nav-autofocus
        size="big"
        icon-id="keys1"
        :bg-img="IMG_PATH + 'experiences.jpg'"
        @click="emit('changeView', 'discover')"
        :tag="$t('ui.playmodes.new')"
      >{{ $tt("ui.playmodes.quickStartExperiences") }}</MenuButton>
      <MenuButton
        size="big"
        icon-id="road"
        :bg-img="IMG_PATH + 'freeroam.jpg'"
        @click="navigate('menu.freeroamWizard', { step: defaultWizardStep })"
      >{{ $tt("ui.playmodes.freeroam") }}</MenuButton>
      <MenuButton
        v-if="!$simplemenu.value"
        appear-disabled
        size="big"
        icon-id="cup"
        :bg-img="IMG_PATH + 'career.jpg'"
        @click="careerPrompt()"
        :tag="$t('ui.playmodes.comingSoon')" tag-orange
      >{{ $tt("ui.playmodes.career") }}</MenuButton>
      <MenuButton
        size="big-stacked"
        icon-id="BNGFolder"
        :bg-img="IMG_PATH + 'others.jpg'"
        @click="emit('changeView', 'others')"
      >{{ $tt("ui.mainmenu.more") }}</MenuButton>
    </div>
    <!--
    <div class="secondary" v-if="discover.loaded">
      <Shelf ref="elShelf" v-model="discover.lastSelectedIndex" :limit="7" fade>
        <MenuButton
          v-for="card in discover.allCards" :key="card.discoverId"
          size="medium" no-blur
          :disabled="!discover.enabled"
          :bg-img-abs="card.image"
          @click="elShelf?.isSelected($event) && card.onClick()"
          @mouseenter="card.onHover"
          @mouseleave="card.onMouseLeave"
          @focus="card.onFocus"
          @blur="card.onBlur"
          :enlarge-on-hover="true"
          darkened-image
          :text-icon-prefix="!!card.icon"
          :style="{ '--button-height': '4.5em' }"
          :tag="$ctx_t(card.tag)"
        >{{ $tt(card.name) }}</MenuButton>
      </Shelf>
    </div>
    -->
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from "vue"
import { ACCENTS } from "@/common/components/base"
import { Shelf } from "@/common/components/utility"
import { vBngUiNavFocus } from "@/common/directives"
import MenuButton from "../components/MenuButton.vue"
import { $translate } from "@/services"
import { openExperimental } from "@/services/popup"
import { useSettings } from "@/services/settings"
//import { useDiscoverStore } from "../discover.js"

const props = defineProps({
  firstTime: Boolean,
})

const emit = defineEmits(["changeView"])

//const discover = useDiscoverStore()
const elShelf = ref(null)

const IMG_PATH = "images/mainmenu/"

const settings = useSettings()
const defaultWizardStep = computed(() => {
  return settings.getValue('freeroamSetupDefaultStep') || 'level'
})

// this should be in sync with main menu
const firstTime = ref(props.firstTime)
onMounted(() => {
  firstTime.value && setTimeout(() => firstTime.value = false, 1500)
  //discover.loadDiscoverCards()
})

const navigate = (state, params = undefined) => nextTick(() => window.bngVue.gotoGameState(state, { params: params }))

async function careerPrompt() {
  if (await openExperimental(
    $translate.instant("ui.career.experimentalTitle"),
    $translate.instant("ui.career.experimentalPrompt"),
    [
      { label: $translate.instant("ui.common.no"), value: false, isCancel: true, extras: { accent: ACCENTS.secondary } },
      // { label: "Enter and don't show this again", value: true },
      { label: $translate.instant("ui.career.experimentalAgree"), value: true, default: true },
    ],
  ))
    // navigate("menu.career")
    navigate("profiles")
}
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

$rem: calc-ui-rem();

.center-wrap {
  align-self: center;
  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
  margin: 0 calc-ui-rem(15);
}

.primary {
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  min-width: calc-ui-rem(64);
  margin-bottom: calc-ui-rem(2);

  padding-right: 0.5em; // this is to compensate stacked button reduced size
}

.extras {
  color: white;
  margin-bottom: $rem;
  :deep(.card-cnt) {
    position: relative;
    max-width: 80em;
    padding: 1em;
    padding-top: 0;
    background-color: rgba(var(--bng-ter-blue-gray-800-rgb), 0.8);
    box-shadow: inset 0 0 0 calc-ui-rem(0.0625) rgba(var(--bng-ter-blue-gray-400-rgb), 0.6);
  }
}

.extra-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc-ui-rem(14), 1fr));
  align-items: stretch;
  justify-content: start;
  pointer-events: all;
  // &::after {
  //   content: "";
  //   flex: 1 1 calc(100% - 18.75rem - 1rem);
  // }
  :deep(.mainmenu-button) {
    height: auto;
    display: inline-flex;
    flex-flow: row nowrap;
    align-items: center;
    overflow: hidden;
    > * {
      flex: 0 1 auto;
    }
    .icon {
      height: 100%;
      max-height: 1.5em;
      margin-right: 0.3em;
    }
    .text {
      white-space: nowrap;
    }
  }
}

.secondary {
  margin-bottom: calc-ui-rem(2);
  --shelf-height: #{calc-ui-rem(5)};
}
</style>
