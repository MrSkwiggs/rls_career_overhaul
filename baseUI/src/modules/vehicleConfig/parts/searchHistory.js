import { isRef } from "vue"

export class SearchHistory {
  list = []
  index = -1
  browsing = false
  saveKey = "partSearchHistory"

  constructor(search) {
    this.search = search
    this.load()
  }

  load() {
    const res = localStorage.getItem(this.saveKey)
    if (res) this.list = JSON.parse(res) || []
  }

  save() {
    localStorage.setItem(this.saveKey, JSON.stringify(this.list))
  }

  update() {
    if (this.search.query.length === 0) return
    // add to search history
    const text = (isRef(this.search.text) ? this.search.text.value : this.search.text).trim().replace(/  +/g, " ")
    const textLC = text.toLowerCase()
    // existing entry
    let idx = this.list.findIndex(txt => textLC === txt.toLowerCase())
    if (idx > -1) {
      this.index = idx
      return
    }
    // removing chars do not change the history
    idx = this.list.findIndex(txt => txt.toLowerCase().startsWith(textLC))
    if (idx > -1) {
      return
    }
    // but adding chars - do
    idx = this.list.findIndex(txt => textLC.startsWith(txt.toLowerCase()))
    if (idx > -1) {
      this.list[idx] = text
      this.index = idx
    } else {
      this.index = this.list.length
      this.list.push(text)
    }
    this.save()
    // console.log("Search history:", [...this.list])
  }

  onKeyDown(event) {
    // console.log("Search onKeyDown: ", event)
    if (this.list.length === 0) return
    switch (event.key) {
      case "ArrowUp":
        this.browsing = true
        this.index--
        break
      case "ArrowDown":
        this.browsing = true
        this.index++
        break
      case "k":
        if (event.ctrlKey) {
          console.log("Search history cleaned")
          localStorage.removeItem("partSearchHistory")
          this.list = []
          this.index = 0
          event.preventDefault()
        } else {
          return
        }
      default:
        if (!event.ctrlKey) {
          this.browsing = false
        }
        return
    }
    if (this.browsing) {
      this.index = Math.abs(this.index + this.list.length) % this.list.length
      this.search.text = this.list[this.index]
    }
    event.preventDefault()
  }
}
