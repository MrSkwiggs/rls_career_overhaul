<template>
  <div class="form-dialog" :style="{ maxWidth: props.maxWidth }" :bng-ui-scope="scopeName" v-bng-on-ui-nav:back,menu="handleCancelWithBack">
    <div v-if="title" class="form-dialog-toolbar">
      <div class="toolbar-title">
        {{ title }}
      </div>
    </div>
    <div :class="{ 'no-title': !title }" class="form-dialog-content">
      <div v-if="message" class="content-description">
        {{ message }}
      </div>
      <div class="content-wrapper">
        <component :is="view" v-model="formModel" />
      </div>
    </div>
    <div class="form-actions-bar">
      <BngButton
        v-for="(button, index) in buttons"
        :key="index"
        v-bng-ui-nav-focus="buttons.length - index"
        v-bng-focus-if="index === 0"
        v-bind="button.extras"
        :disabled="button.disableIfInvalid && !formValid"
        @click="onClick(button)"
        >{{ button.label }}</BngButton
      >
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { BngButton } from "@/common/components/base"
import { vBngOnUiNav, vBngUiNavFocus, vBngFocusIf } from "@/common/directives"
import { usePopupUINavScopeName } from "@/services/uiNav"
import { useUINavBlocker } from "@/services/uiNavTracker"

const navBlocker = useUINavBlocker()
navBlocker.allowOnly(["focus_u", "focus_d", "focus_l", "focus_r", "back", "menu", "ok"])

const props = defineProps({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  view: {
    type: [Object, String],
    required: true,
  },
  formValidator: {
    type: Function,
    default: formModel => true,
  },
  buttons: {
    type: Array,
    required: true,
  },
  maxWidth: {
    type: String,
    default: "40rem",
  },
})
const emit = defineEmits(["return"])
const formModel = defineModel("formModel")

const scopeName = usePopupUINavScopeName("_formdialog", props)
const handleCancelWithBack = () => {
  const cancelButton = props.buttons.find(x => x.extras && x.extras.cancel)
  if (cancelButton) onClick(cancelButton)
  else emit("return")
}

const onClick = button => {
  const data = { value: button.value }
  if (button.emitData) data.formData = formModel.value
  emit("return", data)
}

const formValid = ref(false)
const message = ref(null)

watch(
  formModel,
  () => {
    const res = props.formValidator(formModel.value)
    message.value = res.error ? res.message : props.description
    formValid.value = !res.error
  },
  { immediate: true, deep: true }
)
</script>

<style lang="scss" scoped>
$border-top: 0.5rem 0.5rem 0 0;

.form-dialog {
  display: flex;
  flex-direction: column;
  color: white;
  max-width: 40rem;

  > .form-dialog-toolbar {
    background: #333;
    padding: 0.5rem;
    overflow: hidden;
    border-radius: $border-top;

    > .toolbar-title {
      padding: 0 0.5rem;
      font-size: 1.2em;
    }
  }

  > .form-dialog-content {
    padding: 1rem;
    background-color: #252525;
    overflow: hidden;

    &.no-title {
      border-radius: $border-top;
    }

    > .content-description {
      padding: 1rem;
      border-radius: 0.125rem;
      font-size: 0.9rem;
      background: rgba(0, 0, 0, 0.4);
    }

    > .content-wrapper {
      padding-top: 0.5rem;
    }
  }

  > .form-actions-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0.5rem;
    background-color: #252525;
    border-radius: 0 0 var(--bng-corners-2) var(--bng-corners-2);
  }
}
</style>
