<template>
  <div style="display: flex; flex-direction: column">
    <div>
      <label>Select One</label>
      <BngPillFilters ref="selectOneFilters" selectOnFocus :options="bngPillOptions" />
      <div class="actions">
        <BngButton @click="onSelectPrevious">Previous</BngButton>
        <BngButton @click="onSelectNext">Next</BngButton>
      </div>
    </div>
    <div>
      <label>Select Focus Only</label>
      <BngPillFilters ref="selectFocusOnlyFilters" :options="bngPillOptions" />
      <div class="actions">
        <BngButton @click="onFocusSelectPrevious">Previous</BngButton>
        <BngButton @click="onFocusSelectNext">Next</BngButton>
        <BngButton @click="onFocusSelectCurrent">Select Current</BngButton>
      </div>
    </div>
    <div>
      <label>Select Many</label>
      <BngPillFilters selectMany :options="bngPillOptions" />
    </div>
    <div>
      <label>Required</label>
      <BngPillFilters :options="bngPillOptions" required />
    </div>
    <div>
      <label>Switch Data</label>
      <BngPillFilters ref="selectOneFilters" selectOnFocus :options="data" />
      <div class="actions">
        <BngButton @click="switchData">Switch Data</BngButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { BngPillFilters, BngButton } from "@/common/components/base"

const bngPillOptions = ref([
  { value: 0, label: "All" },
  { value: 1, label: "Body" },
  { value: 2, label: "Engine" },
  { value: 3, label: "Transmission" },
  { value: 4, label: "Suspension" },
  { value: 5, label: "Electrics" },
])

const bngPillOptions2 = ref([
  { value: 6, label: "Random" },
  { value: 7, label: "Value" },
  { value: 8, label: "Here" },
])

const shouldSwitchData = ref(false)
const data = computed(() => (shouldSwitchData.value ? bngPillOptions.value : bngPillOptions2.value))

const selectOneFilters = ref(null)
const selectFocusOnlyFilters = ref(null)

const switchData = () => {
  shouldSwitchData.value = !shouldSwitchData.value
}

function onSelectNext() {
  selectOneFilters.value.focusNext()
}

function onSelectPrevious() {
  selectOneFilters.value.focusPrevious()
}

function onFocusSelectNext() {
  selectFocusOnlyFilters.value.focusNext()
}

function onFocusSelectPrevious() {
  selectFocusOnlyFilters.value.focusPrevious()
}

function onFocusSelectCurrent() {
  selectFocusOnlyFilters.value.toggleFocusedPill()
}
</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngPillFilters_demo.vue?raw"
export default {
  source,
  title: "Group of pill checkboxes",
  description: `A group of pill checkboxes - usually used to select one or a number of filters for a list`,
  propInfo: [
    {
      name: "modelValue",
      type: "Array",
      desc: "For `v-model` - shouldn't be used directly",
    },
    {
      name: "options",
      type: "Array",
      desc: "[Required] - an array of option objects to populate the list of pills. Option objects should take the form:\n\n`{ value: <value>, label: \"<label>\" }`",
    },
    {
      name: "selectOnFocus",
      type: "Boolean",
      desc: "Set to `true` if you want pills to be automatically selected when the pill receives focus",
    },
    {
      name: "selectMany",
      type: "Boolean",
      desc: "Switch to allow multiple pills to be selected at once",
    },
    {
      name: "showCheckIcon",
      type: "Boolean",
      desc: "Switch to show/hide icon when the pills are 'checked'. Default is `true`",
    },
    {
      name: "required",
      type: "Boolean",
      desc: "If set to `true`, it's required that at least one pill is selected",
    },
  ],
  attrInfo: [

  ],
}

</script>
