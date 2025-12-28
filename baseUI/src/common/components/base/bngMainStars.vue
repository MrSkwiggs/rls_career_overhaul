<template>
  <div class="bng-stars">
    <div v-if="!numerical && individualStars && individualStars.length" class="stars">
      <span v-if="starsFilled" class="star star-filled" v-html="glyphsFilled"></span>
      <span v-if="starsUnfilled" class="star star-unfilled" v-html="glyphsUnfilled"></span>
    </div>
    <div v-else class="stars">
      <div class="stars-label">
        {{ starsFilled }} / {{ starsTotal }}
      </div>
      <span class="star star-filled" v-html="icons.star.glyph"></span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { icons } from "@/common/components/base"

const props = defineProps({
  unlockedStars: {
    type: Number,
    default: 0,
    validator: val => val >= 0,
  },
  totalStars: {
    type: Number,
    default: 1,
  },
  scale: {
    type: Number,
    default: 1,
  },
  individualStars: {
    type: Object,
    default: null,
    validator: val => val === null || Array.isArray(val),
  },
  numerical : {
    type: Boolean,
    default: false,
  },
})

const fontSize = computed(() => `${props.scale}rem`)

const starsTotal = computed(() => props.individualStars ? props.individualStars.length : props.totalStars)
const starsFilled = computed(() => props.individualStars ? props.individualStars.filter(Boolean).length : props.unlockedStars)
const starsUnfilled = computed(() => starsTotal.value - starsFilled.value)

const glyphsFilled = computed(() => starsFilled.value > 0 ? icons.star.glyph.repeat(starsFilled.value) : "")
const glyphsUnfilled = computed(() => starsUnfilled.value > 0 ? icons.star.glyph.repeat(starsUnfilled.value) : "")
</script>

<style lang="scss" scoped>
@use "@/styles/modules/density" as *;

$defaultStarColor: #ffff;
$starColor: var(--star-color, $defaultStarColor);

.bng-stars {
  padding: 0.5rem;
  border-radius: $border-rad-1;
  font-size: v-bind(fontSize);
  background-color: #0009;

  .stars {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;

    .stars-label {
      padding-right: 0.25em;
      font-size: 1.25em;
      font-weight: 400;
      color: #fff;
      white-space: nowrap;
    }

    .star {
      font-family: "bngIcons" !important;
      font-weight: 400;
      font-size: 1.5em;
      margin-bottom: -0.1em;
      white-space: nowrap;
    }
    .star-filled {
      color: $starColor;
    }
    .star-unfilled {
      color: #fff3;
    }
  }
}
</style>
