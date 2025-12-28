<template>
  <div class="editor" bng-ui-scope="livery-editor" v-bng-on-ui-nav:menu,back,ok="() => {}">
    <div class="editor-header-wrapper">
      <LiveryEditorHeader />
    </div>
    <div
      class="editor-content"
      :class="{
        'layers-collapse': minimizedMode,
      }">
      <component :is="currentView"></component>
    </div>
  </div>
</template>

<script>
import { EDITOR_VIEWS } from "@/modules/liveryEditor/stores"
const EDITOR_VIEWS_COMPONENT = {
  [EDITOR_VIEWS.decalSelector]: DecalSelector,
  [EDITOR_VIEWS.editMode]: EditModeLayout,
  [EDITOR_VIEWS.default]: DefaultLayout,
}
</script>

<script setup>
import { computed, ref, onBeforeMount, onMounted, onUnmounted, shallowRef, watch } from "vue"
import { storeToRefs } from "pinia"
import { vBngOnUiNav } from "@/common/directives"
import { useInfoBar } from "@/services/infoBar"
import useControls from "@/services/controls"
import { useLiveryEditorStore, useEditorHeaderStore } from "@/modules/liveryEditor/stores"
import DecalSelector from "@/modules/liveryEditor/components/DecalSelector.vue"
import EditModeLayout from "@/modules/liveryEditor/layouts/EditModeLayout.vue"
import DefaultLayout from "@/modules/liveryEditor/layouts/DefaultLayout.vue"
import { CameraViewButton, LiveryEditorHeader } from "@/modules/liveryEditor/components"

const store = useLiveryEditorStore()
const infobar = useInfoBar()
const Controls = useControls()
const { showIfController } = storeToRefs(Controls)

infobar.visible = true

const currentView = computed(() => EDITOR_VIEWS_COMPONENT[store.editorView])

const minimizedMode = ref(false)

watch(showIfController, value => {
  store.setUseMousePos(!value)
})

onBeforeMount(async () => {
  await store.startEditor()
  store.setUseMousePos(!showIfController.value)
})

// HEADER ITEMS
const HEADER_ITEMS = [
  {
    id: "camera_view",
    section: "end",
    component: shallowRef(CameraViewButton),
  },
]

const headerStore = useEditorHeaderStore()

onMounted(() => {
  headerStore.setPreheader(store.currentFile ? store.currentFile : "New Save")
  headerStore.addItems(HEADER_ITEMS)
})

onUnmounted(() => {
  headerStore.removeItems(HEADER_ITEMS)
})
</script>

<style lang="scss" scoped>
$infoBarHeight: 3rem;
$headerHeight: 6rem;

.editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0.5rem;

  > .editor-header-wrapper {
    width: 100%;
    height: $headerHeight;
  }

  > .editor-content {
    width: 100%;
    height: calc(100% - (#{$headerHeight} + #{$infoBarHeight}));
    padding: 0.5rem 0;

    > .layers-manager-wrapper {
      width: 26rem;
      min-width: 26rem;
      height: 100%;

      &.hidden {
        width: 0;
      }
    }

    > .layer-actions-wrapper {
      width: calc(100% - 26rem);
      align-self: flex-end;
    }

    > .layer-settings-wrapper {
      position: absolute;
      right: 0;
    }
  }

  > .editor-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2.5rem;
  }
}

.add-button :deep() {
  display: inline-block;
  width: 100%;
  padding: 0.75rem;
  margin: 0;
  max-width: unset !important;
}
</style>
