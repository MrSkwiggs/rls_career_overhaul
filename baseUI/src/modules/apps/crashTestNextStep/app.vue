<template>
  <div class="main-container-grid">
    <BngButton v-if="showButton"
    @click="handleNextStep"
    :accent="ACCENTS.text"
    :icon="icons.arrowSolidRight"
    :class="{ 'next-step-button': true }"
    >
      {{ $translate.instant('missions.crashTest.general.nextStep') }}
    </BngButton>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { BngIcon, icons, BngButton, ACCENTS } from "@/common/components/base"
import { useLibStore } from '@/services'
import { useEvents } from '@/services/events'
import { $translate } from "@/services/translation"
import { useBridge } from "@/bridge"


const { lua } = useBridge()
const events = useEvents()

const showButton = ref(false)

const handleNextStep = () => {
  lua.gameplay_crashTest_scenarioManager.nextStepFromUI()
  showButton.value = false
}

onMounted(() => {
  events.on('onCrashTestStepFinished', () => {
    console.log('onCrashTestStepFinished')
    showButton.value = true
  })
})

onUnmounted(() => {
  events.off('onCrashTestStepFinished');
});

</script>

<style scoped lang="scss">
.main-container-grid {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.arrow-icon {
  font-size: 48px;
}

@keyframes glowingSwipe {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes popIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  70% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.next-step-button {
  font-family: 'Overpass', var(--fnt-defs);
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(255, 140, 0, 0.3) 25%,
    rgba(255, 140, 0, 0.5) 50%,
    rgba(255, 140, 0, 0.3) 75%,
    rgba(0, 0, 0, 0.7) 100%
  );
  background-size: 200% 100%;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.5rem;
  cursor: pointer;
  animation: glowingSwipe 3s linear infinite, popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.3);

  &:hover {
    animation: glowingSwipe 2s linear infinite;
    box-shadow: 0 0 20px rgba(255, 140, 0, 0.5);
  }
}
</style>