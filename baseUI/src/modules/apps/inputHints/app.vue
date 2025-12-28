<template>
  <div class="controls-container">

    <BngAppBindingDisplay />

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { BngAppBindingDisplay } from '@/common/components/appsUtilities';
import { useLibStore } from '@/services';
import { getAssetURL } from "@/utils"

const controlsUrl = ('/ui/ui-vue/src/modules/apps/inputHints/controls.png');

const { $game } = useLibStore();
const usePng = ref(true);
</script>

<style scoped lang="scss">
.controls-container {
  height: 100%;
  width: 100%;
}
</style>