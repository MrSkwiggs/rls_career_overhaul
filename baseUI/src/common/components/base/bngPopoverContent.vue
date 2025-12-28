<template>
  <Teleport v-if="isRender" to=".popover-container">
    <div
      v-bng-scoped-nav="{ activated: scopeActivated, type: SCOPED_NAV_TYPES.popover }"
      v-bng-on-ui-nav:menu="onMenu"
      ref="popoverContent"
      :data-bng-popover-name="popoverName"
      class="bng-popover"
      @activate="onScopeChanged(true, $event)"
      @deactivate="onScopeChanged(false, $event)">
      <slot :hide="hide"></slot>
      <span v-if="!hideArrow" ref="arrow" class="bng-popover-arrow"></span>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, onMounted, computed, nextTick } from "vue"
import { vBngScopedNav, vBngOnUiNav } from "@/common/directives"
import { usePopover } from "@/services/popover"
import { uniqueId } from "@/services/uniqueId"
import { NAVIGABLE_ELEMENTS_SELECTOR } from "@/services/crossfire"
import { SCOPED_NAV_TYPES } from "@/services/scopedNav"

const props = defineProps({
  name: String,
  offset: {
    type: Number,
    default: 4,
  },
  hideArrow: Boolean,
  placement: String,
  disabled: Boolean,
})

const emit = defineEmits(["show", "hide", "placementChanged"])

const popover = usePopover()
let popoverName

const popoverContent = ref(null)
const arrow = ref(null)
const show = ref(false)
let unwatchShow
let unwatchPlacement
const teleportTargetExists = ref(false)
let observer = null

const scopeActivated = ref(false)

const isRender = computed(() => !props.disabled && teleportTargetExists.value && show.value)

const hide = () => !props.disabled && popover.hide(popoverName)

const expose = {
  hide,
  show: (el = undefined) => !props.disabled && popover.show(popoverName, el),
  toggle: (forceVal = undefined) => popover.toggle(popoverName, !props.disabled && forceVal),
  isShown: () => popover.isShown(popoverName),
}
defineExpose(expose)

watch(
  () => show.value,
  value => emit(value ? "show" : "hide", { name: props.name, ...expose })
)

watch(
  () => props.name,
  (newName, oldName) => {
    if (oldName) disposePopover(oldName)
    if (!props.disabled) setupPopover()
  },
  { immediate: true }
)

watch(
  () => props.disabled,
  value => {
    if (!value) {
      setupPopover()
    } else {
      popover.hide(popoverName)
      disposePopover(popoverName)
    }
  }
)

watch(isRender, async value => {
  if (value) {
    await nextTick()
    checkSlotContent()
  }
})

const onMenu = () => {
  scopeActivated.value = false
}

onBeforeUnmount(() => {
  disposePopover(popoverName)

  if (observer) {
    observer.disconnect()
    observer = null
  }
})

const containerSelector = ".popover-container"
onMounted(async () => {
  teleportTargetExists.value = !!document.querySelector(containerSelector)

  // listen for the container to be added to the DOM
  if (!teleportTargetExists.value) {
    observer = new MutationObserver(() => {
      if (!teleportTargetExists.value && document.querySelector(containerSelector)) {
        teleportTargetExists.value = true
        observer.disconnect()
        observer = null
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  if (isRender.value) {
    await nextTick()
    checkSlotContent()
  }
})

function onScopeChanged(activated, event) {
  scopeActivated.value = activated

  if (!activated && !event.detail.force) {
    popover.hide(popoverName)
  }
}

function checkSlotContent() {
  const navigableElements = popoverContent.value.querySelectorAll(NAVIGABLE_ELEMENTS_SELECTOR)
  if (navigableElements && navigableElements.length > 0 && !scopeActivated.value) scopeActivated.value = true
}

function setupPopover() {
  popoverName = props.name || uniqueId("bng-popover-content")
  const res = popover.register(popoverName, popoverContent, props.placement, { arrow: !props.hideArrow ? arrow : undefined, offset: props.offset })

  if (!res) return

  unwatchShow = watch(res.show, value => (show.value = value))
  unwatchPlacement = watch(res.placement, placement => emit("placementChanged", placement))
}

function disposePopover(name) {
  if (unwatchShow) {
    unwatchShow()
    unwatchShow = null
  }
  if (unwatchPlacement) {
    unwatchPlacement()
    unwatchPlacement = null
  }
  popover.unregister(name)
  show.value = false
  popoverName = null
}
</script>

<style lang="scss" scoped>
$popoverbg: var(--popover-bg-override, var(--bng-ter-blue-gray-700));

.bng-popover {
  position: absolute;
  top: 0;
  left: 0;
  height: max-content;
  width: max-content;
  max-width: 32rem;
  padding: 0.25rem;
  border-radius: var(--bng-corners-1);
  background: $popoverbg;
  pointer-events: all;
  z-index: 12000;

  > .bng-popover-arrow {
    position: absolute;
    display: inline-block;
    height: 1rem;
    width: 1rem;
    transform: rotate(45deg);
    background: $popoverbg;
    z-index: -1;
  }
}
</style>
