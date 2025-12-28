<template>
  <InfoCard :header="panel.header"  header-type="ribbon" :no-blur="true">
    <template #content>
      <div class="slip-container">
        <Timeslip :slip="panel.timeslip" />
        <BngIcon class="save" :type="icons.floppyDisk" @click="screenshot" />
      </div>
    </template>
 </InfoCard>
</template>

<script setup>
import { $translate } from "@/services"
import { lua, useBridge } from "@/bridge"
import { ref, reactive } from 'vue'
import InfoCard from "../components/InfoCard.vue"
import { useLibStore } from '@/services'
import Timeslip from '@/modules/apps/dragRace/Timeslip.vue';
import { BngIcon, icons } from '@/common/components/base';
const { $game } = useLibStore()
const { units } = useBridge()

// state
const props = defineProps({
  panel: {
    type: Object,
    required: true,
  }
})

const screenshot = function () {
  lua.gameplay_drag_dragBridge.screenshotTimeslip();
};


import { onMounted, onBeforeUnmount } from 'vue';
onMounted(() => {
  console.log(props.panel)
})

</script>

<style scoped lang="scss">
  .setting-item {
    display: flex;
    align-items:center;
    .setting-item-label {
      flex: 1 0 auto;
      font-weight: 500;
      padding-left: 0.45rem;
    }
  .input {
    flex: 0 1 10rem;
  }
}

  .timeslip-card {
    font-weight: bold;
    padding: 0.2rem 0.5rem  !important;
    height: auto;
    width: 100%;
    display: flex;
    flex-flow:column;

    .slip-header {
      padding: 0.5rem 0 ;
      display: flex;
      flex-flow:column;
      align-items: center;
      width: 100%;
      text-align:center;
    }

    .table-wrapper {
      padding: 0.5rem 0 ;
      .slip-grid {
        flex: 1 1 auto;
        :deep(.col-heading),
        :deep(.property) {
          justify-self: right;
        }
        :deep(.first-column) {
          justify-self: left;
        }
    }
  }

  .custom-table td {
  }

  .left-align {
    text-align: left;
    white-space:nowrap;
    width: 1%;
  }

  .right-align {
    text-align: right;
    width: 50%;
  }

  .header {
    display: flex;
    flex-flow:column;
    align-items: center;
    width: 100%;
    padding: 0.5rem 1rem;
    text-align:center;
  }

  .racer {
    padding: 0.5rem 0 ;
    display: flex;
    flex-flow:column;
    width: 100%;
    .header-racer {
      display:flex;
      flex-flow: row;
      .left {
        flex: 1 1  auto;
      }
      .right {
        flex: 0 0 auto;
      }
    }
    .name {
      flex: 1 1 auto;
      text-align: justify;
      display: flex;
      flex-flow:column;
    }
  }
 }
.slip-container {
  position: relative;
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
