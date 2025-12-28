import { useUiNavLabel } from "@/services/uiNavTracker"

let registry
const procEventNames = eventNames => eventNames.split(",").map(name => name.trim()).filter(Boolean)

export default {
  mounted(el, { arg: eventNames, value: label }) {
    if (!eventNames) {
      console.warn("Usage: v-bng-ui-nav-label:back,menu=\"'Back'\"")
      return
    }
    if (!registry) registry = useUiNavLabel()
    if (label) {
      eventNames = procEventNames(eventNames)
      registry.registerLabel(el, eventNames, label)
    }
  },

  updated(el, { arg: eventNames, value: label }) {
    if (!eventNames) return
    eventNames = procEventNames(eventNames)
    if (label) {
      registry.registerLabel(el, eventNames, label)
    } else {
      registry.clearLabels(el, eventNames)
    }
  },

  beforeUnmount(el) {
    const events = registry.getElementEvents(el)
    if (events.length > 0) registry.clearLabels(el, events)
  }
}
