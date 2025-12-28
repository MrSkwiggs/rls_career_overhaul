<!-- bngDropdown - a dropdown component -->
<template>
  <div
    v-if="!headless"
    ref="container"
    v-bind="binds"
    :class="['bng-dropdown', props.class]"
    v-bng-disabled="disabled"
    v-bng-on-ui-nav:ok.asMouse.focusRequired
    v-bng-popover:bottom-start.click="popoverName"
  >
    <BngIcon
      :type="icons.arrowSmallRight"
      :class="{
        'dropdown-arrow': true,
        'dropdown-arrow-top': openedTop,
        opened,
      }" />
    <slot name="display">Select</slot>
  </div>
  <BngPopoverContent
    :name="popoverName"
    @show="open(true)"
    @hide="open(false)"
    hide-arrow
    @placement-changed="value => (placement = value)"
  >
    <div
      ref="content"
      class="bng-dropdown-content"
      :class="class"
      v-bng-auto-scroll:top
      bng-nav-scroll
      v-bng-ui-nav-label:back,menu="'ui.common.close'"
      v-bng-ui-nav-label:focus_u,focus_d="'ui.mainmenu.navbar.navigate'"
      v-bng-ui-nav-scroll
      v-bng-on-ui-nav:menu="() => open(false)"
      @click.stop
      @mouseover.stop
      @mouseenter.stop
      @mousedown.stop
      @mouseup.stop>
      <slot v-if="opened"></slot>
    </div>
  </BngPopoverContent>
</template>

<script setup>
import { ref, computed, watch, useAttrs } from "vue"
import { BngPopoverContent, BngIcon, icons } from "@/common/components/base"
import { vBngAutoScroll, vBngDisabled, vBngOnUiNav, vBngUiNavLabel, vBngPopover, vBngUiNavScroll } from "@/common/directives"
import { setFocus } from "@/services/uiNavFocus"
import { usePopover } from "@/services/popover"
import { uniqueId } from "@/services/uniqueId"
import { useUINavBlocker } from "@/services/uiNavTracker"

const navBlocker = useUINavBlocker()

const props = defineProps({
  disabled: Boolean,
  class: [String, Array, Object],
  headless: Boolean,
  focusTarget: Object,
  popoverTarget: Object,
})

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const binds = computed(() => ({
  ...attrs,
  tabindex: props.headless ? -1 : 0,
  "bng-nav-item": props.headless ? undefined : "",
}))

const opened = defineModel("opened")
function open(val) {
  opened.value = val
  if (val) {
    navBlocker.allowOnly(["focus_u", "focus_d", "focus_ud", "back", "menu", "ok"])
    emit("show")
  } else {
    navBlocker.clear()
    emit("hide")
    if (focusTarget.value) setFocus(focusTarget.value, true, false)
  }
}

const emit = defineEmits(["provideFocus", "show", "hide"])

const popover = usePopover()
const popoverBaseName = "bng-dropdown-content"
const popoverName = uniqueId(popoverBaseName)

const container = ref(null)
const content = ref(null)

const focusTarget = computed(() => props.focusTarget || container.value)
const popoverTarget = computed(() => props.popoverTarget || container.value)

const placement = ref("bottom-start")
const openedTop = computed(() => placement.value.startsWith("top"))

watch(
  () => opened.value,
  value => {
    if (value) {
      // close all unrelated popovers that does not contain our target
      // add "&& name.startsWith(popoverBaseName)" if need close other dropdowns only
      Object.keys(popover.popovers)
        .filter(name => popover.popovers[name].show && name !== popoverName && !popover.popovers[name].element.contains(popover.popovers[popoverName].target))
        .forEach(name => popover.hide(name))
      // this is for programmatic opening of the dropdown
      if (!popover.popovers[popoverName].show && popoverTarget.value) {
        popover.show(popoverName, popoverTarget.value)
      }
    } else {
      popover.hide(popoverName)
    }
  }
)

defineExpose({
  opened,
  open: () => opened.value = true,
  close: () => opened.value = false,
  toggle: () => opened.value = !opened.value,
  focusContainer: () => focusTarget.value && setFocus(focusTarget.value),
  popoverName,
})
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

.bng-dropdown {
  $f-offset: 0.125rem;
  $rad: $border-rad-1;

  display: flex;
  align-items: center;

  position: relative;
  padding: 0.25em;
  padding-right: 0.75em;
  border-radius: $rad;
  background: var(--bng-dropdown-bg, var(--bng-cool-gray-800));
  cursor: pointer;
  user-select: none;
  margin: 0.125rem;
  min-width: 6em;
  pointer-events: auto;

  & > .dropdown-arrow {
    font-size: 1.5em;
    transition: transform 100ms ease-in-out;
    &.opened {
      transform: rotate(90deg);
      &.dropdown-arrow-top {
        transform: rotate(-90deg);
      }
    }
  }

  &:hover {
    background: var(--bng-dropdown-bg-hover, var(--bng-cool-gray-750)) !important;
  }

  &:active {
    background: var(--bng-dropdown-bg-active, var(--bng-cool-gray-850)) !important;
  }

  @include modify-focus($rad, $f-offset);
  &[disabled] {
    pointer-events: none;
    background: var(--bng-dropdown-bg, var(--bng-cool-gray-800));
    color: var(--bng-cool-gray-600);

    &:focus::before {
      display: none;
    }
    & > .dropdown-arrow {
      color: inherit !important;
    }
  }
}

:deep(.bng-popover) {
  padding: 0;
}

.bng-dropdown-content {
  // position: relative;
  background-color: var(--bng-ter-blue-gray-700);
  display: flex; // required to make inner content receive the dimensions
  flex-direction: column;
  // min-height: 1.875em; // single item height (1.375em) plus padding (0.5em)
  height: max-content;
  width: max-content;
  max-width: 32rem;
  max-height: 20rem;
  overflow-y: auto;
  padding: 0;
  border-radius: var(--bng-corners-1);
  > :deep(*) {
    flex: 1 1 auto;
  }
  cursor: default;
  user-select: unset;
}

.bng-dropdown-headless {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  border: none;
  background-color: transparent;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
}
</style>
