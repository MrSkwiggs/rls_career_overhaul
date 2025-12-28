<template>
  <div class="insurance-perks-container">
    <div
    v-for="perk in sortedPerks"
    :key="perk.id"
    class="insurance-perk"
    :class="{highlighted: perk.isSignaturePerk, 'no-insurance': insuranceData.id === -1}"
    >
      <div class="left">
        <div class="insurance-perk-icon-wrapper">
          <InsurancePerkIcon v-if="insuranceData.id !== -1" :perkIconData="{ iconOnly: true, isSignaturePerk: perk.isSignaturePerk && perk.isSignaturePerk || false }"/>
          <span v-else>-</span>
        </div>
        <div class="insurance-perk-texts">
          <div class="insurance-perk-intro">
            {{ perk.intro }}
          </div>
          <div v-if="!noDescription" class="insurance-perk-description">
            {{ perk.description }}
          </div>
        </div>
      </div>
      <div v-if="perk.isSignaturePerk" class="signature-perk-wrapper">
        <div class="signature-perk">
          SIGNATURE PERK
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"
import InsurancePerkIcon from "@/modules/career/components/insurance/insurancePerkIcon.vue"

const props = defineProps({
  insuranceData: Object,
  noDescription: Boolean,
})

const sortedPerks = computed(() => {
  if (!props.insuranceData.perks) return []

  // convert perks object to array and sort by signature perk
  const perksArray = Array.isArray(props.insuranceData.perks)
    ? props.insuranceData.perks
    : Object.values(props.insuranceData.perks)

  return [...perksArray].sort((a, b) => Number(b.isSignaturePerk || false) - Number(a.isSignaturePerk || false))
})

</script>

<style lang="scss">
@import '@/../../../ui/ui-vue/src/modules/career/components/insurance/insuranceStyle.css';
</style>

<style scoped lang="scss">

.insurance-perks-container {
  text-align: left;
  align-self: flex-start;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.insurance-perk-icon-wrapper {
  font-size: 1.1rem;
  height: fit-content;
}

.signature-perk-wrapper {
  position: absolute;
  right: 0.6125rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.signature-perk{
  background-color: var(--green-400);
  border-radius: var(--bng-corners-1);
  padding: 0.3rem 0.5rem 0.08rem 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.left {
  display: flex;
  flex-direction: row;
  gap: 0.3125rem;
  align-items: center;
}

.insurance-perk {
  position: relative;
  padding: 0.3125rem 0.3125rem;
  background-color: var(--blue-400);
  border-radius: var(--bng-corners-2);
  border: 1px solid var(--blue-300);

  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  &.highlighted {
    background-color: var(--bng-add-green-800);
    border: 1px solid var(--bng-add-green-400);
    border-left: 0.4rem solid var(--bng-add-green-400);
  }

  &.no-insurance {
    background-color: var(--bng-add-red-900);
    border: 1px solid var(--bng-add-red-600);
    border-left: 0.4rem solid var(--bng-add-red-600);
    opacity: 0.8;
  }
}

.insurance-perk-texts {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  padding: 0.325rem 0;
}

.insurance-perk-intro {
  font-size: 1.1rem;
  font-weight: 600;
}

.insurance-perk-description {
  opacity: 0.8;
  font-size: 0.9rem;
}

</style>