<template>
  <div class="list-vehicle-dialog">
    <div class="vehicle-info">
      <div class="name">{{ formModel.vehicleName }}</div>
      <div class="meta" v-if="formModelText">
        {{ formModelText }} — Market Value: {{ units.beamBucks(formModel.marketValue || 0) }}
      </div>
      <div class="meta" v-else>
        Market Value: {{ units.beamBucks(formModel.marketValue || 0) }}
      </div>
    </div>

    <div class="price-box">
      <div class="price-content">
        <div class="label">Your Asking Price</div>
        <div class="price-row">
          <div class="step-buttons-group">
            <BngButton class="step step-large" :accent="ACCENTS.secondary" @click="adjustPrice(-5000)">-5000</BngButton>
            <BngButton class="step step-medium" :accent="ACCENTS.secondary" @click="adjustPrice(-500)">-500</BngButton>
            <BngButton class="step" :accent="ACCENTS.secondary" @click="adjustPrice(-50)">-50</BngButton>
          </div>
          <div class="price">{{ units.beamBucks(formModel.price || 0) }}</div>
          <div class="step-buttons-group">
            <BngButton class="step" :accent="ACCENTS.secondary" @click="adjustPrice(50)">+50</BngButton>
            <BngButton class="step step-medium" :accent="ACCENTS.secondary" @click="adjustPrice(500)">+500</BngButton>
            <BngButton class="step step-large" :accent="ACCENTS.secondary" @click="adjustPrice(5000)">+5000</BngButton>
          </div>
        </div>
        <div class="hint" :class="[priceHint.class]">{{ priceHint.text }}</div>
        <div class="offer-hint" :class="[offerHint.class]">{{ offerHint.text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { BngButton, ACCENTS } from "@/common/components/base"
import { useBridge } from "@/bridge"

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})
const emit = defineEmits(["update:modelValue"])

const { units } = useBridge()

const formModel = computed({
  get: () => props.modelValue,
  set: newValue => emit("update:modelValue", newValue),
})

function adjustPrice(amount) {
  const price = Math.max(0, Math.round(((formModel.value.price || 0) + amount) / 50) * 50)
  emit("update:modelValue", { ...formModel.value, price })
}

const priceHint = computed(() => {
  const mv = Number(formModel.value.marketValue || 0)
  const p = Number(formModel.value.price || 0)
  if (!mv || !p) return { text: "", class: "" }
  const diff = (p - mv) / mv
  const percent = Math.round(Math.abs(diff) * 100)
  if (percent < 1) return { text: "Fair market value", class: "ok" }
  if (diff > 0) return { text: `${percent}% above market value`, class: "high" }
  return { text: `${percent}% below market value`, class: "low" }
})

const offerHint = computed(() => {
  const mv = Number(formModel.value.marketValue || 0)
  const p = Number(formModel.value.price || 0)
  if (!mv || !p) return { text: "Regular offers expected", class: "regular" }
  const ratio = p / mv
  if (ratio <= 0.90) return { text: "More offers expected", class: "more" }
  if (ratio >= 1.20) return { text: "Fewer offers expected", class: "fewer" }
  return { text: "Regular offers expected", class: "regular" }
})

const formModelText = computed(() => {
  if (!formModel.value.odometerKm) return ""
  return new Intl.NumberFormat().format(Math.round(formModel.value.odometerKm)) + " km"
})
</script>

<style scoped lang="scss">
.list-vehicle-dialog {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 50rem;
  max-width: 100%;
}

.vehicle-info {
  padding: 1rem;
  background: #131922;
  border-radius: var(--bng-corners-2);
  .name {
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }
  .meta {
    opacity: 0.8;
  }
}

.price-box {
  padding: 1.25rem;
  background: #0f1520;
  border-radius: var(--bng-corners-2);

  .price-content {
    text-align: center;
    .label {
      opacity: 0.85;
      margin-bottom: 0.5rem;
    }
    .price-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .price {
      font-size: 2.6rem;
      font-weight: 800;
      line-height: 1.1;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .hint {
      margin-top: 0.5rem;
      &.ok { color: #29c15a; }
      &.low { color: #7fb6ff; }
      &.high { color: #ffad66; }
    }
    .offer-hint {
      margin-top: 0.25rem;
      font-size: 0.9rem;
      opacity: 0.75;
      &.more { color: #29c15a; }
      &.regular { color: #7fb6ff; }
      &.fewer { color: #ffad66; }
    }
    .step-buttons-group {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.38rem;
      --bng-button-min-width: 5rem;
      --bng-button-max-width: 5rem;
    }
    .step {
      height: 2.5rem;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      &.step-medium {
        --bng-button-min-width: 4.5rem;
        --bng-button-max-width: 4.5rem;
      }
      &.step-large {
        --bng-button-min-width: 5.5rem;
        --bng-button-max-width: 5.5rem;
      }
    }
  }
}
</style>


