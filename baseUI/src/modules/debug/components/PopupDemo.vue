<template>
  <div>
    <div v-for="popup in popups">
      <BngButton @click="popup.open()">{{ popup.name }}</BngButton>
      <span v-if="popup.result">Result: {{ popup.result }}</span>
    </div>
    <br />
    <div>
      <BngButton @click="popupAll()">Open all (at once)</BngButton>
      <BngButton @click="popupAll(true)">Open all (sequential)</BngButton>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue"
import { BngButton, ACCENTS } from "@/common/components/base"
import { openMessage, openConfirmation, openExperimental, openPrompt, openProgress, fixedDelayPopup } from "@/services/popup"
import { $translate } from "@/services/translation"

const popups = reactive({
  message: {
    name: "Message",
    async open() {
      await openMessage(null, "Test message please ignore")
    },
  },
  prompt: {
    name: "Prompt",
    async open() {
      const res = await openPrompt("Enter some text:")
      popups.prompt.result = res.toString()
    },
  },
  progressWithButtons: {
    name: "Progress with cancel button (indeterminate)",
    async open() {
      await openProgress("Please wait...", "", {
        cancellable: true,
        indeterminate: true,
        timeout: 5,
        buttons: [
          { label: $translate.instant("ui.common.cancel"), value: false, extras: { accent: ACCENTS.secondary, cancel: true } }
        ],
      })
    },
  },
  progress: {
    name: "Progress (indeterminate) (no cancel)",
    async open() {
      await openProgress("Please wait...", "", {
        indeterminate: true,
        timeout: 5,
      })
    },
  },
  progressFake: {
    name: "Progress (time countdown)",
    async open() {
      await fixedDelayPopup(5, { title: "Doing Things" })
    },
  },
  message_title: {
    name: "Message, with title",
    async open() {
      await openMessage("Test", "Test message please ignore")
    },
  },
  confirm: {
    name: "Confirmation, with title",
    result: "",
    async open() {
      const res = await openConfirmation("Test", "Test confirmation please ignore")
      popups.confirm.result = res.toString()
    },
  },
  confirmWithComponent: {
    name: "Confirmation, with component content",
    result: "",
    async open() {
      const res = await openConfirmation("", { component: BngButton, props: { label: "Hello" } })
      popups.confirm.result = res.toString()
    },
  },
  experimental: {
    name: "Experimental confirmation",
    result: "",
    async open() {
      const res = await openExperimental("Experimental test", "Experimental-style confirmation...<br/>...please ignore", [
        { label: $translate.instant("ui.common.no"), value: false, extras: { accent: ACCENTS.secondary, cancel: true } },
        { label: $translate.instant("ui.career.experimentalAgree"), value: true, extras: { default: true } },
      ])
      popups.experimental.result = res && res.toString()
    },
  },
})

async function popupAll(doAsync) {
  for (const popup of Object.values(popups)) {
    console.log(`Opening "${popup.name}"`)
    if (doAsync) await popup.open()
    else popup.open()
  }
}
</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./PopupDemo.vue?raw"
export default {
  source,
  title: "TODO - Friendly name",
  description: `TODO - Description of special demo`,
  propInfo: [],
  attrInfo: [],
}

</script>