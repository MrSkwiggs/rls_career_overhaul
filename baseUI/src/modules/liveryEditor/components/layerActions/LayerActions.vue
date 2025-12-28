<template>
  <BngActionDrawer class="actions-drawer" :actions="layerActions" :item-width="5" :skeleton-items="5" @select="store.onActionItemSelected">
    <template #controls>
      <BngButton :accent="ACCENTS.outlined" :icon="icons.abandon" @click="() => console.log('Custom button click')" />
    </template>
    <template #action="{ item, isLoading, select }">
      <BngImageTile
        class="action-tile"
        bng-nav-item
        :label="item.toggleAction && !item.active ? item.inactiveLabel : item.label"
        :icon="item.toggleAction && !item.active ? item.inactiveIcon : item.icon"
        :externalImage="item.preview"
        @click="select(item)">
      </BngImageTile>
    </template>
  </BngActionDrawer>
</template>

<script setup>
import { computed, onBeforeMount, watch } from "vue"
import { storeToRefs } from "pinia"
import { useUINavScope } from "@/services/uiNav"
import { vBngOnUiNav, vBngBlur } from "@/common/directives"
import { BngActionDrawer, BngImageTile, BngButton, ACCENTS, icons } from "@/common/components/base"
import BngActionsDrawerOne from "@/common/components/base/bngActionsDrawerOne.vue"
import { useLiveryEditorStore, useLayerActionsStore } from "@/modules/liveryEditor/stores"
import { openConfirmation } from "@/services/popup"
import { openRenameLayerDialog } from "@/modules/liveryEditor/utils"

defineEmits(["close"])

const store = useLayerActionsStore()
const rootStore = useLiveryEditorStore()
const { singleSelectedLayer } = storeToRefs(store)

const layerActions = computed(() => ({
  label: rootStore.selectedLayers.length === 1 ? `${rootStore.selectedLayers[0].name} Actions` : `${rootStore.selectedLayers.length} Layers Actions`,
  items: rootStore.layerActions,
}))

async function onActionClicked(actionItem) {
  let proceed = true
  const params = {}

  if (actionItem.value === "delete") {
    proceed = await openConfirmation(`Delete ${singleSelectedLayer.value.name}`)
  } else if (actionItem.value === "rename") {
    const formModel = { name: singleSelectedLayer.value.name }

    const res = await openRenameLayerDialog("Rename Layer", "", formModel, model => {
      return model.name !== null && model.name !== undefined && model.name !== "" && model.name !== singleSelectedLayer.value.name
    })

    if (res.success) {
      params.name = res.value.name
      proceed = true
    }
  }

  if (proceed) await store.onActionClicked(actionItem, params)
}
</script>

<style lang="scss" scoped>
.action-tile {
  // margin: 0.75rem;
}
</style>
