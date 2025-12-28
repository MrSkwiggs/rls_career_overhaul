export function rallyStageThemeColor(withAlpha = null) {
  const alpha = withAlpha === true ? 'a0' : withAlpha === false ? '' : ''
  return `#009a1a${alpha}`
}