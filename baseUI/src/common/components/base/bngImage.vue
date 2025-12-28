<template>
  <img
    ref="elImg"
    v-show="!showCanvas"
    v-bind="imgAttrs"
    :src="imgSrc"
    alt=""
    v-bng-lazy-image:[observe]="{ url: src, callback: setImage }"
  />
  <canvas
    ref="elCanvas"
    v-show="showCanvas"
    v-bind="cvsAttrs"
  ></canvas>
</template>

<script setup>
import { ref, computed, watch, useAttrs } from "vue"
import { vBngLazyImage } from "@/common/directives"
import { emptyImage } from "@/utils"

const props = defineProps({
  src: String,
  observe: Boolean,
})

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

const observe = computed(() => props.observe ? "observe" : undefined)
const imgAttrs = computed(() => showCanvas.value ? {} : attrs)
const cvsAttrs = computed(() => showCanvas.value ? attrs : {})

const elImg = ref(null)
const elCanvas = ref(null)
const showCanvas = ref(false)
const imgSrc = ref(emptyImage)
let parentDataAttrs = {}

function setImage(elm, url, bmp) {
  if (!bmp) {
    showCanvas.value = false
    imgSrc.value = url || emptyImage
  } else {
    showCanvas.value = true
    imgSrc.value = emptyImage
    elCanvas.value.width = bmp.width
    elCanvas.value.height = bmp.height
    elCanvas.value.getContext("2d").drawImage(bmp, 0, 0)
    Object.entries(parentDataAttrs).forEach(([attr, value]) => {
      elCanvas.value.setAttribute(attr, value)
    })
  }
}

watch(() => props.src, () => {
  if (elImg.value) {
    showCanvas.value = false
    imgSrc.value = emptyImage
  }
})

watch(elImg, elm => {
  if (!elm) return
  // hack to inherit parent's scoped style selector attributes
  parentDataAttrs = {}
  for (const attr of elm.parentElement.getAttributeNames()) {
    if (attr.startsWith("data-v-")) {
      parentDataAttrs[attr] = elm.parentElement.getAttribute(attr)
    }
  }
  Object.entries(parentDataAttrs).forEach(([attr, value]) => {
    elm.setAttribute(attr, value)
    if (elCanvas.value) elCanvas.value.setAttribute(attr, value)
  })

  elm.__setImage = setImage
}, { immediate: true })
</script>
