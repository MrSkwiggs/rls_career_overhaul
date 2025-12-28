<template>
  <div class="dropdemo">
    <div>
      <h3>Default</h3>
      <BngDropdown v-model="value" :items="itemsMany" @valueChanged="onValueChanged" />
    </div>
    <div>
      <h3>Disabled</h3>
      <BngDropdown v-model="value" :items="items" disabled />
    </div>
    <div>
      <h3>Disabled Items</h3>
      <p>Use the <code>disabled</code> property to disable items. Use the <code>focusable</code> property to make items focusable even when disabled.</p>
      <BngDropdown v-model="value" :items="disabledItems" @valueChanged="onValueChanged" />
    </div>
    <div>
      <h3>With custom text</h3>
      <BngDropdown v-model="value" :items="items" @valueChanged="onValueChanged">
        <template #display v-if="!value || !items.some(itm => itm.value === value)"> Choose an item here </template>
        <template #display v-else> {{ items.find(itm => itm.value === value).label }} selected, great! </template>
      </BngDropdown>
    </div>
    <div>
      <h3>With a highlighter</h3>
      Highlight: <input v-model.trim="highlight" />
      <br />
      <BngDropdown v-model="value" :items="items" :highlight="highlight" @valueChanged="onValueChanged" />
    </div>
    <div>
      <h3>With a search field</h3>
      <BngDropdown v-model="value" :items="itemsMany" :show-search="true" @valueChanged="onValueChanged" />
    </div>
    <div>
      <h3>With Grouping</h3>
      <BngDropdown v-model="value" :items="groupedValues" show-search @valueChanged="onValueChanged" />
    </div>
    <div>
      <h3>With a different long name handling</h3>
      <BngPillCheckbox v-for="(val, name) in longNamesList" v-model="longNamesList[name]" @click="longNames = name">{{ name }}</BngPillCheckbox>
      <BngDropdown class="long-names" v-model="value" :items="itemsLong" :long-names="longNames" @valueChanged="onValueChanged" />
    </div>
    <div>
      <h3>Dropdown container with custom content</h3>
      <BngDropdownContainer>
        <BngList class="inner-list" style="width: 30em">
          <BngImageTile
            v-for="item in sampleList"
            :icon="item.icon"
            :label="item.label"
          />
        </BngList>
      </BngDropdownContainer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from "vue"
import { BngDropdown, BngDropdownContainer, BngPillCheckbox, BngList, BngImageTile, icons } from "@/common/components/base"


const itemsMany = [
  { label: "Item one", value: 1 },
  { label: "Item two", value: 2 },
  { label: "Item three", value: 3 },
  { label: "Item four", value: 4 },
  { label: "Item five", value: 5 },
  { label: "Item six", value: 6 },
  { label: "Item seven", value: 7 },
  { label: "Item eight", value: 8 },
  { label: "Item nine", value: 9 },
  { label: "Item ten", value: 10 },
  { label: "Item eleven", value: 11 },
  { label: "Item twelve", value: 12 },
  { label: "Item thirteen", value: 13 },
  { label: "Item fourteen", value: 14 },
  { label: "Item fifteen", value: 15 },
  { label: "Item sixteen", value: 16 },
  { label: "Item seventeen", value: 17 },
  { label: "Item eighteen", value: 18 },
  { label: "Item nineteen", value: 19 },
  { label: "Item twenty", value: 20 },
]


const disabledItems = [
  { label: "disabled default", value: 21, disabled: true },
  { label: "disabled focusable", value: 22, disabled: true, focusable: true, tooltip: "disabled focusable tooltip" },
]


const groupedValues = [
  { label: "some item a", value: 1 },
  { label: "some group", group: true },
  { label: "some item b", value: 2, grouped: true },
  { label: "some item c", value: 21, grouped: true, disabled: true },
  { label: "some item d", value: 22, grouped: true, disabled: true, focusable: true, tooltip: "disabled focusable tooltip" },
  { label: "some item e", value: 5 },
]

const items = itemsMany.slice(0, 3)

const itemsLong = itemsMany.map(itm => ({ ...itm, label: itm.label + ` (${Array.from({ length: ~~(Math.random() * 10 + 5) }).fill("long")})` }))

const iconNames = Object.keys(icons)
const randomIcon = () => icons[iconNames[~~(Math.random() * iconNames.length)]]

const sampleList = []
for (let i = 1; i <= 10; i++) {
  sampleList.push({
    label: "Object item " + i,
    icon: randomIcon(),
  })
}

const value = ref(null)

const highlight = ref("two")

const onValueChanged = value => {
  console.log("event listener: value changed", value)
}

const stopWatcher = watch(
  () => value.value,
  (current, prev) => {
    console.log("watcher: dropdown value changed", current)
  }
)

const longNames = ref("oneline")
const longNamesList = computed(() => ["oneline", "wrap", "cut"].reduce((r, v) => ({ ...r, [v]: longNames.value === v }), {}))

onUnmounted(() => stopWatcher())
</script>

<style lang="scss" scoped>
.dropdemo {
  display: flex;
  flex-flow: row wrap;
  > * {
    flex: 0 1 30%;
    width: 30%;
    margin: 1em 1%;
  }
}

.inner-list {
  max-height: 100%;
}

.long-names {
  width: 5em;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngDropdown_demo.vue?raw"
export default {
  source,
  title: "Simple Dropdown",
  description: `Dropdown component for displaying a list of options to choose between.\n\nUse the \`display\` slot to override the currently selected item text.`,
  propInfo: [
    {
      name: "modelValue",
      type: "Number/String/Boolean/Object",
      desc: "For `v-model` - shouldn't be used directly",
    },
    {
      name: "items",
      type: "Array",
      desc: "__REQUIRED__ - array of objects representing the dropdown choices. Should be in the form:\n\n`{ label: 'Label text', value: 1, disabled: false (optional), focusable: false (optional), tooltip: 'Tooltip text' (optional) }`",
    },
    {
      name: "showSearch",
      type: "Boolean",
      desc: "Switch to enable a search field in the dropdown",
    },
    {
      name: "highlight",
      type: "String/Array/RegExp",
      desc: "String or array of strings or RegExp to highlight specific items in the dropdown (uses `vBngHighlighter`)",
    },
    {
      name: "disabled",
      type: "Boolean",
      desc: "Switch to disable the dropdown",
    },
    {
      name: "longNames",
      type: "String",
      desc: "How to show overly long names when selected - should be one of:\n\n`oneline` - Display the text all on one line\n\n`wrap` - Wrap the text onto multiple lines\n\n`cut` - Truncate the text to fit the dropdown width",
    },
  ],
  attrInfo: [

  ],
}

</script>
