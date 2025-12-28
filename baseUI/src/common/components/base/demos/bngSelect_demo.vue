<template>
  <div>
    <div class="demo-entry">
      <span>Basic usage.</span>
      <BngSelect mute :options="[1, 2, 3]" @change="demo" />
    </div>
    <div class="demo-entry">
      <span>Config to specifythe label and value properties.</span>
      <BngSelect
        v-model="entry2Value"
        @change="demo"
        :options="[
          ['Yes', true],
          ['No', false],
        ]"
        :config="{
          label: ([label]) => label,
          value: ([, value]) => value,
        }" />
    </div>
    <div class="demo-entry">
      <span>Looping through the values.</span>
      <BngSelect
        @change="demo"
        loop
        value="LOOPING"
        :options="[
          { l: 'this', v: 'THIS' },
          { l: 'is', v: 'IS' },
          { l: 'looping', v: 'LOOPING' },
        ]"
        :config="{
          label: x => x.l,
          value: x => x.v,
        }" />
    </div>
    <div class="demo-entry">
      <span>Custom label and buttons</span>
      <BngSelect
        v-model="entry4Value"
        :options="[
          { label: 'One', value: 1 },
          { label: 'Two', value: 2 },
          { label: 'Three', value: 3 },
        ]"
        :config="{
          label: x => x.label,
          value: x => x.value,
        }"
        @change="demo">
        <template #display="{ label, value }">
          <BngPropVal :keyLabel="label" :valueLabel="value"></BngPropVal>
        </template>
        <template #previousButton="{ click, disabled }">
          <BngButton bng-no-nav="true" :icon="icons.arrowSolidLeft" :disabled="disabled" @click="click" />
        </template>
        <template #nextButton="{ click, disabled }">
          <BngButton bng-no-nav="true" :icon="icons.arrowSolidRight" :disabled="disabled" @click="click" />
        </template>
      </BngSelect>
    </div>
    <div class="demo-entry">
      <span>Disabled</span>
      <BngSelect v-model="entry5Value" :options="[1, 2, 3]" disabled />
    </div>
    Value emitted out of component: {{ eventValue }}
    <br />
    Label emitted out of component: {{ eventLabel }}
  </div>
</template>

<script setup>
import { BngSelect, BngButton, BngPropVal, icons } from "@/common/components/base"
import { ref } from "vue"

const eventValue = ref(false)
const eventLabel = ref("")
const entry2Value = ref(false)
const entry4Value = ref(2)
const entry5Value = ref(3)

function demo(value, label) {
  eventValue.value = value
  eventLabel.value = label
}
</script>

<style lang="scss" scoped>
.demo-entry {
  width: 30em;
  max-width: 100%;
  margin-bottom: 1em;

  > span {
    font-size: 1.15em;
    font-weight: 600;
  }
}
</style>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./bngSelect_demo.vue?raw"
export default {
  source,
  title: "Select from a list",
  description: `Simple selector to allow selection of a value from a predefined list of options`,
  propInfo: [
    {
      name: "value",
      type: "Any",
      desc: "Get or set current 'value' of the list",
    },
    {
      name: "options",
      type: "Array",
      desc: "Array of options for the list. Can be an array of anything",
    },
    {
      name: "disable",
      type: "Boolean",
      desc: "Flag to disable the select list",
    },
    {
      name: "loop",
      type: "Boolean",
      desc: "Flag to enable/disable list looping behaviour",
    },
    {
      name: "config",
      type: "Object",
      desc: "Object with two methods: `label` and `value` - for transforming an 'option' into its corresponding 'label' and 'value'. Defaults to: `{ label: opt => opt, value: opt => opt}`",
    },
  ],
  attrInfo: [],
}
</script>
