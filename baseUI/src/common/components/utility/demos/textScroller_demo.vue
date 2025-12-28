<template>
  <div class="demo-page">
    <h3>Basic text scrolling</h3>
    <div class="buttons">
      <BngButton class="demo-button" :accent="ACCENTS.attention">
        <TextScroller>Attention: This text is quite important and rather lengthy</TextScroller>
      </BngButton>
      <BngButton class="demo-button" :icon="icons.beamNG" :accent="ACCENTS.secondary">
        <TextScroller>Button with icon and very long descriptive text content</TextScroller>
      </BngButton>
      <BngButton class="demo-button" :iconRight="icons.aperture" :accent="ACCENTS.outlined">
        <TextScroller>Button with icon and comprehensive description text</TextScroller>
      </BngButton>
    </div>

    <h3>Different container sizes</h3>
    <div class="buttons">
      <BngButton class="demo-button-small">
        <TextScroller>Short but overflows</TextScroller>
      </BngButton>
      <BngButton class="demo-button-medium">
        <TextScroller>Medium width container with moderately long text content</TextScroller>
      </BngButton>
      <BngButton class="demo-button-wide">
        <TextScroller>Extra wide container that can fit much more text content before needing to scroll horizontally</TextScroller>
      </BngButton>
    </div>

    <h3>Custom timing configuration</h3>
    <div class="buttons">
      <BngButton class="demo-button">
        <TextScroller :scroll-speed="1.5" :initial-pause="2" :ending-pause="2">
          Slow scrolling with long pauses - very leisurely pace for easy reading
        </TextScroller>
      </BngButton>
      <BngButton class="demo-button" :accent="ACCENTS.secondary">
        <TextScroller :scroll-speed="6" :initial-pause="0.5" :ending-pause="0.5" :fade-duration="0.1">
          Fast scrolling with quick pauses and rapid fade transitions
        </TextScroller>
      </BngButton>
    </div>

    <h3>Dynamic content watching</h3>
    <div class="buttons">
      <BngButton class="demo-button" @click="incrementCounter">
        <TextScroller :watch-content="true">
          Button clicked {{ clickCount }} times - this text updates dynamically and scrolls properly
        </TextScroller>
      </BngButton>
      <BngButton class="demo-button" :accent="ACCENTS.secondary" @click="toggleStatus">
        <TextScroller :watch-content="true">
          Status: {{ isActive ? 'Active and running with a very long description' : 'Inactive' }} - Click to toggle
        </TextScroller>
      </BngButton>
    </div>

    <h3>Custom navigable containers</h3>
    <div class="buttons">
      <div class="demo-custom-container" bng-nav-item>
        <div class="demo-custom-title">Custom Navigation Item</div>
        <div class="demo-custom-content">
          <TextScroller>This is a custom navigable container with text that needs to scroll when focused or hovered</TextScroller>
        </div>
      </div>
      <div class="demo-custom-container large" bng-nav-item>
        <div class="demo-custom-title">Larger Custom Container</div>
        <div class="demo-custom-content">
          <TextScroller>Even in larger containers, the text scroller adapts properly and provides smooth scrolling animation when the parent element receives focus or hover state</TextScroller>
        </div>
      </div>
    </div>

    <h3>No scrolling (because text fits just fine)</h3>
    <div class="buttons">
      <BngButton class="demo-button-wide">
        <TextScroller>Short text</TextScroller>
      </BngButton>
      <BngButton class="demo-button-wide" :accent="ACCENTS.secondary">
        <TextScroller>Fits perfectly</TextScroller>
      </BngButton>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngButton, icons, ACCENTS } from "@/common/components/base"
import { TextScroller } from "@/common/components/utility"

const clickCount = ref(0)
const isActive = ref(false)

const incrementCounter = () => clickCount.value++
const toggleStatus = () => isActive.value = !isActive.value
</script>

<style lang="scss" scoped>
.buttons {
  display: flex;
  align-items: flex-start;
  flex-flow: row wrap;
  margin-bottom: 2rem;

  & > :not(:last-child) {
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
  }
}

.demo-button {
  width: 300px;
  max-width: none;
}

.demo-button-small {
  width: 120px;
  max-width: none;
}

.demo-button-medium {
  width: 200px;
  max-width: none;
}

.demo-button-wide {
  width: 400px;
  max-width: none;
}

.demo-custom-container {
  position: relative;
  width: 300px;
  padding: 1rem;
  border: 2px solid var(--bng-cool-gray-600);
  border-radius: var(--bng-corners-1);
  background-color: var(--bng-ter-blue-gray-700);
  cursor: pointer;
  transition: all 200ms ease;

  &:hover, &:focus {
    border-color: var(--bng-orange-500);
    // background-color: var(--bng-ter-blue-gray-600);
    outline: none;
  }

  &.large {
    width: 450px;
  }
}

.demo-custom-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--bng-orange-400);
}

.demo-custom-content {
  height: 1.5rem;
  display: flex;
  align-items: center;
  color: var(--bng-cool-gray-200);
}
</style>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./TextScroller_demo.vue?raw"
export default {
  source,
  title: "Text Scroller",
  description: `A component that automatically scrolls text content when its parent navigable element is focused or hovered.
Text shows ellipsis when idle, and smoothly scrolls from left to right with fade transitions when active.

The component detects the closest navigable parent element using the crossfire navigation system and activates scrolling on focus/hover events.`,
  propInfo: [
    {
      name: "scrollSpeed",
      type: "Number",
      desc: "Speed of text scrolling in em per second. Default: 3",
    },
    {
      name: "initialPause",
      type: "Number",
      desc: "Pause time at the beginning of each scroll cycle in seconds. Default: 1.0",
    },
    {
      name: "endingPause",
      type: "Number",
      desc: "Pause time at the end of each scroll cycle in seconds. Default: 1.0",
    },
    {
      name: "fadeDuration",
      type: "Number",
      desc: "Duration of fade in/out transitions between scroll cycles in seconds. Default: 0.2",
    },
    {
      name: "watchContent",
      type: "Boolean",
      desc: "Enable reactive content watching for dynamic slot content (expensive, use only when needed). Default: false",
    },
  ],
}
</script>
