<template>
  <Accordion class="favorite-selection-item" :expanded="data.expanded">
    <div v-for="(item, idx) of data.items" :key="idx" class="item-wrapper">
      <AccordionItem
        navigable
        v-if="item.items"
        :static="!item.items"
        :expanded="expandedStates[idx]"
        @expanded="toggleExpanded(idx, $event)"
        arrow-big
        @mouseover.stop="select(item)"
        @mouseleave.stop="deselect(item)"
        @focusin.stop="select(item)"
        @focusout.stop="deselect(item)"
        :primary-action="() => addActionToQuickAccess(item)"
        primary-label="ui.inputActions.menu.menu_item_select.title"
        expand-hint-inline
      >
        <template #caption>
          <div class="item-container" navigable tabindex="0">
            <div class="item-content">
              <!-- <BngIcon :type="item.invalid ? icons.checkboxOff : icons.checkboxOn"  /> -->
              <!-- uid:{{ item.uniqueID }} | slot:{{ item.startSlot }} | order:{{ item.categoryOrder }} | idx:{{ idx }} | goto:{{ item.goto }} - -->

              <BngIcon :type="icons[item.icon]" />
              {{ item.title ? $translate.instant(item.title) : item.niceName }}
            </div>
            <BngButton
              :accent="'outlined'"
              class="select-button"
              @click="addActionToQuickAccess(item)"
              v-if="item.uniqueID && isFocused(item)"
              bng-no-nav
            >
            <BngBinding
              class="input-icon"
              ui-event="ok"
              controller
              />
              Select
            </BngButton>
          </div>
        </template>
        <FavoriteSelectionItem :data="item" :level="level + 1" @added-function="addActionToQuickAccess" @removed-function="removeFunction" />
      </AccordionItem>
      <AccordionItem
        v-else
        :static="true"
        navigable
        @mouseover.stop="select(item)"
        @mouseleave.stop="deselect(item)"
        @focusin.stop="select(item)"
        @focusout.stop="deselect(item)"
        :primary-action="() => addActionToQuickAccess(item)"
        primary-label="ui.inputActions.menu.menu_item_select.title"

      >
        <template #caption>
          <div class="item-container indented" navigable tabindex="0">
            <div class="item-content">
              <!-- <BngIcon :type="item.invalid ? icons.checkboxOff : icons.checkboxOn"  /> -->
              <!-- uid:{{ item.uniqueID }} | slot:{{ item.startSlot }} | order:{{ item.categoryOrder }} | idx:{{ idx }} | goto:{{ item.goto }} - -->
              <BngIcon v-if="item.icon" :type="icons[item.icon]" />
              {{ $translate.instant(item.title) }}
            </div>
            <BngButton
              class="select-button"
              @click="addActionToQuickAccess(item)"
              :accent="'outlined'"
              v-if="item.uniqueID && isFocused(item)"
              bng-no-nav
            >
              <BngBinding
                class="input-icon"
                ui-event="ok"
                controller
                />
              Select
            </BngButton>
          </div>
        </template>
      </AccordionItem>
    </div>
  </Accordion>
</template>

<script setup>
import { ref, computed } from "vue"
import { BngButton, ACCENTS, BngIcon, icons, BngBinding } from "@/common/components/base"
import { Accordion, AccordionItem } from "@/common/components/utility"
import { $translate } from "@/services/translation"

const props = defineProps({
  data: Object,
  level: {
    type: Number,
    default: 0
  }
})

const nop = () => {}
const emit = defineEmits(["addedFunction", "removedFunction"])

const expandedStates = ref({})
const focusedItem = ref(null)

const toggleExpanded = (idx, value) => {
  expandedStates.value[idx] = value
}

const select = (item) => {
  focusedItem.value = item
}

const deselect = (item) => {
  if (focusedItem.value === item) {
    focusedItem.value = null
  }
}

const isFocused = (item) => {
  return focusedItem.value === item
}

const addActionToQuickAccess = (item) => {
  console.log("addActionToQuickAccess", item)
  if (item && item.uniqueID) {
    emit("addedFunction", item)
  }
}

const removeFunction = () => {
  emit("removedFunction")
}
</script>

<script>

</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;

.favorite-selection-item {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.item-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.25rem;
}


.item-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  //background: rgba(255, 255, 255, 0.1);
  border-radius: var(--bng-corners-1);
  transition: background-color 0.2s ease;
  box-sizing: border-box;
  min-height: 2.25rem;



}

:deep(.bng-accitem) {
  width: 100%;
  box-sizing: border-box;
  .bng-accitem-caption {
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.4);
    &:hover {
      background-color: rgba(var(--bng-cool-gray-700-rgb), 0.6);
    }
  }


  &.bng-accitem.bng-accitem-expanded > .bng-accitem-caption {
    background-color: rgba(var(--bng-cool-gray-700-rgb), 1);
    &:hover {
      background-color: rgba(var(--bng-cool-gray-700-rgb), 1);
    }
  }

  > .bng-accitem-caption {
    padding: 0.25rem 0.5rem;
    align-items: center;
    min-height: unset;
    box-sizing: border-box;

    .bng-button {
      min-width: 10rem;
      height: 2.0rem;
      font-size: 1rem;
    }
  }

  > .bng-accitem-content {
    padding-left: 1rem;
  }
}

.select-button {
  opacity: 0;
  transition: opacity 0.2s ease;
  gap: 0.5rem;
}

:deep(.bng-accitem) {
  > .bng-accitem-caption {
    &:hover .select-button,
    &:focus .select-button {
      opacity: 1;
    }
  }
}
</style>