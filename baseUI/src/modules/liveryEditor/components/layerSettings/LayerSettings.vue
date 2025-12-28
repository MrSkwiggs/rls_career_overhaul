<template>
  <div class="settings-container">
    <div v-bng-blur v-bng-on-ui-nav:tab_l="goPreviousTab" v-bng-on-ui-nav:tab_r="goNextTab" class="setting-types-selector">
      <div @click="goPreviousTab">
        <BngIcon :type="icons.arrowSmallLeft" />
        <BngBinding action="menu_tab_left" deviceMask="xinput" />
      </div>
      <div class="setting-types">
        <div
          v-for="settingType of settingTypes"
          v-bng-tooltip:top="activeSettingType.value === settingType.value ? undefined : settingType.label"
          :key="settingType.value"
          :class="{ active: activeSettingType.value === settingType.value }"
          class="setting-type"
          @click="setTool(settingType)">
          <BngIcon :type="settingType.icon" class="setting-type-icon" />
        </div>
      </div>
      <div @click="goNextTab">
        <BngBinding action="menu_tab_right" deviceMask="xinput" />
        <BngIcon :type="icons.arrowSmallRight" />
      </div>
    </div>
    <LayerSettingsBase v-bng-on-ui-nav:advanced="onAdvanced" v-bng-blur>
      <template #heading>
        <div class="heading-content-wrapper">
          <span class="heading-content-text">
            <span>
              {{ activeSettingType.label }}
              <span v-if="activeSubSetting">/</span>
            </span>
            <span v-if="activeSubSetting" class="subheading">{{ activeSubSetting.label }}</span>
          </span>
          <BindingButton
            v-if="(store.reapplyActive || store.requestApplyActive) && (activeSettingType.value !== 'transform' || !mouseMode)"
            :icon="icons.restart"
            accent="text"
            label="Reset"
            :uiEvent="CONTROLLER_RESET_BINDING"
            @click="resetSettings" />
        </div>
      </template>
      <component :is="activeSettingType.component" @subSettingChanged="onSubSettingChanged" />
    </LayerSettingsBase>
  </div>
</template>

<script>
const CONTROLLER_RESET_BINDING = "advanced"
const SETTING_TYPES = [
  {
    value: "transform",
    label: "Transform",
    icon: icons.transform,
    component: markRaw(TransformSettings),
  },
  {
    value: "transformold",
    label: "Position",
    icon: icons.transform,
    component: markRaw(LayerTransformSettingsOld),
  },
  {
    value: "scale",
    label: "Scale",
    icon: icons.scale,
    component: markRaw(LayerScaleSettings),
  },
  {
    value: "skew",
    label: "Skew",
    icon: icons.deform,
    component: markRaw(LayerDeformSettings),
  },
  {
    value: "rotate",
    label: "Rotate",
    icon: icons.rotationL,
    component: markRaw(LayerRotateSettings),
  },
  {
    value: "material",
    label: "Material",
    icon: icons.material,
    component: markRaw(LayerMaterialSettings),
  },
  {
    value: "mirror",
    label: "Mirror",
    icon: icons.reflect,
    component: markRaw(LayerMirrorSettings),
  },
]
</script>

<script setup>
import { computed, ref, markRaw, watch, onMounted, onUnmounted } from "vue"
import { LayerMaterialSettings, LayerMirrorSettings, LayerTransformSettingsOld, LayerRotateSettings, LayerScaleSettings } from "."
import { BindingButton } from "@/modules/liveryEditor/components"
import { vBngBlur, vBngOnUiNav, vBngTooltip } from "@/common/directives"
import { BngBinding, BngIcon, icons } from "@/common/components/base"
import LayerDeformSettings from "./LayerDeformSettings.vue"
import LayerSettingsBase from "./LayerSettingsBase.vue"
// import { UINavEvents } from "@/bridge/libs"
import { getUINavServiceInstance } from "@/services/uiNav"
import { useLayerSettingsStore } from "@/modules/liveryEditor/stores"
import TransformSettings from "./TransformSettings.vue"

const store = useLayerSettingsStore()

const props = defineProps({
  settingTypes: Array,
  activeSetting: String,
  excludeSettingTypes: Array,
})

const currentIndex = ref(0)

const settingTypes = computed(() => {
  let filtered = SETTING_TYPES
  if (props.settingTypes) filtered = filtered.filter(x => props.settingTypes.includes(x.value))
  if (props.excludeSettingTypes) filtered = filtered.filter(x => !props.excludeSettingTypes.includes(x.value))
  return filtered
})

const activeSubSetting = ref(null)
const activeSettingType = computed(() => settingTypes.value[currentIndex.value])
const mouseMode = computed(() => (store.cursorData ? store.cursorData.isUseMousePos : undefined))

watch(
  () => props.activeSetting,
  () => {
    const index = settingTypes.value.findIndex(x => x.value === props.activeSetting)
    if (index > -1) currentIndex.value = index
    else console.warn(`Error finding setting ${props.activeSetting}`)
  },
  { immediate: true }
)

watch(activeSettingType, value => (store.activeSetting = value.value), { immediate: true })

watch(activeSettingType, (newValue, oldValue) => {
  if (newValue.value && oldValue.value) {
  }
})

onMounted(() => {
  // UINavEvents.useCrossfire = false
  getUINavServiceInstance().useCrossfire = false
})

onUnmounted(async () => {
  // UINavEvents.useCrossfire = true
  getUINavServiceInstance().useCrossfire = true
})

const setTool = settingType => {
  currentIndex.value = settingTypes.value.findIndex(x => x.value === settingType.value)
}

const goPreviousTab = () => {
  currentIndex.value = currentIndex.value > 0 ? currentIndex.value - 1 : settingTypes.value.length - 1
}

const goNextTab = () => {
  currentIndex.value = currentIndex.value < settingTypes.value.length - 1 ? currentIndex.value + 1 : 0
}

function onSubSettingChanged(value) {
  activeSubSetting.value = value
}

function onAdvanced() {
  if (store.reapplyActive || store.requestApplyActive) resetSettings()
  else return true
}

function resetSettings() {
  store.resetCursorProperties([activeSettingType.value.value])
}
</script>

<style lang="scss" scoped>
.settings-container {
  color: white;
  height: fit-content;
  width: 21rem;
}

.heading-content-wrapper {
  display: flex;
  align-items: baseline;
  width: 100%;
  justify-content: space-between;

  .heading-content-text {
    display: inline-flex;
    flex-direction: column;

    .subheading {
      font-size: 0.9em;
      margin-left: 0.5em;
    }
  }
}

.setting-types-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: var(--bng-corners-1);

  .setting-types {
    display: flex;
    flex-grow: 1;
    align-items: center;
    padding: 0 0.25rem;

    > .setting-type {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 0.25rem;
      flex-grow: 1;
      cursor: pointer;

      &:hover:not(.active) {
        .setting-type-icon {
          color: var(--bng-orange-b400);
        }
      }

      &.active {
        background: var(--bng-orange-b400);
        cursor: default;
      }
    }
  }
}
</style>
