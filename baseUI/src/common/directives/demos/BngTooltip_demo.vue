<!-- BNGTooltip Directive Demo -->
<template>
  <div class="tooltip-directive-demo">
    <h1>Tooltip Demo</h1>
    <h3>Disabled BngBngButton don't work because of pointer events set to none. Please use BngTooltip component instead.</h3>
    <div class="tooltip-items">
      <div style="display: flex">
        <div v-bng-tooltip="'disabled tooltip'" style="width: max-content; height: fit-content">
          <BngButton disabled>disabled</BngButton>
        </div>
        <div style="width: 50%">needs to be wrapped in a non-disabled element because disabled elements don't respond to <code>pointer-events</code></div>
      </div>
      <BngButton v-bng-tooltip:left="'left tooltip'" tabindex="0">left</BngButton>
      <BngButton v-bng-tooltip:top="'BngButton tooltip'" tabindex="0">top</BngButton>
      <BngButton v-bng-tooltip:bottom="'bottom tooltip'" tabindex="0">bottom</BngButton>
      <BngButton v-bng-tooltip:right="'right tooltip'" tabindex="0">right</BngButton>
      <BngButton v-bng-tooltip:right="{ text: 'width delay tooltip', hideDelay: 500 }" tabindex="0">with delay</BngButton>
      <BngButton v-bng-tooltip:right="reactiveValue">reactive</BngButton>
      <BngButton v-bng-tooltip="toggleValue" @click="toggle">toggle</BngButton>
      <BngButton v-bng-tooltip="changeText" @click="changeValue">change text</BngButton>

      <div
        v-bng-tooltip:top="{
          text: 'Use if the binding does the opposite than it should.[br][br]For example, when lifting the throttle pedal accelerates the car, or when turning left moves the car to the right.',
          style: {
            'max-width': '16em',
            'background-color': 'red',
          },
          isBBCode: true,
        }">
        Tooltip with custom/passthrough styles
      </div>

      <div>
        <span v-bng-tooltip="{ text: bbCodeExample, isBBCode: true }">BBCode in tooltip</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
import { vBngTooltip } from "@/common/directives"
import { BngButton } from "@/common/components/base"

const bbCodeExample = "[url=https://go.beamng.com/vr]VR documentation available here[/url]"

const sides = ["top", "left", "bottom", "right"]
const currSide = ref(0)
const side = computed(() => sides[currSide.value])
const changeSide = () => {
  currSide.value = currSide.value < sides.length - 1 ? currSide.value + 1 : 0
  console.log("currSide", currSide.value)
}

const reactiveValue = ref(null)
const toggleValue = ref("click to set to empty")

onMounted(() => {
  setTimeout(() => {
    reactiveValue.value = "test here"
  }, 3000)
})

const toggle = () => (toggleValue.value = toggleValue.value ? undefined : "click to set to empty")
const changeText = ref("original text")
let isChangeText = false

const changeValue = () => {
  isChangeText = !isChangeText

  if (isChangeText) {
    changeText.value = "new text"
  } else {
    changeText.value = "original text"
  }

}
</script>

<style scoped lang="scss">
.tooltip-directive-demo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.test-div {
  background: grey;
}
</style>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./BngTooltip_demo.vue?raw"
export default {
  source,
  title: "TODO - Friendly name",
  description: `TODO - Description of directive`,
  propInfo: [],
  attrInfo: [],
}
</script>
