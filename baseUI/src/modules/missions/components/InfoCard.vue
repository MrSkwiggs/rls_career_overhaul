<template>
  <!-- <div class="info-card"> -->
  <BngCard v-bng-blur="!noBlur" class="card info-card" :class="{ 'no-background': noBlur }">
    <template v-if="slots.header">
      <slot name="header"></slot>
    </template>
    <template v-else-if="header">
      <BngCardHeading :type="headerType">{{ header }}</BngCardHeading>
    </template>
    <div v-bng-ui-nav-scroll.force class="info-content">
      <slot name="content"></slot>
    </div>
    <template v-if="slots.button" :class="{ 'button-center': true }" #buttons>
      <slot name="button"></slot>
    </template>
  </BngCard>
  <!-- </div> -->
</template>

<script setup>
import { useSlots } from "vue"
import { BngCard, BngCardHeading } from "@/common/components/base"
import { vBngBlur, vBngUiNavScroll } from "@/common/directives"
const slots = useSlots()
const props = defineProps({
  header: {
    type: String,
    required: false,
  },
  headerType: {
    type: String,
    required: false,
  },
  noBlur: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

$backgroundColor: rgba(var(--bng-off-black-rgb), 0.5);
// $backgroundColor: black;
$textColor: var(--bng-off-white);

.no-background {
  color: red;
  :deep(.card-cnt) {
    background-color: #0000;
  }
}
.info-card {
  $f-offset: 0.25rem;
  $rad: $border-rad-2;
  width: var(--bng-info-card-width, 25rem);
  position: relative;
  // margin: 0.25rem;
  border-radius: calc(var(--bng-corners-1) * 0.5);
  // background: $backgroundColor;
  color: $textColor;
  border-radius: var(--bng-corners-1);
  font-style: normal;
  font-weight: 400;
  // line-height: 1.25rem; /* 125% */
  letter-spacing: 0.02rem;
  user-select: none;
  overflow: hidden;

  :deep(h2:first-of-type) {
    margin-top: 0.25em;
  }

  &.button-center {
    :deep(.card) {
      > .buttons {
        display: flex;
        justify-content: stretch;

        > .bng-button {
          > .label {
            font-size: 2.5rem;
            font-style: normal;
            font-weight: 800;
            line-height: 2rem;
            letter-spacing: 0.015rem;
          }
        }

        > .button-icon {
          display: none;
        }
      }
    }
  }

  @include modify-focus($rad, $f-offset);

  // &:focus {
  //   border-bottom-color: rgba(var(--bng-orange-b400-rgb), 1);

  //   &::before {
  //     bottom: -0.5rem;
  //   }
  // }

  > :deep(.card) {
    .card-cnt {
      border-radius: 0;
      flex: 1 1 auto;
    }

    > .buttons {
      background: transparent;
      border: none;

      > .button-wrapper {
        display: flex;
        justify-content: flex-end;
        align-items: center;

        > .button-icon {
          width: 1rem;
          height: 1rem;
          padding: 0.25rem;
        }

        .bng-button {
          flex: initial;
          cursor: pointer;
          background: transparent;

          &:hover {
            background: transparent;
          }
        }
      }
    }
  }

  > :deep(.card) > * {
    ::-webkit-scrollbar {
      width: 0.25rem;
      height: 0.25rem;
    }

    ::-webkit-scrollbar-corner {
      background: transparent;
    }

    /* Track */
    ::-webkit-scrollbar-track {
      background: #222;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
      background: #f60;
    }
  }
}

.info-content {
  overflow-y: auto;
}

:deep(.info-content) {
  padding: 0 0.5rem 0.5rem 0.5rem;
}
</style>
