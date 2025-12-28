import { onBeforeUnmount } from "vue"
import { useBridge } from "@/bridge"


export const useEvents = (onDispose = onBeforeUnmount) => {
  const bridge = useBridge()
  const events = {
    _on: {},
    _once: {},

    on(name, func) {
      if (!(name in events._on)) {
        events._on[name] = []
      }
      // we can't allow the same function to keep it simple
      if (events._on[name].indexOf(func) === -1) {
        bridge.events.on(name, func)
        events._on[name].push(func)
      }
    },

    once(name, func) {
      if (!(name in events._once)) {
        events._once[name] = []
      }
      // we can't allow the same function to keep it simple
      if (events._once[name].indexOf(func) === -1) {
        bridge.events.once(name, () => {
          const idx = events._once[name].indexOf(func)
          idx > -1 && events._once[name].splice(idx, 1)
        })
        bridge.events.once(name, func)
        events._once[name].push(func)
      }
    },

    off(name = undefined, func = undefined) {
      // no name, assume full cleanup
      if (!name) {
        for (const name in events._on) {
          for (const func of events._on[name]) {
            bridge.events.off(name, func)
          }
          delete events._on[name]
        }
        return
      }
      // name not found, do nothing
      if (!(name in events._on)) {
        return
      }
      if (func) {
        // name and function specified, remove this specific listener only
        const idx = events._on[name].indexOf(func)
        if (idx > -1) {
          bridge.events.off(name, func)
          events._on[name].splice(idx, 1)
        }
        if (events._on[name].length === 0)
          delete events._on[name]
      } else {
        // only name specified, remove all listeners by this name
        for (const func of events._on[name]) {
          bridge.events.off(name, func)
        }
        delete events._on[name]
      }
    },

    emit(name, ...values) {
      bridge.events.emit(name, ...values)
    },
  }

  onDispose(() => {
    for (const type of ["_on", "_once"]) {
      for (const name in events[type]) {
        for (const func of events[type][name]) {
          bridge.events.off(name, func)
        }
        delete events[type][name]
      }
    }
  })

  return events
}


export const useStreams = (names, callback, onDispose = onBeforeUnmount) => {
  const bridge = useBridge()
  let enabled = false

  const streams = {
    on() {
      if (enabled) return
      enabled = true
      // StreamManager has a built-in system to track multiple consumers, so we don't need to track anything here
      bridge.streams.add(names)
      bridge.events.on("onStreamsUpdate", callback)
    },

    off() {
      if (!enabled) return
      enabled = false
      bridge.streams.remove(names)
      bridge.events.off("onStreamsUpdate", callback)
    }
  }

  streams.on()
  onDispose(streams.off)

  return streams
}
