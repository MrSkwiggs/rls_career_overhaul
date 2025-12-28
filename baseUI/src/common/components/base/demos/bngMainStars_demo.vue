<template>

  <span>Empty (default 0/1):</span>
  <BngMainStars class="mainStarsItem" />

  <span>Total Only (0/2):</span>
  <BngMainStars class="mainStarsItem"
    :total-stars="2" />

  <span>Unlocked Only (1/1):</span>
  <BngMainStars class="mainStarsItem"
    :unlocked-stars="1" />

  <span>Both (1/2):</span>
  <BngMainStars class="mainStarsItem"
    :unlocked-stars="1"
    :total-stars="2" />

  <span>Individual Stars (1/2):</span>
  <BngMainStars class="mainStarsItem"
    :individual-stars="[{ filled: true }, { filled: false }]" />
</template>

<script setup>
import { BngMainStars } from "@/common/components/base"
</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngMainStars_demo.vue?raw"
export default {
  source,
  title: "Locked/Unlocked Stars",
  description: `A visualisation of locked and unlocked stars, showing the total number of stars and the number of unlocked stars.`,
  propInfo: [
    {
      name: "unlockedStars",
      type: "Number",
      desc: "The number of unlocked stars. Default is `0`",
    },
    {
      name: "totalStars",
      type: "Number",
      desc: "The total number of stars. Default is `1`",
    },
  ],
  attrInfo: [

  ],
}

</script>
