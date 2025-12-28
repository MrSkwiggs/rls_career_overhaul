<template>
  <div class="group">
   <div class="header"> 
     {{label}}
  </div>
 
   <!-- <CargoInfo :label="label" :fill-info="fillInfo" :meta="meta" />-->
   
    <div class="cards">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import {BngCardHeading} from "@/common/components/base"
defineProps({
  label: String,
  meta: Object,
})
</script>

<style scoped lang="scss">
.group {

  .header {
    font-style: italic;
    font-size: 1.5em;
    font-weight: 600;

  }


  .divider {
      width: 100%;
      height: 8px;

      background: #6668;
  }

  display:flex;
  flex-flow: column;

  color:white;
  align-items:start;

  //background-color: blue;

  .cards {
    width: 100%;
    display: grid;
    gap: 0.2rem;
    grid-template-columns: repeat(auto-fill, minmax(20em, 1fr));

    padding: 0.75rem 0;
  }

}
</style>
