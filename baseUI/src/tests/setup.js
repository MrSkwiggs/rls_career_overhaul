import { vi } from "vitest"

// TODO: Mocks below are to fix the errors when running vites.
// They need to be evaluated and see if they should be mocked or fixed the initialization issues.

vi.mock("bng:directives", () => ({
  vBngOnUiNav: {},
  vBngOnUiNavFocus: {},
  vBngClick: {},
  vBngLazyImage: {},
  vBngOcclusionWatcher: {},
  vBngScopedNav: {},
  vBngPopover: {},
  vBngUiNavScroll: {},
}))

vi.mock("bng:base-components", () => ({}))

// Mock the icons module that base components depend on
vi.mock("@/common/components/base/bngIcon.vue", () => ({
  icons: {},
  iconsBySize: {
    56: {},
    64: {},
    128: {},
    256: {},
  },
  iconsByTag: {},
  getIconsWithTags: vi.fn(() => []),
}))

// Mock popup service to avoid circular dependency issues
vi.mock("@/services/popup", () => ({
  popupContainer: {
    default: "default",
    transparent: "transparent",
    clickthrough: "clickthrough",
  },
  popupPosition: {
    default: "center",
    top: "top",
    left: "left",
    right: "right",
    bottom: "bottom",
    center: "center",
    fullscreen: "fullscreen",
  },
  usePopup: vi.fn(() => ({
    addPopup: vi.fn(),
    removePopup: vi.fn(),
    clearPopups: vi.fn(),
  })),
}))

// Need to mock this because IntersectionObserver doesn't exist in node.js environment
// Polyfill IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback
    this.options = options
  }

  observe(target) {
    // Mock implementation - do nothing or trigger callback if needed
  }

  unobserve(target) {
    // Mock implementation
  }

  disconnect() {
    // Mock implementation
  }

  takeRecords() {
    return []
  }
}

// Need to mock this because ResizeObserver doesn't exist in node.js environment
// Polyfill ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback
  }

  observe(target) {
    // Mock implementation
  }

  unobserve(target) {
    // Mock implementation
  }

  disconnect() {
    // Mock implementation
  }
}

// Need to mock this because OffscreenCanvas doesn't exist in node.js environment
// used in BngLazyImage.js
// Polyfill OffscreenCanvas
global.OffscreenCanvas = class OffscreenCanvas {
  constructor(width, height) {
    this.width = width
    this.height = height
  }

  getContext(type) {
    return {
      drawImage: vi.fn(),
      // Add other canvas context methods as needed
    }
  }

  convertToBlob() {
    return Promise.resolve(new Blob())
  }
}

// Mock createImageBitmap
global.createImageBitmap = vi.fn(() => Promise.resolve({}))

// Mock Image constructor if not already available
if (!global.Image) {
  global.Image = class Image {
    constructor() {
      // Mock implementation
    }
  }
}
