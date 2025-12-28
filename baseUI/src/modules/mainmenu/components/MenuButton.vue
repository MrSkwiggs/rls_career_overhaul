<template>
  <div
    ref="btnRef"
    :class="{
      'mainmenu-button': true,
      [`size-${size}`]: true,
      'fancy-bg': !!hasBgImg,
      'with-icon': !!iconId,
      'semi-disabled': appearDisabled,
    }"
    :style="{ '--fancy-bg-img': `url('${bgImgUrl}')` }"
    bng-nav-item
    v-bng-sound-class="!(disabled || appearDisabled) && 'bng_click_hover_generic'"
    v-bng-disabled="disabled"
    v-bng-blur="!noBlur"
  >
    <BlurBackground v-if="!noBlur" :class="`corners-${size}`" />

    <div class="button-background" :class="{
      stack: size === 'big-stacked',
      highlighted,
    }"></div>

    <div v-if="hasBgImg" class="fancy-bg-wrap">
      <div class="bg-container" :class="{ 'with-icon': !!iconId }">
        <div class="bg-image"></div>
        <div class="mask-container">
          <div v-if="iconId" class="icon-text">{{ icons[iconId].glyph }}</div>
        </div>
      </div>
    </div>

    <div v-if="tag" class="tag">
      {{ tag }}
    </div>
    <div v-if="iconId && !hasBgImg" class="icon">
      <BngIcon :type="icons[iconId]" :color="hasBgImg ? 'transparent' : undefined" />
    </div>
    <div v-else-if="icon" class="icon">
      <BngImageAsset :externalSrc="icon" />
    </div>
    <template v-if="size == 'big' || size == 'big-stacked'">
      <div class="label-container">
        <span class="text">
          <slot></slot>
        </span>
      </div>
    </template>
    <template v-else>
      <span class="text">
        <slot></slot>
      </span>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from "vue"
import { BngIcon, BngImageAsset, icons } from "@/common/components/base"
import { vBngSoundClass, vBngBlur, vBngDisabled } from "@/common/directives"
import BlurBackground from "@/common/modules/main-bg/components/BlurBackground.vue"
import { getAssetURL } from "@/utils"

const props = defineProps({
  size: {
    type: String,
    default: "normal",
  },
  iconId: String,
  icon: String,
  highlighted: Boolean,
  disabled: Boolean,
  appearDisabled: Boolean,
  bgImg: String,
  bgImgAbs: String,
  tag: String,
  noBlur: Boolean,
})

const btnRef = ref(null)

defineExpose({
  getElement() {
    return btnRef.value
  },
})

const bgImgUrl = computed(() => props.bgImgAbs ? props.bgImgAbs : getAssetURL(props.bgImg))
const hasBgImg = computed(() => props.bgImgAbs || props.bgImg)
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

$rem: calc-ui-rem();

$height-big: 18em;
$height-medium: 9em;
$height-normal: 4em;

$trans-time: 300ms;
$trans-func: ease-in-out;

.mainmenu-button {
  --precalc-corners-big: #{calc-ui-rem(0.5)};
  --precalc-corners-normal: #{calc-ui-rem(0.375)};
  $corners-big: var(--precalc-corners-big);
  $corners-normal: var(--precalc-corners-normal);
  display: flex;
  pointer-events: all;
  position: relative;
  flex-direction: row;
  justify-content: center;
  max-width: unset !important;
  --height: var(--button-height, #{$height-normal});
  height: var(--height);
  font-size: $rem;
  margin: 0.25em;
  padding: 0.25em;
  border-radius: $corners-normal;
  border: none !important;
  cursor: pointer;
  pointer-events: all;

  .button-background {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: -1;

    border-radius: $corners-normal;

    background-color: #000;
    transition: opacity $trans-time $trans-func;
    opacity: 0.6;
  }

  &.size-big,
  &.size-big-stacked,
  &.size-medium {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    padding: 0 0.75em;
    &,
    .button-background,
    .label-container {
      border-radius: $corners-big;
    }
    .tag {
      border-top-right-radius: $corners-big;
      border-bottom-left-radius: $corners-big;
    }
    @include modify-focus($corners-big, 1px);
    .icon {
      line-height: 1;
    }
  }
  &.size-big,
  &.size-big-stacked {
    --width: var(--button-width, 16em);
    width: var(--width);
    --height: var(--button-height, #{$height-big});
    height: var(--height);
    padding: 0;
    &.fancy-bg {
      justify-content: flex-end;
      background-color: transparent;
      .text {
        font-weight: 800;
        font-style: italic;
        font-size: calc-ui-rem(1.75);
        text-wrap: balance;
      }
      .fancy-bg-wrap {
        border-radius: $corners-big;
      }
    }
  }
  &.size-medium {
    --width: var(--button-width, 16em);
    width: var(--width);
    --height: var(--button-height, #{$height-medium});
    height: var(--height);
    align-items: center;

    // @media screen and (max-width: 800px) {
    //   width: var(--button-width, 13em);;
    // }

    &.fancy-bg > .text {
      font-weight: 500;
      text-shadow:
        0 0 0.1em #000,
        0 0 0.2em #000;
    }
  }
  &.size-normal {
    // width: 16em;
  }
  &.size-small {
    font-size: 0.8em !important;
  }
  &.size-normal,
  &.size-small {
    .fancy-bg-wrap,
    .label-container {
      border-radius: $corners-normal;
    }
    .tag {
      border-top-right-radius: $corners-normal;
      border-bottom-left-radius: $corners-normal;
    }
  }

  .icon {
    font-size: 2em;
    .bng-image-asset {
      max-height: 1.25em;
      vertical-align: middle;
      margin: 0 0.125em;
    }
  }
  .text {
    font-family: 'Overpass', var(--fnt-defs);
    color: #fff;
    line-height: 1.25em;
    align-self: center;
    font-size: calc-ui-rem(1.25);
    text-align: center;
    flex: 0 0 auto;
    overflow: hidden;
    /* display: inline-block; */
    max-height: 3.3em;
    text-overflow: ellipsis;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-wrap: balance;
  }
  .label-container {
    display: flex;
    flex-flow: column;
    justify-content: flex-end;
    font-size: calc-ui-rem(2);
    padding: 0 0.5em 0.75em 0.5em;
    height: 5.5em;

    & > .text {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      padding: 0 0.15em;
    }
  }

  .tag {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0 0.5em 0.1em 0.5em;
    font-weight: 500;
    font-style: italic;
  }
  .tag, &[tag-blue] .tag {
    color: var(--bng-add-indigoblue-50);
    background-color: var(--bng-add-blue-650);
  }
  &[tag-orange] .tag {
    color: var(--bng-orange-50);
    background-color: var(--bng-orange-650);
  }
  &[tag-magenta] .tag {
    color: var(--bng-add-magenta-50);
    background-color: var(--bng-add-magenta-650);
  }
  &[tag-red] .tag {
    color: var(--bng-add-red-50);
    background-color: var(--bng-add-red-650);
  }
  &[tag-peach] .tag {
    color: var(--bng-ter-peach-50);
    background-color: var(--bng-ter-peach-650);
  }
  &[tag-yellow] .tag {
    color: var(--bng-ter-yellow-50);
    background-color: var(--bng-ter-yellow-650);
  }
  &[tag-green] .tag {
    color: var(--bng-add-green-50);
    background-color: var(--bng-add-green-650);
  }
  /// dark
  &[tag-dark-blue],
  &[tag-dark-orange],
  &[tag-dark-magenta],
  &[tag-dark-red],
  &[tag-dark-peach],
  &[tag-dark-yellow],
  &[tag-dark-green] {
    .tag {
      background-color: #0008;
    }
  }
  &[tag-dark-blue] .tag {
    color: var(--bng-add-blue-400);
  }
  &[tag-dark-orange] .tag {
    color: var(--bng-orange-400);
  }
  &[tag-dark-magenta] .tag {
    color: var(--bng-add-magenta-400);
  }
  &[tag-dark-red] .tag {
    color: var(--bng-add-red-400);
  }
  &[tag-dark-peach] .tag {
    color: var(--bng-ter-peach-400);
  }
  &[tag-dark-yellow] .tag {
    color: var(--bng-ter-yellow-400);
  }
  &[tag-dark-green] .tag {
    color: var(--bng-add-green-400);
  }

  &.fancy-bg {
    z-index: 0; // this is needed because we're having -1 on a button background which makes it go under the card background
    .fancy-bg-wrap {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: -1;
      overflow: hidden;
      pointer-events: none;
      border-radius: inherit;

      .bg-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
        &.with-icon {
          .bg-image {
            $radial: radial-gradient(
              ellipse 120% 100% at 50% 40%,
              rgba(255, 255, 255, 0.4) 40%,
              rgba(255, 255, 255, 0.25) 60%,
              rgba(255, 255, 255, 0.15) 100%
            );
            -webkit-mask-image: $radial;
            mask-image: $radial;
          }
        }
        &:not(.with-icon) {
          .bg-image {
            $radial: radial-gradient(
              ellipse 140% 80% at 50% 30%,
              rgba(255, 255, 255, 1) 30%,
              rgba(255, 255, 255, 0.6) 50%,
              rgba(255, 255, 255, 0.25) 70%,
              rgba(255, 255, 255, 0.15) 100%
            );
            -webkit-mask-image: $radial;
            mask-image: $radial;
          }
        }
      }

      .bg-image,
      .icon-text {
        transition-duration: $trans-time;
        transition-timing-function: $trans-func;
      }

      .bg-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: var(--fancy-bg-img);
        background-size: cover;
        background-position: center;
        opacity: 0;
        transition-property: opacity, transform;
      }

      .mask-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        mix-blend-mode: overlay;
        z-index: 1;

        .icon-text {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: "bngIcons";
          font-size: calc(var(--height) * 0.35);
          color: rgba(255, 255, 255, 1.0);
          transition-property: font-size, color;
          background-image: var(--fancy-bg-img);
          background-size: var(--height) auto;
          background-position: 50% 40%;
          background-clip: text;
          -webkit-background-clip: text;
        }
      }
    }

    &.size-medium .fancy-bg-wrap .bg-container {
      &.with-icon {
        .bg-image {
          $radial: radial-gradient(
            ellipse 120% 120% at 50% 50%,
            rgba(255, 255, 255, 0.4) 40%,
            rgba(255, 255, 255, 0.25) 60%,
            rgba(255, 255, 255, 0.15) 100%
          );
          -webkit-mask-image: $radial;
          mask-image: $radial;
        }
      }
      &:not(.with-icon) {
        .bg-image {
          $radial: radial-gradient(
            ellipse 120% 120% at 50% 50%,
            rgba(255, 255, 255, 1) 30%,
            rgba(255, 255, 255, 0.6) 50%,
            rgba(255, 255, 255, 0.25) 70%,
            rgba(255, 255, 255, 0.15) 100%
          );
          -webkit-mask-image: $radial;
          mask-image: $radial;
        }
      }
    }

    &:not(.with-icon) {
      --bg-opacity: 1;
      .button-background {
        opacity: 1;
      }
      .fancy-bg-wrap .bg-image {
        opacity: 0.6;
      }
    }

    .icon > * {
      color: #fff;
      font-size: calc-ui-rem(5.5);
    }
  }

  &::before {
    top: -4px;
    bottom: -4px;
    left: -4px;
    right: -4px;
    border-radius: calc(var(--precalc-corners-big) + 4px);
    box-shadow: inset rgba(0, 0, 0, 0.5) 0 0 8px, rgba(0, 0, 0, 0.25) 0 0 4px;
  }

  &[disabled],
  &.semi-disabled {
    cursor: default;
    &::before {
      border-style: dashed;
    }
    .button-background, .fancy-bg-wrap,
    .tag, .icon, .text {
      opacity: 0.4;
    }
  }
  &[disabled] {
    pointer-events: none;
  }

  &:not(.semi-disabled) {
    &:focus,
    // &:focus-visible,
    &.focus-visible,
    &:hover {
      &:not(.fancy-bg) {
        .button-background {
          opacity: 0.8;
        }
      }
      &.fancy-bg {
        .button-background,
        .bg-image {
          opacity: 1;
        }
        .icon-text {
          font-size: calc(var(--height) * 0.45);
          color: rgba(255, 255, 255, 0.3);
        }
        &:not(.with-icon) {
          .bg-image {
            transform: scale(1.1);
          }
        }
        .icon > * {
          color: #fff7;
        }
      }
    }
  }
}

.size-big-stacked {
  width: 15.5em !important;
  &:not(.fancy-bg) {
    background-color: var(--bng-black-o2) !important;
  }
  .stack {
    font-size: 1.8em;
    pointer-events: none;
    z-index: -1;
    &,
    &::before,
    &::after {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    &::before,
    &::after {
      content: "";
      border-radius: var(--bng-corners-2);
      background-color: var(--bng-black-o8);
      transition:
        opacity 400ms,
        right 400ms;
    }
    &::before {
      top: 0.25em;
      left: 0.2em;
      right: -0.25em;
      bottom: 0.25em;
      opacity: 0.6;
    }
    &::after {
      top: 0.5em;
      left: 0.4em;
      right: -0.5em;
      bottom: 0.5em;
      opacity: 0.4;
    }
  }
  &:focus,
  // &:focus-visible,
  &.focus-visible,
  &:hover {
    .stack {
      &::before {
        right: -0.4em;
        opacity: 0.8;
      }
      &::after {
        right: -0.8em;
        opacity: 0.6;
      }
    }
  }
}

.highlighted {
  background-image: linear-gradient(180deg, #f600, #f602 65%, #f608);
  &:hover,
  &:focus,
  &.focus-visible {
    background-image: linear-gradient(180deg, #f600, #f604 65%, #f60a);
    // box-shadow: none !important;
  }
}
</style>
