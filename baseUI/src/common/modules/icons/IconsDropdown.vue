<template>
  <BngDropdownContainer class="bng-dropdown-icons-list" v-model:opened="opened">
    <template #display>
      <BngIcon :type="selected" />
      <span>{{ selected.name }}</span>
    </template>
    <IconsList class="icons-list" @select="select" />
  </BngDropdownContainer>
</template>

<script setup>
import { ref, computed } from "vue"
import { BngDropdownContainer, BngIcon, icons } from "@/common/components/base"
import IconsList from "./IconsList.vue"

const props = defineProps({
  modelValue: {
    type: [String, Object],
    default: ""
  }
})

const emit = defineEmits(["update:modelValue", "select"])

const modelAsObject = computed(() => typeof props.modelValue === "object")

const selected = ref(props.modelValue ? modelAsObject.value ? props.modelValue : { name: props.modelValue, ...icons[props.modelValue] } : { ...icons._empty, name: "Select" })

const opened = ref(false)

function select(icon) {
  selected.value = icon
  const value = modelAsObject.value ? icon : icon.name
  emit("update:modelValue", value)
  emit("select", value)
  opened.value = false
}
</script>

<style>
.bng-dropdown-content.bng-dropdown-icons-list {
  width: 35em;
  height: 27em;
  overflow: hidden !important;
}
</style>
