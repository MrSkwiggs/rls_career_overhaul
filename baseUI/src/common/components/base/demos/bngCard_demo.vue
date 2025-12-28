<template>
  <div class="demo-cards">
    <div class="first-row">
      <BngCard class="demo-card" style="width: 375px; height: 540px">
        <BngCardHeading type="ribbon">Ribbon Heading</BngCardHeading>
        <div class="content">Card content</div>
        <template #buttons>
          <BngButton :accent="ACCENTS.text">Cancel</BngButton>
          <BngButton label="Apply" />
        </template>
      </BngCard>
      <BngCard class="demo-card" style="width: 375px; height: 540px">
        <BngCardHeading>Line Heading (Default)</BngCardHeading>
        <div class="content">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent a tincidunt quam. Mauris vitae mattis augue. Donec ut urna a massa eleifend
          imperdiet.
        </div>
        <template #buttons>
          <BngButton :accent="ACCENTS.text">Cancel</BngButton>
          <BngButton label="OK" />
        </template>
      </BngCard>
      <BngCard class="demo-card">
        <BngCardHeading type="none">No Heading Style</BngCardHeading>
        <div class="content">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent a tincidunt quam. Mauris vitae mattis augue. Donec ut urna a massa eleifend
          imperdiet.<br /><br />
        </div>
        <template #buttons>
          <BngButton :accent="ACCENTS.text">Cancel</BngButton>
          <BngButton label="OK" />
        </template>
      </BngCard>
    </div>
    <div>
      <BngCard
        animateFooter
        :hideFooter="hideFooter"
        animateFooterType="fade"
        class="demo-card"
        style="width: 375px; height: 375px"
        @mouseover="hideFooter = false"
        @mouseleave="hideFooter = true">
        <BngCardHeading>Animated Footer</BngCardHeading>
        <div class="content">An animated footer with show on hover effect.</div>
        <template #buttons>
          <BngButton :accent="ACCENTS.text">Cancel</BngButton>
          <BngButton label="OK" />
        </template>
      </BngCard>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngCard, BngButton, ACCENTS, BngCardHeading } from "@/common/components/base"

const hideFooter = ref(true)
</script>

<style scoped lang="scss">
.demo-cards {
  display: flex;
  flex-direction: column;
  position: relative;
}

.first-row {
  display: flex;
}

.demo-card {
  margin: 1em;
}
</style>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./bngCard_demo.vue?raw"
export default {
  source,
  title: "Simple display card",
  description: `Card for displaying information with optional buttons. The main slot is used for the content of the card, whilst content for the buttons/footer area can be added using a \`#buttons\` or \`#footer\` slot.`,
  propInfo: [],
  attrInfo: [],
}
</script>
