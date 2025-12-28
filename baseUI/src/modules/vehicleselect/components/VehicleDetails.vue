<template>
  <div class="details" :class="{ 'inline': inline }" v-bng-ui-nav-scroll.force bng-nav-scroll>

    <div class="preview">
      <BngCardHeading type="none" class="header-title" v-if="showHeaderTitle">
        {{ activeItemDetails.headerTitle }}
      </BngCardHeading>
      <div class="tags-and-preview" :class="{ 'has-header-title': showHeaderTitle }" >
        <div class="general-tags"  v-if="activeItemDetails?.iconTags?.length > 0">
          <BngTooltip v-for="icon in activeItemDetails?.iconTags" :key="icon.icon" :text="icon.label" position="left">
            <BngIcon v-if="icon.icon" :type="icon.icon" :label="icon.label" @click="goToMod(icon.goToMod)" :class="{ 'favourite-icon': icon.goToMod }" />
            <span class="icon-text-tag" v-if="icon.iconText">{{ icon.iconText }}</span>
          </BngTooltip>
        </div>

        <AspectRatio class="preview-image" :class="{ 'has-header-title': showHeaderTitle }" :ratio="'16:8'" :external-image="activeItemDetails?.preview">
          <BngIcon
            v-if="!inline"
            class="favourite-icon"
            :type="activeItemDetails?.isFavourite ? 'star' : 'starSecondary'"
            @click="toggleFavourite"
            :color="activeItemDetails?.isFavourite ? 'var(--bng-ter-yellow-50)' : 'var(--bng-cool-gray-100)'" />

          <!-- Paint tile in bottom right corner -->
          <BngPaintTile
            v-if="hasPaintData"
            :paint-id="`${activeItem?.id || 'vehicle'}:${paintData.paint}`"
            :paint="paintData.paints"
            :paint-name="paintData.paintNames.join(', ')"
            :width="48 + 8"
            :height="24"
            class="preview-paint-tile"
            bng-no-nav="true"
            tabindex="-1"
          />
        </AspectRatio>
      </div>
    </div>

    <div class="vehicle-text-header">
      <div class="general-specs" v-if="activeItemDetails?.generalSpecs?.length > 0">
        <div class="spec-value" v-for="spec in activeItemDetails?.generalSpecs" :key="spec.key">
          <template v-if="Array.isArray(spec.value)">
            {{ $tt(spec.value[0].text) }}
          </template>
          <template v-else>{{ spec.value }}</template>
        </div>
      </div>
      <div class="divider" v-if="activeItemDetails?.generalSpecs.length > 0"></div>
      <div class="vehicle-tags">
        <template v-for="tag in activeItemDetails?.tags" :key="tag.key">
          <div class="source-icon-container" :class="{ 'auxiliary-icon': tag.auxiliary }" @click="tagClicked(tag)">
            <BngIcon v-if="tag.icon" :type="tag.icon" />
            <img class="svg-icon" v-if="tag.svg" :src="tag.svg" />
            {{ tag.label }}
          </div>
        </template>
        <div v-if="activeItemDetails?.sourceIcon" class="source-icon-container">
          <BngIcon :type="activeItemDetails?.sourceIcon.icon" @click="goToMod(activeItemDetails?.sourceIcon.goToMod)" /> {{ activeItemDetails?.sourceIcon.label }}
        </div>
        <div v-if="activeItemDetails?.isFavourite" class="source-icon-container"><BngIcon type="star" @click="toggleFavourite" /> Favourite</div>
        <div v-if="activeItemDetails?.configDetails.isAuxiliary" class="source-icon-container auxiliary-icon"><BngIcon type="bug" /> Auxiliary</div>
      </div>

      <div class="vehicle-description" v-if="activeItemDetails?.configDetails?.Description">
        {{ activeItemDetails?.configDetails?.Description }}
      </div>
    </div>

    <!-- Display detailed information if available -->
    <template v-if="activeItemDetails?.configDetails && !hideDetailsAndButtons" >
      <div v-for="(value, key) in activeItemDetails?.specificationsList" :key="key" class="specs-grid">
        <div class="specs-grid-container">
          <template v-for="specification in value.specifications" :key="specification.key">
            <div class="spec-cell" :class="{ 'full-width': !specification.key }">
              <div class="spec-label" v-if="specification.key">{{ specification.key }}:</div>
              <div class="spec-value">
                <template v-if="Array.isArray(specification.value)">
                  <div v-for="(item, index) in specification.value" :key="index" class="spec-value-item" :class="{ italic: item.italic }">
                    <span>{{ item.text }}</span>
                    <BngIcon class="spec-post-icon" v-if="specification.postIcon" :type="specification.postIcon" />
                    <BngIcon class="spec-post-icon" v-if="specification.openFolder" :type="'folder'" @click="openFolder(specification.value)" />
                  </div>
                </template>
                <template v-else>
                  <div class="spec-value">
                    <span>{{ specification.value }}</span>
                    <BngIcon class="spec-post-icon" v-if="specification.postIcon" :type="specification.postIcon" />
                    <BngIcon class="spec-post-icon" v-if="specification.openFolder" :type="'folder'" @click="openFolder(specification.value)" />
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
  <div class="bottom-section" v-if="!hideDetailsAndButtons">
    <div class="paint-list expanded">
      <template v-for="multiPaint in multiPaints" :key="multiPaint.name">
        <BngPaintTile
          :paint-id="`${activeItem?.id || 'vehicle'}:${multiPaint.name}`"
          :paint="multiPaint.paints"
          :paint-name="multiPaint.name"
          :paint-names="multiPaint.paintNames"
          :width="48 + 8"
          :height="24"
          class="multi-paint-item"
          :class="{ selected: selectedMultiPaint?.name === multiPaint.name }"
          @click="handleMultiPaintClick(multiPaint)" />
      </template>
      <template v-for="paint in sortedFactoryPaints" :key="paint.name">
        <BngPaintTile
          v-if="paint && paint.class === 'factory' && paint.name"
          :paint-id="`${activeItem?.id || 'vehicle'}:${paint.name}`"
          :paint="convertPaintToTileFormat(paint)"
          vehicle-name="factory"
          :paint-name="paint.name"
          :width="24"
          :height="24"
          class="paint-item"
          :class="{ selected: selectedPaint === paint }"
          @click="handlePaintClick(paint)" />
      </template>
    </div>
    <template v-if="activeItemDetails?.buttonInfo && !buttonOverride">
      <template v-for="button in activeItemDetails?.buttonInfo" :key="button.buttonId">
        <BngButton
          :bng-scoped-nav-autofocus="button.primary"
          :accent="button.primary ? 'main' : 'secondary'"
          :label="button.label"
          :icon="button.icon"
          @click="handleButtonClick(button.buttonId)" />
      </template>
    </template>
    <template v-if="buttonOverride">
      <BngButton
        :bng-scoped-nav-autofocus="true"
        :accent="'main'"
        :label="buttonOverride.label"
        :icon="buttonOverride.icon"
        @click="buttonOverride.click(activeItem, selectedPaint, selectedMultiPaint)" />
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue"
import { storeToRefs } from "pinia"
import { BngButton, BngIcon, BngPaintTile, BngBinding } from "@/common/components/base"
import { AspectRatio } from "@/common/components/utility"
import BngCardHeading from "@/common/components/base/bngCardHeading.vue"
import BngTooltip from "@/common/components/base/bngTooltip.vue"
import { vBngTooltip, vBngFocusIf, vBngUiNavScroll } from "@/common/directives"
import Paint from "@/utils/paint"
import useControls from "@/services/controls"
const Controls = useControls()
const { showIfController } = storeToRefs(Controls)

const props = defineProps({
  activeItem: {
    type: Object,
    default: null,
  },
  activeItemDetails: {
    type: Object,
    default: null,
  },
  executeButton: {
    type: Function,
    default: () => {},
  },
  toggleFavourite: {
    type: Function,
    default: () => {},
  },
  exploreFolder: {
    type: Function,
    default: () => {},
  },
  goToMod: {
    type: Function,
    default: () => {},
  },
  showHeaderTitle: {
    type: Boolean,
    default: true,
  },
  hideDetailsAndButtons: {
    type: Boolean,
    default: false,
  },
  inline: {
    type: Boolean,
    default: false,
  },
  buttonOverride: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(["focus-item"])

// activeItem and activeItemDetails are now passed as props

const handleButtonClick = buttonId => {
  let additionalData = {}
  if (selectedMultiPaint.value) {
    additionalData.paint = selectedMultiPaint.value.paintNames[0]
    additionalData.paint2 = selectedMultiPaint.value.paintNames[1]
    additionalData.paint3 = selectedMultiPaint.value.paintNames[2]
  }
  if (selectedPaint.value) {
    additionalData.paint = selectedPaint.value.name
  }
  props.executeButton(buttonId, additionalData)
  emit("button-click", buttonId)
}

const toggleFavourite = () => {
  if (props.activeItem) {
    props.toggleFavourite(props.activeItem)
  }
}

const openFolder = path => {
  props.exploreFolder(path)
}

const goToMod = modId => {
  props.goToMod(modId)
}

// Sorted factory paints
const sortedFactoryPaints = computed(() => {
  const factoryPaints = props.activeItemDetails?.paints?.factoryPaints
  if (!Array.isArray(factoryPaints)) {
    return []
  }
  return sortColors(factoryPaints).filter(paint => paint && paint.name)
})

// Compute multiPaintss like in Paint.vue
const multiPaints = computed(() => {
  const res = []
  const multiPaintSetups = props.activeItemDetails?.paints?.multiPaintSetups
  const factoryPaints = props.activeItemDetails?.paints?.factoryPaints

  if (!Array.isArray(multiPaintSetups) || !Array.isArray(factoryPaints)) {
    return res
  }

  for (let i = 0; i < multiPaintSetups.length; i++) {
    const setup = multiPaintSetups[i]
    const paintNames = [setup.paintName1, setup.paintName2, setup.paintName3]
    const paints = paintNames
      .map(name => {
        if (!name) return null
        return factoryPaints.find(paint => paint.name === name) || null
      })
      .filter(paint => paint !== null)

    if (paints.length > 0) {
      res.push({
        id: paintNames.join("|"),
        name: setup.name,
        paintNames,
        paints,
        applyAll: () => applyMultipaint(setup),
      })
    }
  }
  return res
})

// Check if additionalData exists and has paint information
const hasPaintData = computed(() => {
  return props.activeItemDetails?.additionalData?.paint &&
         props.activeItemDetails?.paints?.factoryPaints
})

// Get paint data for the preview tile (all 3 colors)
const paintData = computed(() => {
  if (!hasPaintData.value) return null

  const additionalData = props.activeItemDetails.additionalData
  const factoryPaints = props.activeItemDetails.paints.factoryPaints

  const paintNames = [
    additionalData.paint,
    additionalData.paint2,
    additionalData.paint3
  ].filter(name => name) // Remove undefined/null values

  const paints = paintNames
    .map(name => {
      const paint = factoryPaints.find(p => p.name === name)
      return paint ? convertPaintToTileFormat(paint) : null
    })
    .filter(paint => paint !== null)

  if (paints.length === 0) return null

  return {
    paint: paintNames[0], // Primary paint name
    paintNames: paintNames,
    paints: paints
  }
})

// Helper function to apply multiPaints (similar to Paint.vue)
function applyMultipaint(setup) {
  selectedMultiPaint.value = setup
  selectedPaint.value = null
}

const selectedMultiPaint = ref(null)
const selectedPaint = ref(null)
const isPaintsExpanded = ref(false)

const handleMultiPaintClick = (multiPaint, focus = true) => {
  selectedMultiPaint.value = multiPaints.value.find(mp => mp.name === multiPaint.name)
  selectedPaint.value = null
  if (focus) {
    emit("focus-item", "multiPaints")
  }
}

const handlePaintClick = paint => {
  selectedPaint.value = paint
  selectedMultiPaint.value = null
  emit("focus-item", "paints")
}

// Helper function to convert factory paint to BngPaintTile format
const convertPaintToTileFormat = paint => {
  if (!paint) return null

  // If paint already has the expected format, return as is
  if (paint.baseColor && paint.paintString) {
    return paint
  }

  // Convert to Paint object if needed
  try {
    const paintObj = new Paint()
    paintObj.paint = paint
    return paintObj.paintObject
  } catch (error) {
    console.warn("Failed to convert paint:", paint, error)
    return null
  }
}

const togglePaintsExpansion = () => {
  isPaintsExpanded.value = !isPaintsExpanded.value
}

const selectDefaultMultiPaint = () => {
  // Check if selectedItemDetails and paints exist
  if (!props.activeItemDetails?.paints) {
    return
  }

  // if no paint is selected, select the multiPaintSetup with the defaultForConfig
  const multiPaintSetups = props.activeItemDetails?.paints.multiPaintSetups
  if (Array.isArray(multiPaintSetups) && multiPaintSetups.length > 0) {
    const defaultMultiPaintSetup = multiPaintSetups.find(setup => setup.isDefault)
    if (defaultMultiPaintSetup) {
      // Find the corresponding multiPaints object
      const multiPaintsObj = multiPaints.value.find(mp => mp.name === defaultMultiPaintSetup.name)
      if (multiPaintsObj) {
        handleMultiPaintClick(multiPaintsObj, false)
        return
      }
    }
  }
}

watch(() => props.activeItemDetails, () => {
  selectDefaultMultiPaint()
})

onMounted(() => {
  selectDefaultMultiPaint()
})

// Color sorting functions
function average(arr) {
  return arr.reduce((a, b) => a + b) / arr.length
}

function valComparable(col, thres = 0.05) {
  let bool = true
  const av = average(col)
  for (let i = 0; i < col.length; i++) {
    bool = bool && av - thres <= col[i] && av + thres >= col[i]
  }
  bool = bool && (av > 0.8 || av < 0.2)
  return bool
}

function colorHigherHelper(itm) {
  if (!itm || !itm.orig || !itm.orig.baseColor || !Array.isArray(itm.orig.baseColor) || itm.orig.baseColor.length < 4) {
    return 0
  }

  const av = average(itm.orig.baseColor.slice(0, 3))
  const al = itm.orig.baseColor[3] / 2
  const res = Math.abs(av - 1) * al
  return res === 0 ? (av + al) / 2 : res + 1
}

function colorHigher(a, b) {
  if (!a || !b || !a.orig || !b.orig || !a.orig.baseColor || !b.orig.baseColor) {
    return 0
  }

  const aColor = valComparable(a.orig.baseColor.slice(0, 3))
  const bColor = valComparable(b.orig.baseColor.slice(0, 3))
  if (aColor && bColor) {
    return colorHigherHelper(b) - colorHigherHelper(a)
  } else if (aColor && !bColor) {
    return 1
  } else if (!aColor && bColor) {
    return -1
  } else {
    for (let i = 0; i < 3; i++) {
      if (a.val[i] !== b.val[i]) return a.val[i] - b.val[i]
    }
    return 0
  }
}

// Thanks to: http://www.alanzucconi.com/2015/09/30/colour-sorting/
function colorValue(arr) {
  if (!Array.isArray(arr) || arr.length < 4) {
    return [0, 0, 0, 0]
  }

  let repitions = 8
  let rgb = []
  for (let i = 0; i < 3; i++) {
    rgb[i] = (1 - arr[3] / 2) * arr[i] + (arr[3] / 2) * arr[i]
  }
  let lum = Math.sqrt(0.241 * rgb[0] + 0.691 * rgb[1] + 0.068 * rgb[2])
  let hsl = Paint.rgbToHsl(rgb)
  let out = [hsl[0], lum, hsl[1]].map(elem => elem * repitions)
  if (out[0] % 2 === 1) {
    out[1] = repitions - out[1]
    out[2] = repitions - out[2]
  }
  out.push(arr[3])
  return out
}

function sortColors(list) {
  if (!Array.isArray(list)) return []

  return list
    .filter(elem => elem && elem.baseColor && Array.isArray(elem.baseColor) && elem.baseColor.length >= 4)
    .map(elem => {
      return {
        val: colorValue(elem.baseColor),
        orig: elem,
      }
    })
    .sort(colorHigher)
    .map(elem => elem.orig)
}
</script>

<style scoped lang="scss">
.vehicle-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  color: white;
}
.inline {
  padding: 0 !important;
  background-color: transparent;
  .vehicle-text-header {
    background-color: transparent;
    border-radius: 0;
  }
  .preview {
    border-radius: 0;
    background-color: transparent;
    .preview-image {
      border-radius: 0;
    }
    .tags-and-preview {
      border-radius: 0;
      .general-tags {
      }
    }
  }
}
.preview {
  flex: 0 1 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  border-radius: 0.5rem 0.5rem 0 0;
  background-color: rgba(0, 0, 0, 0.4);

  .tags-and-preview {
    display: flex;
    flex-direction: row;
    align-items: center;
    align-self: stretch;
    border-radius: 0.5rem 0.5rem 0 0;
    &.has-header-title {
      border-radius: unset;
    }
    background-color: rgba(0, 0, 0, 0.4);
  }

}
.header-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 ;
}

.preview-image {
  width: 100%;
  border-radius: 0 0.5rem 0 0;
  overflow: hidden;
  justify-self: center;
  align-self: center;
  &.has-header-title {
    border-radius: unset;
  }
}
.favourite-icon {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  font-size: 2.5rem;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
  z-index: 2;
  &:hover {
    scale: 1.33;
  }
}

.preview-paint-tile {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 0.25rem;
  filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.6));
  z-index: 2;
  &:hover {
    border-color: rgba(255, 255, 255, 1);
    transform: scale(1.1);
  }
}

.source-icon {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  font-size: 2rem;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
  z-index: 2;
  opacity: 0.75;
}

.auxiliary-icon {
  background: repeating-linear-gradient(
    -45deg,
    rgba(var(--bng-orange-500-rgb), 0.35),
    rgba(var(--bng-orange-500-rgb), 0.35) 10px,
    rgba(var(--bng-orange-800-rgb), 0.1) 10px,
    rgba(var(--bng-orange-800-rgb), 0.1) 20px
  );
  > * {
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1));
  }
}

.info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 0.5rem;
}

.general-tags {
  font-size: 1.25rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.5rem;
  border-radius: 0.5rem 0 0 0;
}

.icon-text-tag {
  font-weight: 700;
  font-size: 1rem;
  text-align: center;
  text-wrap: nowrap;
}

.general-specs {
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.75rem;
  .spec-value {
    font-weight: 200;
  }
}

.vehicle-text-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: 0 0 0.5rem 0.5rem;
  padding: 0.5rem 0rem;
  padding-bottom: 0.75rem;
  margin-top: -0.5rem;
  .vehicle-description {
    font-size: 0.8rem;
    text-align: justify;
    padding: 0 0.75rem;
    padding-top: 0.15rem;
  }
}
.divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0.25rem 0;
}
.vehicle-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  padding: 0 0.5rem;
  font-size: 0.8rem;
  gap: 0.5rem;
}
.source-icon-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  font-size: 0.8rem;
  gap: 0.25rem;
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: 0.25rem;
  padding: 0.2rem 0.5rem;
  padding-left: 0.25rem;
  height: 1.5rem;
  .svg-icon {
    width: 1rem;
    height: 1rem;
  }
}
.vehicle-name {
  color: white;
  margin-bottom: 0rem;
  padding-bottom: 0.5rem;
  margin-top: 0.5rem;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  > :deep(.bng-button) {
    margin-left: 0.5rem;
  }
}

.info h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
  padding: 0 0.5rem;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-row:last-of-type {
  border-bottom: none;
}

.label {
  font-size: 0.85rem;
}

.value {
  font-weight: 500;
  color: white;
  font-size: 0.85rem;
}

.detailed-info {
  padding: 0;
}

.detailed-info h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 500;
}

.specs-grid {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  // background-color: rgba(0, 0, 0, 0.25);
  border-radius: 0.5rem;
  padding: 0.5rem;
}

.spec-group-label {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.15rem;
  margin-top: 0.15rem;
  margin-left: -0.5rem;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  .spec-group-icon {
    font-size: 0.9rem;
    margin-left: 0.5rem;
    font-style: normal;
    text-align: right;
    flex: 1;
  }
}

.specs-grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.spec-cell {
  display: flex;
  flex-direction: column;
  padding: 0.125rem 0.25rem;
}

.spec-label {
  font-size: 0.8rem;
  font-weight: 300;
  text-align: left;
}

.spec-value {
  font-size: 0.8rem;
  text-align: left;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: flex-start;
  font-weight: 500;
  .spec-post-icon {
    font-size: 0.9rem;
  }
  .italic {
    font-style: italic;
    font-weight: 300;
  }
}

.spec-cell.full-width {
  grid-column: 1 / -1;
}

.buttons-section {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.button-container {
  width: 100%;
}

.button-container :deep(.bng-button) {
  max-width: unset;
  width: calc(100% - 0.5rem);
  align-items: center;
}

.button-container :deep(.bng-button .label) {
  text-align: center;
}

.button-container :deep(.bng-button .icon) {
  transform: none;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 2rem;
}

.empty-state p {
  font-size: 1.1rem;
  margin: 0;
}

.bottom-section {
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 0.5rem;
  margin-top: 0.1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex: 0;
  > :deep(.bng-button) {
    max-width: unset;
    width: calc(100% - 0.25rem);
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}

.paint-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(1.75rem, 1fr));
  gap: 0rem;
  overflow: hidden;
  height: auto;
  justify-content: center;
  padding: 0.125em;

  .selected {
    border: 2px solid rgba(255, 255, 255, 1);
  }
  .paint-item {
    height: 1.75rem;
    width: 100%;
    border: 2px solid transparent;
    border-radius: 0.33rem;
    &.selected {
      border: 2px solid rgba(255, 255, 255, 1);
    }
    grid-column: span 2;
  }
  .multi-paint-item {
    grid-column: span 2;
    width: 100%;
    height: 1.75rem;
    border: 2px solid transparent;
    border-radius: 0.33rem;
    &.selected {
      border: 2px solid rgba(255, 255, 255, 1);
    }
  }
}
</style>
