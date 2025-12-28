import { describe, it, expect, vi } from "vitest"
import { UINavService } from "@/services/uiNav"
import Emitter from "tiny-emitter"

describe("UINavService Test", () => {
  it("should not be blocked initially", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)
    const eventName = "context"

    const isBlocked = uiNavService.isEventBlocked(eventName)
    expect(isBlocked).toEqual(false)
  })

  it("should block a UINav event", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)
    const eventName = "context"
    const blockedEvents = [eventName]

    uiNavService.blockEvents(...blockedEvents)

    const isBlocked = uiNavService.isEventBlocked(eventName)
    expect(isBlocked).toEqual(true)
  })

  it("should unblock blocked events", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)
    const blockedEvents = ["context", "menu"]

    uiNavService.blockEvents(...blockedEvents)
    expect(uiNavService.getBlockedEvents()).toEqual(blockedEvents)

    uiNavService.unblockEvents(...blockedEvents)
    expect(uiNavService.getBlockedEvents()).toEqual([])
  })

  it("should clear blocked events", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)
    const blockedEvents = ["context", "menu"]

    uiNavService.setBlockedEvents(blockedEvents)
    expect(uiNavService.getBlockedEvents()).toEqual(blockedEvents)

    uiNavService.clearBlockedEvents()
    expect(uiNavService.getBlockedEvents()).toEqual([])
  })

  it("should not add duplicate when blocking the same event twice", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)
    const eventName = "context"

    uiNavService.blockEvents(eventName)
    uiNavService.blockEvents(eventName)

    const blockedEvents = uiNavService.getBlockedEvents()
    expect(blockedEvents).toEqual([eventName])
    expect(blockedEvents.length).toBe(1)
  })

  it("should not add duplicates when blocking multiple events that overlap", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    uiNavService.blockEvents("context", "menu")
    uiNavService.blockEvents("menu", "back")

    const blockedEvents = uiNavService.getBlockedEvents()
    expect(blockedEvents).toEqual(["context", "menu", "back"])
    expect(blockedEvents.length).toBe(3)
  })

  it("should handle blocking events when some are already blocked", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    uiNavService.blockEvents("context", "menu")
    expect(uiNavService.getBlockedEvents()).toEqual(["context", "menu"])

    uiNavService.blockEvents("context", "back", "menu")
    expect(uiNavService.getBlockedEvents()).toEqual(["context", "menu", "back"])
  })

  it("should maintain order and not add duplicates when called multiple times", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    uiNavService.blockEvents("focus_u", "focus_d")
    uiNavService.blockEvents("focus_l")
    uiNavService.blockEvents("focus_u", "focus_r") // focus_u is duplicate

    const blockedEvents = uiNavService.getBlockedEvents()
    expect(blockedEvents).toEqual(["focus_u", "focus_d", "focus_l", "focus_r"])
    expect(blockedEvents.length).toBe(4)
  })

  it("should handle blocking a large number of events with duplicates efficiently", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    const events1 = ["context", "menu", "back", "ok", "cancel"]
    const events2 = ["menu", "back", "focus_u", "focus_d"]
    const events3 = ["context", "ok", "focus_l", "focus_r"]

    uiNavService.blockEvents(...events1)
    uiNavService.blockEvents(...events2)
    uiNavService.blockEvents(...events3)

    const blockedEvents = uiNavService.getBlockedEvents()
    const uniqueEvents = [...new Set([...events1, ...events2, ...events3])]

    expect(blockedEvents.length).toBe(uniqueEvents.length)
    expect(blockedEvents.sort()).toEqual(uniqueEvents.sort())
  })

  it("should handle empty array arguments without errors", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    uiNavService.blockEvents("context")
    uiNavService.blockEvents([])
    uiNavService.blockEvents()

    expect(uiNavService.getBlockedEvents()).toEqual(["context"])
  })

  it("should preserve existing blocked events when attempting to add duplicates", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    uiNavService.setBlockedEvents(["context", "menu", "back"])
    const beforeCount = uiNavService.getBlockedEvents().length

    uiNavService.blockEvents("context", "menu", "back")
    const afterCount = uiNavService.getBlockedEvents().length

    expect(beforeCount).toBe(afterCount)
    expect(afterCount).toBe(3)
  })

  it("should not handle blocked events ", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    window.beamng = { ingame: true }
    const dispatchSpy = vi.spyOn(uiNavService, "dispatchDOMEvent")

    uiNavService.blockEvents("context")
    uiNavService.handleGameEvent("context", 1)

    expect(dispatchSpy).toHaveBeenCalledTimes(0)

    delete window.beamng
  })

  it("should handle non-blocked events normally", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    window.beamng = { ingame: true }
    const dispatchSpy = vi.spyOn(uiNavService, "dispatchDOMEvent")

    uiNavService.blockEvents("context")
    uiNavService.handleGameEvent("menu", 1)

    expect(dispatchSpy).toHaveBeenCalledTimes(1)

    delete window.beamng
  })
})
