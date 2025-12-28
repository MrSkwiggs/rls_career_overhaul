<template>
  <BngCard class="categoryList">
    <div v-if="partShoppingStore.category === ''" class="mainCategories">
      <div class="computer-function-tile"
        v-bng-focus-if="true"
        bng-nav-item
        tabindex="0"
        :disabled="partShoppingStore.partShoppingData.tutorialPartNames !== undefined ? true : undefined"
        @click="partShoppingStore.partShoppingData.tutorialPartNames === undefined ? partShoppingStore.setCategory('everything') : undefined"

      >
        <BngIcon class="icon" :type="icons.doorFrontCoins" />
        <span class="label">All Parts</span>
      </div>
      <div class="computer-function-tile"
        bng-nav-item
        tabindex="0"
        @click="partShoppingStore.setCategory('cargo')"
      >
        <BngIcon class="icon" :type="icons.boxPickUp03" />
        <span class="label">Cargo Parts</span>
      </div>
    </div>
    <SlotList v-else
      :cancel="props.cancel" />
  </BngCard>
</template>

<script setup>
import { lua } from "@/bridge"
import { BngCard, BngImageTile, BngIcon, icons } from "@/common/components/base"
import SlotList from "./SlotList.vue"
import { usePartShoppingStore } from "../../stores/partShoppingStore"
import { onMounted,ref, watch } from "vue"
import { vBngOnUiNav, vBngBlur,vBngFocusIf } from "@/common/directives"

const partShoppingStore = usePartShoppingStore()

const props = defineProps({
  cancel: Function,
})

onMounted(() => {
  partShoppingStore.backAction = () => props.cancel()
})
</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;
.categoryList {
  position: relative;
  display: block;
  width: 30em;
  height: 100%;
  overflow-y: hidden;
  color: white;
  background-color: var(--bng-black-8);
  // background-color: rgba(0, 0, 0, 0.7);
  & :deep(.card-cnt) {
    background-color: rgba(0, 0, 0, 0.0);
  }
}

.mainCategories {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
}

.allPartsButton {
  &[disabled] {
    opacity: 0.5;
    pointer-events: none;
  }
}


.computer-function-tile {
  // Setting round corners and focus frame offset for focusable tile
  $f-offset: 0.25rem;
  $rad: var(--bng-corners-1);

  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.5em;
  width: 100%;
  border-radius: $rad;
  background-color: rgba(0, 0, 0, 0.6);
  transition: background-color ease-in 75ms;
  border: 1px solid rgba(255, 255, 255, 0.15);

  .icon {
    font-size: 2.5em;
  }
  .label {
    flex: 1 1 auto;
    font-size: 1.3em;
    font-weight: 400;
    text-align: left;
  }

  // Modify the focus frame radius and offset based on tile corner radius
  @include modify-focus($rad, $f-offset);

  &:focus,
  &:hover {
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.8);
  }
}
</style>
