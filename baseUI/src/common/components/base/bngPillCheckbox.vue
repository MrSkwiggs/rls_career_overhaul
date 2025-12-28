<!-- bngPillCheckbox - a pill control as a checkbox -->
<template>
  <span class="bng-pill-checkbox" :class="{ 'show-icon': isChecked && props.markedIcon }">
    <BngPill :marked="isChecked" @click="onChecked" @keyup.space="onChecked">
      <span :class="{'pill-content':true, 'uses-mark':markedIcon}">
        <slot></slot>
      </span>
      <BngIcon class="pill-mark-icon" :type="props.markedIcon === true ? icons.checkmark : props.markedIcon || icons.checkmark" />
    </BngPill>
  </span>
</template>

<script setup>
import { computed, ref } from "vue"
import { BngPill, BngIcon, icons } from "@/common/components/base"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: null,
  },
  markedIcon: {
    type: [Boolean, Object],
    default: true,
  },
})

const emit = defineEmits(["update:modelValue", "valueChanged", "change"])

const defaultValue = ref(false)

const isChecked = computed({
  get: () => (props.modelValue !== undefined && props.modelValue !== null ? props.modelValue : defaultValue.value),
  set: newValue => {
    if (props.modelValue !== undefined && props.modelValue !== null) {
      notifyListeners(newValue)
    } else {
      defaultValue.value = newValue
      emit("valueChanged", newValue)
      emit("change", newValue)
    }
  },
})

const onChecked = () => (isChecked.value = !isChecked.value)

function notifyListeners(value) {
  emit("update:modelValue", value)
  emit("change", value)
  emit("valueChanged", value)
}
</script>

<style scoped lang="scss">
.bng-pill-checkbox {
  :deep(.bng-pill) {
    display: inline-flex;
    justify-content: center;
    align-items: center;

    > .pill-content {
      padding: 0;
      user-select: none;
    }

    > .pill-content.uses-mark {
      padding: 0 0.675em;
    }

    > .pill-mark-icon {
      font-size: 1.25em;
      display: none;
      margin-left: 2px;
      user-select: none;
    }
  }

  &.show-icon > .bng-pill {
    > .pill-content {
      padding: 0;
    }

    > .pill-mark-icon {
      display: inline-block;
    }
  }

  &[disabled]:not([disabled="false"]) {
    pointer-events: none;
  }
}

</style>
