<template>
  <div v-if="testInProgress" class="certification-test-in-progress">
    <BngCard class="certification-card">
      <div class="certification-content">
        <div>
          <div class="certificationTestText" :class="{ 'cancelling': cancellingTest }">{{ assessmentProgressMessage }}</div>
        </div>
        <div class="certification-icon">
          <BngIcon :type="icons.timeUnlockOutline" />
        </div>
      </div>
      <div class="cancelButton">
        <BngButton
          :accent="ACCENTS.RED"
          @click="cancelTest"
          v-bng-on-ui-nav:back,menu.asMouse
          tabindex="0"
        >
          Cancel Test
        </BngButton>
      </div>
    </BngCard>
  </div>
  <div v-else>
    <ComputerWrapper ref="wrapper" :path="['Performance Index']" :title="title" back @back="close">
      <VehiclePerformanceTile
        :vehicle-data="vehicleData"
      />
    </ComputerWrapper>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, onMounted } from "vue"
import ComputerWrapper from "./ComputerWrapper.vue"
import { vBngOnUiNav, vBngBlur } from "@/common/directives"
import { BngCard, BngIcon, BngButton, icons, ACCENTS } from "@/common/components/base"
import { lua } from "@/bridge"
import VehiclePerformanceTile from "../components/vehiclePerformance/VehiclePerformanceTile.vue"
import { useLibStore } from "@/services"
import { useRouter } from "vue-router"

const router = useRouter()

const vehicleData = ref({})
const assessmentProgressMessage = ref('Performance Assessment in progress...')
const cancellingTest = ref(false)
const testInProgress = ref(false)

const { $game } = useLibStore()

const title = computed(() => vehicleData.value.niceName ? "Performance Index: " + vehicleData.value.niceName : "Performance Index")

const props = defineProps({
  inventoryId: String
})

const DISPLAYED_VEHICLE_DATA_KEYS = [
  'time_60',
  'time_330',
  'time_1000',
  'time_1_8',
  'velAt_1_8',
  'time_1_4',
  'velAt_1_4',
  'time_0_60',
  'weight',
  'power',
  'torque',
]

$game.events.on('PerformanceTestMessage', (data) => {
  assessmentProgressMessage.value = data.message
  cancellingTest.value = true
})

$game.events.on('PerformanceTestStarted', (data) => {
  testInProgress.value = data.testInProgress
  getVehicleData()
})

const close = () => {
  router.back()
}

const kill = () => {
  $game.events.off('PerformanceTestMessage')
  $game.events.off('PerformanceTestStarted')
}

const getVehicleData = () => {
  lua.career_modules_inventory.getVehicleUiData(Number(props.inventoryId)).then(data => {
    vehicleData.value = data
  })
}

const start = () => {
  getVehicleData()
}

const cancelTest = () => {
  lua.career_modules_vehiclePerformance.cancelTest()
}

onUnmounted(kill)
onMounted(start)
</script>

<style scoped lang="scss">
.certification-test-in-progress {
  padding: 1em;
  width: 20%;
  height: 20%;
}

.certification-card {
  background-color: var(--bng-black-8);
}

.certification-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.certification-icon {
  font-size: 5rem;
  color: white;
}

.certificationTestText {
  padding: 1em;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;

  &.cancelling {
    color: var(--bng-add-red-400);
    animation: pulse 1.5s infinite;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.cancelButton {
  text-align: center;
  margin: 0 auto;
}


</style>
