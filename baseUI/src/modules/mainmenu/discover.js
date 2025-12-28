import { ref, computed } from "vue"
import { defineStore } from "pinia"
import { useBridge } from "@/bridge"
import { startLoading } from "@/services"
import { waitForLoadingScreenFadeIn } from "@/services/screenCover"
import Storage from "@/services/storage"

export const useDiscoverStore = defineStore("discover", () => {
  const { lua, events } = useBridge()

  const discoverPages = ref([])
  const loaded = ref(false)
  const enabled = ref(false)
  const descShow = ref(false)
  const descText = ref(null)
  const descriptions = ref({
    hover: null,
    focus: null,
  })
  const pageDescription = ref(null)
  const currentPage = ref(0)
  let descTimer = null

  const storage = new Storage("discover", {
    lastSelected: 0, // index by allCards
    lastStarted: undefined, // discoverId of last started activity
  }).values

  function setDescription(type, card = undefined) {
    if (descTimer) clearTimeout(descTimer)
    descriptions.value[type] = card?.description
    if (card) {
      descShow.value = true
      descText.value = card.description
    } else if (type === "hover" && descriptions.value.focus) {
      descText.value = descriptions.value.focus
    } else {
      descTimer = setTimeout(() => {
        descShow.value = false
        descTimer = setTimeout(() => {
          descText.value = null
          descTimer = null
        }, 200) // transition time
      }, 100) // cooldown
    }
  }

  async function loadDiscoverPages() {
    loaded.value = false
    enabled.value = false
    discoverPages.value = []
    await lua.extensions.load("gameplay_discover")
    discoverPages.value = await lua.gameplay_discover.getDiscoverPages()
    loaded.value = true
    enabled.value = true
    console.log("discoverPages", discoverPages.value, "lastStartedDiscoverId", storage.lastStarted)
  }

  async function startDiscover(discoverId) {
    const cardIndex = allCards.value.findIndex(card => card.discoverId === discoverId)
    if (cardIndex === -1) {
      console.warn(`startDiscover: card not found: ${discoverId}`)
      return
    }

    storage.lastSelected = cardIndex
    storage.lastStarted = discoverId

    enabled.value = false
    events.emit("LoadingScreen", { active: true })

    await startLoading(async () => {
      await waitForLoadingScreenFadeIn()
      await lua.gameplay_discover.startDiscover(discoverId)
    })
  }

  const sections = computed(() => {
    const baseSections = []
    let stamp = Date.now()

    if (discoverPages.value && Array.isArray(discoverPages.value) && discoverPages.value.length > 0) {
      const page = discoverPages.value[currentPage.value]
      if (page && page.sections) {
        for (const section of page.sections) {
          if (section.cards && section.cards.length > 0) {
            // Determine section styling based on type
            const isFreeroam = section.type === "freeroam"
            const sectionConfig = {
              title: section.title || (isFreeroam ? "Freeroam Experiences" : "Showcase Challenges"),
              cards: [],
              placeholders: isFreeroam ? 5 : 10,
              size: isFreeroam ? "big" : "medium",
              style: isFreeroam ? {} : { "--button-height": "4.5em" },
              key: stamp++,
              type: section.type
            }

            for (const card of section.cards) {
              const cardWithHandlers = {
                ...card,
                onClick: () => startDiscover(card.discoverId),
                onFocus: () => setDescription("focus", card),
                onHover: () => setDescription("hover", card),
                onBlur: () => setDescription("focus"),
                onMouseLeave: () => setDescription("hover"),
              }
              sectionConfig.cards.push(cardWithHandlers)
            }

            baseSections.push(sectionConfig)
          }
        }
      }
    }

    return baseSections
  })

  const allCards = computed(() => sections.value.flatMap(s => s.cards))

  const description = computed(() => ({
    show: descShow.value,
    text: descText.value,
  }))

  const lastSelectedIndex = computed({ get: () => storage.lastSelected, set: value => storage.lastSelected = value })
  const lastStartedDiscoverId = computed(() => {
    if (storage.lastStarted) return storage.lastStarted
    // Find the first card from any section
    for (const section of sections.value) {
      if (section.cards.length > 0) {
        return section.cards[0].discoverId
      }
    }
    return undefined
  })

  const totalPages = computed(() => discoverPages.value?.length || 0)
  const hasNextPage = computed(() => currentPage.value < totalPages.value - 1)
  const hasPrevPage = computed(() => currentPage.value > 0)

  // Get page information for navigation
  const pages = computed(() => {
    if (!discoverPages.value || !Array.isArray(discoverPages.value)) {
      return []
    }
    return discoverPages.value.map((page, index) => ({
      index,
      name: page.title || `Page ${index + 1}`,
      isActive: index === currentPage.value
    }))
  })

  function nextPage() {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  function prevPage() {
    if (hasPrevPage.value) {
      currentPage.value--
    }
  }

  function goToPage(pageIndex) {
    if (pageIndex >= 0 && pageIndex < totalPages.value) {
      currentPage.value = pageIndex
      pageDescription.value = discoverPages.value[pageIndex].description
    }
  }

  // Get current page title
  const currentPageTitle = computed(() => {
    if (!discoverPages.value || !Array.isArray(discoverPages.value) || currentPage.value >= discoverPages.value.length) {
      return "ui.experiences.general.quickStart"
    }
    const page = discoverPages.value[currentPage.value]
    return page.title || "ui.experiences.general.quickStart"
  })

  // Get sections for a specific page
  function getSectionsForPage(pageIndex) {
    if (!discoverPages.value || !Array.isArray(discoverPages.value) || pageIndex < 0 || pageIndex >= discoverPages.value.length) {
      return []
    }

    const page = discoverPages.value[pageIndex]
    const baseSections = []
    let stamp = Date.now()

    if (page && page.sections) {
      for (const section of page.sections) {
        if (section.cards && section.cards.length > 0) {
          // Determine section styling based on type
          const isFreeroam = section.type === "freeroam"
          const sectionConfig = {
            title: section.title || (isFreeroam ? "Freeroam Experiences" : "Showcase Challenges"),
            cards: [],
            placeholders: isFreeroam ? 5 : 10,
            size: isFreeroam ? "big" : "medium",
            style: isFreeroam ? {} : { "--button-height": "4.5em" },
            key: stamp++,
            type: section.type
          }

          for (const card of section.cards) {
            const cardWithHandlers = {
              ...card,
              onClick: () => startDiscover(card.discoverId),
              onFocus: () => setDescription("focus", card),
              onHover: () => setDescription("hover", card),
              onBlur: () => setDescription("focus"),
              onMouseLeave: () => setDescription("hover"),
            }
            sectionConfig.cards.push(cardWithHandlers)
          }

          baseSections.push(sectionConfig)
        }
      }
    }

    return baseSections
  }

  return {
    loaded,
    enabled,
    sections,
    allCards,
    description,
    lastSelectedIndex,
    lastStartedDiscoverId,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    pages,
    pageDescription,
    currentPageTitle,
    discoverPages,
    nextPage,
    prevPage,
    goToPage,
    getSectionsForPage,
    loadDiscoverPages,
  }
})
