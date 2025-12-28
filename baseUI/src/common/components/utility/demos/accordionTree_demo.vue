<template>
  <BngSwitch v-model="itemClass">Styling example</BngSwitch>
  <BngSwitch v-model="multi">Multiselect</BngSwitch>

  <div class="accrow">
    <div>
      <h3>AccordionTree</h3>
      <AccordionTree
        :class="{ 'alt-style': itemClass }"
        :data="data"
        data-field="items"
        __content-field="content"
        selected-field="selected"
        :selectable="{ multi }"
      >
        <template #caption="{ entry }">
          {{ entry.caption }}
        </template>
        <template #controls="{ entry }">
          {{ "items" in entry ? "dir" : "item" }}
        </template>
        <template #default="{ entry }">
          {{ entry.content }}
        </template>
      </AccordionTree>
    </div>
    <div>
      <h3>Data</h3>
      <textarea readonly>{{ JSON.stringify(data, null, 2) }}</textarea>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { AccordionTree } from "@/common/components/utility"
import { BngSwitch } from "@/common/components/base"

const itemClass = ref(false)
const multi = ref(true)

const data = ref({})

function genItems(lvl = -1) {
  const items = []
  const nested = lvl > -1
  for (let i = 1; i <= (nested ? 5 : 10); i++) {
    // const isExpanded = [2, 5, 7].includes(i)
    const item = {
      caption: `Item ${i}`,
      content: `Content for the item ${i}`,
      selected: false,
      // selected: Math.random() > 0.7,
      // expanded: isExpanded,
      // disabled: false,
    }
    ++lvl < 5 && Math.random() > (nested ? 0.2 : 0.3) && (item.items = genItems(lvl))
    items.push(item)
  }
  return items
}

data.value = genItems()
</script>

<style lang="scss" scoped>
.accrow {
  // font-size: 1rem;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  > * {
    flex: 0 0 33%;
    width: 33%;
  }
}
.pre {
  font-family: monospace;
}
textarea {
  width: 100%;
  height: 70vh;
  font-size: 0.8rem;
}

.alt-style :deep(.bng-accitem) {
  /// types:
  // bng-accitem-normal -- not static and not selectable
  // bng-accitem-static
  // bng-accitem-expandable
  // bng-accitem-selectable
  /// states:
  // bng-accitem-expanded
  // bng-accitem-selected
  /// nested elements:
  // bng-accitem-caption
  // > bng-accitem-caption-expander
  // > bng-accitem-caption-content
  // > bng-accitem-caption-controls
  // bng-accitem-content
  > .bng-accitem-caption {
    height: 3em;
    background-color: rgba(120, 120, 120, 0.5);
    border-radius: unset;
    &:hover {
      background-color: rgba(120, 120, 120, 0.65);
    }
  }
  &.bng-accitem-static > .bng-accitem-caption {
    padding-left: 1.75rem;
  }
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./accordionTree_demo.vue?raw"
export default {
  source,
  title: "Tree constructed from Accordions",
  description: "Tree component for hierarchical data. Uses nested [`<Accordion>`](#/components/Accordion) components for displaying nested items",
  propInfo: [
    {
      name: "data",
      type: "Array/Object",
      desc: "The tree data - see example below",
    },
    {
      name: "dataField",
      type: "String",
      desc: "[Required] Name of the field (within each item in `data`) that will hold an array of child items",
    },
    {
      name: "propsField",
      type: "String",
      desc: "Name of the field (within each item in `data`) that will hold an object with props to bind to the item",
    },
    {
      name: "contentField",
      type: "String",
      desc: "Name of the field (within each item in `data`) containing content for the item. May be combined with `items` (they will follow after the content)",
    },
    {
      name: "selectable",
      type: "Boolean/Object",
      desc: "Switch to enable selectability on the tree. Can be boolean or object with selection options, such as `{ multi: true }` to enable multiselect mode. When enabled, items can be expanded only by clicking on arrow",
    },
    {
      name: "selectedField",
      type: "String",
      desc: "Name of the field (within each item in `data`) that will define whether the item is displayed as selected",
    },
    {
      name: "isTreeElement",
      type: "Boolean",
      desc: "For internal use only - do not use",
    },
  ],
  attrInfo: [

  ],
}

</script>
