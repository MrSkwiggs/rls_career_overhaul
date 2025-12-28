<template>
  <div class="center-wrap">
    <div class="others">
      <BngScreenHeading class="header" :divider="true" type="line">
        More
      </BngScreenHeading>
      <div class="buttons">
        <BackAside @click="emit('changeView', null)" />

        <MenuButton
          size="medium"
          icon-id="rallyHelmet"
          @click="rallyDisclaimer()"
          :tag="$t('ui.career.experimental.name')" tag-red
        >{{ $tt("ui.playmodes.rally") }}</MenuButton>
        <MenuButton
          size="medium"
          icon-id="gamepad"
          :tag="'New!'"
          @click="openGameplaySelector('openGameplaySelector')"
        >{{ $tt("Gameplay Selector") }}</MenuButton>
        <MenuButton
          bng-scoped-nav-autofocus
          size="medium"
          icon-id="flag"
          :tag="'Gameplay Filter'"
          @click="openGameplaySelector('openChallengesSelector')"
          >{{ $tt("ui.options.userInterface.showMissionMarkers") }}</MenuButton>
        <MenuButton
          bng-scoped-nav-autofocus
          size="medium"
          icon-id="star"
          :tag="'Gameplay Filter'"
          @click="openGameplaySelector('openCampaignsSelector')"
          >{{ $tt("ui.playmodes.campaigns") }}</MenuButton>
        <MenuButton
          size="medium"
          icon-id="clapperboard"
          :tag="'Gameplay Filter'"
          @click="openGameplaySelector('openScenariosSelector')"
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
          size="medium"
          icon-id="movieCamera"
          @click="navigate('menu.replay')"
        >{{ $tt("ui.dashboard.replay") }}</MenuButton>
        <MenuButton
          size="medium"
          icon-id="chartBars"
          @click="navigate('menu.options.stats')"
        >{{ $tt("ui.statspage.title") }}</MenuButton>
        <!--
        <MenuButton
          tag="DEV ONLY Fallback" tag-orange
          size="medium"
          icon-id="road"
          @click="navigate('menu.levels')"
        >{{ $tt("ui.playmodes.freeroam") }}</MenuButton>
        <MenuButton
          tag="DEV ONLY Fallback" tag-orange
          size="medium"
          icon-id="road"
          @click="navigate('menu.freeroamselector')"
        >{{ $tt("Freeroam (Vue)") }}</MenuButton>
        -->
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
import { nextTick } from "vue"
import { BngScreenHeading, ACCENTS } from "@/common/components/base"
import { vBngUiNavFocus } from "@/common/directives"
import { useBridge } from "@/bridge"
import { SysInfo } from "@/services"
import MenuButton from "../components/MenuButton.vue"
import BackAside from "../components/BackAside.vue"
import { $translate } from "@/services"
import { openExperimental } from "@/services/popup"
const { lua } = useBridge()

defineProps({
  addons: Object, // object with named buttons
})

const emit = defineEmits(["changeView"])

const inGarage = SysInfo.gameState.value === "garage"

const navigate = (...state) => {
  const stateName = state[0]
  window.bngVue.gotoGameState(stateName, { params: { mode: "mainMenuOthers" }, tryAngularJS: true, blankAngularJS: true})
}

const startGarage = () => lua.extensions.gameplay_garageMode.start()
const startTrackBuilder = () => lua.freeroam_freeroam.startTrackBuilder("glow_city")

const htmlBody = `
    <div style="text-align:center;vertical-align:top">
        <p>Bugs and missing features are expected.<br>Feedback is welcome at the <a href="http-external://go.beamng.com/rallyThread">rally thread</a>.</p>
        <div style="display:flex;flex-flow: row;flex-wrap: wrap;align-items: stretch;justify-content: space-around; margin-bottom:2em">
            <div style="flex: 0 0 45%;margin:0em 0.5em;">
                <div style="background-image:url('/ui/modules/rallyselect/right-30.svg'); background-size: contain; height:8em;background-repeat: no-repeat; background-position: center;"></div>
                <p><strong>RALLY STAGE</strong> <span style="font-weight: lighter">5-10 min</span></p>
                <ul style="align-items: left;">
                  <li style="text-align: left;">A traditional practice with unlimited attempts.</li>
                  <li style="text-align: left;">Improve your <strong>Survivor Pace</strong> by avoiding restarts.</li>
                  <li style="text-align: left;">Or drive flat out to focus on a best time.</li>
                </ul>
            </div>
            <div style="flex: 0 0 45%;margin:0em 0.5em;">
                <div style="background-image:url('/ui/modules/rallyselect/left-68.svg'); background-size: contain; height:8em;background-repeat: no-repeat; background-position: center;"></div>
                <p><strong>RALLY LOOP</strong> <span style="font-weight: lighter">40-60 min</span></p>
                <ul style="align-items: left;">
                  <li style="text-align: left;">Drive the <strong>liaisons</strong> between stages.</li>
                  <li style="text-align: left;">Stamp your Time Card at control points.</li>
                  <li style="text-align: left;">Avoid penalties from arriving <strong>late or early</strong>.</li>
                </ul>
                <p>Your priority is <strong>finishing</strong>.<p>
            </div>
        </div>
    </div>
`

async function rallyDisclaimer() {
  if (await openExperimental(
    $translate.instant("ui.rally.experimentalTitle"),
    htmlBody,
    [
      { label: $translate.instant("ui.common.back"), value: false, isCancel: true, extras: { accent: ACCENTS.secondary } },
      { label: $translate.instant("ui.common.understood"), value: true, default: true },
    ],
  ))
  // navigate("menu.rally")
  openGameplaySelector('openRallySelector')
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

function openGameplaySelector(action) {
  lua.ui_gameplaySelector_general[action]()
}
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

$button-width: 16em;
$buttons-per-row: 4;
$rem: calc-ui-rem();

.center-wrap {
  align-self: center;

  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
  margin: 0 calc-ui-rem(15);
}

.others {
  width: fit-content;
  max-width: calc(100% - 2em);
  margin-bottom: 3.5em;
  margin-left: auto;
  margin-right: auto;
}

.header {
  margin-left: calc-ui-rem(-4.25);
}

.buttons {
  position: relative;
  display: flex;
  flex-flow: row wrap;
  justify-content: start;
  max-width: calc($button-width * $buttons-per-row + 1em * $buttons-per-row);
}
</style>
