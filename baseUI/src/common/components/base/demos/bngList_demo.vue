<template>
  <div class="list-demo-layout">
    <div>
      <h3>Default list with BngImageTile as tiles</h3>
      <BngList class="demo-list-shrinked"
        :tile-width="5" :tile-margin="0.25">
        <BngImageTile
          v-for="(item, index) in sampleData1"
          :key="index"
          :icon="item.icon"
          :label="item.label"
          @click="onItem(item)"
        />
      </BngList>
      <h3>Ribbon layout with path</h3>
      <BngList :layout="LIST_LAYOUTS.RIBBON" :path="samplePath" path-limit="5" @path-click="onPath"
        :tile-width="5" :tile-margin="0.25">
        <BngImageTile
          v-for="(item, index) in sampleData1"
          :key="index"
          :icon="item.icon"
          :label="item.label"
          @click="onItem(item)"
        />
      </BngList>
      <span>Note: It does not block viewport scroll, which is by design.</span>
    </div>
    <div>
      <h3>List with path and layout selector (items support that)</h3>
      <BngList class="demo-list-big" layout-selector :path="samplePath" @path-click="onPath">
        <BngListItem
          v-for="(item, index) in sampleData2"
          :key="index"
          :data="item"
          :icon="false"
          @click="onItem(item)"
        />
      </BngList>
    </div>
  </div>
  <div>
    <hr/>
    <h3>Big list mode demo (with {{ sampleData3.length }} items per list)</h3>
    <span>This mode should be used when list takes time to render (e.g. really long lists or complex items).</span>
    <br/>
    <BngSwitch v-model="bigShown">Visibile</BngSwitch>
    &nbsp;
    <BngSwitch v-model="bigEnabled" :disabled="bigShown">Big mode</BngSwitch>
    &nbsp;
    <BngSwitch v-model="bigKeepAlive" :disabled="!bigEnabled">Keep alive</BngSwitch>
    &nbsp;
    <BngSwitch v-model="bigImmediate" :disabled="!bigEnabled">Immediate</BngSwitch>
    &nbsp;
    <BngSwitch v-model="bigTitles">Titles</BngSwitch>
    &nbsp;
    <BngSwitch v-model="bigDouble">x2 items</BngSwitch>
    <br/>
    Scroll to
    &nbsp;
    <BngButton :disabled="!bigList1" @click="scrollToFirst">first</BngButton>
    <BngButton :disabled="!bigList1" @click="scrollToRandom">random</BngButton>
    <BngButton :disabled="!bigList1 || !bigTitles" @click="scrollToRandomTitle">random title</BngButton>
    <BngButton :disabled="!bigList1" @click="scrollToLast">last</BngButton>
    &nbsp;
    <span v-show="scrollIdx > -1">Scrolled to item <b>№{{ scrollIdx + 1 }}</b></span>
  </div>
  <div class="list-demo-layout list-demo-layout-static">
    <div v-if="bigShown">
      <h3>Tiles/list layout</h3>
      <BngList ref="bigList1" class="demo-list-limited" layout-selector
        :big="bigEnabled"
        :immediate="bigImmediate"
        :keep-alive="bigKeepAlive"
        :tile-width="12" :tile-height="5" :tile-margin="0.25"
        :title-width="15" :title-height="3" :title-margin="0.25"
      >
        <template v-for="(item, index) in sampleData3" :key="index">
          <BngCardHeading v-if="item.isTitle" bng-list-title>Title {{ index + 1 }}</BngCardHeading>
          <BngListItem
            v-else
            :data="sampleData3[index]"
            :icon="false"
            @click="onItem(sampleData3[index])"
          />
        </template>
      </BngList>
    </div>
    <div v-if="bigShown">
      <h3>Ribbon layout</h3>
      <BngList ref="bigList2" :layout="LIST_LAYOUTS.RIBBON"
        :big="bigEnabled"
        :immediate="bigImmediate"
        :keep-alive="bigKeepAlive"
        :tile-width="12" :tile-height="5" :tile-margin="0.25"
        :title-width="15" :title-height="3" :title-margin="0.25"
      >
        <template v-for="(item, index) in sampleData3" :key="index">
          <BngCardHeading v-if="item.isTitle" bng-list-title>Title {{ index + 1 }}</BngCardHeading>
          <BngListItem
            v-else
            :data="sampleData3[index]"
            :icon="false"
            @click="onItem(sampleData3[index])"
          />
        </template>
      </BngList>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { BngList, LIST_LAYOUTS, BngImageTile, icons, BngButton, BngSwitch, BngCardHeading } from "@/common/components/base"
import BngListItem from "./bngListItem.vue"
const iconNames = Object.keys(icons)
const randomIcon = () => icons[iconNames[~~(Math.random() * iconNames.length)]]

const sampleData1 = Array.from({ length: 17 }).map((_, i) => ({
  label: "Item " + (i + 1),
  icon: randomIcon(),
}))

const sampleData2 = []
for (let i = 1; i <= 15; i++) {
  const disabled = i >= 13
  const itm = {
    name: "Object item " + i,
    icon: randomIcon(),
    integrity: Math.random(),
    color: Array.from({ length: 3 }, () => ~~(Math.random() * 256)),
    category: Math.random() < 0.5, // if it has subparts
    description: !disabled ? "Some description" : "Disabled item",
    tags: ["tag 1", "tag 2"],
    disabled,
    installed: Math.random() < 0.5,
  }
  if (Math.random() < 0.2) {
    itm.name += " long name is long"
    itm.description += " with longer description"
  }
  sampleData2.push(itm)
}

const bigTitles = ref(false)
const bigDouble = ref(false)
const sampleData3 = computed(() => {
  let amount = 2500
  if (bigDouble.value) amount *= 2
  const data = []
  for (let i = 1; i <= amount; i++) {
    const isTitle = bigTitles.value && (i === 1 || Math.random() < 0.1)
    const disabled = !isTitle && Math.random() < 0.1
    const itm = {
      name: isTitle ? "Title " + i : "Object item " + i,
      icon: randomIcon(),
      integrity: Math.random(),
      color: Array.from({ length: 3 }, () => ~~(Math.random() * 256)),
      category: Math.random() < 0.5, // if it has subparts
      description: !disabled ? "Some description" : "Disabled item",
      tags: ["tag 1", "tag 2"],
      disabled,
      installed: Math.random() < 0.5,
      isTitle,
    }
    if (Math.random() < 0.2) {
      itm.name += " long name is long"
      itm.description += " with longer description"
    }
    data.push(itm)
  }
  return data
})

const samplePath = [
  { label: "Lorem", items: [{ label: "Ipsum" }, { label: "Opossum" }] },
  { label: "Opossum" },
  { label: "Dolor", items: [{ label: "Sit" }, { label: "Sat" }, { label: "Soup" }] },
  { label: "Sit" },
  { label: "Amet" },
]

const onItem = item => console.log("Clicked on item", item)
const onPath = item => console.log("Clicked on path", item)

const bigList1 = ref()
const bigList2 = ref()
const bigShown = ref(true)
const bigEnabled = ref(true)
const bigImmediate = ref(false)
const bigKeepAlive = ref(true)
const scrollIdx = ref(-1)

function scrollToIndex(index) {
  scrollIdx.value = index
  bigList1.value.scrollToIndex(scrollIdx.value)
  bigList2.value.scrollToIndex(scrollIdx.value)
}
const scrollToFirst = () => scrollToIndex(0)
const scrollToLast = () => scrollToIndex(sampleData3.value.length - 1)
const scrollToRandom = () => scrollToIndex(~~(Math.random() * sampleData3.value.length))
const scrollToRandomTitle = () => {
  const titles = sampleData3.value.map((item, index) => item.isTitle ? index : -1).filter(index => index !== -1)
  scrollToIndex(titles[~~(Math.random() * titles.length)])
}
</script>

<style lang="scss" scoped>
.list-demo-layout {
  display: flex;
  flex-flow: row wrap;
  align-content: start;
  justify-content: stretch;
  height: calc(100% - 2em);
  overflow: hidden;
  > * {
    flex: 1 1 calc(50% - 1em);
    width: calc(50% - 1em);
    height: 100%;
    margin: 0.5em;
  }
}
.list-demo-layout-static {
  height: 30em;
  --list-skeleton-color: #fff4;
}

.demo-list-shrinked {
  height: 51%;
}

.demo-list-limited {
  height: 20em;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngList_demo.vue?raw"
export default {
  source,
  title: "Display a list of items",
  description: `Flexible list component with various layout options and features`,
  propInfo: [
    {
      name: "path",
      type: "Array",
      desc: "Array of strings to show in the path (breadcrumb) list. No list shows if this is not set",
    },
    {
      name: "pathLimit",
      type: "Number/String",
      desc: "Limit the number of items shown at once in the breadcrumb list. Defaults to `3`",
    },
    {
      name: "pathTarget",
      type: "Object",
      desc: "If specified, the path list will be telported into the given element",
    },
    {
      name: "layoutSelector",
      type: "Boolean",
      desc: "Switch for showing/hiding selector to choose between tile/row layout",
    },
    {
      name: "LayoutSelectorTarget",
      type: "Object",
      desc: "If specified, the layout selector will be telported into the given element",
    },
    {
      name: "layout",
      type: "String",
      desc: "Speciries the type of layout to use for the lis (tiles, list, ribbon). Valid values can be found in the `LIST_LAYOUTS` export from `@/common/components/base/bngList.vue`. Default is `LIST_LAYOUTS.DEFAULT`",
    },
    {
      name: "tileSizeCalc",
      type: "Function",
      desc: "Custom function to calculate tile dimensions dynamically. Receives context object `{ contWidth, contHeight, fontSize, layout }` and should return `{ width, height, margin, unit? }` where unit is 'em' (default) or 'px'. Has highest priority over all other size props. Use with `refresh()` exposed method to recalculate when needed."
    },
    {
      name: "targetWidth",
      type: "Number",
      desc: "If specified, the list will be sized to this width (in `em`)"
    },
    {
      name: "targetHeight",
      type: "Number",
      desc: "If specified, the list will be sized to this height (in `em`). Only used for `big` mode."
    },
    {
      name: "targetMargin",
      type: "Object",
      desc: "If specified, the layout selector will have a margin with the given value (in `em`)",
    },
    {
      name: "targetTitleWidth",
      type: "Number",
      desc: "If specified, title items will be sized to this width (in `em`). Only used for `ribbon` layout."
    },
    {
      name: "targetTitleHeight",
      type: "Number",
      desc: "If specified, title items will be sized to this height (in `em`). Only used for `big` mode with `tiles` or `list` layout."
    },
    {
      name: "targetTitleMargin",
      type: "Number",
      desc: "If specified, title items will have a margin with the given value (in `em`)."
    },
    {
      name: "big",
      type: "Boolean",
      desc: "If specified, the list will be optimised to render really big lists or just complex items. No need to turn it on every time, turn it on only when you feel that initial list rendering takes too much time."
    },
    {
      name: "immediate",
      type: "Boolean",
      desc: "Disables debounce and skeleton for instant rendering. Only works with `big` mode enabled. Useful when you need immediate updates without loading states."
    },
    {
      name: "keepAlive",
      type: "Boolean/Number",
      desc: "Keeps items rendered but hidden (with `display: none`) after they've been shown at least once. Only works with `big` mode enabled. If set to a number, limits the maximum number of kept-alive items using LRU eviction (items farthest from current view are removed first)."
    },
    {
      name: "noBackground",
      type: "Boolean",
      desc: "Switch to specify the list should have no background (will be transparent)",
    },
  ],
  attrInfo: [
    {
      name: "bng-list-title",
      desc: "Attribute to mark an item as a title/group header. Title items span the full row width in `tiles` and `list` layouts, and behave like regular items in `ribbon` layout. Use with components like `BngCardHeading`.",
    },
  ],
  exposedMethods: [
    {
      name: "navBack()",
      desc: "Navigate back in the breadcrumb path",
    },
    {
      name: "navTo(item)",
      desc: "Navigate to a specific item in the breadcrumb path",
    },
    {
      name: "scrollToIndex(index)",
      desc: "Scroll to a specific item by index. In big mode, centers the item in the viewport.",
    },
    {
      name: "refresh()",
      desc: "Recalculates item dimensions and rebuilds the layout cache. Use this after changing properties that affect item sizes (e.g., when using `tileSizeCalc` and the underlying size data changes).",
    },
  ],
}

</script>
