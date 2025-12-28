<template>
  <div class="demo-shelf-wrapper">
    <div>
      <h3>Note the height!</h3>
      <p>You can customize the shelf height using the <code>--shelf-height</code> CSS variable. Default is <code>calc-ui-rem(4)</code>.</p>
    </div>
  </div>

  <div class="demo-shelf-wrapper">
    <div>
      <h3>Basic Shelf with Different Item Sizes</h3>
      <p>Items can be different sizes and the 3D transform handles them gracefully</p>
    </div>
    <Shelf class="shelf-demo">
      <div class="shelf-item-demo small-item" bng-nav-item tabindex="0">Small</div>
      <div class="shelf-item-demo medium-item" bng-nav-item tabindex="0">Medium</div>
      <div class="shelf-item-demo large-item" bng-nav-item tabindex="0">Large</div>
      <div class="shelf-item-demo small-item" bng-nav-item tabindex="0">Tiny</div>
      <div class="shelf-item-demo extra-large-item" bng-nav-item tabindex="0">Extra Large</div>
      <div class="shelf-item-demo medium-item" bng-nav-item tabindex="0">Medium</div>
      <div class="shelf-item-demo small-item" bng-nav-item tabindex="0">Small</div>
      <div class="shelf-item-demo large-item" bng-nav-item tabindex="0">Large</div>
    </Shelf>
  </div>

  <div class="demo-shelf-wrapper">
    <div>
      <h3>Shelf with Options</h3>
      <p>Using <code>:limit="7"</code> and <code>fade</code> prop.</p>
    </div>
    <Shelf :limit="7" fade class="shelf-demo">
      <div class="card-item" v-for="(item, index) in cardItems.slice(0, 6)" :key="index" bng-nav-item tabindex="0">
        <div class="card-image" :style="{ background: item.color }">{{ item.icon }}</div>
        <div class="card-title">{{ item.title }}</div>
        <div class="card-subtitle">{{ item.subtitle }}</div>
      </div>
    </Shelf>
  </div>

  <div class="demo-shelf-wrapper">
    <div>
      <h3>localStorage Persistence Demo</h3>
      <p>This shelf remembers your selection using the <code>save-name</code> prop.</p>
    </div>
    <Shelf save-name="persistence-demo" class="shelf-demo custom-height">
      <div class="shelf-item-demo persistent-item" v-for="i in 8" :key="i" bng-nav-item tabindex="0">
        <div class="item-icon">{{ getPersistentIcon(i) }}</div>
        <div class="item-label">Item {{ i }}</div>
      </div>
    </Shelf>
  </div>

  <div class="demo-shelf-wrapper">
    <div>
      <h3>Programmatic Navigation</h3>
      <p>Note: Direct changes using v-model will navigate instantly, without animation. But function calls for <code>toIndex</code>, <code>prev</code> and <code>next</code> will be animated.</p>
    </div>
    <Shelf ref="shelfRef" class="shelf-demo" v-model="programmaticIndex" @change="onChange">
      <div class="shelf-item-demo" v-for="i in 10" :key="i" :style="{ backgroundColor: getRandomColor() }" bng-nav-item tabindex="0">
        Item {{ i }}
      </div>
    </Shelf>
    <div class="shelf-controls">
      <BngInput v-model.number="programmaticIndex" floating-label="Index" type="number" min="0" :max="9" />
      <BngButton @click="goPrevious" :accent="ACCENTS.secondary" :icon="icons.arrowLargeLeft">Previous</BngButton>
      <BngButton @click="goNext" :accent="ACCENTS.secondary" :icon-right="icons.arrowLargeRight">Next</BngButton>
    </div>
    <p>v-model index: {{ programmaticIndex }} | Change event index: {{ currentIndex }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngButton, BngInput, ACCENTS, icons } from "@/common/components/base"
import { Shelf } from "@/common/components/utility"

const shelfRef = ref(null)
const currentIndex = ref(0)
const programmaticIndex = ref(0)

const cardItems = [
  { title: "Item 1", subtitle: "Subtitle 1", icon: "🔹", color: "#e74c3c" },
  { title: "Item 2", subtitle: "Subtitle 2", icon: "🔸", color: "#3498db" },
  { title: "Item 3", subtitle: "Subtitle 3", icon: "🔹", color: "#9b59b6" },
  { title: "Item 4", subtitle: "Subtitle 4", icon: "🔸", color: "#2ecc71" },
  { title: "Item 5", subtitle: "Subtitle 5", icon: "🔹", color: "#f39c12" },
  { title: "Item 6", subtitle: "Subtitle 6", icon: "🔸", color: "#1abc9c" },
]

function onChange(newIndex) {
  currentIndex.value = newIndex
}

function goPrevious() {
  shelfRef.value?.prev()
}

function goNext() {
  shelfRef.value?.next()
}

function getPersistentIcon(index) {
  const icons = ["💾", "📂", "🔒", "⚙️", "🏠", "📊", "🎯", "🌟"]
  return icons[index % icons.length]
}

function getRandomColor() {
  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#95a5a6"]
  return colors[Math.floor(Math.random() * colors.length)]
}
</script>

<style lang="scss" scoped>
.demo-shelf-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1rem;
  gap: 0.5rem;
}

.shelf-demo {
  width: 100%;
  max-width: 800px;
  --shelf-height: 160px;
  border: 1px solid #ddd;
  border-radius: 0.5rem;

  &.custom-height {
    --shelf-height: 200px;
  }
}

.shelf-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}

.shelf-item-demo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  min-width: 80px;
  padding: 0.5rem;
  border-radius: 0.25rem;
  color: white;
  font-weight: bold;
  text-align: center;
}

.small-item {
  width: 60px;
  background: #3498db !important;
}

.medium-item {
  width: 100px;
  background: #2ecc71 !important;
}

.large-item {
  width: 140px;
  background: #e74c3c !important;
}

.extra-large-item {
  width: 200px;
  background: #9b59b6 !important;
}

.card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.card-image {
  width: 50px;
  height: 50px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.card-title {
  font-size: 0.75rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.25rem;
  color: #2c3e50;
}

.card-subtitle {
  font-size: 0.625rem;
  color: #7f8c8d;
  text-align: center;
}

.persistent-item {
  flex-direction: column;
  background: #2c3e50 !important;
  min-width: 100px;
  padding: 1rem;

  .item-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .item-label {
    font-size: 0.75rem;
    font-weight: bold;
    color: white;
  }
}
</style>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./shelf_demo.vue?raw"
export default {
  source,
  title: "A horizontal shelf display",
  description: `Display items in a horizontal shelf with 3D perspective effects. Only shows a limited number of items at once, with the selected item in the center. Items use 3D transforms and opacity for visual depth. Supports localStorage persistence and programmatic navigation.`,
  propInfo: [
    {
      name: "v-model",
      type: "Number",
      desc: "Index of the currently selected item. Default is 0",
    },
    {
      name: "save-name",
      type: "String",
      desc: "Unique name for the shelf. When provided, the selected index is persisted in localStorage",
    },
    {
      name: "limit",
      type: "Number",
      desc: "Number of displayed items (must be odd). Default is 5",
    },
    {
      name: "fade",
      type: "Boolean",
      desc: "Whether to apply opacity fade to side items in addition to brightness. Default is false (brightness only)",
    },
    {
      name: "@change",
      type: "Event",
      desc: "Emitted when the selected item changes. Parameters: (newIndex, previousIndex)",
    },
    {
      name: "@click",
      type: "Event",
      desc: "Emitted when the central (active) item is clicked. Parameters: (event, index)",
    },
    {
      name: "toIndex(index)",
      type: "Function",
      desc: "Navigate to a specific item by index",
    },
    {
      name: "next()",
      type: "Function",
      desc: "Navigate to the next item",
    },
    {
      name: "prev()",
      type: "Function",
      desc: "Navigate to the previous item",
    },
  ],
}
</script>
