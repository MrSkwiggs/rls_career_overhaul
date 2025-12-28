<template>
  <div class="paint-presets">
    <div v-for="group in presetGroups" class="paint-presets-group">
      <span class="paint-presets-name">
        {{ $t(`ui.color.${group.name}`) }}:
      </span>
      <div class="presets-items">
        <BngPaintTile
          v-for="(preset, index) in group.presets" :key="`${index}#${preset.name}`"
          :size="24"
          :paint="preset"
          vehicle-name="factory"
          :paint-name="preset.name"
          tooltip-position="top"
          class="paint-presets-item"
          :data-preset-name="preset.name"
          :with-menu="editable && group.editable"
          :custom-menu="[{label: 'ui.common.delete', action: () => removePreset(preset.name)}]"
          @click="emit('apply', preset)"
        />
        <BngButton
          v-if="!group.presets || Object.keys(group.presets).length === 0"
          class="presets-empty"
          :accent="ACCENTS.text"
          @click="addPreset"
          bng-nav-item
          v-bng-on-ui-nav:ok.asMouse.focusRequired
        >
          {{ $t("ui.colorpicker.noPresets") }}
        </BngButton>
        <BngButton
          v-if="group.presets && Object.keys(group.presets).length > 0 && editable && group.editable"
          class="paint-presets-button"
          :accent="ACCENTS.text"
          @click="addPreset"
          :icon="icons.mathPlus"
          v-bng-tooltip:top="$t('ui.colorpicker.colToPre')"
          bng-nav-item
          v-bng-on-ui-nav:ok.asMouse.focusRequired
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, toRaw, computed, onMounted, nextTick } from "vue"
import { vBngOnUiNav, vBngTooltip } from "@/common/directives"
import { BngPaintTile, BngButton, ACCENTS, icons } from "@/common/components/base"
import { useSettings } from "@/services/settings"
import { setFocus } from "@/services/uiNavFocus"
import Paint from "@/utils/paint"

const settings = useSettings()

const props = defineProps({
  presets: {
    type: Object,
    required: true,
  },
  showText: {
    type: Boolean,
    default: false,
  },
  editable: {
    type: Boolean,
    default: false,
  },
  current: {
    // current paint so it could be saved to user presets
    type: Object,
  },
})

const emit = defineEmits(["apply"])

const factoryPresets = computed(() => {
  const presets = props.presets
  const factoryRes = {}
  const customRes = {}

  if (typeof presets === "object" && !Array.isArray(presets)) {
    const paint = new Paint()
    for (const name in presets) {
      try {
        paint.paint = presets[name]
        const paintObject = paint.paintObject

        // Check if the paint has a class property to determine if it's factory or custom
        if (presets[name] && typeof presets[name] === 'object' && presets[name].class === 'custom') {
          customRes[name] = paintObject
        } else {
          // Default to factory if no class specified or class is 'factory'
          factoryRes[name] = paintObject
        }
      } catch (err) {
        // console.warn(`Paint "${name}" is invalid`, val[name])
      }
    }
  }
  // console.log(presets, factoryRes, customRes)
  return { factory: factoryRes, custom: customRes }
})

const userPresets = ref({})

const presetGroups = computed(() => {
  // build group sequence with sources
  const res = []

  // factory paint selection
  if (Object.keys(factoryPresets.value.factory).length) {
    res.push({
      name: "factory",
      showTooltip: true,
      editable: false,
      presets: factoryPresets.value.factory,
    })
  }

  // custom paint selection
  if (Object.keys(factoryPresets.value.custom).length) {
    res.push({
      name: "custom",
      showTooltip: true,
      editable: false,
      presets: factoryPresets.value.custom,
    })
  }

  // user paint
  if (props.editable) {
    res.push({
      name: "user",
      showTooltip: false,
      editable: true,
      presets: userPresets.value || {},
    })
  }

  // rebuild presets
  for (const group of res) {
    let presets = Object.keys(group.presets).map(colname => ({
      name: colname,
      ...group.presets[colname],
      // note: user presets might have alpha 0..2 instead of 0..1
      css: `rgb(${group.presets[colname].baseColor.slice(0, 3).map(val => val * 255)})`,
    }))
    if (group.name !== "user") presets = sortColors(presets)
    group.presets = presets
    // console.log(group.name, group.presets.map(itm => itm.name))
  }
  // console.log(res)
  return res
})

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
  const av = average(itm.orig.baseColor.slice(0, 3))
  const al = itm.orig.baseColor[3] / 2
  const res = Math.abs(av - 1) * al
  return res === 0 ? (av + al) / 2 : res + 1
}

function colorHigher(a, b) {
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
  return list
    .map(elem => {
      return {
        val: colorValue(elem.baseColor),
        orig: elem,
      }
    })
    .sort(colorHigher)
    .map(elem => elem.orig)
}

function addPreset() {
  if (!props.current) return
  const colour = {
    ...props.current,
    baseColor: toRaw(props.current.baseColor),
  }
  let idx = 1
  while (`Custom ${idx}` in userPresets.value) idx++
  const presetName = `Custom ${idx}`
  userPresets.value[presetName] = colour
  savePresets()

  // Focus on the newly created preset after it's added
  nextTick(() => {
    const presetElements = document.querySelectorAll('.paint-presets-item')
    const newPreset = Array.from(presetElements).find(el => el.getAttribute('data-preset-name') === presetName)
    if (newPreset) {
      setFocus(newPreset)
    }
  })
}

function removePreset(name) {
  // Get the current preset elements before removal
  const presetElements = document.querySelectorAll('.paint-presets-item')
  const currentIndex = Array.from(presetElements).findIndex(el => el.getAttribute('data-preset-name') === name)

  // Remove the preset
  delete userPresets.value[name]
  savePresets()

  // Handle focus after removal
  nextTick(() => {
    const group = presetGroups.value.find(g => g.name === 'user')
    if (!group) return

    if (group.presets.length > 0) {
      // If there are still presets, focus on the previous one
      const newPresetElements = document.querySelectorAll('.paint-presets-item')
      const targetIndex = Math.min(currentIndex, newPresetElements.length - 1)
      setFocus(newPresetElements[targetIndex])
    } else {
      // If no presets left, focus on the "add preset" button
      const addButton = document.querySelector('.presets-empty')
      if (addButton) {
        setFocus(addButton)
      }
    }
  })
}

function savePresets() {
  settings.apply({ userPaintPresets: JSON.stringify(Object.values(userPresets.value)) })
}

onMounted(async () => {
  await settings.waitForData()
  let paints = {}
  if (settings.values.userPaintPresets) {
    paints = JSON.parse(settings.values.userPaintPresets.replace(/'/g, '"'))
    if (typeof paints === "object") {
      // convert array to object if needed
      if (Array.isArray(paints)) {
        paints = paints.reduce((res, paint, idx) => ({ ...res, [`Custom ${idx}`]: paint }), {})
      }
      const test = new Paint()
      for (const name in paints) {
        try {
          // test if it's valid
          test.paint = paints[name]
          paints[name] = test.paintObject
        } catch (fire) {
          // console.warn("Invalid paint:", paints[name])
          delete paints[name]
        }
      }
    }
  }
  userPresets.value = paints
})
</script>

<style lang="scss" scoped>
.paint-presets {
  display: flex;
  flex-direction: column;
  width: 100%;

  .paint-presets-group {
    max-width: 100%;
    margin: 0.5em 0;

    .paint-presets-name {
      display: block;
    }

    .presets-items {
      display: flex;
      flex-flow: row wrap;
      gap: 0.25em;

      .presets-empty {
        flex: 1 0.15 auto;
        text-align: center;
        font-size: 0.8em;
        color: var(--bng-off-white);
        align-items: center;
        max-width: 100%;
        padding: 0.5em;
      }
    }

    $size: 1.6em;

    .paint-presets-item {
      position: relative;
      display: inline-block;
      cursor: pointer;
    }

    .paint-presets-item,
    .paint-presets-button {
      width: $size !important;
      height: $size !important;
      min-width: $size !important;
      min-height: $size !important;
      max-width: $size !important;
      max-height: $size !important;
      margin: 0;
    }
    .paint-presets-button {
      // top: -0.6em;
      --bng-icon-size: 1.2em;
      --bng-icon-line-height: 0.9em;
    }

    .paint-presets-hint {
      float: right;
      font-size: 0.8em;
    }
  }
}
</style>
