<template>
  <LayoutSingle
    v-bng-scoped-nav="{ activateOnMount: true, bubbleWhitelistEvents: ['tab_l', 'tab_r', 'menu'] }"
    class="vehcfg"
    @deactivate="exit"
  >
    <Tabs class="bng-tabs" v-bng-frustum-mover.left="true" @change="syncWithStates">
      <TabList v-bng-blur />
      <Parts :tab-selected="tab === 'parts'" :tab-heading="$t('ui.vehicleconfig.parts')" v-bng-blur />
      <Tuning :tab-selected="tab === 'tuning'" :tab-heading="$t('ui.vehicleconfig.tuning')" v-bng-blur />
      <Paint :tab-selected="tab === 'color'" :tab-heading="$t('ui.vehicleconfig.color')" v-bng-blur />
      <Save :tab-selected="tab === 'save'" :tab-heading="$t('ui.vehicleconfig.save') + ' & ' + $t('ui.vehicleconfig.load')" v-bng-blur />
      <Debug :tab-selected="tab === 'debug'" :tab-heading="$tt('ui.debug.vehicle')" v-bng-blur />
    </Tabs>
  </LayoutSingle>
</template>

<script setup>
import { LayoutSingle } from "@/common/layouts"
import { Tabs, TabList } from "@/common/components/utility"
import { vBngScopedNav, vBngBlur, vBngFrustumMover } from "@/common/directives"

import Parts from "../components/Parts.vue"
import Tuning from "../components/Tuning.vue"
import Paint from "../components/Paint.vue"
import Save from "../components/Save.vue"
import Debug from "../components/Debug.vue"


const props = defineProps({
  tab: {
    type: String,
    default: "parts",
    validator: val => !val || ["parts", "tuning", "color", "save", "debug"].includes(val),
  },
})

const exit = (event) => {
  if (event.detail.force) return
  window.bngVue.gotoAngularState("menu.mainmenu")
}

function syncWithStates(tab) {
  if (!window.bngVue) return
  tab = ["parts", "tuning", "color", "save", "debug"][tab.index] || "parts"
  window.bngVue.gotoAngularState(`menu.vehicleconfig.${tab}`)
}

const backToOld = () => window.bngVue && window.bngVue.gotoAngularState(`menu.vehicleconfigold.${props.tab}`)
</script>

<style lang="scss" scoped>
.vehcfg {
  --safezone-top: 2.75em;
  --safezone-bottom: 3.75em;
  --safezone-sides: 0;
  pointer-events: none;
  > * {
    pointer-events: all;
  }
}

:deep(.bng-tabs) {
  --tab-bg-active: var(--bng-cool-gray-700);
  --tab-bg-hover: var(--bng-orange-700);
  // --tab-bg: rgba(0,0,0,0.9);
  // --tab-content-bg: rgba(0,0,0,0.9);
  --tab-bg: rgba(var(--bng-cool-gray-900-rgb), 0.95);
  --tab-content-bg: rgba(var(--bng-cool-gray-900-rgb), 0.95);
  width: 35em;
  overflow: hidden;
  border-radius: var(--bng-corners-1);
  .tab-item {
    white-space: nowrap;
    // &:not(.tab-active-tab) {
    flex: 1 auto;
    text-overflow: ellipsis;
    overflow: visible;
    // }
  }
  .tab-list {
    margin: 0;
  }
  .tab-list,
  .tab-content {
    border-radius: 0;
  }
}

.vehconfig-new-ui {
  position: absolute;
  display: inline-block;
  top: 2.9em;
  left: 35.35em;
  width: auto;
  height: auto;
  padding: 0.75em 1em;
  border-radius: var(--bng-corners-1);
  text-align: center;
  background-color: rgba(0, 0, 0, 0.5);
  font-weight: 600;
  color: #fff;
}
.vehconfig-new-ui:hover,
.vehconfig-new-ui:focus {
  background-color: rgba(0, 0, 0, 0.7);
}
</style>
