<!-- bngUnit_demo -->
<template>
  <h2>BngUnit Demo</h2>
  <div>
    <BngUnit :beamXP="0" /> <br />
    <BngUnit :beamXP="1234.23123" /> <br />
    <BngUnit :money="0" /> <br />
    <BngUnit :money="1234.333245" /> <br />
    <BngUnit :money="1234.333245" :options="{ noGap:true, formatter: false }" /> <br />
    <BngUnit :money="1234.333245" :options="{ formatter: x => ~~x }" /> <br />
    <BngUnit :stars="3" /> <br />
    <BngUnit :vouchers="4" /> <br />
    <BngUnit :multiplier="4" /> <br />
    <BngUnit :multiplier="4" :options="{noGap: false}" /> <br />
    <BngUnit :notadefinedunit="1234.333245" /> <br />
  </div>
</template>

<script setup>
import { BngUnit } from "@/common/components/base"
</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngUnit_demo.vue?raw"
export default {
  source,
  title: "Display an in-game unit & amount",
  description: "Standardised way to display game units with appropriately formatted amounts. Unit type and amount are passed by setting `unit=\"amount\"` as an attribute. Valid unit types are listed in the attributes table below",
  propInfo: [
    {
      name: "options",
      type: "Object",
      desc: "Optional override for unit options (`formatter`, `noGap`). Additional properties will be forwarded to contained `BngPropVal`",
    },
  ],
  attrInfo: [
    {
      name: "money",
      type: "Number",
      desc: "Specify a money amount (beambucks)",
    },
    {
      name: "beamXP",
      type: "Number",
      desc: "Specify an amount of BeamXP points",
    },
    {
      name: "stars",
      type: "Number",
      desc: "Specify an amount of stars",
    },
    {
      name: "vouchers",
      type: "Number",
      desc: "Specify an amount of vouchers",
    },
    {
      name: "multiplier",
      type: "Number",
      desc: "Specify a multiplier (will show as '**🞭37**' etc.)",
    },
  ],
}

</script>
