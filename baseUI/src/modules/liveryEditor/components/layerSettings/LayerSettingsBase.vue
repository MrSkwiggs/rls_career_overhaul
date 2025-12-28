<template>
  <div class="layer-settings-base">
    <div class="settings-heading">
      <BngCardHeading type="ribbon">
        <slot v-if="slots.heading" name="heading">
          <span>{{ heading }}</span>
        </slot>
      </BngCardHeading>
    </div>
    <div class="settings-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { useSlots } from "vue"
import { BngCardHeading } from "@/common/components/base"

defineProps({
  heading: {
    type: String,
  },
})

defineEmits(["close"])

const slots = useSlots()
</script>

<style lang="scss" scoped>
.layer-settings-base {
  display: flex;
  flex-direction: column;
  padding: 1rem 0 1rem 0;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  border-radius: var(--bng-corners-1);
  border-bottom: 0.125rem solid var(--bng-orange-b400);

  :deep(.card-heading) {
    margin: 0;
    margin-block: 0;
  }

  > .settings-heading {
    position: relative;
    display: flex;
    align-items: center;

    // .back-button {
    //   position: absolute;
    //   left: 1rem;
    //   font-size: 1rem;
    //   padding: 0.25rem 0.5rem;
    //   min-width: unset;
    //   min-height: 2.1rem;
    //   margin-bottom: 0;
    // }

    :deep(.card-heading) {
      width: 100%;
    }
  }

  > .settings-content {
    flex-grow: 1;
  }

  // > :deep(.settings-content) {
  //   padding: 0 0.5rem;

  //   .setting-item {
  //     display: flex;
  //     align-items: baseline;
  //     padding: 0.25rem 0.125rem;
  //     border-radius: 0.25rem;

  //     &:focus {
  //       position: relative;
  //     }

  //     &.item-column {
  //       flex-direction: column;
  //       align-items: start;
  //       justify-content: flex-start;

  //       label {
  //         flex-basis: 0;
  //       }
  //     }

  //     label {
  //       min-width: 4em;
  //     }

  //     > .disabled {
  //       opacity: 0.8;
  //     }

  //     > :last-child {
  //       margin-left: 0.5rem;
  //     }

  //     .slider-text {
  //       display: flex;
  //       align-items: center;
  //       width: 100%;

  //       input[type="range"] {
  //         flex-grow: 1;
  //         margin-right: 0.5rem;
  //       }

  //       input[type="number"] {
  //         flex-grow: 0;
  //       }
  //     }
  //   }
  // }
}
</style>
