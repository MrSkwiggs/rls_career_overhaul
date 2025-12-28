<template>
  <h1>Tree Utility</h1>
  <Tree
    v-model:expandedKeys="expandedKeys"
    v-model:selectedKeys="selectedKeys"
    :nodes="nodes"
    :selectMode="selectMode"
    :expandMode="expandMode"
    keyName="key"
    @nodeExpanded="nodeExpanded"
    @nodeCollapsed="nodeCollapsed"
    @expandedKeysChanged="expandedKeysChanged"
    @nodeSelected="nodeSelected"
    @nodeUnselected="nodeUnselected"
    @selectedKeysChanged="selectedKeysChanged"
    cladss="demo-tree">
    <!-- <template #node="{ node, expanded, selected, select, expand }">
      <div style="display: flex" :style="{ background: node.type === 'header' ? 'grey' : 'lightgrey' }">
        <BngIcon v-if="node.children" :type="expanded ? icons.arrowSmallDown : icons.arrowSmallRight" @click="expand"></BngIcon>
        <span @click="select">{{ node.label }}</span>
      </div>
    </template> -->
  </Tree>

  <div style="position: absolute; bottom: 0; left: 0; padding: 1rem">
    <div style="display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 0.25rem">
      <span><b>selectMode: </b>{{ selectMode ? selectMode : "null" }}</span>
      <span><b>expandMode: </b>{{ expandMode }}</span>
    </div>
    <div style="display: flex">
      <button style="margin-right: 0.25rem" @click="toggleRoot">Toggle Root</button>
      <button @click="changeSelectMode">Change Select Mode</button>
      <button @click="changeExpandMode">Change Expand Mode</button>
      <button @click="resetTree">Reset Tree</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import Tree from "@/common/components/utility/tree.vue"
import { BngIcon, icons } from "@/common/components/base"

const nodes = ref([])

onMounted(() => {
  resetTree()
})

const selectedKeys = ref([])
const SELECT_MODES = [null, "single", "multi", "prop"]
const selectModeValue = ref(0)
const selectMode = computed(() => SELECT_MODES[selectModeValue.value])
const changeSelectMode = () => {
  selectModeValue.value = selectModeValue.value < SELECT_MODES.length ? selectModeValue.value + 1 : 0
}

const expandedKeys = ref([])
const expandModeValue = ref(true)
const expandMode = computed(() => (expandModeValue.value ? "model" : "prop"))
const changeExpandMode = () => (expandModeValue.value = !expandModeValue.value)

const toggleRoot = () => {
  const rootKey = nodes.value[0].key
  if (expandedKeys.value.includes(rootKey)) {
    expandedKeys.value = expandedKeys.value.filter(x => x !== rootKey)
  } else {
    expandedKeys.value = [...expandedKeys.value, rootKey]
  }
}

const nodeExpanded = (node, nodeProps) => {
  console.log("@nodeExpanded", node, nodeProps)

  node.expanded = true
}

const nodeCollapsed = (node, nodeProps) => {
  console.log("@nodeCollapsed", node, nodeProps)
  node.expanded = false
}

const expandedKeysChanged = value => console.log("@expandedKeysChanged", value)

const nodeSelected = (node, nodeProps) => {
  console.log("@nodeSelected", node, nodeProps)
  node.selected = false
}

const nodeUnselected = (node, nodeProps) => {
  console.log("@nodeUnselected", node, nodeProps)
  node.selected = true
}

const selectedKeysChanged = value => console.log("@selectedKeysChanged", value)

function resetTree() {
  nodes.value = [
    {
      key: "1",
      label: "Header 1",
      type: "header",
      selectable: false,
      children: [{ key: "1.1", label: "Item 1.1" }],
    },
    {
      key: "2",
      label: "Header 2",
      type: "header",
      selectable: false,
      children: [{ key: "2.1", label: "Item 2.1" }],
    },
    {
      key: "3",
      label: "Header 3",
      type: "header",
      selectable: false,
      children: [
        {
          key: "3.1",
          label: "Item 3.1",
          children: [
            {
              key: "3.1.1",
              label: "Sub-item 3.1.1",
              selected: true,
            },
            { key: "3.1.2", label: "Sub-item 3.1.2" },
          ],
        },
        {
          key: "3.2",
          label: "Item 3.2 (disabled)",
          expanded: true,
          disabled: true,
          children: [
            { key: "3.2.1", label: "Node 3.2.1" },
            { key: "3.2.2", label: "Node 3.2.2" },
          ],
        },
      ],
    },
  ]
}
</script>

<style scoped lang="scss">
.custom-node {
  padding: 0.25rem 0.5rem;
  border-radius: var(--bng-corners-2);
  background: orange;
  color: white;
}

.demo-tree :deep() {
  [data-tree-node]:not(:last-child),
  [data-tree-node] [data-tree-node]:not(:last-child) {
    padding-bottom: 0.5rem;
  }

  [data-tree-node-children] {
    padding-top: 0.5rem;
  }

  [data-tree-node-selected="true"] > :first-child {
    background: orange !important;
  }
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./tree_demo.vue?raw"
export default {
  source,
  title: "Generic Tree Component",
  description: `Tree component for displaying hierarchical data`,
  propInfo: [
    {
      name: "nodes",
      type: "Array",
      desc: "[Required] Array of tree data (see source for example)",
    },
    {
      name: "keyName",
      type: "String",
      desc: "Name of the key that supplies the unique key within each data node. Default is `'key'`",
    },
    {
      name: "expandMode",
      type: "String",
      desc: "Expand mode for the tree. Should be one of `'model'` (default) or `'prop'`",
    },
    {
      name: "selectMode",
      type: "String",
      desc: "Selection mode for the tree. Should be one of `single`, `'multi'`, `'prop'`",
    },
  ],
  attrInfo: [

  ],
}

</script>

