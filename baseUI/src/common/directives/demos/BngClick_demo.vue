<template>
  <div bng-ui-scope="click_demo">
    <p class="desc sticky">
      <template v-if="eventType"> '{{ eventType }}' callback fired - {{ count }} </template>
      <template v-else> No event </template>
    </p>
    <div class="sample">
      <BngButton v-bng-click="clickEvent">Click</BngButton>
      <p v-html="`v-bng-click='clickEvent'`"></p>
    </div>
    <div class="sample">
      <BngButton v-bng-click="{ clickCallback: clickEvent }">Click</BngButton>
      <p v-html="`v-bng-click='{ clickCallback: clickEvent }'`"></p>
    </div>
    <div class="sample">
      <BngButton v-bng-click.hold="holdEvent">Hold</BngButton>
      <p v-html="`v-bng-click.hold`"></p>
    </div>
    <div class="sample">
      <BngButton v-bng-click.hold.controller="holdEvent">Hold (controller only)</BngButton>
      <p v-html="`v-bng-click.hold.controller`"></p>
    </div>
    <div class="sample">
      <BngButton v-bng-click="{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 400 }"> Hold </BngButton>
      <p v-html="`v-bng-click='{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 400 }'`"></p>
    </div>
    <p class="desc">
      Examples below show how we can visualise the 'hold' behaviour using the <code>show-hold</code> attribute on our normal buttons
    </p>
    <div class="sample">
      <BngButton
        show-hold
        v-bng-on-ui-nav:ok.asMouse
        v-bng-click="{ clickCallback: clickEvent, holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 400 }">
        Click & Hold
      </BngButton>
      <p v-html="`v-bng-click='{ clickCallback: clickEvent, holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 400 }'`"></p>
    </div>
    <div class="sample">
      <BngButton
        disable
        :accent="ACCENTS.main"
        show-hold
        v-bng-on-ui-nav:ok.asMouse
        v-bng-click="{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 0 }">
        Hold (No repeat, also works with button A on controller)
      </BngButton>
      <p v-html="`v-bng-click='{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 0 }'`"></p>
    </div>
    <div class="sample">
      <BngButton
        :accent="ACCENTS.secondary"
        show-hold
        v-bng-on-ui-nav:ok.asMouse.modified
        v-bng-click="{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 0 }">
        Hold (No repeat, also works with modified button A on controller)
      </BngButton>
      <p v-html="`v-bng-click='{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 0 }'`"></p>
    </div>
    <div class="sample">
      <BngButton
        :accent="ACCENTS.text"
        show-hold
        v-bng-on-ui-nav:ok.asMouse.focusRequired
        v-bng-click="{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 0 }">
        Hold (No repeat, also works with button A on controller - with focus only)
      </BngButton>
      <p v-html="`v-bng-click='{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 0 }'`"></p>
    </div>
    <div class="sample">
      <BngButton
        :accent="ACCENTS.outlined"
        show-hold
        v-bng-on-ui-nav:ok.asMouse.modified.focusRequired
        v-bng-click="{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 0 }">
        Hold (No repeat, also works with modified button A on controller - with focus only)
      </BngButton>
      <p v-html="`v-bng-click='{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 0 }'`"></p>
    </div>
    <div class="sample">
      <BngButton :accent="ACCENTS.attention" show-hold v-bng-on-ui-nav:ok.asMouse v-bng-click="{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 0 }">
        Hold (No repeat, also works with button A on controller)
      </BngButton>
      <p v-html="`v-bng-click='{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 0 }'`"></p>
    </div>
    <div class="sample">
      <BngButton
        :accent="ACCENTS.outlined"
        show-hold
        hold-vertical
        v-bng-on-ui-nav:ok.asMouse.modified.focusRequired
        v-bng-click="{ holdCallback: holdEvent, holdDelay: 1000, repeatInterval: 0 }">
        Vertical<br />
        hold<br />
        button
      </BngButton>
      <p v-html="`hold-vertical`"></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { vBngClick, vBngOnUiNav } from "@/common/directives"
import { BngButton, ACCENTS } from "@/common/components/base"
import { useUINavScope } from "@/services/uiNav"

useUINavScope("click_demo")

const count = ref(0),
  eventType = ref(""),
  doAction = currentEvent => e => {
    console.log("doAction", currentEvent, e)
    if (eventType.value && eventType.value !== currentEvent) {
      count.value = 1
      eventType.value = currentEvent.value
    } else {
      count.value++
    }
    eventType.value = currentEvent
  },
  clickEvent = doAction("click"),
  holdEvent = doAction("hold")
</script>

<style scoped>
button + p {
  color: #888;
  font-size:80%;
}
div p {
  margin: auto 0;
}
p.desc {
  margin-top:1em;
  margin-bottom:1em;
}
p.sticky {
  position: sticky;
  top: -1em;
  z-index: 1000;
  background: #000;
  padding: 0.5em;
  border: 1px solid #333;
  border-radius: var(--bng-corners-2);
  margin-left: -0.5em;
}
div.sample {
  display: flex;
  gap: 1em;
  margin-bottom:0.5em;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./BngClick_demo.vue?raw"
export default {
  source,
  title: "TODO - Friendly name",
  description: `TODO - Description of directive`,
  propInfo: [],
  attrInfo: [],
}

</script>
