<template>
  <div>
    <p>
      <BngButton
        :accent="ACCENTS.secondary"
        @click="onClick"
        v-bng-double-click="dblEnabled ? onDblClick : null"
      >Normal</BngButton>
      <BngButton
        :accent="ACCENTS.secondary"
        @click="onClick"
        v-bng-double-click.capture="dblEnabled ? onDblClick : null"
      >Capture</BngButton>
      <BngSwitch v-model="dblEnabled">Enable double click</BngSwitch>
    </p>
    <p>
      Dynamic mode switch:
      <BngButton
        :accent="ACCENTS.secondary"
        @click="onClick"
        v-bng-double-click:[dblMode]="dblEnabled ? onDblClick : null"
      >Dynamic</BngButton>
      <BngSwitch :disabled="!dblEnabled" v-model="dblCapture">Capture mode</BngSwitch>
    </p>
    <p>
      Single clicks: {{ sglCount }}
      Double clicks: {{ dblCount }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { BngButton, BngSwitch, ACCENTS } from "@/common/components/base"
import { vBngDoubleClick } from "@/common/directives"

const dblEnabled = ref(true)
const dblCapture = ref(false)
const dblMode = computed(() => dblCapture.value ? "capture" : "")
const sglCount = ref(0)
const dblCount = ref(0)
const onClick = () => sglCount.value++ && console.log("single click")
const onDblClick = () => dblCount.value++ && console.log("double click")
</script>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./BngDoubleClick_demo.vue?raw"
export default {
  source,
  title: "Double Click",
  description: `This directive will trigger a callback when a double click is detected.`,
  propInfo: [],
  attrInfo: [],
}
</script>
