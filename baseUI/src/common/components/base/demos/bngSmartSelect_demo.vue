<template>
  <div class="dropdemo">
    <div>
      <BngSmartSelect v-model="value" :items="items" @change="onValueChanged" />
    </div>
    <div>
      <BngButton :accent="ACCENTS.secondary" @click="amount -= ~~(amount / 2)">-</BngButton>
      {{ amount }}
      <BngButton :accent="ACCENTS.secondary" @click="amount += amount">+</BngButton>
      <span class="info">(count includes group titles)</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { BngSmartSelect, BngButton, ACCENTS } from "@/common/components/base"

const itemsMany = [
  { label: "First five", group: true },
  { label: "Item one", value: 1, grouped: true },
  { label: "Item two", value: 2, grouped: true },
  { label: "Item three", value: 3, grouped: true },
  { label: "Item four", value: 4, grouped: true },
  { label: "Item five", value: 5, grouped: true },
  { label: "Second five", group: true },
  { label: "Item six", value: 6, grouped: true, disabled: true },
  { label: "Item seven", value: 7, grouped: true },
  { label: "Item eight", value: 8, grouped: true },
  { label: "Item nine", value: 9, grouped: true },
  { label: "Item ten", value: 10, grouped: true },
  { label: "Third five", group: true },
  { label: "Item eleven", value: 11, grouped: true },
  { label: "Item twelve", value: 12, grouped: true, disabled: true },
  { label: "Item thirteen", value: 13, grouped: true },
  { label: "Item fourteen", value: 14, grouped: true },
  { label: "Item fifteen", value: 15, grouped: true },
  { label: "Fourth five", group: true },
  { label: "Item sixteen", value: 16, grouped: true },
  { label: "Item seventeen", value: 17, grouped: true },
  { label: "Item eighteen", value: 18, grouped: true },
  { label: "Item nineteen", value: 19, grouped: true },
  { label: "Item twenty", value: 20, grouped: true },
]

const amount = ref(12)
const items = computed(() => itemsMany.slice(0, amount.value))

const value = ref(itemsMany[0].value)

function onValueChanged(value) {
  console.log("valueChanged", value)
}
</script>

<style lang="scss" scoped>
.dropdemo {
  display: flex;
  flex-flow: row wrap;
  > * {
    flex: 0 1 30%;
    width: 30%;
    margin: 1em 1%;
  }
}

.inner-list {
  max-height: 100%;
}

.long-names {
  width: 5em;
}

.info {
  font-style: italic;
  white-space: nowrap;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngSmartSelect_demo.vue?raw"
export default {
  source,
  title: "Smart Select",
  description: `A component for displaying a list of options to choose between.\n\nIt will automatically switch between a dropdown and a select box depending on the number of items.`,
  propInfo: [
    {
      name: "items",
      type: "Array",
      desc: "__REQUIRED__ - array of objects representing the dropdown choices. Should be in the form:\n\n`{ label: 'Label text', value: 1, disabled: false (optional), focusable: false (optional), tooltip: 'Tooltip text' (optional) }`",
    },
    {
      name: "type",
      type: "String",
      desc: "Type of select to force regardless of the number of items - should be one of:\n\n`select` - Display a select box\n\n`dropdown` - Display a dropdown",
    },
    {
      name: "threshold",
      type: "Number",
      desc: "The number of items at which the select will switch to a dropdown.\n\nDefault: `5`",
    },
    {
      name: "highlight",
      type: "String/Array/RegExp",
      desc: "(Dropdown only) String or array of strings or RegExp to highlight specific items in the dropdown (uses `vBngHighlighter`)",
    },
    {
      name: "disabled",
      type: "Boolean",
      desc: "Switch to disable the dropdown",
    },
  ],
  attrInfo: [

  ],
}

</script>
