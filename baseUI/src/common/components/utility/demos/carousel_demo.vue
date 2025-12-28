<template>
  <div class="demo-carousel-wrapper">
    <div>
      <h3>Carousel Default</h3>
    </div>
    <Carousel :items="['blue', 'red', 'green', 'orange', 'yellow']" class="carousel-demo">
      <template #item="{ item }">
        <div class="slide" :style="{ background: item }">Slide {{ item }}</div>
      </template>
    </Carousel>
  </div>
  <div class="demo-carousel-wrapper">
    <div>
      <h3>Carousel Vertical</h3>
    </div>
    <Carousel :items="['blue', 'red', 'green']" vertical class="carousel-demo">
      <template #item="{ item }">
        <div class="slide" :style="{ background: item }">Slide {{ item }}</div>
      </template>
    </Carousel>
  </div>
  <div class="demo-carousel-wrapper">
    <div>
      <h3>Carousel Initial Slide</h3>
    </div>
    <Carousel :items="['blue', 'red', 'green']" :current="2" class="carousel-demo">
      <template #item="{ item }">
        <div class="slide" :style="{ background: item }">Slide {{ item }}</div>
      </template>
    </Carousel>
  </div>
  <div class="demo-carousel-wrapper">
    <div>
      <h3>Carousel with transition</h3>
      <code>&lt;carousel transition :transitionTime="1500"&gt;&lt;carousel&gt; </code>
    </div>
    <Carousel :items="['blue', 'red', 'green']" class="carousel-demo" transition :transitionTime="1500">
      <template #item="{ item }">
        <div class="slide" :style="{ background: item }">Slide {{ item }}</div>
      </template>
    </Carousel>
    <div>
      <code>&lt;carousel transition transitionType="fade"&gt;&lt;carousel&gt; </code>
    </div>
    <Carousel :items="['blue', 'red', 'green']" class="carousel-demo" transition transitionType="fade">
      <template #item="{ item }">
        <div class="slide" :style="{ background: item }">Slide {{ item }}</div>
      </template>
    </Carousel>
  </div>
  <div class="demo-carousel-wrapper">
    <h3>Programmatically Navigate</h3>
    <Carousel :items="['blue', 'red', 'green']" ref="carouselRef" loop class="carousel-demo">
      <template #item="{ item }">
        <div class="slide" :style="{ background: item }">Slide {{ item }}</div>
      </template>
      <template #navigation> </template>
    </Carousel>
    <div>
      <button @click="goPrevious">Prev</button>
      <button @click="goNext">Next</button>
    </div>
    <div>
      <!-- <input v-model="slideValue" placeholder="Carousel item value" /> -->
      <BngInput v-model="slideValue" floatingLabel="Carousel item value" />
      <button @click="goToSlide">Go to slide</button>
    </div>
  </div>
  <div class="demo-carousel-wrapper">
    <div>
      <h3>Synchronised carousels</h3>
      Parent: <code>&lt;carousel ref="parentCarousel"&gt;&lt;carousel&gt; </code><br />
      Child: <code>&lt;carousel :parent="parentCarousel"&gt;&lt;carousel&gt; </code>
    </div>
    <Carousel :items="['blue', 'red', 'green']" ref="parentCarousel" class="carousel-demo">
      <template #item="{ item }">
        <div class="slide" :style="{ background: item }">Slide {{ item }}</div>
      </template>
    </Carousel>
    <Carousel :items="['blue', 'red', 'green']" :parent="parentCarousel" class="carousel-demo">
      <template #item="{ item }">
        <div class="slide" :style="{ background: item }">Slide {{ item }}</div>
      </template>
    </Carousel>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngInput } from "@/common/components/base"
import { Carousel, CarouselItem } from "@/common/components/utility"

const carouselRef = ref(null)
const slideValue = ref(null)
const goNext = () => carouselRef.value.showNext()
const goPrevious = () => carouselRef.value.showPrevious()
const goToSlide = () => carouselRef.value.showSlide(slideValue.value)

const parentCarousel = ref(null)
</script>

<style lang="scss" scoped>
.carousel-demo {
  width: 200px;
  height: 100px;
}
.demo-carousel-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.5rem;
}
.slide {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}
</style>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./carousel_demo.vue?raw"
export default {
  source,
  title: "A simple carousel",
  description: `Display a carousel of items, optionally both showing navigation, and specifiying transition details. Items should be added inside [\`<CarouselItem>\`](#/components/CarouselItem) components in the default slot`,
  propInfo: [
    {
      name: "current",
      type: "String/Number",
      desc: "Index/value of the [`<CarouselItem>`](#/components/CarouselItem) shown as default when the component first appears",
    },
    {
      name: "vertical",
      type: "Boolean",
      desc: "Switch to orient the carousel vertically (currently only applies to navigation controls)",
    },
    {
      name: "loop",
      type: "Boolean",
      desc: "Switch on/off looping of the carousel. Default is `true`",
    },
    {
      name: "transition",
      type: "Boolean",
      desc: "Switch on/off automatic transition between items",
    },
    {
      name: "transitionType",
      type: "String",
      desc: "Type of transition to use - should be one of: `'none'` (default), `'smooth'`, or `'fade'`",
    },
    {
      name: "transitionTime",
      type: "Number",
      desc: "Duration of the transition in milliseconds",
    },
    {
      name: "showNav",
      type: "Boolean",
      desc: "Switch on/off navigation interface",
    },
    {
      name: "parent",
      type: "Object",
      desc: "If synchronisation with another `Carousel` is required - provide it in this prop",
    },
  ],
  attrInfo: [],
}
</script>
