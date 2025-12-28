<!-- DynamicComponent - for generating components on-the-fly with passed template -->
<template>
  <component v-if="template && makeComponent" :is="makeComponent"/>
</template>

<script setup>
import { defineComponent, useAttrs, computed } from "vue"
import * as COMPONENTS from "@/common/components/base"
import * as UTILITIES from "@/common/components/utility"
import { $content, $translate } from "@/services"

const ALL_COMPONENTS = Object.fromEntries(
  Object.entries({ ...COMPONENTS, ...UTILITIES })
    .filter(([name]) => name !== "DEMOS")
)

const attrs = useAttrs()

const props = defineProps({
  template: String,
  translateId: String,
  translateContext: Boolean,
  bbcode: Boolean,
  useComponents: {
    type: Boolean,
    default: true
  },
  extraComponents: {
    type: Object,
    default: () => ({})
  }
})

const template = computed(() => {
  let res = props.template
  if (props.translateId) {
    if (props.translateContext) {
      res = $translate.contextTranslate(props.translateId, true)
    } else {
      res = $translate.instant(props.translateId)
    }
  }
  if (res && props.bbcode) res = $content.bbcode.parse(res)
  return res || ""
})

const makeComponent = computed(() => {
  const component = defineComponent({
    template: template.value,
    components: {
      ...(props.useComponents && ALL_COMPONENTS),
      ...props.extraComponents,
    },
    data() {
      return attrs
    },
  })
  return component
})
</script>
