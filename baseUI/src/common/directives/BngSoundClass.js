// BngSoundClass Directive - allows elements to have 'sound classes'

import { nextTick } from "vue"
import { lua } from "@/bridge"

const ID = "__bngSound"
const ID_STOP = "__bngSoundStop"
// note: nextTick and ID_STOP is here to be able to catch click event on a disappearing element
//       because vue cleans up events a bit early

const events = {
  // real_event: "event_in_sound_class"
  click: "click",
  // mousedown: "click",
  dblclick: "dblclick",
  focus: "focus",
  mouseenter: "mouseenter",
}

function handler(ev) {
  // TODO: prevent hovering sound when sound-enabled element appears below the mouse cursor

  const el = ev.currentTarget
  if (el) {
    if (el[ID] && events[ev.type]) {
      lua.ui_audio.playEventSound(el[ID], events[ev.type])
    }
    if (el[ID_STOP]) {
      delete el[ID_STOP]
      delete el[ID]
      for(const event in events) {
        el.removeEventListener(event, handler)
      }
    }
  }
}

export default {
  mounted: (el, binding) => {
    delete el[ID_STOP]
    el[ID] = binding.value
    nextTick(() => {
      for(const event in events) {
        el.addEventListener(event, handler)
      }
    })
  },
  updated: (el, binding) => {
    el[ID] = binding.value
  },
  unmounted: el => {
    el[ID_STOP] = true
  },
}
