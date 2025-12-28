import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { UINavService, getUINavServiceInstance, setUINavServiceInstance } from "@/services/uiNav"
import Emitter from "tiny-emitter"

describe("UINavService Activation Test", () => {
  let eventBus = null
  let uiNavService = null

  beforeEach(() => {
    eventBus = new Emitter()
    uiNavService = new UINavService(eventBus)
  })

  describe("activate() method", () => {
    it("should activate the service with activate(true)", () => {
      uiNavService.activate(true)
      expect(uiNavService.eventsActive).toBe(true)
    })

    it("should deactivate the service with activate(false)", () => {
      uiNavService.activate(false)
      expect(uiNavService.eventsActive).toBe(false)

      uiNavService.activate(true)
      expect(uiNavService.eventsActive).toBe(true)
    })

    it("should default to true when called with no arguments", () => {
      uiNavService.activate()
      expect(uiNavService.eventsActive).toBe(true)
    })

    it("should call attachEventListeners with the correct state", () => {
      const attachSpy = vi.spyOn(uiNavService, "attachEventListeners")

      uiNavService.activate(true)

      expect(attachSpy).toHaveBeenCalledWith(true)
      expect(attachSpy).toHaveBeenCalledTimes(1)
    })

    it("should call attachEventListeners(false) when deactivating", () => {
      const attachSpy = vi.spyOn(uiNavService, "attachEventListeners")

      uiNavService.activate(false)

      expect(attachSpy).toHaveBeenCalledWith(false)
    })

    it("should attach event listeners when activating", () => {
      const onSpy = vi.spyOn(eventBus, "on")

      uiNavService.activate(true)

      expect(onSpy).toHaveBeenCalled()
    })
  })

  describe("Activation lifecycle", () => {
    it("should start inactive after construction", () => {
      const service = new UINavService(eventBus)

      expect(service.eventsActive).toBe(false)
    })

    it("should become active after activate(true)", () => {
      uiNavService.activate(true)

      expect(uiNavService.eventsActive).toBe(true)
    })

    it("should handle full activation lifecycle", () => {
      // Start
      expect(uiNavService.eventsActive).toBe(false)

      // Activate
      uiNavService.activate(true)
      expect(uiNavService.eventsActive).toBe(true)

      // Deactivate
      uiNavService.activate(false)
      expect(uiNavService.eventsActive).toBe(false)

      // Re-activate
      uiNavService.activate(true)
      expect(uiNavService.eventsActive).toBe(true)
    })

    it("should handle Lua-driven state changes via handleEnabledChange", () => {
      // Simulate Lua enabling the system
      uiNavService.handleEnabledChange(true)
      expect(uiNavService.eventsActive).toBe(true)

      // Simulate Lua disabling the system
      uiNavService.handleEnabledChange(false)
      expect(uiNavService.eventsActive).toBe(false)
    })

    it("should allow mixed control between activate() and handleEnabledChange()", () => {
      uiNavService.activate(true)
      expect(uiNavService.eventsActive).toBe(true)

      uiNavService.handleEnabledChange(false)
      expect(uiNavService.eventsActive).toBe(false)

      uiNavService.activate(true)
      expect(uiNavService.eventsActive).toBe(true)
    })
  })

  describe("Integration with event listeners", () => {
    it("should have listeners attached after activate(true)", () => {
      const onSpy = vi.spyOn(eventBus, "on")

      uiNavService.activate(true)

      // Should attach GAME_UI_NAVIGATION_EVENT and GAME_UI_NAV_MAP_ENABLED_EVENT
      expect(onSpy).toHaveBeenCalled()
      expect(onSpy.mock.calls.length).toBeGreaterThan(0)
    })

    it("should have listeners detached after activate(false)", () => {
      uiNavService.activate(true)

      const offSpy = vi.spyOn(eventBus, "off")
      uiNavService.activate(false)

      expect(offSpy).toHaveBeenCalled()
    })
  })
})
