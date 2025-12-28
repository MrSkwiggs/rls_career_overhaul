<template>
  <div class="insurance-perk-notice">
    <InsurancePerkIcon :perkIconData="{ iconOnly: true }" />
    {{ props.perkText }}
  </div>
</template>

<script setup>

import InsurancePerkIcon from "@/modules/career/components/insurance/insurancePerkIcon.vue"


const props = defineProps({
  perkText: {
    type: String,
    required: true,
  },
})
</script>

<style scoped lang="scss">

.insurance-perk-notice {
  font-weight: 600;

  position: absolute;
  top: 50%;
  right: 0;
  transform: translateX(calc(105% + 40px)) translateY(-50%);
  transform-origin: right center;
  z-index: 1000;

  background: linear-gradient(135deg, var(--bng-add-green-700) 0%, var(--bng-add-green-900) 100%);
  border: 2px solid var(--bng-add-green-500);
  border-radius: var(--bng-corners-2);
  padding: 6px 12px;

  font-size: 1em;
  font-weight: 600;
  color: white;
  white-space: nowrap;

  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  pointer-events: none;

  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 12px;
    height: 12px;
    border-left: 3px solid var(--bng-add-green-500);
    border-bottom: 3px solid var(--bng-add-green-500);
    transform: translateX(-100%) translateY(-50%) rotate(45deg);
  }
}

</style>