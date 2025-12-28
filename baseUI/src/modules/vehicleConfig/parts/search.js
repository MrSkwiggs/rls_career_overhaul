import { ref, computed, isRef } from "vue"
import { SearchHistory } from "./searchHistory.js"
import { $translate } from "@/services"

const isOfficial = info => info.authors !== "BeamNG"

export default class PartsSearch {
  /** if search is active */
  active = false
  /** input search text */
  text = ref("")
  /** parsed search query */
  query = { }
  /** result message (no results or invalid validation) */
  message = ref("")
  /** search highlight */
  highlight = ref([])

  /** minimum search input length */
  minText = 3

  history = null

  currentConfig = []
  richPartInfo = []
  opts = { }

  constructor(currentConfig, richPartInfo, opts = null) {
    if (!isRef(currentConfig)) throw new Error("currentConfig must be ref")
    if (!isRef(richPartInfo)) throw new Error("richPartInfo must be ref")
    this.currentConfig = currentConfig
    this.richPartInfo = richPartInfo
    if (opts) this.opts = opts
    this.history = new SearchHistory(this)
    this.result = computed(() => this.generateResult())
    this.messages = { // cache for a bit of performance
      noResults: $translate.instant("ui.common.search.noResults"),
      tooShort: $translate.instant("ui.common.search.queryTooShort"),
      invalidFormat: $translate.instant("ui.common.search.invalidFormat"),
      unknownArgument: $translate.instant("ui.common.search.unknownArgument"),
    }
  }

  /** flat search result array */
  generateResult() {
    const queryArgs = this.parseQuery(isRef(this.text) ? this.text.value : this.text)
    this.query = queryArgs
    // console.log(this.query)
    this.highlight.value = queryArgs.highlight
    if (!queryArgs.good) {
      this.message.value = queryArgs.reason
      return {}
    }
    this.message.value = ""

    const res = {}
    const currentConfig = isRef(this.currentConfig) ? this.currentConfig.value : this.currentConfig
    let cnt = 0
    const dive = node => {
      if (!node.children) return
      for (const child of Object.values(node.children)) {
        const match = this.matchSlot(child)
        if (match.matched) {
          child.search = match
          // counter allows to have multiple matches for the same slot name, which is the case for modular parts
          res[child.slotName + "?" + ++cnt] = child
        }
        dive(child)
      }
    }
    dive(currentConfig)

    if (Object.keys(res).length > 0) {
      // update history if there are some results
      this.history.update()
    } else {
      this.message.value = this.messages.noResults
    }
    // console.log(res)
    return res
  }

  parseQuery(text) {
    const queryString = text.trim().toLowerCase().replace(/  +/g, " ")
    const queryArgs = { mode: "or", reason: "", highlight: [] }
    const ignoreKeys = Object.keys(queryArgs)

    if (queryString.length < this.minText) {
      queryArgs.reason = this.messages.tooShort
      queryArgs.good = false
      return queryArgs
    }

    if (queryString.indexOf(":") === -1) {
      // default: search all
      queryArgs.description = queryString
      queryArgs.name = queryString
      queryArgs.slot = queryString
    } else {
      // search by fields
      let parsedargs = 0
      const args = queryString.split(/[ ,]+/)
      for (const arg of args) {
        if (arg.indexOf(":") > -1) {
          const args2 = arg.split(/:/)
          if (args2.length === 2 && args2[1].trim() !== "") {
            queryArgs[args2[0]] = args2[1]
            parsedargs++
          } else {
            queryArgs.reason += this.messages.invalidFormat + `: ${arg}\n`
          }
        } else {
          queryArgs.reason += this.messages.unknownArgument + `: ${arg}\n`
        }
      }
      if (parsedargs > 1) queryArgs.mode = "and"
    }

    queryArgs.good = !queryArgs.reason
    // queryArgs.good = Object.entries(queryArgs).some(([key, value]) => !ignoreKeys.includes(key) && value.length >= this.minText)
    queryArgs.highlight = queryArgs.good ? Object.entries(queryArgs).filter(([key]) => !ignoreKeys.includes(key)).map(([_, value]) => value) : []

    return queryArgs
  }

  matchSlot(slot) {
    const opts = this.opts
    const query = this.query
    const queryMode = {
      or: (a, b) => a || b,
      and: (a, b) => a && b,
    }[query.mode]
    const queryOr = query.mode === "or"
    let matched = !queryOr
    const matchDetails = {
      slot: false,
      part: false,
      mod: false,
    }
    const info = isRef(this.richPartInfo) ? this.richPartInfo.value : this.richPartInfo

    // in past we also had fields "modName", "modTagLine", "modTitle". it seems they grew old enough and left us O_o

    const match = (string, query) => matched = queryMode(matched, (string ? string.toLowerCase() : "empty").indexOf(query) > -1)

    function* pairs() { // [type, string, query, isMod]
      if (query.name) yield ["slot", slot.chosenPartName, query.name]
      if (query.slot) yield ["slot", slot.slotName, query.slot]
      if (query.description) {
        const slotInfo = slot.parentSlotName ? info[slot.parentSlotName]?.slotInfoUi?.[slot.slotName] || {} : {}
        yield ["slot", slotInfo.description, query.description]
      }
      const part = slot.chosenPartName ? info[slot.chosenPartName] : null
      if (part) {
        if (query.description)              yield ["slot", part.description, query.description]
        if (query.author)                   yield ["slot", part.authors,     query.author,      !isOfficial(part)]
        if (query.mod && !isOfficial(part)) yield ["slot", part.description, query.mod,         true]
      } else {
        if (query.description)              yield ["slot", null,             query.description]
      }
      if (query.partname || query.description || query.mod || query.author) {
        for (const partNames of [
          slot.suitablePartNames,
          slot.unsuitablePartNames.map(({ partName }) => partName),
        ]) {
          for (const partName of partNames) {
            const part = info[partName]
            if (!part || !opts.showAux && part.isAuxiliary) continue
            if (query.partname)                         yield ["part", partName,         query.partname]
            if (query.description)                      yield ["part", part.description, query.description]
            if (query.author)                           yield ["part", part.authors,     query.author,     !isOfficial(part)]
            if (query.mod && part && !isOfficial(part)) yield ["part", part.description, query.mod,        true]
          }
        }
      }
    }

    let lastType
    for (const [type, string, query, isMod = false] of pairs()) {
      if (query && match(string, query)) {
        if (queryOr || lastType !== type) {
          matchDetails[type] = true
          if (isMod) matchDetails.mod = true
          break
        }
      }
      lastType = type
    }

    return {
      matched,
      matchedSlot: matchDetails.slot,
      matchedOptions: matchDetails.part,
      matchedMod: matchDetails.mod,
    }
  }

  onChange() {
    const text = isRef(this.text) ? this.text.value : this.text
    if (!this.active && text) this.start()
  }

  start() {
    this.active = true
  }

  stop() {
    this.active = false
    if (isRef(this.text)) {
      this.text.value = ""
    } else {
      this.text = ""
    }
    this.query = {}
    this.history.index = -1
  }
}
