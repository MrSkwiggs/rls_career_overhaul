<template>
  <div class="paint-tile-demo">
    <div class="demo-section">
      <h3>Single paint tiles</h3>
      <div class="tile-grid">
        <div class="tile-example">
          <BngPaintTile
            :paint="redPaint"
            paint-id="red001"
            paint-name="Scintilla Red"
            :size="64"
            tooltip-position="bottom"
            @click="onClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="bluePaint"
            vehicle-name="Gavril D-Series"
            paint-name="D-Series Blue"
            :size="64"
            tooltip-position="bottom"
            @click="onClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="metallicPaint"
            paint-id="chrome001"
            paint-name="Chrome"
            :size="64"
            tooltip-position="bottom"
            @click="onClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="null"
            paint-id="empty001"
            paint-name="Empty Slot"
            :size="64"
            tooltip-position="bottom"
            @click="onClick"
          />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Multipaint tiles</h3>
      <div class="tile-grid">
        <div class="tile-example">
          <BngPaintTile
            :paint="dualPaint"
            paint-id="dual001"
            paint-name="Red & Blue"
            :size="80"
            tooltip-position="bottom"
            @click="onClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="triplePaint"
            paint-id="triple001"
            paint-name="RGB Triple"
            :size="80"
            tooltip-position="bottom"
            @click="onClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="quadPaint"
            paint-id="quad001"
            paint-name="Quad Mix"
            :size="80"
            tooltip-position="bottom"
            @click="onClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="metallicMultiPaint"
            paint-id="metallic-multi001"
            paint-name="Metallic Mix"
            :size="80"
            tooltip-position="bottom"
            @click="onClick"
          />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Different Sizes & Rectangles</h3>
      <div class="size-demo">
        <BngPaintTile
          :paint="purplePaint"
          paint-id="purple001"
          paint-name="Royal Purple"
          :size="32"
          tooltip-position="bottom"
          @click="onClick"
        />
        <BngPaintTile
          :paint="purplePaint"
          paint-id="purple001"
          paint-name="Royal Purple"
          :size="48"
          tooltip-position="bottom"
          @click="onClick"
        />
        <BngPaintTile
          :paint="purplePaint"
          paint-id="purple001"
          paint-name="Royal Purple"
          :size="64"
          tooltip-position="bottom"
          @click="onClick"
        />
        <BngPaintTile
          :paint="purplePaint"
          paint-id="purple001"
          paint-name="Royal Purple"
          :size="96"
          tooltip-position="bottom"
          @click="onClick"
        />
        <BngPaintTile
          :paint="purplePaint"
          paint-id="purple001"
          paint-name="Royal Purple"
          :size="128"
          tooltip-position="bottom"
          @click="onClick"
        />
      </div>

      <h4>Rectangular Tiles</h4>
      <div class="rectangle-demo">
        <BngPaintTile
          :paint="dualPaint"
          paint-id="rect-wide"
          paint-name="Wide Dual"
          :width="120"
          :height="60"
          tooltip-position="bottom"
          @click="onClick"
        />
        <BngPaintTile
          :paint="triplePaint"
          paint-id="rect-tall"
          paint-name="Tall Triple"
          :width="60"
          :height="120"
          tooltip-position="bottom"
          @click="onClick"
        />
        <BngPaintTile
          :paint="quadPaint"
          paint-id="rect-banner"
          paint-name="Banner Quad"
          :width="160"
          :height="40"
          tooltip-position="bottom"
          @click="onClick"
        />
      </div>
    </div>

    <div class="demo-section">
      <h3>Material Properties Demo</h3>
      <div class="material-grid">
        <div class="tile-example">
          <BngPaintTile
            :paint="mattePaint"
            paint-id="matte001"
            paint-name="Matte Black"
            :size="80"
            tooltip-position="bottom"
            @click="onClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="glossyPaint"
            paint-id="gloss001"
            paint-name="Glossy Black"
            :size="80"
            tooltip-position="bottom"
            @click="onClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="clearcoatPaint"
            paint-id="clear001"
            paint-name="Clearcoat Red"
            :size="80"
            tooltip-position="bottom"
            @click="onClick"
          />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Areas Demo</h3>
      <p>Click to select individual paints</p>
      <div class="tile-grid">
        <div class="tile-example">
          <BngPaintTile
            :paint="redPaint"
            paint-id="areas-red"
            paint-name="Areas: Red"
            :size="80"
            with-areas
            tooltip-position="bottom"
            @click="onAreaClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="dualPaint"
            paint-id="areas-dual"
            paint-name="Areas: Red & Blue"
            :size="80"
            with-areas
            tooltip-position="bottom"
            @click="onAreaClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="triplePaint"
            paint-id="areas-triple"
            paint-name="Areas: RGB Triple"
            :width="120"
            :height="60"
            with-areas
            tooltip-position="bottom"
            @click="onAreaClick"
          />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Areas + Menu Demo</h3>
      <p>Use controller to open menus with per-paint selection</p>
      <div class="tile-grid">
        <div class="tile-example">
          <BngPaintTile
            :paint="redPaint"
            paint-id="menu-red"
            paint-name="Areas + Menu: Red"
            :size="80"
            with-areas
            with-menu
            tooltip-position="bottom"
            @click="onMenuClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="dualPaint"
            paint-id="menu-dual"
            paint-name="Areas + Menu: Red & Blue"
            :size="80"
            with-areas
            with-menu
            tooltip-position="bottom"
            @click="onMenuClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="triplePaint"
            paint-id="menu-triple"
            paint-name="Areas + Menu: RGB Triple"
            :width="100"
            :height="100"
            with-areas
            with-menu
            tooltip-position="bottom"
            @click="onMenuClick"
          />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Custom Menu Demo</h3>
      <p>Menus with custom actions (areas are disabled)</p>
      <div class="tile-grid">
        <div class="tile-example">
          <BngPaintTile
            :paint="redPaint"
            paint-id="custom-single"
            paint-name="Custom Menu: Single Paint"
            :size="80"
            with-menu
            :custom-menu="singlePaintMenu"
            tooltip-position="bottom"
            @click="onCustomClick"
            @menu-click="onCustomMenuClick"
          />
        </div>
        <div class="tile-example">
          <BngPaintTile
            :paint="dualPaint"
            paint-id="custom-multi"
            paint-name="Custom Menu: Multi Paint"
            :size="80"
            with-menu
            :custom-menu="multiPaintMenu"
            tooltip-position="bottom"
            @click="onCustomClick"
            @menu-click="onCustomMenuClick"
          />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Last Click</h3>
      <p>{{ lastClickedPaint?.label || "None" }}</p>
      <BngPaintTile
        v-if="lastClickedPaint?.paint"
        :paint="lastClickedPaint?.paint"
        paint-id="last-clicked"
        paint-name="Clicked paint"
        :size="64"
        tooltip-position="bottom"
      />
    </div>

    <div class="demo-section">
      <h3>Cache Status</h3>
      <div class="cache-info">
        <p>Cache Size: {{ cacheSize }}</p>
        <p>Currently Rendering: {{ isRenderingAny ? "Yes" : "No" }}</p>
        <p>Queue Length: {{ queueLength }}</p>
        <p>Active Renders: {{ activeRenders }}</p>
        <BngButton :accent="ACCENTS.secondary" @click="clearCache">Clear Cache</BngButton>
      </div>
    </div>

    <div class="demo-section">
      <h3>Interactive Controls</h3>
      <div class="controls">
        <div>
          <label>Red: {{ customRed }}</label>
          <input v-model.number="customRed" type="range" min="0" max="255" />
        </div>
        <div>
          <label>Green: {{ customGreen }}</label>
          <input v-model.number="customGreen" type="range" min="0" max="255" />
        </div>
        <div>
          <label>Blue: {{ customBlue }}</label>
          <input v-model.number="customBlue" type="range" min="0" max="255" />
        </div>
      </div>
      <div class="controls">
        <div>
          <label>Metallic: {{ customMetallic }}</label>
          <input v-model.number="customMetallic" type="range" min="0" max="1" step="0.01" />
        </div>
        <div>
          <label>Roughness: {{ customRoughness }}</label>
          <input v-model.number="customRoughness" type="range" min="0" max="1" step="0.01" />
        </div>
        <div>
          <label>Clearcoat: {{ customClearcoat }}</label>
          <input v-model.number="customClearcoat" type="range" min="0" max="1" step="0.01" />
        </div>
        <div>
          <label>Clearcoat Roughness: {{ customClearcoatRoughness }}</label>
          <input v-model.number="customClearcoatRoughness" type="range" min="0" max="1" step="0.01" />
        </div>
      </div>

      <div class="custom-preview">
        <BngPaintTile
          :paint="customPaint"
          paint-id="custom001"
          paint-name="Custom Paint"
          :size="96"
          tooltip-position="bottom"
          @click="onClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { BngPaintTile, BngButton, ACCENTS } from "@/common/components/base"
import { usePaintPreviews } from "@/services/paint-previews"
import Paint from "@/utils/paint"

const paintPreviews = usePaintPreviews()

// Demo state
const lastClickedPaint = ref(null)

const customRed = ref(255)
const customGreen = ref(100)
const customBlue = ref(50)
const customMetallic = ref(0.0)
const customRoughness = ref(0.1)
const customClearcoat = ref(0.0)
const customClearcoatRoughness = ref(0.0)

// single paint
const redPaint = [1, 0, 0, 0.2, 0.8, 0.5, 0.1]
const bluePaint = [0, 0.4, 0.8, 0.1, 0.9, 0.7, 0.2]
const metallicPaint = [0.8, 0.8, 0.9, 0.9, 0.1, 0.9, 0.05]
const purplePaint = [0.6, 0.2, 0.8, 0.3, 0.6, 0.4, 0.3]
const mattePaint = [0.1, 0.1, 0.1, 0, 1, 0, 0]
const glossyPaint = [0.1, 0.1, 0.1, 0.1, 0, 0.9, 0.02]
const clearcoatPaint = [0.8, 0.2, 0.2, 0.2, 0.4, 1.0, 0.1]

// multipaint
const dualPaint = [
  [1, 0, 0, 0.2, 0.6, 0.8, 0.1],
  [0, 0, 1, 0.1, 0.7, 0.9, 0.05]
]
const triplePaint = [
  [1, 0, 0, 0.2, 0.6, 0.8, 0.1],
  [0, 1, 0, 0.15, 0.65, 0.85, 0.08],
  [0, 0, 1, 0.1, 0.7, 0.9, 0.05]
]
const quadPaint = [
  [1, 0, 0, 0.2, 0.6, 0.8, 0.1],
  [1, 1, 0, 0.3, 0.5, 0.7, 0.12],
  [0, 1, 0, 0.15, 0.65, 0.85, 0.08],
  [0, 0, 1, 0.1, 0.7, 0.9, 0.05]
]
const metallicMultiPaint = [
  [0.8, 0.8, 0.9, 0.9, 0.1, 0.9, 0.05],
  [1, 0.84, 0, 0.8, 0.2, 0.95, 0.03],
  [0.72, 0.45, 0.2, 0.7, 0.3, 0.85, 0.08]
]

const customPaint = computed(() => [
  customRed.value / 255,
  customGreen.value / 255,
  customBlue.value / 255,
  customMetallic.value,
  customRoughness.value,
  customClearcoat.value,
  customClearcoatRoughness.value,
])

// Custom menu definitions
const singlePaintMenu = [
  { label: "Copy Paint", value: "copy" },
  { label: "Edit Paint", value: "edit" },
  { label: "Delete Paint", value: "delete" },
]

const multiPaintMenu = [
  { label: "Copy All Paints", value: "copy-all" },
  { label: "Duplicate Paint", value: "duplicate" },
  { label: "Randomize Colors", value: "randomize" },
  { label: "Reset to Default", value: "reset" },
]

const cacheSize = computed(() => paintPreviews.cacheSize)
const isRenderingAny = computed(() => paintPreviews.isRenderingAny)
const queueLength = computed(() => paintPreviews.queueLength)
const activeRenders = computed(() => paintPreviews.activeRenders)

// Click handlers
function onClick(index, paint) {
  const label = index === -1 ? "Basic click - All paints" : `Basic click - Paint ${index + 1}`
  paint = index === -1 ? paint : Paint.anyToArray(paint)[index]
  lastClickedPaint.value = { index, label, paint }
  console.log(`Basic paint clicked: index ${index}`)
}

function onAreaClick(index, paint) {
  const label = index === -1 ? "Area click - All paints" : `Area click - Paint ${index + 1}`
  paint = index === -1 ? paint : Paint.anyToArray(paint)[index]
  lastClickedPaint.value = { index, label, paint }
  console.log(`Area clicked: paint index ${index}`)
}

function onMenuClick(index, paint) {
  const label = index === -1 ? "Menu selection - All paints" : `Menu selection - Paint ${index + 1}`
  paint = index === -1 ? paint : Paint.anyToArray(paint)[index]
  lastClickedPaint.value = { index, label, paint }
  console.log(`Menu paint selected: index ${index} (${index === -1 ? 'all paints' : `paint ${index + 1}`})`)
}

function onCustomClick(index, paint) {
  const label = index === -1 ? "Custom click - All paints" : `Custom click - Paint ${index + 1}`
  paint = index === -1 ? paint : Paint.anyToArray(paint)[index]
  lastClickedPaint.value = { index, label, paint }
  console.log(`Custom paint clicked: index ${index}`)
}

function onCustomMenuClick(value, paint) {
  const label = `Custom menu - ${value}`
  lastClickedPaint.value = { index: null, label, paint }
  console.log(`Custom menu action: ${value}`)
}

function clearCache() {
  paintPreviews.clearCache()
  console.log("Paint cache cleared")
}
</script>

<style lang="scss" scoped>
.paint-tile-demo {
  display: flex;
  flex-flow: row wrap;
  gap: 1rem;
}

.demo-section {
  flex: 0 0 auto;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  width: fit-content;

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1em;
    color: #fff;
  }

  h4 {
    margin: 1rem 0 0.5rem 0;
    font-size: 1em;
    color: #ccc;
  }
}

.tile-grid,
.material-grid,
.size-demo,
.rectangle-demo,
.controls {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.tile-example {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8em;
  color: #ccc;
}

.cache-info {
  p {
    margin: 0;
    color: #ccc;
    font-size: 0.9em;
  }
}

.controls {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  > * {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    width: 200px;
    flex: 1 1 auto;
    > label {
      color: #ccc;
      font-size: 0.8em;
    }
    > input[type="range"] {
      width: 100%;
    }
  }
}

.custom-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  h4 {
    margin: 0;
  }
}

.btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.8em;

  &.btn-warning {
    background: #f39c12;
    color: white;
  }

  &.btn-warning:hover {
    background: #e67e22;
  }
}

pre {
  background: rgba(0, 0, 0, 0.5);
  color: #0f0;
  padding: 0.8rem;
  border-radius: 4px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 0.8em;
  margin: 0;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngPaintTile_demo.vue?raw"
export default {
  source,
  title: "Paint Preview Tile",
  description: `Shows paint preview tiles with cached rendering for optimal performance (direct memcopy of the pre-rendered bitmaps).`,
  propInfo: [
    {
      name: "paint",
      type: "Array|String|Object",
      desc: "Paint data. Can be a single paint array [R,G,B,[A,]metallic,roughness,clearcoat,clearcoatRoughness] or array of paint arrays for multipaint (diagonal stripes)"
    },
    {
      name: "paintId",
      type: "String",
      desc: "Unique identifier for paint caching. Takes precedence over vehicleName+paintName for cache key generation"
    },
    {
      name: "vehicleName",
      type: "String",
      desc: "Vehicle name for cache key generation. Used with paintName if paintId is not provided"
    },
    {
      name: "paintName",
      type: "String",
      desc: "Paint name for cache key generation and tooltip. Used with vehicleName if paintId is not provided"
    },
    {
      name: "paintNames",
      type: "Array",
      desc: "Array of paint names for tooltip when areas are enabled. If not specified, simple \"Paint 1\" will be used instead"
    },
    {
      name: "size",
      type: "Number",
      desc: "Square tile size in pixels. Overrides both width and height when provided"
    },
    {
      name: "width",
      type: "Number",
      desc: "Tile width in pixels. Default: 64"
    },
    {
      name: "height",
      type: "Number",
      desc: "Tile height in pixels. Default: 64"
    },
    {
      name: "disabled",
      type: "Boolean",
      desc: "Disables click interactions when true"
    },
    {
      name: "tooltip",
      type: "String",
      desc: "Custom tooltip text. Falls back to paintName if not provided"
    },
    {
      name: "tooltipPosition",
      type: "String",
      desc: "Tooltip position: 'top', 'bottom', 'left', 'right'. Default: 'top'"
    },
    {
      name: "radialLight",
      type: "Boolean",
      desc: "Uses radial light reflection instead of linear for more metallic appearance"
    },
    {
      name: "withAreas",
      type: "Boolean",
      desc: "Enables clickable areas for individual paint selection in multipaints using HTML image maps"
    },
    {
      name: "withMenu",
      type: "Boolean",
      desc: "Enables context menu with paint selection options. Auto-shows for multipaints or when customMenu is provided"
    },
    {
      name: "customMenu",
      type: "Array",
      desc: "Array of custom menu items. Items can be strings or objects with 'label', 'value', and 'action' properties"
    }
  ],
  eventInfo: [
    {
      name: "click",
      type: "(index: Number, paint: Any, event: Event) => void",
      desc: "Emitted when tile is clicked. Index -1 means all paints, 0+ means specific paint stripe. Paint is the raw paint data."
    },
    {
      name: "menu-click",
      type: "(value: Any, paint: Any, event: Event) => void",
      desc: "Emitted when custom menu item is clicked. Value comes from the menu item's 'value' property or array index."
    }
  ]
}

</script>
