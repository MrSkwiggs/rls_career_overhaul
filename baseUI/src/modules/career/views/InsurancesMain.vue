<template>
  <ComputerWrapper ref="wrapper" :path="['Insurance']" title="Insurance" back @back="close">
    <BngCard class="insurances-card blue-background">
      <template v-if="!selectedInsuranceClassId">
        <div class="cards-wrapper blue-background">
          <div class="insurance-tiers-wrapper">
            <div class="insurance-tier-card" v-for="{ classId, classData } in sortedInsuranceClasses" :key="classId" @click="selectInsuranceClass(classId)">
              <BngIcon class="insurance-icon" :type="icons[classData.icon]" />
              <div class="insurance-tier-card-name">
                {{ classData.name }}
              </div>
              <div class="insurance-tier-card-description">
                {{ classData.description }}
              </div>
              <div class="insurance-tier-card-cars-insured">
                {{ classData.carsInsured }} VEHICLES INSURED
              </div>
            </div>
          </div>

          <div class="no-insurance-card" @click="openUninsuredVehicles">
            <div class="left-no-insurance">
              <BngIcon class="no-insurance-icon" :type="icons.checkmark" />
              <div class="no-insurance-text-wrapper">
                <div class="no-insurance-title">
                  {{ insurancesStore.uninsuredVehsData.title }}
                </div>
                <div class="no-insurance-description">
                  {{ insurancesStore.uninsuredVehsData.description }}
                </div>
              </div>
            </div>
            <div class="uninsured-count">
              {{ insurancesStore.uninsuredVehsData.carsUninsuredCount }} vehicles
            </div>
          </div>
        </div>
      </template>


      <template v-if="selectedInsuranceClassId">
        <div class="small-insurance-cards-wrapper blue-background">
          <SmallInsuranceCard v-for="insurance in insurancesStore.plClassesData[selectedInsuranceClassId].insurances" :key="insurance.id" :insuranceData="insurance" :driverScoreData="insurancesStore.driverScoreData" />
        </div>
      </template>
    </BngCard>
  </ComputerWrapper>
</template>

<script setup>
import { lua } from "@/bridge"
import { onBeforeMount, onUnmounted, computed, ref } from "vue"
import ComputerWrapper from "./ComputerWrapper.vue"
import { useInsurancesStore } from "../stores/insurancesStore"
import { BngCard, BngIcon, icons, BngUnit, BngButton } from "@/common/components/base"
import { useComputerStore } from "../stores/computerStore"
import { SmallInsuranceCard, UninsuredVehicles } from "../components"
import { addPopup } from "@/services/popup"


const computerStore = useComputerStore()
const insurancesStore = useInsurancesStore()
const selectedInsuranceClassId = ref(null)

const selectInsuranceClass = (classId) => {
  selectedInsuranceClassId.value = classId
}

const sortedInsuranceClasses = computed(() => {
  const classes = insurancesStore.plClassesData
  if (!classes) return []

  return Object.entries(classes)
    .map(([classId, classData]) => ({ classId, classData }))
    .sort((a, b) => a.classData.priority - b.classData.priority)
})

const start = () => {
  insurancesStore.requestInitialData()
}

const kill = () => {
  lua.extensions.hook("onExitInsurancesComputerScreen")
  //insuranceStore.partInventoryClosed()
  insurancesStore.$dispose()
}

onBeforeMount(start)
onUnmounted(kill)

const close = () => {
  if (selectedInsuranceClassId.value) {
    selectedInsuranceClassId.value = null
  } else {
    insurancesStore.closeMenu()
  }
}

const openUninsuredVehicles = () => {
  addPopup(UninsuredVehicles, { uninsuredData: insurancesStore.uninsuredVehsData })
}
</script>

<style scoped lang="scss">
.insurances-card {
  overflow-y: auto;
  color: white;
  max-height: 100%;
  height: fit-content;
  padding: 1rem;
  max-width: 90vw;
  width: fit-content;
}

.blue-background{
  background-color: var(--blue-shade-100);
}

.small-insurance-cards-wrapper{
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 1.2rem;
  overflow-x: auto;
  overflow-y: hidden;
  max-height: 100%;
}

.insurance-tier-card{
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  border-radius: var(--bng-corners-3);
  align-items: center;
  border: 3px solid var(--bng-ter-blue-gray-500);
  padding: 3rem 0.5rem;
  background: linear-gradient(135deg, var(--bng-cool-gray-800) 0%, var(--bng-add-blue-900) 100%);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 20rem;

  &:hover {
    background: linear-gradient(135deg, var(--bng-cool-gray-700) 0%, var(--bng-add-blue-800) 100%);
    border-color: rgba(255, 255, 255, 0.7);
  }
}
.cards-wrapper{
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  max-height: 100%;
  overflow: hidden;
}
.savings{
  font-size: 2rem;
  font-weight: 800;
}
.premium-rate{
  margin-top: 1.25rem;

  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  justify-content: center;
  align-items: center;

  border-radius: var(--bng-corners-3);
  border: 1px solid var(--bng-cool-gray-700);
  width: 100%;
  padding: 0.625rem 1.25rem;

}

.driver-score-wrapper{
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, var(--bng-cool-gray-800) 0%, var(--bng-add-blue-900) 100%);

  border: 1px solid var(--bng-cool-gray-700);
  border-radius: var(--bng-corners-3);
  padding: 0.625rem 0.625rem;
  width:fit-content;
  align-self: center;
}
.driver-score-title{
  font-size: 1.2rem;
  font-weight: 300;
}
.driver-score-value{
  font-size: 2rem;
  font-weight: 800;
}
.driver-score-tier-risk{
  font-size: 1rem;
  font-weight: 300;
  text-align: center;
  opacity: 0.8;
}

.no-insurance-text-wrapper{
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  justify-content: center;
  align-items: flex-start;
}

.no-insurance-icon{
  font-size: 4rem;
}

.no-insurance-title{
  font-size: 2rem;
  font-weight: 800;
  text-align: left;
}

.left-no-insurance{
  display: flex;
  flex-direction: row;
  gap: 1.25rem;
  align-items: center;
}

.no-insurance-card{
  display: flex;
  flex-direction: row;
  gap: 1.2rem;
  height: 8rem;
  padding: 0.5rem 1.2rem;
  justify-content: space-between;
  align-items: center;

  background-color: var(--bng-add-red-800);
  border: 3px solid var(--bng-add-red-500);
  border-radius: var(--bng-corners-3);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--bng-add-red-700);
    border-color: var(--bng-add-red-400);
  }
}

.uninsured-count{
  display: flex;
  font-size: 1.2rem;
  font-weight: 300;
  justify-content: flex-end;
  align-items: center;
  opacity: 0.8;
}

.no-insurance-description{
  font-size: 1.2rem;
  font-weight: 300;
  text-align: left;
  opacity: 0.8;
}

.insurance-tiers-wrapper{
  display: flex;
  flex-direction: row;
  gap: 1.2rem;
  overflow: hidden;
}
.insurance-icon{
  font-size: 4rem;
}
.insurance-tier-card-name{
  font-size: 2.3rem;
  font-weight: 800;
}

.insurance-tier-card-description{
  font-size: 1.1rem;
  opacity: 0.8;
  text-align: center;
}

.insurance-tier-card-cars-insured{
  width: 80%;
  font-weight: 800;
  font-size: 1.2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.5);
  margin-top: 1.2rem;
  padding-top: 0.5rem;
  text-align: center;
}

.innerList {
  height: 100%;
}

.status {
  position: absolute;
  top: 0;
  right: 0;
  color: white;
  background-color: rgba(0, 0, 0, 0.7);
  & :deep(.card-cnt) {
    background-color: rgba(0, 0, 0, 0.7);
  }
}
</style>
