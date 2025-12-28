<template>
  <li
    :data-tree-node-key="node[keyName]"
    :data-tree-node-expanded="expanded"
    :data-tree-node-selected="selected"
    :data-tree-node-parent-path="parentPathString"
    :data-tree-node-path="pathString"
    data-tree-node>
    <!-- Refers to the entire node. If set, parent component should provide its own
      toggle and content elements -->
    <component
      v-if="$templates['node']"
      :is="$templates['node']"
      :node="node"
      :parentNode="parentNode"
      :expanded="expanded"
      :selected="selected"
      :expand="() => (expandable ? _expandFn(node, nodeProps) : {})"
      :select="() => (selectable ? _selectFn(node, nodeProps) : {})"></component>

    <div v-else class="node">
      <!-- node toggle -->
      <component
        v-if="node.children && $templates['toggle']"
        :is="$templates['toggle']"
        :node="node"
        :parentNode="parentNode"
        :expanded="expanded"
        :selected="selected"
        :expand="() => (expandable ? _expandFn(node, nodeProps) : {})"></component>
      <span v-else class="node-toggle" @click="() => (expandable ? _expandFn(node, nodeProps) : {})" :disabled="node.disabled">
        <BngIcon bng-nav-item v-if="node.children" :type="expanded ? icons.arrowSmallDown : icons.arrowSmallRight"></BngIcon>
      </span>

      <!-- node content -->
      <component
        v-if="$templates['content']"
        :is="$templates['content']"
        :node="node"
        :parentNode="parentNode"
        :expanded="expanded"
        :selected="selected"
        :expand="() => (expandable ? _expandFn(node, nodeProps) : {})"
        :select="() => (selectable ? _selectFn(node, nodeProps) : {})"></component>
      <span v-else bng-nav-item class="node-content" @click="() => (selectable ? _selectFn(node, nodeProps) : {})">{{ node.label }}</span>
    </div>

    <ul v-if="expanded && node.children" data-tree-node-children>
      <TreeNode
        v-for="childNode in node.children"
        :key="childNode[keyName]"
        :node="childNode"
        :parentNode="node"
        :keyName="keyName"
        :selectMode="selectMode"
        :expandMode="expandMode"
        :expandedKeys="expandedKeys"
        :selectedKeys="selectedKeys"
        :parentPath="path"></TreeNode>
    </ul>
  </li>
</template>

<script setup>
import { computed, inject } from "vue"
import { BngIcon, icons } from "@/common/components/base"
const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  keyName: {
    type: String,
    required: true,
  },
  parentNode: Object,
  selectMode: String,
  expandMode: String,
  expandedKeys: Array,
  selectedKeys: Array,
  parentPath: Array,
})

const $templates = inject("$templates")
const _expandFn = inject("expandFn")
const _selectFn = inject("selectFn")

const expanded = computed(() => {
  if (props.expandMode === "prop") return props.node.expanded

  return props.expandedKeys && props.expandedKeys.includes(props.node[props.keyName])
})

const expandable = computed(() => !props.node.disabled && props.node.children && props.node.children.length > 0)

const selected = computed(() => {
  if (!props.selectMode) return false

  if (props.selectMode === "prop") return props.node.selected

  return props.selectedKeys && props.selectedKeys.includes(props.node[props.keyName])
})

const selectable = computed(() => !props.node.disabled && props.selectMode && props.node.selectable !== false)

const path = computed(() => (props.parentPath ? props.parentPath.concat(props.node[props.keyName]) : [props.node[props.keyName]]))

const parentPathString = computed(() => (props.parentPath ? props.parentPath.join("/") : null))

const pathString = computed(() => path.value.join("/"))

const nodeProps = computed(() => ({
  path: path.value,
  parentPath: props.parentPath,
}))
</script>

<style lang="scss" scoped>
.node {
  display: flex;
  align-items: center;

  .node-toggle {
    min-width: 27px;
    margin-right: 0.25rem;
    &:not([disabled]) {
      cursor: pointer;
    }
  }
}
</style>
