<!-- BNGBlur Directive Demo -->
<template>

  <p>To see this demo working, make sure you are running it while the game engine is displaying something.</p>

  <div>
    <div v-bng-blur="blur1" class="blurbox">1</div>
    <div v-bng-blur="!blur1" class="blurbox">2</div>
    <div v-bng-blur="blur1" class="blurbox">3</div>
    <div v-bng-blur="!blur1" class="blurbox">4</div>
    <div v-bng-blur="blur1" class="blurbox">5</div>
    <div v-bng-blur="!blur1" class="blurbox">6</div>
  </div>
  <BngButton :accent="ACCENTS.secondary" tabindex="1" @click="swap">Change blur values</BngButton>
  <br/><br/><br/>
  <BngButton :accent="ACCENTS.secondary" tabindex="1" @click="swap2">{{blur2 ? 'Change' : 'Add'}} blurred area</BngButton>
  <div :class="blur2">
    <div v-if="blur2" class="blurbox" v-bng-blur>New Blurred Area</div>
  </div>

</template>

<style scoped>
  .blurbox {
    display: inline-block;
    width:200px;
    height:100px;
    margin:5px;
    text-align: center;
    font-size:40px;
    line-height: 100px;
    border: 2px solid gray;
    background-color: #0003;
    border-radius: var(--bng-corners-1);
    user-select: none;
  }
  .alt {
    display: inline-block;
    padding-left:50px;
    height: 300px;
  }
  .alt > * > *:first-child {
    /* this rule is used to trigger the warning about styles conflict */
    color: red;
  }
  .alt > .blurbox {
    width: 400px;
    height: auto;
    font-size: 20px;
    vertical-align: top;
    transition: font-size 1s;
  }
  .alt2, .alt3 {
    padding-top: 50px;
  }
  .alt3 > .blurbox {
    font-size: 60px;
  }
</style>

<style>
  .components-demo.blurdemo {
    background-color: #0006 !important;
  }
</style>

<script setup>
  import { BngButton, ACCENTS } from '@/common/components/base'
  import { ref, onMounted, onUnmounted } from "vue"

  import { vBngBlur } from "@/common/directives"

  const
    lighten = (state=true) => {
      const container = document.querySelector('.components-demo')
      container && container.classList[state?'add':'remove']('blurdemo')
    },
    swap = () => blur1.value = !blur1.value,
    swap2 = () => blur2.value = blur2states[blur2states.indexOf(blur2.value) + 1]


  const blur1 = ref(true)
  const blur2 = ref(false)
  const blur2states = [false, "alt", "alt alt2", "alt alt3", "alt alt4", false]

  onMounted(lighten)
  onUnmounted(() => lighten(false))

</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./BngBlur_demo.vue?raw"
export default {
  source,
  title: "Blurs the game behind an element",
  description: `Blurs the section of the game covered by the element. The amount of blurring is defined by the directive value:

    <div bng-blur="value">Hello world!</div>
`,
}

</script>