// Handlers and associated tooling for window hooks

const handlers = {}
let streamCoordinator

// These two functions are called from \ui\entrypoints\comms.js
window.streamUpdate = data => _runHandlers("stream", data)
window.multihookUpdate = hooksData => {
  for (const i in hooksData) {
    const hook = hooksData[i]
    trigger(hook[0], hook[1])
  }
}

// This is called from \ui\entrypoints\comms.js and is available globally at window.HookManager
// and on the bridge at .hooks.trigger
window.HookManager = { trigger }

// Default Handlers ============================================

// Streams --------------------------------
let skippedStreamUpdate = null
const streamUpdateHandler = function (data) {
  if (streamCoordinator?.processing) {
    console.log("ERROR: streamUpdate cycle is already active, skipping this update of streams")
    skippedStreamUpdate = data
    return
  }
  skippedStreamUpdate = null

  // TODO: use new format
  // FOR NOW: merge them all :D
  //console.log("streamUpdate", data)
  let oldFormat = {}
  if (data.globalStreams) {
    for (let sn in data.globalStreams) {
      oldFormat[sn] = data.globalStreams[sn]
    }
  }
  if (data.vehicleStreams && data.vehicleStreams["player_0"]) {
    for (let sn in data.vehicleStreams["player_0"]) {
      oldFormat[sn] = data.vehicleStreams["player_0"][sn]
    }
  }
  //console.log("got streams: ", arguments, "converting to old format for now: ", oldFormat)

  // start coordinator (sets up a marker and safety guard, not really doing anything extra)
  streamCoordinator?.beforeBroadcast()

  // broadcast the data
  window.globalAngularRootScope?.$broadcast("streamsUpdate", oldFormat)
  window.vueEventBus?.emit("onStreamsUpdate", oldFormat)
  if (window.vueGlobalStore) window.vueGlobalStore["streams"] = oldFormat

  // this adds tailing jobs to track the completion of defer jobs
  // after everything is done, it will run the provided callback
  streamCoordinator?.afterBroadcast(() => {
    if (!streamCoordinator.processing && skippedStreamUpdate) {
      // run streamUpdate with previously skipped data
      streamUpdateHandler(skippedStreamUpdate)
    }
  })
}
add("streamMain", streamUpdateHandler, "stream")

// Hooks ------------------------------------
const mainHookHandler = function (hookName, args) {
  if (args && !Array.isArray(args)) {
    console.error(
      "HookManager.trigger unsupported arguments (needs to be a list): " + JSON.stringify(hookName) + " - " + JSON.stringify(args).substring(0, 30) + " ... "
    )
  }
  window.vueEventBus?.emit(hookName, ...args)
  window.globalAngularRootScope?.$broadcast(hookName, ...args)
}

add("hooksMain", mainHookHandler)

// ============================================

function add(id, func, type = "hook") {
  if (!handlers[type]) handlers[type] = {}
  handlers[type][id] = func
}

function remove(id, type = "hook") {
  if (handlers[type]) delete handlers[type][id]
}

function trigger(hookName, args) {
  _runHandlers("hook", hookName, args)
}

function _runHandlers(type, ...data) {
  if (handlers[type]) {
    const toRun = Object.values(handlers[type])
    toRun.length && toRun.forEach(f => f(...data))
  }
}

export default {
  add,
  remove,
  trigger,
  setStreamCoordinator(manager) {
    streamCoordinator = manager
  },
}
