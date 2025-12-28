<!-- PoiCard - Component for displaying a single POI item -->
<template>
  <div
    class="poi-item"
    :class="{ highlighted: poi.isSelected }"
    @click="onSelect"
    bng-nav-item
  >
    <div
      class="card-info"
      :class="{
        'content-shown': shown,
        'thumb-show': thumbShown && !!thumb,
      }"
      :style="{ '--poi-image': thumb }"
    >
      <BngIcon
        v-if="poi.icon"
        class="mission-icon"
        :type="poi.icon"
        color="white"
      />
      <div class="main-info">
        <div class="heading">
          {{ poi.name }}
        </div>
        <div v-if="poi.formattedProgress" class="stars">
          <BngMainStars
            v-if="poi.formattedProgress.unlockedStars"
            :individual-stars="poi.formattedProgress.unlockedStars.defaults"
            class="main-stars"
            :scale="0.6"
            reverse
          />
          <BngMainStars
            v-if="poi.formattedProgress.unlockedStars && poi.formattedProgress.unlockedStars.totalBonusStarCount > 0"
            :individual-stars="poi.formattedProgress.unlockedStars.bonus"
            class="bonus-stars"
            :scale="0.6"
          />
        </div>
        <div v-else-if="poi.aggregatePrimary" class="aggregate-primary">
          <span class="label">{{ poi.aggregatePrimary.label }}:</span>
          <span class="value">{{ poi.aggregatePrimary.value }}</span>
        </div>
        <div v-else class="empty-gap"></div>
      </div>
      <BngBinding
        class="input-icon"
        ui-event="ok"
        controller
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { BngIcon, BngMainStars, BngBinding } from "@/common/components/base"

// Debug flag - set to true to enable logging, false to disable
const DEBUG_POICARD = false

// Local debug logging utility for PoiCard
const debugLog = (message, data) => {
  if (DEBUG_POICARD) {
    console.log(`[BigMap:PoiCard] ${message}`, data)
  }
}

const props = defineProps({
  poi: {
    type: Object,
    required: true,
  },
  shown: {
    type: Boolean,
    default: true,
  }
})

const emit = defineEmits(["select", "hover"])

const onSelect = () => {
  debugLog("POI selected", { poiId: props.poi.id, poiName: props.poi.name })
  emit("select", props.poi.id)
}

// if shown=true at start, don't use lazy loading
let thumbLoaded = props.shown && !!props.poi?.thumbnail
const thumbShown = ref(thumbLoaded)
const thumb = ref(thumbLoaded ? `url("${props.poi?.thumbnail}")` : "none")
let lastThumb = thumbLoaded ? props.poi?.thumbnail : undefined
watch([() => props.shown, () => props.poi], () => {
  if (props.shown && props.poi?.thumbnail) {
    const url = props.poi.thumbnail
    if (lastThumb !== url) {
      lastThumb = url
      thumbLoaded = false
      const img = new Image()
      img.src = url
      img.onload = () => {
        if (lastThumb === url) {
          thumbLoaded = true
          thumb.value = `url("${url}")`
          thumbShown.value = true
        }
      }
    }
  } else if (!props.poi?.thumbnail) {
    lastThumb = undefined
    thumbLoaded = false
    thumb.value = "none"
    thumbShown.value = false
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.poi-item {
  --indicator-width: 0.5rem;
  height: 100%;

  font-size: 1rem;
  font-family: Overpass, var(--fnt-defs);
  background-color: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
  height: fit-content;

  .card-info {
    display: flex;
    flex-flow: row nowrap;
    height: 100%;
    position: relative;
    padding: 0.5rem 0.25rem;
    background-color: #0009;
    border-radius: var(--bng-corners-1);
    overflow: hidden;

    // highlight marker
    border-left: var(--indicator-width) solid transparent;

    &::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 66%;
      right: 0;
      border-radius: 0 0.5rem 0.5rem 0;
      background-image: var(--poi-image);
      background-position: 100% 50%;
      background-repeat: no-repeat;
      background-size: cover;
      mask-image: linear-gradient(90deg, #0002 0%, #0008 25%, #000c 50%);
      filter: saturate(0.5);
      opacity: 0;
      transition: opacity 200ms;
      pointer-events: none;
      z-index: 0;
    }
    &.thumb-show::after {
      opacity: 1;
    }

    .mission-icon {
      right: 0.25rem;
      font-size: 2rem;
      z-index: 1;
      align-self: center;
    }

    .input-icon {
      align-self: center;
      justify-self: flex-end;
      font-size: 1.5rem;
      margin-right: 0.5rem;
      opacity: 0.9;
      filter: drop-shadow(1px 1px 6px rgba(0, 0, 0, 0.75));
      z-index: 1;
    }

    .main-info {
      flex: 1 0 auto;
      position: relative;
      display: flex;
      flex-flow: column;
      padding-left: 0.5rem;
      color: white;
      z-index: 1;

      .heading {
        font-weight: 800;
        font-size: 1.0rem;
        overflow: ellipsis;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-shadow: 0 0 5px #000;
      }

      .stars {
        display: block;
        & > * {
          display: inline-block;
          min-height: fit-content;
          max-width: fit-content;
          margin-right: 0.25rem;
          margin-top: 0.25rem;
          padding: 0.25rem 0.5rem;
        }
        > .main-stars {
          --star-color: var(--bng-ter-yellow-50);
        }
        > .bonus-stars {
          --star-color: var(--bng-add-blue-400);
        }
      }

      .aggregate-primary {
        display: inline-block;
        width: min-content;
        font-size: 0.9rem;
        margin-top: 0.25rem;
        color: #ccc;
        text-shadow: 0 0 5px #000;

        & > * {
          margin-right: 0.5rem;
        }

        .label {
          font-weight: 300;
        }

        .value {
          font-weight: 500;
        }
      }

      .empty-gap {
        height: 1.5rem;
      }
    }
  }

  &:focus,
  &:hover {
    .card-info {
      background-color: #6669;
    }
  }

  &:not(:focus) {
    .card-info .input-icon {
      display: none;
    }
  }

  &.highlighted .card-info {
    background-color: rgba(var(--bng-orange-200-rgb), 0.2);

    // highlight marker
    border-left-color: var(--bng-orange-400);

    &.thumb-show::after {
      filter: none;
    }
  }

  // &:not(.content-shown) {
  //   .stars, .aggregate-primary {
  //     display: none;
  //   }
  // }
}
</style>