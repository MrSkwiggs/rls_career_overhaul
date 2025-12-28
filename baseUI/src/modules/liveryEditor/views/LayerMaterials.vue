<template>
  <div
    class="layer-materials-view"
    bng-ui-scope="layer-materials-scope"
    v-bng-ui-nav-label:context="'Apply'"
    v-bng-ui-nav-label:action_2="'[Hold]Precise'"
    v-bng-ui-nav-label:back,menu="'Back'"
    v-bng-on-ui-nav:action_2.up="handleAction2"
    v-bng-on-ui-nav:action_2.down="handleAction2"
    v-bng-on-ui-nav:back,menu="goBack"
    v-bng-on-ui-nav:context="saveChanges">
    <div class="header">
      <LiveryEditorHeader />
    </div>
    <div class="main-view-content">
      <div class="inspector-container">
        <LayerInspectorBase v-bng-blur :heading="'Materials'" class="">
          <div class="materials-inspector">
            <div class="materials-setting-item">
              <div class="setting-item-name">Color</div>
              <BngColorPicker v-bng-ui-nav-focus="0" v-model="color" :step="colorPickerStep" @change="onColorChanged" />
              <div class="color-values-container" bng-no-child-nav>
                <BngInput prefix="h" v-model="inputHue" type="number" />
                <BngInput prefix="s" v-model="inputSat" type="number" />
                <BngInput prefix="b" v-model="inputLum" type="number" />
              </div>
            </div>
            <BngDivider />
            <div class="materials-setting-item">
              <div class="setting-item-name">Metallic Intensity</div>
              <div class="slider-text-container">
                <BngInput bng-no-nav v-model="metallicIntensity" type="number" :min="0" :max="100" :step="slidersStep" />
                <BngSlider v-model="metallicIntensity" :min="0" :max="100" :step="slidersStep" />
              </div>
            </div>
            <BngDivider />
            <div class="materials-setting-item">
              <div class="setting-item-name">Roughness Intensity</div>
              <div class="slider-text-container">
                <BngInput bng-no-nav v-model="roughnessIntensity" type="number" :min="0" :max="100" :step="slidersStep" />
                <BngSlider v-model="roughnessIntensity" :min="0" :max="100" :step="slidersStep" />
              </div>
            </div>
          </div>
        </LayerInspectorBase>
      </div>
    </div>
  </div>
</template>

<script>
const BLOCKED_UI_EVENTS = ["tab_l", "tab_r", "action_2", "rotate_h_cam", "rotate_v_cam", "focus_lr", "focus_ud"]
</script>

<script setup>
import { computed, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue"
import { useInfoBar } from "@/services/infoBar"
import { useUINavScope } from "@/services/uiNav"
import { useUINavBlocker } from "@/services/uiNavTracker"
import { vBngOnUiNav, vBngUiNavLabel, vBngBlur, vBngUiNavFocus } from "@/common/directives"
import { BngColorPicker, BngDivider, BngInput, BngSlider } from "@/common/components/base"
import { useEditorHeaderStore } from "@/modules/liveryEditor/stores"
import { LiveryEditorHeader } from "@/modules/liveryEditor/components"
import { lua, useBridge } from "@/bridge"
import { openConfirmation } from "@/services/popup"
import Paint from "@/utils/paint"
import LayerInspectorBase from "../components/layerSettings/LayerInspectorBase.vue"

const headerStore = useEditorHeaderStore()
const infobar = useInfoBar()
const uiNavBlocker = useUINavBlocker()
const uiNav = useUINavScope("layer-materials-scope")

const { events } = useBridge()

const screenState = reactive({
  openedDialog: null,
})

const color = ref({
  hue: 0.5,
  saturation: 1.0,
  luminosity: 0.5,
})
const inputHue = computed({
  get: () => color.value.hue.toFixed(3),
  set: newValue => {
    color.value.hue = typeof newValue === "string" ? +newValue : newValue
    onColorChanged()
  },
})
const inputSat = computed({
  get: () => color.value.saturation.toFixed(3),
  set: newValue => {
    color.value.saturation = typeof newValue === "string" ? +newValue : newValue
    onColorChanged()
  },
})
const inputLum = computed({
  get: () => color.value.luminosity.toFixed(3),
  set: newValue => {
    color.value.luminosity = typeof newValue === "string" ? +newValue : newValue
    onColorChanged()
  },
})
const metallicIntensity = ref(0)
const roughnessIntensity = ref(0)
const stateData = ref()
const colorInitialized = ref(false)
const isPreciseActive = ref(false)

const colorPickerStep = computed(() => (isPreciseActive.value ? 0.001 : 0.01))
const slidersStep = computed(() => (isPreciseActive.value ? 0.1 : 1))

const updateMaterialProperties = properties => lua.extensions.ui_liveryEditor_layerEdit.setLayerMaterials(properties)

function onColorChanged() {
  if (!colorInitialized.value) return
  const paint = new Paint()
  paint.hsl = [color.value.hue, color.value.saturation, color.value.luminosity]
  updateMaterialProperties({ color: paint.rgba })
}

watch(
  () => metallicIntensity.value,
  value => updateMaterialProperties({ metallicIntensity: value })
)

watch(
  () => roughnessIntensity.value,
  value => updateMaterialProperties({ roughnessIntensity: value })
)

onBeforeMount(() => {
  headerStore.setPreheader(["Materials"])
})

onMounted(async () => {
  infobar.visible = true
  infobar.showSysInfo = true
  uiNavBlocker.blockOnly(BLOCKED_UI_EVENTS)
  events.on("liveryEditor_layerEdit_state", onStateData)
  events.on("liveryEditor_layerEdit_layerMaterialsData", onMaterialPropertiesData)
  await lua.extensions.ui_liveryEditor_layerEdit.requestStateData()
  await lua.extensions.ui_liveryEditor_layerEdit.requestLayerMaterials()
})

onBeforeUnmount(async () => {
  events.off("liveryEditor_layerEdit_layerMaterialsData", onMaterialPropertiesData)
  events.off("liveryEditor_layerEdit_state", onStateData)
  uiNavBlocker.clear()
})

async function onStateData(data) {
  stateData.value = data
}

function onMaterialPropertiesData(data) {
  colorInitialized.value = false
  const paint = new Paint()
  data.color[3] = 1
  const isWhite = data.color.every(num => num === 1)
  paint.rgba = data.color
  color.value.hue = paint.hue
  color.value.saturation = isWhite ? 0.5 : paint.saturation
  color.value.luminosity = paint.luminosity
  colorInitialized.value = true

  metallicIntensity.value = data.metallicIntensity
  roughnessIntensity.value = data.roughnessIntensity
}

function handleAction2(element) {
  isPreciseActive.value = element.detail.value === 1
}

function goBack(event) {
  if (screenState.openedDialog) return

  screenState.openedDialog = "exit"

  openConfirmation("Exit", "Exit and lose changes?").then(res => {
    if (res) {
      const luaRes = lua.extensions.ui_liveryEditor_layerEdit.cancelChanges()
      luaRes.then(() => {
        window.bngVue.gotoGameState("LiveryDecals")
      })
    }
    screenState.openedDialog = null
  })

  event.stopPropagation()
}

function saveChanges() {
  const res = lua.extensions.ui_liveryEditor_layerEdit.saveChanges()
  res.then(() => {
    window.bngVue.gotoGameState("LiveryDecals")
  })
}
</script>

<style lang="scss" scoped>
$infobarHeight: 4rem;

.layer-materials-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0.5rem;
  color: white;

  margin-bottom: $infobarHeight;

  > .main-view-content {
    position: relative;
    display: flex;

    > .inspector-container {
      position: absolute;
      top: 0;
      right: 0;
      max-width: 22rem;
    }
  }
}

.materials-inspector {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;

  > .materials-setting-item {
    padding: 0 0.5rem 0.5rem;

    > .setting-item-name {
      font-size: 1.125em;
      font-weight: 600;
    }
  }

  .slider-text-container {
    display: flex;
    align-items: center;
    padding-top: 0.5rem;

    > :first-child {
      width: 5rem;
      margin-right: 0.5rem;
    }
  }
}

.color-values-container {
  display: flex;
  align-items: center;

  > * {
    flex: 1 1 auto;

    &:not(:last-child) {
      margin-right: 0.25rem;
    }
  }
}
</style>
