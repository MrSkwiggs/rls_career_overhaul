<!-- BNGOnUiNav Directive Demo -->
<template>
  <div bng-ui-scope="test" v-bng-on-ui-nav:*.modified="testing">
    <BngButton :accent="ACCENTS.secondary" tabindex="1" v-bng-on-ui-nav:back="() => handleClick('back')" @click="() => handleClick('click 1')"
      >Click 1 (back)</BngButton
    >&nbsp;
    <BngButton :accent="ACCENTS.secondary" v-bng-on-ui-nav:menu,back="() => handleClick('menu')" tabindex="2" @click="() => handleClick('click 2')"
      >Click 2 (menu)</BngButton
    >&nbsp; <BngButton :accent="ACCENTS.secondary" tabindex="1" v-bng-on-ui-nav:ok.asMouse="'#hb'">Will click handler button</BngButton>&nbsp;
    <BngButton id="hb" :accent="ACCENTS.secondary" @click="() => console.log('Handler button clicked')">Handler</BngButton>
  </div>
  <BngButton @click="toggleBlock">{{ block ? "Unfilter" : "Filter" }}</BngButton>
</template>

<style scoped>
.bng-button {
  margin-bottom: 1em;
}
span {
  font-weight: bold;
}
</style>

<script setup>
// import { useUINavScope } from "@/services/uiNav"
// import { default as UINavEvents, UI_EVENTS, UI_EVENT_GROUPS } from "@/bridge/libs/UINavEvents"
import { useUINavScope, getUINavServiceInstance, UI_EVENTS, UI_EVENT_GROUPS } from "@/services/uiNav"
import { BngButton, ACCENTS } from "@/common/components/base"
import { vBngOnUiNav } from "@/common/directives"

import { ref } from "vue"
// const events = [UI_EVENTS.menu, UI_EVENT_GROUPS.radialMenu]
const events = [UI_EVENTS.menu, UI_EVENTS.back]

const block = ref(false)

const toggleBlock = (...p) => {
  console.log(p)
  block.value = !block.value
  // block.value ? UINavEvents.setFilteredEvents(events) : UINavEvents.clearFilteredEvents()
  block.value ? getUINavServiceInstance().setFilteredEvents(events) : getUINavServiceInstance().clearFilteredEvents()
}

const scope = useUINavScope("test")

console.log(scope.current.value)
console.log(scope.set)

function handleClick(value) {
  console.log("We goin' back... Directive success:", value)
}

function testing(value, modifier, extras, eventName) {
  console.log("Catchall:", value, modifier, extras, eventName)
}
</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./BngOnUiNav_demo.vue?raw"
export default {
  source,
  title: "TODO - Friendly name",
  description: `TODO - Description of directive`,
  propInfo: [],
  attrInfo: [],
}

</script>
