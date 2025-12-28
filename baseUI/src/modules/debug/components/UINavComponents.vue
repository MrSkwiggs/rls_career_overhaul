<template>
  <div class="demo-header">
    <BngButton :disabled="showDemos" @click="() => ((showComponents = false), (showDemos = true))">Run demos (heavy)</BngButton>
    <BngButton :disabled="showComponents" @click="() => ((showComponents = true), (showDemos = false))">Run components (might crash)</BngButton>
    <BngSwitch v-bng-disabled="!showComponents && !showDemos" v-model="double">Show second column</BngSwitch>
    <BngSwitch v-bng-disabled="!showComponents" v-model="showAll">Include components without demos (might crash)</BngSwitch>
  </div>
  <div
    class="demo-column"
    v-if="showComponents || showDemos"
    v-for="i in count"
  >
    <template v-for="(cmp, name) in view">
      <h4>{{name}}</h4>
      <component :is="cmp" v-bind="componentBinds[name]">{{name}}</component>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import * as BaseComponentExports from "@/common/components/base"
import * as UtilityComponentExports from "@/common/components/utility"
import { vBngDisabled } from "@/common/directives"
const { BngButton, BngSwitch } = BaseComponentExports

const showComponents = ref(false)
const showDemos = ref(false)
const showAll = ref(false)
const double = ref(false)
const count = computed(() => double.value ? 2 : 1)

const all =
  Object.entries({
    ...BaseComponentExports,
    ...UtilityComponentExports,
  })
  .filter(([name, cmp]) => typeof cmp === "object" && cmp.__file && cmp.__file.endsWith(".vue"))
  .reduce((res, [name, cmp]) => ({
    components: !name.endsWith("Demo") ? { ...res.components, [name]: cmp } : res.components,
    demos: name.endsWith("Demo") ? { ...res.demos, [name.substring(0, name.length - 4)]: cmp } : res.demos,
  }), { components: {}, demos: {} })

const view = computed(() => Object.fromEntries(
  (showDemos.value
    ? Object.keys(all.demos).filter(name => !all.demos[name].noDemoView)
    : showAll.value ? Object.keys(all.components) : Object.keys(all.components).filter(name => !!all.demos[name] && !all.demos[name].noDemoView)
  )
  .map(name => [name, all[showDemos.value ? "demos" : "components"][name]])
))

function type2val(type) {
  switch (type) {
    case String: return ""
    case Number: return 0
    case Object: return {}
    case Array: return []
    case undefined: return undefined
    default:
      console.error("Unknown type, needs to be defined in type2val:", type)
  }
  return null
}
const componentBinds = Object.fromEntries(
  Object.entries(all.components)
    // take only components with props
    .filter(itm => typeof itm[1] === "object" && itm[1].props)
    .map(([name, { props }]) => [name, Object.fromEntries(
      Object.entries(props)
        // we need to fill required fields only
        .filter(([_, prop]) => typeof prop === "object" && prop.required)
        // fill required fields with empty data of appropriate type
        .map(([name, prop]) => [name, type2val(Array.isArray(prop.type) ? prop.type[0] : prop.type)])
    )])
    // filter out empty
    // .filter(([name, props]) => typeof props !== "object" || Object.keys(props) > 0)
)
// console.log(componentBinds)

</script>

<style lang="scss" scoped>
.demo-header {
  display: block;
}

.demo-column {
  display: inline-flex;
  flex-flow: column;
  width: 40%;
  height: 90%;
  overflow: hidden scroll;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
// import source from "./UINavComponents.vue?raw"
export default {
  // source,
  title: "Component testing page for UI Nav",
  description: `Test how UI Nav acts with all components shown at once`,
  propInfo: [],
  attrInfo: [],
}

</script>
