<template>
  <div class="components-demo" bng-ui-scope="compdemo" v-bng-on-ui-nav:back,menu="() => false">
    <h1>BNG UI - Documentation</h1>
    Components:
    <div class="demo-layout">
      <Accordion class="index" :expanded="true">
        <AccordionItem v-for="[listName, componentList] in Object.entries(componentLists)" :key="listName">
          <template #caption>
            <h3>{{ listName }}</h3>
          </template>
          <ul class="components-list">
            <li
              v-for="component in componentList" :key="component"
              :class="{
                current: current === component.name,
                'no-demo': !component.hasDemo,
              }"
              @click="() => navDemo(component.name)"
            >
              {{ component.name }}
            </li>
          </ul>
        </AccordionItem>
      </Accordion>
      <div class="demo" :class="[current]">
        <div class="demo-pre" v-if="demoView">
          <h2>
            {{ current }}<span class="friendly-title" v-if="demoView.title"> : {{ demoView.title }}</span>
          </h2>
          <div
            v-if="demoView.description || demoView.desc"
            class="description"
            v-html="markdown.parse(demoView.description || demoView.desc)"
          ></div>
          <template v-for="(section, key) in {
            Props: demoView.propInfo,
            Attrs: demoView.attrInfo,
            Events: demoView.eventInfo,
          }">
            <div v-if="section && section.length" class="section">
              <details>
                <summary>{{ key }} ({{ section.length }})</summary>
                <p>All are optional unless stated otherwise.</p>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="prop in section" :key="prop.name">
                      <td>
                        <code
                          ><strong>{{ prop.name }}</strong></code
                        >
                      </td>
                      <td>{{ prop.type }}</td>
                      <td v-html="markdown.parse(prop.desc || prop.description || '*No description*')"></td>
                    </tr>
                  </tbody>
                </table>
              </details>
            </div>
          </template>
          <template v-if="!demoView.noDemoView">
            <br />
            <h2 class="demo-heading">
              <div>Demo</div>
              <div>
                <button v-if="demoView.niceSource" @click="toggleSource">{{ sourceVisible ? "Hide" : "View" }} source</button>
              </div>
            </h2>
            <pre
              class="sample-code"
              v-if="sourceVisible && demoView.niceSource"><code v-html="hljs.highlight(demoView.niceSource, { language: 'html' }).value"></code></pre>
            <hr />
            <component :is="demoView" />
          </template>
        </div>
        <div v-else>No {{ current }} demo available</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import hljs from "highlight.js"
import "highlight.js/styles/obsidian.css"
import { Accordion, AccordionItem } from "@/common/components/utility"
import { vBngOnUiNav } from "@/common/directives"
import * as BaseComponentExports from "@/common/components/base"
import * as UtilityComponentExports from "@/common/components/utility"
import * as AppsUtilitiesExports from "@/common/components/appsUtilities"
import * as DirectiveExports from "@/common/directives"
import * as LayoutExports from "@/common/layouts"
import { ref, computed, watch, provide, onMounted, nextTick, markRaw } from "vue"
import { useRoute } from "vue-router"
import { markdown } from "@/services/content"
import { useUINavScope } from "@/services/uiNav"

const BaseComponentDemos = BaseComponentExports.DEMOS
const UtilityComponentDemos = UtilityComponentExports.DEMOS
const AppsUtilitiesDemos = AppsUtilitiesExports.DEMOS
const DirectiveDemos = DirectiveExports.DEMOS
const LayoutDemos = LayoutExports.DEMOS
const ModuleComponents = import.meta.hot ? {
  Wizard: import("@/common/modules/wizard/examples/AllExamples.vue"),
} : {}
const SpecialComponents = import.meta.hot ? {
  PairingTest: import("../components/PairingTest.vue"),
  PopupDemo: import("../components/PopupDemo.vue"),
  IconBrowser: import("../components/IconBrowser.vue"),
  TranslationCheck: import("../components/TranslationCheck.vue"),
  UINavComponents: import("../components/UINavComponents.vue"),
  // UINavTester: import("../components/UINavTester.vue"),
  Colours: import("../components/Colours.vue"),
} : {}

useUINavScope("compdemo")

onMounted(async () => {
  highlightBlocks()
  await loadDemos()
})

const highlightBlocks = () => {
  const blocks = [...document.querySelectorAll(".demo-pre pre:not(.sample-code) code")]
  blocks.forEach(block => {
    block.classList.add("language-html")
    block.parentElement.classList.add("sample-code")
    hljs.highlightElement(block)
  })
}

const route = useRoute()
watch(
  () => route.params.component,
  val => openDemo(val)
)
function navDemo(name) {
  window.bngVue.gotoGameState("components", { params: { component: name } })
}

const current = ref(route.params.component || "")
const sourceVisible = ref(false)

const openDemo = component => current.value = component

const toggleSource = () => sourceVisible.value = !sourceVisible.value

provide("loadDemo", openDemo)

const demoView = computed(() => {
  const view = allComponentsDemos.value[current.value]
  if (view) {
    view.niceSource = view.source && view.source.replace(/\s*?<script>[\s\S.]*?<\/script>/g, "")
    nextTick(highlightBlocks)
  }
  return view
})

const allComponentsDemos = ref([])

const componentLists = computed(() => Object.fromEntries(Object.entries({
  Base: BaseComponentExports,
  Utility: UtilityComponentExports,
  'UI Apps Utilities': AppsUtilitiesExports,
  Directives: DirectiveExports,
  Layouts: LayoutExports,
  Modules: ModuleComponents,
  Special: SpecialComponents,
}).map(([name, components]) => [
  name,
  Object.keys(components)
    .filter(name => name !== name.toLowerCase() && name !== name.toUpperCase())
    .sort()
    .map(name => ({ name, hasDemo: name in allComponentsDemos.value })),
])))

async function loadDemos() {
  const demos = [
    BaseComponentDemos,
    UtilityComponentDemos,
    AppsUtilitiesDemos,
    DirectiveDemos,
    LayoutDemos,
    ModuleComponents,
    SpecialComponents,
  ]
  for (const part of demos) {
    for (const [name, demo] of Object.entries(part)) {
      allComponentsDemos.value[name] = markRaw((await demo).default)
    }
  }
}
</script>

<style lang="scss" scoped>
$bgcolor: var(--bng-black-o8);
$textcolor: #fff;
$highlight_textcolor: #fff;
$hasdemo_textcolor: var(--bng-orange-100);
$current_background_color: var(--bng-cool-gray-700);
$fontsize: 16px;

pre.sample-code  * {
  user-select: text;
}

.components-demo {
  padding: 50px;
  background-color: $bgcolor;
  color: $textcolor;
  font-size: $fontsize;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.index {
  overflow-y: scroll;
  h3 {
    margin: 0;
  }
}

.demo-heading {
  display: flex;
  justify-content: space-between;
}

.section {
  & table {
    font-size: 90%;
    margin: 0 0.25em 1em 0.25em;
    max-width: 1000px;
    width: 100%;
  }
  & thead {
    background: #333;
  }
  & th,
  & td {
    vertical-align: top;
  }
  & th {
    text-align: left;
    color: #888 !important;
    padding: 0.25em;
  }
  & td {
    padding: 0.125em 0.25em;
    & :deep(p) {
      margin-bottom: 0.25em;
      margin-top: 0;
    }
  }
  & details {
    margin: 0 0.5em 0.25em 0.5em;
    font-size: 85%;
  }
  & summary {
    max-width: 1000px;
    font-weight: bold;
    padding: 0.25em 0.5em;
    cursor: pointer;
    border-radius: var(--bng-corners-1);
    background: #222;
    &:hover {
      background: #333;
    }
  }
}

.section summary:focus::before,
.demo-heading button:focus::before {
  content: "";
  display: none !important;
}

.demo-layout {
  display: flex;
  position: absolute;
  /* top: 0; */
  right: 0;
  left: 60px;
  bottom: 0;
  top: 180px;
}
.demo {
  width: calc(100% - 12em);
  top: -3em;
  margin: 1em;
  position: relative;
  border: 1px solid #333;
  border-radius: var(--bng-corners-2);
  padding: 1em;
  overflow-y: auto;
  & .description {
    font-size: 85%;
    color: #eee;
  }

  & :deep(code:not(pre code)) {
    background: #112028;
    color: #8cbbad;
    padding: 0.1em 0.4em;
    border-radius: calc(var(--bng-corners-2) * 0.8);
    border: 1px solid #444;
  }
}

:deep(.sample-code) {
  font-family: "Fira Code", "Consolas", "Andale Mono", "Lucida Console", "Monaco", "Ubuntu Mono", "Source", "Courier New", Courier, monospace;
  font-size: 14px;
  background: #112028;
  padding: 1em;
  border-radius: var(--bng-corners-2);
  border-width: 1px;
  border-color: #444;
  border-style: solid;
  margin: 1em 0.5em;
  overflow: auto;
  & code {
    background: inherit !important;
    padding: 0 !important;
  }
}

.demo.BngTooltip {
  overflow-x: visible;
  overflow-y: visible;
}

.layout-test {
  border: 1px dotted #ccc;
  .layout-baseline {
    position: relative;
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 100vw;
      $testbrd: 1px dashed #f0f;
      border: {
        top: $testbrd;
        bottom: $testbrd;
      }
      pointer-events: none;
    }
  }
}

.components-list {
  margin: 0;
  list-style: none;
  padding: 0;
  li {
    padding: 0.25em 0.5em;
    border-radius: var(--bng-corners-1);
    cursor: pointer;
    margin: 0;
    color: $hasdemo_textcolor;
    &.current {
      background-color: $current_background_color;
      color: var(--bng-orange-b400);
    }
    &.no-demo {
      text-decoration: line-through;
      color: var(--bng-ter-peach-600);
    }
    &:hover {
      color: $highlight_textcolor;
    }
  }
}

h2 {
  margin-top: 0.25em;
}
.friendly-title {
  color: #888;
  font-weight: normal;
}
</style>
