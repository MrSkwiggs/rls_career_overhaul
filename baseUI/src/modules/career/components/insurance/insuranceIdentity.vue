<template>
  <div class="insurance-identity" :class="{ 'no-insurance': !hasInsurance }">
    <div v-if="svgContent" class="insurance-icon" v-html="svgContent"></div>

    <BngImage
      v-else-if="props.insuranceData.image"
      class="insurance-icon"
      :src="`/${props.insuranceData.image}`"
      :alt="props.insuranceData.name"
    />

    <div v-else class="insurance-icon">
      <div class="insurance-name">
        <BngIcon class="insurance-no-icon" :type="icons.danger" />
        {{ hasNoInsurance ? $t("ui.career.insurance.noInsurance") : props.insuranceData.name }}
      </div>
    </div>

    <div v-if="!hasNoInsurance" class="insurance-slogan">
      "{{ props.insuranceData.slogan }}"
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue"
import { BngImage, BngIcon, icons } from "@/common/components/base"
import { getURL, getFile } from "@/utils"

const props = defineProps({
  insuranceData: {
    type: Object,
    required: true,
  },
})

const hasInsurance = computed(() => svgContent.value || props.insuranceData.image)

const hasNoInsurance = computed(() => props.insuranceData?.id === -1)

const svgContent = ref(null)

watch(
  () => props.insuranceData.image,
  async newPath => {
    if (newPath && newPath.endsWith(".svg")) {
      try {
        const rawSvg = await getFile(`/${newPath}`)
        if (rawSvg) {
          // Basic sanitization: remove script tags and event handlers
          svgContent.value = rawSvg
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
            .replace(/ on\w+="[^"]*"/g, "")
        } else {
          svgContent.value = null
        }
      } catch (e) {
        console.warn("Failed to load SVG inline:", newPath, e)
        svgContent.value = null
      }
    } else {
      svgContent.value = null
    }
  },
  { immediate: true }
)
</script>

<style lang="scss">
@import "insuranceStyle.css";
</style>

<style scoped lang="scss">

.insurance-name-icon-wrapper {
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
  align-items: center;
}


.insurance-identity {
  align-self: center;
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  min-width: 90%;
  height: 8rem;
  margin-top: 0.5em;
  // padding: 0 2em;

  overflow: hidden;
  &.no-insurance {
    background-color: transparent;
    border-color: transparent;
  }
  .insurance-icon {
    height: 5rem;
    flex: 1 1 auto;
    width: 100%;
    object-fit: contain;
    :deep(svg) {
      width: 100%;
      height: 100%;
    }
    .insurance-name {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1.8rem;
      font-weight: 600;
      text-align: center;
      width: 100%;
      height: 100%;
      word-wrap: break-word;
    }
    .insurance-no-icon {
      margin-right: 0.15em;
    }
  }
  .insurance-slogan {
    flex: 0 0 auto;
    color: var(--bng-cool-gray-300);
    font-style: italic;
    text-align: center;
    padding: 0.5em 0 0.25em 0;
  }
}

</style>
