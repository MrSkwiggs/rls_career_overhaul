<template>
  <div class="main" :class="{ working }">
    <div>
      <h3>Locales bbCode compilation checker</h3>
      <BngDropdown :disabled="working" v-model="settings.values.userLanguage" :items="languages" @change="() => settings.apply()" />
      <BngSwitch :disabled="working" v-model="tContext">Context translate</BngSwitch>
      <br/>
      <BngButton :disabled="working" @click="check(false)">Check</BngButton>
      <BngButton :disabled="working || !report.some(itm => !!itm.error)" @click="check(true)" v-bng-tooltip:bottom="'Language file will be reloaded'">Check invalid only</BngButton>
      <BngButton :disabled="!working && !aborting" @click="abort()" :accent="ACCENTS.attention">Abort</BngButton>
    </div>
    <div>
      <h3>
        Report
        <BngSwitch v-model="errOnly" style="font-size: initial">
          Errors only
          ({{ reportErr.length }})
        </BngSwitch>
      </h3>
      <BngProgressBar
        :value="report.length"
        :max="total"
        :min="0"
        gradient
        show-value-label />
      <div class="list">
        <template v-for="{ key, error } in reportView">
          <div :class="{ error: !!error }">
            <span>{{ key }}</span>
            <span>{{ error || "OK" }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, getCurrentInstance, defineComponent, render, h, inject } from "vue"
import { BngDropdown, BngButton, BngSwitch, BngProgressBar, ACCENTS } from "@/common/components/base"
import { vBngTooltip } from "@/common/directives"
import { useSettings } from "@/services/settings"
import { $translate, $content } from "@/services"
import { sleep } from "@/utils"

import * as COMPONENTS from "@/common/components/base"
import * as UTILITIES from "@/common/components/utility"
const ALL_COMPONENTS = [...Object.keys(COMPONENTS), ...Object.keys(UTILITIES)]
  .reduce((all, name) => name.endsWith("Demo") ? all : { ...all, [name]: COMPONENTS[name] || UTILITIES[name]}, {})

const ctx = getCurrentInstance().ctx

const settings = useSettings()

// Inject $simplemenu to provide it to dynamic components
const $simplemenu = inject("$simplemenu")

const languages = computed(() =>
  (settings.options.userLanguagesAvailable || [])
    .sort((a, b) => b.isOfficial - a.isOfficial || a.name.localeCompare(b.name))
    .map(lang => ({
      label: (lang.isOfficial ? "" : "[unofficial] ") + lang.name,
      value: lang.key,
    }))
)
let userLanguage // original language

const tContext = ref(false)

const working = ref(false)
const report = ref([])
const reportErr = computed(() => report.value.filter(itm => !!itm.error))
const reportView = computed(() => errOnly.value ? reportErr.value : report.value)
const total = ref(0)
const errOnly = ref(true)
const aborting = ref(false)

const abort = () => new Promise(async (resolve) => { // eslint-disable-line no-async-promise-executor
  if (working.value) {
    aborting.value = true
    while (working.value)
      await sleep(50)
  }
  resolve()
})

// TODO: ability to add exceptions for special translations, e.g. the ones with params

// note: we can't use inst.appContext.app.config.warnHandler and errorHandler because messages we're interested in happen out of our vue scope
const origWarn = console.warn
const origErr = console.error
const host = document.createElement("div")

async function reloadLocale() {
  const i18nLocale = window.vueI18n.global.locale
  const loc = i18nLocale.value
  const lang = settings.values.userLanguage
  await settings.apply({
    userLanguage: settings.options.userLanguagesAvailable[
      (settings.options.userLanguagesAvailable.findIndex(itm => itm.key === lang) + 1)
      % settings.options.userLanguagesAvailable.length
    ].key
  })
  while (i18nLocale.value === loc) {
    if (aborting.value) break
    await sleep(50)
  }
  await settings.apply({ userLanguage: lang })
  while (i18nLocale.value !== loc) {
    if (aborting.value) return
    await sleep(50)
  }
}

async function check(invalidOnly = false) {
  // setup
  working.value = true
  if (!invalidOnly) {
    report.value.splice(0)
    total.value = 0
  }
  // trigger locale reload
  if (invalidOnly) {
    await reloadLocale()
  }
  // setup
  const i18n = window.vueI18n.global
  const messages = i18n.messages.value[i18n.locale.value]
  const ids = []
  if (invalidOnly) {
    ids.push(...report.value.filter(itm => !!itm.error).map(itm => itm.key))
  } else {
    // count
    let cnt = 0
    // eslint-disable-next-line no-inner-declarations
    async function countDive(messages, path = []) {
      total.value += Object.keys(messages).length
      if (total.value > cnt + 100) {
        await sleep(0)
        cnt = total.value
      }
      for (const key in messages) {
        if (aborting.value) return
        if (typeof messages[key] === "object") {
          total.value -= 1
          await countDive(messages[key], [...path, key])
          continue
        }
        const id = (key !== "__text__" ? [...path, key] : path).join(".")
        // if (!id.startsWith("ui.modmanager")) continue // uncomment for quicker development of this thing
        ids.push(id)
      }
    }
    await countDive(messages)
  }
  // check
  let cnt = 0
  const translator = tContext.value ? $translate.contextTranslate : $translate.instant
  for (const id of ids) {
    if (aborting.value) break
    const item = invalidOnly
      ? report.value.find(itm => itm.key === id)
      : { key: id }
    item.error = []
    console.warn = msg => item.error.push(msg)
    console.error = msg => item.error.push(msg)
    try {
      const txt = translator(id)
      if (txt) {
        const cmp = defineComponent({
          template: $content.bbcode.parse(txt),
          components: ALL_COMPONENTS,
          provide: { $simplemenu },
        })
        render(h(cmp), host)
      }
    } catch (err) {
      item.error.push(err.message)
    }
    if (item.error.length > 0) {
      item.error = item.error.join("\n")
      item.error = item.error.replaceAll("[Vue warn]: Template compilation error: ", "")
    } else {
      delete item.error
    }
    if (!invalidOnly) {
      report.value.push(item)
      if (cnt++ > 100) {
        await sleep(0)
        cnt = 0
      }
    }
  }
  console.warn = origWarn
  console.error = origErr
  working.value = false
  aborting.value = false
}

onMounted(async () => {
  await settings.waitForData()
  userLanguage = settings.values.userLanguage
})
onBeforeUnmount(async () => {
  console.warn = origWarn
  console.error = origErr
  await abort()
  await settings.apply({ userLanguage })
})
</script>

<style lang="scss" scoped>
.main {
  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
  width: 100%;
  height: calc(100vh - 25em);
  overflow: hidden;
  > div {
    margin: 0 0.5em;
  }
  > div:first-child {
    flex: 0 0 25em;
    width: 25em;
  }
  > div:last-child {
    flex: 1 1 0%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
    width: 30%;
    // max-height: 100%;
    > * {
      flex: 0 0 auto;
    }
  }
  &.working {
    cursor: wait;
  }
  :deep(.bng-dropdown) {
    display: inline-flex;
  }
  .list {
    flex: 1 1 0% !important;
    display: block;
    width: 100%;
    height: 10%;
    overflow: hidden scroll;
    background-color: #0004;
    > div {
      &, > * {
        display: block;
        font-family: "Overpass Mono", monospace;
        overflow: hidden;
      }
      > span:first-child {
        line-height: 2em;
        background-color: #444;
        user-select: all;
      }
      &.error > span:first-child {
        background-color: #a33;
      }
      > span:last-child {
        font-size: 0.8em;
        white-space: pre;
        overflow-x: auto;
        user-select: text;
      }
    }
  }
}
</style>
