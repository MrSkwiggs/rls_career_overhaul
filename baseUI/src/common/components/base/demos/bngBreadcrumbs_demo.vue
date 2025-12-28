<template>
  <div>
    Default: <BngBreadcrumbs :items="samplePath" limit="3" blur @click="onPath" />
  </div>
  <div>
    Simple: <BngBreadcrumbs :items="samplePath" limit="3" simple blur @click="onPath" />
  </div>
  <div>
    Non-navigable: <BngBreadcrumbs :items="samplePath" limit="5" :navigable="false" blur @click="onPath" />
  </div>
</template>

<script setup>
import { reactive, computed } from "vue"
import { BngBreadcrumbs } from "@/common/components/base"

const labels = reactive({
  1: "Ipsum",
  3: "Sit",
})

const samplePath = computed(() => [
  { label: "Lorem", items: [{ label: "Ipsum", index: 1 }, { label: "Opossum", index: 1 }] },
  { label: labels[1] },
  { label: "Dolor", items: [{ label: "Sit", index: 3 }, { label: "Sat", index: 3 }, { label: "Soup", index: 3 }] },
  { label: labels[3] },
  { label: "Amet" },
])

const onPath = item => {
  console.log("Clicked on path", item)
  if (item.index in labels) {
    labels[item.index] = item.label
  }
}
</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngBreadcrumbs_demo.vue?raw"
export default {
  source,
  title: "Display interactive breadcrumbs",
  description: `Breadcrumbs in one line with dropdowns for quick navigation`,
  propInfo: [
    {
      name: "items",
      type: "Array",
      desc: "Array of objects to show in the path",
    },
    {
      name: "limit",
      type: "Number",
      desc: "Specifies the limit of how many items are shown at once (default: 3)"
    },
    {
      name: "simple",
      type: "Boolean",
      desc: "Switch to disable arrows with dropdown menus (default: false)",
    },
    {
      name: "blur",
      type: "Boolean",
      desc: "Switch to specify if breadcrumbs should blur the background behind it (default: false)",
    },
    {
      name: "disable-last-item",
      type: "Boolean",
      desc: "Makes the last item not clickable (default: false)",
    },
    {
      name: "show-back-button",
      type: "Boolean",
      desc: "Shows a back button (default: false)",
    },
    {
      name: "show-back-binding",
      type: "Boolean",
      desc: "If back button is shown, this will show the binding for it (default: true)",
    },
    {
      name: "navigable",
      type: "Boolean",
      desc: "Controls if the component is navigable with UI navigation (default: true)",
    },
  ],
  attrInfo: [
  ],
}

</script>
