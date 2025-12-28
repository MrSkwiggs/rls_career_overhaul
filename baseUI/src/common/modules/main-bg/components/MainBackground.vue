<template>
  <Slideshow
    class="background-image"
    ref="carousel"
    :images="backgrounds.normal"
    :delay="10000"
    transition
    shuffle
  />
  <!-- this is to force the browser to show images right away by storing them in memory -->
  <div v-for="list in backgrounds" class="backgrounds-cache">
    <img v-for="src in list" :src="getAssetURL(src)" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { getAssetURL } from "@/utils"
import { lua } from "@/bridge"
import Slideshow from "./Slideshow.vue"

// number of images
const DRIVE = 8
const TECH = 1

const bgPathResolve = (product, name, blur = false) =>
  `images/mainmenu/${product ? product + "/" : ""}${name}${blur ? "_blur" : ""}.jpg`

const _backgrounds = {
  drive: Array.from({ length: DRIVE }, (_, i) => bgPathResolve("drive", i + 1)),
  drive_blur: Array.from({ length: DRIVE }, (_, i) => bgPathResolve("drive", i + 1, true)),
  tech: Array.from({ length: TECH }, (_, i) => bgPathResolve("tech", i + 1)),
  tech_blur: Array.from({ length: TECH }, (_, i) => bgPathResolve("tech", i + 1, true)),
  unofficial: [bgPathResolve(null, "unofficial_version")],
  unofficial_blur: [bgPathResolve(null, "unofficial_version", true)],
}
const backgroundId = ref("drive")
const backgrounds = computed(() => ({
  normal: _backgrounds[backgroundId.value],
  blur: _backgrounds[backgroundId.value + "_blur"],
}))

const carousel = ref()
defineExpose({
  carousel: computed(() => carousel.value),
  backgrounds: computed(() => backgrounds.value),
})

onMounted(async () => {
  const isTech = await lua.extensions.tech_license.isValid()
  backgroundId.value = isTech ? "tech" : "drive"
  // do we really need to check for this if we already confirmed the license?
  bngApi.engineLua("sailingTheHighSeas", ahoy => {
    backgroundId.value = ahoy ? "unofficial" : isTech ? "tech" : "drive"
  })
})
</script>

<style lang="scss" scoped>
.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}

.backgrounds-cache {
  // this must not be display:none; in order to work
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  opacity: 0.01;
  overflow: hidden;
  pointer-events: none;
  > img {
    width: 1px;
    height: 1px;
  }
}
</style>
