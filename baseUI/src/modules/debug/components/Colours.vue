<template>
  <div class="colours-container">
    <div class="controls">
      <BngInput v-model="searchQuery" :leading-icon="icons.search" />
      <BngSwitch v-model="showRgbVariables">Show RGB Variables</BngSwitch>
      <p v-if="showRgbVariables">
        RGB variables are supposed to be used as <code>rgba(var(--bng-orange-400-rgb), 0.5)</code>
      </p>
    </div>

    <div v-for="(group, groupIndex) in filteredColourGroups" :key="groupIndex" class="colour-group">
      <h3>{{ group.name }} <span class="count">({{ group.colours.length }})</span></h3>
      <div class="colour-grid">
        <div
          v-for="(colour, colourIndex) in group.colours"
          :key="colourIndex"
          class="colour-item"
          @click="selectVariable(colour.variable)"
        >
          <div
            class="colour-swatch"
            :style="{
              backgroundColor: colour.isRgb
                ? `rgb(${colour.value})`
                : `var(${colour.variable})`
            }"
          >
            <svg class="checker-background" width="100%" height="100%">
              <rect width="100%" height="100%" fill="url(#checkerPattern)" />
            </svg>
          </div>
          <div class="colour-info">
            <input
              type="text"
              :value="colour.variable"
              readonly
              class="variable-input"
              :ref="el => { if (el) inputRefs[colour.variable] = el }"
            />
          </div>
        </div>
      </div>
    </div>

    <svg width="0" height="0" style="position: absolute;">
      <defs>
        <pattern id="checkerPattern" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="8" height="8" fill="#fff" />
          <rect x="8" y="0" width="8" height="8" fill="#888" />
          <rect x="0" y="8" width="8" height="8" fill="#888" />
          <rect x="8" y="8" width="8" height="8" fill="#fff" />
        </pattern>
      </defs>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from "vue"
import { BngSwitch, BngInput, icons } from "@/common/components/base"

// State
const colourGroups = ref([])
const showRgbVariables = ref(false)
const searchQuery = ref("")
const inputRefs = reactive({})

// Computed properties
const visibleColourGroups = computed(() => {
  if (showRgbVariables.value) {
    // When RGB switch is on, only show the RGB Variables group
    return colourGroups.value.filter(group => group.name === "RGB Variables")
  } else {
    // When RGB switch is off, show all groups except RGB Variables
    return colourGroups.value.filter(group => group.name !== "RGB Variables")
  }
})

const filteredColourGroups = computed(() => {
  if (!searchQuery.value.trim()) {
    return visibleColourGroups.value
  }

  const query = searchQuery.value.toLowerCase().trim()

  return visibleColourGroups.value.map(group => {
    // Filter colours within each group
    const filteredColours = group.colours.filter(colour =>
      colour.variable.toLowerCase().includes(query) ||
      colour.name.toLowerCase().includes(query)
    )

    // Return a new group with filtered colours
    return {
      ...group,
      colours: filteredColours
    }
  }).filter(group => group.colours.length > 0) // Only include groups with matching colours
})

// Methods
function selectVariable(variable) {
  // Find the input element for this variable
  const input = inputRefs[variable]
  if (input) {
    input.focus()
    input.select()

    // Copy to clipboard
    try {
      document.execCommand("copy")
    } catch (err) {
      console.error("Failed to copy variable to clipboard", err)
    }
  }
}

function detectCssVariables() {
  // Get all stylesheets
  const styleSheets = Array.from(document.styleSheets)
  const bngVariables = new Map()

  // Extract all CSS variables that start with --bng-
  styleSheets.forEach(sheet => {
    try {
      // Some stylesheets might be inaccessible due to CORS
      const rules = Array.from(sheet.cssRules || [])

      rules.forEach(rule => {
        // Check if it's a CSSStyleRule
        if (rule.style) {
          // Get all CSS variables from this rule
          for (let i = 0; i < rule.style.length; i++) {
            const property = rule.style[i]
            if (property.startsWith("--bng-")) {
              const value = rule.style.getPropertyValue(property)
              bngVariables.set(property, value)
            }
          }
        }
      })
    } catch (e) {
      // Skip inaccessible stylesheets
      console.warn("Could not access stylesheet", e)
    }
  })

  // Get computed styles from :root to catch any variables not in stylesheets
  const rootStyles = getComputedStyle(document.documentElement)
  const rootEntries = Array.from(rootStyles).filter(prop => prop.startsWith("--bng-"))

  rootEntries.forEach(prop => {
    const value = rootStyles.getPropertyValue(prop).trim()
    if (value && !bngVariables.has(prop)) {
      bngVariables.set(prop, value)
    }
  })

  // Organize variables into groups
  organizeIntoGroups(bngVariables)
}

function organizeIntoGroups(variablesMap) {
  // Create a map to hold our groups
  const groups = new Map()
  const rgbGroup = { name: "RGB Variables", colours: [] }

  // Process each variable
  variablesMap.forEach((value, variable) => {
    // Check if it's an RGB variable
    const isRgb = variable.endsWith("-rgb")

    // If it's an RGB variable, add it to the RGB group
    if (isRgb) {
      const baseName = variable.substring(0, variable.length - 4) // Remove -rgb
      const baseVariable = variablesMap.get(baseName)

      rgbGroup.colours.push({
        name: formatVariableName(variable),
        variable: variable,
        value: value,
        baseName: baseName.substring(6), // Remove --bng-
        isRgb: true,
        baseVariable: baseName,
        baseValue: baseVariable
      })

      return // Skip the rest of the processing for RGB variables
    }

    // Extract the base name (e.g., "bng-orange" from "--bng-orange-400")
    const parts = variable.substring(6).split("-") // Remove --bng- and split

    // Skip variables that don't follow the pattern we expect
    if (parts.length < 1) return

    // Determine the group name
    let groupName
    let baseName

    // Simplified grouping logic
    if (parts.length >= 2) {
      // Try to extract a color name and a variant
      const lastPart = parts[parts.length - 1]
      const isNumeric = !isNaN(lastPart) || lastPart.startsWith("o") && !isNaN(lastPart.substring(1))

      if (isNumeric) {
        // This is likely a color with a variant like "orange-400" or "black-o8"
        baseName = parts.slice(0, parts.length - 1).join("-")

        // Create a simple group name from the base color
        let baseColor = parts[0]

        // Ignore prefixes like "add-" and "ter-" for grouping
        if (baseColor === "add" || baseColor === "ter") {
          // If the base is "add-blue" or "ter-blue", use "blue" as the group name
          if (parts.length > 1) {
            baseColor = parts[1]
          }
        }

        groupName = formatName(baseColor)
      } else {
        // This is likely a standalone color like "off-black"
        baseName = parts.join("-")
        groupName = "Other Colours"
      }
    } else {
      // Simple case like "black"
      baseName = parts[0]
      groupName = formatName(baseName)
    }

    // Create the group if it doesn't exist
    if (!groups.has(groupName)) {
      groups.set(groupName, [])
    }

    // Add the variable to the group
    groups.get(groupName).push({
      name: formatVariableName(variable),
      variable: variable,
      value: value,
      baseName: baseName,
      isRgb: false
    })
  })

  // Sort variables within each group
  groups.forEach(colours => {
    colours.sort((a, b) => {
      // Extract numbers for sorting
      const aMatch = a.variable.match(/(\d+)$/)
      const bMatch = b.variable.match(/(\d+)$/)

      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1])
      }

      return a.variable.localeCompare(b.variable)
    })
  })

  // Sort RGB variables
  rgbGroup.colours.sort((a, b) => a.variable.localeCompare(b.variable))

  // Convert to array format for v-for
  colourGroups.value = Array.from(groups.entries()).map(([name, colours]) => {
    return {
      name: name,
      colours: colours
    }
  })

  // Add RGB group if it has any colours
  if (rgbGroup.colours.length > 0) {
    colourGroups.value.push(rgbGroup)
  }

  // Sort groups alphabetically
  colourGroups.value.sort((a, b) => a.name.localeCompare(b.name))

  // Move "Base Colours" to the end
  const baseIndex = colourGroups.value.findIndex(g => g.name === "Base Colours")
  if (baseIndex !== -1) {
    const baseGroup = colourGroups.value.splice(baseIndex, 1)[0]
    colourGroups.value.push(baseGroup)
  }

  // Move "RGB Variables" to the end
  const rgbIndex = colourGroups.value.findIndex(g => g.name === "RGB Variables")
  if (rgbIndex !== -1) {
    const rgbGroupObj = colourGroups.value.splice(rgbIndex, 1)[0]
    colourGroups.value.push(rgbGroupObj)
  }
}

function formatVariableName(variable) {
  // Check if it's an RGB variable
  if (variable.endsWith("-rgb")) {
    const baseName = variable.substring(6, variable.length - 4) // Remove "--bng-" and "-rgb"
    return `${formatName(baseName)} RGB`
  }

  // Format "--bng-orange-400" to "Orange 400"
  const parts = variable.substring(6).split("-") // Remove "--bng-" and split

  if (parts.length === 1) {
    // Handle cases like "--bng-black"
    return formatName(parts[0])
  } else if (parts[parts.length - 1].startsWith("o") && !isNaN(parts[parts.length - 1].substring(1))) {
    // Handle opacity variants like "--bng-black-o8"
    const opacity = parts[parts.length - 1].substring(1)
    return `${formatName(parts[0])} ${opacity}0%`
  } else if (!isNaN(parts[parts.length - 1])) {
    // Handle normal color variants like "--bng-orange-400"
    const shade = parts.pop()
    let baseName = parts.join(" ")

    // Remove prefixes for cleaner display
    // baseName = baseName.replace("add-", "").replace("ter-", "")

    return `${formatName(baseName)} ${shade}`
  }

  // Fallback for other formats
  return variable.substring(2)
}

// Convert kebab-case to Title Case
const formatName = (name) => name.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")

// Lifecycle hooks
onMounted(() => {
  detectCssVariables()
})
</script>

<style scoped>
.colours-container {
  padding: 1.25em;
  font-family: sans-serif;
}

h2 {
  color: var(--bng-orange-400);
  margin-bottom: 1.5em;
}

.controls {
  margin-bottom: 1.5em;
  display: flex;
  gap: 1em;
  align-items: center;
}

h3 {
  margin-top: 2em;
  margin-bottom: 1em;
  border-bottom: 1px solid #999;
  padding-bottom: 0.5em;
}

.count {
  font-size: 0.8em;
  color: var(--bng-cool-gray-500);
  font-weight: normal;
}

.colour-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13.75em, 1fr));
  gap: 0.75em;
}

.colour-item {
  display: flex;
  border-radius: var(--bng-corners-1);
  overflow: hidden;
  height: 2.25em;
  cursor: pointer;
}

.colour-swatch {
  width: 3.75em;
  height: 2.25em;
  position: relative;
}

.checker-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.colour-info {
  flex: 1;
  padding: 0;
  background-color: #000a;
  display: flex;
  align-items: center;
}

.variable-input {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  font-family: "Overpass Mono", "Noto Sans Mono", monospace;
  font-size: 0.7em;
  color: #fff;
  padding: 0 0.5em;
  outline: none;
  cursor: pointer;
}
</style>
