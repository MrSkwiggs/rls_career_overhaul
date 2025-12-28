<template>
  <BngSwitch v-model="animated">Animated</BngSwitch>
  <BngSwitch v-model="singular">Single expanded item</BngSwitch>
  <BngSwitch v-model="expanded" :disabled="singular">Expand all</BngSwitch>
  <BngSwitch v-model="items[4].disabled">Disable 5th</BngSwitch>
  <BngSwitch v-model="disabled">Disable all</BngSwitch>

  <BngButton @click="addItem()">Add new item</BngButton>
  <BngButton @click="remItem()">Remove last item</BngButton>

  <div class="accrow">
    <div>
      <h3>Example</h3>
      <Accordion :singular="singular" :animated="animated" :expanded="expanded" :disabled="disabled" :selected="true">
        <AccordionItem v-for="(item, idx) of items" :static="item.static" :expanded="item.expanded" :disabled="item.disabled">
          <template #caption>
            {{ item.caption }}
          </template>
          <template #controls>
            <BngButton @click.stop="remItem(idx)">Remove</BngButton>
          </template>
          {{ item.content }}
        </AccordionItem>
      </Accordion>
    </div>
    <div>
      <h3>Basic tree-like structure</h3>
      <Accordion :singular="singular" :animated="animated" :expanded="expanded" :disabled="disabled">
        <AccordionItem v-for="(item, idx) of items" :static="item.static" :expanded="item.expanded" :disabled="item.disabled">
          <template #caption>
            {{ item.caption }}
          </template>
          <template #controls>
            <BngButton @click.stop="remItem(idx)">Remove</BngButton>
          </template>
          <Accordion :singular="singular" :animated="animated">
            <AccordionItem v-for="(item, idx) of items" :static="item.static" :disabled="item.disabled">
              <template #caption>
                {{ item.caption }}
              </template>
              <template #controls>
                <BngButton @click.stop="remItem(idx)">Remove</BngButton>
              </template>
              <Accordion :singular="singular" :animated="animated">
                <AccordionItem v-for="(item, idx) of items" :static="item.static" :disabled="item.disabled">
                  <template #caption>
                    {{ item.caption }}
                  </template>
                  <template #controls>
                    <BngButton @click.stop="remItem(idx)">Remove</BngButton>
                  </template>
                  <Accordion :singular="singular" :animated="animated">
                    <AccordionItem v-for="(item, idx) of items" :static="item.static" :disabled="item.disabled">
                      <template #caption>
                        {{ item.caption }}
                      </template>
                      <template #controls>
                        <BngButton @click.stop="remItem(idx)">Remove</BngButton>
                      </template>
                      {{ item.content }}
                    </AccordionItem>
                  </Accordion>
                </AccordionItem>
              </Accordion>
            </AccordionItem>
          </Accordion>
        </AccordionItem>
      </Accordion>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngSwitch, BngButton } from "@/common/components/base"
import { Accordion, AccordionItem } from "@/common/components/utility"

const singular = ref(false)
const expanded = ref(false)
const disabled = ref(false)
const animated = ref(false)

const items = ref([])

for (let i = 1; i <= 10; i++) {
  const isStatic = [4, 9].includes(i)
  const isExpanded = [2, 5, 7].includes(i)
  items.value.push({
    static: isStatic,
    caption: `Item ${i}`,
    content: `Content for the item ${i}` + (isExpanded ? ", expanded by default" : ""),
    expanded: isExpanded,
    disabled: false,
  })
}

function addItem() {
  items.value.push({
    caption: `Item ${items.value.length + 1}`,
    content: `Content for the item ${items.value.length + 1}`,
  })
}

function remItem(idx = -1) {
  items.value.splice(idx, 1)
}
</script>

<style lang="scss" scoped>
.accrow {
  // font-size: 1rem;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  > * {
    flex: 0 0 49.5%;
    width: 49.5%;
  }
}
:deep(.bng-accitem-caption) {
  .bng-button {
    font-size: 0.9em;
    top: -0.1em;
    margin: -0.2em 0;
    padding-top: 0;
    padding-bottom: 0.2em;
    min-height: unset;
  }
  &:not(:hover) .bng-button {
    display: none;
  }
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./accordion_demo.vue?raw"
export default {
  source,
  title: "Simple accordion",
  description: "Stylised accordion component - much like the HTML `details` and `summary` tag combination. Items in the Accordion should be created using the [`AccordionItem`](#/components/AccordionItem) component, and go into the default slot",
  propInfo: [
    {
      name: "singular",
      type: "Boolean",
      desc: "If set to `true`, only one item can be expanded at any one time",
    },
    {
      name: "expanded",
      type: "Boolean",
      desc: "If set to `true`, all items will be expanded by default. Not compatible with the `singular` prop",
    },
    {
      name: "disabled",
      type: "Boolean",
      desc: "Flag to disable/enable all items in the accordion",
    },
    {
      name: "animated",
      type: "Boolean",
      desc: "Flag to enable/disable animation for expanding/collapsing items",
    },
    {
      name: "selectable",
      type: "Boolean/Object",
      desc: "Set to `true` to enable item selection. By default only a single item can be selected at one time, to enable multi-selection set this prop to `{ multi: true }`",
    },
    {
      name: "selected",
      type: "Boolean",
      desc: "Flag to set all items as initially selected",
    },
    {
      name: "provideParent",
      type: "Boolean",
      desc: "Internal use only - for [`<AccordionTree>`](#/components/AccordionTree)",
    },

  ],
  attrInfo: [

  ],
}

</script>

