import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { sleep } from "@/utils"
import Paint from "@/utils/paint"

const CACHE_LIMIT = 200
const TILE_SIZE = 64
const MULTI_ANGLE = 23

const MAX_CONCURRENT_RENDERS = 20 // max simultaneous renders
const QUEUE_INTERVAL = 10 // ms

const reflectionImageUrl = "/ui/ui-vue/src/assets/images/paint-reflection.jpg"
let reflectionImage = null
let reflectionImageDone = false

const renderCancelledError = new Error("Render cancelled")
const cacheCleanedError = new Error("Cache cleared")

function hashPaintData(paintData) {
  if (!paintData) return "<empty>"
  paintData = Paint.anyToArray(paintData, false)
  if (Array.isArray(paintData)) {
    if (Array.isArray(paintData[0])) {
      return paintData.map(paint => Array.isArray(paint) ? paint.join(",") : "<empty>").join("|")
    }
    return paintData.join(",")
  }
  return JSON.stringify(paintData)
}

const checkMultipaint = paintData =>
  Array.isArray(paintData) && paintData.length > 0 &&
  paintData.some(item => Array.isArray(item) && item.length >= 7)

export const usePaintPreviews = defineStore("paint-previews", () => {
  const previews = ref(new Map())
  const pendingRenders = ref(new Map())
  const renderQueue = ref([])
  const activeRenders = ref(0)
  const cacheListeners = new Set()
  const pendingBlobCleanup = new Set()
  let queueProcessor = null
  let blobCleanupTimeout = null

  {
    const img = new Image()
    img.onload = () => {
      reflectionImage = img
      reflectionImageDone = true
    }
    img.onerror = () => {
      console.warn("Failed to load metallic reflection image")
      reflectionImageDone = true
    }
    img.src = reflectionImageUrl
  }

  function startQueue(eager = false) {
    if (queueProcessor || renderQueue.value.length === 0) return
    const run = () => {
      if (renderQueue.value.length === 0) {
        stopQueue()
      } else if (activeRenders.value < MAX_CONCURRENT_RENDERS) {
        processQueue(renderQueue.value.shift())
        if (eager) startQueue()
      }
    }
    if (eager) run()
    else queueProcessor = setInterval(run, QUEUE_INTERVAL)
  }

  function stopQueue() {
    if (queueProcessor) {
      clearInterval(queueProcessor)
      queueProcessor = null
    }
    blobCleanup()
  }

  function isSystemIdle() {
    if (renderQueue.value.length > 0 || activeRenders.value > 0) return false
    for (const entry of previews.value.values()) {
      if (entry.blobGenerating) return false
    }
    return true
  }

  function blobCleanup() {
    if (blobCleanupTimeout) clearTimeout(blobCleanupTimeout)
    blobCleanupTimeout = setTimeout(() => {
      blobCleanupTimeout = null
      if (isSystemIdle() && pendingBlobCleanup.size > 0) {
        for (const blobUrl of pendingBlobCleanup) {
          URL.revokeObjectURL(blobUrl)
        }
        pendingBlobCleanup.clear()
      }
    }, 1000)
  }

  async function processQueue({ key, paintData, opts, resolve, reject, aborter }) {
    activeRenders.value++
    try {
      const checkAborted = () => {
        if (aborter.signal.aborted) throw renderCancelledError
      }
      checkAborted()
      const width = opts.width || TILE_SIZE
      const height = opts.height || TILE_SIZE
      const areas = calculatePaintAreas(paintData, width, height)
      const cvs = await renderPaint(paintData, width, height, opts.radialLight || false, areas, aborter)
      checkAborted()
      const bmp = await createImageBitmap(cvs)
      if (previews.value.size >= CACHE_LIMIT) { // remove oldest
        const oldestKey = previews.value.keys().next().value
        const oldestEntry = previews.value.get(oldestKey)
        cleanupCacheEntry(oldestEntry)
        previews.value.delete(oldestKey)
      }
      checkAborted()
      previews.value.set(key, {
        bitmap: bmp,
        paintData,
        paintHash: hashPaintData(paintData),
        areas,
      })
      resolve(bmp)
    } catch (err) {
      if (err !== renderCancelledError) reject(err)
    } finally {
      if (pendingRenders.value.has(key)) {
        const renderRequest = pendingRenders.value.get(key)
        renderRequest.aborter === aborter && pendingRenders.value.delete(key)
      }
      activeRenders.value--
    }
  }

  function getCacheKey({ paintId, vehicleName, paintName, width = TILE_SIZE, height = TILE_SIZE, radialLight = false }) {
    if (paintId) {
      return `paint#${paintId}@${width}x${height}${radialLight ? "R" : "L"}`
    }
    if (vehicleName && paintName) {
      return `vehicle:${vehicleName}:${paintName}@${width}x${height}${radialLight ? "R" : "L"}`
    }
    throw new Error("Either paintId or vehicleName+paintName must be provided")
  }

  function isCached(opts, paintData) {
    try {
      const key = getCacheKey(opts)
      const data = previews.value.get(key)
      if (!data) return false
      return !paintData || data.paintHash === hashPaintData(paintData)
    } catch {
      return false
    }
  }

  function getCachedPreview(opts, paintData) {
    try {
      const key = getCacheKey(opts)
      const data = previews.value.get(key)
      if (!data) return null
      if (data.paintHash !== hashPaintData(paintData)) {
        cleanupCacheEntry(data)
        previews.value.delete(key)
        return null
      }
      return data.bitmap
    } catch {
      return null
    }
  }

  async function generatePreview(paintData, opts) {
    const key = getCacheKey(opts)
    const paintHash = hashPaintData(paintData)

    if (pendingRenders.value.has(key)) {
      const existing = pendingRenders.value.get(key)
      if (existing.paintHash === paintHash) {
        return new Promise((resolve, reject) => existing.others.push({ resolve, reject }))
      } else {
        existing.aborter.abort()
        renderQueue.value = renderQueue.value.filter(
          item => !(item.key === key && item.aborter === existing.aborter)
        )
        const aborter = new AbortController()
        const others = [...existing.others]
        pendingRenders.value.set(key, {
          paintHash,
          others,
          aborter,
        })
        return new Promise((resolve, reject) => {
          others.push({ resolve, reject })
          renderQueue.value.unshift({
            key,
            paintData: Paint.anyToArray(paintData),
            opts,
            resolve: result => others.forEach(p => p.resolve(result)),
            reject: error => others.forEach(p => p.reject(error)),
            aborter,
          })
          startQueue(true)
        })
      }
    }

    const aborter = new AbortController()
    const others = []
    pendingRenders.value.set(key, {
      paintHash,
      others,
      aborter,
    })

    return new Promise((resolve, reject) => {
      others.push({ resolve, reject })
      renderQueue.value.push({
        key,
        paintData: Paint.anyToArray(paintData),
        opts,
        resolve: result => {
          others.forEach(p => p.resolve(result))
        },
        reject: error => {
          others.forEach(p => p.reject(error))
        },
        aborter,
      })
      startQueue()
    })
  }

  function cleanupCacheEntry(data) {
    if (!data) return
    data.bitmap?.close?.()
    if (data.blobUrl) pendingBlobCleanup.add(data.blobUrl)
  }

  function onCacheClear(callback) {
    cacheListeners.add(callback)
    return () => cacheListeners.delete(callback)
  }

  function notifyCacheCleared(type = "all", key = null) {
    cacheListeners.forEach(callback => {
      try {
        callback(type, key)
      } catch (error) {
        console.warn("Cache clear listener error:", error)
      }
    })
  }

  function clearCache(opts = undefined) {
    if (opts) {
      try {
        const key = getCacheKey(opts)
        cleanupCacheEntry(previews.value.get(key))
        previews.value.delete(key)
        if (pendingRenders.value.has(key)) {
          const req = pendingRenders.value.get(key)
          req.aborter.abort()
          req.others.forEach(p => p.reject(cacheCleanedError))
          pendingRenders.value.delete(key)
        }
        notifyCacheCleared("single", key)
      } catch { }
    } else {
      stopQueue()
      pendingRenders.value.forEach(req => {
        req.aborter.abort()
        req.others.forEach(p => p.reject(cacheCleanedError))
      })
      pendingRenders.value.clear()
      previews.value.forEach(cleanupCacheEntry)
      previews.value.clear()
      renderQueue.value.splice(0)
      activeRenders.value = 0
      notifyCacheCleared("all")
      startQueue()
    }
    blobCleanup()
  }

  async function getPreview(paintData, opts) {
    return getCachedPreview(opts, paintData) || await generatePreview(paintData, opts)
  }

  async function getBlobPreview(paintData, opts) {
    const paintHash = hashPaintData(paintData)
    const key = getCacheKey(opts)
    const bmp = await getPreview(paintData, opts)
    const data = previews.value.get(key)
    if (!data) return null // shouldn't happen normally but it could (e.g. during cache cleanup)
    if (data.blobUrl && data.paintHash === paintHash) return data.blobUrl
    while (data.blobGenerating) await sleep(10)
    if (data.blobUrl && data.paintHash === paintHash) return data.blobUrl
    // generate
    data.blobGenerating = true
    const canvas = new OffscreenCanvas(opts.width || TILE_SIZE, opts.height || TILE_SIZE)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(bmp, 0, 0)
    const blobUrl = URL.createObjectURL(await canvas.convertToBlob())
    const oldBlobUrl = data.blobUrl
    data.blobUrl = blobUrl
    delete data.blobGenerating
    // finalise
    if (oldBlobUrl) pendingBlobCleanup.add(oldBlobUrl)
    if (!previews.value.has(key)) {
      pendingBlobCleanup.add(blobUrl)
      blobCleanup()
      return null
    }
    blobCleanup()
    return blobUrl
  }

  function getAreas(opts) {
    const data = previews.value.get(getCacheKey(opts))
    return data ? data.areas : []
  }

  return {
    // reactive stuff
    cache: previews.value,
    cacheSize: computed(() => previews.value.size),
    isRenderingAny: computed(() => activeRenders.value > 0 || renderQueue.value.length > 0),
    queueLength: computed(() => renderQueue.value.length),
    activeRenders,
    // cache
    isCached,
    clearCache,
    onCacheClear, // subscribe to cache clear events
    // generators
    getCacheKey,
    getPreview,
    getBlobPreview,
    getAreas,
    // utilities
    checkMultipaint,
    toArray: Paint.anyToArray,
  }
})


/// rendering functions below ///

async function renderPaint(paintData, width = TILE_SIZE, height = TILE_SIZE, radialLight = false, areas = null, aborter = null) {
  paintData = Paint.anyToArray(paintData)

  if (!paintData) return renderEmpty(width, height, aborter)

  const isMultipaint = checkMultipaint(paintData)

  if (isMultipaint) {
    const clipData = areas || calculatePaintAreas(paintData, width, height)
    return renderMultipaint(paintData, width, height, clipData, radialLight, aborter)
  } else {
    paintData = Array.isArray(paintData[0]) ? paintData[0] : paintData
    return renderSinglePaint(paintData, width, height, radialLight, aborter)
  }
}

function createPaint(paintData) {
  let paint = { _isEmpty: true }
  if (!paintData) return paint
  try {
    paint = new Paint({ paint: paintData })
  } catch (err) { }
  return paint
}

function applyAntialiasing(ctx) {
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.antialias = true
}

function calculatePaintAreas(paintData, width, height) {
  if (!paintData) {
    return [[0, 0, width, height]]
  }

  const isMultipaint = checkMultipaint(paintData)

  if (!isMultipaint) return [[0, 0, width, height]]

  const paintCount = paintData.length
  const angle = Math.tan(MULTI_ANGLE * Math.PI / 180)
  const diagonalSpan = width + height * angle
  const stripeWidth = diagonalSpan / paintCount
  const overlap = 0.5

  const areas = []
  for (let i = 0; i < paintCount; i++) {
    const startX = i * stripeWidth
    const topLeft = startX - (i > 0 ? overlap : 0)
    const topRight = startX + stripeWidth + (i < paintCount - 1 ? overlap : 0)
    const bottomLeft = topLeft - height * angle
    const bottomRight = topRight - height * angle

    const coords = [
      Math.round(topLeft), 0,
      Math.round(topRight), 0,
      Math.round(bottomRight), height,
      Math.round(bottomLeft), height
    ]

    areas.push(coords)
  }

  return areas
}

async function renderEmpty(width, height, aborter = null) {
  const cvs = new OffscreenCanvas(width, height)
  const ctx = cvs.getContext("2d")
  applyAntialiasing(ctx)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = "rgba(128, 128, 128, 0.3)"
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
  ctx.lineWidth = 2
  if (aborter?.signal.aborted) return null
  for (let i = -height; i < width; i += 10) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + height, height)
    ctx.stroke()
  }
  return cvs
}

async function renderSinglePaint(paintData, width, height, radialLight = false, aborter = null) {
  try {
    const paint = createPaint(paintData)
    if (paint._isEmpty) return renderEmpty(width, height, aborter)
    if (aborter?.signal.aborted) return null
    const cvs = new OffscreenCanvas(width, height)
    const ctx = cvs.getContext("2d")
    applyAntialiasing(ctx)
    ctx.clearRect(0, 0, width, height)
    await renderPaintLayers(ctx, paint, width, height, radialLight, aborter)
    if (aborter?.signal.aborted) return null
    return cvs
  } catch (error) {
    console.error("Error rendering single paint:", error)
    throw error
  }
}

async function renderMultipaint(paintsArray, width, height, clipData = null, radialLight = false, aborter = null) {
  // render at higher resolution for better antialiasing
  const renderWidth = width + 20
  const renderHeight = height + 20
  const cvs = new OffscreenCanvas(renderWidth, renderHeight)
  const ctx = cvs.getContext("2d")

  applyAntialiasing(ctx)
  if (aborter?.signal.aborted) return null

  ctx.clearRect(0, 0, renderWidth, renderHeight)

  // scale existing areas to higher resolution
  const scaleX = renderWidth / width
  const scaleY = renderHeight / height
  clipData = clipData.map(coords => coords.map(
    (coord, i) => coord * (i % 2 === 0 ? scaleX : scaleY)
  ))

  for (let i = 0; i < paintsArray.length; i++) {
    if (aborter?.signal.aborted) return null
    const paintData = paintsArray[i]
    const coords = clipData[i]

    try {
      const paint = createPaint(paintData)
      let cvsStripe

      if (paint._isEmpty) {
        cvsStripe = await renderEmpty(renderWidth, renderHeight, aborter)
      } else {
        cvsStripe = new OffscreenCanvas(renderWidth, renderHeight)
        const ctx = cvsStripe.getContext("2d")
        await renderPaintLayers(ctx, paint, renderWidth, renderHeight, radialLight, aborter)
      }

      if (aborter?.signal.aborted) return null

      ctx.save()

      ctx.beginPath()
      ctx.moveTo(coords[0], coords[1])
      ctx.lineTo(coords[2], coords[3])
      ctx.lineTo(coords[4], coords[5])
      ctx.lineTo(coords[6], coords[7])
      ctx.closePath()
      ctx.clip()

      ctx.drawImage(cvsStripe, 0, 0)

      ctx.restore()
    } catch (error) {
      console.error(`Error rendering multipaint stripe ${i + 1}:`, error)
    }
  }

  if (aborter?.signal.aborted) return null

  const finalCanvas = new OffscreenCanvas(width, height)
  const finalCtx = finalCanvas.getContext("2d")
  applyAntialiasing(finalCtx)
  finalCtx.drawImage(cvs, 0, 0, renderWidth, renderHeight, 0, 0, width, height)

  return finalCanvas
}

function renderReflectionLight(ctx, width, height, radial = false, intensity = 1, roughness = 1) {
  intensity = Math.max(0, intensity * 0.5 - roughness * 0.2)
  if (intensity <= 0) return

  const steps = radial ? {
    zero: 0,
    start: 0.05,
    effect: 0.15,
    falloff: 0.165,
  } : {
    zero: 0,
    start: 0.01,
    effect: 0.05,
    falloff: 0.12,
  }
  steps.falloff += Math.min(1.0, roughness * (1 - steps.falloff))
  const gradStops = [
    //[steps.zero, "rgba(255, 255, 255, 0)"],
    [steps.start, `rgba(255, 255, 255, ${intensity * 0.5})`],
    [steps.effect, `rgba(255, 255, 255, ${intensity})`],
    [steps.falloff + Math.min(1.0, roughness * (1 - steps.falloff)), "rgba(255, 255, 255, 0)"],
  ]

  let grad = null

  if (radial) {
    // radial light
    const posY = -0.05 // vertical position
    const sizeX = 6 // width multiplier
    const sizeY = 0.6 // height multiplier

    ctx.save()

    const centerX = width * 0.5
    const centerY = height * posY
    ctx.translate(centerX, centerY)
    ctx.scale(sizeX, 1)
    ctx.translate(-centerX, -centerY)

    const radius = height * sizeY
    grad = ctx.createRadialGradient(
      centerX, 0, 0,
      centerX, centerY, radius
    )
    gradStops.forEach((args) => grad.addColorStop(...args))
  } else {
    // linear light
    // TODO: try adding a 3d bevel effect (with rounded corners ofc)
    grad = ctx.createLinearGradient(0, 0, 0, height * 0.65)
    gradStops.forEach((args) => grad.addColorStop(...args))
  }

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  ctx.restore()
}

async function renderPaintLayers(ctx, paint, width, height, radialLight = false, aborter = null) {
  applyAntialiasing(ctx)

  // base colour layer
  const rgb = paint.rgb255 || [255, 255, 255]
  ctx.fillStyle = `rgb(${rgb.join(', ')})`
  ctx.fillRect(0, 0, width, height)
  if (aborter?.signal.aborted) return

  // shadow layer
  const grad = ctx.createLinearGradient(0, 0, 0, height)
  grad.addColorStop(0, "rgba(0, 0, 0, 0)")
  grad.addColorStop(0.65, "rgba(0, 0, 0, 0)")
  grad.addColorStop(0.8, "rgba(0, 0, 0, 0.15)")
  grad.addColorStop(1, "rgba(0, 0, 0, 0.55)")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)
  if (aborter?.signal.aborted) return

  // metallic layer
  const metallic = Math.max(0, paint.metallic - paint.roughness / 0.5)

  if (metallic > 0.01) {
    while (!reflectionImageDone) {
      if (aborter?.signal.aborted) return
      await sleep(10)
    }
    if (aborter?.signal.aborted) return

    ctx.globalCompositeOperation = "multiply"
    ctx.globalAlpha = metallic

    if (reflectionImage) {
      // reflection image is loaded, render it
      const scale = 1
      const imageAspect = reflectionImage.width / reflectionImage.height
      const canvasAspect = width / height
      let drawWidth, drawHeight
      let offsetX = 0, offsetY = 0
      if (imageAspect > canvasAspect) {
        // image is wider than canvas
        drawHeight = height * scale
        drawWidth = height * imageAspect * scale
        // offsetY = (height - drawHeight) / 2
      } else {
        // image is taller than canvas
        drawHeight = width / imageAspect * scale
        drawWidth = width * scale
        // offsetX = (width - drawWidth) / 2
      }
      ctx.drawImage(reflectionImage, offsetX, offsetY, drawWidth, drawHeight)
    } else {
      // fallback if image failed to load
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
      ctx.lineWidth = 1
      for (let x = -height; x < width + height; x += 4) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + height, height)
        ctx.stroke()
      }
    }
    if (aborter?.signal.aborted) return

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = "source-over"
  }

  // reflection layer
  renderReflectionLight(ctx, width, height, radialLight, 1, paint.roughness)
  if (aborter?.signal.aborted) return

  // clearcoat layer
  renderReflectionLight(ctx, width, height, radialLight, paint.clearcoat, paint.clearcoatRoughness)
  if (aborter?.signal.aborted) return
}
