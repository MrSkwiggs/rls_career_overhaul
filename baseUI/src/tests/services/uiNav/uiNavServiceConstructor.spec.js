import { describe, it, expect, beforeEach, vi } from "vitest"
import { UINavService } from "@/services/uiNav"
import { UINavEventProcessor } from "@/services/uiNav/eventProcessor"
import { UINavActionHandlers } from "@/services/uiNav/actionHandlers"
import { ScopeRegistry } from "@/services/uiNav/handlers/scopeRegistry"
import { UINavHandlers } from "@/services/uiNav/handlers"
import Emitter from "tiny-emitter"

describe("UINavService Constructor & Initialization Tests", () => {
  let eventBus

  beforeEach(() => {
    eventBus = new Emitter()
  })

  describe("Constructor", () => {
    it("should create a new UINavService instance", () => {
      const service = new UINavService(eventBus)

      expect(service).toBeInstanceOf(UINavService)
    })

    it("should store the eventBus reference", () => {
      const service = new UINavService(eventBus)

      expect(service.eventBus).toBe(eventBus)
    })

    it("should initialize eventsActive to false", () => {
      const service = new UINavService(eventBus)

      expect(service.eventsActive).toBe(false)
    })

    it("should initialize globalEventsHooked to false", () => {
      const service = new UINavService(eventBus)

      expect(service.globalEventsHooked).toBe(false)
    })

    it("should initialize activeScope to undefined", () => {
      const service = new UINavService(eventBus)

      expect(service.activeScope).toBeUndefined()
    })

    it("should initialize blockedEvents to empty array", () => {
      const service = new UINavService(eventBus)

      expect(service.getBlockedEvents()).toEqual([])
    })

    it("should initialize useCrossfire to true", () => {
      const service = new UINavService(eventBus)

      expect(service.useCrossfire).toBe(true)
    })
  })

  describe("Dependency Initialization", () => {
    it("should create a ScopeRegistry instance", () => {
      const service = new UINavService(eventBus)

      expect(service.scopeRegistry).toBeInstanceOf(ScopeRegistry)
    })

    it("should create a UINavEventProcessor instance", () => {
      const service = new UINavService(eventBus)

      expect(service.eventProcessor).toBeInstanceOf(UINavEventProcessor)
    })

    it("should create a UINavActionHandlers instance with eventBus", () => {
      const service = new UINavService(eventBus)

      expect(service.actionHandlers).toBeInstanceOf(UINavActionHandlers)
      expect(service.actionHandlers.eventBus).toBe(eventBus)
    })

    it("should create a UINavHandlers instance with scopeRegistry", () => {
      const service = new UINavService(eventBus)

      expect(service.handlers).toBeInstanceOf(UINavHandlers)
    })

    it("should pass scopeRegistry to UINavHandlers", () => {
      const service = new UINavService(eventBus)

      // Verify that handlers has access to the same scopeRegistry
      expect(service.handlers.scopeRegistry).toBe(service.scopeRegistry)
    })

    it("should create unique instances for each service", () => {
      const service1 = new UINavService(eventBus)
      const service2 = new UINavService(eventBus)

      expect(service1.scopeRegistry).not.toBe(service2.scopeRegistry)
      expect(service1.eventProcessor).not.toBe(service2.eventProcessor)
      expect(service1.actionHandlers).not.toBe(service2.actionHandlers)
      expect(service1.handlers).not.toBe(service2.handlers)
    })
  })

  describe("Constructor with different eventBus values", () => {
    it("should accept null eventBus", () => {
      const service = new UINavService(null)

      expect(service.eventBus).toBe(null)
    })

    it("should accept undefined eventBus", () => {
      const service = new UINavService(undefined)

      expect(service.eventBus).toBeUndefined()
    })

    it("should accept no eventBus parameter", () => {
      const service = new UINavService()

      expect(service.eventBus).toBeUndefined()
    })

    it("should still initialize all dependencies with null eventBus", () => {
      const service = new UINavService(null)

      expect(service.scopeRegistry).toBeInstanceOf(ScopeRegistry)
      expect(service.eventProcessor).toBeInstanceOf(UINavEventProcessor)
      expect(service.actionHandlers).toBeInstanceOf(UINavActionHandlers)
      expect(service.handlers).toBeInstanceOf(UINavHandlers)
    })

    it("should accept custom event emitter implementations", () => {
      const customEmitter = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      }

      const service = new UINavService(customEmitter)

      expect(service.eventBus).toBe(customEmitter)
    })
  })

  describe("initialize() method", () => {
    it("should call attachEventListeners", () => {
      const service = new UINavService(eventBus)
      const attachSpy = vi.spyOn(service, "attachEventListeners")

      service.initialize()

      expect(attachSpy).toHaveBeenCalledTimes(1)
    })

    it("should call hookGlobalEvents", () => {
      const service = new UINavService(eventBus)
      const hookSpy = vi.spyOn(service, "hookGlobalEvents")

      service.initialize()

      expect(hookSpy).toHaveBeenCalledTimes(1)
    })

    it("should call both attachEventListeners and hookGlobalEvents", () => {
      const service = new UINavService(eventBus)
      const attachSpy = vi.spyOn(service, "attachEventListeners")
      const hookSpy = vi.spyOn(service, "hookGlobalEvents")

      service.initialize()

      expect(attachSpy).toHaveBeenCalled()
      expect(hookSpy).toHaveBeenCalled()
    })

    it("should be callable multiple times without errors", () => {
      const service = new UINavService(eventBus)

      expect(() => {
        service.initialize()
        service.initialize()
        service.initialize()
      }).not.toThrow()
    })

    it("should attach event listeners when called", () => {
      const service = new UINavService(eventBus)
      const onSpy = vi.spyOn(eventBus, "on")

      service.initialize()

      expect(onSpy).toHaveBeenCalled()
    })

    it("should hook global events when called", () => {
      const service = new UINavService(eventBus)
      const addEventListenerSpy = vi.spyOn(document.body, "addEventListener")

      service.initialize()

      expect(addEventListenerSpy).toHaveBeenCalled()
    })

    it("should handle initialization with null eventBus gracefully", () => {
      const service = new UINavService(null)

      expect(() => {
        service.initialize()
      }).not.toThrow()
    })

    it("should set up event listeners in correct order", () => {
      const service = new UINavService(eventBus)
      const calls = []

      vi.spyOn(service, "attachEventListeners").mockImplementation(() => {
        calls.push("attachEventListeners")
      })
      vi.spyOn(service, "hookGlobalEvents").mockImplementation(() => {
        calls.push("hookGlobalEvents")
      })

      service.initialize()

      expect(calls).toEqual(["attachEventListeners", "hookGlobalEvents"])
    })
  })

  describe("Initial state validation", () => {
    it("should have all state properties properly initialized", () => {
      const service = new UINavService(eventBus)

      expect(service.eventsActive).toBe(false)
      expect(service.globalEventsHooked).toBe(false)
      expect(service.activeScope).toBeUndefined()
      expect(service.getBlockedEvents()).toEqual([])
      expect(service.useCrossfire).toBe(true)
      expect(service.eventBus).toBe(eventBus)
    })

    it("should have all dependencies properly initialized", () => {
      const service = new UINavService(eventBus)

      expect(service.scopeRegistry).toBeDefined()
      expect(service.eventProcessor).toBeDefined()
      expect(service.actionHandlers).toBeDefined()
      expect(service.handlers).toBeDefined()
    })

    it("should be ready to use after construction", () => {
      const service = new UINavService(eventBus)

      // Should be able to call methods without errors
      expect(() => {
        service.setActiveScope("test")
        service.blockEvents("menu")
        service.eventsActive = true
      }).not.toThrow()
    })

    it("should have properly bound event handlers", () => {
      const service = new UINavService(eventBus)

      expect(typeof service.handleGameEvent).toBe("function")
      expect(typeof service.handleEnabledChange).toBe("function")
      expect(typeof service.dispatchDOMEvent).toBe("function")
    })
  })
})
