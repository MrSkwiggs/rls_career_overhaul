/**
 * Converts a hex color string to RGB format
 * @param {string} hex - Hex color code (e.g. "#ff0000")
 * @returns {string} RGB values as comma-separated string (e.g. "255, 0, 0")
 */
export function hexToRgb(hex) {
  // Remove the hash if present
  hex = hex.replace(/^#/, '')

  // Parse the hex values
  const bigint = parseInt(hex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  return `${r}, ${g}, ${b}`
}

/**
 * Creates style object with branch color CSS variables
 * @param {Object} params
 * @param {string} [params.color] - Main branch color
 * @param {string} [params.accentColor] - Accent color (falls back to main color if not provided)
 * @returns {Object} Style object with --branch-color and --branch-accent-color CSS variables
 */
export function getBranchColorStyle({ color, accentColor }) {
  const style = {}

  if (color) {
    if (color.startsWith("#")) {
      style['--branch-color'] = hexToRgb(color)
    } else if (color.startsWith("var(--")) {
      style['--branch-color'] = color
    }
  }

  // Use accentColor if provided, otherwise fall back to main color
  const accent = accentColor || color
  if (accent) {
    if (accent.startsWith("#")) {
      style['--branch-accent-color'] = hexToRgb(accent)
    } else if (accent.startsWith("var(--")) {
      style['--branch-accent-color'] = accent
    }
  }

  return style
}

/**
 * Gets background style object for branch icon
 * @param {string} color - Color value
 * @returns {Object} Style object with background-color property
 */
export function getIconBackgroundStyle(color) {
  if (!color) return { 'background-color': '#555555' }
  if (color.startsWith('--')) return { 'background-color': `var(${color})` }
  if (color.startsWith('#')) return { 'background-color': color }
  return { 'background-color': `rgb(${color})` }
}