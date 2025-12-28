<template>
  <h3>BngDrawer demos</h3>

  <BngDrawer class="drawer-demo" @change="onChange">
    <template #header>BngDrawer with single content for both collapsed and expanded states</template>
    <template #content>
      <div v-for="index in 5" :key="index" class="action-button-demo">Action {{ index }}</div>
    </template>
  </BngDrawer>

  <BngDrawer class="drawer-demo" @change="onChange">
    <template #header>BngDrawer with expanded content only</template>
    <div v-for="index in 5" :key="index" class="action-button-demo">Action {{ index }}</div>
  </BngDrawer>

  <BngDrawer class="drawer-demo" @change="onChange">
    <template #header>BngDrawer default and expanded contents</template>
    <template #content>
      <div v-for="index in 5" :key="index" class="action-button-demo">Action {{ index }}</div>
    </template>
    <template #expanded-content>
      <div v-for="index in 5" :key="index" class="action-button-demo">Action {{ index + 5 }}</div>
    </template>
  </BngDrawer>
</template>

<script setup>
import { BngDrawer } from "@/common/components/base"

const onChange = expanded => console.log(expanded ? "Expanded" : "Collapsed")
</script>

<style scoped lang="scss">
.drawer-demo {
  margin-bottom: 0.5em;
}

.actions-demo {
  display: flex;
}

.actions-demo-2 {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.action-button-demo {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100px;
  height: 100px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: var(--bng-corners-2);

  &:not(:last-child) {
    margin-right: 0.5em;
  }
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngDrawer_demo.vue?raw"
export default {
  source,
  title: "A simple drawer",
  description: `Drawer to contain a palette of actions. Accepts a number of slots:\n\n
\`header\` : Alternative to 'header' prop\n
\`header-controls\` : Additional components/controls/content to go in header (before expand buttons)\n
\`content\` : Content for the (non-expanded) drawer\n
\`expanded-content\` : Content for the expanded drawer
`,
  propInfo: [
    {
      name: "header",
      type: "String",
      desc: "Header text for the drawer (alternatively can be in 'header' slot)",
    },
    {
      name: "blur",
      type: "Boolean",
      desc: "Switch to blur the game content behind the drawer",
    },
    {
      name: "expandable",
      type: "Boolean",
      desc: "Switch to make the drawer expandable (defaults to `true`)",
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
