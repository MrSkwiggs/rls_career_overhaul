<template>
  <div class="logo-wrapper">
    <div class="logo" :style="{ '--logo': `url('${productLogo}')` }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { getAssetURL } from "@/utils"
import { lua } from "@/bridge"

const logos = {
  beamng: getAssetURL("images/logos.svg#bng-beamng"),
  tech: getAssetURL("images/logos.svg#bng-tech"),
  drive: getAssetURL("images/logos.svg#bng-drive"),
  research: getAssetURL("images/logos.svg#bng-research"),
}

const productLogo = ref(logos.drive)

onMounted(async () => {
  if (await lua.extensions.tech_license.isValid()) {
    // license is correct, set tech logo
    productLogo.value = logos.tech
  } else if (window.beamng) {
    const name = window.beamng.product.replace("BeamNG.", "")
    /// if name is not associated with logo, leave the default logo
    if (name in logos)
      productLogo.value = logos[name]
    /// if name is not associated with logo, assume "drive"
    // productLogo.value = logos[name] || logos.drive
  } else {
    // assume drive if no tech license nor global beamng object
    productLogo.value = logos.drive
  }
})
</script>

<style lang="scss" scoped>
$xoffset: -20%; // logo side padding
$lines: 2em; // side lines width

.logo-wrapper {
  position: relative;
  width: 25em;
  height: 5em;
  margin: 0 auto;
  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    transform: skewX(-23deg);
    pointer-events: none;
  }
  &::before {
    $pos: calc($xoffset + $lines);
    left: $pos;
    right: $pos;
    background-color: white;
  }
  &::after {
    $pos: calc($xoffset - 0.5em);
    left: $pos;
    right: $pos;
    border: 0 solid var(--bng-orange);
    border-left-width: $lines;
    border-right-width: $lines;
  }
  > * {
    position: absolute;
    top: 17%;
    bottom: 17%;
    left: 0;
    right: 0;
    height: unset !important;
    width: unset !important;
  }
}

.logo {
  display: inline-block;
  width: 100%;
  height: 100%;
  background-image: var(--logo);
  background-repeat: no-repeat;
  background-position: 50% 50%;
  background-size: contain;
}
</style>