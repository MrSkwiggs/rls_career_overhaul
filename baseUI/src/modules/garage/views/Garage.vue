<template>
  <div
    class="garage-blackscreen"
    :class="{ 'garage-blackscreen-active': blackscreen }"
    v-bng-blur="blackscreen"
  ></div>

  <div
    v-if="loaded.init"
    class="garage-view"
    v-bng-scoped-nav="{ activateOnMount: true, bubbleWhitelistEvents: ['menu'], canDeactivate: canScopeDeactivate }"
    @deactivate="exit"
    v-bng-on-ui-nav:action_4="toggleSidemenu"
  >
    <div class="garage-row-title">
      <div class="headingContainer"><!-- TODO: this should use a component -->
        <div class="garage-title-sup" v-bng-blur>
          <h4>
            {{ $t("ui.mainmenu.garage") }}
            <template v-if="vehcomp">/ {{ vehicle.name }}</template>
          </h4>
        </div>
        <h2 class="garage-title-main" v-bng-blur>
          <BngButton
            v-if="vehcomp"
            class="garage-back-button"
            :class="{ 'garage-back-binding-shown': backBinding?.displayed }"
            :accent="backBinding?.displayed ? ACCENTS.ghost : ACCENTS.outlined"
            :icon="icons.arrowLargeLeft"
            bng-no-nav="true"
            @click="exit"
            v-bng-tooltip:top="!backBinding || backBinding?.displayed ? $t('ui.common.back') : undefined"
          >
            <BngBinding
              v-show="!sidemenuActive"
              ref="backBinding"
              class="back-binding"
              ui-event="back"
              controller
              track-ignore
            />
            {{ !backBinding?.displayed ? $t("ui.common.back") : "" }}
          </BngButton>
          <span>{{ vehcomp ? $t("ui.garage.tabs." + (vehcomp === 'tuning' ? 'tune' : vehcomp)) : vehicle.name }}</span>
        </h2>
      </div>
    </div>

    <div class="garage-row-main">
      <div class="garage-menu-container garage-menu-main">
        <!-- stand-alone garage -->
        <div v-if="!vehcomp" class="garage-menu garage-menu-primary">
          <GarageButton
            :icon="icons.engine"
            :active="vehcomp === 'parts'"
            @click="menuOpen('parts')"
            v-bng-disabled="!loaded.vehicle"
            v-bng-blur
            :bng-scoped-nav-autofocus="loaded.vehicle && !sidemenuActive && showIfController"
          >{{ $t("ui.garage.tabs.parts") }}</GarageButton>
          <!-- title: ui.garage.tabs.parts -->
          <GarageButton
            :icon="icons.wrench"
            :active="vehcomp === 'tuning'"
            @click="menuOpen('tuning')"
            v-bng-disabled="!loaded.vehicle"
            v-bng-blur
          >{{ $t("ui.garage.tabs.tune") }}</GarageButton>
          <!-- title: ui.garage.tune.tuning -->
          <GarageButton
            :icon="icons.sprayCan"
            :active="vehcomp === 'paint'"
            @click="menuOpen('paint')"
            v-bng-disabled="!loaded.vehicle"
            v-bng-blur
          >{{ $t("ui.garage.tabs.paint") }}</GarageButton>
          <!-- title: ui.garage.tabs.paint -->
          <GarageButton
            :icon="icons.star"
            :active="vehcomp === 'decals'"
            @click="launchLiveryEditor"
            v-bng-disabled="!loaded.vehicle"
            v-bng-blur
          >{{ $t("ui.garage.tabs.decals") }}</GarageButton>
          <!-- title: ui.garage.tabs.decals -->
        </div>
        <div v-if="!vehcomp" class="garage-menu garage-menu-secondary">
          <GarageButton
            :icon="icons.car"
            :active="vehcomp === 'vehicles'"
            @click="menuOpen('vehicles')"
            v-bng-disabled="!loaded.vehicle"
            v-bng-blur
          >{{ $t("ui.garage.tabs.vehicles") }}</GarageButton>
          <!-- title: none -->
          <GarageButton
            :icon="icons.keys1"
            :active="vehcomp === 'mycars'"
            @click="menuOpen('mycars')"
            v-bng-disabled="!loaded.vehicle"
            v-bng-blur
          >{{ $t("ui.garage.tabs.load") }}</GarageButton>
          <!-- title: ui.garage.load.loadCar -->
          <GarageButton
            :icon="icons.photo"
            @click="menuOpen('photo')"
            v-bng-disabled="!loaded.vehicle"
            v-bng-blur
          >{{ $t("ui.garage.tabs.photo") }}</GarageButton>
          <!-- title: ui.garage.tabs.photo -->
        </div>

        <!-- sub-views -->
        <div
          v-if="vehcomp && vehcompview"
          class="garage-content"
          v-bng-on-ui-nav:menu,back="exit"
          v-bng-frustum-mover:left="true"
        >
          <component :is="vehcompview" with-background :with-padding="false" />
        </div>
      </div>

      <div
        class="garage-sidemenu"
        v-bng-scoped-nav="{ activated: sidemenuActive, type: 'container', bubbleWhitelistEvents: ['menu'], canDeactivate: canSidemenuDeactivate }"
        @activate="activateSidemenu"
        @deactivate="deactivateSidemenu"
        v-bng-on-ui-nav:action_4="toggleSidemenu"
      >
        <h4 class="garage-sidemenu-title" v-bng-blur>
          <BngBinding class="back-binding" ui-event="action_4" controller />
          {{ $t("ui.garage2.features") }}
        </h4>

        <!-- Camera menu -->
        <Drawer v-model="drawerCamera" position="left" class="garage-menugroup">
          <template #header>
            <div class="garage-drawer-header" v-bng-blur>
              <GarageButton
                type="drawer-toggle"
                :icon="icons.movieCamera"
                :active="drawerCamera"
                v-bng-disabled="!loaded.init"
                :bng-scoped-nav-autofocus="sidemenuActive && showIfController"
                @click="drawerCamera = !drawerCamera"
              >{{ $t("ui.garage.photo.camera") }}</GarageButton>
            </div>
          </template>
          <template #expanded-content>
            <div v-bng-on-ui-nav:menu,back="toggleSidemenu" class="garage-drawer-content" v-bng-blur>
              <!-- engine.editor.menu.camera.perspective ui.options.camera.defaultMode -->
              <GarageButton
                type="drawer-button"
                :icon="icons.camera3Fourth1"
                @click="setCamera('default')"
              >{{ $t("engine.editor.menu.standartCamera") }}</GarageButton>
              <GarageButton
                type="drawer-button"
                :icon="icons.cameraFront1"
                @click="setCamera('front')"
              >{{ $t("engine.editor.menu.camera.front") }}</GarageButton>
              <GarageButton
                type="drawer-button"
                :icon="icons.cameraBack1"
                @click="setCamera('back')"
              >{{ $t("engine.editor.menu.camera.back") }}</GarageButton>
              <GarageButton
                type="drawer-button"
                :icon="icons.cameraSideRight"
                @click="setCamera('side')"
              >{{ $t("engine.editor.menu.camera.right") }}</GarageButton>
              <GarageButton
                type="drawer-button"
                :icon="icons.cameraTop1"
                @click="setCamera('top')"
              >{{ $t("engine.editor.menu.camera.top") }}</GarageButton>
            </div>
          </template>
        </Drawer>

        <!-- Vehicle features menu -->
        <Drawer v-model="drawerVehicle" position="left" class="garage-menugroup">
          <template #header>
            <div class="garage-drawer-header" v-bng-blur>
              <GarageButton
                type="drawer-toggle"
                :icon="icons.electronicSchemeOutline"
                :active="drawerVehicle"
                v-bng-disabled="!loaded.vehicle || !loaded.status"
                @click="drawerVehicle = !drawerVehicle"
              >{{ $t("ui.radialmenu2.electrics") }}</GarageButton>
            </div>
          </template>
          <template #expanded-content>
            <div v-bng-on-ui-nav:menu,back="toggleSidemenu" class="garage-drawer-content" v-bng-blur>
              <GarageButton
                type="drawer-button"
                :icon="icons.lowBeam"
                :active="vehicle.electrics.lowbeam"
                v-bng-disabled="!loaded.vehicle"
                @click="vehSwitch('lowbeam')"
              >{{ $t("ui.radialmenu2.electrics.headlights.low") }}</GarageButton>
              <!-- ui.inputActions.vehicle.toggle_headlights.title ui.radialmenu2.electrics.headlights -->
              <GarageButton
                type="drawer-button"
                :icon="icons.highBeam"
                :active="vehicle.electrics.highbeam"
                v-bng-disabled="!loaded.vehicle"
                @click="vehSwitch('highbeam')"
              >{{ $t("ui.radialmenu2.electrics.headlights.high") }}</GarageButton>
              <!-- ui.inputActions.vehicle.toggle_foglights.title -->
              <GarageButton
                type="drawer-button"
                :icon="icons.fogLight"
                :active="vehicle.electrics.fog_lights"
                v-bng-disabled="!loaded.vehicle"
                @click="vehSwitch('fog')"
              >{{ $t("ui.radialmenu2.electrics.fog_lights") }}</GarageButton>
              <GarageButton
                type="drawer-button"
                :icon="icons.hazardLights"
                :active="vehicle.electrics.hazard"
                v-bng-disabled="!loaded.vehicle"
                @click="vehSwitch('hazard')"
              >{{ $t("ui.radialmenu2.electrics.hazard_lights") }}</GarageButton>
              <GarageButton
                type="drawer-button"
                :icon="icons.wigwags"
                :active="vehicle.electrics.lightbar"
                v-bng-disabled="!loaded.vehicle"
                @click="vehSwitch('lightbar')"
              >{{ $t("ui.radialmenu2.electrics.lightbar") }}</GarageButton>
            </div>
          </template>
        </Drawer>

        <!-- Garage features menu -->
        <Drawer v-model="drawerGarage" position="left" class="garage-menugroup">
          <template #header>
            <div class="garage-drawer-header" v-bng-blur>
              <GarageButton
                type="drawer-toggle"
                :icon="icons.garage01"
                :active="drawerGarage"
                v-bng-disabled="!loaded.init"
                @click="drawerGarage = !drawerGarage"
              >{{ $t("ui.garage2.features") }}</GarageButton>
            </div>
          </template>
          <template #expanded-content>
            <div v-bng-on-ui-nav:menu,back="toggleSidemenu" class="garage-drawer-content" v-bng-blur>
              <GarageButton
                type="drawer-button"
                :icon="icons.lightGarageG32"
                :active="lightState[0]"
                @click="lightToggle(0)"
              >{{ $t("ui.garage2.lights.west") }}</GarageButton>
              <GarageButton
                type="drawer-button"
                :icon="icons.lightGarageG22"
                :active="lightState[1]"
                @click="lightToggle(1)"
              >{{ $t("ui.garage2.lights.middle") }}</GarageButton>
              <GarageButton
                type="drawer-button"
                :icon="icons.lightGarageG12"
                :active="lightState[2]"
                @click="lightToggle(2)"
              >{{ $t("ui.garage2.lights.east") }}</GarageButton>
            </div>
          </template>
        </Drawer>
      </div>
    </div>

    <div class="garage-row-bottom">
      <!-- normal garage -->
      <GarageButton
        :active="vehcomp === 'save'"
        @click="menuOpen('save')"
        v-bng-disabled="!loaded.vehicle"
        :icon="icons.saveAs1"
        v-bng-blur
        v-bng-tooltip:top="$t('ui.vehicleconfig.save')"
      />
      <!--
      <GarageButton
        :active="vehcomp === 'save'"
        @click="mainMode('savedefault')"
        v-bng-disabled="!loaded.vehicle"
        :icon="icons.vehicleFavorite"
        v-bng-blur
        v-bng-tooltip="[set default]"
      /> -->
      <GarageButton
        @click="menuOpen('test')"
        v-bng-disabled="!loaded.vehicle"
        :icon="icons.trafficCone"
        v-bng-blur
        v-bng-tooltip:top="$t('ui.common.test')"
      />
    </div>
  </div>
</template>

<script setup>
// base includes
import { ref, reactive, watch, markRaw, onBeforeMount, onUnmounted, nextTick } from "vue"
import { storeToRefs } from "pinia"
import { $translate } from "@/services/translation"
import { BngButton, BngBinding, icons, ACCENTS } from "@/common/components/base"
import { Drawer } from "@/common/components/utility"
import { vBngBlur, vBngFrustumMover, vBngOnUiNav, vBngDisabled, vBngTooltip, vBngScopedNav, vBngFocusIf, vBngUiNavFocus } from "@/common/directives"
import { openExperimental, openMessage } from "@/services/popup"
import GarageButton from "../components/GarageButton.vue"

// service includes
import { useBridge } from "@/bridge"
import { runRaw } from "@/bridge/libs/Lua.js"
import { useEvents, useStreams } from "@/services/events"
import useControls from "@/services/controls"
import { useUINavTracker } from "@/services/uiNavTracker"

// sub includes
import Paint from "@/modules/vehicleConfig/components/Paint.vue"
import Parts from "@/modules/vehicleConfig/components/Parts.vue"
import Tuning from "@/modules/vehicleConfig/components/Tuning.vue"
import Save from "@/modules/vehicleConfig/components/Save.vue"

const components = {
  paint: Paint,
  parts: Parts,
  tuning: Tuning,
  save: Save,
}

const ownerId = "garage"
const uiNavTracker = useUINavTracker()
const Controls = useControls()
const { showIfController } = storeToRefs(Controls)
const { lua, api } = useBridge()
const events = useEvents()
const bngVue = window.bngVue || { gotoGameState() {} }
const backBinding = ref(null)

const streamsList = ["electrics"]
useStreams(streamsList, onStreamsUpdate)

// Drawer expanded states
const drawerCamera = ref(false)
const drawerVehicle = ref(false)
const drawerGarage = ref(false)

watch(
  () => showIfController,
  val => val ? uiNavTracker.addIgnore("action_4", ownerId) : uiNavTracker.removeIgnore("action_4", ownerId),
  { immediate: true }
)

const launchLiveryEditor = async () => {
  const dynDecalsCapable = await runRaw('extensions.core_vehicle_partmgmt.hasAvailablePart(be:getPlayerVehicle(0).JBeam .. "_skin_dynamicTextures")')

  if (!dynDecalsCapable) {
    openMessage("", $translate.instant("ui.garage.decals.notAvailableForVehicle"))
  } else {
    const res = await openExperimental(
      "Dynamic Decals",
      "This is an early highly experimental preview of the Decal Editor. Please be aware that anything created with this feature may be lost in future hotfixes and updates. Do you wish to proceed?",
      [
        { label: $translate.instant("ui.common.no"), value: false, extras: { accent: ACCENTS.secondary } },
        { label: "Yes, I'm buckled up and ready to go!", value: true, extras: { default: true } },
      ]
    )
    if (res) bngVue.gotoGameState("livery-manager")
  }
}

// import { useUINavScope } from "@/services/uiNav"
// useUINavScope("garage")

const props = defineProps({
  component: String,
})

const sidemenuActive = ref(false)
function activateSidemenu() {
  sidemenuActive.value = true
}
function deactivateSidemenu() {
  sidemenuActive.value = false

  nextTick(() => {
    // close drawers
    drawerCamera.value = false
    drawerVehicle.value = false
    drawerGarage.value = false
  })
}

function toggleSidemenu() {
  sidemenuActive.value = !sidemenuActive.value
  // if (sidemenuActive.value) deactivateSidemenu()
  // else activateSidemenu()
}

const canSidemenuDeactivate = () => {
  return !drawerCamera.value && !drawerVehicle.value && !drawerGarage.value
}

const lightState = ref([false, false, false])
async function lightToggle(idx) {
  lightState.value[idx] = !lightState.value[idx]
  await lua.extensions.gameplay_garageMode.setLighting(lightState.value)
}

async function setCamera(view) {
  await lua.extensions.gameplay_garageMode.setCamera(view)
}

// electric switches
const switches = reactive({
  lowbeam: { func: "setLightsState", value: "lights_state", on: 1, off: 0, state: false },
  highbeam: { func: "setLightsState", value: "lights_state", on: 2, off: 0, state: false },
  fog: { func: "set_fog_lights", value: "fog", on: 1, off: 0, state: false },
  lightbar: { func: "set_lightbar_signal", value: "lightbar", on: 1, off: 0, state: false },
  hazard: { func: "set_warn_signal", value: "hazard_enabled", on: 1, off: 0, state: false },
})

function vehSwitch(key, on) {
  if (!(key in switches)) return
  const svc = switches[key]
  if (typeof on === "undefined") {
    // toggle if undefined
    on = !svc.state
  } else if (on === svc.state) {
    // no change - do nothing
    return
  }
  api.activeObjectLua(`electrics.${svc.func}(${on ? svc.on : svc.off})`)
}

const loaded = reactive({
  init: false,
  vehicle: false,
  status: false,
})
const vehicle = reactive({
  name: "Unknown",
  vehicle: null,
  electrics: {},
  state: {},
})

const blackscreen = ref(false)
const vehcomp = ref("")
const vehcompview = ref(null)
let tmrInit

async function menuOpen(mode) {
  vehcomp.value = vehcomp.value === mode ? "" : mode
  let component = null
  switch (mode) {
    case "paint":
      lua.extensions.gameplay_garageMode.setGarageMenuState("paint")
      component = components.paint
      break
    case "decals":
      bngVue.gotoGameState("decals-loader")
      break
    case "parts":
      lua.extensions.gameplay_garageMode.setGarageMenuState("parts")
      component = components.parts
      break
    case "tuning":
      lua.extensions.gameplay_garageMode.setGarageMenuState("tuning")
      component = components.tuning
      break
    case "vehicles":
      lua.extensions.gameplay_garageMode.setGarageMenuState("vehicles")
      bngVue.gotoGameState("menu.vehicles", { params: { mode: "garageMode", garage: "all" } })
      break
    case "mycars":
      lua.extensions.gameplay_garageMode.setGarageMenuState("myCars")
      bngVue.gotoGameState("menu.vehicles", { params: { mode: "garageMode", garage: "own" } })
      break
    case "photo":
      bngVue.gotoGameState("menu.photomode")
      break
    case "save":
      component = components.save
      break
    case "savedefault":
      console.log("TODO: save as default")
      break
    case "test":
      vehcomp.value = ""
      lua.extensions.gameplay_garageMode.testVehicle()
      break
    default:
      vehcomp.value = ""
      break
  }

  if (component) vehcompview.value = markRaw(component)
}

function exit(event) {
  // console.log("exit", event)
  // see also: canScopeDeactivate
  if (event.detail.force) return

  if (vehcomp.value) {
    menuOpen()
  } else {
    window.bngVue.gotoAngularState("menu.mainmenu")
  }
}

// handles vehicle change
async function vehChange() {
  // this function init is at bottom of garage controller
  // reset menus // don't! if you do, check if it's not conflicting with parts change
  //vehcomp.value = ""
  // lock status
  loaded.vehicle = false
  loaded.status = false
  // reset vehicle
  vehicle.name = "Unknown"
  vehicle.vehicle = null
  vehicle.electrics = {}
  // enable electrics w/o ignition
  await api.activeObjectLua("electrics.setIgnitionLevel(1)")
  // request info
  const data = await lua.core_vehicles.getCurrentVehicleDetails()
  if (tmrInit) {
    loaded.init = true // to unlock controls even on a wrong data
    clearTimeout(tmrInit)
    tmrInit = null
  }
  // console.log("VEHICLE", data)
  if (!data) return
  loaded.vehicle = true
  vehicle.vehicle = data
  if (data.model.Brand) vehicle.name = `${data.model.Brand} ${data.model.Name}`
  else vehicle.name = data.configs.Name
  if (data.configs.Configuration) {
    if (data.configs.Source === "BeamNG - Official") {
      vehicle.name += ` - ${data.configs.Configuration}`
    } else {
      vehicle.name += " - Custom" // ?
    }
  }
}

function onStreamsUpdate(streams) {
  if (typeof streams !== "object") return
  if (!streamsList.every(name => name in streams)) return
  const data = streams.electrics
  loaded.status = data.ignitionLevel > 0 // check if electrics is on
  // console.log("ELECTRICS", data)
  for (let key in switches) {
    const svc = switches[key]
    svc.state = svc.value in data && data[svc.value] === svc.on
    vehicle.electrics[key] = svc.state
  }
}

const canScopeDeactivate = () => {
  return !vehcomp.value
}

onBeforeMount(async () => {
  // // see also play.js
  // $scope.$watch("$parent.app.gameState", gameState => {
  //   // this is to make garage disappear when garage was opened inside freeroam or else
  //   if (gameState !== "garage")
  //     $state.go("play")
  // })

  tmrInit = setTimeout(() => {
    console.log("Unable to get vehicle details in time. Forcing to init...")
    loaded.init = true
    tmrInit = null
  }, 3000)

  events.on("VehicleChange", vehChange)
  api.activeObjectLua("electrics.setIgnitionLevel(1)") // enable electrics w/o ignition

  // TODO: see angular's vehicleselect.js, port the confirmation prompt
  // events.on("garageVehicleDirtied", data => {
  //   if (typeof data !== "object") return
  //   vehicle.state.vehicleDirty = data.vehicleDirty
  //   vehicle.state.switchedToNewVehicle = data.switchedToNewVehicle
  // })

  // garage configs are registered in angular vehicle controller

  events.on("GarageModeBlackscreen", data => blackscreen.value = data.active)

  vehChange() // init

  // garage lighting
  lightState.value = await lua.extensions.gameplay_garageMode.getLighting()

  props.component && menuOpen(props.component)
})

onUnmounted(() => {
  tmrInit && clearTimeout(tmrInit)
})
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

.garage-view,
.garage-view * {
  position: relative;
  font-family: "Overpass", var(--fnt-defs);
}

.garage-view {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  align-items: stretch;
  padding: 2em;
  padding-bottom: 1em; // to align with infobar
  font-size: 16px !important;
  overflow: hidden;
}

.garage-row-title {
  margin-left: 0.375em;
}

.garage-title-sup {
}

.garage-title-main {
  .garage-back-button {
    top: -0.15em;
    min-width: 0 !important;
    margin: 0 !important;
    margin-right: 0.25em !important;
    :deep(> .icon) {
      margin-right: -0.2em;
      padding-right: 0;
    }
    &.garage-back-binding-shown {
      margin-right: 0 !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
  }
}

.garage-row-title,
.garage-row-footer {
  flex: 0 0 auto;
}
.garage-row-main {
  flex: 0 1 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  overflow: hidden; // cef fix
}

.garage-menu-container {
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  min-height: 0;
  min-width: 35rem;
  width: 25%;
  max-width: 50rem;
}

.garage-menu-container > * {
  flex: 0 0 auto;
}

.garage-menu {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  padding-bottom: 0.25em;
  margin-bottom: 0.5em;
  /* max-width: 400px; */
}
.garage-menu > * {
  flex: 0 0 10%;
  width: 10%;
}
.garage-menu > * {
  flex-grow: 1;
}
.garage-menu-main .garage-menu::after {
  $size: 0.2em;
  content: "";
  position: absolute;
  bottom: -$size;
  left: 0.25em;
  right: 0.25em;
  height: $size;
  background-color: var(--bng-orange);
  border-radius: 0.1em;
}
:not(.garage-menu-main) > .garage-menu-secondary {
  display: none;
}
.garage-menu-main :deep(.garage-button) {
  max-width: unset !important;
}

.garage-sidemenu {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;
  padding: 0 0.375em;

  &::before {
    // hide focus frame
    content: none !important;
  }

  .garage-sidemenu-title {
    margin: 0.25em;
    padding: 0.2em 0.25em 0.1em 0.25em;
    color: var(--bng-off-white);
    background-color: var(--bng-black-o6);
    border-radius: $border-rad-1;
  }

  .garage-menugroup {
    display: flex;
    flex-flow: row nowrap;
    align-items: stretch;
    width: auto;
    height: auto;
    margin: 0.25em;

    > :deep(.drawer-header) {
      position: relative;
      transform: none;
    }

    > :deep(.drawer-header),
    > :deep(.content) {
      background-color: transparent;
    }

    .garage-drawer-header {
      height: 100%;
    }

    .garage-drawer-content {
      display: flex;
      flex-flow: row nowrap;
      align-items: stretch;
      height: 100%;
    }
  }
}

.garage-content {
  flex: 1 1 auto;
  height: 100%;
  margin: 0.5em;
  overflow: hidden;
  background: rgba(var(--bng-off-black-rgb), 0.6);
  > :deep(*) {
    // width: 100% !important;
    // height: 100% !important;
    // overflow: hidden;
    color: #fff;
    pointer-events: auto;
    > .bng-card-content {
      height: 100%;
      overflow: auto;
    }
  }
}

.garage-row-bottom {
  flex: 0 0 auto;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  margin-left: 0.25rem;
  margin-bottom: -0.5em;
  max-width: fit-content;
  z-index: 1;
}

/* smaller screen */
@media (max-width: 1280px) {
  .garage-view {
    font-size: 1.094vw !important;
  }
  .garage-menu-container {
    width: 36em;
  }
}

/* portrait mode */
@media (max-width: 1081px) and (orientation: portrait) {
  .garage-view {
    font-size: 1.95vw !important;
  }
  .garage-menu-container {
    width: 80%;
  }
  .garage-row-main {
    flex-direction: column;
  }
}

.garage-blackscreen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  pointer-events: none;
  opacity: 0;
  /* transition: opacity 100ms; */
  z-index: calc(var(--zorder_main_menu_navigation_focus) + 1);
}
.garage-blackscreen-active {
  opacity: 1;
  pointer-events: all !important;
}
</style>
