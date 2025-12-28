<template>
  Total clicks: {{ clickCount }}
  <div>
    <h3>Simple BngButton in various accents</h3>
    <div class="buttons">
      <BngButton :disabled="disabled" tabindex="1" :show-hold="true" @click="clickHandler">Test button</BngButton>
      <BngButton class="allcaps" :disabled="disabled" tabindex="1" :accent="ACCENTS.secondary" :icon-left="icons.bus" @click="clickHandler"
        >secondary button</BngButton
      >
      <BngButton class="large allcaps" :disabled="disabled" tabindex="1" :accent="ACCENTS.attention" :icon-right="icons.bus" @click="clickHandler"
        >attention button</BngButton
      >
      <BngButton :disabled="disabled" tabindex="1" :accent="ACCENTS.text" @click="clickHandler"><b>Test text button</b></BngButton>
      <BngButton :icon="icons.bus" :disabled="disabled" tabindex="1" :accent="ACCENTS.outlined" @click="clickHandler" label="Outlined button" />

      <BngButton tabindex="1" @click="disableButtons">toggle disabled</BngButton>
    </div>
  </div>
  <div>
    <h3>Icon-only BngButton</h3>
    <div class="buttons">
      <BngButton :disabled="disabled" tabindex="1" :accent="ACCENTS.secondary" :icon-left="icons.bus" @click="clickHandler"></BngButton>
      <BngButton :disabled="disabled" tabindex="1" :accent="ACCENTS.attention" :icon-right="icons.bus" @click="clickHandler"></BngButton>
      <BngButton :icon="icons.bus" :disabled="disabled" tabindex="1" :accent="ACCENTS.outlined" @click="clickHandler"></BngButton>
    </div>
  </div>
  <div>
    <h3>BngButton with complex content</h3>
    <div class="buttons">
      <BngButton class="recovery-option" :disabled="disabled" tabindex="1" :accent="ACCENTS.secondary" @click="clickHandler">
        <BngIcon class="recovery-icon" :type="icons.carToWheels" />
        <span class="label">Flip upright</span>
        <BngDivider />
        <BngUnit :money="1234.33" />
      </BngButton>
      <BngButton class="recovery-option" :disabled="disabled" tabindex="1" :accent="ACCENTS.outlined" @click="clickHandler">
        <BngIcon class="recovery-icon" :type="icons.road" />
        <span class="label">Tow to nearest road</span>
        <BngDivider />
        <BngUnit :money="1234.33" />
      </BngButton>
      <BngButton class="recovery-option" :disabled="disabled" tabindex="1" :accent="ACCENTS.outlined" @click="clickHandler">
        <BngIcon class="recovery-icon" :type="icons.toGarage" />
        <span class="label">Tow to nearest garage</span>
        <BngDivider />
        <BngUnit :money="1234.33" />
      </BngButton>
      <BngButton class="recovery-option" :disabled="disabled" tabindex="1" :accent="ACCENTS.outlined" @click="clickHandler">
        <BngIcon class="recovery-icon" :type="icons.toGarage" />
        <span class="label">Cancel</span>
        <BngDivider />
        <BngUnit :money="1234.33" />
      </BngButton>
    </div>
  </div>
</template>

<script setup>
import { BngButton, ACCENTS, BngDivider, BngIcon, BngUnit, icons } from "@/common/components/base"
import { ref } from "vue"

let disabled = ref(false)
const clickCount = ref(0)

function clickHandler() {
  clickCount.value++
}
function disableButtons() {
  disabled.value = !disabled.value
}
</script>

<style lang="scss" scoped>
.bng-button {
  margin-bottom: 1em;
}
.buttons {
  display: flex;
  align-items: flex-start;
  flex-flow: row wrap;
  & > :not(:last-child) {
    margin-right: 0.5em;
  }
}

.recovery-option {
  align-items: baseline;
  font-size: 1em;
  flex: 0 0 auto;
  &.tile {
    align-items: center;
    & > .label {
      padding: 0 0.25em 0.5em 0.25em;
    }
    & > .units {
      padding: 0.5em 0.25em 0 0.25em;
      display: block;
    }
  }

  .vertical-divider {
    margin-top: 0;
    margin-bottom: 0;
  }

  .units {
    display: inline-flex;
    align-items: baseline;
  }

  & > .label {
    flex: 1 1 auto;
  }

  .recovery-icon {
    font-size: 2em;
  }

  .units-icon {
    transform: translateY(0.05em);
  }

  :deep(.info-item) {
    padding-top: 0;
    padding-bottom: 0;
    padding-right: 0.25em;

    & .with-icon {
      padding-left: 1.5em;
    }
    & > .icon {
      left: 0;
      top: -0.125em;
    }
  }
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngButton_demo.vue?raw"
export default {
  source,
  title: "Simple button",
  description: `Shows a simple button with a defined style (accent). These accent values can be imported/used like so:

    <script>
      import { ACCENTS } from "@/common/components/base"
      const myAccent = ACCENTS.primary
    <\/script>
`,
  propInfo: [
    {
      name: "accent",
      type: "String",
      desc: "Accent(style) for the button. Should be one of: `main`, `secondary`, `outlined`, `text`, `attention`",
    },
    {
      name: "iconLeft",
      type: "Object/String",
      desc: "Icon to show on left side of button, is passed to internal `BngIcon`",
    },
    {
      name: "iconRight",
      type: "Object/String",
      desc: "Icon to show on right side of button, is passed to internal `BngIcon`",
    },
    {
      name: "label",
      type: "String",
      desc: "Text for the button (can also be passed as the content of the tag)",
    },
    {
      name: "icon",
      type: "Object/String",
      desc: "Synonym for `iconLeft`",
    },
    {
      name: "showHold",
      type: "Boolean",
      desc: "Switch on 'hold' visualisation if a click and hold is set up with the `vBngClick` directive",
    },
    {
      name: "holdVertical",
      type: "Boolean",
      desc: "Specifies if the 'hold' visualisation should be vertical",
    },
  ],
  attrInfo: [
    {
      name: "oldIcons",
      type: "n/a",
      desc: "If attrib is present, `BngOldIcon` will be used for the icons instead of `BngIcon`",
    },
  ],
}

</script>
