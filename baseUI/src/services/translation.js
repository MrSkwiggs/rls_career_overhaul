import { watch } from "vue"
import { createI18n } from "petite-vue-i18n"
import { useSettingsAsync } from "@/services/settings"
import { getURL, getFile } from "@/utils"

/*
  Warning: petite-vue-i18n supports only composable mode.
  This means that we should keep an eye on global usage of its properties, such as:
  - vueI18n.global.locale
  - vueI18n.global.messages
  These must have .value on them.
*/

// this lists angular translation keys for all loaded locales (for fallback translations)
const ANGULAR_TRANSLATE = []

let _angularTranslateFunc
let _i18n

const i18nVariant = "petite"
const defaultLocale = "en-US"

const localeCheckId = "ui.common.okay"
const checkLocale = () => _i18n && _i18n.global.t(localeCheckId) !== localeCheckId // if locale is okay, this will not be equal

let translate = val => val

export const initTranslation = () => {
  if (window.vueI18n?.__bng_i18n_variant !== i18nVariant) {
    if (window.vueI18n) {
      console.warn("Localisation library is already initialized, but its variant was not validated. Reloading...")
    }
    let creationArguments = {
      locale: defaultLocale,
      fallbackLocale: defaultLocale,
      silentTranslationWarn: true,
      fallbackWarn: false,
      missingWarn: false,
      warnHtmlMessage: false,
      // note: do NOT enable flatJson, as i18n still unwraps certain messages into objects and we lose some translations
      //       only petite variant with flatJson disabled does the job correctly
    }
    if (window.beamng && !window.beamng.shipping) {
      creationArguments.fallbackLocale = [defaultLocale, "not-shipping.internal"]
    }
    window.vueI18n = createI18n(creationArguments)
    window.vueI18n.__bng_i18n_variant = i18nVariant
  }
  _i18n = window.vueI18n
  return {
    i18n: _i18n,
    plugin: translationPlugin,
  }
}

export const loadLocale = async (locale, force = false) => {
  if (_i18n.global.availableLocales.includes(locale) && !force) return
  try {
    const url = getURL(`/locales/${locale}.json`)
    let resp
    try {
      resp = await getFile(url, 5)
    } catch (err) {
      if (err.message !== "Timeout") throw err
      console.warn(`Locale ${locale} load timed out, retrying with a bigger timeout...`)
      resp = await getFile(url, 10)
    }
    _i18n.global.setLocaleMessage(locale, preprocessLocaleJSON(JSON.parse(resp)))
  } catch (err) {
    console.error(`Failed to load ${locale} locale`, err)
  }
}

const setupUserLanguage = async () => {
  // load settings
  const settings = await useSettingsAsync()
  // watch for language change with immediate effect (it'll load user language right away)
  watch(() => settings.values.uiLanguage, async lang => {
    if (lang && lang !== defaultLocale) await loadLocale(lang)
    _i18n.global.locale.value = _i18n.global.availableLocales.includes(lang) ? lang : defaultLocale
    if (lang !== defaultLocale && !checkLocale()) console.warn(`Locale ${lang} is not behaving properly`)
  }, { immediate: true })
}

export const translationPlugin = () => ({
  install(app, options) {
    // load default language, then setup user language
    _i18n.global.locale.value = defaultLocale
    loadLocale(defaultLocale, true).then(async () => {
      if (!checkLocale()) {
        console.warn("Failed to load default locale, retrying...")
        await loadLocale(defaultLocale, true)
        if (!checkLocale()) {
          console.error(`Failed to load default locale!`)
        }
      }
      await setupUserLanguage()
    })
    return contextTranslatePlugin().install(app, options)
  }
})

export const contextTranslatePlugin = () => ({
  install(app, options) {
    translate = _wrapTranslate(app.config.globalProperties.$t || _i18n.global.t)
    // exposing the original $t function, since in composition mode it is not available by default
    app.config.globalProperties.$t = _i18n.global.t
    app.config.globalProperties.$ctx_t = (val, translateContext = true) => contextTranslate(val, translateContext)
    app.config.globalProperties.$mctx_t = multiContextTranslate
    // also make the wrapped clash handling version available in case it is needed
    app.config.globalProperties.$tt = translate
  }
})

const contextTranslate = (val, translateContext = false) => {
  const type = typeof val
  if (type === "undefined" || val === null) {
    return ""
  }
  if (type === "object") {
    if (val.txt && val.context) {
      let context = val.context
      if (translateContext) {
        context = { ...context }
        for (const key in context) {
          context[key] = contextTranslate(context[key], true)
        }
      }
      return getTranslation(val.txt, context)
    } else {
      val = val.txt || ""
    }
  }
  return getTranslation("" + val)
}

const multiContextTranslate = val => {
  if (val.txt) return contextTranslate(val)
  let description = ''
  for (const i of val) description += contextTranslate(i)
  return description
}

const getAngularTranslationFunc = () => {
  if (_angularTranslateFunc) return _angularTranslateFunc
  if (window.angular$translate) {
    _angularTranslateFunc = window.angular$translate.instant.bind(window.angular$translate)
  }
  return _angularTranslateFunc || translate
}

const getTranslation = (...vals) => (ANGULAR_TRANSLATE.includes(vals[0]) ? getAngularTranslationFunc() : translate)(...vals)


export const $translate = {
  instant: val => typeof val !== "undefined" ? translate(val) : "",
  contextTranslate,
  multiContextTranslate,
}

const rgxAngular = /{{.+}}/
const rgxAngularTranslation = /([^ ]?){{ *(?::: *)?'([^ |}]+)' *\| *translate *}}([^\w]?)/gi
// const rgxAngularTranslation = /([^ ]?){{ *(?::: *)?'([^ |}]+)' *\| *(?:translate|contextTranslate) *}}([^\w]?)/gi
function translateAngularToVue(text) {
  // replace linked translations
  let vueText = text.replace(
    rgxAngularTranslation,
    // this function is to deal with adjacent quotes that mess up the translation.
    // covering the string in curly braces doesn't work. so we're just going to add whitespaces.
    // TODO: find a better solution
    (_, q1, s, q2) => (q1 ? `${q1} ` : "") + `@:${s}` + (q2 ? ` ${q2}` : ""),
  )

  // replace context translations
  vueText = vueText.replace(/{{ *([a-z\d_.]+) *}}/gi, "{$1}")

  if (vueText === text || rgxAngular.test(vueText)) return null
  return vueText
}

export const preprocessLocaleJSON = obj => {
  const messages = {}
  for (const key in obj) {
    if (ANGULAR_TRANSLATE.includes(key)) continue
    let text = obj[key]
    const angularRequired = rgxAngular.test(text)
    if (angularRequired) {
      const vueText = translateAngularToVue(text)
      if (vueText) {
        messages[key] = vueText
      } else if (!ANGULAR_TRANSLATE.includes(key)) {
        ANGULAR_TRANSLATE.push(key)
      }
    } else {
      messages[key] = text
    }
  }
  return messages
}

const rgxLinkedTranslation = /@:([a-zA-Z0-9_][a-zA-Z0-9_.-]+[a-zA-Z0-9_])/g
const linkedNamespace = "__linked_custom"

function _linkedTranslation(msg) {
  if (!msg.includes("@:") || !rgxLinkedTranslation.test(msg)) return msg

  const locale = _i18n.global.locale.value
  const messages = _i18n.global.messages.value[locale]

  msg = msg.replace(rgxLinkedTranslation, (_, id) => "@:" + id)

  let uniqueId = ""
  let match
  rgxLinkedTranslation.lastIndex = 0
  while ((match = rgxLinkedTranslation.exec(msg)) !== null) {
    uniqueId += match[1].replace(/\./g, "_") + "__"
  }

  let fullId, messageId
  let counter = 0
  while (counter < 100) {
    messageId = uniqueId + ++counter
    fullId = linkedNamespace + "." + messageId
    let existingMessage = messages[fullId]
    // create new
    if (!existingMessage) {
      _i18n.global.mergeLocaleMessage(locale, { [fullId]: msg })
      break
    }
    // matching source of existing message
    if (existingMessage === msg) break
  }

  return fullId
}

function _wrapTranslate(f) {
  function translate(...args) {
    let key = args[0]
    if (!key) return ""
    if (typeof key !== "string") return key // not a translation key

    // FIXME: this function might need to check if the key is in ANGULAR_TRANSLATE, maybe even linked translations too

    key = _linkedTranslation(key)
    if (key.includes(" ")) return key // still not a translation key

    return f.apply(this, [key, ...args.slice(1)])
  }
  Object.defineProperty(translate, "name", { value: f.name })
  return translate
}
