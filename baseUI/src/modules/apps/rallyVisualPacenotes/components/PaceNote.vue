<template>
  <div class="pacenote">
    <div class="background" :style="{ opacity: backgroundOpacity }">
      <template v-if="!note.isInto">
        <svg :id="`note_${bgId}`" :style="{ width: 'var(--note-size)', height: 'var(--note-size)' }" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.45521 0.75H51.4137C53.3423 0.75 54.8466 2.41974 54.6461 4.33788L49.631 52.3157C49.4572 53.9784 48.0504 55.238 46.3787 55.2278L4.41965 54.9703C2.49833 54.9585 1.00656 53.2915 1.2074 51.3807L6.22301 3.66028C6.39689 2.00598 7.7918 0.75 9.45521 0.75Z" :fill="backgroundColor" :stroke="strokeColor" stroke-width="1.5"/>
        </svg>
      </template>
      <template v-else>
        <svg :id="`note_${bgId}`" :style="{ width: 'var(--note-size)', height: 'var(--note-size)' }" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 47.75H5.54967L5.71519 47.2258L11.3348 29.4304C11.6288 28.4994 11.6288 27.5006 11.3348 26.5696L5.95963 9.54823C5.82856 9.13317 5.7822 8.69601 5.8233 8.26269L6.25669 3.69314C6.41494 2.02457 7.81612 0.75 9.49217 0.75H51.4137C53.3423 0.75 54.8466 2.41974 54.6461 4.33788L49.631 52.3157C49.4572 53.9784 48.0504 55.238 46.3787 55.2278L4.46341 54.9706C2.52935 54.9587 1.03362 53.2707 1.25464 51.3493L1.66867 47.75H5Z" :fill="backgroundColor" :stroke="strokeColor" stroke-width="1.5"/>
          <path d="M4 11H1L6 28L1 45H4L9.5 28L4 11Z" :fill="intoColor"/>
        </svg>
      </template>
    </div>
    <div class="content">
      <div class="instruction">
        <template v-if="icons[note.type]">
          <BngIcon class="note-icon" :type="note.type" :class="{ left: note.isLeft }" />
        </template>
        <template v-else-if="note.typeExt && noteUrl">
          <div class="note-icon svg-used"
            :class="[note.type, { left: note.isLeft }]"
            :style="noteUrl ? { maskImage: `url(${noteUrl})`, WebkitMaskImage:`url(${noteUrl})` } : null">
          </div>
        </template>
        <div v-if="note.turnTypeValue" class="turn-value" :class="{ left: note.isLeft, 'is-into': note.isInto, 'text-2-chars': note.turnTypeValue.length === 2 }">{{ note.turnTypeValue }}</div>
      </div>
      <div v-if="note.turnModifier" class="modifier">
        <BngIcon :type="note.turnModifier" class="icon-small" :color="colorNoteIcon" />
      </div>
      <div v-if="note.additionalNote && (note.additionalNote.icon || note.additionalNote.text)"
           class="add-note">
        <BngIcon v-if="note.additionalNote.icon"
                :type="note.additionalNote.icon"
                :color="note.additionalNote.color"
                class="icon-small" />
        <span v-else-if="note.additionalNote.text"
              class="add-text"
              :style="note.additionalNote.color ? { color: note.additionalNote.color } : null">
          {{ note.additionalNote.text }}
        </span>
      </div>
    </div>
    <div v-if="note.distance" class="distance">{{ note.distance }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { uniqueId } from "@/services/uniqueId"
import { BngIcon, icons } from "@/common/components/base"
import { getAssetURL } from "@/utils"

const bgId = uniqueId("", "_")

const props = defineProps({
  note: {
    type: Object,
    required: true,
    validator(value) {
      // Allow empty notes (used for pre-created slots)
      if (value.type === 'empty') {
        return true
      }

      // Validate regular notes
      return typeof value.type === 'string'
    },
    default: () => ({
      type: "empty",  // Changed default type to match empty state
      typeExt: null,
      turnModifier: null,
      background: {
        color: 'var(--bng-cool-gray-600)',
        strokeColor: 'var(--bng-cool-gray-500)',
        opacity: 0.6
      },
      isInto: false,
      isLeft: false,
      size: 5,
      turnTypeValue: null,
      distance: null,
      additionalNote: {
        color: '#fff',
        icon: null,
        text: null
      }
    })
  }
})

const noteUrl = computed(() => {
  if (props.note.typeExt) {
    return props.note.typeExt;
  }

  const assetPath = noteTypes[props.note.type];

  return assetPath ? getAssetURL(assetPath) : null;
});

const backgroundColor = computed(() =>
  props.note.background && props.note.background.color
    ? props.note.background.color
    : 'var(--bng-cool-gray-600)'
)

const strokeColor = computed(() =>
  props.note.background && props.note.background.strokeColor
    ? props.note.background.strokeColor
    : 'var(--bng-cool-gray-500)'
)

const backgroundOpacity = computed(() =>
  props.note.background && props.note.background.opacity
    ? props.note.background.opacity
    : 0.6
)

// const contentColor = computed(() =>
//   props.note.contentColor
//     ? props.note.contentColor
//     : '#fff'  // Default white color if not specified
// )

const colorNoteIcon = computed(() =>
  props.note.colorNoteIcon
    ? props.note.colorNoteIcon
    : '#fff'
)

const colorNoteText = computed(() =>
  props.note.colorNoteText
    ? props.note.colorNoteText
    : '#fff'
)

const intoColor = computed(() =>
  props.note.intoColor
    ? props.note.intoColor
    : '#fff'
)

const colorDistance = computed(() =>
  props.note.colorDistance
    ? props.note.colorDistance
    : '#ececec'
)

</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

$rem: calc(var(--pacenote-rem, 16px) * v-bind('props.note.size'));


.pacenote {
  --background-fill: v-bind('backgroundColor');
  // --content-color: v-bind('contentColor');
  --color-note-icon: v-bind('colorNoteIcon');
  --color-note-text: v-bind('colorNoteText');
  --color-distance: v-bind('colorDistance');
  font-size: $rem;
  width: calc($rem * 4);
  min-height: calc($rem * 4);
  position: relative;
  display: flex;
  flex-direction: column;
  font-family: 'bngIcons', 'Overpass', var(--fnt-defs);
  margin: 0 calc($rem * 0.25);

  .background {
    position: absolute;
    top: 0;
    left: 0;
    width: calc($rem * 4);
    height: calc($rem * 4);
    opacity: var(--note-bg-opacity, 0.6);
  }

  .content {
    position: relative;
    top: 0;
    left: 0;
    width: calc($rem * 4);
    height: calc($rem * 4);
    color: var(--note-color);
    padding: 0.25em;

    .instruction {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      .note-icon {
        font-size: 3.25em;
        width: 1em;
        height: 1em;
        line-height: 1em;
        background-size: cover;
        mask-repeat: no-repeat;
        mask-size: contain;
        color: var(--color-note-icon);
        &.svg-used {
          background-color: var(--color-note-icon);
        }
        &.left {
          transform: scaleX(-1);
        }
      }
      .turn-value {
        font-weight: 700;
        position: absolute;
        font-size: 1.75em;
        line-height: 100%;
        bottom: 0.1em;
        right: 0.35em;
        color: var(--color-note-text);
        &.text-2-chars {
          font-size: 1.0em;
          right: 0.60em ;
        }
        &.left {
          left: 0.35em;
          &.text-2-chars {
            left: 0.60em;
            &.is-into {
              left: 0.65em;
              bottom: 0.0em;
            }
          }
          &.is-into {
            left: 0.50em;
          }
        }
      }
    }


    .modifier {
      position: absolute;
      top: 50%;
      right: -0.5em;
      width: 1.25em;
      height: 1.25em;
      transform: translateY(-50%);
      background-color: var(--background-fill);
      overflow: hidden;
      font-size: 1em;
      padding: 0.125em;
      border-radius: calc($rem * 0.25);
      text-align: center;
      >.icon-small {
        font-size: 1em;
      }
    }

    .add-note {
      position: absolute;
      top: 0;
      right: -0.5em;
      width: 1.25em;
      height: 1.25em;
      background-color: var(--background-fill);
      overflow: hidden;
      font-size: 1em;
      padding: 0.125em;
      border-radius: calc($rem * 0.25);
      text-align: center;
      :deep(.icon-small) {
        font-size: 1em;
      }
      .add-text {
        font-weight: bold;
      }
    }
  }

  .distance {
    font-size: calc($rem * 1.25);
    font-weight: bold;
    font-style: italic;
    padding-right: 0.5em;
    text-align: center;
    line-height: 1.5em;
    color: var(--color-distance);
    text-shadow: 0 0 0.25em rgba(var(--bng-off-black-rgb), 0.5);
  }
}
</style>
