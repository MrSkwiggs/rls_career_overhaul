<template>
  <WizardView
    title="ui.releaseInfo.title"
    :preheadings="[`v.${SysInfo.versionSimple}`]"
    style="--wizard-height: 45rem;"
    v-bng-blur
    bng-ui-scope="releaseInfo"
    v-bng-on-ui-nav:menu,back="backToMenu"
    @wizard-finish="onFinish"
  >
    <WizardStep
      id="releaseInfo"
      title="ui.releaseInfo.stepTitle"
    >
      <div v-html="descriptionHtml"></div>
    </WizardStep>
  </WizardView>
</template>

<script setup>
import { computed, onMounted } from "vue"
import { WizardView, WizardStep } from "@/common/modules/wizard"
import { vBngBlur, vBngOnUiNav } from "@/common/directives"
import { useSettings } from "@/services/settings"
import SysInfo from "@/services/sysInfo"
import { useUINavScope } from "@/services/uiNav"
import { $content, $translate } from "@/services"

useUINavScope("releaseInfo")

const settings = useSettings()

// this is only needed for bbcode parsing, or use DynamicContent component
const parseDescription = descKey => $content.bbcode.parse($translate.instant(descKey))
const descriptionHtml = computed(() => parseDescription("ui.releaseInfo.description"))

const onFinish = async () => {
  // await settings.apply({ uiReleaseInfoVersionShown: SysInfo.versionSimple })
  backToMenu()
}

const backToMenu = () => window.bngVue.gotoAngularState("menu.mainmenu")

onMounted(async () => {
  await settings.waitForData()
})
</script>
