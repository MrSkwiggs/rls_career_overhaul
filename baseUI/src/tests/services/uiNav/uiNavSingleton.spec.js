import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { UINavService, getUINavServiceInstance, setUINavServiceInstance } from "@/services/uiNav"
import Emitter from "tiny-emitter"

describe("UINavSingleton Pattern Test", () => {
  let originalInstance = null

  beforeEach(() => {
    try {
      originalInstance = getUINavServiceInstance()
    } catch (error) {
      originalInstance = null
    }
  })

  afterEach(() => {
    if (originalInstance) {
      setUINavServiceInstance(originalInstance)
    }
  })

  describe("getUINavServiceInstance", () => {
    it("should throw error when instance is not initialized", () => {
      setUINavServiceInstance(null)

      expect(() => {
        getUINavServiceInstance()
      }).toThrowError("UINavService not initialized.")
    })

    it("should return instance after it has been set", () => {
      const eventBus = new Emitter()
      const service = new UINavService(eventBus)

      setUINavServiceInstance(service)
      const retrieved = getUINavServiceInstance()

      expect(retrieved).toBe(service)
    })

    it("should return the same instance on multiple calls", () => {
      const eventBus = new Emitter()
      const service = new UINavService(eventBus)

      setUINavServiceInstance(service)

      const instance1 = getUINavServiceInstance()
      const instance2 = getUINavServiceInstance()
      const instance3 = getUINavServiceInstance()

      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
      expect(instance1).toBe(service)
    })

    it("should maintain instance state between calls", () => {
      const eventBus = new Emitter()
      const service = new UINavService(eventBus)

      setUINavServiceInstance(service)

      const instance1 = getUINavServiceInstance()
      instance1.setActiveScope("test-scope")
      instance1.blockEvents("menu", "back")

      const instance2 = getUINavServiceInstance()

      expect(instance2.activeScope).toBe("test-scope")
      expect(instance2.getBlockedEvents()).toEqual(["menu", "back"])
    })
  })

  describe("setUINavServiceInstance", () => {
    it("should set a new instance successfully", () => {
      const eventBus = new Emitter()
      const service = new UINavService(eventBus)

      setUINavServiceInstance(service)
      const retrieved = getUINavServiceInstance()

      expect(retrieved).toBe(service)
      expect(retrieved).toBeInstanceOf(UINavService)
    })

    it("should replace existing instance with new one", () => {
      const eventBus1 = new Emitter()
      const eventBus2 = new Emitter()
      const service1 = new UINavService(eventBus1)
      const service2 = new UINavService(eventBus2)

      setUINavServiceInstance(service1)
      const retrieved1 = getUINavServiceInstance()
      expect(retrieved1).toBe(service1)

      setUINavServiceInstance(service2)
      const retrieved2 = getUINavServiceInstance()
      expect(retrieved2).toBe(service2)
      expect(retrieved2).not.toBe(service1)
    })

    it("should allow setting instance to null", () => {
      const eventBus = new Emitter()
      const service = new UINavService(eventBus)

      setUINavServiceInstance(service)
      expect(() => getUINavServiceInstance()).not.toThrow()

      setUINavServiceInstance(null)
      expect(() => getUINavServiceInstance()).toThrow()
    })

    it("should not create new instance when setting - just stores reference", () => {
      const eventBus = new Emitter()
      const service = new UINavService(eventBus)

      // Modify the service before setting
      service.setActiveScope("original")
      service.blockEvents("menu")

      setUINavServiceInstance(service)

      // Get instance and verify it's the exact same object
      const retrieved = getUINavServiceInstance()
      expect(retrieved).toBe(service)
      expect(retrieved.activeScope).toBe("original")
      expect(retrieved.getBlockedEvents()).toEqual(["menu"])

      // Modify retrieved and verify original is also modified (same reference)
      retrieved.setActiveScope("modified")
      expect(service.activeScope).toBe("modified")
    })
  })

  describe("Singleton behavior with undefined", () => {
    it("should throw error when instance is explicitly set to undefined", () => {
      const eventBus = new Emitter()
      const service = new UINavService(eventBus)

      setUINavServiceInstance(service)
      expect(() => getUINavServiceInstance()).not.toThrow()

      setUINavServiceInstance(undefined)
      expect(() => getUINavServiceInstance()).toThrow()
    })

    it("should accept undefined as a way to reset instance", () => {
      const eventBus = new Emitter()
      const service = new UINavService(eventBus)

      setUINavServiceInstance(service)
      setUINavServiceInstance(undefined)

      expect(() => getUINavServiceInstance()).toThrow("UINavService not initialized.")
    })

    it("should allow cleanup by setting to null before creating new instance", () => {
      const eventBus1 = new Emitter()
      const eventBus2 = new Emitter()
      const service1 = new UINavService(eventBus1)

      setUINavServiceInstance(service1)
      service1.setActiveScope("old-scope")

      // Cleanup
      setUINavServiceInstance(null)
      expect(() => getUINavServiceInstance()).toThrow()

      // Set new instance
      const service2 = new UINavService(eventBus2)
      service2.setActiveScope("new-scope")
      setUINavServiceInstance(service2)

      const retrieved = getUINavServiceInstance()
      expect(retrieved.activeScope).toBe("new-scope")
      expect(retrieved).toBe(service2)
    })
  })
})
