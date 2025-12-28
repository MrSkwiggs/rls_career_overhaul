import { describe, it, expect, beforeEach, vi } from "vitest"
import { UINavService } from "@/services/uiNav"
import Emitter from "tiny-emitter"

describe("UINavService Property Getter/Setter Tests", () => {
  let eventBus
  let uiNavService

  beforeEach(() => {
    eventBus = new Emitter()
    uiNavService = new UINavService(eventBus)
  })

  describe("eventsActive property", () => {
    it("should have eventsActive set to false initially", () => {
      expect(uiNavService.eventsActive).toBe(false)
    })

    it("should set eventsActive to true", () => {
      uiNavService.eventsActive = true
      expect(uiNavService.eventsActive).toBe(true)
    })

    it("should set eventsActive to false", () => {
      uiNavService.eventsActive = true
      expect(uiNavService.eventsActive).toBe(true)

      uiNavService.eventsActive = false
      expect(uiNavService.eventsActive).toBe(false)
    })

    it("should be independent of other properties", () => {
      uiNavService.eventsActive = true
      uiNavService.globalEventsHooked = false
      uiNavService.setActiveScope("test")

      expect(uiNavService.eventsActive).toBe(true)
    })
  })

  describe("globalEventsHooked property", () => {
    it("should have globalEventsHooked set to false initially", () => {
      expect(uiNavService.globalEventsHooked).toBe(false)
    })

    it("should set globalEventsHooked to true", () => {
      uiNavService.globalEventsHooked = true
      expect(uiNavService.globalEventsHooked).toBe(true)
    })

    it("should set globalEventsHooked to false", () => {
      uiNavService.globalEventsHooked = true
      expect(uiNavService.globalEventsHooked).toBe(true)

      uiNavService.globalEventsHooked = false
      expect(uiNavService.globalEventsHooked).toBe(false)
    })

    it("should be independent of other properties", () => {
      uiNavService.globalEventsHooked = true
      uiNavService.eventsActive = false
      uiNavService.setActiveScope("test")

      expect(uiNavService.globalEventsHooked).toBe(true)
    })
  })

  describe("useCrossfire property", () => {
    it("should have useCrossfire set to true initially", () => {
      expect(uiNavService.useCrossfire).toBe(true)
    })

    it("should set useCrossfire to true", () => {
      uiNavService.useCrossfire = false
      uiNavService.useCrossfire = true

      expect(uiNavService.useCrossfire).toBe(true)
    })

    it("should set useCrossfire to false", () => {
      uiNavService.useCrossfire = false
      expect(uiNavService.useCrossfire).toBe(false)
    })

    it("should handle multiple useCrossfire changes", () => {
      const states = [false, true, false, false, true]

      states.forEach(state => {
        uiNavService.useCrossfire = state
        expect(uiNavService.useCrossfire).toBe(state)
      })
    })

    it("should delegate getter to actionHandlers.useCrossfire", () => {
      // Access internal actionHandlers directly to verify delegation
      expect(uiNavService.useCrossfire).toBe(uiNavService.actionHandlers.useCrossfire)

      uiNavService.actionHandlers.setUseCrossfire(false)
      expect(uiNavService.useCrossfire).toBe(false)
    })

    it("should delegate setter to actionHandlers.setUseCrossfire", () => {
      const setUseCrossfireSpy = vi.spyOn(uiNavService.actionHandlers, "setUseCrossfire")

      uiNavService.useCrossfire = false

      expect(setUseCrossfireSpy).toHaveBeenCalledWith(false)
      expect(setUseCrossfireSpy).toHaveBeenCalledTimes(1)
    })

    it("should maintain sync between service and actionHandlers", () => {
      uiNavService.useCrossfire = false
      expect(uiNavService.actionHandlers.useCrossfire).toBe(false)

      uiNavService.useCrossfire = true
      expect(uiNavService.actionHandlers.useCrossfire).toBe(true)
    })

    it("should be independent of other properties", () => {
      uiNavService.useCrossfire = false
      uiNavService.eventsActive = true
      uiNavService.globalEventsHooked = true

      expect(uiNavService.useCrossfire).toBe(false)
    })
  })

  describe("eventBus property", () => {
    it("should return the eventBus passed to constructor", () => {
      expect(uiNavService.eventBus).toBe(eventBus)
    })

    it("should be the same instance throughout lifecycle", () => {
      const bus1 = uiNavService.eventBus
      const bus2 = uiNavService.eventBus

      expect(bus1).toBe(bus2)
      expect(bus1).toBe(eventBus)
    })

    it("should return null when no eventBus is provided", () => {
      const serviceWithoutBus = new UINavService(null)
      expect(serviceWithoutBus.eventBus).toBe(null)
    })

    it("should return undefined when eventBus is undefined", () => {
      const serviceWithUndefinedBus = new UINavService(undefined)
      expect(serviceWithUndefinedBus.eventBus).toBeUndefined()
    })

    it("should be read-only (no setter)", () => {
      // Attempting to set should not work (no setter defined)
      // This will fail silently in non-strict mode, or throw in strict mode
      expect(() => {
        uiNavService.eventBus = new Emitter()
      }).toThrow() // In strict mode
    })

    it("should allow accessing eventBus methods", () => {
      expect(typeof uiNavService.eventBus.on).toBe("function")
      expect(typeof uiNavService.eventBus.off).toBe("function")
      expect(typeof uiNavService.eventBus.emit).toBe("function")
    })
  })

  describe("activeScope property (via getter)", () => {
    it("should have activeScope undefined initially", () => {
      expect(uiNavService.activeScope).toBeUndefined()
    })

    it("should return activeScope after setting via setActiveScope", () => {
      uiNavService.setActiveScope("test-scope")
      expect(uiNavService.activeScope).toBe("test-scope")
    })

    it("should be read-only via getter (no direct setter)", () => {
      uiNavService.setActiveScope("initial")

      expect(() => {
        uiNavService.activeScope = "modified"
      }).toThrow()
    })

    it("should only be modifiable via setActiveScope method", () => {
      uiNavService.setActiveScope("scope-1")
      expect(uiNavService.activeScope).toBe("scope-1")

      uiNavService.setActiveScope("scope-2")
      expect(uiNavService.activeScope).toBe("scope-2")
    })
  })

  describe("Property interactions", () => {
    it("should allow setting all properties independently", () => {
      uiNavService.eventsActive = true
      uiNavService.globalEventsHooked = true
      uiNavService.useCrossfire = false
      uiNavService.setActiveScope("interaction-test")

      expect(uiNavService.eventsActive).toBe(true)
      expect(uiNavService.globalEventsHooked).toBe(true)
      expect(uiNavService.useCrossfire).toBe(false)
      expect(uiNavService.activeScope).toBe("interaction-test")
    })

    it("should not affect other properties when changing one", () => {
      // Set initial state
      uiNavService.eventsActive = true
      uiNavService.globalEventsHooked = true
      uiNavService.useCrossfire = false
      uiNavService.setActiveScope("initial")

      // Change one property
      uiNavService.eventsActive = false

      // Others should remain unchanged
      expect(uiNavService.globalEventsHooked).toBe(true)
      expect(uiNavService.useCrossfire).toBe(false)
      expect(uiNavService.activeScope).toBe("initial")
    })

    it("should maintain property values after multiple operations", () => {
      uiNavService.eventsActive = true
      uiNavService.blockEvents("menu")
      uiNavService.globalEventsHooked = true
      uiNavService.setActiveScope("test")
      uiNavService.useCrossfire = false

      expect(uiNavService.eventsActive).toBe(true)
      expect(uiNavService.globalEventsHooked).toBe(true)
      expect(uiNavService.useCrossfire).toBe(false)
      expect(uiNavService.activeScope).toBe("test")
      expect(uiNavService.getBlockedEvents()).toEqual(["menu"])
    })
  })

  describe("Property state persistence", () => {
    it("should persist eventsActive across method calls", () => {
      uiNavService.eventsActive = true

      uiNavService.blockEvents("context")
      uiNavService.setActiveScope("test")

      expect(uiNavService.eventsActive).toBe(true)
    })

    it("should persist globalEventsHooked across method calls", () => {
      uiNavService.globalEventsHooked = true

      uiNavService.blockEvents("context")
      uiNavService.setActiveScope("test")

      expect(uiNavService.globalEventsHooked).toBe(true)
    })

    it("should persist useCrossfire across method calls", () => {
      uiNavService.useCrossfire = false

      uiNavService.blockEvents("context")
      uiNavService.setActiveScope("test")

      expect(uiNavService.useCrossfire).toBe(false)
    })
  })

  describe("Property type handling", () => {
    it("should handle boolean toggle pattern for eventsActive", () => {
      uiNavService.eventsActive = false
      uiNavService.eventsActive = !uiNavService.eventsActive
      expect(uiNavService.eventsActive).toBe(true)

      uiNavService.eventsActive = !uiNavService.eventsActive
      expect(uiNavService.eventsActive).toBe(false)
    })

    it("should handle boolean toggle pattern for globalEventsHooked", () => {
      uiNavService.globalEventsHooked = false
      uiNavService.globalEventsHooked = !uiNavService.globalEventsHooked
      expect(uiNavService.globalEventsHooked).toBe(true)

      uiNavService.globalEventsHooked = !uiNavService.globalEventsHooked
      expect(uiNavService.globalEventsHooked).toBe(false)
    })

    it("should handle boolean toggle pattern for useCrossfire", () => {
      uiNavService.useCrossfire = true
      uiNavService.useCrossfire = !uiNavService.useCrossfire
      expect(uiNavService.useCrossfire).toBe(false)

      uiNavService.useCrossfire = !uiNavService.useCrossfire
      expect(uiNavService.useCrossfire).toBe(true)
    })
  })

  describe("Read-only properties", () => {
    it("should not allow direct assignment to eventBus", () => {
      const newBus = new Emitter()

      expect(() => {
        uiNavService.eventBus = newBus
      }).toThrow()
    })

    it("should not allow direct assignment to activeScope", () => {
      uiNavService.setActiveScope("initial")

      expect(() => {
        uiNavService.activeScope = "modified"
      }).toThrow()
    })
  })
})
