<template>

</template>
<script setup>
import { ref, computed } from "vue";
import { useCargoOverviewStore } from "../../../stores/cargoOverviewStore";
import { vBngClick, vBngSoundClass } from "@/common/directives";
import { BngButton, BngCard, BngCardHeading, icons } from "@/common/components/base"
import CargoCard from "../CargoCard.vue";
import CardGroup from "../CardGroup.vue";


const cargoOverviewStore = useCargoOverviewStore();

const props = defineProps({
  card: Object,
});

</script>



<style scoped lang="scss">
.cardHeading {
  color:white;
}

</style>
