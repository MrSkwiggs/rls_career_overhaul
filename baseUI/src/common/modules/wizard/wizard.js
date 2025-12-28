import { ref, computed, provide, nextTick } from "vue"

export function useWizard(options = {}) {
  const {
    allowSkip = false,
    validateSteps = true,
  } = options

  const stepRegistry = ref(new Map())
  const currentStepIndex = ref(0)
  const completedSteps = ref(new Set())
  const isFinished = ref(false)

  const steps = computed(() => {
    if (stepRegistry.value.size === 0) return []
    const res = Array.from(stepRegistry.value.values())
    // calculate requiredFor relationships
    for (const step of res) {
      if (!step.enabledWhen || step.enabledWhen.length === 0) continue
      for (const condition of step.enabledWhen) {
        if (condition.step) {
          const dependencyStep = res.find(s => s.id === condition.step)
          if (!dependencyStep) continue
          if (!dependencyStep.requiredFor) {
            dependencyStep.requiredFor = []
          }
          if (!dependencyStep.requiredFor.includes(step.id)) {
            dependencyStep.requiredFor.push(step.id)
          }
        }
      }
    }
    return res
  })

  const registerStep = stepConfig => stepRegistry.value.set(stepConfig.id, stepConfig)
  const unregisterStep = stepId => stepRegistry.value.delete(stepId)

  provide("registerWizardStep", registerStep)
  provide("unregisterWizardStep", unregisterStep)

  const currentStep = computed(() => steps.value[currentStepIndex.value] || null)
  const isFirstStep = computed(() => currentStepIndex.value === 0)
  const isLastStep = computed(() => currentStepIndex.value === steps.value.length - 1)
  const canGoNext = computed(() => {
    if (!validateSteps) return true
    const step = currentStep.value
    if (!step || !isStepEnabled(step)) return false
    // check if step explicitly disables advancement
    if (step.advanceDisabled) return false
    // if step has validation function
    if (typeof step.validate === "function") {
      return step.validate(step.modelValue || {})
    }
    // for choice steps, check if choice is made
    if (step.type === "choice" && step.required !== false) {
      return step.modelValue?.choice !== undefined
    }
    // for form steps, validation is handled by custom validate function or external logic
    if (step.type === "form") {
      return true // let custom validate function handle this
    }
    return true
  })

  // checks if a step is enabled based on enabledWhen conditions
  const isStepEnabled = step => {
    if (!step.enabledWhen || step.enabledWhen.length === 0) return true
    return step.enabledWhen.every(condition => {
      if (condition.step) {
        // get modelValue of the dependency step
        const dependencyStep = steps.value.find(s => s.id === condition.step)
        const dependencyStepData = dependencyStep?.modelValue || {}
        if (typeof condition.value !== "undefined") {
          return dependencyStepData?.choice === condition.value ||
            dependencyStepData?.[Object.keys(dependencyStepData)[0]] === condition.value
        }
        if (typeof condition.condition === "function") {
          return condition.condition(dependencyStepData)
        }
      }
      if (typeof condition.condition === "function") {
        return condition.condition()
      }
      return true
    })
  }

  const canGoBack = computed(() => !isFirstStep.value)
  const canFinish = computed(() => !validateSteps ? isLastStep.value : isLastStep.value && canGoNext.value)

  const goToStep = index => {
    if (index <= 0) currentStepIndex.value = 0
    if (index >= steps.value.length) currentStepIndex.value = steps.value.length - 1
    currentStepIndex.value = index
  }

  const nextStep = async () => {
    await nextTick()
    if (!canGoNext.value) return false
    const step = currentStep.value
    if (step) completedSteps.value.add(currentStepIndex.value)
    if (isLastStep.value) return true
    currentStepIndex.value++
    // auto-skip disabled steps (unless autoSkip is explicitly false)
    while (currentStepIndex.value < steps.value.length) {
      const targetStep = steps.value[currentStepIndex.value]
      const stepEnabled = isStepEnabled(targetStep)
      // step is enabled OR doesn't have auto-skip - stop here
      if (stepEnabled || targetStep.autoSkip === false) break
      // skip this step and try the next one
      currentStepIndex.value++
    }
    if (currentStepIndex.value >= steps.value.length) currentStepIndex.value = steps.value.length - 1
    return true
  }

  const previousStep = async () => {
    await nextTick()
    if (!canGoBack.value) return false
    currentStepIndex.value--
    // auto-skip disabled steps (unless autoSkip is explicitly false)
    while (currentStepIndex.value >= 0) {
      const targetStep = steps.value[currentStepIndex.value]
      const stepEnabled = isStepEnabled(targetStep)
      // step is enabled OR doesn't have auto-skip - stop here
      if (stepEnabled || targetStep.autoSkip === false) break
      // skip this step and try the previous one
      currentStepIndex.value--
    }
    if (currentStepIndex.value < 0) currentStepIndex.value = 0
    return true
  }

  const finish = () => {
    if (!canFinish.value) return { success: false }
    isFinished.value = true
    return {
      success: true,
      completedSteps: Array.from(completedSteps.value),
    }
  }

  const reset = () => {
    currentStepIndex.value = 0
    completedSteps.value.clear()
    isFinished.value = false
  }

  const skip = () => allowSkip ? nextStep() : false

  const progress = computed(() => steps.value.length === 0 ? 0 :
    Math.round(((currentStepIndex.value + 1) / steps.value.length) * 100))

  const stepProgress = computed(() => steps.value.map((step, index) => {
    const data = step.modelValue || {}

    // analyze choices for yes/no determination
    let choiceAnalysis = null
    if (step.type === "choice" && step.choices && data.choice !== undefined) {
      const selectedChoice = step.choices.find(c => c.value === data.choice)
      const yesChoice = step.choices.find(c => c.isYes)
      const noChoice = step.choices.find(c => c.isNo)
      let answerType = null
      if (selectedChoice) {
        if (selectedChoice.isYes || (yesChoice && selectedChoice.value === yesChoice.value)) {
          answerType = "yes"
        } else if (selectedChoice.isNo || (noChoice && selectedChoice.value === noChoice.value)) {
          answerType = "no"
        } else if (!yesChoice && !noChoice) {
          // no explicit yes/no flags - default to "yes"
          answerType = "yes"
        } else {
          // has flags but this choice isn't marked - need to handle ambiguity
          answerType = step.choices.length === 2 && !selectedChoice.isYes && !selectedChoice.isNo ? "no" : "yes"
        }
      }
      choiceAnalysis = {
        selectedValue: data.choice,
        selectedChoice,
        answerType,
        hasYesFlag: !!yesChoice,
        hasNoFlag: !!noChoice,
      }
    }

    return {
      ...step,
      index,
      isCompleted: completedSteps.value.has(index),
      isCurrent: index === currentStepIndex.value,
      isAccessible: index <= currentStepIndex.value,
      isEnabled: isStepEnabled(step),
      data,
      hasData: Object.keys(data).length > 0,
      isAnswered: step.type === "choice" ? data.choice !== undefined : Object.keys(data).length > 0,
      answerType: choiceAnalysis?.answerType || null,
      choiceAnalysis,
    }
  }))

  return {
    // state
    currentStepIndex,
    currentStep,
    completedSteps,
    isFinished,
    steps,
    stepRegistry,

    // computed
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoBack,
    canFinish,
    progress,
    stepProgress,

    // methods
    goToStep,
    nextStep,
    previousStep,
    finish,
    reset,
    skip,
    isStepEnabled,
    registerStep,
    unregisterStep
  }
}
