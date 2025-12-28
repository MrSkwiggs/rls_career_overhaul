// UIApps service - for managing UI Apps in Vue

let UIAppStorage, setupDone


export const useUIApps = () => {
  if (!setupDone) setup()
  return service
}

const setup = () => {
  // see hack on ui/modules/apps/app-service.js:~23 that exposes UIAppStorage
  if (!UIAppStorage) UIAppStorage = window.UIAppStorage
  setupDone = !!UIAppStorage
}

const setLayout = layoutName => {
  if (layoutName == 'blank') {
    _broadcast('appContainer:clear')
  } else {
    _broadcast('appContainer:loadLayoutByType', layoutName)
  }
}

const setVisible = state => {
  // if (!state) _broadcast('appContainer:clear')
  _broadcast('ShowApps', !!state)
}

const service = {
  setLayout,
  setVisible,
  get currentLayout() {
    return UIAppStorage.currentLayout
  }
}

const _broadcast = (...params) => {
  window.globalAngularRootScope && window.globalAngularRootScope.$broadcast(...params)
}

