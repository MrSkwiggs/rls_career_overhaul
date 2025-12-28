<template>
  <BngButton
    ref="btnRef"
    :accent="ACCENTS.custom"
    :disabled="disabled"
    :icon="icon"
    :externalIcon="externalIcon"
    class="garage-button"
    :class="{
      [`garage-button-${type}`]: !!type,
      'garage-button-with-content': hasContent,
      'garage-button-active': active,
    }"
    v-bind="$attrs"
  >
    <div v-if="showContent" class="garage-button-content">
      <slot></slot>
    </div>
  </BngButton>
</template>

<script setup>
import { ref, computed, useSlots, onUpdated } from "vue"
import { BngButton, ACCENTS } from "@/common/components/base"
import { ensureFocus } from "@/services/uiNavFocus"

const props = defineProps({
  icon: [Object, String],
  externalIcon: String,
  disabled: Boolean,
  active: Boolean,
  type: {
    type: String,
    validator: (val) => ['drawer-toggle', 'drawer-button', ''].includes(val) || val === undefined
  }
})

const slots = useSlots()
const hasContent = computed(() => slots.default)
const showContent = computed(() => hasContent.value && !(props.type === 'drawer-toggle' && !props.active))

const btnRef = ref(null)
onUpdated(() => ensureFocus(btnRef.value?.getElement?.()))
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

.garage-button {
  --bng-content-flow: column;
  --bng-content-align: center;
  --bng-icon-align: center;
  --bng-button-custom-enabled: var(--bng-off-black);
  --bng-button-custom-active: var(--bng-off-black);
  --bng-button-custom-hover: var(--bng-off-black);
  --bng-button-custom-disabled: var(--bng-off-black);
  --bng-button-custom-enabled-opacity: 0.6;
  --bng-button-custom-hover-opacity: 0.8;
  --bng-button-custom-active-opacity: 0.8;
  --bng-button-custom-disabled-opacity: 0.4;

  @include modify-focus($border-rad-1, 0.25rem);

  margin: 0.5em;

  z-index: unset !important; // otherwise it breaks focus frame

  &.garage-button-with-content {
    height: 5em;
  }

  :deep(.icon) {
    padding-right: 0 !important;
    font-size: 2.5em;
    line-height: 1.2em;
    transform: none !important;
    align-self: center !important;
  }

  :deep(.label) {
    flex: 0 0 auto !important;
    max-width: 100%;
    text-align: center;
  }

  &.garage-button-content {
    display: block;
    width: 100%;
    text-align: center;
    pointer-events: none;
  }

  &.garage-button-active {
    --bng-button-custom-enabled: var(--bng-orange);
    --bng-button-custom-active: var(--bng-orange-600);
    --bng-button-custom-hover: var(--bng-orange-600);
    --bng-button-custom-disabled: var(--bng-orange);
    --bng-button-custom-enabled-opacity: 1;
    --bng-button-custom-hover-opacity: 1;
    --bng-button-custom-active-opacity: 1;
    --bng-button-custom-disabled-opacity: 0.6;
  }

  &.garage-button-drawer-toggle,
  &.garage-button-drawer-button {
    height: 100%;
    margin: 0 !important;
    border-radius: 0;
  }

  &.garage-button-drawer-toggle.garage-button-active,
  &.garage-button-drawer-button {
    --bng-button-custom-border-radius: 0;
  }
}
</style>
