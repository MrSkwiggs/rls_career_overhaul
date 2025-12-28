<template>
  <Teleport to="body">
    <div v-if="showDebug" id="vue-debug">
      <div class="handle" @click="toggleOpen">
        <div class="heading-wrapper">
        <span class="label"><strong>Vue</strong><span class="route-info" v-if="!isOpen">: {{ path }} [ {{routeName}} ]</span></span
        ><a @click="closeDebug">x</a>
        </div>
      </div>
      <div v-show="isOpen" class="main">
        <div>
          Current hash: {{ hash }}<br>
          Route name: {{ routeName }}
        </div>
        <hr />
        <div class="controls">
          <div v-if="showComponents">
            <a href="#" @click="menu" v-bng-double-click.capture="mainmenu" v-bng-tooltip="'Doubleclick to unload level'">Main Menu</a>
            <a href="#" @click="extra" v-if="EXTRA_ROUTE">⏩</a>
            <a href="#" @click="$simplemenu.value = !$simplemenu.value">{{ $simplemenu.value ? "✓" : "☐" }} SimpleMenu</a>
            <a href="#" @click="components">Components</a>
            <a href="#" @click="icons">Icons</a>
            <a href="#" @click="colours">Colours</a>
          </div>
          <select multiple @click="selectRoute">
            <optgroup v-for="group in routeGroups" :key="group.name" :label="group.name">
              <option v-for="route in group.routes" :key="route" :value="route" :selected="route === routeName">{{ route }}</option>
            </optgroup>
          </select>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from "vue"
import { useRoute } from "vue-router"
import { vBngDoubleClick, vBngTooltip } from "@/common/directives"
import router from "@/router"
import { useBridge } from "@/bridge"

const { lua } = useBridge()

const EXTRA_ROUTE = import.meta.env.VITE_MY_DEBUG_ROUTE

const routeGroups = router
  .getRoutes()
  .map(r => r.name)
  .filter(n => n !== "routelist")
  .sort((a, b) => a.localeCompare(b))
  .reduce((res, n) => {
    if (!n) return res
    const g = n.substring(0, 1)
    if (!res[g]) res[g] = { name: g.toUpperCase(), routes: [] }
    res[g].routes.push(n)
    return res
  }, {})

const route = useRoute(),
  hash = ref(location.hash.split("#")[1]),
  path = computed(() => route.path),
  routeName = computed(() => route.name),
  showDebug = ref(window._VueDebugState),
  isOpen = ref(window._VueDebugOpen),
  showComponents = router.hasRoute("components")

const bngVue = window.bngVue || {}

bngVue.debug = (state = true) => (showDebug.value = window._VueDebugState = state)
bngVue.reset = () => bngVue.gotoGameState("menu.mainmenu")

function toggleOpen() {
  isOpen.value = window._VueDebugOpen = !isOpen.value
}

function selectRoute(e) {
  if (e.target.value) bngVue.gotoGameState(e.target.value)
}

function icons() {
  bngVue.gotoGameState("components/IconBrowser")
  toggleOpen()
}

function colours() {
  bngVue.gotoGameState("components/Colours")
  toggleOpen()
}

function extra() {
  bngVue.gotoGameState(EXTRA_ROUTE)
  toggleOpen()
}

function components() {
  bngVue.showComponents()
  toggleOpen()
}
function menu() {
  bngVue.reset()
  toggleOpen()
}
function mainmenu() {
  toggleOpen()
  lua.returnToMainMenu()
}

// add component demo shortcut if we're in dev mode
if (process.env.NODE_ENV === "development") {
  bngVue.showComponents = () => {
    bngVue.gotoGameState("components")
  }
}

const closeDebug = e => {
  e.stopPropagation()
  bngVue.debug(false)
}

addEventListener("hashchange", e => {
  hash.value = e.newURL.split("#")[1]
})
</script>

<style lang="scss" scoped>
:root *:focus::before {
  content: none;
}

#vue-debug {
  z-index: var(--zorder_index_mdcontent) !important;
  position: absolute;
  background: #000c;
  color: white;
  right: 0;
  top: 42%;
  font-size: 10pt;
  // transform: translateY(2%);
  border-radius: var(--bng-corners-2);
  box-sizing: border-box;
  display: flex;
}

.main {
  padding: 1em 0.5em;
  box-sizing: border-box;
  background-color: #000d;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  height: 20rem;
  overflow-x: auto hidden;
  > * {
    flex: 0 0 auto;
    width: calc(100% - 0.5em);
  }
  .controls {
    flex: 1 1 0%;
    display: flex;
    flex-flow: row nowrap;
    align-items: stretch;
    justify-content: stretch;
    gap: 0.5em;
    > div {
      flex: 0 1 auto;
      > * {
        display: block;
        padding: 0.25em;
        font-size: 1.2em;
        text-decoration: none;
        color: #eee;
        &:hover {
          color: #f60;
        }
      }
    }
    > select {
      flex: 1 1 0%;
      max-width: 20em;
      background-color: #333;
      color: #eee;
    }
  }
}

.handle {
  padding: 0.5rem 0.25rem;
  cursor: pointer;
  overflow: hidden;
  width: 1.5rem;
  box-sizing: border-box;
  height: 20rem;
  .heading-wrapper {
    width: 19rem;
    transform-origin: 0 0;
    transform: rotate(90deg) translateY(-100%);
    display: flex;
    .label {
      flex: 1 1 auto;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
}

.route-info {
  font-size:90%;
}
</style>
