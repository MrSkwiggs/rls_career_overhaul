<template>
  <div class="center-wrap">
    <BngScreenHeading v-if="!discover.loaded || discover.pages.length === 0" divider type="line">
      {{ $tt("ui.experiences.general.quickStart") }}
    </BngScreenHeading>
    <BngScreenHeading v-else-if="discover.pages.length === 1" divider type="line">
      {{ $tt(discover.pages[0].name) }}
    </BngScreenHeading>
    <BngScreenHeading v-else class="exp-header exp-page-nav" divider type="line" bng-no-child-nav="true">
      <BngButton
        class="exp-tab-button exp-tab-nav"
        :accent="ACCENTS.outlined"
        :icon-left="icons.arrowSmallLeft"
        @click="switchPage(true)"
      >
        <BngBinding
          v-bng-on-ui-nav:tab_l="() => switchPage(true)"
          ui-event="tab_l"
          controller
        />
      </BngButton>
      <BngButton
        v-for="page in discover.pages"
        :key="page.index"
        :class="{ 'exp-page-nav-active': page.index === discover.currentPage }"
        class="exp-tab-button"
        :accent="ACCENTS.outlined"
        @click="discover.goToPage(page.index)"
      >
        {{ $tt(page.name) }}
      </BngButton>
      <BngButton
        class="exp-tab-button exp-tab-nav"
        :accent="ACCENTS.outlined"
        :icon-right="icons.arrowSmallRight"
        @click="switchPage(false)"
      >
        <BngBinding
          v-bng-on-ui-nav:tab_r="() => switchPage(false)"
          ui-event="tab_r"
          controller
        />
      </BngButton>
    </BngScreenHeading>

    <div class="exp-wrapper">
      <div class="exp-container">
        <BackAside @click="emit('changeView', null)" />

        <BngCard class="exp-content" v-bng-blur="!bgRequired">

          <BlurBackground v-if="bgRequired" class="corners-big" />
          <template v-for="(section, index) in discover.sections" :key="section.key">
            <div v-if="index > 0" :class="{ 'exp-separator': true, 'exp-desc-active': discover.description.show }">
              <Transition name="desc-appear">
                <div v-if="discover.description.show" class="exp-card-desc">
                  {{ $tt(discover.description.text) }}
                </div>
              </Transition>
            </div>
            <div
              class="exp-buttons"
              :class="{
                [`exp-buttons-${section.type}`]: section.type,
                'exp-buttons-mission-with-description': discover.pageDescription && section.type === 'mission',
                [`exp-buttons-${section.cards.length}-missions`]: section.type === 'mission',
              }"
            >
              <template v-if="!discover.loaded">
                <MenuButton
                  v-for="i in section.placeholders" :key="i"
                  disabled
                  :size="section.size" no-blur
                  :bg-img="section.size === 'big' ? '/images/mainmenu/freeroam.jpg' : null"
                  :style="section.style"
                >{{ i === 1 ? $tt("ui.repository.loading") : "" }}</MenuButton>
              </template>
              <template v-else>
                <MenuButton
                  v-for="card in section.cards" :key="card.discoverId"
                  :ref="(el) => setButtonRef(el, card)"
                  :bng-scoped-nav-autofocus="card.discoverId === focusId"
                  :size="section.size" no-blur
                  :disabled="!discover.enabled"
                  :bg-img-abs="card.image" enlarge-on-hover
                  :darkened-image="section.size === 'medium'"
                  :text-icon-prefix="section.size == 'medium' && card.icon"
                  :style="section.style"
                  :tag="$ctx_t(card.tag)"
                  @click="card.onClick"
                  @mouseenter="card.onHover"
                  @mouseleave="card.onMouseLeave"
                  @focus="card.onFocus"
                  @blur="card.onBlur"
                >{{ $tt(card.name) }}</MenuButton>
                <div
                  v-if="section.type === 'freeroam' && discover.pageDescription"
                  class="exp-page-description"
                  :style="{
                    'grid-column': `span ${5 - section.cards.length}`,
                    '--card-count': 5 - section.cards.length,
                  }"
                >
                  <BngCardHeading type="ribbon" class="exp-page-description-title">
                    {{ $tt(discover.pageDescription.title) }}
                  </BngCardHeading>
                  <span class="exp-page-description-text">
                    {{ $tt(discover.pageDescription.description) }}
                  </span>
                </div>
              </template>
            </div>
          </template>
        </BngCard>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, nextTick, ref, onUpdated } from "vue"
import { BngCard, BngScreenHeading, BngCardHeading, BngBinding, BngButton, ACCENTS, icons } from "@/common/components/base"
import { vBngBlur, vBngOnUiNav } from "@/common/directives"
import { SysInfo } from "@/services"
import { useDiscoverStore } from "../discover.js"
import MenuButton from "../components/MenuButton.vue"
import BlurBackground from "@/common/modules/main-bg/components/BlurBackground.vue"
import BackAside from "../components/BackAside.vue"
import { ensureFocus, setFocus } from "@/services/uiNavFocus"

const emit = defineEmits(["changeView"])

const bgRequired = SysInfo.mainMenuBackgroundRequired

const discover = useDiscoverStore()

const focusId = computed(() => {
  const allCards = discover.sections.flatMap(section => section.cards)
  let card = allCards.find(card => discover.lastStartedDiscoverId && discover.lastStartedDiscoverId === card.discoverId)
  if (!card) card = allCards[0]
  return card?.discoverId
})

const menuButtonRef = ref(null)

const setButtonRef = (el, card) => {
  if (card.discoverId === focusId.value) menuButtonRef.value = el
}

const switchPage = (left) => {
  const indexOffset = left ? -1 : 1
  const newIndex = (discover.currentPage + indexOffset) % discover.pages.length
  const adjustedIndex = newIndex < 0 ? discover.pages.length + newIndex : newIndex
  discover.goToPage(adjustedIndex)

  nextTick(()=> focusDefaultButton())
}

onMounted(async () => {
  await discover.loadDiscoverPages()
  // Set page description for current page
  if (discover.discoverPages && discover.discoverPages.length > 0) {
    discover.pageDescription = discover.discoverPages[discover.currentPage]?.description
  }

  await nextTick()
  focusDefaultButton()
})

function focusDefaultButton() {
  if (!menuButtonRef.value) return
  const elementToFocus = menuButtonRef.value?.getElement?.()
  setFocus(elementToFocus)
}
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

$button-width: 16em;
$buttons-per-row: 5;
$rem: calc-ui-rem();

.center-wrap {
  align-self: center;

  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
  margin: 0 calc-ui-rem(15);
}

.exp-wrapper {
  width: calc($button-width * $buttons-per-row + 0.7em * $buttons-per-row);
  margin-bottom: 3.5em;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}

.exp-header {
  margin-left: calc-ui-rem(-4.25);
  :deep(.header) {
    gap: 0;
    background: none !important;
    padding: 0;
  }
  margin-bottom: 1rem;
}

  .exp-page-description {
    width: calc(var(--card-count) * 16em + (var(--card-count) - 0) * 0.25em);
    color: white;
    font-size: $rem;
    padding: 0.5em;
    opacity: 1;
    line-height: 1.4;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: calc-ui-rem(0.375);
    margin: 0.25em;
    font-family: 'Overpass', var(--fnt-defs);
    overflow: hidden;

    .exp-page-description-title {
      margin-left:-0.5em;
      margin-top: 0.25em;
    }
    .exp-page-description-text {
      font-size: 1.25rem;
      font-size: 1.0rem;
    }
  }

.exp-page-nav {
  justify-content: center;

  .exp-tab-button {
    min-width: 2.5rem !important;
    padding: 0.375em 1em 0.5em 1em;
    font-size: 1.1rem;
    font-weight: bold;
    pointer-events: all;
    :deep(.background) {
      border-color: transparent !important;
      background-color: #0006;
    }

    &:first-of-type {
      margin-left: 0 !important;
    }
  }

  .exp-tab-nav {
    padding-left: 0.5em;
    padding-right: 0.5em;
    :deep(.icon) {
      font-size: 1.5rem;
      padding: 0 !important;
    }
  }

  .exp-page-nav-active {
    :deep(.background) {
      background-color: var(--bng-orange-500);
    }
  }
}

.exp-container {
  position: relative;
  padding: 0.25em;

  .exp-heading {
    flex: 0 0 100%;
    color: #fff;
  }

  .exp-content {
    --bg-opacity: 0.4;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: stretch;
    font-size: $rem;
  }
  :deep(.card-cnt) {
    padding: 0.5em;
    gap:1em;
  }
}

.exp-buttons {
  pointer-events: all;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: stretch;
  gap: 0.25em;

  &.exp-buttons-freeroam {
    // Freeroam sections might have different styling
  }

  &.exp-buttons-mission {
    // Mission sections might have different styling
    grid-template-rows: repeat(2, 1fr);
  }

  &.exp-buttons-6-missions {
    :nth-child(4) {
      grid-column: 1;
    }
  }
  &.exp-buttons-7-missions {
    :nth-child(5) {
      grid-column: 1;
    }
  }
}

.exp-section-header {
  margin: 1em 0 0.5em 0;

  h3 {
    color: white;
    font-size: $rem;
    font-weight: 600;
    margin: 0;
    text-align: center;
  }

  &.exp-section-freeroam {
    h3 {
      color: var(--bng-orange-400);
    }
  }

  &.exp-section-mission {
    h3 {
      color: var(--bng-blue-400);
    }
  }
}

.exp-separator {
  position: relative;
  display: block;
  height: 3em;
  margin: -0.5em 0.25em;
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(90deg,
      rgba(var(--bng-orange-400-rgb), 0) 0%,
      var(--bng-orange-400) 15%,
      var(--bng-orange-400) 85%,
      rgba(var(--bng-orange-400-rgb), 0) 100%
    );
    background-size: 95% 3px;
    background-position: 50% 50%;
    background-repeat: no-repeat;
    transition:
      background-size 200ms ease-in-out,
      opacity 200ms ease-in-out;
  }
}
.exp-desc-active::before {
  background-size: 95% 0px;
  opacity: 0;
}

.exp-card-desc {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: block;
  max-height: 100%;
  width: 80%;
  $rem2: calc-ui-rem(2);
  padding: 0.35em $rem2 0.1em 2em;
  font-size: $rem;
  border-radius: 0.5em;
  color: white;
  background-image: linear-gradient(
    90deg,
    #0000 0%,
    #0008 $rem2 calc(100% - $rem2),
    #0000 100%
  );
  background-size: 100% 100%;
  opacity: 1;
  overflow: hidden;
  pointer-events: none;
  text-align: center;
}

.desc-appear-enter-active,
.desc-appear-leave-active {
  transition:
    opacity 200ms ease-in-out,
    max-height 200ms ease-in-out;
}
.desc-appear-enter-from,
.desc-appear-leave-to {
  opacity: 0.5;
  max-height: 0%;
}
</style>
