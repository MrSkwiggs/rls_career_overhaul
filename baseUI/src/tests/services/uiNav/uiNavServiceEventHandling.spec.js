import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { UINavService } from "@/services/uiNav"
import { DOM_UI_NAVIGATION_EVENT, UI_SCOPE_ATTR } from "@/services/uiNav/constants"
import Emitter from "tiny-emitter"

describe("UINavService Event Handling Tests", () => {
  let eventBus
  let uiNavService

  beforeEach(() => {
    eventBus = new Emitter()
    uiNavService = new UINavService(eventBus)

    window.beamng = { ingame: true }
  })

  afterEach(() => {
    delete window.beamng
    vi.restoreAllMocks()
  })

  describe("handleGameEvent - Basic Behavior", () => {
    it("should dispatch DOM event for valid game event", () => {
      let eventCaught = false

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, () => {
        eventCaught = true
      })

      uiNavService.handleGameEvent("menu", 1)

      expect(eventCaught).toBe(true)
    })

    it("should NOT dispatch DOM event for blocked event", () => {
      uiNavService.blockEvents("menu")

      let eventCaught = false
      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, () => {
        eventCaught = true
      })

      uiNavService.handleGameEvent("menu", 1)

      expect(eventCaught).toBe(false)
    })

    it("should dispatch DOM event for unblocked event", () => {
      uiNavService.blockEvents("back")

      let eventCaught = false
      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, () => {
        eventCaught = true
      })

      uiNavService.handleGameEvent("menu", 1) // menu is not blocked

      expect(eventCaught).toBe(true)
    })
  })

  describe("handleGameEvent - window.beamng.ingame Validation", () => {
    it("should dispatch event when window.beamng.ingame is true", () => {
      window.beamng.ingame = true

      let eventCaught = false
      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, () => {
        eventCaught = true
      })

      uiNavService.handleGameEvent("menu", 1)

      expect(eventCaught).toBe(true)
    })

    it("should NOT dispatch event when window.beamng.ingame is false", () => {
      window.beamng.ingame = false

      let eventCaught = false
      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, () => {
        eventCaught = true
      })

      uiNavService.handleGameEvent("menu", 1)

      expect(eventCaught).toBe(false)
    })

    it("should NOT dispatch event when window.beamng is undefined", () => {
      delete window.beamng

      let eventCaught = false
      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, () => {
        eventCaught = true
      })

      uiNavService.handleGameEvent("menu", 1)

      expect(eventCaught).toBe(false)
    })

    it("should NOT dispatch event when window.beamng.ingame is undefined", () => {
      window.beamng = {}

      let eventCaught = false
      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, () => {
        eventCaught = true
      })

      uiNavService.handleGameEvent("menu", 1)

      expect(eventCaught).toBe(false)
    })
  })

  describe("handleGameEvent - Different Event Types", () => {
    it("should handle navigation events (focus_u, focus_d, focus_l, focus_r)", () => {
      const events = ["focus_u", "focus_d", "focus_l", "focus_r"]

      events.forEach(eventName => {
        let eventCaught = false
        const handler = e => {
          eventCaught = true
          expect(e.detail.name).toBe(eventName)
        }

        document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
        uiNavService.handleGameEvent(eventName, 1)
        document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

        expect(eventCaught).toBe(true)
      })
    })

    it("should handle menu events (menu, back)", () => {
      const events = ["menu", "back"]

      events.forEach(eventName => {
        let eventCaught = false
        const handler = e => {
          eventCaught = true
          expect(e.detail.name).toBe(eventName)
        }

        document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
        uiNavService.handleGameEvent(eventName, 1)
        document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

        expect(eventCaught).toBe(true)
      })
    })

    it("should handle action events (ok, cancel, context)", () => {
      const events = ["ok", "cancel", "context"]

      events.forEach(eventName => {
        let eventCaught = false
        const handler = e => {
          eventCaught = true
          expect(e.detail.name).toBe(eventName)
        }

        document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
        uiNavService.handleGameEvent(eventName, 1)
        document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

        expect(eventCaught).toBe(true)
      })
    })

    it("should handle tab events (tab_l, tab_r)", () => {
      const events = ["tab_l", "tab_r"]

      events.forEach(eventName => {
        let eventCaught = false
        const handler = e => {
          eventCaught = true
          expect(e.detail.name).toBe(eventName)
        }

        document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
        uiNavService.handleGameEvent(eventName, 1)
        document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

        expect(eventCaught).toBe(true)
      })
    })

    it("should handle modifier event", () => {
      let eventCaught = false
      const handler = e => {
        eventCaught = true
        expect(e.detail.name).toBe("modifier")
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("modifier", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(eventCaught).toBe(true)
    })

    it("should handle camera rotation events (rotate_h_cam, rotate_v_cam)", () => {
      const events = ["rotate_h_cam", "rotate_v_cam"]

      events.forEach(eventName => {
        let eventCaught = false
        const handler = e => {
          eventCaught = true
          expect(e.detail.name).toBe(eventName)
        }

        document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
        uiNavService.handleGameEvent(eventName, 0.5)
        document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

        expect(eventCaught).toBe(true)
      })
    })

    it("should handle analog/scalar events (focus_ud, focus_lr)", () => {
      const events = ["focus_ud", "focus_lr"]

      events.forEach(eventName => {
        let eventCaught = false
        const handler = e => {
          eventCaught = true
          expect(e.detail.name).toBe(eventName)
        }

        document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
        uiNavService.handleGameEvent(eventName, 0.75)
        document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

        expect(eventCaught).toBe(true)
      })
    })
  })

  describe("handleGameEvent - Different Value Types", () => {
    it("should handle value = 0 (button release)", () => {
      let capturedValue = null
      const handler = e => {
        capturedValue = e.detail.value
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("ok", 0)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(capturedValue).toBe(0)
    })

    it("should handle value = 1 (button press)", () => {
      let capturedValue = null
      const handler = e => {
        capturedValue = e.detail.value
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("ok", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(capturedValue).toBe(1)
    })

    it("should handle analog values (0.0 to 1.0)", () => {
      const analogValues = [0.0, 0.25, 0.5, 0.75, 1.0]

      analogValues.forEach(value => {
        let capturedValue = null
        const handler = e => {
          capturedValue = e.detail.value
        }

        document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
        uiNavService.handleGameEvent("rotate_h_cam", value)
        document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

        expect(capturedValue).toBe(value)
      })
    })

    it("should handle negative values", () => {
      let capturedValue = null
      const handler = e => {
        capturedValue = e.detail.value
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("rotate_v_cam", -0.5)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(capturedValue).toBe(-0.5)
    })

    it("should handle undefined value", () => {
      let capturedValue = "not-set"
      const handler = e => {
        capturedValue = e.detail.value
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", undefined)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(capturedValue).toBeUndefined()
    })

    it("should handle null value", () => {
      let capturedValue = "not-set"
      const handler = e => {
        capturedValue = e.detail.value
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", null)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(capturedValue).toBeNull()
    })
  })

  describe("handleGameEvent - Extras Parameter", () => {
    it("should handle no extras", () => {
      let capturedExtras = null
      const handler = e => {
        capturedExtras = e.detail.extras
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(capturedExtras).toEqual([])
    })

    it("should handle single extra value", () => {
      let capturedExtras = null
      const handler = e => {
        capturedExtras = e.detail.extras
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1, "extra1")
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(capturedExtras).toEqual(["extra1"])
    })

    it("should handle multiple extra values", () => {
      let capturedExtras = null
      const handler = e => {
        capturedExtras = e.detail.extras
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1, "extra1", "extra2", "extra3")
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(capturedExtras).toEqual(["extra1", "extra2", "extra3"])
    })

    it("should handle array extras", () => {
      let capturedExtras = null
      const handler = e => {
        capturedExtras = e.detail.extras
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1, [1, 2, 3])
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(capturedExtras).toEqual([[1, 2, 3]])
    })

    it("should handle object extras", () => {
      let capturedExtras = null
      const handler = e => {
        capturedExtras = e.detail.extras
      }

      const extraObj = { player: 0, mode: "test" }
      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1, extraObj)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(capturedExtras).toEqual([extraObj])
    })
  })

  describe("dispatchDOMEvent - Event Properties", () => {
    it("should dispatch event with type 'ui_nav'", () => {
      let eventType = null
      const handler = e => {
        eventType = e.type
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(eventType).toBe("ui_nav")
    })

    it("should dispatch cancelable event", () => {
      let isCancelable = false
      const handler = e => {
        isCancelable = e.cancelable
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(isCancelable).toBe(true)
    })

    it("should dispatch bubbling event", () => {
      let doesBubble = false
      const handler = e => {
        doesBubble = e.bubbles
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(doesBubble).toBe(true)
    })

    it("should include event data in event.detail", () => {
      let detail = null
      const handler = e => {
        detail = e.detail
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(detail).toBeDefined()
      expect(detail.name).toBe("menu")
      expect(detail.value).toBe(1)
    })
  })

  describe("dispatchDOMEvent - Event Detail Content", () => {
    it("should have correct event name in detail", () => {
      let detailName = null
      const handler = e => {
        detailName = e.detail.name
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("context", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(detailName).toBe("context")
    })

    it("should have correct value in detail", () => {
      let detailValue = null
      const handler = e => {
        detailValue = e.detail.value
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 0.75)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(detailValue).toBe(0.75)
    })

    it("should have extras in detail", () => {
      let detailExtras = null
      const handler = e => {
        detailExtras = e.detail.extras
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1, "extra1", "extra2")
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(detailExtras).toEqual(["extra1", "extra2"])
    })

    it("should have modified flag in detail", () => {
      let detailModified = null
      const handler = e => {
        detailModified = e.detail.modified
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(typeof detailModified).toBe("boolean")
    })

    it("should have boundAction in detail", () => {
      let detailBoundAction = null
      const handler = e => {
        detailBoundAction = e.detail.boundAction
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(detailBoundAction).toBeDefined()
    })

    it("should have sendToCrossfire flag in detail", () => {
      let detailSendToCrossfire = null
      const handler = e => {
        detailSendToCrossfire = e.detail.sendToCrossfire
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(typeof detailSendToCrossfire).toBe("boolean")
    })
  })

  describe("dispatchDOMEvent - Target Element Selection", () => {
    it("should dispatch to document.activeElement when it has focus", () => {
      const inputElement = document.createElement("input")
      document.body.appendChild(inputElement)
      inputElement.focus()

      let eventTarget = null
      const handler = e => {
        eventTarget = e.target
      }

      inputElement.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      inputElement.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(eventTarget).toBe(inputElement)

      document.body.removeChild(inputElement)
    })

    it("should dispatch to scope element when activeScope is set", () => {
      const scopeElement = document.createElement("div")
      scopeElement.setAttribute(UI_SCOPE_ATTR, "test-scope")
      document.body.appendChild(scopeElement)

      let eventTarget = null
      const handler = e => {
        eventTarget = e.target
      }

      uiNavService.setActiveScope("test-scope")
      scopeElement.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      scopeElement.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(eventTarget).toBe(scopeElement)

      document.body.removeChild(scopeElement)
    })

    it("should dispatch to document.body as fallback", () => {
      let eventTarget = null
      const handler = e => {
        eventTarget = e.target
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(eventTarget).toBe(document.body)
    })

    it("should dispatch to body when activeScope element doesn't exist", () => {
      uiNavService.setActiveScope("non-existent-scope")

      let eventTarget = null
      const handler = e => {
        eventTarget = e.target
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(eventTarget).toBe(document.body)
    })
  })

  describe("Event Propagation and Listener Interaction", () => {
    it("should be caught by addEventListener", () => {
      let eventCaught = false
      const handler = () => {
        eventCaught = true
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(eventCaught).toBe(true)
    })

    it("should allow accessing event.detail in listener", () => {
      let detail = null
      const handler = e => {
        detail = e.detail
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(detail).toBeDefined()
      expect(detail.name).toBe("menu")
    })

    it("should allow preventDefault()", () => {
      let wasDefaultPrevented = false
      const handler = e => {
        e.preventDefault()
        wasDefaultPrevented = e.defaultPrevented
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(wasDefaultPrevented).toBe(true)
    })

    it("should allow stopPropagation()", () => {
      const childElement = document.createElement("div")
      document.body.appendChild(childElement)

      let parentCaught = false
      let childCaught = false

      const childHandler = e => {
        childCaught = true
        e.stopPropagation()
      }

      const parentHandler = () => {
        parentCaught = true
      }

      childElement.addEventListener(DOM_UI_NAVIGATION_EVENT, childHandler)
      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, parentHandler)

      const event = new CustomEvent(DOM_UI_NAVIGATION_EVENT, {
        detail: { name: "test", value: 1 },
        bubbles: true,
        cancelable: true,
      })
      childElement.dispatchEvent(event)

      childElement.removeEventListener(DOM_UI_NAVIGATION_EVENT, childHandler)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, parentHandler)
      document.body.removeChild(childElement)

      expect(childCaught).toBe(true)
      expect(parentCaught).toBe(false)
    })

    it("should support multiple dispatches", () => {
      let eventCount = 0
      const handler = () => {
        eventCount++
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      uiNavService.handleGameEvent("menu", 1)
      uiNavService.handleGameEvent("back", 1)
      uiNavService.handleGameEvent("ok", 1)

      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(eventCount).toBe(3)
    })

    it("should propagate (bubble) through DOM", () => {
      const childElement = document.createElement("div")
      const parentElement = document.createElement("div")
      parentElement.appendChild(childElement)
      document.body.appendChild(parentElement)

      let parentCaught = false
      const parentHandler = () => {
        parentCaught = true
      }

      parentElement.addEventListener(DOM_UI_NAVIGATION_EVENT, parentHandler)

      const event = new CustomEvent(DOM_UI_NAVIGATION_EVENT, {
        detail: { name: "test", value: 1 },
        bubbles: true,
        cancelable: true,
      })
      childElement.dispatchEvent(event)

      parentElement.removeEventListener(DOM_UI_NAVIGATION_EVENT, parentHandler)
      document.body.removeChild(parentElement)

      expect(parentCaught).toBe(true)
    })
  })

  describe("Integration - Full Event Flow", () => {
    it("should prevent blocked events from reaching DOM", () => {
      uiNavService.blockEvents("menu")

      let eventCaught = false
      const handler = () => {
        eventCaught = true
      }

      document.body.addEventListener(DOM_UI_NAVIGATION_EVENT, handler)
      uiNavService.handleGameEvent("menu", 1)
      document.body.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler)

      expect(eventCaught).toBe(false)
    })

    it("should work with different activeScope values", () => {
      const scope1 = document.createElement("div")
      scope1.setAttribute(UI_SCOPE_ATTR, "scope1")
      const scope2 = document.createElement("div")
      scope2.setAttribute(UI_SCOPE_ATTR, "scope2")

      document.body.appendChild(scope1)
      document.body.appendChild(scope2)

      let scope1Events = 0
      let scope2Events = 0

      // Use simple event listeners to verify dispatching behavior
      const handler1 = e => {
        if (e.detail.name === "menu") scope1Events++
      }
      const handler2 = e => {
        if (e.detail.name === "back") scope2Events++
      }

      scope1.addEventListener(DOM_UI_NAVIGATION_EVENT, handler1)
      scope2.addEventListener(DOM_UI_NAVIGATION_EVENT, handler2)

      // Set scope1 as active and dispatch menu event
      uiNavService.setActiveScope("scope1")
      uiNavService.handleGameEvent("menu", 1)

      // Set scope2 as active and dispatch back event
      uiNavService.setActiveScope("scope2")
      uiNavService.handleGameEvent("back", 1)

      scope1.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler1)
      scope2.removeEventListener(DOM_UI_NAVIGATION_EVENT, handler2)
      document.body.removeChild(scope1)
      document.body.removeChild(scope2)

      expect(scope1Events).toBe(1)
      expect(scope2Events).toBe(1)
    })
  })
})
