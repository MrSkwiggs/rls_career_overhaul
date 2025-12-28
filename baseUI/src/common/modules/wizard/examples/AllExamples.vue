<template>
  <Tabs class="bng-tabs">
    <Simple tab-heading="Simple" />
    <Comprehensive tab-heading="Comprehensive" />
    <AutoSkip tab-heading="Auto Skip" />
    <CentralizedModel tab-heading="Centralized v-model" />
    <IndividualModel tab-heading="Individual v-model" />
    <OnlineConsent tab-heading="Online Consent (real example)" />
    <ButtonLayout tab-heading="Button Layout (real example)" />
  </Tabs>
</template>

<script setup>
import { Tabs } from "@/common/components/utility"
import Simple from "@/common/modules/wizard/examples/Simple.vue"
import Comprehensive from "@/common/modules/wizard/examples/Comprehensive.vue"
import AutoSkip from "@/common/modules/wizard/examples/AutoSkip.vue"
import CentralizedModel from "@/common/modules/wizard/examples/CentralizedModel.vue"
import IndividualModel from "@/common/modules/wizard/examples/IndividualModel.vue"
import OnlineConsent from "@/modules/onlineConsent/views/OnlineConsentView.vue"
import ButtonLayout from "@/modules/buttonLayout/views/ButtonLayoutView.vue"
</script>

<style lang="scss" scoped>
.bng-tabs {
  position: fixed;
  top: 0;
  left: 15em;
  right: 0;
  bottom: 0;
}
</style>
