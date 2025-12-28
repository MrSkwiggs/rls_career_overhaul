<template>
  <div>
    <Treelights />
    <BngFlashMessage v-if="props.showFlash" message-source="DragRaceTreeFlashMessage"/>
  </div>


</template>

<script setup>
import Treelights from './Treelights.vue'
import { BngFlashMessage } from '@/common/components/appsUtilities'

const props = defineProps({
  showFlash: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped lang="scss">

</style>