<template>
  <p>Use it to dynamically create a component based on the passed template. Unknown attrs will form the context passed to the component.</p>
  <p>For this demo, the context being passed (via <code>v-bind</code>) is:</p>
  <pre>{
  testFunction: () => console.log('Hello World'),
  buttonText: "Dynamically created button"
}</pre>
  Template:<br/>
  <textarea v-model="srcTemplate" cols="100" rows="10"></textarea>
  <br/><br/>
  <BngButton :accent="ACCENTS.secondary" @click="apply">Apply template</BngButton>
  <br/><br/>
  Result:
  <div id="result">
    <DynamicComponent v-if="resTemplate" :template="resTemplate" v-bind="props"/>
  </div>

  <hr/>

  <p>
    The component can also get its template from a translation key using the <code>translate-id</code> prop.
    It can also parse BBCode with the <code>bbcode</code> prop.
  </p>
  Translate ID: <BngInput v-model="translateId" />
  <BngSwitch v-model="bbcode">BBCode</BngSwitch>
  <BngSwitch v-model="ctxTranslate">Context translate</BngSwitch>
  <br/><br/>
  <BngButton :accent="ACCENTS.secondary" @click="applyTranslate">Apply with translation</BngButton>
  <br/><br/>
  Result:
  <div id="result-translate">
    <DynamicComponent v-if="transProps" v-bind="transProps" />
  </div>
</template>

<script setup>
import { ref, reactive } from "vue"
import { BngButton, BngInput, BngSwitch, ACCENTS } from "@/common/components/base"
import { DynamicComponent } from "@/common/components/utility"

const srcTemplate = ref('<BngButton @click="testFunction">{{buttonText}}</BngButton>')
const resTemplate = ref(undefined)
const props = {
  testFunction: () => console.log('Hello World'),
  buttonText: "Dynamically created button"
}

const apply = () => resTemplate.value = srcTemplate.value

const translateId = ref("ui.hints.spatialNavigation")
const bbcode = ref(true)
const ctxTranslate = ref(false)
const transProps = reactive({})

const applyTranslate = () => {
  transProps.translateId = translateId.value
  transProps.bbcode = bbcode.value
  transProps.translateContext = ctxTranslate.value
}
</script>

<style lang="scss" scoped>
#result, #result-translate {
  margin: 20px 0;
  border: 1px solid #666;
  border-radius: var(--bng-corners-1);
  padding: 40px;
}
hr {
  margin: 2em 0;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./dynamicComponent_demo.vue?raw"
export default {
  source,
  title: "Allows for dynamic Vue content",
  description: `A simple component to allow the creation of dynamic Vue content`,
  propInfo: [
    {
      name: "template",
      type: "String",
      desc: "Vue code for the dynamic component. Required if `translateId` is not used",
    },
    {
      name: "translateId",
      type: "String",
      desc: "Translation key for the component template. Overwrites `template` prop if provided",
    },
    {
      name: "translateContext",
      type: "Boolean",
      desc: "If true, uses context translate for `translateId`. Defaults to `false`",
    },
    {
      name: "bbcode",
      type: "Boolean",
      desc: "If true, parses the template as BBCode. Defaults to `false`",
    },
    {
      name: "useComponents",
      type: "Boolean",
      desc: "Switch to make all standard common BNG Vue compoenents available inside the dynamic component. Defaults to `true`",
    },
    {
      name: "extraComponents",
      type: "Object",
      desc: "Object containing extra Vue components to be made available inside the dynamic component - in the form `{registeredName: ComponentDefinition}`",
    },
  ],
  attrInfo: [

  ],
}

</script>

