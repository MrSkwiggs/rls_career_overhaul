<!-- BNGPanel Directive Demo -->
<template>
  <h2>vBngPanel Directive</h2>

  <div v-bng-on-ui-nav:back="() => {}">
    <div class="topLevel">
      <h3>Top Level Panels</h3>
      <div class="items">
        <div class="buttons">
          <BngButton>Some</BngButton>
          <BngButton>Buttons</BngButton>
          <BngButton>At</BngButton>
          <BngButton>The</BngButton>
          <BngButton>Top</BngButton>
          <BngButton>Level</BngButton>
        </div>
        <div>
          <BngCard v-bng-panel class="demo-card" @panelopen="() => openPanel1(true)" @panelclose="() => openPanel1(false)">
            <BngCardHeading type="ribbon">Card A</BngCardHeading>
            <div class="content">
              <div>
                Should be able to enter and exit this card using <BngBinding ui-event="ok" deviceMask="xinput" /> and
                <BngBinding ui-event="back" deviceMask="xinput" /> respectively.
              </div>
              <div>
                <br />
                <BngInput placeholder="Enter some text" />
              </div>
            </div>
            <template #buttons>
              <BngButton label="Action 1" />
              <BngButton label="Action 2" />
            </template>
          </BngCard>
        </div>
        <div>
          <BngCard v-bng-panel class="demo-card" @panelopen="() => openPanel2(true)" @panelclose="() => openPanel2(false)">
            <BngCardHeading type="ribbon">Card B</BngCardHeading>
            <div class="content">The same should apply with this card.</div>
            <template #buttons>
              <BngButton label="Action 1" />
              <BngButton label="Action 2" />
            </template>
          </BngCard>
        </div>
      </div>
    </div>

    <div class="nested">
      <h3>Nested Panels</h3>
      <div class="items">
        <div class="buttons">
          <BngButton>More</BngButton>
          <BngButton>Buttons</BngButton>
        </div>
        <div>
          <BngCard v-bng-panel class="demo-card wide" @panelopen="() => openPanel1(true)" @panelclose="() => openPanel1(false)">
            <BngCardHeading type="ribbon">Card A</BngCardHeading>
            <div class="content">
              <div>
                <p>Stuff here...</p>
                <BngSwitch>Test</BngSwitch><br />
                <BngSwitch>Test</BngSwitch>
              </div>
              <BngCard v-bng-panel class="sub">
                <div class="j">
                  <h4>Options</h4>
                  <div>
                    <label>Position:</label>
                    <BngPillFilters
                      v-model="pos"
                      class="filter"
                      ref="selectOneFilters"
                      required
                      :options="[
                        { value: 0, label: 'Top' },
                        { value: 1, label: 'Middle' },
                        { value: 2, label: 'Bottom' },
                      ]" />
                  </div>
                  <div>
                    <label>Colour:</label>
                    <BngPillFilters
                      v-model="col"
                      class="filter"
                      ref="selectOneFilters"
                      required
                      :options="[
                        { value: 0, label: 'Red' },
                        { value: 1, label: 'Green' },
                        { value: 2, label: 'Blue' },
                      ]" />
                  </div>
                </div>
              </BngCard>
              <BngCard v-bng-panel class="sub">
                <div class="j">
                  <h4>More Options</h4>
                  <BngInput placeholder="Enter name..." />
                  <p style="text-align: right"><BngButton label="A" /> <BngButton label="B" /></p>
                </div>
              </BngCard>
            </div>
          </BngCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { BngButton, BngCard, BngCardHeading, BngBinding, BngInput, BngSwitch, BngPillFilters } from "@/common/components/base"
import { ref } from "vue"

import { vBngPanel, vBngOnUiNav } from "@/common/directives"

const panel1Open = ref(false)
const panel2Open = ref(false)

const pos = ref([0])
const col = ref([0])

const openPanel1 = state => (panel1Open.value = state)
const openPanel2 = state => (panel2Open.value = state)
</script>

<style lang="scss" scoped>
.filter,
label {
  display: inline-block !important;
  vertical-align: middle;
}
.items {
  display: flex;
}
.items > div {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
  align-items: flex-start;
  align-content: start;
}
.buttons {
  width: 20em;
}
.demo-card {
  width: 375px;
  height: 280px !important;
  background: #fc0;
  &.wide {
    width: 870px;
  }
}
.nested .wide .content {
  display: flex;
  & > div {
    flex-grow: 1;
  }
}
.sub {
  & .j {
    padding: 0 10px;
    height:11.5em;
  }
  margin: 10px;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./BngPanel_demo.vue?raw"
export default {
  source,
  title: "TODO - Friendly name",
  description: `TODO - Description of directive`,
  propInfo: [],
  attrInfo: [],
}

</script>

