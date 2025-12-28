<!-- bngUnit - for displaying game units in a standard way -->
<template>
  <SlotSwitcher v-bind="attrs" :slotId="unit.type">
    <!-- main currencies -->
    <template #money="props">
      <BngPropVal v-bind="{ ...props, ...unit }" :iconType="props.iconType || icons.beamCurrency" :valueLabel="formattedValue" />
    </template>

    <template #beamXP="props">
      <BngPropVal v-bind="{ ...props, ...unit }" :iconType="props.iconType || icons.beamXPLo" :valueLabel="formattedValue" />
    </template>

    <template #stars="props">
      <BngPropVal v-bind="{ ...props, ...unit }" :iconType="props.iconType || icons.star" :valueLabel="formattedValue" :icon-color="defaultColors.stars" />
    </template>

    <template #vouchers="props">
      <BngPropVal
        v-bind="{ ...props, ...unit }"
        :iconType="props.iconType || icons.voucherHorizontal3"
        :valueLabel="formattedValue"
        :icon-color="defaultColors.vouchers" />
    </template>

    <template #insuranceScore="props">
      <BngPropVal
        v-bind="{ ...props, ...unit }"
        :iconType="props.iconType || icons.shieldCheckmarkProgressbar"
        :valueLabel="formattedValue" />
    </template>

    <template #multiplier="props">
      <BngPropVal
        v-bind="{ ...props, ...unit }"
        :iconType="props.iconType || icons.mathMultiply"
        :valueLabel="formattedValue"
        :icon-color="defaultColors.multiplier" />
    </template>

    <!-- unkown unit -->
    <template #unknown="props">
      <span v-bind="props">BngUnit: Unknown unit type or no type specified</span>
    </template>
  </SlotSwitcher>
</template>

<script>
import { icons } from "@/common/components/base"
const toInt = v => ~~+v
</script>

<script setup>
import { computed, useAttrs } from "vue"
import { BngPropVal } from "@/common/components/base"
import { SlotSwitcher } from "@/common/components/utility"
import { useBridge } from "@/bridge"

const { units } = useBridge()

const knownUnits = {
  // main currencies
  money: { formatter: v => units.beamBucks(v) },
  beamXP: { formatter: toInt },
  stars: { formatter: toInt },
  vouchers: { formatter: toInt },
  insuranceScore: { formatter: toInt },
  multiplier: { formatter: toInt, noGap: true },
}

const defaultColors = {
  stars: "var(--bng-ter-yellow-200)", //"#dac434",
  vouchers: "var(--bng-add-blue-400)", //"#5f9df9"
}


// TODO: Remove the useAttrs and inner garbage and make everything properly with props T_T
const attrs = useAttrs(),
  unit = computed(() => {
    for (const key of Object.keys(attrs)) if (key in knownUnits) return { type: key, value: attrs[key], ...knownUnits[key], ...props.options }
    return { type: "unknown" }
  }),
  formattedValue = computed(() => {
    if (props.formatter) {
      if (typeof props.formatter === "function") {
        return props.formatter(unit.value.value)
      }
      if (typeof props.formatter === "string" && props.formatter in knownUnits) {
        return knownUnits[props.formatter].formatter(unit.value.value)
      }
    }
    return typeof unit.value.formatter === "function" ? unit.value.formatter(unit.value.value) : unit.value.value
  }),
  props = defineProps({ options: Object, formatter: [Function, String] })
</script>
