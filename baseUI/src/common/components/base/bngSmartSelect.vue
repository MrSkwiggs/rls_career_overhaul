<template>
  <BngSelect
    v-if="type !== 'dropdown'"
    ref="elSelect"
    class="bng-smart-select"
    v-model="value"
    :options="binds.options"
    :config="binds.config"
    :disabled="binds.disabled"
    loop
    label-clickable
    :label-popover="elDropdown?.popoverName"
    @label-click="openDropdown"
    @change="onSelectChanged"
  />
  <BngDropdown
    v-if="binds.items"
    ref="elDropdown"
    :class="`bng-smart-${type}`"
    v-model="value"
    :items="binds.items"
    :highlight="binds.highlight"
    :disabled="binds.disabled"
    :headless="type === 'select'"
    :show-search="binds.showSearch"
    :focus-target="binds.focusTarget"
    :popover-target="binds.popoverTarget"
    @valueChanged="onDropdownChanged"
  />
</template>

<script setup>
import { ref, computed } from "vue"
import { BngSelect, BngDropdown } from "@/common/components/base"

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  threshold: {
    type: Number,
    default: 6,
  },
  type: {
    type: String,
    default: "",
    validator(val) {
      return ["", "select", "dropdown"].includes(val)
    },
  },
  highlight: [String, Array, RegExp],
  disabled: Boolean,
})

const value = defineModel()

const emit = defineEmits(["change"])

const elDropdown = ref()
const elSelect = ref()

const types = {
  none: BngSelect,
  select: BngSelect,
  dropdown: BngDropdown,
}

const items = computed(() => Array.isArray(props.items) ? props.items : [])
const type = computed(() =>
  props.type && props.type in types ? props.type :
    items.value.length === 0 ? "none" :
      items.value.length <= props.threshold ? "select" :
        "dropdown"
)

const binds = computed(() => {
  let res = {
    disabled: props.disabled,
  }
  switch (type.value) {
    default:
      res.options = ["n/a"]
      res.disabled = true
      break
    case "select":
      res.loop = true
      res.labelClickable = true
      res.config = {
        label: itm => itm?.label || "n/a",
        value: itm => itm?.value,
      }
      res.options = items.value.filter(itm => !itm.disabled && !itm.group)
      res.items = items.value
      res.highlight = props.highlight
      if (!res.disabled) res.disabled = res.options.length === 0
      res.popoverTarget = elSelect.value?.getElement?.()
      res.focusTarget = elSelect.value?.getContentElement?.() || res.popoverTarget
      break
    case "dropdown":
      res.items = items.value
      res.highlight = props.highlight
      res.showSearch = true
      break
  }
  return res
})

function openDropdown() {
  //elDropdown.value?.open()
}

function onSelectChanged(newValue) {
  if (value.value === newValue) return
  emit('change', newValue)
}

function onDropdownChanged(newValue) {
  // Need to allow all value changes to be emitted because v-models between two aren't in sync
  // TODO: Fix this by refactoring dropdown to use defineModel
  if (value.value === newValue) return
  emit('change', newValue)
}
</script>

<style lang="scss" scoped>
.bng-smart-select {
  position: relative;
  --indicator-size: 2px;
  --indicator-padding: 2.25em;
  padding: 0 !important;
  > :deep(button) {
    margin: 0 !important;
  }
  .label {
    cursor: pointer;
    &:hover {
      color: var(--bng-orange);
    }
  }
}
</style>
