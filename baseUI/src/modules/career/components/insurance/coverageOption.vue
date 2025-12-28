<template>
  <div class="coverage-options" :class="{ 'in-row': coverageOption.choiceType === 'toggle' }">
    <InsurancePerkNotice v-if="coverageOption.perkText && showPerkMode === 'deportedLabel'" :perkText="coverageOption.perkText" />
    <div v-if="!dontShowName" class="coverage-option-name">{{ coverageOption.name }}</div>
    <div class="choices" v-if="coverageOption.choiceType === 'multiple'">
      <div class="choice" :class="{ 'selected': choice.id === changedCoverageOptions[coverageOption.key], 'current': choice.id === getSelectedValueId(), 'disabled': choice.disabled }" v-for="choice in coverageOption.choices" :key="choice" @click="() => onChoiceClick(coverageOption, choice)">
        <div class="choice-label">
          {{ choice.choiceText }}
        </div>

        <div  v-if="!onlyShowMainText">
          <div v-if="choice.secondaryText" class="choice-secondary-text">
            {{ choice.secondaryText }}
          </div>
          <div v-else class="choice-price">
            <BngUnit :money="choice.premiumInfluence" />
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="coverageOption.choiceType === 'toggle'" class="toggle-container">
      <BngSwitch class="toggle-switch"
        :model-value="getToggleValue(coverageOption)"
        @change="(newValue) => onToggleChange(coverageOption, newValue)"
      />
      <div class="toggle-price">
        <BngUnit :money="getTogglePrice(coverageOption)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { InsurancePerkNotice } from "@/modules/career/components"
import { BngUnit, BngSwitch } from "@/common/components/base"
import { watch } from "vue"

const props = defineProps({
  coverageOption: {
    type: Object,
    required: true,
  },
  changedCoverageOptions: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  onlyShowMainText: {
    type: Boolean,
    default: false,
  },
  simpleSelect: {
    type: Boolean,
  },
  modelValue: {
    type: Number,
    required: false,
  },
  showPerkMode: {
    type: String,
    default: "deportedLabel",
  },
  dontShowName: {
    type: Boolean,
    default: false,
  }
})

const emit = defineEmits(["choiceClick", "toggleChange", "update:modelValue"])

// Watch for changes in coverageOption.choices and reset modelValue if it's out of bounds
watch(() => props.coverageOption?.choices, (newChoices) => {
  if (props.modelValue !== undefined && props.modelValue !== null && newChoices) {
    const maxValidId = newChoices.length
    if (props.modelValue > maxValidId) {
      emit("update:modelValue", 1)
    }
  }
}, { immediate: true })

const getSelectedValueId = () => {
  if (props.modelValue !== undefined && props.modelValue !== null) {
    return Math.min(props.modelValue, props.coverageOption.choices.length)
  }
  return props.changedCoverageOptions[props.coverageOption.key]
}

const getToggleValue = (coverageOption) => {
  const selectedValueId = props.changedCoverageOptions[coverageOption.key] ?? coverageOption.currentValueId
  const trueChoiceIndex = coverageOption.choices.findIndex(choice => choice.value === true)
  return selectedValueId === trueChoiceIndex + 1
}

const getTogglePrice = (coverageOption) => {
  const selectedValueId = props.changedCoverageOptions[coverageOption.key] ?? coverageOption.currentValueId
  const selectedChoice = coverageOption.choices[selectedValueId - 1]
  return selectedChoice?.premiumInfluence || 0
}

const onToggleChange = (coverageOption, newValue) => {
  emit("toggleChange", coverageOption, newValue)
}

const onChoiceClick = (coverageOption, choice) => {
  if (choice.disabled) return
  if (props.simpleSelect) {
    coverageOption.currentValueId = choice.id
  }

  // If modelValue is provided, emit update:modelValue for v-model support
  if (props.modelValue !== undefined && props.modelValue !== null) {
    emit("update:modelValue", choice.id)
  }

  emit("choiceClick", coverageOption, choice)
}
</script>

<style lang="scss">
@import "insuranceStyle.css";
</style>

<style scoped lang="scss">
.coverage-options{
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &.in-row{
    display: flex;
    flex-direction: row;
    gap: 0.625rem;
    justify-content: space-between;
  }
}

.toggle-switch {
  transform: scale(2);
  transform-origin: left center;

  &.bng-switch-on {
    > :deep(.bng-switch-control) {
      background: var(--bng-add-green-600) !important;
    }
  }
}

.choices{
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
}

.choice{
  background-color: var(--bng-cool-gray-800);
  padding: 0.625rem;
  border-radius: var(--bng-corners-2);
  border: 2px solid var(--bng-cool-gray-700);
  flex:1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:not(.disabled):not(.selected):hover{
    background-color: var(--orange-shade-50);
    border: 2px solid var(--orange-shade-10);
  }

  &.current{
    background-color: var(--orange-shade-50);
    border: 2px solid var(--orange-shade-10);
  }

  &.selected:not(.current){
    border: 2px solid var(--bng-add-green-500);
  }

  &.disabled{
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--bng-cool-gray-800);
    border: 2px solid var(--bng-cool-gray-700);
  }
}

.coverage-option-name{
  font-size: 1.3rem;
}

.choice-label{
  font-size: 1.15rem;
  font-weight: 500;
}

.choice-price{
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.7;
}

.choice-secondary-text{
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.7;
  text-align: center;
}

.toggle-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.9375rem;
}

.toggle-price {
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.7;
  width: 5rem;
  text-align: right;
  margin-left: 0.625rem;
}
</style>