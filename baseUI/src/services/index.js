export { $translate } from "./translation.js"
export { default as SysInfo } from "./sysInfo.js"
export { useLibStore } from "./libStore.js"
export { useGameContextStore } from "./gameContextStore.js"
export * as $content from "./content/index.js"
export { startLoading } from "./screenCover.js"

import './navigator-class.js' // import just for side effects right now (ensure window.bngNavigator is available) - TODO - can remove when we stop using it inside Angular

// ** TODO ** remove this when no more references to global crossfire functions
import * as crossfire from './crossfire.js'
Object.assign(window, crossfire)
