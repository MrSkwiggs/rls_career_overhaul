<template>
  <div class="bng-path" :bng-no-child-nav="!navigable">
    <BngButton v-if="showBackButton" class="back-button" :accent="ACCENTS.custom" @click="emit('back')" tabindex="1">
      <BngIcon :type="icons.arrowSmallLeft" class="back-icon" />
      <BngBinding v-if="showBackBinding" ui-event="back" controller track-ignore />
      {{ $tt("ui.common.back") }}
    </BngButton>
    <template v-for="(item, index) in pathView" :key="index">
      <template v-if="!item.dropdown">
        <BngButton
          class="bng-path-item"
          :class="{
            'bng-path-simple': simple,
            'bng-path-disabled': disableLastItem && item.last,
            'bng-path-first': item.first,
            'bng-path-last': item.last,
          }"
          :accent="ACCENTS.text"
          v-bng-blur="blur"
          @click="onClick(item, index)"
        >{{ item.label }}</BngButton>
        <div v-if="simple && !item.last" class="bng-path-item bng-path-icon">
          <BngIcon :type="item.dividerType || icons.slashRight" v-bng-blur="blur" />
        </div>
      </template>
      <template v-else>
        <BngButton
          class="bng-path-item bng-path-has-dropdown"
          :accent="ACCENTS.text"
          :icon="icons.arrowSmallRight"
          v-bng-blur="blur"
          v-bng-popover:bottom-start.click="item.dropdown"
        />
        <BngPopoverMenu :name="item.dropdown" focus>
          <template #default="{ hide }">
            <BngButton
              v-for="(subitem, idx) in item.items"
              :key="idx"
              :class="{ selected: idx === item.selected }"
              :accent="ACCENTS.menu"
              v-bng-on-ui-nav:ok.focusRequired.asMouse
              @click="onMenuClick(subitem, hide)"
            >{{ subitem.label }}</BngButton>
          </template>
        </BngPopoverMenu>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { BngButton, BngIcon, BngPopoverMenu, ACCENTS, icons, BngBinding } from "@/common/components/base"
import { vBngBlur, vBngPopover, vBngOnUiNav } from "@/common/directives"
import { uniqueId } from "@/services/uniqueId"

const bid = uniqueId("bng-path")

const emit = defineEmits(["click", "back"])

const props = defineProps({
  items: Array,
  limit: {
    // how many items to display in path
    type: [Number, String],
    default: 3,
    validator: val => Number(val) > 0,
  },
  simple: Boolean, // disables arrows
  blur: Boolean,
  disableLastItem: Boolean, // makes the last item not clickable
  showBackButton: Boolean,
  showBackBinding: {
    type: Boolean,
    default: true,
  },
  navigable: {
    type: Boolean,
    default: true,
  },
})

const pathView = computed(() => {
  // if defined
  if (!Array.isArray(props.items)) return []

  const mapItem = itm => ({
    label: itm.label,
    items: itm.items,
    data: itm,
    dividerType: itm.dividerType,
  })

  const items = props.items.map(mapItem)

  // apply limit of displayed items
  const res = props.limit ? items.slice(-props.limit) : items

  // add arrows
  if (!props.simple) {
    const looseCmp = (a, b) => a.label === b.label && a.value === b.value
    const len = res.length
    for (let i = 1; i < len; i++) {
      const idx = len - i
      const items = Array.isArray(res[idx - 1].items) ? res[idx - 1].items : [res[idx].data]
      res.splice(idx, 0, {
        dropdown: `${bid}-sub-${idx}`,
        selected: items.findIndex(itm => looseCmp(itm, res[idx])),
        items: items.map(mapItem),
      })
    }
  }

  // add overflown item
  if (props.limit && items.length > props.limit) {
    res.unshift({
      label: "…",
      data: items[items.length - props.limit - 1],
    })
  }

  if (res.length > 0) {
    res[0].first = true
    res.at(-1).last = true
  }

  return res
})

function onClick(item, index) {
  if (!props.disableLastItem || index < pathView.value.length - 1) {
    emit("click", item.data)
  }
}

function onMenuClick(item, popClose) {
  console.log("onMenuClick", item, popClose)
  popClose()
  emit("click", item.data)
}
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

$corners: var(--bng-corners-1);
$background-color: var(--background-color, var(--bng-off-black));

.bng-path {
  display: inline-flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: stretch;
  overflow: hidden;
  background-color: $background-color;
  border-radius: var(--bng-corners-2);

  .back-button {
    // Custom accent background color variables
    --bng-button-custom-enabled: rgba(var(--bng-off-black-rgb), 0.01);
    --bng-button-custom-hover: var(--bng-orange-600);
    --bng-button-custom-active: var(--bng-orange-800);
    --bng-button-custom-disabled: rgba(var(--bng-off-black-rgb), 0.01);

    --bng-button-custom-border-enabled: var(--bng-cool-gray-600);
    --bng-button-custom-border-hover: var(--bng-orange-400);
    --bng-button-custom-border-active: var(--bng-orange-600);
    --bng-button-custom-border-disabled: rgba(var(--bng-cool-gray-800-rgb), 0.8);

    --bng-button-custom-border-radius: var(--bng-corners-2);

    --bng-button-padding: 0.25em 0.75em 0.25em 0.75em;

    --bng-button-min-width: 2em;

    --bng-content-align: center;

    >.back-icon {
      width: 0.5em;
      transform: translateX(-0.25em);
    }
  }
  .bng-path-item {
    flex: 0 1 auto;
    margin-left: 0 !important;
    margin-right: 0 !important;
    min-width: unset !important;
    border-radius: 0 !important;
    @include modify-focus($border-rad-1, 0.0rem);

    // TODO: convert to custom button accent

    :deep(.background) {
      border-radius: 0;
    }

    &.bng-path-first {
      :deep(.background) {
        border-radius: $corners 0 0 $corners;
      }
    }

    &.bng-path-last {
      :deep(.background) {
        border-radius: 0 $corners $corners 0;
      }
    }

    &.bng-path-last {
      :deep(.label) {
        text-decoration-line: underline;
        text-decoration-style: solid;
        text-decoration-thickness: 2px;
        text-decoration-color: var(--bng-orange-500);
      }
    }

    &:not(.bng-path-has-dropdown):not(.bng-path-icon) {
      padding-left: 0.75em;
      padding-right: 0.75em;
      :deep(.label) {
        max-width: 20em;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      :deep(.background) {
        background-color: $background-color;
        opacity: var(--bng-breadcrumbs-enabled-opacity, 1);
      }
      &.bng-path-simple:not(.bng-path-first) {
        padding-left: 0.5em;
      }
      &.bng-path-simple:not(.bng-path-last) {
        padding-right: 0.5em;
      }
    }

    &.bng-path-has-dropdown {
      padding-left: 0;
      padding-right: 0.15em;
    }

    &.bng-path-icon {
      position: relative;
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 0.75em;
      margin: 0.25rem 0;
      --bng-icon-size: 1em;
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-color: $background-color;
        opacity: var(--bng-breadcrumbs-enabled-opacity, 1);
      }
    }

    &.bng-path-disabled {
      pointer-events: none;
    }
  }
}
</style>
