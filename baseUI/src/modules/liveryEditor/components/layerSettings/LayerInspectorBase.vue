<template>
  <div class="layer-inspector-base">
    <div class="inspector-heading">
      <BngCardHeading type="ribbon">
        <slot name="heading">
          <span>{{ heading }}</span>
        </slot>
      </BngCardHeading>
    </div>
    <div class="inspector-content">
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

const slots = useSlots()
</script>

<style lang="scss" scoped>
.layer-inspector-base {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  border-radius: var(--bng-corners-1);
  border-bottom: 0.125rem solid var(--bng-orange-b400);

  :deep(.card-heading) {
    margin: 0;
    margin-block: 0;
  }

  > .inspector-heading {
    position: relative;
    display: flex;
    align-items: center;

    :deep(.card-heading) {
      width: 100%;
    }
  }

  > .inspector-content {
    flex-grow: 1;
  }
}
</style>
