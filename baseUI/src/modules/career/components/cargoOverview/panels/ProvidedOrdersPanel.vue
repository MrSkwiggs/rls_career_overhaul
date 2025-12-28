<template>
  <div class="fill-panel">
    <template v-if="!cargoOverviewStore.cargoData">
      No data yet...
    </template>
    <template v-else-if="cargoOverviewStore.cargoData.cardsById">

      <!-- <div class="groupGrid-row">
        <template v-if="ignoreFilter && !groupSets[groupIdx].hideTotalStorage" v-for="group in groupSets['totalStorages'].groups">
          <CardGroup class="group" v-if="group.meta.totalCargoSlots > 0" :meta="group.meta"></CardGroup>
        </template>
      </div> -->

      <div class="groupGrid">
        <template v-for="group in sortedGroups" :key="group.label">
          <CardGroup :label="group.label" v-if="(group.cardIdsUnsorted.length > 0 || group.showEmpty) && (group.filterTags[cargoOverviewStore.selectedFilter.value] || group.ignoreFilter || ignoreFilter)" :meta="group.meta">
            <template v-for="cardId in getSortedCardIds(group)" :key="cardId">
              <CargoCard
                v-if="cargoOverviewStore.cargoData.cardsById[cardId].filterTags[cargoOverviewStore.selectedFilter.value] || group.ignoreFilter || ignoreFilter"
                :card="cargoOverviewStore.cargoData.cardsById[cardId]"
                @click.stop="cargoOverviewStore.onCargoSelected(cargoOverviewStore.cargoData.cardsById[cardId])"
                @mouseover="cargoOverviewStore.onCargoHovered(cargoOverviewStore.cargoData.cardsById[cardId])"
                @mouseleave="cargoOverviewStore.onCargoHovered()"
                :hideProps="groupSets[groupIdx].hideProps"
                :hideModsAndTimer="groupSets[groupIdx].hideModsAndTimer"
              />
            </template>
          </CardGroup>
        </template>
      </div>
    </template>
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import { useCargoOverviewStore } from "../../../stores/cargoOverviewStore";
import { vBngClick, vBngSoundClass } from "@/common/directives";

import CargoCard from "../CargoCard.vue";
import CardGroup from "../CardGroup.vue";

// const emit = defineEmits(["cardHovered", "cardClicked"]);

const cargoOverviewStore = useCargoOverviewStore();

const props = defineProps({
  groupSets: Object,
  groupIdx: [Number, String],
  sortingSets: Object,
  sortIdx: [Number, String],
  sortAsc: { type: Boolean, default: true },
  ignoreFilter: Boolean,
});

const cardHovered = (card) => emit("cardHovered", card);
const cardClicked = (card) => emit("cardClicked", card);

const selectedGroup = computed(() => {
  return props.groupSets && props.groupSets[props.groupIdx] && props.groupSets[props.groupIdx].groups
    ? props.groupSets[props.groupIdx].groups
    : [];
});

const sortedGroups = computed(() => {
  let groupSet = props.groupSets[props.groupIdx];
  if (!cargoOverviewStore.cargoData || !cargoOverviewStore.cargoData.cardsById || !groupSet.groups || !groupSet.groups.length) {
    return [];
  }

  const groups = groupSet.groups;
  const sortKey = props.sortingSets[props.sortIdx].key;

  // Helper function to get the highest sort value from the displayed cards in a group
  function getHighestSortValue(group) {
    let maxSortValue = -Infinity;
    if (!(group.cardIdsUnsorted && group.cardIdsUnsorted.length)) {
      return maxSortValue;
    }
    // Loop through each card in the group
    group.cardIdsUnsorted.forEach(cardId => {
      const card = cargoOverviewStore.cargoData.cardsById[cardId];
      const isCardDisplayed = card.filterTags[cargoOverviewStore.selectedFilter.value] || group.ignoreFilter || props.ignoreFilter;

      if (isCardDisplayed) {
        const sortValue = card.sortValues && card.sortValues[sortKey] !== undefined ? card.sortValues[sortKey] : Infinity;
        if (sortValue > maxSortValue) {
          maxSortValue = sortValue;
        }
      }
    });

    return maxSortValue;
  }

  // Sort groups by the lowest sort value from the displayed cards
  groups.sort((a, b) => {
    const minValueA = getHighestSortValue(a);
    const minValueB = getHighestSortValue(b);
    return props.sortAsc ? minValueA - minValueB : minValueB - minValueA;
  });

  return groups;
});


const getSortedCardIds = (group) => {
  if (!cargoOverviewStore.cargoData || !cargoOverviewStore.cargoData.cardsById || !group.cardIdsUnsorted) {
    return [];
  }

  const cardsById = cargoOverviewStore.cargoData.cardsById;
  const sortKey = props.sortingSets[props.sortIdx].key;

  return !(group.cardIdsUnsorted && group.cardIdsUnsorted.length) ? [] : group.cardIdsUnsorted.slice().sort((a, b) => {
    const cardA = cardsById[a];
    const cardB = cardsById[b];
    const valueA = cardA && cardA.sortValues && cardA.sortValues[sortKey] !== undefined ? cardA.sortValues[sortKey] : 0;
    const valueB = cardB && cardB.sortValues && cardB.sortValues[sortKey] !== undefined ? cardB.sortValues[sortKey] : 0;
    return props.sortAsc ? valueA - valueB : valueB - valueA;
  });
};
</script>



<style scoped lang="scss">
@use "@/styles/modules/density" as *;
.heading-wrapper {
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  flex: 0 0 auto;
  padding: 0.5rem 0.5rem 0.5rem 0;
  align-items: center;

  .cardHeading {
    flex: 1 0 auto;
    margin: 0;
    color:white;
  }

  .buttons-container {
    display: flex;
    flex: 0 0.5 auto;
    flex-flow: row nowrap;
    align-items: stretch;
  }
}

.groupGrid {
  display: grid;
  overflow-y:hidden;
  gap: 0.5rem;
  padding: 0 0.5rem;
}

.groupGrid-row {
  display: grid;
  gap: 0.75rem;

  grid-template-columns: repeat(auto-fill, minmax(10em, 5fr));;
  overflow-y:hidden;
  .group {
    columns: 1;
  }
}

</style>
