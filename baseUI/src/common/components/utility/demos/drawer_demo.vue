<template>
  <div class="demo-select">
    <span>Position:</span>
    <BngDropdown v-model="pos" :items="poses" />
  </div>
  <div :class="['demo-drawer', `demo-drawer-pos-${pos}`]">
    <Drawer v-model="expanded" @change="onChange" :position="pos">
      <template #header>
        <h3 style="margin: 0">Drawer utility</h3>
        <BngButton accent="text" @click="expanded = !expanded">
          {{ expanded ? "Collapse" : "Expand" }}
        </BngButton>
      </template>
      <template #content>
        Optional collapsed content
      </template>
      <template #expanded-content>
        Expanded content<br/>
        Expanded content<br/>
        Expanded content
      </template>
    </Drawer>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngButton, BngDropdown } from "@/common/components/base"
import { Drawer, DRAWER_POSITION } from "@/common/components/utility"

const expanded = ref(false)

const pos = ref("bottom")
const poses = Object.values(DRAWER_POSITION).map(v => ({ label: v, value: v }))

const onChange = expanded => console.log(expanded ? "Expanded" : "Collapsed")
</script>

<style lang="scss" scoped>
.demo-select {
  display: flex;
  flex-flow: row nowrap;
  align-items: baseline;
  width: 10em;
  margin: 0 auto;
  > span {
    margin-right: 0.5em;
  }
}

.demo-drawer {
  position: relative;
  width: 30em;
  height: 30em;
  margin: 0.5em auto;
  border: 2px dotted #ccc;
  > * {
    position: absolute;
  }
}
.demo-drawer-pos-bottom > * {
  bottom: 0;
  left: 0;
}
.demo-drawer-pos-top > *,
.demo-drawer-pos-left > * {
  top: 0;
  left: 0;
}
.demo-drawer-pos-right > * {
  top: 0;
  right: 0;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./drawer_demo.vue?raw"
export default {
  source,
  title: "Simple Drawer",
  description: `A simple drawer component with optional expanded content. Header, content, and expanded content should go in the \`header\`, \`content\`, and \`expanded-content\` slots respectively.`,
  propInfo: [
    {
      name: "blur",
      type: "Boolean",
      desc: "Switch for blurring the game behind the drawer",
    },
    {
      name: "position",
      type: "String",
      desc: "Side where the drawer is supposed to be used (Default: \"bottom\")",
    },
    {
      name: "v-model",
      type: "Boolean",
      desc: "The `v-model` should be a boolean ref. It effectively binds the `expanded` state of the drawer",
    },
  ],
  attrInfo: [

  ],
}

</script>
