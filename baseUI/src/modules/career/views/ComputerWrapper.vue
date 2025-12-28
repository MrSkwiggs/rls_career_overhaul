<template>
  <LayoutSingle bng-ui-scope="computer" class="computer-wrapper-layout" v-bng-on-ui-nav:back="() => emit('back')">
    <div class="heading-container">
      <BngScreenHeadingV2 type="2">
        <template #preheadings>
          <BngBreadcrumbs
            class="breadcrumbs"
            simple
            disable-last-item
            show-back-button
            :navigable="false"
            @click="breadcrumbClick"
            @back="emit('back')"
            :items="breadcrumbItems" />
        </template>
        <slot name="title">{{ title }}</slot>
      </BngScreenHeadingV2>
      <BngCard class="status-container" v-bng-blur="true">
        <CareerStatus ref="elStatus" />
        <div v-if="$slots.status" class="status-add">
          <slot name="status"></slot>
        </div>
        <!-- TODO: allow content to overflow down instead of resizing the title - lock title with max-height -->
      </BngCard>
    </div>
    <div class="content-container">

      <!--
      <div class="button-row" v-if="back || close || $slots.top">
        <BngButton v-if="back || close" class="back-button" :accent="ACCENTS.attention" v-bng-on-ui-nav:back,menu.asMouse @click="emit(close ? 'close' : 'back')">
          <BngBinding ui-event="back" deviceMask="xinput" />
          {{ close ? $t("ui.common.close") : $t("ui.common.back") }}
        </BngButton>
        <slot name="top"></slot>
      </div>
    -->
      <div class="main-content">
        <div class="main-content-slotted">
          <slot></slot>
        </div>
        <div class="side-content-slotted">
          <TaskList
            class="task-list"
            :header="store.header"
            :tasks="store.tasks" />
          <slot name="side"></slot>
          <!--
          -->
        </div>
      </div>
    </div>
  </LayoutSingle>
</template>

<script setup>
import { ref, provide, computed } from "vue"
import { LayoutSingle } from "@/common/layouts"
import { BngScreenHeading, BngCard, BngButton, ACCENTS, BngBinding } from "@/common/components/base"
import { vBngOnUiNav, vBngBlur } from "@/common/directives"
import { CareerStatus } from "@/modules/career/components"
import { useUINavScope } from "@/services/uiNav"
import { BngScreenHeadingV2 } from "@/common/components/base"
import { TaskList } from '@/modules/tasks'
import { useTasksStore } from '@/modules/tasks'
import { useLibStore } from "@/services"
import BngBreadcrumbs from "@/common/components/base/bngBreadcrumbs.vue"
import { useComputerStore } from "../stores/computerStore"
useUINavScope("computer")

const { $game } = useLibStore()

const computerStore = useComputerStore()

const props = defineProps({
  title: {
    type: String,
    default: "My Computer",
  },
  path: Array,
  wallpaperFull: Boolean,
  wallpaperHalf: Boolean,
  back: Boolean,
  close: Boolean,
})

const breadcrumbItems = computed(() => {
  let items = [
    { label: 'Career', closeAllMenus: true },
    { label: computerStore.computerData.facilityName },
    ... (props.path || []).map(path => ({ label: path }))
  ]
  return items
})

const elStatus = ref()
const store = useTasksStore()
provide('animationSettings', {
  animate: true,
  animateOnMount: false,
  animateOnMountIntervalDelay: 0.2,
  animateOnEmptyIntervalDelay: 0.1,
  animateOnEmpty: true,
  animateNextTask: true,
  successCallback: playAudio
})
function playAudio() {
  $game.lua.Engine.Audio.playOnce('AudioGui', 'event:>UI>Career>Checkbox')
}

defineExpose({
  statusUpdate: () => elStatus.value.updateDisplay(),
})

function breadcrumbClick(item) {
  if (item.closeAllMenus) {
    $game.lua.career_career.closeAllMenus()
  }
}

const emit = defineEmits(["back", "close"])
</script>

<style lang="scss" scoped>
.computer-wrapper-layout {
  --safezone-top: unset;
  --safezone-bottom: unset;
  --content-flow: column nowrap;
  --content-max-width: unset;

  :deep(.layout-content) {

  }

}

.heading-container {
  flex: 0 0 auto;

  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: flex-end;

  box-sizing: border-box;
  align-self: stretch;

  > :deep(.bng-screen-heading) {
    margin: 0;
    flex: 1 auto;
  }

  .status-container {
    border-radius: var(--bng-corners-2);
    color: white;
    align-self: flex-start;
    .status-add {
      text-align: center;
      padding: 0.25rem 0.5rem;
    }
  }
}

.content-container {
  flex: 1 1 auto;
  padding: 0.5rem 0 0 0;
  overflow: hidden;
}
.main-content {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  height: 100%;
  .main-content-slotted {
    flex: 1 1 auto;
  }

  .side-content-slotted {
    flex: 0 0 33rem;
    display: flex;
    flex-flow: column nowrap;
    .task-list {
      width: 33rem;
      align-self: flex-start;
    }
  }

  .tasklist-container {
    flex: 0 0 auto;
    margin-left: auto;
    width: 33rem;
  }
}

.button-row {
  display: flex;
  flex-flow: row nowrap;
  align-items: baseline;
  margin-top: -1em; // to balance the top padding with this button (keep in mind that there might be no back button)
  margin-bottom: 1em;
  .back-button {
    margin-right: 1rem;
  }
}

.breadcrumbs {
  --background-color: rgba(0, 0, 0, 0.66);
  --bng-breadcrumbs-enabled-opacity: 0.01;
  align-items: center;
}


.footer-container {
  border: 1px solid green;
  flex: 0 0 auto;
}
</style>
