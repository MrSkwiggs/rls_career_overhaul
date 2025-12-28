<!-- Slot switcher Demo -->
<template>
  <br>
  Slot:<span v-for="slotID in slots" :key="slotID" class="slot-select" @click="() => (mySlot = slotID = slotID)">{{ slotID }}</span> <br /><br />
  <p>Intial slot is not set (nothing displayed). Click a slot id above to switch to it.</p>
  <p>Default props passed from slot switcher to active slot in this demo are: <code>:accent="ACCENTS.secondary" @click="showMsg"</code></p>
  <br />
  <SlotSwitcher :slotId="mySlot" :accent="ACCENTS.secondary" @click="showMsg">
    <template #default="props"><BngButton v-bind="props">Button (no overrides)</BngButton></template>
    <template #alt="props"><BngButton v-bind="props" @click="showAltMsg">Alt Button (adds its own extra&nbsp;<code>@click</code>)</BngButton></template>
    <template #third="props"
      ><BngButton v-bind="props" :accent="ACCENTS.attention">Third Button (overrides&nbsp;<code>accent</code>&nbsp;with 'attention')</BngButton></template
    >
  </SlotSwitcher>
</template>

<script setup>
import { BngButton, ACCENTS } from "@/common/components/base"
import { SlotSwitcher } from "@/common/components/utility"
import { ref } from "vue"

const slots = ["default", "alt", "third"]

const mySlot = ref("")

function showMsg() {
  alert("Message!")
}

function showAltMsg() {
  alert("Alternate Message!")
}
</script>

<style scoped>
.slot-select {
  background-color: var(--bng-cool-gray-700);
  padding: 0.5em;
  border-radius: var(--bng-corners-2);
  margin-left: 0.5em;
}

.slot-select:hover {
  color: white;
  cursor: pointer;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./slotSwitcher_demo.vue?raw"
export default {
  source,
  title: "Simple slot switcher",
  description: `Allows simple switching between named slots, with a capability to bind main attrs directly to the current slot`,
  propInfo: [
    {
      name: "slotId",
      type: "String",
      desc: "ID of the slot to display. Defaults to the main slot: `'default'`",
    },
  ],
  attrInfo: [

  ],
}

</script>

