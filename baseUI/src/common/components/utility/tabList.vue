<!-- Tab List -->
<template>
  <div class="tab-list">
    <BngButton
      v-for="(tab, i) in tabs"
      :key="i"
      :accent="tab.active ? 'ghost' : 'ghost'"
      :class="tabHeaderClasses(tab)"
      tabindex="0"
      bng-nav-item
      @click="handleTabSelect(tab.index, $event)"
    >{{ tab.heading }}</BngButton>
  </div>
</template>

<script setup>
import { inject, nextTick } from "vue"
import { BngButton } from "@/common/components/base"
import { setFocus } from "@/services/uiNavFocus"

const tabs = inject("tabs")
const selectTab = inject("selectTab")

const tabHeaderClasses = tab => ({
  "tab-item": true,
  "tab-active-tab": tab.active,
  "no-hover": tab.active,
})

// Handle tab selection
function handleTabSelect(index, event) {
  // Get the button element
  const buttonElement = event.currentTarget

  // Check if focus frame was visible before (has focus-visible class)
  const hasFocusVisible = document.activeElement &&
                          document.activeElement.classList.contains('focus-visible')

  // First select the tab
  selectTab(index)

  // After the DOM has updated, set focus on the selected tab only if focus was visible before
  if (hasFocusVisible) {
    nextTick(() => {
      // Use setFocus to set focus on the active tab
      setFocus(buttonElement)
    })
  }
}
</script>

<style lang="scss" scoped>
.tab-list {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: flex-start;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  padding: 0.5em;
  background-color: var(--tab-bg);
  border-radius: var(--tab-list-corners);
  margin: 0 0 0.5em 0;
  flex: 0 0 auto;
  list-style: none;

  .tab-item {
    text-overflow: ellipsis;
    overflow: visible;
    &.tab-active-tab {
      --bng-button-bg-image: linear-gradient(0deg, rgba(var(--tab-bg-active-line), 1) 0.1875rem, rgba(var(--tab-bg-active-line), 0) 0.1876rem);
    }
  }
}
</style>
