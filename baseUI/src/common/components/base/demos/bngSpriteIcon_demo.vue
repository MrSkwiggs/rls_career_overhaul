<template>
  <span>Sprite Icons:</span>
  <div>
    <BngSpriteIcon class="demo-icon" style="width: 3em; height: 3em" src="map_mission_longjump_triangle" />
    <BngSpriteIcon class="demo-icon" style="width: 3em; height: 3em; filter: drop-shadow(0 0 0.5rem #fff8);" src="general_beamng_logo" />
    <BngSpriteIcon class="demo-icon" deg="-20" color="#fc0" style="width: 3em; height: 3em" src="letter_j" />
  </div>
</template>

<script setup>
import { BngSpriteIcon } from "@/common/components/base"
</script>

<style scoped>
div {
  display: flex;
  flex-wrap: wrap;
}
.demo-icon {
  min-width: 1.5em;
  min-height: 1.5em;
  margin: 0.2em;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngSpriteIcon_demo.vue?raw"
export default {
  source,
  title: "Show a sprite icon",
  description: `Displays a sprite icon from within an SVG sprite atlas (sheet)`,
  propInfo: [
    {
      name: "atlasPath",
      type: "String",
      desc: "Path of the sprite atlas file (relative to `ui/ui-vue/src/assets/`). Default is `'sprites/svg-symbols.svg'`",
    },
    {
      name: "src",
      type: "String",
      desc: "[Required] The id within the sprite atlas of the required icon",
    },
    {
      name: "color",
      type: "String",
      desc: "Sets the fill colour to use for the icon. Default is `'#fff'`",
    },
    {
      name: "deg",
      type: "Number",
      desc: "Optional rotation of the icon in degrees. Default is `0`",
    },
  ],
  attrInfo: [

  ],
}

</script>
