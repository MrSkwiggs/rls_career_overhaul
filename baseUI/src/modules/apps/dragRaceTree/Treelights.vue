<template>
  <div v-if="isStaging.valueOf != false">
    <div class="lights-container">
      <!-- Combined stage light circle -->
      <div class="circles-wrapper">
        <div class="light-circle black"
            :class="{
              'blue': stageLights[0].globalLights.blueLight,
              'red': stageLights[0].countDownLights.redLight
            }">
            <div class="stage-circle" v-show="!stageLights[0].countDownLights.redLight">
              <div class="stage-top" v-show="stageLights[0].stageLights.prestageLight">
                <svg class="stage-svg" width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>

                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#1024FF" flood-opacity="1"/>
                    </filter>
                  </defs>
                  <g clip-path="url(#clip0_8415_621)">
                    <path filter="url(#glow)" fill-rule="evenodd" clip-rule="evenodd" d="M12.8469 5C11.0858 5 9.37396 5.5811 7.97681 6.65317C6.57966 7.72525 5.57529 9.22838 5.1195 10.9294C4.97655 11.4629 4.42822 11.7795 3.89475 11.6366C3.36128 11.4936 3.0447 10.9453 3.18764 10.4118C3.75739 8.28548 5.01285 6.40656 6.75929 5.06647C8.50573 3.72637 10.6456 3 12.8469 3C15.0482 3 17.1881 3.72637 18.9345 5.06647C20.681 6.40656 21.9364 8.28547 22.5062 10.4118C22.6491 10.9453 22.3325 11.4936 21.7991 11.6366C21.2656 11.7795 20.7173 11.4629 20.5743 10.9294C20.1185 9.22838 19.1141 7.72525 17.717 6.65317C16.3198 5.5811 14.608 5 12.8469 5Z" fill="#DAD9FF"/>
                  </g>
                  <clipPath id="clip0_8415_621">
                    <rect width="26" height="26" fill="white"/>
                  </clipPath>
                </svg>
              </div>
              <div class="stage-middle" v-show="stageLights[0].stageLights.prestageLight && stageLights[0].stageLights.stageLight">
                <svg class="stage-svg" width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#1024FF" flood-opacity="1"/>
                    </filter>
                  </defs>
                  <g id="stage-middle">
                    <path filter="url(#glow)" d="M7 13C7 12.4477 7.44772 12 8 12H18C18.5523 12 19 12.4477 19 13V13C19 13.5523 18.5523 14 18 14H8C7.44772 14 7 13.5523 7 13V13Z" fill="#DAD9FF"/>
                  </g>
                  <clipPath id="clip0_8415_630">
                    <rect width="26" height="26" fill="white"/>
                  </clipPath>
                </svg>
              </div>
              <div class="stage-bottom" v-show="stageLights[0].stageLights.stageLight">
                <svg class="stage-svg" width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#1024FF" flood-opacity="1"/>
                    </filter>
                  </defs>
                  <g clip-path="url(#clip0_8415_634)">
                    <path filter="url(#glow)" fill-rule="evenodd" clip-rule="evenodd" d="M12.8465 21C14.6075 21 16.3194 20.4189 17.7165 19.3468C19.1137 18.2748 20.1181 16.7716 20.5739 15.0706C20.7168 14.5371 21.2651 14.2205 21.7986 14.3634C22.3321 14.5064 22.6487 15.0547 22.5057 15.5882C21.936 17.7145 20.6805 19.5934 18.9341 20.9335C17.1876 22.2736 15.0478 23 12.8465 23C10.6451 23 8.50529 22.2736 6.75884 20.9335C5.0124 19.5934 3.75695 17.7145 3.1872 15.5882C3.04426 15.0547 3.36084 14.5064 3.89431 14.3634C4.42777 14.2205 4.97611 14.5371 5.11905 15.0706C5.57485 16.7716 6.57921 18.2748 7.97637 19.3468C9.37352 20.4189 11.0854 21 12.8465 21Z" fill="#DAD9FF"/>
                  </g>
                  <clipPath id="clip0_8415_634">
                    <rect width="26" height="26" fill="white"/>
                  </clipPath>
                </svg>
              </div>
            </div>
        </div>
      </div>

      <!-- Three amber countdown lights -->
      <div class="circles-wrapper">
        <div class="light-circle black"
          :class="{
            'amber': stageLights[0].countDownLights.amberLight1,
            'red': stageLights[0].countDownLights.redLight
          }">
        </div>
      </div>
      <div class="circles-wrapper">
        <div class="light-circle black"
          :class="{
            'amber': stageLights[0].countDownLights.amberLight2,
            'red': stageLights[0].countDownLights.redLight
          }">
        </div>
      </div>
      <div class="circles-wrapper">
        <div class="light-circle black"
          :class="{
            'amber': stageLights[0].countDownLights.amberLight3,
            'red': stageLights[0].countDownLights.redLight
          }">
        </div>
      </div>

      <!-- Green/Red light -->
      <div class="circles-wrapper">
        <div class="light-circle black go"
          :class="{
            'green': stageLights[0].countDownLights.greenLight,
            'red': stageLights[0].countDownLights.redLight
          }">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useEvents } from '@/services/events'

const events = useEvents()
const isStaging = ref(false);

const stageLights = ref([
  {
    stageLights: {
      prestageLight: false,
      stageLight: false,
    },
    countDownLights: {
      amberLight1: false,
      amberLight2: false,
      amberLight3: false,
      greenLight: false,
      redLight: false
    },
    globalLights: {
      blueLight: false
    }
  }
]);

const updateLights = (changes) => {
  if (changes.stageLights) {
    stageLights.value[0].stageLights = {
      ...stageLights.value[0].stageLights,
      ...changes.stageLights
    };
  }
  if (changes.countDownLights) {
    stageLights.value[0].countDownLights = {
      ...stageLights.value[0].countDownLights,
      ...changes.countDownLights
    }

    // Check if green or red light is turned on
    if (changes.countDownLights.greenLight || changes.countDownLights.redLight) {
      setTimeout(() => {
        isStaging.value = false;
      }, 2000); // 2 seconds delay
    }
  }
};

const updateStaging = (isNearby) => {
  isStaging.value = isNearby;
};

onMounted(() => {
  events.on('updateTreeLightApp', updateLights);
  events.on('updateTreeLightStaging', updateStaging);
});

onUnmounted(() => {
  events.off('updateTreeLightApp', updateLights);
  events.off('updateTreeLightStaging', updateStaging);
});
</script>

<style scoped lang="scss">
.lights-container {
  display: flex;
  flex-direction: row;
  opacity: 0.7;
  .circles-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2%;
    width: 100%;
    position: relative;

    .light-circle {
      width: 100%;
      border-radius: 50%;
      position: relative;
      padding-bottom: 100%;
      padding-left: 100%;
      &.black {
        background: radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.00) 52.5%, rgba(212, 212, 212, 0.06) 63%, rgba(0, 0, 0, 0.00) 100%),
                    radial-gradient(634.62% 634.62% at 50% -321.15%, rgba(0, 0, 0, 0.00) 58.76%, rgba(212, 212, 212, 0.15) 60.06%, rgba(0, 0, 0, 0.00) 71.06%),
                    #000;
        /* Transparent outline to maintain consistent sizing */
        outline: 0.25rem solid transparent;
      }
      &.go {
        /* White outline for consistent sizing */
        outline: 0.25rem solid rgba(0, 0, 0, 0.5);
      }
      &.amber {
        background: radial-gradient(50% 50% at 50% 50%, #EDF09D 0%, #FFF600 100%), linear-gradient(0deg, #EDD100 0%, #EDD100 100%), radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.00) 52.5%, rgba(212, 212, 212, 0.06) 63%, rgba(0, 0, 0, 0.00) 100%), radial-gradient(634.62% 634.62% at 421.15% 50%, rgba(0, 0, 0, 0.00) 58.76%, rgba(212, 212, 212, 0.15) 60.06%, rgba(0, 0, 0, 0.00) 71.06%), #000;
        box-shadow: 0 0 0 0.25rem #D9E000,
                   0 0 0 0.125rem #D9E000 inset,
                   0 0 2rem 0 rgba(246, 255, 0, 0.75);
      }
      @media screen and (max-width: 1024px) {
        &.amber, &.black, &.go, &.red {
          outline-width: 0.125rem;
        }
      }
      &.green {
        background: radial-gradient(50% 50% at 50% 50%, #BF0 0%, rgba(8, 246, 16, 0.00) 100%), #0F1;
        box-shadow: 0 0 0.0.25rem #95FF8B inset,
                    0 0 2rem 0 rgba(13, 255, 0, 0.75);
      }
      &.red {
        background: radial-gradient(50% 50% at 50% 50%, rgba(255, 175, 63, 0.70) 0%, rgba(255, 154, 65, 0.00) 100%), #F00;
        box-shadow: 0 0 0 0.0.25rem #FF5900,
                   0 0 0 0.0625rem #FF5900 inset,
                   0 0 2rem 0 #F00;
      }
      &.blue {
        background: radial-gradient(50% 50% at 50% 50%, #CFD0FF 0%, #0003CC 100%), #000;
        box-shadow: 0 0 0 0.25rem #1217D6 inset,
                   0 0 2rem 0 #1217D6;
      }
    }
  }
}

.stage-circle {
  position: absolute;
  display: flex;
  flex-direction: column;
  z-index: 1;
  left: 0%;
  width: 100%;
  height: 100%;

  .stage-top, .stage-middle, .stage-bottom {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .stage-svg {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
  }
}
</style>