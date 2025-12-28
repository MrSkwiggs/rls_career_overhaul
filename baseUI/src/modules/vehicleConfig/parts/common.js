const rgxWheel = /^(\d+(?:\.\d+)?)(x)(\d+(?:\.\d+)?)/i
const rgxTire = /^(\d+(?:\.\d+)?)(\/)(\d+(?:\.\d+)?)(R)(\d+(?:\.\d+)?)/i
const rgxNum = /(^| )(\d+)($| )/
const zeroPad = num => String(~~(+num * 1000)).padStart(10, "0")

export function partOptionSorter(...ab) {
  // NOTE: do not trim spaces at start as it used for custom sorting in some mods
  const cmp = ["", ""]
  for (let i = 0; i < 2; i++) {
    const label = ab[i].label
    if (typeof label !== "string") return 0
    if (rgxWheel.test(label)) {
      // parse wheel sizes: "4x12 wheel" translates to "0000004x0000012 wheel"
      cmp[i] = label.replace(rgxWheel, (_, a, s, b) => [a, b].map(zeroPad).join("x"))
    } else if (rgxTire.test(label)) {
      // parse tire sizes: "200/60R15 tire" translates to "0000200x0000060x0000015 tire"
      cmp[i] = label.replace(rgxTire, (_, a, s1, b, s2, c) => [a, b, c].map(zeroPad).join("x"))
    } else if (rgxNum.test(label)) {
      cmp[i] = label.replace(rgxNum, (_, a, num, b) => a + zeroPad(num) + b)
    } else {
      cmp[i] = label
    }
    if (label.startsWith("40x4")) console.log(cmp[i])
  }
  return cmp[0].localeCompare(cmp[1])
}

export function partOptionGrouper(list) {
  const seq = []
  const groups = {}
  let grouping = false
  for (const itm of list) {
    let group
    const match = itm.label.match(rgxWheel) || itm.label.match(rgxTire)
    if (match && match.length > 0) {
      group = match.slice(1).map(s => s === "R" ? s : s + " ").join("").trim()
    } else {
      group = itm.label
    }
    if (!groups[group]) {
      groups[group] = []
      seq.push(group)
    } else {
      grouping = true
    }
    groups[group].push(itm)
  }
  if (!grouping) return list
  const res = []
  for (const group of seq) {
    const list = groups[group]
    if (list.length === 1) {
      res.push(...list)
    } else {
      res.push({ label: group, group: true })
      res.push(...list.map(itm => ({ ...itm, grouped: true })))
    }
  }
  return res
}
