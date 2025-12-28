<template>
  <div class="messages-app">
    <div
      v-for="item in messagesList"
      :key="item._key"
      class="message-row"
    >
      <div v-if="showIcons && item.icon" class="icon-cell">
        <BngIcon
          class="msg-icon"
          fallbackType="info"
          v-bind="getIconProps(item)"
        />
      </div>
      <div class="text-cell">
        <template v-for="(part, i) in getParts(item)" :key="i">
          <span v-if="part.t === 'text'">{{ part.v }}</span>
          <BngBinding v-else :action="part.action" show-unassigned />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, onUnmounted, ref } from 'vue'
import { BngIcon, BngBinding } from '@/common/components/base'
import { useEvents } from '@/services/events'
import { $translate, $content } from '@/services'
import { lua } from '@/bridge'

const props = defineProps({
  maxMessages: { type: Number, default: undefined },
  dense: { type: Boolean, default: false },
  wrap: { type: Boolean, default: true },
  showIcons: { type: Boolean, default: true },
})

const events = useEvents()
const messagesByCategory = reactive({})
const bypassTtl = ref(false)
const getIconProps = (item) => {
  const icon = resolvedType(item.icon)
  if (icon) {
    return {
      type: icon,
    }
  }
  const externalImage = resolvedExternalImage(item.icon)
  if (externalImage) {
    return {
      externalImage,
    }
  }
  return {
    type: 'info',
  }
}

// Set to true to auto-open the ImGui Messages Debugger on mount
const DEBUG = false

const timerIntervalMs = 300
let timerId

const isAssetPath = (icon) => typeof icon === 'string' && icon.startsWith('/')
const resolvedType = (icon) => (typeof icon === 'string' && !isAssetPath(icon) ? icon : undefined)
const resolvedExternalImage = (icon) => (typeof icon === 'string' && isAssetPath(icon) ? icon : undefined)
const LOG_INCOMING = false
const ENABLE_BBCODE_PARSE = true
const LOG_BBCODE_WARNINGS = false

const messagesList = computed(() => {
  const list = Object.values(messagesByCategory)
  if (typeof props.maxMessages === 'number' && props.maxMessages > 0) {
    return list.slice(0, props.maxMessages)
  }
  return list
})

function translateText(val) {
  if (val == null) return ''
  const str = resolveTranslation(val)

  if (!ENABLE_BBCODE_PARSE) return str

  const hasHtmlOrBBCode = typeof str === 'string' && /<[^>]+>|\[[a-z]+[^\]]*\]/i.test(str)
  const parsedHtml = $content?.bbcode?.parse ? $content.bbcode.parse(str) : str
  const display = htmlToPlainText(parsedHtml)

  if (LOG_BBCODE_WARNINGS && hasHtmlOrBBCode) {
    try {
      console.warn('[messages] BBCode/HTML detected; prefer plain text. Original:', str, 'Suggested:', display)
    } catch (e) {}
  }
  return display
}

function resolveTranslation(val) {
  if (val == null) return ''
  if (typeof val === 'string') return $translate.instant(val)
  if (Array.isArray(val)) return $translate.multiContextTranslate(val)
  if (typeof val === 'object') return $translate.contextTranslate(val)
  return String(val)
}

function htmlToPlainText(html) {
  if (typeof html !== 'string') return String(html ?? '')
  // Normalize known line breaks to newlines
  let h = html.replace(/<br\s*\/?>/gi, '\n')
  // Decode entities using a DOM element
  const el = document.createElement('div')
  el.innerHTML = h
  let text = el.textContent ?? el.innerText ?? h
  // Ensure we removed any remaining tags
  text = text.replace(/<[^>]*>/g, '')
  return text
}

function sanitizeTextSegment(text) {
  if (!text) return ''
  if (!ENABLE_BBCODE_PARSE) return htmlToPlainText(text)
  const parsed = $content?.bbcode?.parse ? $content.bbcode.parse(text) : text
  return htmlToPlainText(parsed)
}

function getParts(item) {
  const raw = resolveTranslation(item.text)
  if (typeof raw !== 'string') return [{ t: 'text', v: sanitizeTextSegment(String(raw)) }]
  const parts = []
  const rgx = /\[action=([^\]]+)\]/gi
  let lastIndex = 0
  let match
  while ((match = rgx.exec(raw)) !== null) {
    const head = raw.slice(lastIndex, match.index)
    head && parts.push({ t: 'text', v: sanitizeTextSegment(head) })
    const actionName = match[1].trim()
    parts.push({ t: 'binding', action: actionName })
    lastIndex = match.index + match[0].length
  }
  const tail = raw.slice(lastIndex)
  tail && parts.push({ t: 'text', v: sanitizeTextSegment(tail) })
  // If nothing matched, ensure we at least return the whole text
  return parts.length ? parts : [{ t: 'text', v: sanitizeTextSegment(raw) }]
}

function normalizePayload(args) {
  const category = args?.category ?? 'default'
  const clear = !!args?.clear
  const text = (args && 'text' in args) ? args.text : (args && 'msg' in args ? args.msg : '')
  const icon = typeof args?.icon === 'string' ? args.icon : undefined
  let ttlMs = typeof args?.ttlMs === 'number' ? args.ttlMs
    : (typeof args?.ttl === 'number' ? args.ttl * 1000 : undefined)
  if (ttlMs == null) ttlMs = 5000
  return { category, clear, text, icon, ttlMs }
}

const CATEGORY_ICONS = [
  // Vehicle-specific
  { match: 'vehicle.absBehavior', icon: 'ABSIndicator' },
  { match: 'vehicle.brakingdistance', icon: 'carsFollow' },
  { prefix: 'vehicle.compressionBrake.', icon: 'engine' },
  { prefix: 'vehicle.damage.exhaust', icon: 'exhaustMuffler' },
  { prefix: 'vehicle.damage.deflated.', icon: 'tireDeflated' },
  { prefix: 'vehicle.beamstate.tireDeflated', icon: 'tireDeflated' },
  { match: 'vehicle.damage.mildOverrev', icon: 'powerGauge05' },
  { match: 'vehicle.damage.catastrophicOverrev', icon: 'powerGauge05' },
  { match: 'vehicle.damage.catastrophicOverTorque', icon: 'cogDamaged' },
  { match: 'vehicle.damage.flood', icon: 'water' },
  { match: 'vehicle.engine.isStalling', icon: 'powerGauge01' },
  { match: 'vehicle.ignition.ignitionLevel', icon: 'keys1' },
  { match: 'vehicle.lightbar.mode', icon: 'wigwags' },
  { match: 'vehicle.linelock.status', icon: 'wheelDisc' },
  { match: 'vehicle.postCrashBrake.impact', icon: 'hazardLights' },
  { prefix: 'vehicle.powertrain.diffmode.', icon: 'drivetrainGeneric' },
  { match: 'vehicle.powertrain.nitrousOxideInjection', icon: 'N2OHoriz' },
  { match: 'vehicle.shiftLogic.cannotShift', icon: 'cogsDamaged' },
  { match: 'vehicle.shiftermode', icon: 'transmissionM' },
  { match: 'vehicle.transbrake.status', icon: 'cogs' },
  { match: 'vehicle.twoStep.status', icon: 'signal04a' },
  { match: 'vehicle.tirePressureControl.inflateDeflate', icon: 'tirePressureGaugeOutlined03' },
  { prefix: 'vehicle.wheels.tirePunctured.', icon: 'tireAirPuff' },
  { prefix: 'vehicle.damage.device.', icon: 'cogDamaged' },
  { match: 'vehicle.driveModes', icon: 'ESC' },
  { prefix: 'vehicle.driveModes.', icon: 'ESC' },
  // Engine warnings
  { match: 'vehicle.engine.oilOverheating.true', icon: 'coolantTemp' },
  { match: 'vehicle.engine.blockMelted.true', icon: 'coolantTemp' },
  { match: 'vehicle.engine.headGasketDamaged.true', icon: 'coolantTemp' },
  { match: 'vehicle.engine.coolantOverheating.true', icon: 'coolantTemp' },
  { match: 'vehicle.engine.radiatorLeak.true', icon: 'coolantTemp' },
  // Generic engine fallback (after specific engine warnings above)
  { prefix: 'vehicle.engine.', icon: 'engine' },
  // Recovery
  { prefix: 'vehicle.recovery.', icon: 'tow' },
  // Gameplay/flows
  { match: 'rally', icon: 'rallyHelmet' },
  { match: 'fill', icon: 'import' },
  { match: 'align', icon: 'flag' },
  { match: 'delivery', icon: 'boxTruckFast' },
  { match: 'refueling', icon: 'fuelPumpFilling' },
  { prefix: 'refueling-', icon: 'fuelPumpFilling' },
  // UI camera
  { prefix: 'ui.camera.', icon: 'movieCamera' },
  // Input devices
  { match: 'input', icon: 'gamepad' },
  // UI damage app component messages
  { prefix: 'ui.apps.damage_app_vehicle_simple.component.', icon: 'cogsDamaged' },
  // Misc/debug
  { match: 'AI debug', icon: 'AIMicrochip' },
  { match: 'debug', icon: 'code' },
  { match: 'hydros', icon: 'steeringWheelCommon' },
  { match: 'GLTFexport', icon: 'loadMesh' },
  { match: 'bigmap.info.reachedTarget', icon: 'raceFlag' },
]

function deriveIconForCategory(category) {
  if (!category) return 'info'
  console.debug('[messages] deriveIconForCategory', category)
  for (const { match, prefix, icon } of CATEGORY_ICONS) {
    if (match && category === match) {
      console.debug(' -> match:', match, icon)
      return icon
    }
    if (prefix && category.startsWith(prefix)) {
      console.debug(' -> prefix:', prefix, icon)
      return icon
    }
  }
  console.debug(' -> no match, fallback to info')
  return 'info'
}

function onMessage(args) {
  const { category, clear, text, icon, ttlMs } = normalizePayload(args)
  if (LOG_INCOMING) {
    const display = translateText(text)
    try {
      console.info('[messages] incoming', { category, clear, icon, ttlMs, text, textType: typeof text, display })
    } catch (e) {}
  }
  let matched = []
  try {
    const re = new RegExp(category)
    matched = Object.keys(messagesByCategory).filter(k => re.test(k))
  } catch {
    // not a regex -> treat as literal
  }
  if (matched.length === 0) matched = [category]

  for (const cat of matched) {
    const isEmptyString = (typeof text === 'string' && text === '')
    if (clear || isEmptyString) {
      delete messagesByCategory[cat]
      continue
    }
    const offset = Object.keys(messagesByCategory).length * timerIntervalMs * 2
    messagesByCategory[cat] = {
      _key: cat,
      text,
      icon: icon || deriveIconForCategory(cat),
      ttl: ttlMs + offset,
    }
  }
}

function onClearAll() {
  if (LOG_INCOMING) {
    try { console.info('[messages] clear-all') } catch (e) {}
  }
  for (const k in messagesByCategory) delete messagesByCategory[k]
}

function tick() {
  for (const k in messagesByCategory) {
    const m = messagesByCategory[k]
    if (!bypassTtl.value) {
      m.ttl -= timerIntervalMs
    }
    if (m.ttl <= 0) delete messagesByCategory[k]
  }
}

onMounted(() => {
  events.on('Message', onMessage)
  events.on('ClearAllMessages', onClearAll)
  events.on('MessagesDebug', data => {
    if (data && typeof data.bypassTtl === 'boolean') {
      bypassTtl.value = !!data.bypassTtl
      if (LOG_INCOMING) {
        try { console.info('[messages] debug: bypassTtl =', bypassTtl.value) } catch (e) {}
      }
    }
  })
  timerId = window.setInterval(tick, timerIntervalMs)

  if (DEBUG) {
    // Ensure extension is loaded, then show the window
    lua.extensions.load('ui_messagesDebugger').then(() => {
      lua.extensions.ui_messagesDebugger.show()
    })
  }
})

onUnmounted(() => {
  if (timerId) window.clearInterval(timerId)
})
</script>

<style lang="scss" scoped>
.messages-app {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25em;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  font-family: var(--fnt-defs);
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
  background: rgba(var(--bng-off-black-rgb), 0.5);
  border-radius: var(--bng-corners-1);
  padding: 0.25em 0.5em;
}

.icon-cell {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-cell {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--bng-off-white);
  white-space: pre-wrap; /* respect \n from sanitized/translated text */
  word-break: break-word;
  padding-top: 0.125em;
}

.msg-icon {
  --bng-icon-size: 1.75em;
  --bng-icon-color: var(--bng-off-white);
}
</style>


