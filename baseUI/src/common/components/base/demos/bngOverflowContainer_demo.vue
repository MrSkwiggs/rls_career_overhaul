<template>
  <div class="overflow-container-demo-page">
    <div>

      <!-- normal -->
      <BngOverflowContainer
        v-if="mode === 'normal'"
        ref="elCont"
        class="demo-container"
        :scroll-speed="scrollSpeed"
      >
        <BngButton v-for="i in 10" :key="i" class="demo-button" :accent="ACCENTS.outlined">
          Item {{ i }}
        </BngButton>
      </BngOverflowContainer>

      <!-- useUiNav -->
      <BngOverflowContainer
        v-else-if="mode === 'bindings'"
        ref="elCont"
        class="demo-container"
        :scroll-speed="scrollSpeed"
        use-bindings
      >
        <BngButton v-for="i in 10" :key="i" class="demo-button" :accent="ACCENTS.outlined">
          Item {{ i }}
        </BngButton>
      </BngOverflowContainer>

      <!-- useUiNav & uiNavOnly -->
      <BngOverflowContainer
        v-else-if="mode === 'bindings-only'"
        ref="elCont"
        class="demo-container"
        :scroll-speed="scrollSpeed"
        use-bindings-only
      >
        <BngButton v-for="i in 10" :key="i" class="demo-button" :accent="ACCENTS.outlined">
          Item {{ i }}
        </BngButton>
      </BngOverflowContainer>

    </div>

    <div class="actions">
      <BngButton class="btn" :accent="ACCENTS.secondary" @click="activatePrev">Prev</BngButton>
      <BngButton class="btn" :accent="ACCENTS.secondary" @click="activateNext">Next</BngButton>
      <BngButton class="btn" :accent="ACCENTS.secondary" @click="activateRandom">Random</BngButton>
      <BngButton class="btn" :accent="ACCENTS.secondary" @click="deactivate">Deactivate</BngButton>
      <BngPillCheckbox v-model="useBindings">Use controller bindings</BngPillCheckbox>
      <BngPillCheckbox v-model="useBindingsOnly">Bindings only (prevents focus)</BngPillCheckbox>
    </div>
    <div class="actions">
      <BngButton class="btn" :accent="ACCENTS.secondary" @click="scrollBy(-100)">Scroll Left 100px</BngButton>
      <BngButton class="btn" :accent="ACCENTS.secondary" @click="scrollBy(100)">Scroll Right 100px</BngButton>
      <BngInput v-model="scrollSpeed" type="number" floating-label="Mouse scroll speed" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { BngButton, BngInput, BngPillCheckbox, ACCENTS } from "@/common/components/base"
import { BngOverflowContainer } from "@/common/components/base"

const elCont = ref(null)

const scrollSpeed = ref(7)

const mode = ref("bindings")
const setMode = val => mode.value = mode.value === val ? "normal" : val
const useBindings = computed({
  get: () => mode.value === "bindings",
  set: () => setMode("bindings"),
})
const useBindingsOnly = computed({
  get: () => mode.value === "bindings-only",
  set: () => setMode("bindings-only"),
})

const activatePrev = () => elCont.value.activatePrev()
const activateNext = () => elCont.value.activateNext()
const activateRandom = () => elCont.value.activate(~~(Math.random() * 10))
const deactivate = () => elCont.value.deactivate()
const scrollBy = amount => elCont.value.scrollBy(amount)
</script>

<style scoped lang="scss">
.overflow-container-demo-page {
  display: flex;
  flex-direction: column;
  gap: 2em;
  padding: 1em;

  > div {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }

  .demo-container {
    width: 50em;
  }
}

.actions {
  flex-flow: row wrap !important;
  align-items: baseline;
  .btn {
    margin: 4px;
  }
}

.demo-button {
  flex-shrink: 0;
  min-width: max-content;
  &[active] {
    text-decoration: underline;
    color: var(--bng-orange);
  }
}

.demo-content {
  background: var(--bng-cool-gray-700);
  padding: 0.5em 1em;
  border-radius: 0.5em;
  color: var(--bng-cool-gray-200);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.demo-badge {
  background: var(--bng-orange-b400);
  color: white;
  padding: 0.25em 0.75em;
  border-radius: 1em;
  font-size: 0.8em;
  font-weight: bold;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.scroll-info {
  background: var(--bng-cool-gray-800);
  padding: 1em;
  border-radius: 0.5em;
  font-family: monospace;
  font-size: 0.9em;

  p {
    margin: 0.25em 0;
    color: var(--bng-cool-gray-300);
  }
}
</style>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./bngOverflowContainer_demo.vue?raw"
export default {
  source,
  title: "Overflow Container",
  description: `A generic container with horizontal scrolling that can contain any content`,
  propInfo: [
    {
      name: "scrollSpeed",
      type: "Number",
      desc: "Controls the speed of automatic scrolling when hovering over fade areas. Default is 5.",
    },
    {
      name: "initialIndex",
      type: "Number",
      desc: "The index of the element to activate when the container is mounted. Default is -1 (no activation).",
    },
    {
      name: "useBindings",
      type: "Boolean or Array",
      desc: "If true, will use tab-l/r for switching between items. If an array, will use the specified keys for navigation.",
    },
    {
      name: "useBindingsOnly",
      type: "Boolean or Array",
      desc: "Same as `useBindings`, but only allows uiNav for switching between items, not allowing crossfire nor mouse to focus inside.",
    },
  ],
  attrInfo: [
    {
      name: "@scroll",
      type: "Event",
      desc: "Emitted when the container scrolls, provides scroll information object with scrollLeft, scrollWidth, and clientWidth properties",
    },
  ],
}
</script>
