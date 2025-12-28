<template>
  <div class="entry-example">
    Checked
    <BngPillCheckbox v-model="data.checkedDefault" @value-changed="valChanged">Electronics</BngPillCheckbox>
  </div>
  <div class="entry-example">
    Checked different icon
    <BngPillCheckbox v-model="data.checkedDiffIcon" :marked-icon="icons.bus">Electronics</BngPillCheckbox>
  </div>
  <div class="entry-example">
    Checked no icon
    <BngPillCheckbox v-model="data.checkedNoIcon" :marked-icon="false">Electronics</BngPillCheckbox>
  </div>
  <div class="entry-example">
    Unchecked (default icon)
    <BngPillCheckbox v-model="data.uncheckedDefault">Electronics</BngPillCheckbox>
  </div>
</template>

<script setup>
import { BngPillCheckbox, icons } from "@/common/components/base"
import { reactive } from "vue"

const data = reactive({
  checkedDefault: true,
  checkedDiffIcon: true,
  checkedNoIcon: true,
  uncheckedDefault: false,
})
const valChanged = v => console.log(v)
</script>

<style scoped lang="scss">
.entry-example {
  margin-top: 8px;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngPillCheckbox_demo.vue?raw"
export default {
  source,
  title: "Simple pill checkbox",
  description: `Simple pill component repurposed as a checkbox`,
  propInfo: [
    {
      name: "modelValue",
      type: "Boolean",
      desc: "For `v-model` - shouldn't be used directly",
    },
    {
      name: "markedIcon",
      type: "Boolean/Object",
      desc: "Mark the pill with an icon when it is 'checked'. Setting the value to `true` will use a default icon (check mark), and specifying an icon object will use the provided icon. Default is no icon",
    },
  ],
  attrInfo: [

  ],
}

</script>

