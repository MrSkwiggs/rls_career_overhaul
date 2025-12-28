<template>
  <div ref="wrapper" class="bng-credits-wrapper" tabindex="0" @keypress="exit" bng-ui-scope="credits" v-bng-on-ui-nav:menu,back="exit">
    <div class="bng-credits-content">
      <img class="logo" :src="imageURL" alt="" />

      <!-- For each category in credits data -->
      <div v-for="(category, cIndex) in credits" :key="cIndex">
        <!-- Category Title -->
        <div class="category">
          <span>{{ $t(category.translateId) }}</span>
        </div>

        <!-- Container for the group of credits -->
        <div class="credits-table">
          <!-- For each member in the category -->
          <div class="member-row" v-for="(member, mIndex) in category.members" :key="mIndex">
            <!-- Name cell -->
            <span class="member-cell member-name">
              {{ member.first }}
              <span v-if="member.aka" class="aka">
                {{ '<' + member.aka + '>' }}
              </span>
              <span v-else>&nbsp;</span>
              {{ member.last }}
            </span>

            <!-- Dot cell -->
            <span class="member-cell member-dot" v-if="member.title">
              .
            </span>
            <span v-else>&nbsp;</span>

            <!-- Role cell -->
            <span class="member-cell member-role" v-if="member.title">
              {{ $t(member.title) }}
            </span>
            <span v-else>&nbsp;</span>
          </div>
        </div>
      </div>

      <div style="padding-top: 70vh"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { lua } from "@/bridge"
import { getAssetURL } from "@/utils"
import { vBngOnUiNav } from "@/common/directives"
import { useUINavScope } from "@/services/uiNav"
import credits from "@/modules/credits/data"

useUINavScope("credits")

const imageURL = getAssetURL("images/logos.svg#bng-drive-white")

const wrapper = ref()
let running = true

const exit = () => {
  running = false
  lua.extensions.unload("ui_credits")
  lua.scenetree["maincef:setMaxFPSLimit"](30)
  window.bngVue.gotoAngularState("menu.mainmenu")
}

onMounted(() => {
  lua.extensions.load("ui_credits")
  lua.scenetree["maincef:setMaxFPSLimit"](60)
  wrapper.value.focus()
  scrollContainer(wrapper.value, 65, exit)
})
onUnmounted(() => {
  exit()
})

// Scroll the container automatically upward at pxPerSecond speed.
function scrollContainer(container, pxPerSecond) {
  const scrollSpeed = pxPerSecond / 1000 // px/ms
  let currentPos = 0
  let lastTime = 0
  let smoother = 0

  window.requestAnimationFrame(function step(timestamp) {
    const delta = Math.min(150, Math.max(0, timestamp - lastTime))
    smoother += (delta - smoother) * 0.02
    const moveDelta = smoother * scrollSpeed // with smoother
    lastTime = timestamp
    currentPos += moveDelta
    const targetPos = container.scrollHeight - container.clientHeight
    if (running && currentPos < targetPos) {
      container.scrollTop = currentPos
      window.requestAnimationFrame(step)
    } else {
      exit()
    }
  })
}
</script>

<style scoped lang="scss">
.bng-credits-wrapper {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  text-align: center;
  background: radial-gradient(ellipse at top left, #334455 0%, #000 100%);
  -webkit-overflow-scrolling: touch;
  overflow: hidden;
  &:focus, &.focus-visible {
    outline: none !important;
    box-shadow: none !important;
    &::before {
      content: none !important;
      border: none;
    }
  }
}

.bng-credits-content {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  font-family: "Overpass", var(--fnt-defs);
  text-transform: uppercase;
  color: #fff;

  .logo {
    width: 30em;
  }

  .category {
    display: block;
    margin-top: 60px;
    margin-bottom: 20px;
    font-size: 32px;
    font-weight: bold;
  }

  .credits-table {
    display: table;
    /* Let the table fill the parent horizontally */
    width: 100%;
    /* Fix the table layout so columns remain consistent */
    table-layout: fixed;
    margin: 0 auto 40px;
  }

  .member-row {
    display: table-row;
  }

  .member-cell {
    display: table-cell;
    vertical-align: middle;
    font-size: 24px;
    font-style: normal;
    padding: 0.1em 0.05em;
  }

  .member-name {
    width: 50%;
    text-align: right;
    text-transform: capitalize;
  }

  .member-dot {
    width: 0.2em;
    text-align: center;
    color: var(--bng-orange-b400);
  }

  .member-role {
    width: 50%;;
    text-align: left;
    color: var(--bng-orange-b400);
    font-style: italic;
    text-transform: none;
  }

  .aka {
    text-transform: none;
    font-family: "Courier New", "Lucida Console", Consolas, monospace;
    text-shadow: 0 0 3px #0f0;
    font-weight: 50;
    font-size: 20px;
    -webkit-font-smoothing: none;
    margin: 0 0.3em;
  }
}
</style>
