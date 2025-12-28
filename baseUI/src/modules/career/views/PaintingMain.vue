<template>
  <ComputerWrapper :path="['Painting']" title="Painting" back @back="close">
    <!-- tood: why is this not using the Shopping cart component?-->
    <Painting ref="elPainting" no-header />
  </ComputerWrapper>
</template>

<script setup>
import { ref } from "vue"
import { BngCard } from "@/common/components/base"
import ComputerWrapper from "./ComputerWrapper.vue"
import Painting from "../components/painting/Painting.vue"
import { useComputerStore } from "../stores/computerStore"

const computerStore = useComputerStore()

const elPainting = ref()

const close = () => elPainting.value.close()
</script>

<style scoped lang="scss">
</style>
