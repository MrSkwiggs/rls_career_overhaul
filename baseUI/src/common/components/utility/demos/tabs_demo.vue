<!-- Tabs Demo -->
<template>
  <h3>Class: bng-tabs</h3>
  <Tabs class="bng-tabs" @change="handleChange">
    <Tab heading="Tab 1" marked>I am the first tab!</Tab>
    <Tab heading="Tab 2">The second tab...</Tab>
    <Tab heading="Tab 3" :selected="true">Tab three</Tab>
    <Tab heading="Tab 4">The final tab in the set</Tab>
  </Tabs>

  <h3>Class: none</h3>
  <Tabs>
    <Tab heading="aaTab 1">bbbI am the first tab!</Tab>
    <Tab heading="aaTab 2">bbbThe second tab...</Tab>
    <Tab heading="aaTab 3">bbbTab three</Tab>
    <Tab heading="aaTab 4">bbbThe final tab in the set</Tab>
  </Tabs>

  <h3>With 2 TabLists (and blurs)</h3>
  <Tabs class="bng-tabs" @change="handleChange">
    <TabList v-bng-blur />
    <Tab heading="Tab 1" marked>I am the first tab!<br/><br/></Tab>
    <Tab heading="Tab 2">The second tab...<br/><br/></Tab>
    <Tab v-bng-blur heading="Tab 3" :selected="true">Tab three<br/><br/></Tab>
    <Tab heading="Tab 4">The final tab in the set<br/><br/></Tab>
    <br/>
    hello
    hello<br/>
    hello
    <TabList v-bng-blur />
  </Tabs>
</template>

<script setup>
import { Tabs, Tab, TabList } from "@/common/components/utility"
import { vBngBlur } from "@/common/directives"

const handleChange = (tab, old) => {
  console.log("Old tab:", old)
  console.log("New tab:", tab)
}
</script>

<style lang="scss" scoped>
:deep(.tab-active) {
  font-weight: bold;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./tabs_demo.vue?raw"
export default {
  source,
  title: "For making tabbed content",
  description: `Allows for easy creation of tabbed content. Each 'tab' of content should be placed within a contained [\`<Tab>\`](#/components/Tab) component. By default, [\`<TabList>\`](#/components/TabList) will be added above the tab components if you don't add one/any yourself. For more control over the list of tabs, you are free to add your own [\`<TabList>\`](#/components/TabList) component(s) inside the \`<Tabs>\` component`,
  propInfo: [
    {
      name: "makeTabHeaderClasses",
      type: "Function",
      desc: "Function that will return an object defining the classes that should be applied to the tab header for the passed tab. Applies only if no [`<TabList>`](#/components/TabList) component(s) were manually added - in which case, these will have its/their own `makeTabHeaderClasses` property/properties",
    },
    {
      name: "selectedIndex",
      type: "Number",
      desc: "Defines the index of the active tab. Will default to first tab if not provided",
    },
  ],
  attrInfo: [

  ],
}

</script>

