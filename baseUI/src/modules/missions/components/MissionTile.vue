<template>
  <div class="tile">
    <AspectRatio :externalImage="card.image" class="image" />
    <AspectRatio v-if="card.expandGroupKey" class="folder" >
      <BngIcon class="glyph small" :type="card.expanded ? icons.BNGFolder : icons.folder" />
    </AspectRatio>
    <div class="name">
      {{$tt(card.name)}}
    </div>
  </div>
</template>

<script setup>
import AspectRatio from "@/common/components/utility/aspectRatio.vue"
import { BngIcon, icons } from "@/common/components/base"
const props = defineProps({
  card: {
    type:Object,
  }
})
</script>

<style scoped lang="scss">

.tile {
  border-radius: var(--bng-corners-1);
  overflow: hidden;
  position: relative;

  .image {
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .folder {
    position:absolute;
    color: red;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10;
    font-size:4rem;
    opacity: 0.75;
  }
  .name {
    position: absolute;
    width: 100%;
    padding-left: 0.5rem;
    z-index: 50;
    bottom: 0;
    background-color: #222D;
    color: white;
    font-size: 1rem;
    font-family: Overpass-mono, var(--fnt-defs);
    text-overflow: ellipsis;
  }
}
</style>
