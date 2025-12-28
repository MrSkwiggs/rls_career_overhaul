import { debounce } from "../../utils/rateLimit.js"

/**
 * UI App-specific profiling functionality.
 * Handles enumeration, matching, and reporting of UI app stream listener performance.
 * Can be easily disabled by commenting out or conditionally excluding.
 */
class UIAppProfiler {
  /**
   * @param {StreamCoordinator} coordinator - Reference to the main coordinator
   */
  constructor(coordinator) {
    this.coordinator = coordinator
    this.uiAppsCache = new Map() // source file -> uiApp data (cached for performance)
    this.lastUiAppsEnumeration = 0 // timestamp of last UI apps scan

    this.retroactiveSetupComplete = false
    this.debouncedRetroactiveSetup = debounce(() => {
      this.setupRetroactiveAssociations()
      this.retroactiveSetupComplete = true
    }, 300)
  }

  /**
   * Triggers the debounced retroactive setup.
   * Called when Angular stream listeners are detected.
   */
  triggerRetroactiveSetup() {
    if (this.retroactiveSetupComplete || !this.coordinator.profilerSettings.uiAppsOnly) return
    this.debouncedRetroactiveSetup()
  }

  /**
   * Enumerates current UI apps from DOM and updates the cache
   * Called during Angular $on/$off for streams (acceptable overhead since infrequent)
   * @returns {Map} Map of source file paths to UI app data
   */
  enumerateUIApps() {
    const now = Date.now()

    // Throttle enumeration to avoid excessive DOM queries (max once per 100ms)
    // if (now - this.lastUiAppsEnumeration < 100) {
    //   return this.uiAppsCache
    // }

    this.lastUiAppsEnumeration = now
    this.uiAppsCache.clear()

    try {
      const mainContainer = document.getElementById("mainContainer_apps")

      if (!mainContainer) {
        if (this.coordinator.debug) console.log("No #mainContainer_apps found")
        return this.uiAppsCache
      }

      const uiAppDivs = mainContainer.querySelectorAll("div.bng-app[data-uiapp-source]")

      for (const div of uiAppDivs) {
        const source = div.getAttribute("data-uiapp-source")
        const name = div.getAttribute("data-uiapp-name")
        const id = div.getAttribute("data-uiapp-id")

        if (source && name && id) {
          // Normalize source path for matching against stack traces
          const normalizedSource = source.replace(/^\/ui\//, "").replace(/\\/g, "/")

          this.uiAppsCache.set(normalizedSource, {
            name,
            id,
            source: normalizedSource,
            element: div
          })
        }
      }

      if (this.coordinator.debug) {
        console.log(`Found ${uiAppDivs.length} UI app divs, cached ${this.uiAppsCache.size} valid apps`)
        if (this.uiAppsCache.size > 0) {
          console.log("UI app sources:", [...this.uiAppsCache.keys()])
        }
      }
    } catch (error) {
      if (this.coordinator.debug) {
        console.warn("Failed to enumerate UI apps:", error)
      }
    }

    return this.uiAppsCache
  }

  /**
   * Matches a call stack against UI app sources to identify which UI app triggered the call
   * @param {Object} stackTrace - Stack trace with filePaths array
   * @returns {Object|null} UI app data if match found, null otherwise
   */
  matchUIApp(stackTrace) {
    if (!stackTrace?.filePaths || !this.coordinator.profilerSettings.uiAppsOnly) return null

    const uiApps = this.enumerateUIApps()

    // Check each file path in the stack trace against UI app sources
    for (const pathInfo of stackTrace.filePaths) {
      if (!pathInfo.filePath || pathInfo.isAnonymous) continue

      // Normalize the path from stack trace for comparison
      let normalizedPath = pathInfo.filePath

      // Handle various path formats that might appear in stack traces
      if (normalizedPath.includes("/ui/modules/")) {
        normalizedPath = normalizedPath.substring(normalizedPath.indexOf("/ui/modules/"))
        normalizedPath = normalizedPath.replace(/^\/ui\//, "").replace(/\\/g, "/")
      } else if (normalizedPath.includes("modules/")) {
        normalizedPath = normalizedPath.substring(normalizedPath.indexOf("modules/"))
      }

      // Check for exact match or partial match within UI app sources
      for (const [sourcePath, uiAppData] of uiApps) {
        if (normalizedPath.includes(sourcePath) || sourcePath.includes(normalizedPath)) {
          if (this.coordinator.debug) {
            console.log(`Matched UI app "${uiAppData.name}" via path: ${normalizedPath} ↔ ${sourcePath}`)
          }
          return uiAppData
        }
      }
    }

    if (this.coordinator.debug && stackTrace?.filePaths?.length > 0) {
      console.log("No UI app match found for paths:", stackTrace.filePaths.map(p => p.filePath))
    }
    return null
  }

  /**
   * Sets up retroactive UI app associations for listeners that were registered before interception.
   * Called by debounced setup after Angular listeners are detected.
   * @param {boolean} forceRefresh - If true, clears existing associations and recreates them
   */
  setupRetroactiveAssociations(forceRefresh = false) {
    // Check if we already have retroactive associations
    const existingRetroIds = [...this.coordinator.listenerUIApps.keys()].filter(id => id.startsWith("angular-existing"))
    if (existingRetroIds.length > 0 && !forceRefresh) return

    if (forceRefresh && existingRetroIds.length > 0) {
      existingRetroIds.forEach(id => this.coordinator.listenerUIApps.delete(id))
    }

    const existingCount = this.coordinator.angularRootScope?.$$listenerCount?.streamsUpdate || 0

    // enumerate UI apps
    this.enumerateUIApps()
    const uiApps = [...this.uiAppsCache.values()]

    // create listener-to-UI-app associations
    // most UI apps have 1 stream listener, so 1:1 mapping works well
    const associationsCreated = Math.min(existingCount, uiApps.length)
    for (let i = 0; i < associationsCreated; i++) {
      const retroId = `angular-existing-${i}`
      const uiApp = uiApps[i]
      this.coordinator.listenerUIApps.set(retroId, uiApp)
    }

    if (this.coordinator.debug && associationsCreated > 0) {
      console.log(`Created ${associationsCreated} retroactive UI app associations from ${existingCount} existing listeners`)
    }
  }

  /**
   * Generates comprehensive UI app profiling report.
   * Shows both executed listeners and retroactive associations.
   * @returns {Object} Combined profiling statistics
   */
  report() {
    const stats = this.coordinator.profiler.getStats()
    const existingCount = this.coordinator.angularRootScope?.$$listenerCount?.streamsUpdate || 0
    const associatedCount = this.coordinator.listenerUIApps.size

    const out = [`=== UI Apps Stream Profiling (${stats.totalUIAppsDetected} total detected) ===`]
    out.push(`Angular listeners: ${existingCount} total, ${associatedCount} associated with UI apps`)
    out.push(`Vue listeners: ${this.coordinator.countStreamListeners().tracked.vue}`)
    out.push("")

    const combinedApps = new Map()

    // add stats from executed listeners
    for (const app of stats.uiApps) {
      combinedApps.set(app.name, {
        name: app.name,
        instanceIds: app.instanceIds,
        instanceCount: app.instanceCount,
        callCount: app.callCount,
        totalTime: app.totalTime,
        avgTime: app.avgTime,
        errors: app.errors,
        listenerCount: app.listenerCount,
        status: "active", // has been executed
      })
    }

    // add retroactive associations (may not have been executed yet)
    for (const [, uiApp] of this.coordinator.listenerUIApps) {
      if (!combinedApps.has(uiApp.name)) {
        combinedApps.set(uiApp.name, {
          name: uiApp.name,
          instanceIds: [uiApp.id],
          instanceCount: 1,
          callCount: 0,
          totalTime: "0.00",
          avgTime: "0.00",
          errors: 0,
          listenerCount: 1,
          status: "registered", // registered but not executed yet
        })
      } else {
        // update existing entry if it was from retroactive association
        const existing = combinedApps.get(uiApp.name)
        if (!existing.instanceIds.includes(uiApp.id)) {
          existing.instanceIds.push(uiApp.id)
          existing.instanceCount = existing.instanceIds.length
        }
        if (existing.status === "registered") {
          existing.listenerCount++
        }
      }
    }

    if (combinedApps.size === 0) {
      console.log("No UI apps detected in profiling")
      if (!stats.uiAppsOnly) {
        console.log("UI apps only mode is disabled - enable it with: bridge.streamCoordinator.profilerConfig({ uiAppsOnly: true })")
      }
      if (existingCount > associatedCount) {
        console.log(`Note: ${existingCount - associatedCount} Angular listeners exist but weren't associated with UI apps`)
        console.log("This may be because they were registered before interception was set up")
      }
      return stats
    }

    // Sort by total time (active first), then by name
    const sortedApps = [...combinedApps.values()].sort((a, b) => {
      if (a.status === "active" && b.status === "registered") return -1
      if (a.status === "registered" && b.status === "active") return 1
      if (a.status === b.status) {
        return parseFloat(b.totalTime || 0) - parseFloat(a.totalTime || 0)
      }
      return 0
    })

    sortedApps.forEach((app, i) => {
      const statusIcon = app.status === "active" ? "🟢" : "🟡"
      out.push(`${i + 1}. ${statusIcon} ${app.name} (${app.instanceCount} instance${app.instanceCount > 1 ? "s" : ""})`)
      out.push(`   Instance IDs: [${app.instanceIds.join(", ")}]`)
      out.push(`   Calls: ${app.callCount}, Total time: ${app.totalTime}ms, Avg: ${app.avgTime}ms`)
      out.push(`   Listeners: ${app.listenerCount}, Errors: ${app.errors}`)
      if (app.status === "registered") {
        out.push(`   Status: Registered (will profile on next stream update)`)
      }
      if (i < sortedApps.length - 1) out.push("")
    })

    if (existingCount > associatedCount) {
      out.push("")
      out.push(`   ${existingCount - associatedCount} Angular listeners not yet associated with UI apps`)
    }

    console.log(out.join("\n"))
    return { ...stats, combinedApps: sortedApps }
  }
}

export default UIAppProfiler
