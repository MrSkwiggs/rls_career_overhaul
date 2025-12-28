<template>
  <div class="vehicle-item">
    <div class="left">
      <div class="vehicle-thumbnail-wrapper">
        <img :src="vehicle.thumbnail" alt="" class="vehicle-thumbnail" />
      </div>
      <div class="name-value-wrapper">
        <div class="vehicle-name">{{ vehicle.name }}</div>
        <div class="vehicle-value">Value : <BngUnit :money="vehicle.initialValue" /></div>
        <slot name="extra-info"></slot>
      </div>
    </div>
    <div class="right">
      <slot name="rightContent"></slot>
    </div>
  </div>
</template>

<script setup>
import { BngUnit } from "@/common/components/base"

const props = defineProps({
  vehicle: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped lang="scss">
.vehicle-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 0.9375rem;
  max-width: 100%;
  padding: 0.9375rem;
  background-color: var(--bng-cool-gray-800);
  border-radius: var(--bng-corners-2);
  border: 1px solid var(--bng-cool-gray-700);
}

.name-value-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
}

.vehicle-thumbnail-wrapper {
  width: 5.8125rem;
  height: 3.75rem;
  margin-right: 0.625rem;
  border-radius: var(--bng-corners-2);
  overflow: hidden;
}

.right{
  min-width: 11rem;
  justify-content: flex-end;
  display: flex;
  align-items: center;
}

.left{
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.625rem;
}

.vehicle-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vehicle-name {
  font-size: 1.1rem;
  font-weight: 500;
}
</style>

