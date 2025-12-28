<template>
  <div bng-ui-scope="scoped-nav-demo" v-bng-on-ui-nav:back="trapBack">
    <h1>Simple Scoped Nav</h1>
    <div v-bng-scoped-nav class="scoped-nav-container">
      <BngButton v-bng-on-ui-nav:action_2="ev => sayHello('Button 1', ev)" @click="() => sayHello('Button 1 Click', ev)">Button 1</BngButton>
      <BngButton v-bng-on-ui-nav:action_2="ev => sayHello('Button 2', ev)" @click="() => sayHello('Button 2 Click', ev)">Button 2</BngButton>
    </div>

    <BngDivider></BngDivider>

    <h1>Auto-focus a default item on activate</h1>
    <div v-bng-scoped-nav class="scoped-nav-container">
      <BngButton @click="() => sayHello('Auto-focus 1 Click')">Auto-focus 1</BngButton>
      <BngButton @click="() => sayHello('Auto-focus 2 Click')">Auto-focus 2</BngButton>
      <BngButton v-bng-on-ui-nav:ok.asMouse.focusRequired :bng-scoped-nav-autofocus="autoFocus" @click="toggleAutoFocus">Toggle Auto-focus</BngButton>
    </div>

    <BngDivider></BngDivider>

    <h1>Using Base Component</h1>
    <BngCard v-bng-scoped-nav class="scoped-nav-container">
      <BngCardHeading>Some Heading</BngCardHeading>
      <BngButton v-bng-on-ui-nav:ok.focusRequired="() => sayHello('Base Button 1')">Base Button 1</BngButton>
      <BngButton v-bng-on-ui-nav:ok="() => sayHello('Base Button 2')">Base Button 2</BngButton>
      <BngButton v-bng-on-ui-nav:ok,action_2="() => sayHello('Base Button 3')"> Base Button 3 </BngButton>
    </BngCard>

    <BngDivider></BngDivider>

    <h1>Nested Scoped Nav</h1>
    <BngCard v-bng-scoped-nav class="scoped-nav-container">
      <BngCardHeading>Nested Scope Nav</BngCardHeading>
      <div>
        <BngButton v-bng-on-ui-nav:action_2="ev => sayHello('Button 3', ev)">Button 3</BngButton>
        <BngButton v-bng-on-ui-nav:action_2="ev => sayHello('Button 4', ev)">Button 4</BngButton>
        <div style="margin: 1rem" v-bng-scoped-nav class="scoped-nav-container">
          <p>Items below are inside an inner scoped nav</p>
          <BngButton v-bng-on-ui-nav:action_2.up="ev => sayHello('Nested Button 1', ev)">Nested Button 1</BngButton>
          <BngButton v-bng-on-ui-nav:action_2.focusRequired="ev => sayHello('Nested Button 2', ev)">Nested Button 2</BngButton>
          <BngButton v-bng-on-ui-nav:action_2="ev => sayHello('Nested Button 3', ev)" v-if="enabled">Nested Button 3</BngButton>
        </div>
      </div>
    </BngCard>

    <BngDivider></BngDivider>

    <h1>Props and Events</h1>
    <ul>
      <li>
        <strong>activated</strong> - allows programmatically activating or deactivating the <code>BngScopedNav</code> element. Setting to true will activate it,
        otherwise, deactivate it.
      </li>
      <li>
        <strong>canActivate</strong> - accepts a function that allows filtering <code>v-bng-on-ui-nav:ok</code> or <strong>confirm</strong> events. Returning
        true will allow activation, otherwise, it will ignore the event and do nothing.
      </li>
      <li>
        <strong>canDeactivate</strong> - accepts a function that allows filtering <code>v-bng-on-ui-nav:back</code> or <strong>back</strong> events. Returning
        true will allow deactivation, otherwise, it will ignore the event and do nothing.
      </li>
    </ul>
    <p>Clicking button below will automatically activate the scoped nav element below.</p>
    <BngButton accent="secondary" @click="toggleScopedNav">Activate Scoped Nav</BngButton>
    <BngCard
      v-bng-scoped-nav="{ activated: containerActivated, canActivate: canActivate, canDeactivate: canDeactivate }"
      class="scoped-nav-container"
      @activate="containerActivatedEvent"
      @deactivate="containerDeactivatedEvent">
      <BngCardHeading>Props and Events</BngCardHeading>
      <template v-if="button7Active">
        <div v-bng-on-ui-nav:back="() => (button7Active = false)">
          Button 7 Active
          <p>
            clicking outside of this element will not trigger deactivate because focusout is not being triggered, but you can still press/trigger
            <strong>back</strong> to go back to the previous menu
          </p>
        </div>
      </template>
      <template v-else-if="button8Active">
        <div v-bng-on-ui-nav:back="() => (button8Active = false)">
          Button 8 Active
          <BngButton>Some Button</BngButton>
        </div>
      </template>
      <template v-else>
        <BngButton v-bng-on-ui-nav:ok.focusRequired="() => (button7Active = true)">Button 7</BngButton>
        <BngButton v-bng-on-ui-nav:ok.focusRequired="() => (button8Active = true)">Button 8</BngButton>
      </template>
    </BngCard>

    <BngDivider></BngDivider>

    <h1>With Scoped Nav Item Attributes</h1>
    <p>
      Activating card and navigating between child items will update the info bar based on the focused item's declared UINav events. Using
      <code>v-bng-ui-nav-label:[event]</code> allows customizing an element's label for an event that will be displayed in info bar.
    </p>
    <BngCard v-bng-scoped-nav class="scoped-nav-container">
      <BngCardHeading>Some Heading</BngCardHeading>
      <BngButton v-bng-ui-nav-label:ok="'Button 12'" v-bng-on-ui-nav:ok.focusRequired="() => sayHello('Button 12')">Button 12</BngButton>
      <BngButton v-bng-ui-nav-label:ok="'Button 13'" v-bng-on-ui-nav:ok="() => sayHello('Button 13')">Button 13</BngButton>
      <BngButton v-bng-ui-nav-label:ok="'Button 14'" v-bng-on-ui-nav:ok,tab_r="() => sayHello('Button 14')"> Button 14 </BngButton>
      <div><BngButton>Wrapped Button</BngButton></div>
    </BngCard>

    <BngDivider></BngDivider>

    <h1>With dynamic data</h1>
    <BngCard v-bng-scoped-nav class="scoped-nav-container">
      <BngCardHeading>Some Heading</BngCardHeading>
      <BngButton
        v-for="label in dynButtons"
        :key="label"
        v-bng-on-ui-nav:ok.focusRequired="() => sayHello('OK on ' + label)"
        v-bng-on-ui-nav:action_2.focusRequired="() => sayHello('ACT2 on ' + label)"
        >{{ label }}</BngButton
      >
    </BngCard>
  </div>

  <BngDivider></BngDivider>

  <h1>Styling</h1>
  <p></p>
  <BngCard v-bng-scoped-nav class="styled-scoped-nav scoped-nav-container">
    <BngCardHeading>
      <span class="styled-label">Red(deactivated) or Green(activated)</span>
    </BngCardHeading>
    <BngButton v-bng-on-ui-nav:ok.focusRequired="() => sayHello('Button 15')">Button 15</BngButton>
  </BngCard>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { BngButton, BngCard, BngCardHeading, BngDivider } from "@/common/components/base"
import { vBngOnUiNav, vBngUiNavLabel, vBngScopedNav } from "@/common/directives"
import { useInfoBar } from "@/services/infoBar.js"
import { useUINavScope } from "@/services/uiNav"

const infobar = useInfoBar()
infobar.visible = true

const uiScope = useUINavScope()
changeScope("scoped-nav-demo")

function sayHello(name, event) {
  const msg = `Hello, ${name}!`
  console.log(msg)
  return true
}

const autoFocus = ref(true)
function toggleAutoFocus() {
  autoFocus.value = !autoFocus.value
}

const containerActivated = ref(false)
const button7Active = ref(false)
const button8Active = ref(false)
const canActivate = () => {
  return true
}
const canDeactivate = () => {
  return !button7Active.value && !button8Active.value
}

function toggleScopedNav() {
  containerActivated.value = !containerActivated.value
  console.log("toggleScopedNav", containerActivated.value)
}

function containerActivatedEvent(event) {
  console.log("container activated", event)
  if (event.detail.activationType === "full") {
    containerActivated.value = true
  }
}

function containerDeactivatedEvent(event) {
  console.log("container deactivated", event)
  containerActivated.value = false
  button7Active.value = false
  button8Active.value = false
}

function trapBack() {
  console.log("back trapped")
}

function changeScope(scopeName) {
  console.log("scope change", scopeName)
  uiScope.set(scopeName)
}

const enabled = ref(true)

const dynButtons = ref([])
let dynTimer
onMounted(() => {
  dynTimer = setInterval(() => {
    dynButtons.value = Array.from({ length: 3 }, () => "Button " + Math.random().toString(36).substring(2, 5))
  }, 3000)
})
onUnmounted(() => {
  clearInterval(dynTimer)
})
</script>

<script>
import source from "./BngScopedNav_demo.vue?raw"
export default {
  source,
  title: "Scoped Navigation",
  description: "Limits navigation and UINav events to a specified boundary",
}
</script>

<style lang="scss" scoped>
.scoped-nav-container {
  position: relative;
}

.styled-scoped-nav {
  &[data-status="active"] {
    .styled-label {
      color: green;
    }
  }
  &[data-status="partial"] {
    .styled-label {
      color: yellow;
    }
  }
  &[data-status="inactive"] {
    .styled-label {
      color: red;
    }
  }
}
</style>
