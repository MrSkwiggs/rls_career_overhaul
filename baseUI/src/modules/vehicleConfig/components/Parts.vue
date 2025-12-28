<template>
  <div
    :class="{
      'parts-browser': true,
      'with-background': withBackground,
    }"
    v-bng-blur="withBackground"
  >
    <div
      class="parts-browser-search"
      v-bng-scoped-nav="{bubbleWhitelistEvents: ['menu']}"
      @activate="search.start"
      @deactivate="() => !search.text && search.stop()"
    >
      <BngInput
        v-model.trim="search.text"
        :leading-icon="icons.search"
        floating-label="Search"
        @click="search.start()"
        @valueChanged="search.onChange()"
        @keydown="search.history.onKeyDown($event)"
      />
      <BngButton
        :icon="icons.mathMultiply"
        :style="'font-size: 0.75rem'"
        :accent="ACCENTS.text"
        v-bng-disabled="!search.active"
        @click="search.stop()"
      />
    </div>

    <div
      class="parts-browser-content-wrapper"
      v-bng-scoped-nav="{bubbleWhitelistEvents: ['menu']}"
      @mouseleave="deselectPart"
      @deactivate="deselectPart"
    >
      <div class="parts-browser-content">
        <!-- Normal mode -->
        <PartsBranch
          v-if="!search.active && currentConfig?.children && Object.keys(currentConfig.children).length > 0"
          root-slot
          :children="currentConfig.children"
          :info="richPartInfo"
          :tree-state="treeState"
          :display-names="opts.showNames"
          :show-auxiliary="opts.showAux"
          :separate-sort="opts.separateSort"
          :always-sort="opts.alwaysSort"
          :show-empty="opts.showEmpty"
          @select="selectPart"
          @deselect="deselectPart"
          @highlight="highlightPart"
          @change="partConfigChanged"
          @dropdown="dropdownOpened"
        />

        <!-- Search mode -->
        <div v-else-if="search.active">
          <PartsBranch
            :children="search.result"
            :info="richPartInfo"
            :tree-state="treeState"
            flat-entry
            :display-names="opts.showNames"
            :show-auxiliary="opts.showAux"
            :separate-sort="opts.separateSort"
            :always-sort="opts.alwaysSort"
            :show-empty="opts.showEmpty"
            :highlighter="search.highlight"
            @select="selectPart"
            @deselect="deselectPart"
            @highlight="highlightPart"
            @change="partConfigChanged"
            @dropdown="dropdownOpened"
          />

          <div v-show="search.message !== ''">
            <BngIcon :type="icons.danger" color="#d60" />
            <span style="padding: 0.5em; display: inline-block;">{{ search.message }}</span>
          </div>

          <div v-show="Object.keys(search.result).length === 0" class="search-help">
            <hr />
            Examples:
            <ul>
              <li>
                <span class="search-example">left</span><br />
                {{ $t("ui.vehicleconfig.searchHelp.example1") }}
              </li>
              <li>
                <span class="search-example">slot:_fr</span><br />
                {{ $t("ui.vehicleconfig.searchHelp.example2") }}
              </li>
              <li>
                <span class="search-example">name:frame</span><br />
                {{ $t("ui.vehicleconfig.searchHelp.example3") }}
              </li>
              <li>
                <span class="search-example">slot:_fr name:signal</span><br />
                {{ $t("ui.vehicleconfig.searchHelp.example4") }}
              </li>
              <li>
                <span class="search-example">partname:pickup_fr</span><br />
                {{ $t("ui.vehicleconfig.searchHelp.example5") }}
              </li>
              <li>
                <span class="search-example">author:bob</span><br />
                {{ $t("ui.vehicleconfig.searchHelp.example6") }}
              </li>
              <li>
                <span class="search-example">mod:super</span><br />
                {{ $t("ui.vehicleconfig.searchHelp.example7") }}
              </li>
            </ul>
            <hr />
            {{ $t("ui.vehicleconfig.searchHelp.notes") }}:
            <ul>
              <li>{{ $t("ui.vehicleconfig.searchHelp.notes1") }}</li>
              <!-- <li>{{ $t("ui.vehicleconfig.searchHelp.notes2") }}</li> -->
              <li>{{ $t("ui.vehicleconfig.searchHelp.notes3") }}</li>
            </ul>
          </div>

          <div v-if="search.history.browsing && search.history.list.length > 0">
            <hr />
            {{ $t("ui.vehicleconfig.searchHelp.history") }}:
            <br />
            <br />
            <span
              v-for="(historyEntry, idx) in search.history.list"
              :class="{
                'history-entry': true,
                'history-indicator': idx === search.history.index,
              }"
              >{{ historyEntry }}</span
            >
            <br />
            {{ $t("ui.vehicleconfig.searchHelp.historyClear") }}
          </div>
        </div>
      </div>
    </div>

    <div class="parts-options-row parts-options-row-separator">
      <div class="parts-options-left">
        <BngButton
          :accent="ACCENTS.secondary"
          :icon="icons.sortAsc"
          v-bng-popover:top-start.click="'parts-options-menu'"
          v-bng-tooltip:right="$t('ui.garage.optionsSwitch')"
          :disabled="waitingForData"
        />
        <BngPopoverMenu name="parts-options-menu" focus>
          <div class="popover-contents-wrapper">
            <BngButton :accent="ACCENTS.menu"
              :icon="opts.showAux ? icons.checkmark : icons._empty"
              v-bng-on-ui-nav:ok.focusRequired.asMouse
              @click="saveOption('showAux', opts.showAux = !opts.showAux)"
            >{{ $t("ui.showAuxiliary") }}</BngButton>
            <BngButton :accent="ACCENTS.menu"
              :icon="opts.showNames ? icons.checkmark : icons._empty"
              v-bng-on-ui-nav:ok.focusRequired.asMouse
              @click="saveOption('showNames', opts.showNames = !opts.showNames)"
            >{{ $t("ui.vehicleconfig.displayNames") }}</BngButton>
            <BngButton :accent="ACCENTS.menu"
              :icon="opts.selectSubParts ? icons.checkmark : icons._empty"
              v-bng-on-ui-nav:ok.focusRequired.asMouse
              @click="saveOption('selectSubParts', opts.selectSubParts = !opts.selectSubParts)"
            >{{ $t("ui.vehicleconfig.subparts") }}</BngButton>
            <BngButton :accent="ACCENTS.menu"
              :icon="opts.separateSort ? icons.checkmark : icons._empty"
              v-bng-on-ui-nav:ok.focusRequired.asMouse
              @click="saveOption('separateSort', opts.separateSort = !opts.separateSort)"
            >Sort sublists separately</BngButton>
            <BngButton :accent="ACCENTS.menu"
              :icon="opts.alwaysSort ? icons.checkmark : icons._empty"
              v-bng-on-ui-nav:ok.focusRequired.asMouse
              @click="saveOption('alwaysSort', opts.alwaysSort = !opts.alwaysSort)"
            >Always sort by name</BngButton>
            <BngButton :accent="ACCENTS.menu"
              v-if="isDev"
              :icon="opts.showEmpty ? icons.checkmark : icons._empty"
              v-bng-on-ui-nav:ok.focusRequired.asMouse
              @click="opts.showEmpty = !opts.showEmpty"
            >Show empty slots 🐞</BngButton>
          </div>
        </BngPopoverMenu>
      </div>
      <div class="parts-options-right">
        <BngSwitch :disabled="partsChanged || waitingForData" v-model="opts.applyPartChangesAutomatically" @valueChanged="saveOption('applyPartChangesAutomatically', opts.applyPartChangesAutomatically)">
          {{ $t("ui.garage.liveUpdates") }}
        </BngSwitch>
        <!-- part of the test layout
        <BngButton
          show-hold
          :icon="icons.undo"
          :accent="ACCENTS.custom"
          class="reset-button"
          v-bng-on-ui-nav:ok.asMouse.focusRequired
          v-bng-click="{ holdCallback: resetAllToLoadedConfig, holdDelay: 1000, repeatInterval: 0 }"
          v-bng-tooltip="'Reset to original config'"
        >{{ $t("ui.common.reset") }}</BngButton>
        -->
      </div>
    </div>

    <div class="parts-options-row">
      <div class="license-plate" v-bng-disabled="skipLicGen || waitingForData" v-bng-scoped-nav="{bubbleWhitelistEvents: ['menu']}">
        <!-- <span class="label">{{ $t('ui.vehicleconfig.licensePlate') }}</span> -->
        <BngInput
          v-model="licensePlate"
          :floating-label="$t('ui.vehicleconfig.licensePlate')"
          maxlength="50"
          @valueChanged="applyLicensePlateDebounced()"
          @keyup.enter="applyLicensePlate()"
          :validate="isLicensePlateTextValid"
        />
        <BngButton
          :accent="ACCENTS.outlined"
          :icon="icons.sync"
          @click="applyRandomLicensePlate()"
          v-bng-tooltip:top="$t('ui.vehicleconfig.licensePlateGen')"
        />
        <BngButton
          v-if="!opts.applyPartChangesAutomatically"
          :disabled="!licensePlateTextValid"
          :icon="icons.checkmark"
          @click="applyLicensePlate()"
          v-bng-tooltip:top="$t('ui.vehicleconfig.applyLicensePlate')"
        />
      </div>
      <div class="parts-options-right parts-options-buttons">
        <BngButton
          show-hold
          :icon="icons.undo"
          :accent="ACCENTS.custom"
          class="reset-button"
          v-bng-on-ui-nav:ok.asMouse.focusRequired
          v-bng-click="{ holdCallback: resetAllToLoadedConfig, holdDelay: 1000, repeatInterval: 0 }"
          v-bng-tooltip="'Reset to original config'"
          :disabled="waitingForData"
        />
        <BngButton
          class="parts-apply-button"
          :icon="icons.checkmark"
          @click="write()"
          :disabled="opts.applyPartChangesAutomatically || !partsChanged || waitingForData"
        >{{ $t("ui.common.apply") }}</BngButton>
      </div>
      <!-- part of the test layout
      <div class="parts-options-right parts-options-buttons-test">
        <BngSwitch
          class="parts-apply-switch"
          v-model="opts.applyPartChangesAutomatically"
          :disabled="partsChanged"
          @valueChanged="saveOption('applyPartChangesAutomatically', opts.applyPartChangesAutomatically)"
          v-bng-tooltip:left="$t('ui.garage.liveUpdates')"
        />
        <BngButton
          class="parts-apply-button"
          :icon="icons.checkmark"
          @click="write()"
          :disabled="opts.applyPartChangesAutomatically || !partsChanged"
        >{{ $t("ui.common.apply") }}</BngButton>
      </div>
      -->
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from "vue"
import { lua } from "@/bridge"
import { useEvents } from "@/services/events"
import { BngSwitch, BngButton, BngInput, BngPopoverMenu, BngIcon, ACCENTS, icons } from "@/common/components/base"
import { vBngBlur, vBngTooltip, vBngDisabled, vBngPopover, vBngScopedNav, vBngClick, vBngOnUiNav } from "@/common/directives"
import { debounce } from "@/utils/rateLimit"
import { sleep } from "@/utils"
import { ExecQueue } from "@/services/queue"
import PartsBranch from "./PartsBranch.vue"
import PartsSearch from "../parts/search.js"

const events = useEvents()
const queue = new ExecQueue()

defineProps({
  withBackground: Boolean,
})

let currentVehID = -1
const currentConfig = ref({})
const richPartInfo = ref({})
let partsHighlighted = {}

const treeStatePermanent = false
const treeStateKey = "partsTreeState"
const treeState = ref({})

const isDev = window.beamng && !window.beamng.shipping

const savedOptions = [
  "applyPartChangesAutomatically",
  "selectSubParts",
  "showNames",
  "showAux",
  "separateSort",
  "alwaysSort",
]

const opts = reactive({
  stickyPartSelection: false,
  selectSubParts: true,
  applyPartChangesAutomatically: true,
  simple: false,
  showNames: false,
  showAux: !beamng.shipping,
  separateSort: false,
  alwaysSort: false,
  showEmpty: false, // if this option is going to be saved, make sure to force-disable it when isDev is false
})

const waitingForData = ref(true) // flag that indicates that the UI is waiting for data from lua
const waitForData = async () => {
  while (waitingForData.value) await sleep(100)
}

const search = reactive(new PartsSearch(currentConfig, richPartInfo, opts))

const partsChanged = ref(false)

const vehChange = () => lua.extensions.core_vehicle_partmgmt.sendDataToUI()

events.on("VehicleFocusChanged", vehChange)
events.on("VehicleJbeamIoChanged", vehChange)

function iterateChildren(slot, func) {
  func(slot)
  slot.children && Object.values(slot.children).forEach(child => iterateChildren(child, func))
}

// Highlights the selected part and its subparts
async function highlightPart(part) {
  if (waitingForData.value) return
  // await waitForData()
  iterateChildren(part, child => typeof child.highlight === "boolean" ? (partsHighlighted[child.partPath] = child.highlight = part.highlight) : undefined)
  lua.extensions.core_vehicle_partmgmt.highlightParts(partsHighlighted, currentVehID)
}

let mouseUsedLast = true
let tmrSelect

// Selects part (highlight part temporarily, like on hovering part) and its subparts
const selectPart = queue.wrap("selectPart", async (slot, mouse = false) => {
  mouseUsedLast = mouse
  tmrSelect && clearTimeout(tmrSelect)
  if (waitingForData.value || opts.stickyPartSelection) return
  // console.log("selectPart")
  const parts = {}
  if (opts.selectSubParts) {
    iterateChildren(slot, child => child.partPath && (parts[child.partPath] = true))
  } else {
    parts[slot.partPath] = true
  }
  // ensure parts are highlightable
  for (const part in parts) {
    if (!(part in partsHighlighted))
      delete parts[part]
  }
  if (Object.keys(parts).length === 0) return
  await lua.extensions.core_vehicle_partmgmt.selectParts(parts, currentVehID)
}, {
  selectPart: queue.resolution.replaceWithResolve,
  deselectPart: queue.resolution.resolveOthers,
  write: queue.resolution.resolveThis,
  reset: queue.resolution.resolveThis,
  resetAllToLoadedConfig: queue.resolution.resolveThis,
  restoreHighlight: queue.resolution.resolveThis,
})

const deselectPart = queue.wrap("deselectPart", (slot, mouse = false) => {
  mouseUsedLast = mouse
  tmrSelect && clearTimeout(tmrSelect)
  if (waitingForData.value) return
  // console.log("deselectPart")
  tmrSelect = setTimeout(async () => {
    tmrSelect = null
    if (opts.stickyPartSelection || Object.keys(currentConfig.value).length === 0) return
    await lua.extensions.core_vehicle_partmgmt.showHighlightedParts(currentVehID)
    // restore highlight (might misbehave on low specs)
    // await lua.extensions.core_vehicle_partmgmt.highlightParts(partsHighlighted, currentVehID)
  }, 100)
}, {
  // selectPart: queue.resolution.resolveThis,
  deselectPart: queue.resolution.replaceWithResolve,
  write: queue.resolution.resolveThis,
  reset: queue.resolution.resolveThis,
  resetAllToLoadedConfig: queue.resolution.resolveThis,
  restoreHighlight: queue.resolution.resolveThis,
  restoreSelection: queue.resolution.resolveThis,
})

const restoreHighlight = queue.wrap("restoreHighlight", () => {
  // console.log("restoreHighlight")
  tmrSelect && clearTimeout(tmrSelect)
  // restore highlight (might misbehave on low specs)
  tmrSelect = setTimeout(async () => {
    tmrSelect = null
    await lua.extensions.core_vehicle_partmgmt.highlightParts(partsHighlighted, currentVehID)
  }, 100)
}, {
  selectPart: queue.resolution.replaceWithResolve,
  deselectPart: queue.resolution.replaceWithResolve,
  restoreHighlight: queue.resolution.replaceWithResolve,
})

const restoreSelection = queue.wrap("restoreSelection", element => {
  // console.log("restoreSelection")
  element?.partSelect?.()
}, {
  selectPart: queue.resolution.replaceWithResolve,
  deselectPart: queue.resolution.replaceWithResolve,
  restoreSelection: queue.resolution.replaceWithResolve,
})

const dropdownOpened = val => opts.stickyPartSelection = val

// LICENSE PLATE STUFF
const skipLicGen = ref(false)
const licensePlate = ref("")
const licensePlateTextValid = ref(true)

const settingsChanged = async () => (skipLicGen.value = await lua.settings.getValue("SkipGenerateLicencePlate"))
const getLicensePlate = () => bngApi.engineLua("core_vehicles.getVehicleLicenseText(getPlayerVehicle(0))", str => (licensePlate.value = str))

const applyLicensePlateDebounced = debounce(() => {
  opts.applyPartChangesAutomatically && applyLicensePlate()
}, 500)

function applyLicensePlate() {
  applyLicensePlateDebounced.cancel()
  if (!licensePlateTextValid.value) return
  lua.core_vehicles.setPlateText(licensePlate.value)
}

function applyRandomLicensePlate() {
  bngApi.engineLua(`core_vehicles.setPlateText(core_vehicles.regenerateVehicleLicenseText(getPlayerVehicle(0)),nil,nil,nil)`)
  getLicensePlate()
}

const isLicensePlateTextValid = (text) => {
  lua.core_vehicles.isLicensePlateValid(text).then(valid => {
    licensePlateTextValid.value = valid
  })
  return licensePlateTextValid.value
}
// /LICENSE PLATE STUFF

let changedPart = null
async function partConfigChanged(part) {
  // if ("_ref" in part) part._ref.val = part.val // patch for reactive rebuild issue on search
  // console.log("Changed part:", { ...part })
  changedPart = part
  if (opts.applyPartChangesAutomatically) {
    await write()
  } else {
    // only mark as changed
    part.changed = true
    partsChanged.value = true
  }
}

const write = queue.wrap("write", async () => {
  waitingForData.value = true
  await lua.extensions.core_vehicle_partmgmt.setPartsTreeConfig(currentConfig.value)
  await waitForData()
}, {
  write: queue.resolution.merge,
  reset: queue.resolution.resolveThis,
  resetAllToLoadedConfig: queue.resolution.resolveThis,
})

const reset = queue.wrap("reset", async () => {
  waitingForData.value = true
  await lua.extensions.core_vehicle_partmgmt.resetPartsToLoadedConfig()
  await waitForData()
}, {
  write: queue.resolution.resolveThis,
  reset: queue.resolution.merge,
  resetAllToLoadedConfig: queue.resolution.resolveThis,
})

const resetAllToLoadedConfig = queue.wrap("resetAllToLoadedConfig", async () => {
  waitingForData.value = true
  await lua.extensions.core_vehicle_partmgmt.resetAllToLoadedConfig()
  await waitForData()
}, {
  write: queue.resolution.resolveThis,
  reset: queue.resolution.resolveThis,
  resetAllToLoadedConfig: queue.resolution.merge,
})

/** This function does some preprocessing to make the data work better with search. */
function processConfig(config) {
  treeStateSave()

  waitingForData.value = true // just in case

  // console.log("CONFIG:", config)

  // TODO: this should be a separate call to fetch this list
  // flatten the list, assuming that there will be nothing except information field in richPartInfo
  richPartInfo.value = Object.fromEntries(
    Object.entries(config.richPartInfo)
      .map(([name, info]) => [name, info.information])
  )
  // console.log(`rich ${config.chosenPartsTree.chosenPartName} info:`, richPartInfo.value[config.chosenPartsTree.chosenPartName])

  partsHighlighted = config.partsHighlighted

  const processSlot = (slot, slotName, parentSlotName = undefined) => {
    // add slotName to ease data handling
    slot.slotName = slotName
    slot.parentSlotName = parentSlotName

    if (changedPart && changedPart.chosenPartName === slot.chosenPartName) changedPart = slot

    // add highlight status
    // if (!(slot.partPath in config.partsHighlighted)) config.partsHighlighted[slot.partPath] = false // temp fix
    slot.highlight = config.partsHighlighted[slot.partPath]

    if (typeof slot.children === "object") {
      if (Object.keys(slot.children).length === 0) {
        // remove empty children for better performance
        delete slot.children
      } else {
        // dive deeper
        for (const childSlotName in slot.children) {
          slot.children[childSlotName] = processSlot(slot.children[childSlotName], childSlotName, slot.chosenPartName)
        }
      }
    }

    // fix empty lua arrays
    if (typeof slot.suitablePartNames !== "object" || !Array.isArray(slot.suitablePartNames)) {
      slot.suitablePartNames = []
    }
    if (typeof slot.unsuitablePartNames !== "object" || !Array.isArray(slot.unsuitablePartNames)) {
      slot.unsuitablePartNames = []
    }
    // uncomment to list unsuitable parts
    // if (slot.unsuitablePartNames.length > 0) console.log(slot.partPath, slot.unsuitablePartNames)

    return slot
  }

  currentVehID = config.vehID
  currentConfig.value = processSlot(config.chosenPartsTree, config.chosenPartsTree.chosenPartName)
  // console.log("CURRENT CONFIG:", currentConfig.value)

  partsChanged.value = false

  waitingForData.value = false
  nextTick(() => {
    opts.stickyPartSelection = false
    deselectPart() // reset selection
    treeStateLoad() // restore tree state
    changedPart = null
    if (opts.applyPartChangesAutomatically && !mouseUsedLast) {
      restoreSelection(document.activeElement)
    } else {
      restoreHighlight()
    }
  })
}

events.on("VehicleConfigChange", processConfig)


const readOption = (name, val = null) => JSON.parse(localStorage.getItem(name) || JSON.stringify(val))
const saveOption = (name, val) => localStorage.setItem(name, JSON.stringify(val))


const treeStateStorage = treeStatePermanent ? localStorage : sessionStorage
const treeStateSave = () => currentConfig.value.chosenPartName &&treeStateStorage.setItem(`${treeStateKey}_${currentConfig.value.chosenPartName}`, JSON.stringify(treeState.value))
const treeStateLoad = () => {
  if (!currentConfig.value.chosenPartName) return
  const state = treeStateStorage.getItem(`${treeStateKey}_${currentConfig.value.chosenPartName}`)
  if (state) {
    try {
      treeState.value = JSON.parse(state)
      // console.log("TREE STATE:", treeState.value)
    } catch (err) {
      treeState.value = {}
    }
  } else {
    treeState.value = {}
  }
}


onMounted(() => {
  settingsChanged()
  getLicensePlate()

  // Initial data load
  lua.extensions.core_vehicle_partmgmt.sendDataToUI()

  // read options from local storate
  for (const name of savedOptions) {
    opts[name] = readOption(name, opts[name])
  }
})

onUnmounted(() => {
  treeStateSave()
  deselectPart(false)
})
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

.parts-browser {
  /* root */
  display: flex;
  flex-flow: column;
  justify-content: stretch;
  width: 100%;
  height: 100%;
  > * {
    flex: 0 0 auto;
    padding: 0 1em;
  }
  &.with-background {
    background-color: rgba(0, 0, 0, 0.6);
  }
  &,
  * {
    position: relative;
    font-family: "Overpass", var(--fnt-defs);
  }
}

.parts-browser-search {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  border-bottom: 1px solid var(--bng-orange);
  padding: 0 1em 0.25em 1em;
  > * {
    flex: 0 0 auto;
  }
  > .bng-input-wrapper {
    flex: 1 1 auto;
  }
  > .bng-button {
    min-width: unset !important;
    min-height: unset !important;
  }
}

.parts-browser-content-wrapper {
  flex: 1 1 auto;
  padding: 0;
  overflow: hidden;
}

.parts-browser-content {
  width: 100%;
  height: 100%;
  padding: 0.5em 1em;
  overflow-y: scroll;
  > * {
    margin: 0 -0.65rem;
  }
  :deep(.bng-accitem) {
    margin: 0;
  }
}

// focus frame adjustment for scrollbar width and balance its appearance
.parts-browser-search,
.parts-browser-content-wrapper {
  @include modify-focus($border-rad-1, 0px);
  &::before {
    margin-left: 8px;
    margin-right: 8px;
  }
}

.parts-options-row {
  flex: 0 0 auto;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-flow: row wrap;
  padding-bottom: 0.5rem;
  &.parts-options-row-separator {
    padding-top: 0.5rem;
    border-top: solid 2px var(--bng-orange);
  }

  .parts-options-left {
    //
  }
  .parts-options-right {
    //
  }
}

.license-plate {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: first baseline;
  .label {
    margin-right: 0.25rem;
  }
  .bng-input-wrapper {
    max-width: 12em;
    margin: 0 0.25rem;
    :deep(.floating-label) {
      top: -0.5em;
      left: 0.4em;
      font-size: 0.8rem;
    }
  }
  .bng-button {
    min-width: unset !important;
    > * {
      font-size: 1.5em;
    }
  }
}

.reset-button {
  --bng-button-custom-hold-offset: 0px;
}

.popover-contents-wrapper {
  width: max-content;
  max-width: 32rem;
  display: flex;
  flex-flow: column;
}

.parts-options-buttons {
  display: flex;
  flex-flow: row nowrap;
  // align-items: stretch;
  // justify-content: stretch;
}

.parts-options-buttons-test {
  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
  justify-content: stretch;
  > * {
    flex: 1 1 auto;
    max-width: unset;
    max-height: unset;
  }
  :deep(.parts-apply-switch) {
    flex: 0 0 auto;
    margin: 0.25em -0.25em 0.25em 0.25em;
    z-index: 1;
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 0.25em 0 0 0.25em;
      background-color: var(--bng-orange-500);
      opacity: 0.5;
      z-index: -1;
    }
    &.bng-switch-on::after {
      opacity: 1;
    }
    > * {
      margin: auto 0.4em;
    }
  }
  :deep(.parts-apply-button) {
    flex: 1 1 auto;
    .background {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }
}

/// prev version leftovers below

.parts-path {
  display: flex;
  flex-flow: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  width: 100%;
  overflow: hidden;
  > div {
    flex: 0 1 auto;
    max-width: 10em;
    padding: 0.1em 0.5em;
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-style: italic;
    white-space: nowrap;
    text-overflow: ellipsis;
    // cursor: pointer;
    &:hover {
      color: var(--bng-orange);
    }
  }
}

.parts-list {
  /* list container */
  flex: 0 1 auto;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: rgba(0, 0, 0, 0.5);
  &,
  > div {
    /* list items container */
    display: flex;
    flex-flow: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-content: flex-start;
    width: 100%;
  }
}
.parts-item {
  /* item */
  flex: 1 0 calc(25% - 0.5em);
  width: calc(25% - 0.5em);
  max-width: calc(25% - 0.5em);
  height: 6em;
  margin: 0.25em;
  background-color: rgba(0, 0, 0, 0.5);
}
.parts-item-slot {
  /* slot item */
  font-weight: bold;
  font-style: italic;
}
.parts-item-part {
  /* part variant item */
}
.parts-item-icon {
  min-width: 3em;
  min-height: 3em;
  background-color: #fff;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-position: 50% 50%;
  margin-bottom: 0.25em;
}
.parts-item-label {
  display: block;
  width: 100%;
  font-size: 0.8em;
  text-align: center;
  color: #fff;
}
.parts-item-installed {
  .parts-item-icon {
    /* installed part */
    background-color: var(--bng-orange);
  }
  .parts-item-label {
    /* installed part */
    color: var(--bng-orange);
  }
}

.parts-info {
  position: absolute;
  bottom: 0;
  right: -1px;
  width: 1px;
  height: 1px;
  > div {
    /* TODO: */
    width: 30em;
    height: 20em;
  }
}

.history-entry {
  display: block;
  &::before {
    content: " ";
    display: inline-block;
    width: 1.5em;
    text-align: center;
  }
  &.history-indicator::before {
    content: ">";
  }
}

.search-help {
  li {
    margin-bottom: 0.5em;
  }
  .search-example {
    font-family: monospace;
    font-size: 1.1em;
    font-weight: bold;
    color: rgb(255, 102, 0);
  }
}

:deep(.bng-labeled-switch) {
  margin: 0.1rem;
  // padding: 0.15rem 0.9rem 0.15rem 0.4rem;
  &.switch-on {
    background-color: rgba(var(--bng-cool-gray-600-rgb), 0.8);
  }
}
</style>
