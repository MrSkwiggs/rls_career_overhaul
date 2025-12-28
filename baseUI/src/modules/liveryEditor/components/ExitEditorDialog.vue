<template>
  <div class="exit-editor-dialog">
    <BngInput v-model="formModel.name" suffix=".dyndecals.json" />
    <div class="apply-skin-wrapper">
      <BngPillCheckbox v-model="formModel.applySkin" :disabled="!formModel.name">Apply Skin</BngPillCheckbox>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue"
import { BngInput, BngPillCheckbox, BngSwitch } from "@/common/components/base"

const props = defineProps({
  modelValue: {
    type: [Object, String, Number, Boolean],
    required: true,
  },
})

const emit = defineEmits(["update:modelValue"])

const formModel = computed({
  get: () => props.modelValue,
  set: newValue => {
    emit("update:modelValue", newValue)
  },
})
</script>

<style lang="scss" scoped>
.exit-editor-dialog {
  display: flex;
  flex-direction: column;

  > *:not(:last-child) {
    margin-bottom: 0.5rem;
  }

  .apply-skin-wrapper {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
