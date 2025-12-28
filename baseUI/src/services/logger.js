// Logger service
const isDevMode = process.env.NODE_ENV === "development"

const DEBUG = 0b0001,
  INFO = 0b0010,
  WARN = 0b0100,
  ERROR = 0b1000

const consoleLogMethods = {
  [DEBUG]: "log",
  [INFO]: "info",
  [WARN]: "warn",
  [ERROR]: "error",
}
const consoleLogProvider = {
  log(level, ...msgs) {
    (level in consoleLogMethods) && console[consoleLogMethods[level]](...msgs)
  },
}

let level = (isDevMode && DEBUG) | INFO | WARN | ERROR,
  providersInUse = [consoleLogProvider]

const STACK_TRACE = Symbol("Stack trace")
const _stackTrace = () => "\n" + new Error().stack

const _log = (lvl, ...msgs) => {
  if (!(level & lvl)) return
  msgs = msgs.map(msg => (msg === STACK_TRACE ? _stackTrace() : msg))
  providersInUse.forEach(p => p.log && p.log(lvl, ...msgs))
}

const _assert = async (lvl, cond, ...msgs) => {
  if (!(level & lvl)) return
  // if condition or return value of condition is false, log the message
  if (cond) {
    if (cond instanceof Promise) {
      // window.BNG_Logger.assert(new Promise(res => setTimeout(() => res(0), 2000)), "logged")
      cond.then(res => !res && _log(lvl, ...msgs))
    } else if (typeof cond === "function") {
      // window.BNG_Logger.assert(() => 0, "logged")
      // window.BNG_Logger.assert(async () => 0, "logged")
      !await cond() && _log(lvl, ...msgs)
    }
  } else {
    // window.BNG_Logger.assert(0, "logged")
    _log(lvl, ...msgs)
  }
}

const logger = {
  DEBUG,
  INFO,
  WARN,
  ERROR,
  setProviders: (...providers) => (providersInUse = providers),
  set level(val) {
    return (level = val)
  },
  get level() {
    return level
  },
  // stack trace command that can be added at any place in messages
  STACK_TRACE,
  // normal loggers
  log: (...msgs) => _log(DEBUG, ...msgs),
  debug: (...msgs) => _log(DEBUG, ...msgs),
  info: (...msgs) => _log(INFO, ...msgs),
  warn: (...msgs) => _log(WARN, ...msgs),
  error: (...msgs) => _log(ERROR, ...msgs),
  // assert loggers that run condition check only after logging level check for performance
  assert: (cond, ...msgs) => _assert(DEBUG, cond, ...msgs),
  assertDebug: (cond, ...msgs) => _assert(DEBUG, cond, ...msgs),
  assertInfo: (cond, ...msgs) => _assert(INFO, cond, ...msgs),
  assertWarn: (cond, ...msgs) => _assert(WARN, cond, ...msgs),
  assertError: (cond, ...msgs) => _assert(ERROR, cond, ...msgs),
}

window.BNG_Logger = logger

export default logger
export { consoleLogProvider }
