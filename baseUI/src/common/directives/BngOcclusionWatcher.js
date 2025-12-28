import { nextTick } from "vue"
import { debounce } from "@/utils/rateLimit"
import { isVisibleFast, observePosition } from "@/utils/DOM"
// import { useBridge } from "@/bridge"
import { uniqueId } from "@/services/uniqueId"

const DELAY = 50
const elms = new Map()
const observer = new ResizeObserver(observed)
let initialised = false
// let setOcclusion = () => { }
// let resetOcclusion = () => { }
const setOcclusion = (id, ...metrics) => bngApi.engineLua(`if ui_apps_minimap_minimap then ui_apps_minimap_minimap.setOcclusionTransform("${id}", ${metrics.join(", ")}) end`)
const resetOcclusion = id => bngApi.engineLua(`if ui_apps_minimap_minimap then ui_apps_minimap_minimap.resetOcclusionTransform("${id}") end`)

function init() {
  if (initialised) return
  initialised = true
  // we can't use normal lua calls because we don't know if extension is loaded
  // const { lua } = useBridge()
  // setOcclusion = debounce(lua.ui_apps_minimap_minimap.setOcclusionTransform, DELAY)
  // resetOcclusion = debounce(lua.ui_apps_minimap_minimap.resetOcclusionTransform, DELAY)
  // lua.ui_apps_minimap_minimap.resetOcclusionTransform()
  bngApi.engineLua('if ui_apps_minimap_minimap then ui_apps_minimap_minimap.resetOcclusionTransform() end') // reset all
  const onResize = debounce(parent => nextTick(() => elms.entries().forEach(([elm, data]) => {
    if (!parent || !(parent instanceof HTMLElement) || parent.contains(elm)) {
      update(elm, data)
    }
  })), 10)
  window.removeEventListener("resize", onResize)
  if (!window.bngVue) window.bngVue = {}
  window.bngVue.updateOcclusion = onResize
}

function observed(entries) {
  for (const entry of entries) {
    if (elms.has(entry.target)) {
      update(entry.target)
    } else {
      // for safety
      observer.unobserve(entry.target)
    }
  }
}

function update(elm, data = undefined) {
  if (!data) data = elms.get(elm)
  if (!data) return
  if (isVisibleFast(elm)) {
    const screen = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    }
    const rect = elm.getBoundingClientRect()
    const metrics = {
      x: rect.left + screen.scrollX,
      y: rect.top + screen.scrollY,
      width: rect.width,
      height: rect.height,
    }
    data.set(
      data.id,
      metrics.x / screen.width,
      metrics.y / screen.height,
      metrics.width / screen.width,
      metrics.height / screen.height
    )
  } else {
    data.reset(data.id)
  }
}

export default {
  mounted: (el, { value }) => { // value is delay in ms
    if (!initialised) init()
    // remove old for safety
    const prevData = elms.get(el)
    if (prevData) {
      elms.delete(el)
      observer.unobserve(el)
      resetOcclusion(prevData.id)
    }
    // create new
    const data = {
      id: uniqueId("occlusion"),
      observe: () => !data.delayed && update(el),
      set: debounce(setOcclusion, DELAY),
      reset: debounce(resetOcclusion, DELAY),
    }
    observer.observe(el)
    data.posObserver = observePosition(el, data.observe)
    elms.set(el, data)
    // run
    if (typeof value === "number" && value > 0) {
      data.delayed = setTimeout(() => {
        delete data.delayed
        if (elms.has(el)) update(el, data)
      }, value)
    } else {
      update(el, data)
    }
  },

  updated: el => {
    const data = elms.get(el)
    if (data && !data.delayed) update(el, data)
  },

  beforeUnmount: el => {
    const data = elms.get(el)
    if (data) {
      if (data.delayed) clearTimeout(data.delayed)
      elms.delete(el)
      observer.unobserve(el)
      resetOcclusion(data.id)
    }
  },
}
