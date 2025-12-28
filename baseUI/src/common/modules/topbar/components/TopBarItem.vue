<template>
  <div
    ref="item"
    class="topbar-item"
    :class="{ 'icon-only': iconOnly }"
    :accent="accent"
    bng-nav-item
    bng-no-nav="true"
    tabindex="-1"
    v-bng-sound-class="'bng_click_hover_generic'"
  >
    <BngIcon class="topbar-item-icon" :type="icon" />
    <TextScroller v-if="label && !iconOnly" class="topbar-item-text">{{ $t(label) }}</TextScroller>
  </div>
</template>

<script setup>
import { watch, ref } from "vue"
import { BngIcon } from "@/common/components/base"
import { TextScroller } from "@/common/components/utility"
import { vBngSoundClass } from "@/common/directives"
import { NO_NAV_ATTR } from "@/services/crossfire"

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: undefined,
  },
  label: String,
  iconOnly: Boolean,
  iconPosition: {
    type: String,
    default: "left",
  },
  accent: {
    type: String,
    default: "default",
  },
})

const item = ref(null)

watch(
  () => props.active,
  value => {
    if (typeof value !== "boolean") return

    if (value) {
      item.value.setAttribute("active", "true")
      item.value.removeAttribute(NO_NAV_ATTR)
    } else {
      item.value.removeAttribute("active")
      item.value.setAttribute(NO_NAV_ATTR, "true")
    }
  }
)
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

$default-background: rgba(0, 0, 0, 0.6);
$default-text-color: var(--bng-off-white);
$default-active-background: var(--bng-off-white);
$default-active-text-color: var(--bng-orange-400);

$attention-background-color: var(--bng-add-red-600);
$attention-text-color: var(--bng-off-white);
$attention-active-background: var(--bng-add-red-700);
$attention-active-text-color: var(--bng-off-white);

.topbar-item {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  height: 100%;
  min-width: calc-ui-rem(6);
  max-width: calc-ui-rem(10);
  font-size: calc-ui-rem();
  padding: 0 calc-ui-rem(0.5);
  color: $default-text-color;
  background: $default-background;
  white-space: nowrap;
  // border-bottom: calc-ui-rem(0.125) solid transparent;
  cursor: pointer;
}

.topbar-item > .topbar-item-icon {
  flex: 0 1 auto;
  margin-right: calc-ui-rem(0.5);
}

.topbar-item > .topbar-item-text {
  flex: 1 1 auto;
}

.topbar-item.icon-only {
  width: calc-ui-rem(2.5);
  min-width: 0;

  > .topbar-item-icon {
    margin-right: 0;
  }
}

/* ACTIVE STYLES */
.topbar-item {
  &::before {
    content: "";
    display: none;
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: calc-ui-rem(0.125);
  }

  &[active]::before {
    display: inline-block;
  }

  &:not([active]) {
    flex: 0 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* HOVER STYLES */
.topbar-item {
  &::after {
    content: "";
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--bng-orange-400);
    z-index: -1;
  }

  &:hover::after {
    display: inline-block;
  }
}

/* ACCENT STYLES */
.topbar-item[accent="default"] {
  background: $default-background;
  color: $default-text-color;

  &[active] {
    background: $default-active-background;
    color: $default-active-text-color;
    // border-bottom-color: $default-active-text-color;

    &::before {
      background: $default-active-text-color;
    }

    > .topbar-item-icon {
      color: $default-active-text-color;
    }
  }
}

.topbar-item[accent="attention"] {
  background: $attention-background-color;
  color: $attention-text-color;

  &[active] {
    background: $attention-active-background;
    color: $attention-active-text-color;
    // border-bottom-color: $attention-active-text-color;

    &::before {
      background: $attention-active-text-color;
    }

    > .topbar-item-icon {
      color: $attention-active-text-color;
    }
  }
}
</style>
