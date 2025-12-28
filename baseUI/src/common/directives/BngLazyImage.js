import { emptyImage } from "@/utils"
import { ExecQueue } from "@/services/queue"
import logger from "@/services/logger"

// max size by one side
// images larger than this will be resized and put in cache
const MAX_SIZE = 500

// max number of oversized images to keep in cache
// if cache is full, no resizing will be done
const OVERSIZE_LIMIT = 100

// number of images to load in parallel
const CONCURRENCY_LIMIT = 20

// queue interval in ms (zero means nextTick)
const QUEUE_INTERVAL = 0

const OBS_ID = "__bngLazyImage"

const cache = new Map()
const queue = new ExecQueue(QUEUE_INTERVAL, CONCURRENCY_LIMIT)

const targets = {
  src: (el, url, bmp) => el.src = url,
  // TODO: style background-image, style var
}

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      observer.unobserve(entry.target)
      const data = entry.target[OBS_ID]
      if (data.observed) {
        data.observed = false
        queue.shuffle()
        process(entry.target, data)
      }
    }
  }
})

// returns { url, bmp }
const loadImage = url => new Promise((resolve, reject) => {
  const img = new Image()
  img.onload = async () => {
    try {
      if (cache.size < OVERSIZE_LIMIT && (img.width > MAX_SIZE || img.height > MAX_SIZE)) {
        const ratio = img.width / img.height
        let width, height
        if (img.width > img.height) {
          width = MAX_SIZE
          height = MAX_SIZE / ratio
        } else {
          height = MAX_SIZE
          width = MAX_SIZE * ratio
        }
        // console.log(`resizing ${img.width}x${img.height} to ${width}x${height}`, img.src)
        const cvs = new OffscreenCanvas(width, height)
        const ctx = cvs.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)
        // if (window.beamng && window.beamng.shipping) {
        //   // TODO: render a warning text for devs about unoptimized assets
        // }
        // src = URL.createObjectURL(await cvs.convertToBlob()) // slow, don't use
        const bmp = await createImageBitmap(cvs)
        cache.set(img.src, { url, bmp })
      }
    } catch (err) {
      reject(err)
    }
    resolve({ url })
  }
  img.onerror = () => reject(new Error("Failed to load image"))
  img.src = url
})

function process(el, data) {
  const { url, callback } = data
  const apply = imgData => callback(el, imgData.url, imgData.bmp)
  if (cache.has(url)) {
    apply(cache.get(url))
    return
  }
  apply(emptyImage)
  queue.enqueue(
    url,
    loadImage,
    [url],
    { url: queue.resolution.merge },
    data => {
      apply(data)
    },
    err => {
      logger.error(err)
      apply(url)
    }
  )
}

function update(el, { arg, value }) {
  const data = {
    url: undefined,
    target: "src",
    callback: undefined,
  }

  if (typeof value === "string") {
    data.url = value
  } else if (typeof value === "object" && !Array.isArray(value) && value.url) {
    data.url = value.url
    data.target = value.target
    data.callback = typeof value.callback === "function" ? value.callback : undefined
    if (!data.url) return // silently ignore
    if (!data.target && !data.callback) {
      // logger.error("Target or callback is required")
      return
    }
  } else {
    return
  }

  if (el[OBS_ID]) {
    const old = el[OBS_ID]
    if (old.observed) observer.unobserve(el)
    if (old.url === data.url && old.target === data.target && old.callback === data.callback) {
      return
    }
  }

  el[OBS_ID] = data

  if (arg === "observe") {
    data.observed = true
    observer.observe(el)
  } else {
    process(el, data)
  }
}

export default {
  mounted: update,
  updated: update,
  unmounted(el) {
    if (el[OBS_ID]) {
      if (el[OBS_ID].observed) observer.unobserve(el)
      delete el[OBS_ID]
    }
  }
}
