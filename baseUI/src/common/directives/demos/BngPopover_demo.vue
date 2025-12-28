<template>
  <div class="bng-popover-demo">
    <!-- <BngImageTile ref="leftTile" :icon="icons.arrowLargeRight" label="Left" /> -->

    <!-- <div v-bng-popover:left.click="currentPopover" @click.stop="">test</div> -->
    <BngImageTile v-bng-popover:left.click="currentPopover" @click.stop="">test</BngImageTile>

    <BngImageTile v-bng-popover:left.click="currentPopover" @click="source = 'left'">Left</BngImageTile>
    <BngImageTile v-bng-popover:right.click="currentPopover" @click="source = 'right'">Right</BngImageTile>
    <div v-bng-popover:bottom="'hover-popover'" class="popover-target">Hover for popup</div>
    <div v-bng-popover:right-start.click="'select-popover'" class="popover-target">Select Popover</div>

    <BngPopoverContent name="popovertest" @show="onShow" @hide="onHide">
      <div>Yello! {{ source }}</div>
    </BngPopoverContent>

    <BngPopoverContent name="hover-popover" @show="onShow" @hide="onHide">
      <div>Hover Popover Content</div>
    </BngPopoverContent>

    <BngPopoverContent name="select-popover" @show="onShow" @hide="onHide">
      <template #default="{ hide }">
        <BngButton @click="hide">Click to close</BngButton>
      </template>
    </BngPopoverContent>

    <BngButton v-bng-popover="reactivePopoverName" @click="initPopover">{{ reactivePopoverName ? "unset popover" : "set popover" }}</BngButton>
    <BngPopoverContent :name="reactivePopoverName" @show="onShow" @hide="onHide">
      <template #default="{ hide }">
        <BngButton @click="hide">Click to close</BngButton>
      </template>
    </BngPopoverContent>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngButton, BngImageTile, BngPopoverContent, icons } from "@/common/components/base"
import { vBngPopover } from "@/common/directives"

const currentPopover = ref("popovertest")
const source = ref(null)

const onShow = () => {
  console.log("onShow")
}

const onHide = () => {
  console.log("onHide")
}

const reactivePopoverName = ref(null)
const initPopover = () => {
  if (reactivePopoverName.value) {
    reactivePopoverName.value = null
  } else {
    reactivePopoverName.value = "random-popover-name"
  }
}
</script>

<style lang="scss" scoped>
.bng-popover-demo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.popover-target {
  padding: 1rem;
  border-radius: var(--bng-corners-2);
  background: rgba(0, 0, 0, 0.6);
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./BngPopover_demo.vue?raw"
export default {
  source,
  title: "TODO - Friendly name",
  description: `TODO - Description of directive`,
  propInfo: [],
  attrInfo: [],
}

</script>

