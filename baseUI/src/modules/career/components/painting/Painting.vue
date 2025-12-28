<template>
  <div class="paintingWrapper">
    <BngCard class="paintingPage" v-bng-blur="1">
      <div style="overflow: auto;">
        <BngCardHeading v-if="!noHeader"> Painting </BngCardHeading>
        <Tabs class="bng-tabs" :selected-index="0" :make-tab-header-classes="headerClass" :style="headerVars" @change="changedPaintIndexTab">
          <Tabs
            v-for="(paint, idx) in paints" :key="idx"
            :tab-heading="$t('ui.trackBuilder.matEditor.paint') + ' ' + (idx + 1)"
            class="bng-tabs"
            :selected-index="0" @change="changedTopLevelPaintClassTab"
          >
            <div
              v-for="(paintClassTab, idx) in paintClassTabInfo" :key="idx"
              :tab-heading="paintClassTab.title"
              style="margin: 0.3em; background-color: #00000000;"
            >
              <BngButton
                v-for="(paintClass, idx) in paintClassTab.paintClasses" :key="idx"
                @click="changedPaintClassTab(paintClass.id)"
                :accent="colorClass != paintClass.id ? ACCENTS.secondary : undefined"
                class="paint-class-button">
                {{ paintClass.title }}
              </BngButton>
            </div>
          </Tabs>
        </Tabs>

        <BngCard>
          <div class="paintPicker">
            <PaintPicker
              ref="paintPicker"
              v-model="paints[paintIndex]"
              :show-main="showPickerMain()"
              :presets="getPickerShowPresets() ? presets : undefined"
              :presets-editable="getPickerPresetsEditable()"
              :advanced-open="false"
              :show-advanced-switch="false"
              @change="onChange" />

            <div v-if="showClearCoatOption()" class="clearCoatSection">
              <BngSwitch v-model="clearCoatActive" @valueChanged="clearCoatUpdateCallback">
                Add Clear Coat (Baseprice: {{ units.beamBucks(prices.clearcoatBase.money.amount) }})
              </BngSwitch>
              <BngColorSlider style="margin-top: 0.7em;" v-if="clearCoatActive" v-model="clearCoatPolish" @change="changeClearCoatPolish"> Clear Coat Polish </BngColorSlider>
            </div>
          </div>
        </BngCard>
      </div>

    </BngCard>

    <BngCard class="shoppingCart">
      <BngCardHeading>Shopping Cart</BngCardHeading>
      <div v-if="changedPaint" class="innerShoppingCart">
        <table class="shoppingCartTable">
          <thead>
            <tr>
              <th></th>
              <th class="article">Option</th>
              <th class="price">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(date, idx) in getShoppingCartTable()">
              <th><BngButton v-if="date.topLevel" @click="resetPaint(date.index)">remove</BngButton></th>
              <th :class="date.topLevel ? 'article' : 'article--subLevel'">{{ date.name }}</th>
              <th class="price">{{ units.beamBucks(date.price) }}</th>
            </tr>
            <tr>
              <th></th>
              <th class="article--total">Total</th>
              <th class="price--total">{{ units.beamBucks(totalPrice) }}</th>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="purchase-button-container">
        <BngButton
          class="purchase-button"
          :disabled="!canPay || !changedPaint"
          show-hold
          v-bng-on-ui-nav:ok.asMouse.focusRequired
          v-bng-click="{
            holdCallback: () => apply(),
            holdDelay: 1000,
            repeatInterval: 0,
          }">
          Purchase and Apply
        </BngButton>
      </div>

    </BngCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { lua, useBridge } from "@/bridge"
import { Tabs, Tab } from "@/common/components/utility"
import { BngCardHeading, BngButton, ACCENTS, BngUnit, BngCard, BngColorSlider, BngSwitch } from "@/common/components/base"
import { vBngOnUiNav, vBngClick, vBngBlur } from "@/common/directives"

defineProps({
  noHeader: Boolean,
})

import PaintPicker from "@/modules/vehicleConfig/components/PaintPicker.vue"
import Paint from "@/utils/paint"

const { units, events } = useBridge()

const presets = ref({})
lua.career_modules_painting.getFactoryPaint().then(data => (presets.value = data))

const colorClass = ref("factory")
const paintIndex = ref(0)
const chosenPackage = ref([{}, {}, {}])
const changedPaint = ref(false)
const totalPrice = ref(0)

const clearCoatActive = ref(false)
const clearCoatPolish = ref(0)

const paints = ref([])
const originalPaints = ref([])
const prices = ref({})
const colorClassData = ref({})
const canPay = ref(false)
const paintPicker = ref(null)

const paintClassTabInfo = [
  {
    title: "Factory",
  },
  {
    title: "Gloss",
    paintClasses: [
      { id: "matte", title: "Matte" },
      { id: "semiGloss", title: "Semi Gloss" },
      { id: "gloss", title: "Full Gloss" },
    ],
  },
  {
    title: "Metallic",
    paintClasses: [
      { id: "semiMetallic", title: "Semi Metallic" },
      { id: "metallic", title: "Metallic" },
      { id: "chrome", title: "Chrome" },
    ],
  },
  {
    title: "Custom",
  },
]

// i tried to use a watcher instead of a valueChanged callback, but that broke the painting menu for some reason (it makes the paint picker apply color changes to all 3 vehicle paints)
const clearCoatUpdateCallback = newValue => {
  clearCoatPolish.value = 0
  changeClearCoatPolish(0)
  enableClearCoat(newValue)
}

const enableClearCoat = enabled => {
  paints.value[paintIndex.value]._clearcoat = enabled ? 1 : 0
  paintPicker.value.paintUpdated()
}

const changeClearCoatPolish = value => {
  paints.value[paintIndex.value]._clearcoatRoughness = -0.13 * value + 0.13
  paintPicker.value.paintUpdated()
}

const getShoppingCartTable = () => {
  let res = []

  for (const [index, paintOptions] of chosenPackage.value.entries()) {
    if (!Object.keys(paintOptions).length) continue

    res.push({
      name: "Paint " + (index + 1) + ": " + getNicePaintClassName(paintOptions.paintClass),
      price: prices.value.basePrices[paintOptions.paintClass].money.amount,
      topLevel: true,
      index,
    })

    if (paintOptions.clearCoat) {
      res.push({
        name: "Clearcoat",
        price: prices.value.clearcoatBase.money.amount,
      })
      res.push({
        name: "Extra Clearcoat Polish",
        price: prices.value.clearcoatPolishFactor.money.amount * paintOptions.clearCoatPolish,
      })
    }
  }

  return res
}

const setPaintingShoppingCartData = data => {
  canPay.value = data.canPay
  totalPrice.value = data.totalPrice.money.amount
}
events.on("sendPaintingShoppingCartData", setPaintingShoppingCartData)

lua.career_modules_painting.getPaintData().then(data => {
  prices.value = data.prices
  if (!data || !Array.isArray(data.colors)) {
    paints.value = []
    return
  }
  paints.value = data.colors.map(val => new Paint({ paint: val }))
  originalPaints.value = data.colors.map(val => new Paint({ paint: val }))
  colorClassData.value = data.colorClassData
})

const getPickerShowPresets = () => colorClass.value == "factory"

const getPickerPresetsEditable = () => colorClass.value == "custom"

const showPickerMain = () => colorClass.value != "factory"

const showClearCoatOption = () => colorClass.value != "factory" && colorClass.value != "custom"

const setCurrentColorClass = () => {
  paintPicker.value.setAdvancedVisible(false)
  paints.value[paintIndex.value]._metallic = colorClassData.value[colorClass.value].metallic
  paints.value[paintIndex.value]._roughness = colorClassData.value[colorClass.value].roughness
  clearCoatActive.value = false
  enableClearCoat(false)
}

const changedPaintIndexTab = tab => {
  paintIndex.value = tab.index
  colorClass.value = chosenPackage.value[paintIndex.value].paintClass || "factory"
  paintPicker.value.setAdvancedVisible(colorClass.value == "custom")
  clearCoatActive.value = chosenPackage.value[paintIndex.value].clearCoat
  clearCoatPolish.value = chosenPackage.value[paintIndex.value].clearCoatPolish
}

const changedTopLevelPaintClassTab = tab => {
  const classTab = {
    Factory: "factory",
    Custom: "custom",
    Gloss: "semiGloss",
    Metallic: "metallic",
  }[tab.heading]
  classTab && changedPaintClassTab(classTab)
}

const changedPaintClassTab = paintClass => {
  if (paintClass == "factory") {
    colorClass.value = "factory"
    return
  }
  if (paintClass == "custom") {
    colorClass.value = "custom"
    paintPicker.value.setAdvancedVisible(true)
    clearCoatActive.value = false
    return
  }

  colorClass.value = paintClass
  setCurrentColorClass()
}

function resetPaint(index) {
  chosenPackage.value[index] = {}

  // Copy the original paint
  Object.assign(paints.value[index], originalPaints.value[index])

  let chosenPackageEmpty = true
  for (const [index, color] of Object.entries(chosenPackage.value)) {
    if (Object.keys(color).length !== 0) {
      chosenPackageEmpty = false
    }
  }
  if (chosenPackageEmpty) {
    changedPaint.value = false
  }

  lua.career_modules_painting.setPaints(
    paints.value.map(paint => paint.paintObject),
    chosenPackage.value
  )
}

function onChange() {
  if (colorClass.value == "factory") {
    clearCoatActive.value = false
  }
  chosenPackage.value[paintIndex.value].paintClass = colorClass.value
  chosenPackage.value[paintIndex.value].clearCoat = clearCoatActive.value
  chosenPackage.value[paintIndex.value].clearCoatPolish = clearCoatPolish.value

  changedPaint.value = true

  lua.career_modules_painting.setPaints(
    paints.value.map(paint => paint.paintObject),
    chosenPackage.value
  )
}

const NICE_PAINT_CLASS_NAMES = {
  factory: "Factory",
  semiGloss: "Semi Gloss",
  gloss: "Gloss",
  semiMetallic: "Semi Metallic",
  metallic: "Metallic",
  matte: "Matte",
  chrome: "Chrome",
  custom: "Custom",
}
const getNicePaintClassName = paintClass => {
  return NICE_PAINT_CLASS_NAMES[paintClass]
}

function headerClass(tab) {
  return {
    "painting-tab": true,
    [`painting-tab-${tab.index}`]: true,
  }
}
const headerVars = computed(() =>
  paints.value.reduce(
    (res, paint, idx) => ({
      ...res,
      [`--painting-dot-${idx}`]: `hsl(${Paint.hslCssStr(paint.hsl)})`,
    }),
    {}
  )
)

const apply = () => lua.career_modules_painting.apply()
const close = () => lua.career_modules_painting.close()

const start = () => {
  lua.career_modules_painting.onUIOpened()
}

onMounted(start)
onUnmounted(close)

defineExpose({
  apply,
  close,
})
</script>

<style scoped lang="scss">
.paintingPage {
  color: white;
  width: 50%;
  height: 100%;
  background-color: var(--bng-black-8);
  & :deep(.card-cnt) {
    background-color: rgba(0, 0, 0, 0);
  }
}

:deep(.painting-tab) {
  &::after {
    content: "";
    display: inline-block;
    width: 1em;
    height: 1em;
    border-radius: var(--bng-corners-3);
    margin-left: 0.5em;
  }
  @for $i from 0 through 2 {
    &.painting-tab-#{$i}::after {
      background-color: var(--painting-dot-#{$i});
    }
  }
}

.paintPicker {
  margin: 0.5em;
}

.clearCoatSection {
  margin-top: 1em;
}

.shoppingCartTable {
  width: 100%;
}

.innerShoppingCart {
  overflow-y: auto;
}

.price {
  text-align: right;
  padding-right: 70px;

  &--total {
    @extend .price;
    padding-top: 1em;
    font-size: 1.3em;
  }
}

.article {
  text-align: left;
  padding-left: 0.5em;

  &--total {
    @extend .article;
    padding-top: 1em;
    font-size: 1.3em;
  }

  &--subLevel {
    @extend .article;
    padding-left: 2em;
  }
}

.paintingWrapper {
  position: relative;
  height: 100%;
}

.shoppingCart {
  background-color: #000000af;
  color: white;
  position: fixed;
  bottom: 2em;
  right: 2em;
  max-height: 50vh;
  display: flex;
  flex-direction: column;
}

.innerShoppingCart {
  overflow-y: auto;
  max-height: calc(50vh - 80px); // Account for purchase button height
}

.button-container {
  margin-left: 0.5em;
  display: flex;
  //gap: 0.5em;
  flex-wrap: wrap;
}

.paint-class-button {
  flex-shrink: 0;
}

.purchase-button-container {
  display: flex;
  justify-content: center;
  padding: 0.3em;
}

.purchase-button {
  margin-top: 1em;
}
</style>
