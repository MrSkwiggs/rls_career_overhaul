<template>
  <BngPopoverContent
    ref="popoverContent"
    :name="name"
    :offset="offset"
    :hide-arrow="hideArrow"
    :disabled="disabled"
    @placement-changed="relay.placementChanged"
    @hide="hide"
  >
    <div ref="popoverMenu" class="bng-popover-menu">
      <slot :hide="hide"></slot>
    </div>
  </BngPopoverContent>
</template>

<script setup>
import { ref, watchEffect, nextTick } from "vue"
import { BngPopoverContent } from "@/common/components/base"
import { setFocus } from "@/services/uiNavFocus"
import { usePopover } from "@/services/popover"

const popover = usePopover()

defineOptions({ inheritAttrs: false })

const props = defineProps({
  /// relayed props (same as in BngPopoverContent)
  name: String,
  offset: {
    type: Number,
    default: 4,
  },
  hideArrow: Boolean,
  disabled: Boolean,
  /// menu props
  focus: Boolean,
})

const emit = defineEmits(["show", "hide", "placementChanged"])

const relay = {
  show: (...args) => emit("show", ...args),
  hide: (...args) => emit("hide", ...args),
  placementChanged: (...args) => emit("placementChanged", ...args),
}

const popoverContent = ref(null)
const popoverMenu = ref(null)

/** @type {function} */
const hide = (...args) => popoverContent.value.hide(...args)

defineExpose({
  hide,
  show: (...args) => popoverContent.value.show(...args),
  toggle: (...args) => popoverContent.value.toggle(...args),
  isShown: (...args) => popoverContent.value.isShown(...args),
  getElement: () => popoverMenu.value,
})

watchEffect(() => {
  // return focus to the element raised it
  if (props.name in popover.popovers) {
    const pop = popover.popovers[props.name]
    !pop.show &&
      nextTick(() => {
        pop.target && document.activeElement === document.body && setFocus(pop.target, true, false)
      })
  }
})
</script>

<style lang="scss" scoped>
.bng-popover-menu {
  width: max-content;
  display: flex;
  flex-flow: column;
  gap: 0.25em;
}
</style>
