<template>
  <div class="test-screen">
    <!-- <div id="div1" @drop="drop" @dragover="allowDrop"></div>
    <br />
    <p id="drag1" draggable="true" @dragstart="drag">This is a draggable paragraph. Drag this element into the rectangle.</p> -->
    <LiveryEditorHeader />
  </div>
</template>

<script setup>
import { shallowRef } from "vue"
import { ACCENTS, BngButton } from "@/common/components/base"
import LiveryEditorHeader from "@/modules/liveryEditor/components/LiveryEditorHeader.vue"
import { useEditorHeaderStore } from "@/modules/liveryEditor/stores/liveryEditorHeaderStore"

const store = useEditorHeaderStore()
store.setHeader("Livery Editor")
store.setPreheader("Test")

const item = {
  id: "save",
  // section: "center",
  component: shallowRef(BngButton),
  props: {
    accent: ACCENTS.attention,
    label: "Save",
  },
  events: {
    click: printHelloWorld,
  },
}

const itemStart = {
  id: "save",
  section: "start",
  component: shallowRef(BngButton),
  props: {
    accent: ACCENTS.attention,
    label: "Save",
  },
  events: {
    click: printHelloWorld,
  },
}

const itemEnd = {
  id: "save",
  section: "end",
  component: shallowRef(BngButton),
  props: {
    accent: ACCENTS.attention,
    label: "Save",
  },
  events: {
    click: printHelloWorld,
  },
}

function printHelloWorld() {
  console.log("hello, world!")
}
store.addItem(item)
store.addItem(itemEnd)
store.addItem(itemStart)

// function allowDrop(ev) {
//   ev.preventDefault()
// }

// function drag(ev) {
//   ev.dataTransfer.setData("Text", ev.target.id)
// }

// function drop(ev) {
//   let data = ev.dataTransfer.getData("Text")
//   ev.target.appendChild(document.getElementById(data))
//   ev.preventDefault()
// }
</script>

<style scoped lang="scss">
.test-screen {
  padding: 1rem;
  height: 100%;
  width: 100%;
}
#div1 {
  width: 350px;
  height: 70px;
  padding: 10px;
  border: 1px solid #aaaaaa;
}
</style>
