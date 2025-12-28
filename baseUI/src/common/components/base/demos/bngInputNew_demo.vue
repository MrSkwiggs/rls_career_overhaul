<template>
  <div class="input-demo-container">
    <div class="input-entry">
      <h1>Default Input</h1>
      <BngInput v-model="textValue" type="text" />
    </div>
    <div class="input-entry">
      <h1>Number Input</h1>
      <BngInput v-model="numberValue" type="number" />
      <h2>Min, Max, Step</h2>
      <BngInput v-model="numberValue" type="number" :min="-10" :max="10" :step="0.5" label="Min -10, Max 10, Step 0.5" />
      <h2>Custom Step Icon</h2>
      <BngInput
        v-model="numberValue"
        no-step-bindings
        type="number"
        :step-icon-type="STEP_ICON_TYPES.plusMinus"
        :min="-10"
        :max="10"
        :step="0.5"
        label="Min -10, Max 10, Step 0.5" />
    </div>
    <div class="input-entry">
      <h1>Labels</h1>
      <BngInput value="Input with external label" label="External Label(default)" />
      <br />
      <BngInput value="Input with floating label" label="Floating Label" floating-label />
    </div>
    <div class="input-entry">
      <h1>Extras</h1>
      <BngInput prefix="Prefix" suffix="Suffix" :trailing-icon="icons.beamXPLo" :leading-icon="icons.beamXPFull" value="Extras" />
    </div>
    <div class="input-entry">
      <h1>Max Length</h1>
      <div style="width: 50%">
        <BngInput v-model="maxLengthValue" prefix="Prefix" suffix="Suffix" :trailing-icon="icons.beamXPLo" :leading-icon="icons.beamXPFull" :max-length="10" />
      </div>
      <br />
      <p>Max length is large will not overflow the container</p>
      <BngInput prefix="Prefix" suffix="Suffix" :trailing-icon="icons.beamXPLo" :leading-icon="icons.beamXPFull" :max-length="1000" />
    </div>
    <div class="input-entry">
      <h1>Read only</h1>
      <BngInput value="123" type="number" readonly />
    </div>
    <div class="input-entry demo-1">
      <BngInput ref="iptChanged" v-model="defaultValue" label="Mark Clean Demo" prefix="Prefix" suffix="Suffix" :trailing-icon="icons.bus"> </BngInput>
      <span v-if="iptChanged">Value is {{ iptChanged.dirty ? "dirty" : "the same" }}</span>
      <BngButton v-if="iptChanged && iptChanged.dirty" @click="iptChanged.markClean()">Mark clean</BngButton>
    </div>
    <div class="input-entry">
      <h1>Validation</h1>
      <BngInput prefix="Prefix" suffix="Suffix" label="Type 'error'" floating-label error-message="Invalid Text" :validate="validate"></BngInput>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from "vue"
import { BngButton, BngInputNew as BngInput, STEP_ICON_TYPES, icons } from "@/common/components/base"

const textValue = ref("test1")
const numberValue = ref(0)
const basicValue = ref(0)
const defaultValue = ref("test1")
const maxLengthValue = ref("test1")

const iptChanged = ref()

const stopBasicValueWatcher = watch(
  () => basicValue.value,
  () => console.log("basic value", basicValue.value)
)

const stopValueWatcher = watch(
  () => defaultValue.value,
  () => {
    console.log("default value", defaultValue.value)
  }
)

const onDefaultValueChanged = val => console.log("onDefaultValueChanged", val)

const validate = val => {
  if (val && val.length > 0 && val.includes("error")) {
    return false
  }
  return true
}

onUnmounted(() => {
  stopValueWatcher()
  stopBasicValueWatcher()
})
</script>

<style scoped lang="scss">
.demo-1 {
  width: 70%;
}
.input-demo-container {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}

.input-entry {
  margin-top: 1em;
}
</style>
