<template>
  <BngCard class="cart" :class="{ expanded }">
    <BngCardHeading>
      Shopping Cart
    </BngCardHeading>
    <BngButton
      class="cart-expand"
      :accent="ACCENTS.outlined"
      :icon="expanded ? icons.arrowLargeDown : icons.arrowLargeUp"
      @click="expanded = !expanded" />
    <div class="cart-main">
      <div class="cart-row cart-header">
        <div></div>
        <div>Part</div>
        <div>Price</div>
      </div>
      <div class="cart-list" bng-nav-scroll>
        <div v-if="cartData" v-for="item in cartData.items" class="cart-row" :class="item.type ? [`type-${item.type}`] : null">
          <div>
            <BngButton
              v-if="item.removeShow"
              accent="attention"
              :icon="icons.abandon"
              :disabled="item.removeDisabled"
              @click="item.remove()" />
          </div>
          <div :style="{ paddingLeft: item.level ? `${item.level - 1}em` : undefined }">
            {{ item.name }}
            <div v-if="item.extraInfo" class="extra-info-text">
              {{ item.extraInfo }}
            </div>
          </div>
          <div v-if="!item.priceHide">
            {{ units.beamBucks(item.price) }}
          </div>
          <div v-else></div>
        </div>
        <div class="cart-row cart-subtotal">
          <div></div>
          <div>Subtotal</div>
          <div>{{ units.beamBucks(subtotal) }}</div>
        </div>
        <div class="cart-row cart-tax">
          <div></div>
          <div>Sales Tax (7%)</div>
          <div>{{ units.beamBucks(salesTax) }}</div>
        </div>
      </div>
      <div class="cart-row cart-total">
        <div></div>
        <div>Total</div>
        <!-- <div>{{ units.beamBucks(cartData.total) }}</div> -->
        <div><BngUnit :money="cartData ? cartData.total : 0" /></div>
      </div>
    </div>
    <template #buttons>
      <!-- <div class="total-price">
        <span>Total</span>
        <BngUnit :money="cartData ? cartData.total : 0" />
      </div> -->
      <BngButton
        show-hold
        :disabled="
          !apply ||
          !cartData ||
          cartData.items.length === 0 ||
          cartData.total > 0 &&cartData.total > playerMoney
        "
        v-bng-on-ui-nav:ok.asMouse.focusRequired
        v-bng-click="{
          holdCallback: apply,
          holdDelay: 1000,
          repeatInterval: 0,
        }">
        {{ confirmButtonText || "Purchase" }}
      </BngButton>
      <BngButton
        :disabled="!cancel"
        @click="props.cancel()"
        :accent="ACCENTS.secondary">
        Cancel
      </BngButton>
    </template>
  </BngCard>
</template>

<script setup>
import { ref, computed } from "vue"
import { useBridge } from "@/bridge"
import { BngButton, ACCENTS, BngCard, BngCardHeading, BngUnit, icons } from "@/common/components/base"
import { openConfirmation } from "@/services/popup"
import { $translate } from "@/services/translation"
import { vBngClick, vBngOnUiNav } from "@/common/directives"

/** Item of the cart
 * @typedef {object} CartItem
 * @prop {string} [type] Will be added as a class name `type-%type%`
 * @prop {number} [level] Will be used to visualise the nesting level
 * @prop {string} name Name of the item
 * @prop {number} [price] Price of the item
 * @prop {boolean} [priceHide] Hides the price
 * @prop {boolean} [removeShow] Shows the remove button
 * @prop {boolean} [removeDisabled] Disables the remove button
 * @prop {function} [remove] Function to call on remove button
 */

/** Cart data object
 * @typedef {object} CartData
 * @prop {number} total Total price
 * @prop {number} taxes Total taxes
 * @prop {array<CartItem>} items List of items in cart
 */

const props = defineProps({
  /** @type CartData */
  cartData: Object,
  playerMoney: Number,
  apply: Function,
  cancel: Function,
  confirmButtonText: String,
})

const { units } = useBridge()

const expanded = ref(false)

const subtotal = computed(() =>
  props.cartData && props.cartData.total && props.cartData.taxes
    ? props.cartData.total - props.cartData.taxes
    : 0
)

const salesTax = computed(() => props.cartData && props.cartData.taxes ? props.cartData.taxes : 0)
</script>

<style scoped lang="scss">
.cart {
  align-self: flex-start;
  width: 100%;
  flex: 1 0 auto;
  height: 27em;
  color: white;
  background-color: #000e;
  & :deep(.card-cnt) {
    background-color: transparent;
  }
  &.expanded {
    height: auto;
    min-height: 27em;
    max-height: 100%;
  }
}

.cart-expand {
  position: absolute;
  top: 0.2em;
  right: 0.2em;
}

.cart-main {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 100%;
  overflow: hidden;

  .cart-row {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: stretch;
    $size: 3rem;
    flex: 0 0 $size;
    height: $size;
    overflow: hidden;
    > * {
      flex: 1 0 auto;
      &:first-child { // button
        $size: 4rem;
        flex: 0 0 $size;
        width: $size;
        font-size: 1rem !important;
        text-align: center;
      }
      &:last-child { // price
        $size: 8rem;
        flex: 0 0 $size;
        width: $size;
        padding-right: 1.5rem;
        text-align: right;
      }
    }
  }

  .cart-header {
    $size: 2rem;
    flex: 0 0 $size;
    align-items: flex-start;
    height: $size;
    font-size: 1.1em;
    font-weight: 600;
    border-bottom: 1px solid #aaa8;
  }

  .cart-total {
    flex: 0 0 auto;
    font-size: 1.3em;
    font-weight: 600;
    border-top: 1px solid #aaa8;
    > * {
      &:last-child { // price
        $size: 9rem;
        flex: 0 0 $size;
        width: $size;
        :deep(.info-item) { // BngUnit
          padding: 0;
        }
      }
    }
  }
}

.extra-info-text {
  font-size: 0.9em;
  font-weight: normal;
  color: rgba(255, 255, 255, 0.8);
}

.cart-list {
  display: flex;
  flex-direction: column;
  overflow: auto scroll;
  flex: 1 1 auto;
  min-height: 0;
  .cart-row > *:last-child { // price
    padding-right: calc(1.5rem - 6px); // compensate for scrollbar
  }
  .cart-subtotal,
  .cart-tax {
    $size: 2.3rem;
    flex: 0 0 $size;
    height: $size;
    font-weight: 600;
  }
  .cart-subtotal {
    align-items: flex-end;
    border-top: 1px solid #aaa4;
  }
  .cart-tax {
    padding-bottom: 0.3rem;
    font-weight: 600;
  }
}

.cart-row {
  &.type-category {
    font-size: 1.2rem;
    font-weight: 600;
  }
  &.type-subCategory {
    font-size: 1.1rem;
    font-weight: 600;
  }
  &.type-item {
    font-size: 1rem;
  }
}
</style>
