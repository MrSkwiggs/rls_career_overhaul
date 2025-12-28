<template>
  <div bng-ui-scope="focus_capture_demo">
    <p class="desc">
      This directive helps to build a predictable navigation when using a controller.
      That said, use controller for this demo.
    </p>

    <div class="sample">
      <div class="capture-area" v-bng-focus-capture>
        <p>This area uses default focus capture behaviour - will focus the first focusable element</p>
        <BngButton disabled>Button 1 (disabled, shouldn't focus)</BngButton>
        <BngButton>Button 2 (should focus this)</BngButton>
        <BngButton :accent="ACCENTS.secondary">Button 3</BngButton>
      </div>
    </div>

    <div class="sample">
      <div class="capture-area" v-bng-focus-capture="focusRedirect">
        This area captures focus and redirects it to the target button
        <BngButton :accent="ACCENTS.secondary">Button 1</BngButton>
        <BngButton :accent="ACCENTS.secondary">Button 2</BngButton>
        <BngButton ref="targetButton">Button 3 (target)</BngButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { vBngFocusCapture } from "@/common/directives"
import { BngButton, ACCENTS } from "@/common/components/base"

const targetButton = ref(null)

function focusRedirect(parent) {
  console.log("Custom focus redirect triggered! Redirecting to", targetButton.value?.$el)
  return targetButton.value
}
</script>

<style scoped>
.capture-area {
  border: 2px dashed #666;
  padding: 1em;
  margin-bottom: 0.5em;
  position: relative;
  min-height: 80px;
  background: rgba(255, 255, 255, 0.05);
}

.capture-area p {
  margin-bottom: 0.5em;
  color: #ccc;
  font-size: 90%;
}

p.desc {
  margin-top: 1em;
  margin-bottom: 1em;
}

div.sample {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  margin-bottom: 1em;
}
</style>

<script>
// Demo Metadata
import source from "./BngFocusCapture_demo.vue?raw"
export default {
  source,
  title: "BngFocusCapture Directive",
  description: "Captures focus events and redirects them to appropriate navigable elements when using a controller",
  propInfo: [],
  attrInfo: [
    {
      name: "value",
      type: "Function | undefined",
      desc: `Optional function that should return an element for focus redirection (parent element is passed as argument).
When that function does not return anything, focus is not happening.

If no function is provided, uses crossfire to find the closest navigable element.`
    },
    {
      name: "arg (z-index)",
      type: "Number",
      desc: "Custom z-index for the capture overlay (default: 1000)"
    },
  ],
}
</script>
