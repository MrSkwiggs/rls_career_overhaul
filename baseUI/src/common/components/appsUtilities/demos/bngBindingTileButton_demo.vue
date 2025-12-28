<template>
  <div class="demo-wrapper">
    <div class="row">
      <BngBindingTileButton
        :icon="'bucketTilt'"
        label="Action Tile"
        :show-unassigned="true"
        layout="horizontal"
        :value="value"
        :target-value="target"
      >
        <template #binding>
          <BngBinding action="steering" :show-unassigned="true" />
        </template>
      </BngBindingTileButton>
      <BngBindingTileButton
        :icon="'/ui/ui-vue/src/assets/fonts/bngIcons/svg/steeringWheelCommon.svg'"
        label="Action Tile"
        :show-unassigned="true"
        layout="vertical"
        :value="valueBi"
        :target-value="targetBi"
        :is-bidirectional="true"
      >
        <template #binding>
          <BngBinding action="steering" :show-unassigned="true" />
        </template>
      </BngBindingTileButton>
    </div>
  </div>
</template>

<script setup>
import { BngBindingTileButton } from "@/common/components/appsUtilities"
import { BngBinding, BngIcon, icons } from "@/common/components/base"

// Demo support outside of game: feed mocked bindings so BngBinding renders
import { inject, ref } from "vue"
import { runInBrowser, getMockedData } from "@/utils/"
const $game = inject("$game")
runInBrowser(() => getMockedData("inputBindings.sample").then(data => $game.events.emit("InputBindingsChanged", data)))

// sample values
const value = ref(0.35)
const target = ref(0.6)
const valueBi = ref(-0.2)
const targetBi = ref(0.25)
</script>

<style scoped lang="scss">
.demo-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.row {
  display: flex;
  gap: 0.5rem;
}
</style>

<script>
import source from "./bngBindingTileButton_demo.vue?raw"
export default {
  source,
  title: "Binding Tile Button",
  description: "Tiled button wrapper showing a binding via BngBinding with icon font.",
  propInfo: [
    { name: "label", type: "String", desc: "Tile label text" },
    { name: "icon", type: "Icon (icons.*)", desc: "Icon font glyph for the tile" },
    { name: "layout", type: "'horizontal'|'vertical'", desc: "Tile layout variant" },
    { name: "action", type: "String", desc: "Action to display via BngBinding" },
    { name: "uiEvent", type: "String", desc: "UI event to display via BngBinding" },
    { name: "showUnassigned", type: "Boolean", desc: "Show [N/A] when no binding" },
  ],
}
</script>


