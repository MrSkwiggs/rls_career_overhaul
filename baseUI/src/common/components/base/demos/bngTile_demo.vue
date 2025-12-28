<template>
  <div class="bng-tile-demo">
    <div>
      <div>Basic tile with label only</div>
      <BngTile label="Tile"></BngTile>
    </div>
    <div>
      <div>Basic tile with content only</div>
      <BngTile>
        <span>Tile</span>
        <BngIcon :type="icons.beamXPFull" />
      </BngTile>
    </div>
    <div>
      <div>Tile with label and content</div>
      <BngTile label="BeamXP">
        <BngIcon :type="icons.beamXPFull" />
      </BngTile>
    </div>
    <div>
      <div>Tile with label</div>
      <BngTile label="BeamXP">
        <BngIcon :type="icons.beamXPFull" />
        <template #label>
          <div style="display: flex; align-items: center; justify-content: center">
            <span style="color: var(--bng-orange-400); font-weight: bold; font-style: italic">Tile</span>
            <BngIcon :type="icons.beamCurrency" />
          </div>
        </template>
      </BngTile>
    </div>
    <div>
      <div>Tile with complex content</div>
      <BngTile :label="switchValue ? 'On' : 'Off'" @click="switchValue = !switchValue">
        <BngSwitch v-model="switchValue" />
      </BngTile>
    </div>
    <div>
      <div>Disabled Tile</div>
      <BngSwitch v-model="disableValue" label="Toggle" />
      <BngTile :label="disableValue ? 'Disabled' : 'Enabled'" :disabled="disableValue" />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngIcon, BngSwitch, BngTile, icons } from "@/common/components/base"

const switchValue = ref(false)
const disableValue = ref(true)
</script>

<style lang="scss" scoped></style>
