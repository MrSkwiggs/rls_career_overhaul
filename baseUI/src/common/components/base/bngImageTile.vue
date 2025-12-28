<!-- bngImageTile - a tile with a large image/icon (optionally labelled) -->
<template>
  <BngTile :label="label" :backgroundImage="image" :backgroundExternalImage="externalImage" :ratio="ratio">
    <BngOldIcon v-if="oldIcon" class="icon" :type="oldIcon" span />
    <BngIcon v-if="icon" class="glyph" :type="icon" />
    <img v-else-if="src || externalSrc" class="icon" :src="assetURL" />
    <template v-if="slots.default" #label>
      <slot></slot>
    </template>
  </BngTile>
</template>

<script setup>
import { BngOldIcon, BngIcon, BngTile } from "@/common/components/base"
import { getAssetURL } from "@/utils"
import { computed, useSlots } from "vue"

const props = defineProps({
  oldIcon: String,
  src: String,
  externalSrc: String, // src for assets external to Vue projects
  label: String,
  image: String, // background-image that takes the full available frame
  externalImage: String, // 'image' for external assets
  icon: [Object, String],
  ratio: {
    type: String,
    default: "4:3",
  },
})

const slots = useSlots()
const assetURL = computed(() => (props.externalSrc ? props.externalSrc : getAssetURL(props.src)))
</script>

<style lang="scss" scoped>
.icon {
  width: 2rem;
  height: 2rem;
}

.glyph {
  font-size: 3em;
}

:deep(*) > .icon {
  width: 2rem;
  height: 2rem;
}
</style>
