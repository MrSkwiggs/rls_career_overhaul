import { ref } from "vue"
import { defineStore } from "pinia"
import { roundDec, round } from "@/utils/maths"
import { useBridge } from "@/bridge"

export const useTuningStore = defineStore("tuning", () => {
  const { lua, events } = useBridge()

  // States
  const buckets = ref({})
  const tuningVariables = ref({})
  let editedTuningVars = {}

  let isCareer = false
  const shoppingData = ref({})

  const noapi = () => {
    throw new Error("Tuning store must be initialised first")
  }
  let api = {
    request: noapi,
    apply: noapi,
    reset: noapi,
    close: () => {},
    menuClose: () => {},
  }

  async function init() {
    editedTuningVars = {}
    // detect if we're in career
    isCareer = await lua.career_career.isActive()
    if (isCareer) {
      // career api
      api.request = async () => processTuningData(await lua.career_modules_tuning.getTuningData())
      api.apply = (values, edited) => {
        const res = {}
        for (const [varName, _] of Object.entries(edited)) {
          res[varName] = valDisToVal(values[varName])
        }
        lua.career_modules_tuning.apply(res)
      }
      api.reset = () => {}
      api.close = () => {
        events.off("sendTuningShoppingData", setShoppingData)
        events.off("updateTuningVariable", updateTuningVariable)
        shoppingData.value = {}
      }

      events.on("sendTuningShoppingData", setShoppingData)
      events.on("updateTuningVariable", updateTuningVariable)
    } else {
      // normal api
      api.request = async () => await lua.extensions.core_vehicle_partmgmt.sendDataToUI()
      api.apply = (values, edited) => {
        const res = {}
        for (const varName in values) {
          res[varName] = valDisToVal(values[varName])
        }
        lua.extensions.core_vehicle_partmgmt.setConfigVars(res)
      }
      api.reset = async () => await lua.extensions.core_vehicle_partmgmt.resetVarsToLoadedConfig()
      api.close = () => {
        events.off("VehicleFocusChanged", api.request)
        events.off("VehicleConfigChange", processTuningData)
      }
      api.menuClose = api.close
      // add event listeners if out of career
      events.on("VehicleFocusChanged", api.request)
      events.on("VehicleConfigChange", processTuningData)
    }
    // remove undefined
    for (const name in api) {
      if (api[name] === noapi) api[name] = () => {}
    }
  }

  // Actions
  function apply() {
    api.apply(tuningVariables.value, editedTuningVars)
    editedTuningVars = {}
  }

  function setShoppingData(data) {
    shoppingData.value = data
  }

  function updateTuningVariable(tuningVar) {
    tuningVariables.value[tuningVar.name].valDis = Number(valToValDis(tuningVar))
  }

  const processTuningData = data => {
    // non-career data compatibility
    if (data.variables) data = data.variables

    if (isCareer) {
      // these are deleted explicitly for now. in the future these should have specific flags to hide them here
      delete data["$fuel"]
      delete data["$fuel_R"]
      delete data["$fuel_L"]
    }

    /* buckets structure:
      [
        {
          name: "category",
          items: [
            {
              name: "subcategory",
              items: [
                ...variables data as objects...
              ],
            },
            ...
          ],
        },
        ...
      ]
    */
    buckets.value = []
    tuningVariables.value = {}

    for (const varData of Object.values(data)) {
      // skip cargo box weight or otherwise hidden sliders
      if ((isCareer && (varData.category === "Cargo")) || varData.hideInUI) continue

      if (!varData.category) varData.category = "Other"
      if (!varData.subCategory) varData.subCategory = "Other"

      // create the buckets and put the variable data in
      const cat = (buckets.value.find(cat => cat.name === varData.category) || buckets.value[buckets.value.push({ name: varData.category, items: [] }) - 1])
        .items
      const list = (cat.find(sub => sub.name === varData.subCategory) || cat[cat.push({ name: varData.subCategory, items: [] }) - 1]).items

      // TODO: same object as the one in tuningData. might be better to clone this
      // if data manipulation is needed and only copy needed properties by template
      list.push(varData)

      tuningVariables.value[varData.name] = {
        valDis: Number(valToValDis(varData)),
        minDis: varData.minDis,
        maxDis: varData.maxDis,
        min: varData.min,
        max: varData.max,
        default: Number(valToValDis(varData, true)),
      }
    }

    // sort everything
    const sorter = (a, b) => a.name.localeCompare(b.name)
    buckets.value.sort(sorter)
    for (const cat of buckets.value) {
      cat.items.sort(sorter)
      for (const sub of cat.items) {
        sub.items.sort(sorter)
      }
    }
  }

  // https://stackoverflow.com/q/17369098
  function countDecimals(num) {
    if (typeof num !== "number" || ~~num === num) return 0
    return num.toString().split(".")[1].length || 0
  }

  function valToValDis(varData, useDef = false) {
    const vData = ((useDef ? varData.default : varData.val) - varData.min) / (varData.max - varData.min)
    return roundDec(round(vData * (varData.maxDis - varData.minDis), varData.stepDis) + varData.minDis, countDecimals(varData.stepDis))
  }

  function valDisToVal(varData) {
    const vData = (varData.valDis - varData.minDis) / (varData.maxDis - varData.minDis)
    return vData * (varData.max - varData.min) + varData.min
  }

  function tuningVarChanged(varName) {
    editedTuningVars[varName] = true
  }

  return {
    init,
    buckets,
    tuningVariables,
    shoppingData,
    apply,
    requestInitialData: () => api.request(),
    close: () => api.close(),
    notifyOnMenuClosed: () => api.menuClose(),
    tuningVarChanged,
    resetTuningData: () => api.reset(),
  }
})
