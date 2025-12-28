<template>
  <div class="progress-steps">
    <div class="step-container">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="step"
        :class="step.class"
      >
        <div class="step-header">
          <div class="step-number">{{ index + 1 }}</div>
          <template v-if="!step.isLastStep">
            <div class="step-connector"></div>
            <div class="step-icon">
              <BngIcon :type="step.icon" />
            </div>
          </template>
        </div>
        <div class="step-label">{{ $tt(step.label) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { BngIcon } from "@/common/components/base"

const props = defineProps({
  steps: {
    type: Array,
    required: true,
    validator: steps => steps.every(step =>
      (step.label && typeof step.label === "string") ||
      (step.title && typeof step.title === "string")
    ),
  },
  currentStep: {
    type: Number,
    required: true,
    validator: step => step >= 0,
  },
})

const styles = {
  answeredYes: {
    class: "answered-yes",
    icon: "checkboxOn",
  },
  answeredNo: {
    class: "answered-no",
    icon: "missionCheckboxCross",
  },
  current: {
    class: "not-answered current",
    icon: "arrowLargeRight",
  },
  next: {
    class: "not-answered",
    icon: "checkboxOff",
  },
}

const steps = computed(() => props.steps.map((step, idx) => {
  const answer = !step.isAnswered ? null : step.answerType || "yes"

  let status = "next"
  if (idx < props.currentStep) {
    status = answer === "yes" ? "answeredYes" : "answeredNo"
  }
  if (idx === props.currentStep) status = "current"

  return {
    isLastStep: idx === props.steps.length - 1,
    class: styles[status].class,
    icon: styles[status].icon,
    label: step.label || step.title,
  }
}))
</script>

<style scoped lang="scss">
.progress-steps {
  padding: 1rem;
  // background: var(--bng-cool-gray-800);
  border-radius: 0.5rem;
  overflow: hidden;
  --bg-opacity: 0.8;

  .step-container {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 0.5rem;

    .step {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      padding-right: 0.5rem;

      // Default CSS variables
      --step-number-bg: var(--bng-cool-gray-600);
      --step-connector-bg: var(--bng-cool-gray-750);
      --step-icon-color: var(--bng-off-white);
      --step-label-color: var(--bng-off-white);

      &:last-child {
        padding-right: 0;
      }

      // Step state overrides
      &.answered-yes {
        --step-number-bg: var(--bng-cool-gray-600);
        --step-connector-bg: var(--bng-cool-gray-750);
        --step-icon-color: var(--bng-off-white);
        --step-label-color: var(--bng-off-white);
      }

      &.answered-no {
        --step-number-bg: var(--bng-cool-gray-750);
        --step-connector-bg: var(--bng-cool-gray-800);
        --step-icon-color: var(--bng-cool-gray-750);
        --step-label-color: var(--bng-cool-gray-550);
      }

      &.not-answered {
        --step-number-bg: var(--bng-cool-gray-600);
        --step-connector-bg: var(--bng-cool-gray-750);
        --step-icon-color: var(--bng-off-white);
        --step-label-color: var(--bng-off-white);

        &.current {
          --step-number-bg: var(--bng-orange-550);
          --step-connector-bg: var(--bng-orange-650);
        }
      }

      .step-header {
        width: 100%;
        display: flex;
        justify-content: flex-start;
        align-items: center;

        .step-number {
          padding: 0.125rem 0.75rem;
          color: var(--bng-off-white);
          background: var(--step-number-bg);
          border-radius: 0.125rem;
          font-family: 'Noto Sans Mono', monospace;
          font-size: 1.5rem;
          font-weight: 400;
          line-height: 1.5rem;
          letter-spacing: 0.03rem;
          transition: background-color 0.2s ease;
        }

        .step-connector {
          flex: 1 1 0;
          height: 1px;
          background: var(--step-connector-bg);
          transition: background-color 0.2s ease;
        }

        .step-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.1875rem 0 0.0625rem 0;
          border-radius: 0.125rem;
          --bng-icon-size: 1.5rem;
          --bng-icon-color: var(--step-icon-color);
        }
      }

      .step-label {
        width: 100%;
        padding: 0.25rem 1rem 0.5rem 0;
        color: var(--step-label-color);
        font-family: 'Noto Sans', sans-serif;
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.25rem;
        letter-spacing: 0.02rem;
        text-align: left;
        transition: color 0.2s ease;
      }
    }
  }
}

@media (max-width: 768px) {
  .progress-steps {
    padding: 0.5rem;

    .step-container {
      gap: 0.25rem;

      .step {
        padding-right: 0.25rem;

        .step-header {
          .step-number {
            padding: 0.0625rem 0.5rem;
            font-size: 1.25rem;
            line-height: 1.25rem;
          }

          .step-icon {
            --bng-icon-size: 1.25rem;
          }
        }

        .step-label {
          padding: 0.125rem 0.5rem 0.25rem 0;
          font-size: 0.875rem;
          line-height: 1.125rem;
        }
      }
    }
  }
}
</style>