// Manage blurred background areas of the UI
import { lua } from '../index.js'

const LUA_BLUR_EXTENSION = 'ui_gameBlur'

let highestId = 0
const blurRegionList = {}

const
  sendBlurListToLua = () => lua.extensions[LUA_BLUR_EXTENSION].replaceGroup("uiBlur", blurRegionList),
  getNextAvailableId = () => (highestId < Number.MAX_SAFE_INTEGER ? highestId++ : (highestId = 0)).toString()

const
  LUA_BLUR_UNLOADED = 0,
  LUA_BLUR_LOADING = 1,
  LUA_BLUR_LOADED = 2
let blurLoadedState = LUA_BLUR_UNLOADED

function applyBlur() {
  // check form window.beamng here so as not to cause error when working outside of game
  if (!window.beamng || !window.beamng.ingame) return

  // we're loading blur extension
  if (blurLoadedState === LUA_BLUR_LOADING) return

  const isEmpty = !Object.keys(blurRegionList).length

  if (blurLoadedState === LUA_BLUR_UNLOADED) {
    if (!isEmpty) {
      // not loaded, and not empty - load and then apply
      blurLoadedState = LUA_BLUR_LOADING
      lua.extensions.load(LUA_BLUR_EXTENSION).then(() => {
        blurLoadedState = LUA_BLUR_LOADED
        // might want to check if empty here again and unload if necessary
        sendBlurListToLua()
      })
    }
  } else {
    if (isEmpty) {
      // unload if it's loaded and empty
      // might be thread unsafe if load gets called right away
      lua.extensions.unload(LUA_BLUR_EXTENSION)
      blurLoadedState = LUA_BLUR_UNLOADED
    } else {
      // send blur areas if loaded and not empty
      sendBlurListToLua()
    }
  }
}

export default {

  register(coord) {
    if (coord === undefined) throw new Error('Cannot register bng-blur with coordinates: ' + coord)
    const id = getNextAvailableId()
    blurRegionList[id] = coord
    applyBlur()
    return id
  },

  unregister(id) {
    if (id in blurRegionList) {
      delete blurRegionList[id]
      applyBlur()
    }
  },

  update(id, coord) {
    if (!(id in blurRegionList)) throw new Error(`Trying to update bng-blur with an ID that is not registered: ${id} (of ${Object.keys(blurRegionList)})`)
    blurRegionList[id] = coord
    applyBlur()
  }

}
