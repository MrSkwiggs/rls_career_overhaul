export { getMockedData } from "@/../devutils/mock.js"
export { runInBrowser } from "@/../devutils/browser.js"

export const emptyImage = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1' viewBox='0 0 1 1' fill='none' stroke='none'/>"

export function getURL(path) {
  if (typeof path !== "string" || !path || path.includes("://")) return path
  if (path.startsWith("/")) path = path.substring(1)
	// return window.bngVue.isProd ? `/${path}` : `http://localhost:9000/${path}`
	return `/${path}`
}

export function getAssetURL(assetPath) {
  let url = getURL(assetPath)
  if (typeof url !== "string" || !url) return url
  // if (url.startsWith("/")) url = "/ui/ui-vue/dist" + url
  if (url.startsWith("/")) url = "/ui/ui-vue/src/assets" + url
	return url
}

/**
 * @async
 * @param {string} url The URL of the file to get
 * @param {number} timeout The timeout in seconds
 * @returns {Promise<string>} The file content in plain text
 */
export const getFile = (url, timeout = 5) => new Promise((resolve, reject) => {
  try {
    const xhr = new XMLHttpRequest()
    const tmr = timeout > 0 ? setTimeout(() => {
      xhr.abort()
      reject(new Error("Timeout"))
    }, timeout * 1000) : null
    xhr.open("GET", url, true)
    xhr.onload = () => {
      if (tmr) clearTimeout(tmr)
      if (xhr.status === 200) {
        resolve(xhr.responseText)
      } else {
        reject(new Error(`Failed with code ${xhr.status}`))
      }
    }
    xhr.send()
  } catch (err) {
    reject(err)
  }
})

export function useAppGlobals(appContext) {
	return appContext.config.globalProperties
}

export function useAppGlobalsFromBinding(binding) {
	return useAppGlobals(binding.instance.$.appContext)
}

export const ucaseFirst = str => str[0].toUpperCase() + str.slice(1)


// Simplistic, probably crappy '$q.defer' implementation (only accepts a notify handler at the top-level 'then')
// ** TODO ** Find a better (correct) implementation if this turns out to be wrong!
export const defer = () => {

  const noop = () => {}
  let resolve, reject, _notifyHandler = noop
  const promise = new Promise((res, rej) => {
    [resolve, reject] = [res, rej]
  })

  const _wrappedPromise = {
    then: (resolveHandler, rejectHandler=noop, notifyHandler=noop) => {
      _notifyHandler = notifyHandler
      return promise.then(resolveHandler, rejectHandler)
    }
  }

  const notify = val => _notifyHandler(val)

  return {
    promise: _wrappedPromise,
    resolve,
    reject,
    notify
  }

}

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const _enum = obj => Object.freeze(Object.assign(Object.create(null), obj))
