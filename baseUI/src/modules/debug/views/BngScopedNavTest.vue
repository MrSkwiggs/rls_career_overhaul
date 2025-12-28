<template>
  <div v-bng-ui-nav-scroll class="root-container" v-bng-on-ui-nav:menu="e => handleMenuClick('Root Container', e)">
    <BngDivider></BngDivider>

    <h3>No Keybindings for Elements Inside the Card</h3>
    <p>
      When a user navigates to a card and presses the "A" button, the focus frame is trapped within the card. The screen appearance remains unchanged, but
      elements inside the card become selectable. This allows users to interact with elements that do not have specific keybindings.
    </p>

    <BngCard v-bng-scoped-nav="{ bubbleWhitelistEvents: ['rotate_h_cam', 'rotate_v_cam'] }" v-bng-on-ui-nav:menu="e => handleMenuClick('Card Heading', e)">
      <BngCardHeading>Behavior 1</BngCardHeading>
      <BngButton v-bng-on-ui-nav:ok.focusRequired="e => sayHello('Button 1.1', e)" @click="() => sayHello('Button 1.1 click', e)">Button 1.1</BngButton>
      <BngButton v-bng-on-ui-nav:ok.focusRequired="e => sayHello('Button 1.2', e)" @click="() => sayHello('Button 1.2 click', e)">Button 1.2</BngButton>
      <BngButton v-bng-on-ui-nav:ok.focusRequired="e => sayHello('Button 1.3', e)" @click="() => sayHello('Button 1.3 click', e)"> Button 1.3 </BngButton>
    </BngCard>

    <BngDivider></BngDivider>

    <h3>Container Type</h3>
    <p>Items inside card will be navigable and then the scope will be activated</p>

    <BngCard v-bng-scoped-nav="{ type: SCOPED_NAV_TYPES.container }" v-bng-on-ui-nav:menu="e => handleMenuClick('Card Heading', e)">
      <BngCardHeading>Container Type</BngCardHeading>
      <BngButton v-bng-on-ui-nav:ok.focusRequired="e => sayHello('Test 2.1', e)" @click="() => sayHello('Test 2.1 click', e)">Test 2.1</BngButton>
      <BngButton v-bng-on-ui-nav:ok.focusRequired="e => sayHello('Test 2.2', e)" @click="() => sayHello('Test 2.2 click', e)">Test 2.2</BngButton>
      <BngButton bng-scoped-nav-autofocus v-bng-on-ui-nav:ok.focusRequired="e => sayHello('Test 2.3', e)" @click="() => sayHello('Test 2.3 click', e)"> Test 2.3 </BngButton>
    </BngCard>

    <BngDivider></BngDivider>

    <h3>All Elements Inside the Card Have Keybindings:</h3>
    <p>
      Upon focusing on a card, the system displays keybindings for each element, either on the elements themselves or on the navigation bar. These bindings
      become actively listened to, allowing users to activate elements by pressing the corresponding keys. The focus frame is not trapped within the card.
    </p>

    <BngCard v-bng-scoped-nav>
      <BngCardHeading>Behavior 2</BngCardHeading>
      <BngButton v-bng-on-ui-nav:action_2="e => sayHello('Button 2.1', e)" @click="() => sayHello('Button 2.1 click', e)">
        Button 2.1 action_2
        <BngBinding ui-event="action_2" controller />
      </BngButton>
      <BngButton v-bng-on-ui-nav:action_3="e => sayHello('Button 2.2', e)" @click="() => sayHello('Button 2.2 click', e)">
        Button 2.2 action_3
        <BngBinding ui-event="action_3" controller />
      </BngButton>
      <BngButton v-bng-on-ui-nav:action_4="e => sayHello('Button 2.3', e)" @click="() => sayHello('Button 2.3 click', e)">
        Button 2.3 action_4
        <BngBinding ui-event="action_4" controller />
      </BngButton>
    </BngCard>

    <BngDivider></BngDivider>

    <h3>Card Has Both Non-Bound and Bound Elements:</h3>
    <p>
      When a user navigates to such a card, the initial focus does not change the screen appearance. However, once the card is activated, keybindings are
      displayed and listened to. The focus frame is trapped within the card, and all active elements become selectable, providing a consistent user experience.
    </p>

    <BngCard v-bng-scoped-nav>
      <BngCardHeading>Behavior 3</BngCardHeading>
      <BngButton v-bng-on-ui-nav:ok.focusRequired="e => sayHello('Button 3.1', e)" @click="sayHello('Button 3.1 click', e)">Button 3.1</BngButton>
      <BngButton v-bng-on-ui-nav:action_2="e => sayHello('Button 3.2', e)" @click="sayHello('Button 3.2 click', e)">Button 3.2 action_2</BngButton>
      <BngButton v-bng-on-ui-nav:action_3="e => sayHello('Button 3.3', e)" @click="sayHello('Button 3.3 click', e)">Button 3.3 action_3</BngButton>
    </BngCard>

    <BngCard v-bng-scoped-nav>
      <BngCardHeading>Popups</BngCardHeading>
      <BngButton v-bng-on-ui-nav:ok.asMouse.focusRequired v-bng-popover:right.click="'popup1'">Popup Menu Item 1</BngButton>
      <BngButton v-bng-on-ui-nav:ok.asMouse.focusRequired v-bng-popover:right.click="'popup2'">Popup Menu Item 2</BngButton>
      <BngButton v-bng-on-ui-nav:ok.asMouse.focusRequired v-bng-popover:right.click="'popup3'">Popup Menu Item 3</BngButton>
    </BngCard>
  </div>

  <BngPopoverContent name="popup1">
    <BngButton @click="() => sayHello('Popup Button 1.1')">Popup Button 1.1</BngButton>
    <BngButton @click="() => sayHello('Popup Button 1.2')">Popup Button 1.2</BngButton>
    <BngButton @click="() => sayHello('Popup Button 1.3')">Popup Button 1.3</BngButton>
  </BngPopoverContent>

  <BngPopoverMenu name="popup2">
    <BngButton v-bng-on-ui-nav:ok.focusRequired="() => sayHello('Popup Button 2.1')">Popup Button 2.1</BngButton>
    <BngButton v-bng-on-ui-nav:ok.focusRequired="() => sayHello('Popup Button 2.2')">Popup Button 2.2</BngButton>
    <BngButton v-bng-on-ui-nav:ok.focusRequired="() => sayHello('Popup Button 2.3')">Popup Button 2.3</BngButton>
  </BngPopoverMenu>

  <BngPopoverMenu name="popup3">
    <BngButton v-bng-on-ui-nav:ok.focusRequired.asMouse @click="() => sayHello('Popup Button 3.1')">Popup Button 3.1</BngButton>
    <BngButton v-bng-on-ui-nav:ok.focusRequired.asMouse @click="() => sayHello('Popup Button 3.2')">Popup Button 3.2</BngButton>
    <BngButton v-bng-on-ui-nav:ok.focusRequired.asMouse @click="() => sayHello('Popup Button 3.3')">Popup Button 3.3</BngButton>
  </BngPopoverMenu>
</template>

<script setup>
import { BngBinding, BngButton, BngCard, BngCardHeading, BngDivider, BngPopoverContent, BngPopoverMenu } from "@/common/components/base"
import { vBngOnUiNav, vBngPopover, vBngScopedNav, vBngUiNavScroll } from "@/common/directives"
import { useInfoBar } from "@/services/infoBar.js"
import { SCOPED_NAV_TYPES } from "@/services/scopedNav"

const infobar = useInfoBar()
infobar.visible = true

function sayHello(name, event) {
  const msg = `Hello, ${name}!`
  console.log(msg, event)
  return true
}

function handleMenuClick(name, e) {
  console.log("handleMenuClick", name, e)
}
</script>

<style lang="scss" scoped>
.root-container {
  overflow-y: auto;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  margin-bottom: 5rem;
}
.styled-scoped-nav {
  &[data-scoped-nav-activated="true"] {
    .styled-label {
      color: green;
    }
  }
  &[data-scoped-nav-activated="false"] {
    .styled-label {
      color: red;
    }
  }
}
</style>
