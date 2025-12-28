<template>
  <ComputerWrapper :path="['Tuning']" title="Tuning" back @back="confirmCancel">
    <BngCard class="tuningCard" ref="elCard" v-bng-blur="1">
      <Tuning :button-target="elCard && elCard.buttonsContainer" :close-button="false" />
      <template #buttons></template>
    </BngCard>

    <template #side>
      <ShoppingCart
        :cart-data="cartData"
        :player-money="tuningStore.shoppingData.playerMoney"
        :confirm-button-text="'Confirm'"
        :apply="applyShopping"
        :cancel="confirmCancel" />
    </template>
  </ComputerWrapper>
</template>

<script setup>
import { ref, computed } from "vue"
import { BngCard, ACCENTS } from "@/common/components/base"
import ComputerWrapper from "./ComputerWrapper.vue"
import Tuning from "@/modules/vehicleConfig/components/Tuning.vue"
import ShoppingCart from "../components/ShoppingCart.vue"
import { useTuningStore } from "@/modules/vehicleConfig/stores/tuningStore"
import { lua } from "@/bridge"
import { useComputerStore } from "../stores/computerStore"
import { $translate } from "@/services/translation"
import { openConfirmation } from "@/services/popup"
import { vBngBlur } from "@/common/directives"
const computerStore = useComputerStore()

const tuningStore = useTuningStore()

const CANCEL_MESSAGE = "Are you sure you want to cancel?<br />All changes to your vehicle will be reversed"
const CONFIRM_BUTTONS = [
  { label: $translate.instant("ui.common.yes"), value: true },
  { label: $translate.instant("ui.common.no"), value: false, extras: { accent: ACCENTS.secondary } },
]

const confirmCancel = async () => {
  if (!(tuningStore.shoppingData.shoppingCart && tuningStore.shoppingData.shoppingCart.items.length) || await openConfirmation(null, CANCEL_MESSAGE, CONFIRM_BUTTONS)) {
    cancelShopping()
  }
}

const cartData = computed(() => {
  const cart = tuningStore.shoppingData ? tuningStore.shoppingData.shoppingCart : null
  const res = { total: 0, taxes: 0, items: [] }
  if (cart) {
    res.total = cart.total
    res.taxes = cart.taxes
    if (Array.isArray(cart.items)) {
      res.items = cart.items.map(item => ({
        type: item.type || (item.level === 1 && "item"),
        level: item.level,
        name: item.title,
        price: item.price,
        priceHide: !item.price,
        removeShow: !!item.varName,
        remove: () => lua.career_modules_tuning.removeVarFromShoppingCart(item.varName),
      }))
    }
  }
  return res
})

const elCard = ref()

const applyShopping = () => lua.career_modules_tuning.applyShopping()
const cancelShopping = () => lua.career_modules_tuning.cancelShopping()
</script>

<style scoped lang="scss">
.tuningCard {
  overflow: hidden;
  width: 40%;
  height: 100%;
  background-color: var(--bng-black-8);
  & :deep(.card-cnt) {
    background-color: rgba(0, 0, 0, 0);
  }
}
:deep(.tuning-static) {
  padding-left: 0.5em;
}
</style>
