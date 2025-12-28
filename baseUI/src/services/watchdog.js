import logger from "@/services/logger"

let isInitialized = false
let includeAnonymousCalls = false
const callQueue = []

let overlayActive = false
let overlayElement = null
let overlayDivs = new Map() // uiAppElement -> overlayDiv
let overlayUpdateTimer = null

const statsProcessor = {
  isProcessing: false,
  batchSize: 100, // minimum batch size, but usually it will be larger depending on the queue size
  processInterval: 1000, // queue processing interval
  files: new Map(), // filePath -> count
  types: new Map(), // interceptor type -> count
  append: new Map(), // node insertion operations -> count
  uiApps: new Map(), // DOM element -> count (for #mainContainer_apps > div)
  intervalId: null,
  lastProcessTime: 0,
  totalProcessed: 0,
}

// IMPORTANT: this skips Error, captureStackTrace, interceptor.call, and wrapper function from the stack trace
const STACK_TRACE_SKIP_LINES = 4

// "at functionName (filePath:line:column)"
const STACK_TRACE_REGEX_FULL = /at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/
// "at filePath:line:column"
const STACK_TRACE_REGEX = /at\s+(.+):(\d+):(\d+)/

const interceptors = {
  createElement: {
    base: Document,
    getArgs: (...args) => args.map(arg => typeof arg === "string" ? arg : "[object]"),
  },
  createElementNS: {
    base: Document,
    getArgs: (...args) => args.map(arg => typeof arg === "string" ? arg : "[object]"),
  },
  cloneNode: {
    base: Node,
    getArgs: (deep) => [deep],
  },
  importNode: {
    base: Document,
    getArgs: (node, deep) => ["[node]", deep],
  },
  insertAdjacentHTML: {
    base: Element,
    getArgs: (position, text) => [position, `[HTML:${text.length}chars]`],
  },
  innerHTML: {
    isSetter: true,
    bases: [Element, HTMLElement],
    getArgs: (value) => [`[HTML:${typeof value === "string" ? value.length : 0}chars]`],
  },
  outerHTML: {
    isSetter: true,
    bases: [Element, HTMLElement],
    getArgs: (value) => [`[HTML:${typeof value === "string" ? value.length : 0}chars]`],
  },
  appendChild: {
    base: Node,
    stats: "append",
    getArgs: (child) => [`[${child?.tagName || child?.nodeName || "node"}]`],
  },
  insertBefore: {
    base: Node,
    stats: "append",
    getArgs: (newNode, referenceNode) => [`[${newNode?.tagName || newNode?.nodeName || "node"}]`, `[${referenceNode?.tagName || referenceNode?.nodeName || "ref"}]`],
  },
  replaceChild: {
    base: Node,
    stats: "append",
    getArgs: (newChild, oldChild) => [`[${newChild?.tagName || newChild?.nodeName || "new"}]`, `[${oldChild?.tagName || oldChild?.nodeName || "old"}]`],
  },
  append: {
    base: Element,
    stats: "append",
    getArgs: (...nodes) => nodes.map(node => `[${node?.tagName || node?.nodeName || typeof node === "string" ? "text" : "node"}]`),
  },
  prepend: {
    base: Element,
    stats: "append",
    getArgs: (...nodes) => nodes.map(node => `[${node?.tagName || node?.nodeName || typeof node === "string" ? "text" : "node"}]`),
  },
  before: {
    base: Element,
    stats: "append",
    getArgs: (...nodes) => nodes.map(node => `[${node?.tagName || node?.nodeName || typeof node === "string" ? "text" : "node"}]`),
  },
  after: {
    base: Element,
    stats: "append",
    getArgs: (...nodes) => nodes.map(node => `[${node?.tagName || node?.nodeName || typeof node === "string" ? "text" : "node"}]`),
  },
}

function setupInterceptor(type) {
  const interceptor = interceptors[type]

  // find original
  if (interceptor.isSetter) {
    let descriptor
    if (interceptor.bases) {
      for (const base of interceptor.bases) {
        descriptor = Object.getOwnPropertyDescriptor(base.prototype, type)
        if (descriptor) {
          interceptor.base = base
          break
        }
      }
    }
    if (descriptor) interceptor.original = descriptor
  } else {
    interceptor.original = interceptor.base.prototype[type]
  }

  if (!interceptor.original) {
    logger.warn(`No original for ${type}`)
    return
  }

  // create interceptor function
  interceptor.call = (self, ...args) => {
    const stackTrace = captureStackTrace()
    if (stackTrace && (includeAnonymousCalls || !stackTrace.hasAnonymous || stackTrace.filePaths.length > 0)) {
      const callData = {
        type,
        timestamp: Date.now(),
        args: interceptor.getArgs(...args),
        stackTrace,
      }

      // special tracking for node insertions of UI apps
      if (interceptor.stats === "append" && self) {
        try {
          // check if insertion target is within mainContainer_apps
          const mainContainer = self.closest ? self.closest("#mainContainer_apps") : null
          if (mainContainer) {
            // find the direct child div of mainContainer_apps that contains this insertion target
            let directChildDiv = self
            while (directChildDiv && directChildDiv.parentNode && directChildDiv.parentNode !== mainContainer) {
              directChildDiv = directChildDiv.parentNode
            }
            // only track if it's a direct child and it's a div
            if (directChildDiv && directChildDiv.parentNode === mainContainer && directChildDiv.tagName === "DIV") {
              callData.uiAppInsertion = {
                targetElement: directChildDiv
              }
            }
          }
        } catch (e) { }
      }
      callQueue.push(callData)
    }
    if (interceptor.isSetter) {
      interceptor.original.set.call(self, args[0])
    } else {
      return interceptor.original.apply(self, args)
    }
  }

  // install
  if (interceptor.isSetter) {
    Object.defineProperty(interceptor.base.prototype, type, {
      get: interceptor.original.get,
      set: function (value) {
        interceptor.call(this, value)
      },
      configurable: true,
      enumerable: true
    })
  } else {
    interceptor.base.prototype[type] = function(...args) {
      return interceptor.call(this, ...args)
    }
  }

  // create restore function
  interceptor.restore = () => {
    if (interceptor.isSetter) {
      Object.defineProperty(interceptor.base.prototype, type, {
        get: interceptor.original.get,
        set: interceptor.original.set,
        configurable: true,
        enumerable: true
      })
    } else {
      interceptor.base.prototype[type] = interceptor.original
    }
  }
}

function captureStackTrace() {
  const error = new Error()
  const stack = error.stack

  if (!stack) return null

  const lines = stack.split("\n")
  const relevantLines = lines.slice(STACK_TRACE_SKIP_LINES)
  const filePaths = []
  let hasAnonymous = false

  // extract file paths
  for (const line of relevantLines) {
    let match = line.match(STACK_TRACE_REGEX_FULL)
    let functionName, filePath, lineNum, column
    if (match) {
      functionName = match[1]
      filePath = match[2]
      lineNum = match[3]
      column = match[4]
    } else {
      match = line.match(STACK_TRACE_REGEX)
      if (match) {
        functionName = "anonymous"
        filePath = match[1]
        lineNum = match[2]
        column = match[3]
      } else {
        continue // skip unparseable lines
      }
    }
    const isAnonymous =
      functionName?.includes("anonymous") ||
      functionName?.includes("<anonymous>") ||
      !functionName ||
      functionName.trim() === ""
    if (isAnonymous) {
      hasAnonymous = true
      if (!includeAnonymousCalls) {
        continue
      }
    }
    filePaths.push({
      functionName,
      filePath,
      line: lineNum,
      column,
      isAnonymous
    })
  }
  return {
    filePaths,
    fullStack: stack,
    hasAnonymous
  }
}

// processes queued calls and updates statistics
async function processCallQueue() {
  statsProcessor.lastProcessTime = Date.now()

  if (statsProcessor.isProcessing || callQueue.length === 0) {
    return
  }

  statsProcessor.isProcessing = true

  try {
    const batch = callQueue.splice(0, Math.max(statsProcessor.batchSize, callQueue.length / 5))
    statsProcessor.totalProcessed += batch.length

    for (let i = 0; i < batch.length; i++) {
      const call = batch[i]
      try {
        if (!call || !call.stackTrace || !call.stackTrace.filePaths) {
          continue
        }

        const interceptorConfig = interceptors[call.type]

        // track by appropriate stats category
        if (interceptorConfig?.stats === "append") {
          const appendCount = statsProcessor.append.get(call.type) || 0
          statsProcessor.append.set(call.type, appendCount + 1)
        } else {
          const typeCount = statsProcessor.types.get(call.type) || 0
          statsProcessor.types.set(call.type, typeCount + 1)
        }

        // track UI app insertions
        if (call.uiAppInsertion) {
          const targetElement = call.uiAppInsertion.targetElement
          const count = statsProcessor.uiApps.get(targetElement) || 0
          statsProcessor.uiApps.set(targetElement, count + 1)
        }

        // track by file paths
        for (let j = 0; j < call.stackTrace.filePaths.length; j++) {
          const pathInfo = call.stackTrace.filePaths[j]
          if (!pathInfo || typeof pathInfo.filePath !== "string") continue
          const filePath = pathInfo.filePath
          const fileCount = statsProcessor.files.get(filePath) || 0
          statsProcessor.files.set(filePath, fileCount + 1)
        }
      } catch (callError) {
        logger.error(`DOM watchdog error processing call:`, callError)
      }
    }

    // TODO: timeframe-based reporting, where we'll add automatic abuse detection

  } catch (error) {
    logger.error("Error processing DOM call queue:", error)
  } finally {
    statsProcessor.isProcessing = false
  }
}

function startStatsProcessor() {
  if (statsProcessor.intervalId) {
    clearInterval(statsProcessor.intervalId)
  }
  statsProcessor.intervalId = setInterval(() => {
    try {
      processCallQueue()
    } catch (error) {
      logger.error("Fatal error in DOM watchdog processing:", error)
      destroy()
    }
  }, statsProcessor.processInterval)
}

export function getStats() {
  return {
    files: Object.fromEntries(statsProcessor.files),
    types: Object.fromEntries(statsProcessor.types),
    append: Object.fromEntries(statsProcessor.append)
  }
}

export function clearStats() {
  statsProcessor.files.clear()
  statsProcessor.types.clear()
  statsProcessor.append.clear()
  statsProcessor.uiApps.clear()
  callQueue.length = 0
  statsProcessor.totalProcessed = 0
  statsProcessor.lastProcessTime = 0
  if (overlayActive) updateOverlayDivs()
}

export function restartTimer() {
  if (isInitialized) startStatsProcessor()
}

/**
 * Sets whether to include anonymous calls in tracking
 * @param {boolean} include - Whether to track anonymous calls
 */
export function setIncludeAnonymousCalls(include) {
  includeAnonymousCalls = include
}

const exposedFunctions = () => ({
  watchdogRecentCalls: getRecentCalls,
  watchdogCallChainStats: getCallChainStats,
  watchdogClearStats: clearStats,
  watchdogSetIncludeAnonymousCalls: setIncludeAnonymousCalls,
  watchdogDestroy: destroy,
  watchdogRestartTimer: restartTimer,
  watchdogUIAppsStats: getUIAppsStats,
  watchdogRefreshOverlay: refreshOverlay,

  watchdogStats: () => {
    const stats = getStats()
    const format = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([key, value]) => `${key}: ${value}`.replace("\\", "\\\\")).join("\n")
    console.log("Types:\n" + format(stats.types))
    console.log("Files:\n" + format(stats.files))
  },

  // raw stack traces
  watchdogDebugStack: (amount = 5) => {
    const recent = getRecentCalls(amount)
    recent.forEach((call, i) => {
      console.log(`\n=== Call ${i + 1} ===`)
      console.log("Type:", call.type)
      console.log("Raw stack:", call.stackTrace.fullStack)
      console.log("Parsed paths:", call.stackTrace.filePaths)
    })
  },

  watchdogRestart: () => {
    destroy()
    init()
  },

  // show breakdown by DOM creation method
  watchdogTypeStats: () => {
    const stats = getStats()
    console.log("DOM Creation Method Breakdown:")
    Object.entries(stats.types).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
    if (Object.keys(stats.append).length > 0) {
      console.log("\nDOM Insertion Method Breakdown:")
      Object.entries(stats.append).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`)
      })
    }
  },

  watchdogUIApps: () => {
    const appsStats = getUIAppsStats()
    console.log("=== UI Apps - Busiest Insertion Targets ===")
    console.log(`Total UI app divs: ${appsStats.totalApps}`)
    if (appsStats.sortedList.length > 0) {
      console.log("\nUI app divs by insertion count (most active first):")
      console.log("Click on elements below to highlight them:")
      appsStats.sortedList.forEach(({element, count}, i) => {
        console.log(`${i + 1}. ${count} insertions`, element)
      })
      console.log(`\nUse watchdogToggleOverlay() for visual heatmap`)
    } else {
      console.log("No UI app insertions detected yet")
    }
    return appsStats
  },

  // visual overlay toggle
  watchdogOverlay: () => {
    const isActive = toggleOverlay()
    console.log(`UI Apps overlay ${isActive ? "enabled" : "disabled"}`)
    if (isActive) {
      console.log("Borders show UI apps, opacity = insertion activity, numbers = insertion count")
      console.log("Run watchdogOverlay() or watchdogToggleOverlay() again to disable")
      console.log("Use watchdogRefreshOverlay() if layout changes")
    }
  },

  // diagnostics
  watchdogHealth: () => {
    const now = Date.now()
    const timeSinceLastProcess = statsProcessor.lastProcessTime ? now - statsProcessor.lastProcessTime : "never"
    const isTimerActive = !!statsProcessor.intervalId
    console.log("=== Watchdog Health ===")
    console.log(`Timer active: ${isTimerActive}`)
    console.log(`Interval ID: ${statsProcessor.intervalId}`)
    console.log(`Queue size: ${callQueue.length}`)
    console.log(`Total processed: ${statsProcessor.totalProcessed}`)
    console.log(`Files tracked: ${statsProcessor.files.size}`)
    console.log(`Types tracked: ${statsProcessor.types.size}`)
    console.log(`Append ops tracked: ${statsProcessor.append.size}`)
    console.log(`UI app divs tracked: ${statsProcessor.uiApps.size}`)
    console.log(`Last process: ${timeSinceLastProcess}ms ago`)
    console.log(`Currently processing: ${statsProcessor.isProcessing}`)
    console.log(`Initialized: ${isInitialized}`)
    return {
      timerActive: isTimerActive,
      queueSize: callQueue.length,
      totalProcessed: statsProcessor.totalProcessed,
      filesTracked: statsProcessor.files.size,
      typesTracked: statsProcessor.types.size,
      appendOpsTracked: statsProcessor.append.size,
      uiAppDivsTracked: statsProcessor.uiApps.size,
      timeSinceLastProcess,
      currentlyProcessing: statsProcessor.isProcessing
    }
  },
})

export function init() {
  if (isInitialized) {
    logger.warn("DOM Watchdog already initialized")
    return
  }

  for (const type in interceptors) {
    setupInterceptor(type)
  }

  startStatsProcessor()

  const exposed = exposedFunctions()
  Object.assign(window, exposed)

  isInitialized = true
  logger.debug("Watchdog initialized. Use watchdogStats() to get stats, watchdogOverlay() to toggle UI Apps overlay.")
  logger.debug("All functions:", Object.keys(exposed).join(", "))
}

export function destroy() {
  if (!isInitialized) return

  // Stop the processing timer
  if (statsProcessor.intervalId) {
    clearInterval(statsProcessor.intervalId)
    statsProcessor.intervalId = null
  }

  // Restore interceptors
  for (const type in interceptors) {
    interceptors[type].restore?.()
  }

  // Clean up overlay if active
  destroyOverlay()

  clearStats()

  const exposedNames = Object.keys(exposedFunctions())
  for (const name of exposedNames) {
    delete window[name]
  }

  isInitialized = false
  logger.info("DOM Watchdog destroyed")
}

// For debugging - gets raw call data
export function getRecentCalls(limit = 50) {
  return callQueue.slice(-limit)
}

/**
 * Gets detailed call chain statistics - shows which call chains are most frequent
 * @returns {Object} Statistics organized by call chain patterns
 */
export function getCallChainStats() {
  const chainStats = new Map()

  for (const call of callQueue) {
    const chain = call.stackTrace.filePaths
      .map(info => info.filePath)
      .join(" -> ")

    const currentCount = chainStats.get(chain) || 0
    chainStats.set(chain, currentCount + 1)
  }

  return Object.fromEntries(
    Array.from(chainStats.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
  )
}

/**
 * Gets UI Apps insertion statistics - which UI app divs receive most insertions
 * @returns {Object} Statistics showing which #mainContainer_apps > div elements are busiest
 */
export function getUIAppsStats() {
  const sortedApps = Array.from(statsProcessor.uiApps.entries())
    .sort((a, b) => b[1] - a[1])
  return {
    totalApps: statsProcessor.uiApps.size,
    sortedList: sortedApps.map(([element, count]) => ({ element, count }))
  }
}

function createOverlay() {
  if (overlayElement) return overlayElement
  overlayElement = document.createElement("div")
  overlayElement.id = "watchdog-overlay"
  overlayElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 999999;
    font-family: monospace;
    font-size: 48px;
    color: magenta;
    pointer-events: none;
  `
  document.body.appendChild(overlayElement)
  return overlayElement
}

function getOverlayOpacity(count, minCount, maxCount) {
  // return (count - minCount) / (maxCount - minCount)
  return minCount === maxCount ? 0.8 : 0.2 + (0.8 * ((count - minCount) / (maxCount - minCount)))
}

function updateOverlayDivs() {
  if (!overlayElement) return
  const appsStats = getUIAppsStats()
  const counts = appsStats.sortedList.map(item => item.count)
  const maxCount = Math.max(...counts, 1)
  const minCount = Math.min(...counts, 0)
  overlayDivs.forEach(overlayDiv => overlayDiv.remove())
  overlayDivs.clear()
  for (const {element, count} of appsStats.sortedList) {
    try {
      const rect = element.getBoundingClientRect()
      const overlayDiv = document.createElement("div")
      overlayDiv.style.cssText = `
        position: absolute;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: transparent;
        border: 4px dashed magenta;
        opacity: ${getOverlayOpacity(count, minCount, maxCount)};
        display: flex;
        align-items: center;
        justify-content: center;
        text-shadow: 1px 1px 2px #000a;
      `
      overlayDiv.textContent = count.toString()
      overlayElement.appendChild(overlayDiv)
      overlayDivs.set(element, overlayDiv)
    } catch (e) {
      // Skip elements that can't be positioned
    }
  }
}

function updateOverlayText() {
  if (!overlayActive || overlayDivs.size === 0) return
  const appsStats = getUIAppsStats()
  const counts = appsStats.sortedList.map(item => item.count)
  const maxCount = Math.max(...counts, 1)
  const minCount = Math.min(...counts, 0)
  for (const {element, count} of appsStats.sortedList) {
    const overlayDiv = overlayDivs.get(element)
    if (overlayDiv) {
      overlayDiv.textContent = count.toString()
      overlayDiv.style.opacity = getOverlayOpacity(count, minCount, maxCount)
    }
  }
}

function destroyOverlay() {
  if (overlayUpdateTimer) {
    clearInterval(overlayUpdateTimer)
    overlayUpdateTimer = null
  }
  overlayDivs.forEach(overlayDiv => overlayDiv.remove())
  overlayDivs.clear()
  if (overlayElement) {
    overlayElement.remove()
    overlayElement = null
  }
  overlayActive = false
}

export function toggleOverlay() {
  if (overlayActive) {
    destroyOverlay()
    return false
  } else {
    overlayActive = true
    createOverlay()
    updateOverlayDivs()
    overlayUpdateTimer = setInterval(updateOverlayText, 500)
    return true
  }
}

export function refreshOverlay() {
  if (overlayActive) {
    updateOverlayDivs()
  }
}

