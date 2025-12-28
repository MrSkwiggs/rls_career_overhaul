<template>
  <Drawer v-model="expanded" :blur="blur" :position="position">
    <template #header>
      <BngCardHeading
        class="header"
        type="ribbon"
        :style="{ marginRight: !header && !slots.header ? '0' : undefined }"
      >
        <template v-if="header">{{ header }}</template>
        <slot v-else name="header">
          <span></span>
        </slot>
      </BngCardHeading>
      <slot name="header-controls"></slot>
      <BngButton
        v-if="expandable"
        accent="text"
        :icon="expanded ? arrows.collapse : arrows.expand"
        @click="expanded = !expanded"
      />
    </template>
    <template #content v-if="'content' in slots">
      <slot name="content"></slot>
    </template>
    <template #expanded-content v-if="'expanded-content' in slots">
      <slot name="expanded-content"></slot>
    </template>
    <template #expanded-content v-else-if="'default' in slots">
      <slot></slot>
    </template>
  </Drawer>
</template>

<script setup>
import { computed, watch, useSlots } from "vue"
import { Drawer, DRAWER_POSITION } from "@/common/components/utility"
import { BngCardHeading, BngButton, icons } from "@/common/components/base"

const props = defineProps({
  header: String,
  blur: Boolean,
  expandable: {
    type: Boolean,
    default: true,
  },
  position: String,
})

const emit = defineEmits(["change"])

const slots = useSlots()

const arrows = computed(() => {
  switch (props.position) {
    default:
    case DRAWER_POSITION.bottom:
    case DRAWER_POSITION.right:
      return { expand: icons.arrowLargeUp, collapse: icons.arrowLargeDown }
    case DRAWER_POSITION.top:
    case DRAWER_POSITION.left:
      return { expand: icons.arrowLargeDown, collapse: icons.arrowLargeUp }
  }
})

const expanded = defineModel({ type: Boolean })
watch(() => expanded.value, val => emit("change", val))

watch(
  [() => props.expandable, () => expanded.value],
  () => !props.expandable && expanded.value && (expanded.value = false),
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.header {
  font-weight: 800;
  font-size: 1.5rem;
  min-height: 1.25em;
  margin: 0.5em 0.75em 0.25em 0;
  padding-right: 0;
  color: #fff;
}
</style>
