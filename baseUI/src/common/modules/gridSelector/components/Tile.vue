<template>
  <div
    class="tile-wrapper"
    :class="`tile-size-${displaySize}`"
    :style="{ '--tile-font-size': sizes[displaySize].fontSize + 'em' }"
  >
    <div class="tile-bg"></div>
    <div
      ref="elTile"
      :bng-scoped-nav-autofocus="state.isAutoFocused"
      :class="{
        'tile': true,
        selected: state.selected,
        dimmed: state.dimmed,
        auxiliary:  tile.isAuxiliary,
        'is-career-only':  tile.isCareerOnly,
      }"
      v-bng-on-ui-nav:ok.focusRequired.asMouse.bubble
      @click.stop="onClick"
      @focus="onFocus"
      @blur="onBlur"
      bng-nav-item
      v-bng-sound-class="'bng_click_hover_generic'"
      v-bng-double-click:[tile.doubleClickMode]="tile.doubleClickDetails ? () => emit('dblclick') : null"
    >
      <div class="image-container">
        <!-- <img class="item-image" v-bng-lazy-image:observe="tile.preview" /> -->
        <BngImage class="item-image" :class="{ 'top-aligned': tileImagesTopAligned }" :src="tile.preview" />
        <template v-if="!isListItem">
          <div v-if="!isConfig && tile.subElementCount >= 1" class="sub-element-count-badge">
            {{ tile.subElementCount }}
          </div>
          <BngIcon v-if="isFavourite || tile.showFavouriteIconPercent >= 1" class="favorite-indicator" type="star" />
        </template>
      </div>

      <div class="item-label">
        <span class="item-name">
          {{ tile.name }}
          <!-- state.isAF: {{ state.isAutoFocused }} {{ tile.key }} -->
        </span>

        <div class="icons-container">
          <template v-if="tile.sourceIcons">
            <template v-for="sourceIcon in tile.sourceIcons" :key="sourceIcon">
              <BngIcon v-if="sourceIcon.icon" :type="sourceIcon.icon" class="source-icon" color="var(--bng-cool-gray-100)" />
              <img class="svg-icon" v-if="sourceIcon.svg" :src="sourceIcon.svg" alt="" />
            </template>
          </template>
          <BngIcon
            v-if="isListItem && tile.showFavouriteIconPercent > 0"
            class="favorite-indicator"
            :type="tile.showFavouriteIconPercent >= 1 ? 'star' : 'starSecondary'"
          />
        </div>

        <span v-if="isListItem && !isConfig && tile.subElementCount >= 1" class="sub-element-count-badge">
          {{ tile.subElementCount }}
        </span>
        <span v-else-if="isListItem"></span>
      </div>
    </div>
  </div>
</template>

<script>
const sizes = {
  tiny: { width: 7.5, margin: 0.5, fontSize: 0.8 },
  small: { width: 9.5, margin: 0.5, fontSize: 1 },
  medium: { width: 12, margin: 0.5, fontSize: 1 },
  large: { width: 16, margin: 0.5, fontSize: 1 },
  huge: { width: 20, margin: 0.5, fontSize: 1.5 },
  list: { width: 22, height: 3, margin: 0.5, fontSize: 0.9 },
}

// image area aspect ratio
// when changing this, test with different viewport widths to find the best value
const thumbAspectRatio = 16 / 9.5

// caption line height in em
// should be the same as $caption-height scss variable
const captionHeightEm = 2

const getSizeCalc = displaySize => ctx => { // eslint-disable-line no-unused-vars
  const size = sizes[displaySize] || sizes.medium

  if (displaySize === "list") {
    return {
      width: size.width,
      height: size.height,
      margin: size.margin,
    }
  }

  // calculate tile height based on aspect ratio + caption area
  const height =
    size.width / thumbAspectRatio
    + size.fontSize * captionHeightEm
    - size.margin * 2

  return {
    width: size.width,
    height,
    margin: size.margin,
  }
}

export default {
  getSizeCalc,
}
</script>

<script setup>
import { ref, computed, inject } from "vue"
import { BngIcon, BngImage } from "@/common/components/base"
import { vBngDoubleClick, vBngSoundClass, vBngOnUiNav } from "@/common/directives"
import { storeToRefs } from "pinia"
import useControls from "@/services/controls"

const Controls = useControls()
const { showIfController } = storeToRefs(Controls)

const props = defineProps({
  tile: {
    type: Object,
    required: true,
  },
  isFavourite: Boolean,
  isConfig: Boolean,
  displaySize: String,
  tileImagesTopAligned: {
    type: Boolean,
    default: false
  }
})

const gridSelectionState = inject("gridSelectionState", null)

const state = computed(() => {
  const res = {
    selected: false,
    dimmed: false,
    isAutoFocused: false,
  }
  if (gridSelectionState && gridSelectionState.value) {
    res.selected = gridSelectionState.value.inDetails && gridSelectionState.value.activeItemKey === props.tile.key
    res.dimmed = showIfController.value && gridSelectionState.value.inDetails && gridSelectionState.value.activeItemKey !== props.tile.key
    res.isAutoFocused = gridSelectionState.value.autoFocusKey === props.tile.key
  }
  return res
})

const emit = defineEmits(["focus", "blur", "click", "dblclick"])

const elTile = ref(null)

defineExpose({
  getElement: () => elTile.value,
})

const isListItem = computed(() => props.displaySize === "list")

function onClick() {
  emit("click")
}
function onFocus() {
  emit("focus")
}
function onBlur() {
  emit("blur")
}
</script>

<style lang="scss" scoped>
// tile-wrapper [tile-size-*]
//   > tile-bg
//   > tile [selected, dimmed, is-config, auxiliary]

$caption-height: 2em;

.tile-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
  font-size: var(--tile-font-size);

  .tile-bg {
    position: relative;
    display: block;
    width: 100%;
    height: calc(100% - $caption-height);
    background-color: var(--bng-cool-gray-800);
    border-radius: var(--bng-corners-1) var(--bng-corners-1) 0 0;
    &::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 0;
      display: block;
      width: 100%;
      height: $caption-height;
      background-color: var(--bng-cool-gray-900);
      border-radius: 0 0 var(--bng-corners-1) var(--bng-corners-1);
    }
  }

  &.tile-size-list {
    .tile-bg {
      width: 100%;
      height: 100%;
      background-color: var(--bng-cool-gray-900);
      border-radius: var(--bng-corners-1);
      &::after {
        content: none;
      }
    }
  }
}

.tile {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  outline: none;
  border-radius: var(--bng-corners-1);
  // transition: border-color 0.2s ease;
  cursor: pointer;

  &.selected {
    transform-origin: 50% 50%;
    transform: scale(1.05);
    z-index: 999;
  }

  &:not(:hover).dimmed {
    opacity: 0.5;
  }

  &.auxiliary,
  &.is-career-only {
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: repeating-linear-gradient(-45deg, var(--tile-stripe-color) 0em 1em, transparent 1em 2em);
    }
  }
  &.auxiliary {
    --tile-stripe-color: rgba(var(--bng-orange-700-rgb), 0.33);
  }
  &.is-career-only {
    --tile-stripe-color: rgba(var(--bng-add-blue-700-rgb), 0.33);
  }
}

.tile-size-tiny {
  .sub-element-count-badge {
    font-size: 0.8em;
    padding: 0rem 0.4rem;
  }
  .item-label {
    line-height: 1.25em;
    padding: 0.15rem 0.3rem;
    gap: 0.1rem;
    justify-content: flex-start;
    .source-icon {
      margin-top: 0.15rem;
    }
    .svg-icon {
      width: 1em;
      height: 1em;
      margin-top: 0.1rem;
    }
  }
}

.tile-size-large {
  .item-name {
    margin-bottom: 0.175em; // idk
  }
}

.tile-size-huge {
  .sub-element-count-badge {
    font-size: 1.2em;
    padding: 0.5rem 1rem;
  }
  .item-label {
    line-height: 1.25em;
    padding: 0.25rem 1rem 0.5rem 1rem;
    justify-content: flex-start;
    gap: 0.25rem;
    .item-name {
      margin-bottom: 0.125em;
    }
    .source-icon {
      margin-top: 0.25rem;
      font-size: 1.25em;
    }
    .svg-icon {
      width: 1em;
      height: 1em;
      margin-top: 0.33rem;
    }
  }
}

.tile-size-list {
  .tile {
    flex-direction: row;
    gap: 0.5rem;
    width: 100% !important;
    box-sizing: border-box;

    &:hover,
    &.selected {
      background-color: var(--bng-cool-gray-700);
    }
  }

  .image-container {
    flex: 0 0 5.33em;
    position: relative;
    width: 5.33em;
    height: 100%;
    border-radius: var(--bng-corners-1) 0 0 var(--bng-corners-1);
    overflow: hidden;
    .item-image {
      object-position: center center;
    }
  }

  .item-label {
    flex: 1 1 auto;
    min-width: 0;
    gap: 0.5rem;
    .icons-container {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-end;
      align-items: center;
      height: 100%;
      gap: 0.33rem;
      row-gap: 0rem;
      > * {
        flex: 0 0 auto;
        align-self: unset;
        margin: 0;
      }
      .svg-icon {
        margin-left: 0.1rem;
      }
      .favorite-indicator {
        padding: 0;
      }
    }
    .item-name {
      padding: 0;
      margin-bottom: 0;
      flex: 1 1 auto;
      min-width: 0;
      line-height: 1.2;
      align-self: center;
    }
  }
  .sub-element-count-badge {
    position: static;
    flex: 0 0 2.25rem;
    align-self: stretch;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 0;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    border: none;
    background-color: rgba(var(--bng-cool-gray-600-rgb), 0.5);
  }
}

.image-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - $caption-height);
  border-radius: var(--bng-corners-1) var(--bng-corners-1) 0 0;
  overflow: hidden;

  .item-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    &.top-aligned {
      object-position: center top;
    }
  }
}

.sub-element-count-badge {
  position: absolute;
  top: 0;
  right: 0;
  color: #fff;
  padding: 0.25rem 0.5rem;
  padding-left: 0.66rem;
  font-size: 0.8em;
  border-radius: 0 0 0 0.5rem;
  z-index: 5;
  opacity: 0.8;
  background-color: rgba(var(--bng-cool-gray-800-rgb), 0.5);
}

.item-label {
  padding: 0.25em 0.5em;
  color: #fff;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: stretch;
  background: transparent;

  gap: 0.1rem;
  text-align: left;

  .source-icon,
  .svg-icon {
    margin-bottom: 0.2rem;
  }

  .source-icon {
    align-self: flex-end;
    font-size: 1em;
  }

  .svg-icon {
    width: 1rem;
    height: 1rem;
    transform: translateY(0.4rem);
    padding: 0.05rem;
  }
}

.tile-wrapper {
  &:not(.tile-size-list) .tile {
    .item-label {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: auto;
      background-image: linear-gradient(180deg, rgba(var(--bng-cool-gray-900-rgb), 0.4) 0%, rgba(var(--bng-cool-gray-900-rgb), 1) 50% 100%);
      background-size: 100% 3rem;
      background-position: 0% 0%;
      background-repeat: no-repeat;
    }
    &:hover,
    &.selected {
      background-color: var(--bng-cool-gray-700);
      .item-label {
        background-image: linear-gradient(180deg, rgba(var(--bng-cool-gray-700-rgb), 0.4) 0%, rgba(var(--bng-cool-gray-700-rgb), 1) 50% 100%);
      }
    }
  }

  &.tile-size-list .item-label {
    padding: 0;
    flex: 1;
  }
}

.item-name {
  flex: 1 1 auto;
  font-size: 0.9em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  word-wrap: break-word;
  margin-bottom: 0.25em;
}

.favorite-indicator {
  font-size: 1.5em;
  color: var(--bng-ter-yellow-50);
  opacity: 1;
  z-index: 2;

  .tile-wrapper.tile-size-list & {
    position: relative;
    top: 0;
    left: 0;
    padding: 0.25rem 0.5rem;
    color: var(--bng-ter-yellow-200);
  }
  .tile-wrapper:not(.tile-size-list) & {
    position: absolute;
    top: 0.2rem;
    left: 0.25rem;
  }
}
</style>
