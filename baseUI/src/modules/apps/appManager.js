export function spawnUiApp(appName, appId, params, apps) {
  // console.log(`spawnUiApp ${appName} in container #${appName + appId}`, params)
  const props = params ? params.props : null
  const appKey = `${appName}${appId}`

  apps.push({
    name: appName,
    appId: appId,
    appKey: appKey,
    comp: appName,
    props: props,
    teleport: `#${appName + appId}`,
  })
}

export function destroyUiApp(appName, apps) {
  const index = apps.findIndex(x => x.name === appName)
  if (index > -1) {
    // console.log("destroyed vue app", apps[index].name)
    apps.splice(index, 1)
  }
}

export function registerApps(app, componentsMap) {
  Object.keys(componentsMap).forEach(
    key => app.component(key, componentsMap[key])
  )
}
