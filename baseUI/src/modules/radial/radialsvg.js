import { icons } from "@/common/components/base"
import { $translate } from "@/services/translation"
import { uniqueSafeId } from "@/services/uniqueId"
import useControls from "@/services/controls"

// note: all sizes are in range 0..1 for convenience
const cfg = {
  // background can be either a colour or an array of colours (for radial fill)
  // background: "var(--bng-black-o4)",
  background: ["var(--bng-black-o8)", "var(--bng-black-o4)"],
  info: {
    // central info block
    icon: "var(--bng-cool-gray-500)",
    iconSize: 0.15,
    label: "var(--bng-off-white)",
    labelSize: 0.05,
    line: "var(--bng-cool-gray-700)",
    lineSize: 0.0025,
    hotkey: "#aaa",
    hotkeySize: 0.04,
    unfocusedColor: "var(--bng-cool-gray-500)",
    focusedColor: "var(--bng-off-white)",
  },
  button: {
    // radial button
    // "vertical" sizes represent a radius from center to outside, so they should be in range 0..0.5
    top: 0.45, // button position
    height: 0.175, // height from outer to center
    margin: 0.004, // padding between elements
    corners: 0.03, // rounded corners size
    background: "var(--bng-black)", // Single color for regular buttons
    highlight: "var(--bng-ter-blue-gray-700)", // Single color for regular button highlight
    border: "var(--bng-cool-gray-700)", // border colour
    borderHighlight: "var(--bng-cool-gray-500)", // border focus colour
    borderSize: 0.0025, // border width
    folder: "var(--bng-ter-blue-gray-900)", // border colour
    folderTop: 0.45, // folder position
    folderHeight: 0.015, // height from outer to center
    markerTop: 0.3, // marker position
    markerHeight: 0.025, // height from outer to center
    marker: "var(--bng-orange)", // marker background colour
    icon: "var(--bng-off-white)", // icon default colour
    iconSize: 0.1, // icon default size
    majorBackground: ["var(--bng-black)", "var(--bng-ter-blue-gray-850)"], // Gradient for major buttons
    majorHighlight: ["var(--bng-ter-blue-gray-600)", "var(--bng-ter-blue-gray-700)"], // Gradient for major button highlight
    pinnedDotInvisible: {
      "fill": "transparent",
      "stroke": "transparent",
      "r": 4,
    },
    markDotSolid: {
      "fill": "rgba(var(--bng-cool-gray-100-rgb),0.7)",
      "stroke": "transparent",
      "r": 4,
    },
    markDotOutline: {
      "fill": "transparent",
      "stroke": "rgba(var(--bng-cool-gray-100-rgb),0.7)",
      "r": 3.0,
    },
    markStar: {
      "fill": "rgba(var(--bng-cool-gray-100-rgb),0.7)",
      "stroke": "rgba(var(--bng-cool-gray-100-rgb),0.7)",
      "stroke-width": 2,
      "r": 3,
      "isStar": true,
      "starPoints": 5,
      "innerRadius": 1.5,
      "outerRadius": 3,
    },
  },
  pointer: {
    color: "var(--bng-orange)", // fill color
    size: 6,
  },
}

const size = 500 // rendering size in pixels (does not affect the appearance, but might have an effect on the different renderers; can be down to 1 px)
const pointerRadius = 125

let controlsHotkey = ""

const getHotkey = action => {
  const controls = useControls()
  const viewerObj = controls.makeViewerObj({ action })
  if (viewerObj) {
    return icons[viewerObj.icon].glyph
      + " "
      + viewerObj.control.split(/[ -]/).map(s => s.substring(0, 1).toUpperCase() + s.substring(1)).join("+")
  } else {
    return ""
  }
}

export default class RadialSVG {
  /** Parent element for `<svg>` */
  parent
  /** Main `<svg>` element */
  svg
  /** Appearance configuration */
  config
  /** Events to fire: `click`, `down`, `up`, `contextAction` */
  events
  /** Svg element container, provided by `createSvg` */
  itemsCont
  /** Information object with svg elements, provided by `createSvg` */
  info
  /** Array of rendered buttons */
  buttons
  /** Pointer element */
  pointer
  /** Default menu icon */
  menuIcon = ''

  /**
   * Creates `<svg>` inside of the `element`
   * @param {Object<String, Function>} [events] Events to fire: `click`, `down`, `up`
   * @param {Object} [config] Appearance configuration
   * @param {HTMLElement} [element] Element to draw `<svg>` in. Or call `create(element)` anytime later.
   */
  constructor(events = {}, config = cfg, element = undefined) {
    this.events = events
    this.config = config
    if (element) {
      this.create(element)
    }
  }

  /**
   * Creates `<svg>` inside of the `element`
   * @param {HTMLElement} [element] Element to draw `<svg>` in
   */
  create(element) {
    if (this.parent === element) return
    this.parent = element
    if (!this.svg) {
      [this.svg, this.itemsCont, this.info, this.pointer] = createSvg(this.config)
    }
    this.parent.appendChild(this.svg)
  }

  /**
   * Update function
   * @param {Array<Object>} items Array of data items
   */
  update(items = []) {
    if (!this.itemsCont || !this.info) return
    controlsHotkey = getHotkey("menu_item_focus_ud")
    this.buttons = updateSvg(this.itemsCont, this.info, items, this.events, this.config, this.buttons || [], this)
  }

  dispose() {
    if (!this.parent) return
    this.parent.removeChild(this.svg)
    this.parent = null
    this.svg = null
    this.itemsCont = null
    this.info = null
    this.buttons = null
  }

  /**
   * Sets the pointer position
   * @param {number} x X coordinate (-1 to 1)
   * @param {number} y Y coordinate (-1 to 1)
   */
  setPointer(x, y) {
    if (!this.pointer) return
    // Normalize vector to unit length
    const magnitude = Math.sqrt(x * x + y * y)
    if (magnitude > 0.1) {
      x = x / magnitude
      y = y / magnitude
      this.pointer.setAttribute('cx',  x * pointerRadius + size / 2)
      this.pointer.setAttribute('cy', -y * pointerRadius + size / 2)
      this.pointer.setAttribute('display', 'block')
    } else {
      this.pointer.setAttribute('display', 'none')
    }
  }

  /**
   * Sets the default menu icon
   * @param {string} iconName Name of the icon to use
   */
  setMenuIcon(iconName) {
    this.menuIcon = iconName
    if (this.info) {
      const iconGlyph = getIconGlyph(this.menuIcon)
      this.info.icon.textContent = iconGlyph
    }
  }
}


const svgns = "http://www.w3.org/2000/svg"
const xhtmlns = "http://www.w3.org/1999/xhtml"
const pid = Math.PI * 2

const getIconGlyph = iconName => (iconName && iconName in icons ? icons[iconName] : icons.beamNG).glyph

const setAttrs = (elm, attrs) => Object.entries(attrs).forEach(attr => elm.setAttribute(...attr))
const setStyles = (elm, styles) => Object.entries(styles).forEach(rule => elm.style.setProperty(...rule))
const f2size = f => f * size

const getPoint = (turn, radius, center = [0.5, 0.5]) => [
  center[0] + radius * Math.cos(turn * pid),
  center[1] + radius * Math.sin(turn * pid),
].map(n => f2size(n).toFixed(5))

const drawLine = (to) => ` L ${to.join(",")} `
const drawBezier = (control, to) => ` S ${control.join(",")} ${to.join(" ")} `
const drawArc = (to, radius, invert = false) => ` A ${radius} ${radius}, 0, 0, ${invert ? "0" : "1"}, ${to.join(" ")} `

function createSimplePath(pos, rad, width, height) {
  // start from top-left and go CW
  let d = `M ${getPoint(pos, rad).join(",")} `
  // top
  d += drawArc(
    getPoint(pos + width, rad),
    f2size(rad),
    false
  )
  // right
  d += drawLine(
    getPoint(pos + width, rad - height)
  )
  // bottom
  d += drawArc(
    getPoint(pos, rad - height),
    f2size(rad - height),
    true
  )
  // left
  d += drawLine(
    getPoint(pos, rad)
  )

  d += "Z"

  return d
}

// function createPath(pos, rad, width, height, corner, padout, padin) {
function createPath({ pos, rad, width, height, corner, padout, padin }) {
  if (corner > height) corner = height

  // corners
  // we calculate them by rad to make them look even
  const corh = corner * rad / Math.PI
  const corv = corner * rad

  // start from top-left and go CW
  let d = `M ${getPoint(pos + padout + corh, rad).join(",")} `

  // top
  d += drawArc(
    getPoint(pos + width - padout - corh, rad),
    f2size(rad),
    false
  )
  // top-right
  d += drawBezier(
    getPoint(pos + width - padout, rad),
    getPoint(pos + width - padout, rad - corv)
  )
  // right
  d += drawLine(
    getPoint(pos + width - padout - padin, rad - height + corv)
  )
  // bottom-right
  d += drawBezier(
    getPoint(pos + width - padout - padin, rad - height),
    getPoint(pos + width - padout - corh - padin, rad - height)
  )
  // bottom
  d += drawArc(
    getPoint(pos + padout + corh + padin, rad - height),
    f2size(rad - height),
    true
  )
  // bottom-left
  d += drawBezier(
    getPoint(pos + padout + padin, rad - height),
    getPoint(pos + padout + padin, rad - height + corv)
  )
  // left
  d += drawLine(
    getPoint(pos + padout, rad - corv)
  )
  // top-left
  d += drawBezier(
    getPoint(pos + padout, rad),
    getPoint(pos + padout + corh, rad)
  )

  d += "Z"

  return d
}

/**
 * Update function
 * @param {SVGElement} cont Svg element container, provided by `createSvg`
 * @param {Object} info  Information object with svg elements, provided by `createSvg`
 * @param {Array<Object>} items Array of data items
 * @param {Object<String, Function>} events Events to fire: `click`, `down`, `up`
 * @param {Object} [config] Appearance configuration
 * @param {Array<Object>} [buttons] Buttons provided by `updateSvg` (this function)
 * @param {RadialSVG} [radialInstance] The RadialSVG instance
 * @returns {Array<Object>|null} Rendered buttons
 */
export function updateSvg(cont, info, items, events, config = cfg, buttons = [], radialInstance = null) {
  const btns = [...(buttons || [])]

  // remove extra elements
  const elmsRem = btns.splice(items.length)
  for (const elm of elmsRem) {
    cont.removeChild(elm.element)
  }

  if (items.length < 1) {
    // console.log("Radial: No items provided, nothing to do")
    return null
  }

  // create new buttons
  for (let index = btns.length; index < items.length; index++) {
    const btn = createButton(index, info, config, items[index])
    cont.appendChild(btn.element)
    btns.push(btn)
  }

  // apply all data changes
  for (const elm of btns) {
    elm.update(items[elm.index], events, radialInstance)
  }

  return btns
}

function iconType(icon) {
  if (icon) {
    if (icon in icons)
      return "glyph"
    if (icon.startsWith("/"))
      return "path"
    const ext = icon.substring(icon.length - 4)
    if (ext === ".svg" || ext === ".png")
      return "file"
  }
  return "symbol"
}
const iconGet = {
  path: icon => icon,
  file: icon => "/ui/modules/apps/RadialMenu/mods_icons/" + icon,
  symbol: icon => "#" + ({
    "radial_Drift_ESC": "radial_drift_ESC",
    "radial_Sport_ESC": "radial_sport_ESC",
    "radial_Regular_ESC": "radial_regular_ESC",
    "radial_ESC": "radial_regular_ESC",
  }[icon] || icon),
}

function createButton(index, info, config, item) {
  const btn = { index }
  let menuIconRef = '' // Add reference to store menuIcon

  // Create gradient IDs only for major buttons
  const majorGradId = uniqueSafeId()
  const majorHighlightGradId = uniqueSafeId()

  // Create button container
  const control = document.createElementNS(svgns, "g")
  btn.element = control

  // Create gradients
  function createGradient(id, colors) {
    const grad = document.createElementNS(svgns, "radialGradient")
    setAttrs(grad, {
      "id": id,
      "cx": "0.5",
      "cy": "0.5",
      "r": "0.5",
      "fx": "0.5",
      "fy": "0.5"
    })

    colors.forEach((color, index) => {
      const stop = document.createElementNS(svgns, "stop")
      setAttrs(stop, {
        "offset": index / (colors.length - 1),
        "stop-color": color
      })
      grad.appendChild(stop)
    })

    return grad
  }

  // Add gradients to defs (only for major buttons)
  const defs = document.createElementNS(svgns, "defs")
  defs.appendChild(createGradient(majorGradId, config.button.majorBackground))
  defs.appendChild(createGradient(majorHighlightGradId, config.button.majorHighlight))
  control.appendChild(defs)

  // Create button
  const button = document.createElementNS(svgns, "path")
  if (config.button.border && config.button.borderSize > 0) {
    setAttrs(button, {
      "stroke": config.button.border,
      "stroke-width": f2size(config.button.borderSize),
    })
  }
  control.appendChild(button)

  // create folder indicator
  const folder = document.createElementNS(svgns, "path")
  folder.setAttribute("fill", config.button.folder)
  control.appendChild(folder)

  // create marker (orange line below button)
  const marker = document.createElementNS(svgns, "path")
  marker.setAttribute("fill", "none")
  control.appendChild(marker)

  // Create corner dot - MOVED AFTER other elements to ensure it appears on top
  const pinnedDot = document.createElementNS(svgns, "circle")
  setAttrs(pinnedDot, config.button.markDotSolid)
  pinnedDot.setAttribute("style", "display: none")
  control.appendChild(pinnedDot)

  // Create star path for outline filled dot
  const starPath = document.createElementNS(svgns, "path")
  // Create the star path data once
  const starConfig = config.button.markStar
  const points = starConfig.starPoints || 5
  const innerRadius = starConfig.innerRadius || 1.5
  const outerRadius = starConfig.outerRadius || 3

  let starPathData = ""
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / points
    const x = radius * Math.sin(angle)
    const y = -radius * Math.cos(angle)

    if (i === 0) {
      starPathData += `M ${x},${y} `
    } else {
      starPathData += `L ${x},${y} `
    }
  }
  starPathData += "Z"

  starPath.setAttribute("d", starPathData)
  starPath.setAttribute("fill", starConfig.fill)
  starPath.setAttribute("stroke", starConfig.stroke)
  starPath.setAttribute("stroke-width", starConfig["stroke-width"])
  starPath.setAttribute("style", "display: none")
  control.appendChild(starPath)

  function updateButton(position, length, config, item) {
    position -= length / 2
    const padin = config.button.margin * (config.button.top - config.button.height)

    // Set initial fill based on button type
    const fill = item.majorButton ?
      `url(#${majorGradId})` :
      config.button.background
    button.setAttribute("fill", fill)

    // Update button
    button.setAttribute("d", createPath({
      pos: position,
      rad: config.button.top,
      width: length,
      height: config.button.height,
      corner: config.button.corners,
      padout: config.button.margin,
      padin,
    }))

    // Update corner dot position - place it in the bottom-right corner
    const dotPosition = getPoint(position + length/2, config.button.top - config.button.height + 0.0125)
    pinnedDot.setAttribute("cx", dotPosition[0])
    pinnedDot.setAttribute("cy", dotPosition[1])

    // Update star position
    starPath.setAttribute("transform", `translate(${dotPosition[0]}, ${dotPosition[1]})`)

    // Update folder indicator
    if (item.folder) {
      folder.setAttribute("d", createPath({
        pos: position,
        rad: config.button.folderTop - config.button.borderSize / 2,
        width: length,
        height: config.button.folderHeight,
        corner: config.button.corners,
        padout: config.button.margin + config.button.borderSize / 2,
        padin: 0,
      }))
    } else {
      folder.removeAttribute("d")
    }

    if(item.marking == "solid") {
      setAttrs(pinnedDot, config.button.markDotSolid)
      pinnedDot.setAttribute("style", "")
      starPath.setAttribute("style", "display: none")
    } else if (item.marking == "star") {
      pinnedDot.setAttribute("style", "display: none")
      starPath.setAttribute("style", "")
    } else if (item.marking == "outline") {
      setAttrs(pinnedDot, config.button.markDotOutline)
      pinnedDot.setAttribute("style", "")
      starPath.setAttribute("style", "display: none")
    } else {
      pinnedDot.setAttribute("style", "display: none")
      starPath.setAttribute("style", "display: none")
    }

    // Update marker
    marker.setAttribute("d", createPath({
      pos: position,
      rad: config.button.markerTop,
      width: length,
      height: config.button.markerHeight,
      corner: config.button.corners,
      padout: config.button.margin + padin,
      padin: padin * config.button.top,
    }))
  }

  // create image icon
  const maskId = uniqueSafeId()
  const iconMask = document.createElementNS(svgns, "mask")
  setAttrs(iconMask, {
    "id": maskId,
    "maskUnits": "userSpaceOnUse",
    "maskContentUnits": "userSpaceOnUse",
    "mask-type": "alpha",
  })
  const iconImage = document.createElementNS(svgns, "image")
  setAttrs(iconImage, {
    "preserveAspectRatio": "xMidYMid slice",
  })
  iconMask.appendChild(iconImage)
  const iconSymbol = document.createElementNS(svgns, "use")
  iconMask.appendChild(iconSymbol)
  control.appendChild(iconMask)
  const iconRect = document.createElementNS(svgns, "rect")
  iconRect.setAttribute("mask", `url(#${maskId})`)
  control.appendChild(iconRect)

  // create glyph icon
  const iconText = document.createElementNS(svgns, "text")
  setAttrs(iconText, {
    "font-family": "bngIcons",
    "dominant-baseline": "middle",
    "text-anchor": "middle",
  })
  control.appendChild(iconText)

  function updateIcon(position, length, config, item) {
    const iconPos = getPoint(position, config.button.top - config.button.height / 2)
    const iconSize = f2size(Math.min(config.button.iconSize, length - config.button.margin * 2))
    const imageX = iconPos[0] - iconSize / 2
    const imageY = +iconPos[1] - iconSize / 2
    setAttrs(iconImage, {
      "x": imageX,
      "y": imageY,
      "width": iconSize,
      "height": iconSize,
    })
    setAttrs(iconSymbol, {
      "x": imageX,
      "y": imageY,
      "width": iconSize,
      "height": iconSize,
      "fill": "#fff",
    })
    setAttrs(iconRect, {
      "x": imageX,
      "y": imageY,
      "width": iconSize,
      "height": iconSize,
      "fill": item.color || config.button.icon,
    })
    setAttrs(iconText, {
      "x": iconPos[0],
      "y": +iconPos[1] + iconSize * 0.1,
      "font-size": iconSize,
      "fill": item.color || config.button.icon,
    })

    // icon setter helper functions
    const setRect = on => on ? iconRect.removeAttribute("style") : iconRect.setAttribute("style", "display: none")
    const setGlyph = glyph => iconText.textContent = glyph || ""
    const setImage = path => {
      if (path) {
        iconImage.setAttribute("href", path)
        iconImage.removeAttribute("style")
      } else {
        iconImage.removeAttribute("href")
        iconImage.setAttribute("style", "display: none")
      }
    }
    const setSymbol = id => {
      if (id) {
        iconMask.setAttribute("mask-type", "luminocity")
        iconSymbol.setAttribute("href", id)
        iconSymbol.removeAttribute("style")
      } else {
        iconMask.setAttribute("mask-type", "alpha")
        iconSymbol.removeAttribute("href")
        iconSymbol.setAttribute("style", "display: none")
      }
    }

    // set icon
    const itype = iconType(item.icon)
    switch (itype) {
      case "glyph":
        setGlyph(getIconGlyph(item.icon))
        setRect(false)
        setImage()
        setSymbol()
        break
      case "symbol":
        setImage()
        setSymbol(iconGet[itype](item.icon))
        setRect(true)
        setGlyph()
        break
      default:
        setImage(iconGet[itype](item.icon))
        setSymbol()
        setRect(true)
        setGlyph()
        break
    }
  }

  // hitzone
  const hitzone = document.createElementNS(svgns, "path")
  setAttrs(hitzone, {
    "fill": "transparent",
    "style": "pointer-events: fill",
  })
  control.appendChild(hitzone)

  function updateHitzone(position, length, config) {
    hitzone.setAttribute("d", createSimplePath(
      position - length / 2,
      config.button.top,
      length,
      config.button.height,
    ))
  }

  function updateEvents(events, radialInstance) {
    if (btn._handlers) {
      hitzone.removeEventListener("mouseover", btn._handlers.focus)
      hitzone.removeEventListener("mouseleave", btn._handlers.blur)
      hitzone.removeEventListener("click", btn._handlers.click)
      hitzone.removeEventListener("mousedown", btn._handlers.down)
      hitzone.removeEventListener("mouseup", btn._handlers.up)
      hitzone.removeEventListener("contextmenu", btn._handlers.contextMenu)
    }
    const item = btn.item
    const index = btn.index

    // Get menuIcon from the RadialSVG instance passed in
    btn.menuIcon = radialInstance?.menuIcon || ''

    btn._handlers = {
      /** Focus command */
      focus() {
        if (item.focused && btn._focused) return
        // Use different highlight for major/regular buttons
        const highlightFill = item.majorButton ?
          `url(#${majorHighlightGradId})` :
          config.button.highlight
        button.setAttribute("fill", highlightFill)
        button.setAttribute("stroke", config.button.borderHighlight)
        marker.setAttribute("fill", config.button.marker)
        const itype = iconType(item.icon)
        if (itype === "glyph") {
          setStyles(info.icon, {
            "background-color": "transparent",
            "-webkit-mask-image": "none",
            "color": config.info.focusedColor,
          })
          info.icon.textContent = getIconGlyph(item.icon)
        } else {
          info.icon.textContent = ""
          if (itype === "symbol")
            info.iconSymbol.setAttribute("href", iconGet[itype](item.icon))
          setStyles(info.icon, {
            "background-color": config.info.icon,
            "-webkit-mask-image": itype === "symbol" ? `url('#${info.iconMaskId}')` : `url('${iconGet[itype](item.icon)}')`,
          })
        }
        info.label.textContent = typeof item.title === 'string'
          ? $translate.contextTranslate({txt: item.title, context: item.context})
          : $translate.contextTranslate(item.title)
        info.label.style.color = config.info.focusedColor
        info.price.textContent = item?.price?.money?.amount !== undefined ? item.price.money.amount + " \u{EC0D}" : ""
        info.hotkey.textContent = item.hotkey || ""
        info.cont.removeAttribute("style")
        item.focused = true
        btn._focused = true // internal focus
        typeof events.focus === "function" && events.focus(item, index)
      },
      /** Blur command */
      blur() {
        if (!item.focused && !btn._focused) return
        // Reset to normal fill
        const normalFill = item.majorButton ?
          `url(#${majorGradId})` :
          config.button.background
        button.setAttribute("fill", normalFill)
        button.setAttribute("stroke", config.button.border)
        marker.setAttribute("fill", "none")
        // Show default info instead of hiding the info container
        setStyles(info.icon, {
          "background-color": "transparent",
          "-webkit-mask-image": "none",
          "color": config.info.unfocusedColor,
        })
        const iconGlyph = getIconGlyph(btn.menuIcon)
        info.icon.textContent = iconGlyph
        info.label.textContent = "Select an option"
        info.price.textContent = ""
        info.hotkey.textContent = controlsHotkey
        // Set label color to match icon color
        info.label.style.color = config.info.unfocusedColor
        item.focused = false
        btn._focused = false // internal focus
        typeof events.blur === "function" && events.blur(item, index)
      },
      /** Click event */
      click(evt) {
        //console.log("click", item, index);
        evt && evt.stopPropagation()
        // TODO: remove "evt && !evt.fromController" when we'll have down/up on "ok" uinav event
        //       but for now its purpose is to ignore the mouse
        if (!item.enabled || !events || (evt && !evt.fromController && evt.type !== "ui_nav")) return
        btn._handlers.isDown = false
        typeof events.click === "function" && events.click(item, index)
      },
      /** Button press event */
      down(evt) {
        if (!item.enabled || !events || evt.button !== 0) return
        btn._handlers.isDown = true
        typeof events.down === "function" && events.down(item, index)
      },
      /** Button release event */
      up(evt) {
        if (!btn._handlers.isDown || !item.enabled || !events || evt.button !== 0) return
        btn._handlers.isDown = false
        typeof events.up === "function" && events.up(item, index)
      },
      /** Context menu event (right click) */
      contextMenu(evt) {
        evt && evt.stopPropagation()
        if(!events) return
        typeof events.contextAction === "function" && events.contextAction(item, index)
      },
    }
    hitzone.addEventListener("mouseover", btn._handlers.focus)
    hitzone.addEventListener("mouseleave", btn._handlers.blur)
    hitzone.addEventListener("click", btn._handlers.click, true)
    hitzone.addEventListener("mousedown", btn._handlers.down)
    hitzone.addEventListener("mouseup", btn._handlers.up)
    hitzone.addEventListener("contextmenu", btn._handlers.contextMenu)
    return btn._handlers
  }

  function updateEnable(item) {
    if (item.enabled) {
      hitzone.setAttribute("cursor", "pointer")
      control.removeAttribute("opacity")
    } else {
      hitzone.removeAttribute("cursor")
      control.setAttribute("opacity", "0.5")
    }
  }

  /**
   * Main update function for the button.
   * Can be used to update the button without re-render.
   * @param {Object} item Item data
   * @param {Object} [events] Events to bind
   * @param {RadialSVG} [radialInstance] The RadialSVG instance
   */
  btn.update = (item, events = undefined, radialInstance = null) => {
    btn.item = item
    const length = Math.min(item.size, 0.5)
    const position = (item.position - 0.5) % 1
    updateButton(position, length, config, item)
    updateHitzone(position, length, config)
    updateIcon(position, length, config, item)
    updateEnable(item)
    // Pass the RadialSVG instance to updateEvents
    btn._handlers = updateEvents(events, radialInstance)
    Object.assign(btn, btn._handlers)
    // call hover if already focused
    if (item.focused || btn._focused) {
      btn._handlers.focus()
    }
  }

  return btn
}

/**
 * Creates `<svg>` inside of the `element`
 * @param {Object} [config] Appearance configuration
 * @returns {Array<SVGAElement, SVGAElement, Object>} Array with main `<svg>` element, items container and an object with information elements
 */
export function createSvg(config = cfg) {
  const svg = document.createElementNS(svgns, "svg")
  setAttrs(svg, {
    "viewBox": `0 0 ${size} ${size}`,
    "width": "100%",
    "height": "100%",
    "preserveAspectRatio": "xMidYMid meet",
    "style": "pointer-events: none",
  })

  // background
  const gradId = Array.isArray(config.background) ? uniqueSafeId() : null
  if (gradId) {
    const grad = document.createElementNS(svgns, "radialGradient")
    grad.setAttribute("id", gradId)
    for (let i = 0; i < config.background.length; i++) {
      const stop = document.createElementNS(svgns, "stop")
      setAttrs(stop, {
        "offset": i / (config.background.length - 1),
        "stop-color": config.background[i],
      })
      grad.appendChild(stop)
    }
    svg.appendChild(grad)
  }
  const bg = document.createElementNS(svgns, "circle")
  setAttrs(bg, {
    "cx": f2size(0.5),
    "cy": f2size(0.5),
    "r": f2size(0.5),
    "fill": gradId ? `url(#${gradId})` : config.background,
    "style": "pointer-events: fill",
  })
  bg.addEventListener("click", evt => {
    evt.stopPropagation()
  }, true)
  svg.appendChild(bg)

  // create info fields
  const nfo = {
    cont: document.createElementNS(svgns, "foreignObject"),
    body: document.createElementNS(xhtmlns, "body"),
    wrap: document.createElementNS(xhtmlns, "div"),
    icon: document.createElementNS(xhtmlns, "div"),
    iconSymbol: document.createElementNS(svgns, "use"),
    iconMaskId: uniqueSafeId(),
    label: document.createElementNS(xhtmlns, "div"),
    price: document.createElementNS(xhtmlns, "div"),
    hotkey: document.createElementNS(xhtmlns, "div"),
  }

  // in foreign object, everything is rounded to integers, so we're going to scale it down by minimum size
  const foMinSize = 200 // min size
  const nfoSize = size >= foMinSize ? size : foMinSize
  setAttrs(nfo.cont, {
    "style": "display: none",
    "width": nfoSize,
    "height": nfoSize,
  })
  if (size < foMinSize) {
    // scale if rendering size is below minimum fo size
    nfo.cont.setAttribute("transform", `scale(${size * 0.005})`)
  }
  nfo.body.setAttribute("xmlns", xhtmlns)
  setStyles(nfo.body, {
    "width": "100%",
    "height": "100%",
  })
  setStyles(nfo.wrap, {
    "width": `${nfoSize * 0.5}px`,
    "height": `${nfoSize * 0.4}px`,
    "margin": `${nfoSize * 0.3}px ${nfoSize * 0.25}px`,
    "display": "flex",
    "flex-direction": "column",
    "align-items": "center",
    "justify-content": "space-between",
    "font-family": "var(--fnt-defs)",
  })

  setStyles(nfo.icon, {
    // for icon font
    "color": config.info.icon,
    "font-size": `${config.info.iconSize * nfoSize}px`,
    "font-family": "bngIcons",
    // for image file
    "width": `${config.info.iconSize * nfoSize}px`,
    "height": `${config.info.iconSize * nfoSize}px`,
    "-webkit-mask-image": "none",
    "-webkit-mask-size": "contain",
    "-webkit-mask-position": "50% 50%",
    "-webkit-mask-repeat": "no-repeat",
    "background-color": "transparent",
  })
  const iconSvg = document.createElementNS(svgns, "svg")
  setAttrs(iconSvg, {
    "viewBox": `0 0 ${config.info.iconSize * nfoSize} ${config.info.iconSize * nfoSize}`,
    "width": "0",
    "height": "0",
    "style": "position: absolute;",
  })
  const iconMask = document.createElementNS(svgns, "mask")
  setAttrs(iconMask, {
    "id": nfo.iconMaskId,
    "maskUnits": "userSpaceOnUse",
    "maskContentUnits": "userSpaceOnUse",
    "mask-type": "luminocity",
  })
  setAttrs(nfo.iconSymbol, {
    "x": "0",
    "y": "0",
    "width": config.info.iconSize * nfoSize,
    "height": config.info.iconSize * nfoSize,
    "fill": "#fff",
  })
  iconMask.appendChild(nfo.iconSymbol)
  iconSvg.appendChild(iconMask)

  setStyles(nfo.label, {
    "min-height": "2em",
    "width": "100%",
    "text-align": "center",
    "color": config.info.label,
    "font-size": `${config.info.labelSize * nfoSize}px`,
    "font-family": "var(--fnt-defs)",
  })

  setStyles(nfo.price, {
    "width": "100%",
    "text-align": "center",
    "color": config.info.label,
    "font-size": `${config.info.labelSize * 0.8 * nfoSize}px`,
    "font-family": "bngIcons, var(--fnt-defs)",
  })

  setStyles(nfo.hotkey, {
    "width": "80%",
    "text-align": "center",
    "padding-top": "1px",
    "min-height": `${config.info.hotkeySize * nfoSize + 10}px`,
    "border-top": `${config.info.lineSize * nfoSize}px solid ${config.info.line}`,
    "color": config.info.hotkey,
    "font-size": `${config.info.hotkeySize * nfoSize}px`,
    "font-family": "bngIcons, \"Noto Sans Mono\", var(--fnt-defs)",
  })

  nfo.wrap.appendChild(iconSvg)
  nfo.wrap.appendChild(nfo.icon)
  nfo.wrap.appendChild(nfo.label)
  nfo.wrap.appendChild(nfo.price)
  nfo.wrap.appendChild(nfo.hotkey)
  nfo.body.appendChild(nfo.wrap)
  nfo.cont.appendChild(nfo.body)
  svg.appendChild(nfo.cont)

  // radial items container
  const cont = document.createElementNS(svgns, "g")
  svg.appendChild(cont)

  // Create pointer element
  const pointer = document.createElementNS(svgns, "circle")
  setAttrs(pointer, {
    "r": config.pointer.size,
    "fill": config.pointer.color,
    "display": "none",
  })
  svg.appendChild(pointer)

  // Set initial default info
  nfo.icon.textContent = getIconGlyph(svg.menuIcon)
  nfo.label.textContent = "Select an option"
  nfo.price.textContent = ""
  nfo.label.style.color = config.info.unfocusedColor
  controlsHotkey = getHotkey("menu_item_focus_ud")
  nfo.hotkey.textContent = controlsHotkey
  nfo.cont.removeAttribute("style") // Make info visible by default

  const radialSvg = [svg, cont, nfo, pointer]

  return radialSvg
}
