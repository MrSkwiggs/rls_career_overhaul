<!-- BNGBngSoundClass Directive Demo -->
<template>
  <BngButton :accent="ACCENTS.secondary" tabindex="1" v-bng-sound-class="'bng_click_hover_generic'">
    v-bng-sound-class="'bng_click_hover_generic'"
  </BngButton><br />
  <BngButton :accent="ACCENTS.text" tabindex="1" v-bng-sound-class="'bng_click_hover_bigmap'">
    v-bng-sound-class="'bng_click_hover_bigmap'"
  </BngButton><br />
  <BngButton @click="ts" tabindex="1" v-bng-sound-class="dynamicSound">
    {{ dynamicSound }} (Click to change sound)
  </BngButton><br />
  <BngButton @click="playSound">
    Play sound
  </BngButton>
</template>

<style scoped>
.bng-button {
  margin-bottom: 1em;
}
</style>

<script setup>
import { BngButton, ACCENTS } from "@/common/components/base"
import { ref } from "vue"
import { lua } from "@/bridge"

import { vBngSoundClass } from "@/common/directives"

const dynamicSound = ref("bng_click_hover_bigmap")

function toggleSound() {
  dynamicSound.value = dynamicSound.value === "bng_click_hover_bigmap" ? "bng_click_hover_generic" : "bng_click_hover_bigmap"
}
const ts = () => window.setTimeout(toggleSound, 500)

function playSound() {
  lua.ui_audio.playEventSound("bng_click_generic", "click")
}
</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./BngSoundClass_demo.vue?raw"
export default {
  source,
  title: "TODO - Friendly name",
  description: `TODO - Description of directive`,
  propInfo: [],
  attrInfo: [],
}

</script>
