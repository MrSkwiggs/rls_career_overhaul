// Take care with import paths here as this file is also going to be imported outside of a bundler (by the original code)
// !!! ALWAYS test new imports with vehicle dashboards !!!

import { BeamNGAPI, StreamManager, UIUnits, Hooks, Lua, GameBlurrer } from "./libs/index.js"
// import StreamCoordinator from "./coordinator/index.js"
import StreamCoordinator from "./coordinator/lite.js"

// Dependencies - need to pass in from outside
let dependencies

// Provide a bridge to the game engine
let bridge

export { Lua as lua }
export { GameBlurrer as gameBlurrer }

export const useBridge = () => {
  if (bridge) return bridge
  if (window.bridge) return (bridge = window.bridge)

  const events = new dependencies.Emitter() //|| new EventBus(emitter)

  const coordinator = new StreamCoordinator(events)
  Hooks.setStreamCoordinator(coordinator)

  const api = dependencies.overrideAPI || new BeamNGAPI(events, dependencies.beamng)

  bridge = {
    api,
    lua: Lua,
    events,
    streams: new StreamManager(api),
    coordinator,
    hooks: Hooks,
    units: new UIUnits(events, api),
    gameBlurrer: GameBlurrer,
    beamNG: dependencies.beamng,
    // uiNavService is added in main.js
  }

  return bridge
}

export const setBridgeDependencies = deps => (dependencies = deps)
