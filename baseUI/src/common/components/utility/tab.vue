<!-- Tab [DEPRECATED] -->
<template>
  <slot :tab-heading="heading" :tab-selected="selected"></slot>
</template>

<script setup>
defineProps({
  heading: String,
  selected: Boolean,
})
</script>
