<template>
  <InfoCard class="dial-card" :header="panel.header" header-type="ribbon">
    <template #content>
      <div>
        {{ $ctx_t(panel.text) }}
      </div>
      <div class="list">
        <template v-for="dial in panel.dials" :key="dial.key">
          <div class="setting-item">
            <div class="setting-item-label">
              {{ $t(dial.label) }}
            </div>
            <BngInput
              class="input"
              v-model="dial.value"
              :min="0"
              :max="60"
              :suffix="'seconds'"
              :decimals="2"
              type="number"
              :disabled="dial.disabled"
              :step="0.01"
              @valueChanged="updateDial(dial)" />
          </div>
          <!--          @valueChanged="value => store.changeSettings(setting.key, value)"-->
        </template>
      </div>
    </template>
  </InfoCard>
</template>

<script setup>
import { $translate } from "@/services"
import { BngInput } from "@/common/components/base"
import { lua, useBridge } from "@/bridge"
import InfoCard from "../components/InfoCard.vue"

const props = defineProps({
  panel: {
    type: Object,
    required: true,
  },
})

function updateDial(dial) {
  // dial.value = Math.floor(dial.value * 100) / 100
  lua.extensions.hook("onDialSetByDialPanel", dial)
}
</script>

<style scoped lang="scss">
.setting-item {
  display: flex;
  align-items: center;
  .setting-item-label {
    flex: 1 0 auto;
    font-weight: 500;
    padding-left: 0.45rem;
  }
  .input {
    flex: 0 1 10rem;
  }
}
</style>
