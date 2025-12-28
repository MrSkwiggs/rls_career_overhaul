<template>
  <div v-bng-scoped-nav="{ activated }" class="file-list-item" @activate="onActivate(true)" @deactivate="onActivate(false)">
    <div class="save-info-container">
      <div class="file-name">{{ name }}</div>
      <div class="file-modified">{{ modifiedFormatted }}</div>
      <div class="file-size">{{ fileSizeFormatted }}</div>
    </div>
    <div v-if="selected" class="save-file-actions">
      <BngButton :icon="icons.import" @click="load" />
      <BngButton :icon="icons.rename" :accent="ACCENTS.secondary" @click="rename" />
      <BngButton :icon="icons.trashBin2" :accent="ACCENTS.attention" @click="deleteSave" />
    </div>
  </div>
</template>

<script>
export default {
  width: 14,
  height: 6,
  margin: 0.25,
}
</script>

<script setup>
import { nextTick, ref } from "vue"
import { BngButton, ACCENTS, icons } from "@/common/components/base"
import { vBngScopedNav } from "@/common/directives"
import { openFormDialog, openConfirmation } from "@/services/popup"
import { useLiveryFileStore, useLiveryMainStore } from "@/modules/liveryEditor/stores"
import FileEditForm from "@/modules/liveryEditor/components/fileManager/FileEditForm.vue"

const store = useLiveryFileStore()
const mainStore = useLiveryMainStore()

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  modifiedFormatted: String,
  fileSizeFormatted: String,
  selected: Boolean,
})

const activated = ref(false)
const openedDialog = ref(null)

function load() {
  mainStore.load(props)
  window.bngVue.gotoGameState("LiveryMain")
}

function rename() {
  const model = { name: props.name }

  nextTick(() => {
    openedDialog.value = "rename"
  })

  openFormDialog(
    FileEditForm,
    model,
    model => {
      return model.name !== null && model.name !== undefined && model.name !== ""
    },
    "Rename file",
    "Enter new name"
  ).then(res => {
    if (res.value) store.renameFile(props, res.formData.name)
    forceActivateScope()
  })
}

function deleteSave() {
  openConfirmation("Delete", `Are you sure you want to delete ${props.name}`).then(res => {
    if (res) {
      store.deleteFile(props)
    } else {
      forceActivateScope()
    }
  })
}

function onActivate(activate) {
  activated.value = activate

  nextTick(() => {
    if (activate && openedDialog.value) {
      openedDialog.value = null
    }
  })
}

function forceActivateScope() {
  nextTick(() => {
    activated.value = true
  })
}
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

.file-list-item {
  $f-offset: 0.25rem;
  $rad: $border-rad-1;

  position: relative;
  display: flex;
  padding: 1em;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: var(--bng-corners-1);

  @include modify-focus($rad, $f-offset);

  > .save-info-container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;

    > .file-name {
      font-size: 1.25em;
      font-weight: 600;
    }
  }

  .save-file-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
