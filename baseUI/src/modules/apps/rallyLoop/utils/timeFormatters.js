/**
 * Time formatting utilities for Rally Loop UI
 */

/**
 * Format time in 24-hour format
 * @param {number} wallClockSecs - Time in seconds
 * @param {boolean} showSeconds - Whether to show seconds
 * @returns {string} Formatted time string
 */
export function format24hTime(wallClockSecs, showSeconds = true) {
  const hours = Math.floor(wallClockSecs / 3600)
  const minutes = Math.floor((wallClockSecs % 3600) / 60)
  const secs = Math.floor(wallClockSecs % 60)

  if (showSeconds) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  } else {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
}

/**
 * Format time in 12-hour AM/PM format
 * @param {number} wallClockSecs - Time in seconds
 * @param {boolean} showSeconds - Whether to show seconds
 * @param {boolean} shortenedPeriod - Use 'a'/'p' instead of 'AM'/'PM'
 * @returns {object} {time: string, period: string}
 */
export function formatAmPm(wallClockSecs, showSeconds = true, shortenedPeriod = false) {
  const totalHours = Math.floor(wallClockSecs / 3600)
  const minutes = Math.floor((wallClockSecs % 3600) / 60)
  const secs = Math.floor(wallClockSecs % 60)

  const hours12 = totalHours % 12 || 12 // Convert to 12-hour format (0 -> 12)
  const period = shortenedPeriod
    ? (totalHours < 12 ? 'a' : 'p')
    : (totalHours < 12 ? 'AM' : 'PM')

  let time
  if (showSeconds) {
    time = `${hours12}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  } else {
    time = `${hours12}:${String(minutes).padStart(2, '0')}`
  }

  return {
    time,
    period
  }
}

/**
 * Format wall clock time with day
 * @param {number} wallClockSecs - Time in seconds
 * @param {number} day - Current day
 * @param {boolean} use24hFormat - Use 24-hour format
 * @param {string} activeState - Current active state
 * @returns {object} {time: string, period: string|null} - period is null for 24h format
 */
export function formatWallClock(wallClockSecs, day, use24hFormat, activeState) {
  if (activeState === 'inactive') {
    return { time: '--:--:--', period: null }
  }

  if (use24hFormat) {
    let timeString = format24hTime(wallClockSecs)
    if (day > 1) {
      timeString = `Day ${day} ${timeString}`
    }
    return { time: timeString, period: null }
  } else {
    const result = formatAmPm(wallClockSecs, true, false)
    let timeString = result.time
    if (day > 1) {
      timeString = `Day ${day} ${timeString}`
    }
    return { time: timeString, period: result.period }
  }
}

/**
 * Format wall clock for countdown widget (splits time and period)
 * @param {number} wallClockSecs - Time in seconds
 * @param {number} day - Current day
 * @param {boolean} use24hFormat - Use 24-hour format
 * @returns {object} {time: string, period: string|null}
 */
export function formatWallClockForCountdown(wallClockSecs, day, use24hFormat) {
  if (use24hFormat) {
    let timeString = format24hTime(wallClockSecs)
    if (day > 1) {
      timeString = `Day ${day} ${timeString}`
    }
    return { time: timeString, period: null }
  } else {
    const { time, period } = formatAmPm(wallClockSecs, true, true) // showSeconds=true, shortenedPeriod=true
    let timeString = time
    if (day > 1) {
      timeString = `Day ${day} ${timeString}`
    }
    return { time: timeString, period: period }
  }
}

/**
 * Format penalty time
 * @param {number} seconds - Penalty in seconds
 * @param {string} activeState - Current active state
 * @returns {string} Formatted penalty string
 */
export function formatPenalty(seconds, activeState) {
  if (activeState === 'inactive') {
    return '-'
  }

  if (seconds === 0) return '0s'
  return `+${Math.round(seconds)}s`
}

/**
 * Format Special Stage time with tenths
 * @param {number} seconds - Time in seconds
 * @param {string} activeState - Current active state
 * @returns {string} Formatted SS time string
 */
export function formatSSTime(seconds, activeState) {
  if (activeState === 'inactive') {
    return '--:--:--'
  }

  // Round to nearest tenth of a second
  const roundedSeconds = Math.round(seconds * 10) / 10

  const hours = Math.floor(roundedSeconds / 3600)
  const minutes = Math.floor((roundedSeconds % 3600) / 60)
  const secs = Math.floor(roundedSeconds % 60)
  const tenths = Math.round((roundedSeconds % 1) * 10) % 10

  // Build time string based on which components are non-zero
  if (hours > 0) {
    // Show hours: H:MM:SS.T or HH:MM:SS.T
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`
  } else if (minutes > 0) {
    // Show minutes: M:SS.T or MM:SS.T (no leading zero for minutes)
    return `${minutes}:${String(secs).padStart(2, '0')}.${tenths}`
  } else {
    // Show only seconds: S.T or SS.T (no leading zero for seconds)
    return `${secs}.${tenths}`
  }
}

/**
 * Format countdown text (arrive in / late by)
 * @param {number} seconds - Countdown in seconds (negative = late)
 * @param {boolean} absolute - Whether to return the absolute value of the time difference
 * @returns {string} Formatted countdown text
 */
export function formatTimeDiff(seconds, absolute = false) {
  if (seconds === null || seconds === undefined) return '--:--'

  // Round to nearest second first
  const roundedSeconds = Math.round(Math.abs(seconds))
  const minutes = Math.floor(roundedSeconds / 60)
  const secs = roundedSeconds % 60
  const sign = seconds < 0 ? '-' : '+'

  // const timeStr = `${sign}${minutes}:${String(secs).padStart(2, '0')}`
  // return timeStr
  // const word = seconds < 0 ? 'from now' : 'ago'
  // return `${timeStr} ${word}`

  if (absolute) {
    return `${minutes}:${String(secs).padStart(2, '0')}`
  } else {
    return `${sign}${minutes}:${String(secs).padStart(2, '0')}`
  }
}

/**
 * Format epoch time with sign
 * @param {number} epochTime - Epoch time in seconds
 * @returns {string} Formatted epoch time string
 */
export function formatEpoch(epochTime) {
  if (epochTime === null || epochTime === undefined) return '--:--:--'

  // Round to nearest second first
  const roundedTime = Math.round(Math.abs(epochTime))
  const hours = Math.floor(roundedTime / 3600)
  const minutes = Math.floor((roundedTime % 3600) / 60)
  const secs = roundedTime % 60

  const sign = epochTime < 0 ? '-' : '+'
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

