// 🧙‍♀️✨whoosh! you're unicycle now!

export { default as WizardView } from "./views/WizardView.vue"
export { default as Wizard } from "./views/Wizard.vue"
export { default as WizardStep } from "./components/WizardStep.vue"
export { default as WizardSummary } from "./components/WizardSummary.vue"

export { useWizard } from "./wizard.js"

export const STEP_TYPES = {
  choice: "choice",
  form: "form",
  confirmation: "confirmation",
  custom: "custom",
}
