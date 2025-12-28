<template>
  <div>
    <BngImageCarousel class="demo-carousel" :images="images" transition transitionType="fade" loop></BngImageCarousel>
  </div>
  <div>
    <p>
      Synced image carousels demo. First one is set to be parent,
      and the last one with different images (blurred ones) and with fade transition.
    </p>
    <div class="row">
      <!-- <BngImageCarousel class="demo-carousel" ref="parentImageCarousel" :images="images" transition transitionType="smooth" loop></BngImageCarousel> -->
      <!-- <BngImageCarousel class="demo-carousel" :parent="parentImageCarousel" :images="images" transition transitionType="smooth" loop></BngImageCarousel> -->
      <BngImageCarousel class="demo-carousel" ref="parentImageCarousel" :images="images" transition transitionType="fade" loop></BngImageCarousel>
      <BngImageCarousel class="demo-carousel" :parent="parentImageCarousel" :images="images" transition transitionType="fade" loop></BngImageCarousel>
      <BngImageCarousel class="demo-carousel" :parent="parentImageCarousel" :images="images_blur" transition transitionType="fade" loop></BngImageCarousel>
    </div>
  </div>
  <div>
    <p>Demo of overlayed carousels, in sync with the above. Those are aimed to run fullscreen so don't mind the cutout.</p>
    <div class="overlayed">
      <BngImageCarousel class="back" :parent="parentImageCarousel" :images="images" transition transitionType="fade" loop></BngImageCarousel>
      <div class="demo-btn">
        <BngImageCarousel class="btn-back" :parent="parentImageCarousel" :images="images_blur" transition transitionType="fade" loop></BngImageCarousel>
        <span>A thing</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngImageCarousel } from "@/common/components/base"

const PATH = 'images/mainmenu/'
const PATH2 = PATH + 'drive/'

const images = [
  `${PATH}unofficial_version.jpg`,
  `${PATH}tech/1.jpg`,
  `${PATH2}1.jpg`,
  `${PATH2}2.jpg`,
  `${PATH2}3.jpg`,
  `${PATH2}4.jpg`,
  `${PATH2}5.jpg`,
  `${PATH2}6.jpg`,
  `${PATH2}7.jpg`,
  `${PATH2}8.jpg`,
]
const images_blur = [
  `${PATH}unofficial_version_blur.jpg`,
  `${PATH}tech/1_blur.jpg`,
  `${PATH2}1_blur.jpg`,
  `${PATH2}2_blur.jpg`,
  `${PATH2}3_blur.jpg`,
  `${PATH2}4_blur.jpg`,
  `${PATH2}5_blur.jpg`,
  `${PATH2}6_blur.jpg`,
  `${PATH2}7_blur.jpg`,
  `${PATH2}8_blur.jpg`,
]

const parentImageCarousel = ref()
</script>

<style lang="scss" scoped>
.demo-carousel {
  width: 16em;
  height: 9em;
}
.row {
  display: flex;
  justify-content: space-around;
  > * {
    flex: 0 0 auto;
  }
}

.overlayed {
  display: block;
  width: 30em;
  height: 16em;
  z-index: 1;
  &, > * {
    position: absolute;
  }
  &, .demo-btn {
    clip: rect(0, auto, auto, 0);
    overflow: hidden;
  }
  .back,
  .btn-back {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .back,
  .btn-back {
    position: fixed;
  }
  .btn-back {
    z-index: -1;
  }
  .demo-btn {
    top: 3.5em;
    left: 7.5em;
    width: 15em;
    height: 10em;
    z-index: 1;
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #0005;
      border: 2px solid transparent;
      z-index: -1;
    }
    &:hover::after {
      background-color: #000a;
      border-color: #f60;
    }
    span {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 2em;
    }
  }
  .fancy-blur {
    position: absolute;
    overflow: hidden;
    clip: rect(0,auto,auto,0);
    z-index: -1;
    pointer-events: none;
  }
  .fancy-blur > * {
    position: fixed;
  }
  .fancy-blur,
  .fancy-blur > * {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngImageCarousel_demo.vue?raw"
export default {
  source,
  title: "A carousel of images",
  description: `Display a carousel of images, optionally both showing navigation, and specifiying transition details.\n\nHas the same props as the \`carousel\` utility component but instead of adding \`<carousel-item>\` in the slot, pass the images array in the \`images\` property instead`,
  propInfo: [
    {
      name: "images",
      type: "Array",
      desc: "Array of paths (relative to `/ui-vue/src/assets/`) of the images for the carousel",
    },
    {
      name: "current",
      type: "String/Number",
      desc: "Index of the image shown as default when the component first appears",
    },
    {
      name: "transition",
      type: "Boolean",
      desc: "Switch on/off automatic transition between images",
    },
    {
      name: "transitionType",
      type: "String",
      desc: "Type of transition to use - should be one of: `'none'` (default), `'smooth'`, or `'fade'`"
    },
    {
      name: "transitionTime",
      type: "Number",
      desc: "Duration of the transition in milliseconds",
    },
    {
      name: "loop",
      type: "Boolean",
      desc: "Switch on/off looping of the carousel",
    },
    {
      name: "showNav",
      type: "Boolean",
      desc: "Switch on/off navigation interface",
    },
    {
      name: "parent",
      type: "Object",
      desc: "If synchronisation with another `BngImageCarousel` is required - provide it in this prop",
    },
  ],
  attrInfo: [

  ],
}

</script>
