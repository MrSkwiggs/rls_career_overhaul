import { describe, it, expect, vi } from "vitest"
import { UINavService } from "@/services/uiNav"
import Emitter from "tiny-emitter"

describe("UINavService Active Scope Test", () => {
  it("should have undefined activeScope initially", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    expect(uiNavService.activeScope).toBeUndefined()
  })

  it("should set the active scope", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)
    const scopeId = "test"

    uiNavService.setActiveScope(scopeId)
    expect(uiNavService.activeScope).toEqual(scopeId)
  })

  it("should set the active scope to null", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    uiNavService.setActiveScope(null)
    expect(uiNavService.activeScope).toEqual(null)
  })

  it("should handle setting activeScope from non-empty value to undefined", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    uiNavService.setActiveScope("initial-scope")
    uiNavService.setActiveScope(undefined)

    expect(uiNavService.activeScope).toBeUndefined()
  })

  it("should pass activeScope to event processor during handleGameEvent", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    // Mock window.beamng.ingame
    window.beamng = { ingame: true }

    // Spy on processEvent to check context
    const processSpy = vi.spyOn(uiNavService.eventProcessor, "processEvent")

    uiNavService.setActiveScope("test-scope")
    uiNavService.handleGameEvent("menu", 1)

    expect(processSpy).toHaveBeenCalled()
    const contextArg = processSpy.mock.calls[0][3]
    expect(contextArg.activeScope).toBe("test-scope")

    delete window.beamng
  })

  it("should use activeScope when determining event broadcast element", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    window.beamng = { ingame: true }

    // Create a mock element with the scope attribute
    const scopeElement = document.createElement("div")
    scopeElement.setAttribute("bng-ui-scope", "test-scope")
    document.body.appendChild(scopeElement)

    // Spy on getEventBroadcastElement
    const broadcastSpy = vi.spyOn(uiNavService.eventProcessor, "getEventBroadcastElement")

    uiNavService.setActiveScope("test-scope")
    uiNavService.handleGameEvent("menu", 1)

    expect(broadcastSpy).toHaveBeenCalledWith("test-scope")

    document.body.removeChild(scopeElement)
    delete window.beamng
  })

  it("should dispatch events to correct element based on activeScope", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    window.beamng = { ingame: true }

    // Create scope elements
    const scope1 = document.createElement("div")
    scope1.setAttribute("bng-ui-scope", "scope-1")
    const scope2 = document.createElement("div")
    scope2.setAttribute("bng-ui-scope", "scope-2")

    document.body.appendChild(scope1)
    document.body.appendChild(scope2)

    let eventFired = null
    scope1.addEventListener("ui_nav", e => {
      eventFired = "scope-1"
    })
    scope2.addEventListener("ui_nav", e => {
      eventFired = "scope-2"
    })

    uiNavService.setActiveScope("scope-1")
    uiNavService.handleGameEvent("menu", 1)

    expect(eventFired).toBe("scope-1")

    // Cleanup
    document.body.removeChild(scope1)
    document.body.removeChild(scope2)
    delete window.beamng
  })

  it("should dispatch to document.body when activeScope is not set", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    window.beamng = { ingame: true }

    let eventCaught = false
    const handler = () => {
      eventCaught = true
    }
    document.body.addEventListener("ui_nav", handler)

    // No activeScope set
    uiNavService.handleGameEvent("menu", 1)

    expect(eventCaught).toBe(true)

    // Cleanup
    document.body.removeEventListener("ui_nav", handler)
    delete window.beamng
  })

  it("should dispatch to document.body when activeScope element does not exist in DOM", () => {
    const eventBus = new Emitter()
    const uiNavService = new UINavService(eventBus)

    window.beamng = { ingame: true }

    let eventCaught = false
    const handler = () => {
      eventCaught = true
    }
    document.body.addEventListener("ui_nav", handler)

    uiNavService.setActiveScope("non-existent-scope")
    uiNavService.handleGameEvent("menu", 1)

    expect(eventCaught).toBe(true)

    document.body.removeEventListener("ui_nav", handler)
    delete window.beamng
  })
})
