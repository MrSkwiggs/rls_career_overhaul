<template>
  <div class="group-header" bng-list-title>
    <BngCardHeading class="header-label">{{ label }}</BngCardHeading>
    <div class="header-line"></div>
  </div>
</template>

<script setup>
import BngCardHeading from "@/common/components/base/bngCardHeading.vue";
defineProps({
  label: {
    type: String,
    required: true
  }
})
</script>

<style lang="scss" scoped>
.group-header {
  display: flex;
  align-items: center;
  gap: 0.0rem;
}

.header-label {
  flex: 0 0 auto;
  margin-left: -0.4rem;
  margin-top: 0.3rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  letter-spacing: 0.02em;
}

.header-line {
  flex: 1 1 auto;
  height: 1px;
  background: rgba(255, 255, 255, 0.15);
}
</style>

