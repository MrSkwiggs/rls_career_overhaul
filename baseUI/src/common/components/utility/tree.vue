<template>
  <ul class="tree">
    <TreeNode
      v-for="node in nodes"
      :key="node[keyName]"
      :node="node"
      :keyName="keyName"
      :selectMode="selectMode"
      :expandMode="expandMode"
      :expandedKeys="expandedKeys"
      :selectedKeys="selectedKeys"
    >
    </TreeNode>
  </ul>
</template>

<script>
// value is set using v-model:selectedKeys
const SELECT_SINGLE = "single";
const SELECT_MULTIPLE = "multi";

// value is based on the nodes's 'selected' property
const SELECT_PROP = "prop";

const SELECT_MODES = [SELECT_SINGLE, SELECT_MULTIPLE, SELECT_PROP];

// value is set using v-model:expandedKeys and is the default value
const EXPAND_MODEL = "model";

// value is based on the nodes's 'expanded' property
const EXPAND_PROP = "prop";

const EXPAND_MODES = [EXPAND_MODEL, EXPAND_PROP];
</script>

<script setup>
import { onBeforeMount, provide, useSlots, watch } from "vue";
import TreeNode from "./treeNode.vue";

/**
 * key: String|Number,
 * label: String
 * expanded?: Boolean,
 * selectable?: Boolean,
 * selected?: Boolean,
 * disabled: Boolean
 */
const props = defineProps({
  nodes: {
    type: Array,
    required: true,
  },
  keyName: {
    type: String,
    default: "key",
  },
  expandMode: {
    type: String,
    default: EXPAND_MODEL,
    validator(value) {
      return EXPAND_MODES.includes(value);
    },
  },
  selectMode: {
    type: String,
    validator(value) {
      return SELECT_MODES.includes(value);
    },
  },
});

const expandedKeys = defineModel("expandedKeys");
const selectedKeys = defineModel("selectedKeys");

const emit = defineEmits([
  "update:expandedKeys",
  "node-expanded",
  "node-collapsed",
  "expanded-keys-changed",
  "node-selected",
  "node-unselected",
  "selected-keys-changed",
]);

onBeforeMount(() => {
  provide("$templates", useSlots());
  provide("expandFn", expand);
  provide("selectFn", select);
});

// Reset selected keys when selectMode type changes
// watch(
//   () => props.selectMode,
//   () => {
//     if (selectedKeys.value) selectedKeys.value = [];
//   }
// );

function expand(node, nodeProps) {
  const nodeKey = node[props.keyName];

  if (props.expandMode === EXPAND_PROP) {
    if (node.expanded) {
      emit("node-collapsed", node, nodeProps);
    } else {
      emit("node-expanded", node, nodeProps);
    }
  } else {
    if (!expandedKeys.value) throw Error("v-model:expandedKeys must be set");

    const expanded = expandedKeys.value.includes(nodeKey);
    let updatedExpandedKeys;

    if (expanded) {
      updatedExpandedKeys = expandedKeys.value.filter((x) => x !== nodeKey);
      emit("node-collapsed", node, nodeProps);
    } else {
      updatedExpandedKeys = [...expandedKeys.value, nodeKey];
      emit("node-expanded", node, nodeProps);
    }

    expandedKeys.value = updatedExpandedKeys;
    emit("expanded-keys-changed", updatedExpandedKeys);
  }
}

function select(node, nodeProps) {
  console.log("select", node)
  const nodeKey = node[props.keyName];

  if (props.selectMode === SELECT_PROP) {
    if (node.selected) {
      emit("node-selected", node, nodeProps);
    } else {
      emit("node-unselected", node, nodeProps);
    }
  } else {
    if (!selectedKeys.value) throw Error("v-model:selectedKeys must be set");

    const selected = selectedKeys.value.includes(nodeKey);
    let updatedSelectedKeys;

    if (selected) {
      updatedSelectedKeys = selectedKeys.value.filter((x) => x !== nodeKey);
      emit("node-unselected", node, nodeProps);
    } else if (props.selectMode === "single") {
      updatedSelectedKeys = [nodeKey];
      emit("node-selected", node, nodeProps);
    } else if (props.selectMode === "multi") {
      updatedSelectedKeys = [...selectedKeys.value, nodeKey];
      emit("node-selected", node, nodeProps);
    }

    selectedKeys.value = updatedSelectedKeys;
    emit("selected-keys-changed", updatedSelectedKeys);
  }
}
</script>

<style lang="scss" scoped>
.tree,
.tree :deep(ul) {
  list-style: none;
  user-select: none;
}

.tree {
  margin: 0;
  padding: 0;
}
</style>
