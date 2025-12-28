<template>
  <div>
    <div class="test-row">
      Component pair:
      <BngDropdown
        v-model="selectedComponent1"
        :items="componentItems"
        class="dropdown-item"
        @valueChanged="onComponent1Changed"
      >
        <template #display>{{ getComponentLabel(selectedComponent1) || 'Select component' }} (1)</template>
      </BngDropdown>
      <BngDropdown
        v-model="selectedComponent2"
        :items="componentItems"
        class="dropdown-item"
        @valueChanged="onComponent2Changed"
      >
        <template #display>{{ getComponentLabel(selectedComponent2) || 'Select component' }} (2)</template>
      </BngDropdown>
      <BngButton @click="resetSelections">Reset</BngButton>
    </div>
    <div class="layout-test">
      <span class="layout-baseline">View:</span>
      <component
        v-if="component1"
        :is="component1"
        v-bind="props"
      >{{ allProps.inner.enabled ? allProps.inner.value : undefined }}</component>
      <component
        v-if="component2"
        :is="component2"
        v-bind="props"
      >{{ allProps.inner.enabled ? allProps.inner.value : undefined }}</component>
      <div v-if="!component1 && !component2" class="empty-state">
        No components selected
      </div>
      <span style="grid-column: 1 / span 2;">Quick brown fox jumps over a lazy dog.</span>
    </div>
    <div>
      Props:
      <BngPillCheckbox
        v-for="(prop, key) in allProps" :key="`prop_${key}`"
        v-model="prop.enabled"
      >{{ key }}</BngPillCheckbox>
    </div>
    <div class="debug-info">
      <h4>Debug Info:</h4>
      <pre>Selected 1: {{ getComponentLabel(selectedComponent1) || 'undefined' }}</pre>
      <pre>Selected 2: {{ getComponentLabel(selectedComponent2) || 'undefined' }}</pre>
      <pre>Components: {{ componentItems.length }} available</pre>
      <button @click="logComponentsState">Log State</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, markRaw, watch, onMounted } from "vue"
import * as BaseComponentExports from "@/common/components/base"
import { BngDropdown, BngPillCheckbox, BngButton } from "@/common/components/base"

// console.log('Setup starting, BaseComponentExports:', Object.keys(BaseComponentExports))

// Create a map of component names to their actual components
const componentMap = {}
Object.keys(BaseComponentExports)
  .filter(name => !name.endsWith("Demo"))
  .forEach(name => {
    componentMap[name] = markRaw(BaseComponentExports[name])
  })

// Create items array for the dropdown
const componentItems = Object.keys(componentMap)
  .map(name => ({ label: name, value: name }))

// console.log('Components array created:', componentItems.map(c => c.label))

// Track selected component names
const selectedComponent1 = ref("BngInput")
const selectedComponent2 = ref("BngButton")

// Get actual component instances based on selected names
const component1 = computed(() =>
  selectedComponent1.value ? componentMap[selectedComponent1.value] : null
)
const component2 = computed(() =>
  selectedComponent2.value ? componentMap[selectedComponent2.value] : null
)

// Helper to get component label from value
const getComponentLabel = (value) => {
  if (!value) return null
  const item = componentItems.find(item => item.value === value)
  return item ? item.label : null
}

// Event handlers for dropdown changes
const onComponent1Changed = (value) => {
  // console.log('Component 1 changed to:', value)
  selectedComponent1.value = value
}

const onComponent2Changed = (value) => {
  // console.log('Component 2 changed to:', value)
  selectedComponent2.value = value
}

// Function to reset selections to initial values
const resetSelections = () => {
  // console.log('Resetting selections')
  selectedComponent1.value = "BngInput"
  selectedComponent2.value = "BngButton"
}

// Debug function to log the current state
const logComponentsState = () => {
  console.log('Selected Component 1:', selectedComponent1.value)
  console.log('Selected Component 2:', selectedComponent2.value)
  console.log('Component 1:', component1.value)
  console.log('Component 2:', component2.value)
  console.log('Component Items:', componentItems)
}

// Watch for changes to the components
watch(selectedComponent1, (newVal) => {
  // console.log('Selected Component 1 changed:', newVal)
})

watch(selectedComponent2, (newVal) => {
  // console.log('Selected Component 2 changed:', newVal)
})

const props = computed(() =>
  Object.keys(allProps)
    .filter(name => allProps[name].enabled && !allProps[name].excludeFromProps)
    .reduce((res, name) => ({ ...res, [name]: allProps[name].value }), {})
)

const allProps = reactive({
  inner: { enabled: true, excludeFromProps: true, value: "Test" },
  value: { enabled: true, value: 123 },
  min: { enabled: true, value: 0 },
  max: { enabled: true, value: 200 },
  items: { enabled: false, value: [{label: 'item 1', value: 1 }, {label: 'item 2', value: 2 }, {label: 'item 3', value: 3 }] },
  options: { enabled: false, value: [1,2,3] },
  icon: { enabled: false, value: "check" },
})

onMounted(() => {
  // console.log('Component mounted, selected components:', selectedComponent1.value, selectedComponent2.value)
})
</script>

<style lang="scss" scoped>
.test-row > :deep(.bng-dropdown) {
  display: inline-flex;
  margin-right: 8px;
}

.test-row > :deep(.bng-button) {
  margin-left: 8px;
}

.empty-state {
  padding: 10px;
  background-color: #f8f8f8;
  border: 1px dashed #ccc;
  border-radius: var(--bng-corners-1);
  color: #666;
  font-style: italic;
}

.debug-info {
  margin-top: 20px;
  padding: 10px;
  color: var(--bng-off-white);
  background-color: var(--bng-off-black);
  border: 1px solid #ddd;
  border-radius: var(--bng-corners-1);

  pre {
    margin: 5px 0;
    white-space: pre-wrap;
  }
}
.layout-test {
  display: grid;
  grid-template-columns:minmax(2rem, max-content) 1fr;
  .layout-baseline {
    grid-column: 1 / span 2;
  }
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./PairingTest.vue?raw"
export default {
  source,
  title: "Component Pairing Test",
  description: `A tool to test how different components look when placed side by side.`,
  propInfo: [],
  attrInfo: [],
}

</script>
