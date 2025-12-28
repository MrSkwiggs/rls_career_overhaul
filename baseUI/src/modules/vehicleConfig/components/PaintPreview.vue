<template>
  <div class="paint-preview">
    <div
      v-for="(preview, idx) in previews"
      :key="idx"
      class="paint-preview-item"
      :class="{ 'empty-slot': preview.isEmpty }"
      :style="preview"
      v-bng-tooltip:bottom="preview.tooltipText"
      @click="preview.isEmpty ? null : emit('select', idx)"
    >
      <div class="paint-color-layer"></div>
      <div class="metallic-layer"></div>
      <div class="shadow-layer"></div>
      <div class="reflection-layer"></div>
      <div class="clearcoat-layer"></div>
      <div v-if="preview.isEmpty" class="empty-slot-indicator"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { vBngTooltip } from "@/common/directives"
import { $translate } from "@/services/translation"

const props = defineProps({
  paints: Array,
  paintNames: {
    type: Array,
    default: () => []
  }
})
const emit = defineEmits(["select"])

const refpad = 25 // reflection/clearcoat radial gradient padding in percent

const previews = computed(() => {
  const res = []
  if (!props.paints || !Array.isArray(props.paints)) return res
  const paints = props.paints
  const len = paints.length
  for (let idx = 0; idx < len; idx++) {
    const paint = paints[idx]
    const isEmpty = paint._isEmpty || false
    const paintName = props.paintNames[idx] || null

    const tooltipText = isEmpty
      ? 'Empty slot'
      : paintName
        ? `${$translate.instant('ui.trackBuilder.matEditor.paint')} ${idx + 1}: ${paintName}`
        : `${$translate.instant('ui.trackBuilder.matEditor.paint')} ${idx + 1}`

    const vars = {
      '--paint-index': idx,
      '--paint-count': len,
      '--paint-width': `${100 / len}%`,
      '--paint-rel-width': `${100 * len}%`,
      '--paint-rel-width-pad': `${100 * len * 2 - refpad * (len + 1)}%`,
      '--paint-position': `${100 / (len - 1) * idx}%`,
      '--paint-position-pad': `${len > 1 ? refpad + (100 - refpad * 2) / (len - 1) * idx : 50}%`,
      '--paint-color': isEmpty ? 'rgba(128, 128, 128, 0.3)' : `rgb(${paint.rgb255.join(', ')})`,
      '--paint-metallic': isEmpty ? 0 : Math.max(0, paint.metallic - paint.roughness / 0.5),
      // 'paint-metallic-blend': paint.luminosity > 0.5 ? "multiply" : "screen",
      '--paint-roughness': isEmpty ? 1 : paint.roughness,
      '--paint-clearcoat': isEmpty ? 0 : paint.clearcoat,
      '--paint-clearcoat-roughness': isEmpty ? 0 : paint.clearcoatRoughness,
      'isEmpty': isEmpty,
      'tooltipText': tooltipText,
    }
    res.push(vars)
  }
  return res
})
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

.paint-preview {
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  justify-content: stretch;
  align-items: stretch;
  width: 65%;
  height: 2em;
  border-radius: $border-rad-2;
  overflow: hidden;

  .paint-preview-item {
    position: relative;
    height: 100%;
    width: var(--paint-width);
    cursor: pointer;
    overflow: hidden;

    > * {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-repeat: no-repeat;
    }

    &.empty-slot {
      cursor: default;
      background-image: repeating-linear-gradient(
        -45deg,
        rgba(0, 0, 0, 0.0) 0px,
        rgba(0, 0, 0, 0.0) 10px,
        rgba(0, 0, 0, 0.3) 10px,
        rgba(0, 0, 0, 0.3) 20px
      );

      .empty-slot-indicator {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.2em;
        font-weight: bold;
        pointer-events: none;
        content: none;
      }
    }
  }

  .paint-color-layer {
    background-color: var(--paint-color);
  }

  .shadow-layer {
    background-image: linear-gradient(180deg, #0000 65%, #0002 80%, #0008 100%);
    background-size: 100% 100%;
    background-position: 100% 50%;
  }

  .metallic-layer {
    background-image: url("/ui/ui-vue/src/assets/images/paint-reflection.jpg");
    background-size: var(--paint-rel-width) 100%;
    background-position: var(--paint-position) 50%;
    opacity: var(--paint-metallic);
    // mix-blend-mode: var(--paint-metallic-blend);
    mix-blend-mode: multiply;
  }

  .reflection-layer,
  .clearcoat-layer {
    background-size: var(--paint-rel-width-pad) 100%;
    background-position: var(--paint-position-pad) 0%;
  }

  .reflection-layer {
    background-image:
      radial-gradient(
        ellipse at 50% -50%,
        rgba(255, 255, 255, 0.0) 20%,
        rgba(255, 255, 255, calc(0.5 - var(--paint-roughness) * 0.2)) 40%,
        rgba(255, 255, 255, 0.0) calc(var(--paint-roughness) * 30% + 42%)
      );
  }

  .clearcoat-layer {
    background-image:
      radial-gradient(
        ellipse at 50% -50%,
        rgba(255, 255, 255, 0.0) 20%,
        rgba(255, 255, 255, calc(0.5 - var(--paint-clearcoat-roughness) * 0.2)) 40%,
        rgba(255, 255, 255, 0.0) calc(var(--paint-clearcoat-roughness) * 30% + 42%)
      );
    opacity: var(--paint-clearcoat);
  }
}
</style>
