<template>
  <div>
    <button tabindex="1" @click="swapLightDark">Swap light/dark</button>
    <h3>Actions (light + dark variants)</h3>
    <ul>
      <li v-for="action in actions" :key="action">
        <span class="sample">
          <BngBinding :action="action" :show-unassigned="true" :dark="!dark" />&nbsp;&nbsp;<BngBinding :action="action" :show-unassigned="true" :dark="dark" />
        </span>
        - {{ action }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { BngBinding } from "@/common/components/base"
import { ref } from "vue"

// for making demo work outside of game
import { inject } from "vue"
import { runInBrowser, getMockedData } from "@/utils/"
const $game = inject("$game")
runInBrowser(() => getMockedData("inputBindings.sample").then(data => $game.events.emit("InputBindingsChanged", data)))

const dark = ref(true)

const swapLightDark = () => (dark.value = !dark.value)

const actions = [
  "menu_item_select",
  "toggleBigMap",
  "bigMapMouseClick",
  "bigMapNextFilter",
  "bigMapPreviousFilter",
  "bigMapMoveForward",
  "bigMapMoveLeft",
  "bigMapMoveBackward",
  "bigMapMoveRight",
  "bigMapMoveForwardBackward",
  "bigMapMoveLeftRight",
  "bigMapZoom",
  "bigMapZoomIn",
  "bigMapZoomOut",
  "bigMapControllerZoom",
]
</script>

<style scoped>
.sample {
  display: inline-block;
  padding: 10px;
  margin: 0.25em 0;
  background-color: var(--bng-ter-blue-gray-700);
  border-radius: var(--bng-corners-2);
}
ul {
  overflow-y: auto;
  height: 520px;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngBinding_demo.vue?raw"
export default {
  source,
  title: "Display an action binding",
  description: `Shows a visual representation of the current binding for the given action. Will update live if bindings or active controllers change (try plugging/unplugging a controller whilst viewing this demo).`,
  // samples: [['<BngBinding :action="action" :show-unassigned="true" :dark="!dark" />', "A sample"]],
  propInfo: [
    {
      name: "action",
      type: "String",
      desc: "The name of the action (from actionMaps) to show the binding for",
    },
    {
      name: "showUnassigned",
      type: "Boolean",
      desc: "Switches whether to show unassigned bindings - will display as **N/A**",
    },
    {
      name: "device",
      type: "String",
      desc: "Specifies the device to use for looking up the binding",
    },
    {
      name: "deviceKey",
      type: "String",
      desc: "Specifies the device key to use for looking up the binding",
    },
    {
      name: "dark",
      type: "Boolean",
      desc: "Specifies light (`false`) / dark (`true`) appearance for the binding",
    },
    {
      name: "deviceMask",
      type: "String/Function",
      desc: "Specifies a mask to block display of returned binding based on the device nam. If a string is specified, the device name will be checked to see if it starts with that string. If a function is specified, the device name will be passed to that function, and a truthy/falsey return value is expected",
    },
    {
      name: "uiEvent",
      type: "String",
      desc: "Can be used instead of the 'action' prop, to look up the action associated with the given UI event.",
    },
  ],
  attrInfo: [
  ],
}

</script>
