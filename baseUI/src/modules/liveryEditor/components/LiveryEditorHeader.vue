<template>
  <div v-if="!store.headerHidden" class="liveryeditor-header">
    <BngScreenHeading :type="store.header.type" :preheadings="store.header.preheading">{{ store.header.heading }}</BngScreenHeading>
    <div v-if="!store.itemsHidden" class="header-items">
      <div v-for="(items, section) of sections" :class="[`section-${section}`]" class="header-section">
        <div v-for="item of items" :key="item.id">
          <component v-show="!item.hidden" :is="item.component" v-bind="item.props" v-on="item.events" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngScreenHeading } from "@/common/components/base"
import { useEditorHeaderStore } from "../stores/liveryEditorHeaderStore"
import { storeToRefs } from "pinia"

const store = useEditorHeaderStore()
const { startSectionItems, centerSectionItems, endSectionItems } = storeToRefs(store)

const sections = ref({
  start: startSectionItems,
  center: centerSectionItems,
  end: endSectionItems,
})
</script>

<style lang="scss" scoped>
.liveryeditor-header {
  display: flex;
  align-items: center;
  width: 100%;
  max-height: 6rem;

  :deep() {
    .bng-screen-heading {
      max-width: 22rem;
      margin-top: 0;
    }
  }

  .header-items {
    display: flex;
    align-items: center;
    height: 100%;
    width: 100%;
    margin: 0 0.25rem;

    .header-section {
      display: flex;
      align-items: center;
      flex-grow: 1;
    }

    .section-start {
      justify-content: flex-start;
    }

    .section-center {
      justify-content: center;
    }

    .section-end {
      justify-content: flex-end;
    }
  }
}
</style>
