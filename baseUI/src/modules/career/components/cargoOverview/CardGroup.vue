<template>
  <div class="group">
    <CargoInfo :label="label" :fill-info="fillInfo" :meta="meta" />

    <div class="cards">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import CargoInfo from "./CargoInfo.vue"

defineProps({
  label: String,
  fillInfo: Object,
  meta: Object,
})
</script>

<style scoped lang="scss">
.group {

    background-image: linear-gradient(180deg,
      rgba(var(--bng-cool-gray-700-rgb),1) 0%,
      rgba(var(--bng-cool-gray-700-rgb),1) 0.25rem,
      rgba(var(--bng-cool-gray-700-rgb),0.5) 0.251rem,
      rgba(var(--bng-cool-gray-700-rgb),0.15) 100%,
    );

  display:grid;
  grid-template-columns: 1fr auto;
  color:white;
  align-items:start;

  //background-color: blue;

  .cards {
    grid-column: 1 / -1;
    display: grid;
    gap: 0.2rem;
    grid-template-columns: repeat(auto-fill, minmax(17em, 1fr));

    overflow-y:hidden;
    align-items: stretch;
    padding: 0.25rem 0.1rem 0.1rem;
  }

}
</style>
