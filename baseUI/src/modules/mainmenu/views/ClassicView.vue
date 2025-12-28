<template>
  <div class="center-wrap">
    <div class="buttons">
      <div class="primary">
        <MenuButton
          v-bng-ui-nav-focus="firstTime ? undefined : 0"
          size="big"
          icon-id="road"
          :bg-img="IMG_PATH + 'freeroam.jpg'"
          @click="navigate('menu.levels')"
          class="big-button"
        >{{ $tt("ui.playmodes.freeroam") }}</MenuButton>
        <MenuButton
          v-bng-ui-nav-focus="firstTime ? undefined : 0"
          size="big"
          icon-id="keys1"
          :bg-img="IMG_PATH + 'experiences.jpg'"
          @click="emit('changeView', 'experience')"
          :tag="$t('ui.playmodes.new')"
          class="big-button"
        >{{ $tt("ui.playmodes.quickStartExperiences") }}</MenuButton>
      </div>

      <div class="secondary">
        <MenuButton
          size="medium"
          icon-id="star"
          @click="navigate('menu.campaigns')"
        >{{ $tt("ui.playmodes.campaigns") }}</MenuButton>
        <MenuButton
          size="medium"
          icon-id="clapperboard"
          @click="navigate('menu.scenarios')"
        >{{ $tt("ui.playmodes.scenarios") }}</MenuButton>
        <MenuButton
          size="medium"
          icon-id="stopwatchArrows02"
          @click="navigate('menu.quickraceOverview')"
        >{{ $tt("ui.playmodes.quickrace") }}</MenuButton>
        <MenuButton
          size="medium"
          :disabled="inGarage"
          :highlighted="inGarage"
          icon-id="carDealer"
          @click="startGarage()"
        >{{ $tt("ui.mainmenu.garage") }}</MenuButton>
        <MenuButton
          size="medium"
          icon-id="bus"
          @click="navigate('menu.busRoutes')"
        >{{ $tt("ui.playmodes.bus") }}</MenuButton>
        <MenuButton
          size="medium"
          icon-id="lightrunner"
          @click="navigate('menu.lightrunnerOverview')"
        >{{ $tt("ui.playmodes.lightRunner") }}</MenuButton>
        <MenuButton
          size="medium"
          :disabled="inGarage"
          icon-id="autobahn"
          @click="startTrackBuilder()"
        >{{ $tt("ui.playmodes.trackBuilder") }}</MenuButton>
        <MenuButton
          appear-disabled
          size="medium"
          icon-id="raceFlag"
          @click="rallyDisclaimer()"
          :tag="$t('ui.playmodes.comingSoon')" tag-dark-orange
        >{{ $tt("ui.playmodes.rally") }}</MenuButton>
        <MenuButton
          appear-disabled
          size="medium"
          icon-id="cup"
          @click="careerPrompt()"
          :tag="$t('ui.playmodes.comingSoon')" tag-dark-orange
        >{{ $tt("ui.playmodes.career") }}</MenuButton>
        <MenuButton
          size="medium"
          icon-id="movieCamera"
          @click="navigate('menu.replay')"
        >{{ $tt("ui.dashboard.replay") }}</MenuButton>
        <MenuButton
          size="medium"
          icon-id="chartBars"
          @click="navigate('menu.options.stats')"
        >{{ $tt("ui.statspage.title") }}</MenuButton>
        <MenuButton
          v-if="!SysInfo.mainMenuBackgroundRequired.value"
          size="medium"
          icon-id="radialMenu"
          @click="openRadialMenu()"
        >
          {{ $tt("ui.menu.openRadialMenu.name") }}
          <BngBinding style="font-size: 0.8em" action="toggleRadialMenuMulti"/>
        </MenuButton>

        <MenuButton
          v-for="(item, idx) in addons"
          :key="idx"
          size="medium"
          :icon-id="item.iconId"
          :icon="item.icon"
          @click="runAction(item.action)"
          :tag="$t('ui.mainmenu.mod')" tag-dark-green
        >{{ item.title }}</MenuButton>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from "vue"
import { ACCENTS, BngBinding } from "@/common/components/base"
import { vBngUiNavFocus } from "@/common/directives"
import MenuButton from "../components/MenuButton.vue"
import { useBridge } from "@/bridge"
import { SysInfo } from "@/services"
import { $translate } from "@/services"
import { openExperimental } from "@/services/popup"
const { lua } = useBridge()

const props = defineProps({
  addons: Object, // object with named buttons
  firstTime: Boolean,
})

const emit = defineEmits(["changeView"])

const IMG_PATH = "images/mainmenu/"

const inGarage = SysInfo.gameState.value === "garage"

// this should be in sync with main menu
const firstTime = ref(props.firstTime)
onMounted(() => firstTime.value && setTimeout(() => firstTime.value = false, 1500))

const navigate = (...state) => nextTick(() => window.bngVue.gotoGameState(...state))

const startGarage = () => lua.extensions.gameplay_garageMode.start()
const openRadialMenu = () => lua.core_quickAccess.setEnabled(true, "/root/", true)
const startTrackBuilder = () => lua.freeroam_freeroam.startTrackBuilder("glow_city")

async function careerPrompt() {
  if (await openExperimental(
    $translate.instant("ui.career.experimentalTitle"),
    $translate.instant("ui.career.experimentalPrompt"),
    [
      { label: $translate.instant("ui.common.no"), value: false, extras: { cancel: true, accent: ACCENTS.secondary } },
      // { label: "Enter and don't show this again", value: true },
      { label: $translate.instant("ui.career.experimentalAgree"), value: true, extras: { default: true } },
    ],
  ))
    // navigate("menu.career")
    navigate("profiles")
}

async function rallyDisclaimer() {
  if (await openExperimental(
    $translate.instant("ui.rally.experimentalTitle"),
    $translate.instant("ui.rally.experimentalPrompt"),
    [
      { label: $translate.instant("ui.common.back"), value: false, extras: { cancel: true, accent: ACCENTS.secondary } },
      { label: $translate.instant("ui.common.understood"), value: true, extras: { default: true } },
    ],
  ))
    navigate("menu.rally")
}

function runAction(action) {
  switch (typeof action) {
    case "function":
      nextTick(action)
      break
    case "string":
      navigate(action)
      break
    case "object":
      if (Array.isArray(action))
        navigate(...action)
      else
        navigate(action.state, action.params)
      break
  }
}
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

$button-width: var(--button-width, 16em);
$buttons-per-row: 4;
$rem: calc-ui-rem();

.center-wrap {
  align-self: center;
  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
  margin: 0 calc-ui-rem(15);
  max-width: 100%;
}

.buttons {
  display: flex;
  flex-flow: row nowrap;
  justify-content: stretch;
  align-items: flex-start;
  min-width: calc-ui-rem(64);
  margin-bottom: calc-ui-rem(2);
  --button-width: 13em;

  @media screen and (max-width: 800px) {
    --button-width: 13em;
  }

  .primary {
    flex: 0 0 auto;
    display: flex;
    flex-flow: column nowrap;
    .big-button {
      --button-height: 14em;
    }
    // :deep(.mainmenu-button.size-big) {
    //   width: 18em;
    // }
  }

  .secondary {
    flex: 1 1 auto;
    width: max-content;
    position: relative;
    display: flex;
    flex-flow: row wrap;
    justify-content: start;
    max-width: calc($button-width * $buttons-per-row + 1em * $buttons-per-row);
    --button-height: 6.75em;
  }
}
</style>
