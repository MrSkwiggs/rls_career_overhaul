<template>
  <div class="layout">
    <div>

      <h2>BngIcon</h2>
      Icon: <BngDropdown class="icon-list" v-model="iconPreview" :items="iconList" show-search />
      <div class="row">
        <BngColorPicker v-model="colour.icon" view="simple" />
        <div class="center">
          <BngIcon class="icon-preview" :type="icons[iconPreview]" :color="colour.iconHex" />
          <div>Tags: {{ icons[iconPreview].tags.join(", ") }}</div>
        </div>
      </div>
      <BngInput class="source" v-model="iconHtml" readonly />

      <h2>BngIconMarker</h2>
      <BngSwitch v-model="useIconsObject">Use objects in marker attribute</BngSwitch>
      (see instructions below)<br/><br/>
      <div class="row three">
        <div class="nowrap">Container: <BngDropdown class="icon-list" v-model="iconMarker" :items="markerList" /></div>
        <div class="nowrap">Point direction: <BngDropdown class="icon-list" v-model="markerPoint" :items="markerPointList" /></div>
        <div class="nowrap center"><BngSwitch v-model="useMarkerIcon">Use icon</BngSwitch></div>
      </div>
      <div class="row three">
        <div>
          <span class="bold">Back side (outline)</span>
          <BngColorPicker v-model="colour.back" view="simple" />
        </div>
        <div>
          <span class="bold">Front side (under icon)</span>
          <BngColorPicker v-model="colour.front" view="simple" />
        </div>
        <div class="center">
          <br />
          <BngIconMarker
            class="icon-preview"
            :type="useMarkerIcon ? icons[iconPreview] : undefined"
            :marker="iconMarker"
            :point="markerPoint"
            :color="colour.markerHex" />
        </div>
      </div>
      <BngInput class="source" v-model="markerHtml" readonly />

      <h2>Importing</h2>
      <div>
        To import component, add this line to <span class="tt">&lt;script setup&gt;</span>:<br />
        <span class="tt">import { BngIcon, BngIconMarker } from "@/common/components/base"</span><br />
        <br />
        To import icons object, also add this line:<br />
        <span class="tt">import { icons } from "@/common/components/base"</span><br />
        Or same for BngIconMarker:<br />
        <span class="tt">import { icons, markers, MARKER_POINTS } from "@/common/components/base/bngIconMarker.vue"</span><br />
      </div>
    </div>

    <div>
      <Tabs class="bng-tabs">
        <div tab-heading="Browser" class="unscrollable">
          <!-- <IconsDropdown @select="iconPreview = $event.name" /> -->
          <IconsList @select="iconPreview = $event.name" />
        </div>
        <div tab-heading="Categorised list" class="scrollable">
          <!-- sizes -->
          <Accordion :singular="true">
            <AccordionItem
              v-for="(tags, size) in iconTree"
              :key="size"
              :expanded="size === '24'"
              :selected="icons[iconPreview].size == size"
            >
              <template #caption>Size: {{ size }}</template>
              <template #controls>{{ Object.keys(iconsBySize[size]).length }} icons</template>
              <span v-if="size === '24'">These icons are suittable for most cases</span>
              <span v-else-if="size === '48'">These icons are made for big buttons</span>
              <span v-else-if="size === '56'">Marker container icons</span>
              <!-- tags -->
              <Accordion>
                <AccordionItem
                  v-for="tag in tags"
                  :key="tag.name"
                  :selected="icons[iconPreview].size == size && icons[iconPreview].tags.includes(tag.name)"
                >
                  <template #caption>{{ tag.name }}</template>
                  <template #controls>{{ tag.icons.length }} icon{{ tag.icons.length > 1? "s" : "" }}</template>
                  <!-- icons -->
                  <Accordion>
                    <AccordionItem
                      v-for="name in tag.icons"
                      :key="name"
                      class="icon-entry"
                      static
                      :selected="iconPreview === name"
                      @click="iconPreview = name"
                    >
                      <template #caption>
                        <BngIcon :type="icons[name]" />
                        {{ name }}
                      </template>
                    </AccordionItem>
                  </Accordion>
                </AccordionItem>
              </Accordion>
            </AccordionItem>
          </Accordion>
        </div>
      </Tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from "vue"
import { BngIcon, BngIconMarker, BngDropdown, BngColorPicker, BngInput, BngSwitch, icons, iconsBySize } from "@/common/components/base"
import { Accordion, AccordionItem, Tabs } from "@/common/components/utility"
import IconsList from "@/common/modules/icons/IconsList.vue"
import IconsDropdown from "@/common/modules/icons/IconsDropdown.vue"
import { markers, MARKER_POINTS } from "@/common/components/base/bngIconMarker.vue"
import { HSLToHex } from "@/utils/color"

const sorter = (a, b) => a.toLowerCase().localeCompare(b.toLowerCase())

const iconTree = Object.keys(iconsBySize).reduce((res, size) => {
  if (!(size in res)) res[size] = []
  const tags = []
  for (const [name, icon] of Object.entries(iconsBySize[size])) {
    for (const tag of icon.tags) {
      let idx = tags.indexOf(tag)
      if (idx === -1) {
        res[size].push({ name: tag, icons: [] })
        idx = tags.length
        tags.push(tag)
      }
      res[size][idx].icons.push(name)
    }
  }
  res[size].sort((a, b) => sorter(a.name, b.name))
  res[size].forEach(tag => tag.icons.sort(sorter))
  return res
}, {})

const iconPreview = ref("aperture")
const iconList = Object.keys(icons)
  .sort(sorter)
  .map(name => ({ label: `${name} (${icons[name].size})`, value: name }))

const iconMarker = ref("circlePin")
const markerList = Object.values(markers).map(name => ({ label: name, value: name }))
const markerPoint = ref("down")
const markerPointList = Object.values(MARKER_POINTS).map(point => ({ label: point, value: point }))

const colour = reactive({
  icon: { hue: 0.067, saturation: 1, luminosity: 0.5 },
  back: { hue: 0.067, saturation: 1, luminosity: 0.5 },
  front: { hue: 0.5, saturation: 0.75, luminosity: 0.1 },
  iconHex: computed(() => HSLToHex(colour.icon)),
  backHex: computed(() => HSLToHex(colour.back)),
  frontHex: computed(() => HSLToHex(colour.front)),
  markerHex: computed(() => (colour.backHex === colour.iconHex ? [colour.backHex, colour.frontHex] : [colour.backHex, colour.frontHex, colour.iconHex])),
})

const useIconsObject = ref(false)
const useMarkerIcon = ref(true)

const attrHtml = (state, attr, obj, icon) => (state ? `:${attr}="${obj}.${icon}"` : `${attr}="${icon}"`)
const iconHtml = computed(
  () => `<BngIcon ${attrHtml(true, "type", "icons", iconPreview.value)} color="${colour.iconHex}" />`
)
const markerHtml = computed(() => {
  const res = [`<BngIconMarker`]
  useMarkerIcon.value && res.push(attrHtml(true, "type", "icons", iconPreview.value))
  res.push(attrHtml(useIconsObject.value, "marker", "markers", iconMarker.value))
  markerPoint.value !== "down" && res.push(attrHtml(useIconsObject.value, "point", "MARKER_POINTS", markerPoint.value))
  res.push(`:color = "[${colour.markerHex.map(c => `'${c}'`).join(", ")}]"`)
  res.push("/>")
  return res.join(" ")
})
</script>

<style lang="scss" scoped>
.source :deep(input) {
  font-family: monospace;
  font-size: 80% !important;
  font-weight: bold;
}


.tt {
  font-family: monospace;
  background-color: #aaa3;
  padding: 0 0.3em;
  font-size: 80% !important;
  font-weight: bold;
}

.layout {
  display: flex;
  flex-flow: row nowrap;
  height: 100%;
  > * {
    flex: 0 0 50%;
    width: 50%;
    overflow: auto;
  }
}

.row {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  > * {
    flex: 0 0 48%;
    width: 48%;
  }
  &.three > * {
    flex: 0 0 32%;
    width: 32%;
  }
}

.center {
  text-align: center;
}

.nowrap {
  white-space: nowrap;
}

.bold {
  font-weight: 600;
}

:deep(.icon-list) {
  display: inline-flex;
}

.icon-preview {
  font-size: 5em;
  border: 1px dashed #aaa;
}

.icon-entry {
  cursor: pointer;
}

.bng-tabs, .bng-tabs .tab-content {
  height: 40em;
}

.scrollable {
  overflow: hidden auto;
  will-change: scroll-position;
}

.unscrollable {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./IconBrowser.vue?raw"
export default {
  source,
  title: "TODO - Friendly name",
  description: `TODO - Description of special demo`,
  propInfo: [],
  attrInfo: [],
}

</script>
