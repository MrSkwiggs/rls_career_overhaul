<template>
  <div v-if="summaryItems.length > 0" class="wizard-summary">
    <div v-for="item in summaryItems" :key="item.stepId" class="summary-item">
      <strong>{{ $tt(item.title) }}:</strong>
      <span :class="{
        enabled: item.hasSelection,
        disabled: !item.hasSelection
      }">
        {{ $tt(item.selectedLabel || 'ui.common.unknown') }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from "vue"
import { uniqueId } from "@/services/uniqueId"

const props = defineProps({
  custom: {
    type: Array,
    default: () => [],
    validator: items => items.every(item => item.label && (item.value !== undefined)),
  },
  replace: {
    type: Boolean,
    default: false,
  }
})

const steps = inject("wizardSteps", ref([]))

const summaryItems = computed(() => {
  const customItems = props.custom.map(item => ({
    stepId: uniqueId(),
    title: item.label,
    selectedLabel: item.value,
    hasSelection: !item.disabled,
  }))

  if (props.replace) return customItems

  const stepsList = steps.value || []
  let automaticItems = []

  if (Array.isArray(stepsList)) {
    automaticItems = stepsList
      .filter(step => step.type === "choice" && step.choices && step.choices.length > 0)
      .map(step => {
        const selectedChoice = step.modelValue?.choice
        const choiceOption = step.choices.find(choice => choice.value === selectedChoice)
        return {
          stepId: step.id,
          title: step.title,
          selectedLabel: choiceOption?.label || null,
          hasSelection: !!selectedChoice,
        }
      })
      .filter(item => item.hasSelection) // only show steps with selections
  }

  return [...automaticItems, ...customItems]
})
</script>

<style scoped lang="scss">
.wizard-summary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: var(--bng-cool-gray-700);

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .enabled {
      color: var(--bng-green-600);
      font-weight: 500;
    }

    .disabled {
      color: var(--bng-cool-gray-500);
      font-weight: 500;
    }
  }
}
</style>
