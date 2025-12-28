<template>
  <span
    v-if="isGlyph"
    class="icon-base"
    :class="{
      'icon-not-found': displayIcon === icons.placeholder,
      'icon-invisible': displayIcon && displayIcon.invisible,
    }"
  >{{ iconGlyph }}</span>
  <BngImageAsset v-else class="icon-img" v-bind="imageProps" @error="onImageError" />
</template>

<script>
import { icons as iconsOrig, iconsBySize, iconsByTag, getIconsWithTags } from "@/assets/fonts/bngIcons/bngIcons.js"
// FIXME: it would better to have an empty icon in font instead. consider this solution temporary.
const icons = Object.freeze({
  ...iconsOrig,
  _empty: {
    ...iconsOrig.minus,
    invisible: true,
  },
})
export { icons, iconsBySize, iconsByTag, getIconsWithTags }
</script>

<script setup>
import { computed, ref } from "vue"
import { BngImageAsset } from "@/common/components/base"

const props = defineProps({
  type: {
    type: [String, Object],
    default: "",
  },
  // Icon to use if an external image fails to load (e.g., 404)
  fallbackType: {
    type: String,
    default: "placeholder",
  },
  color: {
    type: String,
    default: "#fff"
  },
  asImage: {}, // should be deprecated; currently used in FuelGauge.vue only (and in BngIcon demo, of course)
  image: String,
  externalImage: String,
})

const hasImageSource = computed(() => !!props.image || !!props.externalImage)
const imageSrcKey = computed(() => props.image || props.externalImage || "")
const errorSrcKey = ref("")
const isCurrentSrcErrored = computed(() => !!imageSrcKey.value && errorSrcKey.value === imageSrcKey.value)

const isGlyph = computed(() => {
  // Render glyph when there's no image source, or the current source previously errored
  if (!hasImageSource.value) return true
  if (isCurrentSrcErrored.value) return true
  return false
})

const icon = computed(() => {
  let res
  switch (typeof props.type) {
    case "object":
      if (props.type.glyph) res = props.type
      break
    case "string":
      if (props.type in icons) res = icons[props.type]
      break
  }
  return res
})

const displayIcon = computed(() => {
  const fallback = (typeof props.fallbackType === "string" && props.fallbackType in icons) ? icons[props.fallbackType] : icons.placeholder
  if (isCurrentSrcErrored.value) return fallback
  // If type is unknown and we have no image, use fallback glyph
  if (!icon.value && !hasImageSource.value) return fallback
  return icon.value
})

const iconGlyph = computed(() => displayIcon.value ? displayIcon.value.glyph : icons.placeholder.glyph)
// const iconColor = computed(() => icon.value ? props.color : "#f00")

const OFF_VALUES = [null, undefined, false, "false", 0, "0"]
const asImage = computed(() => OFF_VALUES.includes(props.asImage) ? false : (props.asImage || true))

const imageProps = computed(() => {
  const res = {
    bgColor: props.color,
    mask: ["mask", "span"].includes(asImage.value),
  }
  if (!icon.value) {
    res.bgColor = "#f00"
  }
  if (asImage.value) {
    // res.src = icon.value // TODO: glyph as a mask (?)
  } else if (props.image) {
    res.src = props.image
  } else if (props.externalImage) {
    res.externalSrc = props.externalImage
  }
  return res
})

function onImageError() {
  errorSrcKey.value = imageSrcKey.value
}

</script>

<style scoped>
.icon-base {
  font-family: "bngIcons" !important;
  font-size: var(--bng-icon-size, 1.5em);
  line-height: 1em;
  color: var(--bng-icon-color, v-bind(color));
  font-weight: 100 !important;
}
.icon-not-found {
  color: #f00;
  /* -webkit-text-stroke: 1px #fff; */
}
.icon-invisible {
  color: transparent !important;
}
.icon-img,
.icon-base {
  align-self: center;
  display: inline-block;
}
.icon-img {
  width: 1.5em;
  height: 1.5em;
}
</style>
