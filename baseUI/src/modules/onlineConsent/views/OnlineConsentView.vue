<template>
  <WizardView
    title="ui.mainmenu.onlineFeatures.featureTitle"
    :preheadings="['Privacy & Features']"
    style="--wizard-height: 45rem;"
    v-bng-blur
    bng-ui-scope="consent"
    v-bng-on-ui-nav:menu,back="backToMenu"
    @step-complete="onStepComplete"
    @wizard-finish="onFinish"
  >
    <WizardStep
      id="onlineFeatures"
      title="ui.options.onlineFeatures"
      type="choice"
      v-model="onlineFeaturesData"
      :choices="[
        { value: 'disable', label: 'ui.common.no', isNo: true },
        { value: 'enable', label: 'ui.common.yes', isYes: true }
      ]"
    >
      <template #description>
        <div v-html="onlineFeaturesHtml"></div>
      </template>
    </WizardStep>

    <WizardStep
      id="telemetry"
      title="ui.options.telemetry"
      type="choice"
      v-model="telemetryData"
      :auto-skip="true"
      :enabled-when="[{ step: 'onlineFeatures', value: 'enable' }]"
      :choices="[
        { value: 'disable', label: 'ui.common.no', isNo: true },
        { value: 'enable', label: 'ui.common.yes', isYes: true }
      ]"
    >
      <template #description>
        <div v-html="telemetryDescription"></div>
      </template>
    </WizardStep>

    <WizardStep
      id="confirmation"
      title="ui.consent.confirmation"
      type="confirmation"
      v-model="confirmationData"
    >
      <template #description>
        <div v-html="confirmationHtml"></div>
      </template>
      <WizardSummary />
    </WizardStep>
  </WizardView>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { WizardView, WizardStep, WizardSummary } from "@/common/modules/wizard"
import { vBngBlur, vBngOnUiNav } from "@/common/directives"
import { useUINavScope } from "@/services/uiNav"
import { useSettings } from "@/services/settings"
import { useBridge } from "@/bridge"
import { $content, $translate } from "@/services"

useUINavScope("consent")

const settings = useSettings()
const { lua } = useBridge()

const onlineFeaturesData = ref({})
const telemetryData = ref({})
const confirmationData = ref({})

const parseDescription = descKey => $content.bbcode.parse($translate.instant(descKey))
const onlineFeaturesHtml = computed(() => parseDescription("ui.mainmenu.onlineFeatures.featureDescription"))
const telemetryDescription = computed(() => {
  const enabled = onlineFeaturesData.value.choice === "enable"
  const desc = enabled ? "ui.mainmenu.telemetry.featureDescription" : "ui.mainmenu.telemetryOnlineHint"
  return parseDescription(desc)
})
const confirmationHtml = computed(() => parseDescription("ui.mainmenu.privacyPolicyHint"))

const onStepComplete = ({ stepId, data }) => {
  if (stepId === "onlineFeatures") {
    telemetryData.value = data.choice === "enable" ? {} : { choice: "disable" }
  }
}

const onFinish = async () => {
  try {
    const settingsToApply = {}
    if (onlineFeaturesData.value.choice) {
      settingsToApply.onlineFeatures = onlineFeaturesData.value.choice
    }
    if (telemetryData.value.choice) {
      settingsToApply.telemetry = telemetryData.value.choice
    }
    await settings.apply(settingsToApply)

    if (settingsToApply.telemetry === "enable") {
      console.log("Starting telemetry...")
    } else if (settingsToApply.telemetry === "disable") {
      console.log("Unloading telemetry...")
    }

    backToMenu()
  } catch (error) {
    console.error("Error applying consent settings:", error)
  }
}

const backToMenu = () => window.bngVue.gotoAngularState("menu.mainmenu")

onMounted(async () => {
  await settings.waitForData()
  const onlineFeatures = settings.values.onlineFeatures
  if (onlineFeatures && onlineFeatures !== "ask") {
    onlineFeaturesData.value = { choice: onlineFeatures }
  }
  const telemetry = settings.values.telemetry
  if (telemetry && telemetry !== "ask") {
    telemetryData.value = { choice: telemetry }
  }
})
</script>
