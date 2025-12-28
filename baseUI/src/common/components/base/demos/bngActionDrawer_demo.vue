<template>
  <h3>
    <BngSwitch v-model="usePath">Breadcrumbs</BngSwitch>
    <BngSwitch v-model="alwaysBack" :disabled="usePath">Always show Back</BngSwitch>
  </h3>

  <!--
    skeleton-items - number of items on skeleton view lazy load.
    item-width     - target item width in em. it should be the same as real item width. if not specified, it will be calculated automatically (not 100% reliable).
    item-height    - same as item-width but used mostly for big mode
    item-margin    - same as above but for margin.
  -->
  <BngActionDrawer
    class="drawer-demo"
    :actions="actions"
    @select="onAction"
    :skeleton-items="5"
    big
    :item-width="7"
    :item-height="7"
    :item-margin="0.25"
    :use-path="usePath"
    :always-show-back="alwaysBack"
  >
    <template #controls>
      <BngButton :accent="usePath ? ACCENTS.text : ACCENTS.outlined" :icon="icons.abandon" @click="() => console.log('Custom button click')" />
    </template>
    <!--
      "isLoading" a boolean indicating that those items are skeleton items
      "select" is an internal BngActionDrawer function that is used for navigation or item activation
    -->
    <template #action="{ item, isLoading, select }">
      <BngImageTile :icon="item.icon" :label="item.label" @click="select(item)" />
    </template>
  </BngActionDrawer>
</template>

<script setup>
import { ref } from "vue"
import { BngActionDrawer, BngImageTile, BngButton, icons, iconsByTag, BngSwitch, ACCENTS } from "@/common/components/base"

const usePath = ref(false)
const alwaysBack = ref(false)

function onAction(action) {
  if (action.lazyLoadItems && !action.items) {
    // imitate lazy loading
    setTimeout(() => action.items = action.value === "decal" ? lazyDirs : lazyActions(), 2000)
  }
  console.log(action)
}

const actions = {
  label: "New Layer",
  allowOpenDrawer: false,
  flattenChildren: false,
  items: [
    {
      value: "fill",
      label: "Fill",
      icon: icons.material,
      lazyLoadItems: true,
    },
    {
      value: "decal",
      label: "Decal",
      icon: icons.material,
      lazyLoadItems: true,
      allowOpenDrawer: true,
    },
    {
      value: "camera",
      label: "Camera",
      icon: icons.movieCamera,
      items: [
        {
          value: "camera_left",
          label: "Left",
          icon: icons.cameraSideLeft,
          order: 6,
        },
        {
          value: "camera_right",
          label: "Right",
          icon: icons.cameraSideRight,
          order: 6,
        },
        {
          value: "camera_front",
          label: "Front",
          icon: icons.cameraFront1,
          order: 6,
        },
        {
          value: "camera_back",
          label: "Back",
          icon: icons.cameraBack1,
          order: 6,
        },
        {
          value: "camera_top",
          label: "Top",
          icon: icons.cameraTop1,
          order: 6,
        },
      ],
    },
  ],
}

const randomDecalIcon = () => {
  const icons = Object.keys(iconsByTag.decals)
  return iconsByTag.decals[icons[~~(Math.random() * icons.length)]]
}
const lazyActions = () => Array.from({ length: 30 }).map((_, i) => ({
  value: `lazy_${i}`,
  label: `Lazy ${i}`,
  icon: randomDecalIcon(),
}))
const lazyDirs = Array.from({ length: 3 }).map((_, i) => ({
  value: `lazydir_${i}`,
  label: `Dir ${i}`,
  icon: randomDecalIcon(),
  items: lazyActions(),
}))
</script>

<style scoped lang="scss">
.drawer-demo {
  margin-bottom: 0.5em;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngActionDrawer_demo.vue?raw"
export default {
  source,
  title: "Action drawer",
  description: `Drawer to contain a palette of actions. Accepts a number of slots:\n\n
\`controls\` : Additional components/controls/content to go in header (before expand buttons)\n
\`action\` : Item iterator. Provides:\n
- \`item\` - (object) an item\n
- \`isLoading\` - (boolean) if it is a dummy item while the contents are loading\n
- \`select\` - (function) a function that should be called on click on that item, with an \`item\` argument\n
Events:\n
\`select\` - called when an item is clicked or navigated to
`,
  propInfo: [
    {
      name: "actions",
      type: "Object",
      desc: "Action items list",
    },
    {
      name: "skeletonItems",
      type: "Number",
      desc: "Sets the number of items in skeleton view, when the system is loading a real set of items",
    },
    {
      name: "usePath",
      type: "Boolean",
      desc: "If true, path (breadcrumbs) will be used instead of a header with \"Back\" button (defaults to `false`)",
    },
    {
      name: "alwaysShowBack",
      type: "Boolean",
      desc: "When using \"Back\" button and we're currently at the root, show the button in disabled state (defaults to `false`)",
    },
    {
      name: "itemWidth",
      type: "Number",
      desc: "Sets the target width of tile items in em (if not set, it uses tile component information or attempts to auto-detect)",
    },
    {
      name: "position",
      type: "String",
      desc: "Side where the drawer is supposed to be used (Default: \"bottom\")",
    },
  ],
  attrInfo: [

  ],
}

</script>
