<template>
  <div class="bng-app" id="container" v-if="slip && slip.stripInfo" >
    <div class="slide">
      <Timeslip :slip="slip" save clear />
      <BngIcon class="clear" :type="icons.trashBin1" @click="clear" />
      <BngIcon class="save" :type="icons.floppyDisk" @click="screenshot" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { lua, useBridge } from '@/bridge';
import { BngIcon, icons } from '@/common/components/base';
import Timeslip from './Timeslip.vue';
import { useLibStore } from '@/services';

const { $game } = useLibStore();

const slip = ref({});

onMounted(() => {
  $game.events.on('onDragRaceTimeslipData', onDragRaceTimeslipData);
});

onUnmounted(() => {
  $game.events.off('onDragRaceTimeslipData', onDragRaceTimeslipData);
});

function onDragRaceTimeslipData(rawData) {
  slip.value = rawData;
  if (rawData){
    console.log(rawData)
    lua.Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Timeslip');
  }
}

const screenshot = function () {
  lua.gameplay_drag_dragBridge.screenshotTimeslip();
};
const clear = function () {
  slip.value = null;
};


</script>

<style scoped lang="scss">

.bng-app {
  background:none !important;
  padding: 0;
}
.slide {
  transform: translateY(-100%);
  animation: slideIn 1.80s linear forwards;
  @keyframes slideIn {
      0% {
          transform: translateY(-100%);
      }
      100% {
          transform: translateY(0);
      }
  }
}

.save {
  position:absolute;
  top: 0.75rem;
  left: 0.75rem;
  opacity: 0.25;
  cursor: pointer;
  z-index: 1;
  color: gray;
}
.clear {
  position:absolute;
  top: 0.75rem;
  right: 0.75rem;
  opacity: 0.25;
  cursor: pointer;
  z-index: 1;
  color: gray;
}


</style>