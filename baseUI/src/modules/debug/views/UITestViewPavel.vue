<!--*** Test Page for Pavel -->
<template>
  <div class="fullscreen-wrapper" bng-ui-scope="dizzaster" v-bng-on-ui-nav:menu="exit">
    <h1>Test Page for Pavel</h1>

    <BngButton v-for="(cmp, name) in comps" @click="comp = cmp" :accent="ACCENTS.text">{{ name }}</BngButton>
    <BngButton @click="comp = null" :accent="ACCENTS.attention">reset</BngButton>

    <div class="test-view">
      <component v-if="comp" :is="comp" :exit-override="() => (comp = null)" />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngButton, ACCENTS } from "@/common/components/base"
import { vBngOnUiNav } from "@/common/directives"

// import stuff
import Pause from "@/modules/career/views/Pause.vue"
import ProgressLanding from "@/modules/career/views/ProgressLanding.vue"
import SimpleGraph from "@/common/components/base/demos/bngSimpleGraph_demo.vue"
import GameplayApps from "@/modules/apps/gameplayApps/gameplayApps.vue"

const comps = {
  Pause,
  ProgressLanding,
  SimpleGraph,
  GameplayApps,
}

const comp = ref(null)

function exit() {
  if (comp.value) comp.value = null
}
</script>

<style lang="scss" scoped>
.fullscreen-wrapper {
  background: rgba(0, 0, 0, 0.8);
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  color: white;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  grid-template-rows: auto auto 1fr;
  grid-auto-rows: minmax(2rem, max-content);
  align-items: start;
  h1 {
    grid-area: 1 / 1 / 1 / -1;
  }
}

.test-view {
  position: relative;
  grid-column: 1 / -1;
  grid-row: 3;
  display: flex;
  align-self: stretch;
}
</style>
