import { lua } from "@/bridge"
import { debounce } from "@/utils/rateLimit"

export default class LicensePlate {
  skip = false
  text = ""
  options = false

  constructor(options = {}) {
    this.options = options
    this.settingsChanged()
    this.update()
  }

  async settingsChanged() {
    this.skip = await lua.settings.getValue("SkipGenerateLicencePlate")
  }

  update() {
    bngApi.engineLua("core_vehicles.getVehicleLicenseText(getPlayerVehicle(0))", str => this.text = str)
  }

  applyDebounced = debounce(() => {
    this.options.autoApply && this.apply()
  }, 500)

  apply() {
    this.applyDebounced.cancel()
    lua.core_vehicles.setPlateText(this.text)
  }

  applyRandom() {
    bngApi.engineLua(`core_vehicles.setPlateText(core_vehicles.regenerateVehicleLicenseText(getPlayerVehicle(0)),nil,nil,nil)`)
    this.update()
  }
}
