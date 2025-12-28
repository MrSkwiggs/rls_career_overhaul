<template>
  <InfoCard class="replay-panel">
    <template #content>
      <div v-if="panel.recordingFiles && Array.isArray(panel.recordingFiles) && panel.recordingFiles.length > 0" class="replay-container">
        <BngCardHeading type="ribbon" class="replay-heading">
          Replays
        </BngCardHeading>
        <div class="temporary-replay-note">
          {{ $translate.instant("missions.general.replay.temporaryAreNotPermanent") }}
        </div>
        <div class="replay-items-container">
          <div v-for="file in [...panel.recordingFiles].reverse()" :key="file.replayFile" class="replay-item" :class="{'active-replay': file.replayFile === loadedReplayFile}">
            <div class="replay-info">
              <div class="title-container">
                <div class="replay-name">{{ file.title }}</div>
                <BngIcon
                  :type="icons.star"
                  class="star-icon"
                  :class="{'saved': file.userSaved}"
                />
              </div>
              <div class="replay-file">{{ file.replayFile }}</div>
            </div>
            <div class="replay-actions">
              <BngButton class="replay-button" accent="custom"
                @click="file.replayFile === loadedReplayFile ? onStopReplay() : onPlayReplay(file.replayFile)"
                :icon="file.replayFile === loadedReplayFile ? 'square' : 'play'"
                :disabled="!file.replayFile"
                :accent="ACCENTS.text"
              />
              <BngButton class="replay-button" accent="custom"
               @click="file.userSaved ? removeMissionSavedReplay(file.replayFile) : saveMissionReplay(file.replayFile)"
               :icon="file.userSaved ? icons.trashBin1 : icons.floppyDisk"
               :accent="ACCENTS.text"
               />
              <BngButton class="replay-button" accent="custom"
               @click="openReplayFolder(file.replayFile)"
               :icon="icons.folder"
               :disabled="!file.replayFile"
               :accent="ACCENTS.text"
               />
            </div>
          </div>
        </div>
        <div v-if="loadedReplayFile">
          <ReplayApp :hideFileControls="true" />
        </div>
      </div>
      <div v-else class="no-replays">
        {{ $translate.instant("missions.general.replay.noReplays") }}
      </div>
    </template>
  </InfoCard>
</template>

<script setup>
import { $translate } from "@/services"
import { BngButton, ACCENTS, icons, BngIcon } from "@/common/components/base"
import { lua, useBridge } from "@/bridge"
import { ref, computed, onMounted, onUnmounted } from 'vue'
import InfoCard from "../components/InfoCard.vue"
import { timeSpan } from "@/utils/datetime"
import ReplayApp from '@/modules/apps/replayAppV2/app.vue';
import BngCardHeading from "@/common/components/base/bngCardHeading.vue"
import { useEvents } from '@/services/events'

const props = defineProps({
  panel: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:panel'])

const state = ref('inactive')
const loadedReplayFile = ref('')
const events = useEvents()

function onPlayReplay(file) {
  lua.core_replay.loadFile(file)
  lua.core_replay.togglePlay()
}

function onStopReplay() {
  lua.core_replay.stop()
}

function saveMissionReplay(file) {
  lua.core_replay.saveMissionReplay(file)
}

function removeMissionSavedReplay(file) {
  lua.core_replay.removeMissionSavedReplay(file)
}

function openReplayFolder(file) {
  lua.core_replay.openMissionReplayFolder(file)
}

onUnmounted(() => {
  lua.core_replay.stop()

  events.off('replayStateChanged')
  events.off('recordingFilesUpdated')
})

function setFilesTitles() {
  if (props.panel.recordingFiles && Array.isArray(props.panel.recordingFiles) && props.panel.recordingFiles.length > 0) {
    props.panel.recordingFiles.forEach(file => {
      if (file.meta?.time) {
        file.title = timeSpan(file.meta.time, null, 1, true)
      } else {
        file.title = file.replayFileName
      }
    })
  }
}

onMounted(() => {
  setFilesTitles()

  events.on('replayStateChanged', (val) => {
    loadedReplayFile.value = val.loadedFile
    state.value = val.state
  })

  events.on("recordingFilesUpdated", (val) => {
    emit('update:panel', { ...props.panel, recordingFiles: val })
    setTimeout(() => {
      setFilesTitles()
    }, 5)
  })
})

</script>

<style scoped lang="scss">
.replay-container {
  display: flex;
  flex-direction: column;
  height: 100%;

  .replay-items-container {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding-right: 0.5rem;
    margin-bottom: 1rem;
    background-color: rgb(0, 0, 0, 0.3);
    border-radius: var(--bng-corners-2);

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 4px;

      &:hover {
        background: rgba(255, 255, 255, 0.4);
      }
    }
  }
}

.replay-panel {
  height: 100%;
}

.replay-heading {
  margin-left: -0.5rem;
}
.replay-item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  transition: background-color 0.3s ease;

  &.active-replay {
    background-color: rgba(234, 179, 8, 0.1);
    animation: glowPulse 2s infinite;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg,
        rgba(234, 179, 8, 0) 0%,
        rgba(234, 179, 8, 0.1) 50%,
        rgba(234, 179, 8, 0) 100%);
      background-size: 200% 100%;
      animation: glowMove 2s infinite;
    }
  }

  &:last-child {
    border-bottom: none;
  }
}

@keyframes glowPulse {
  0% {
    background-color: rgba(234, 121, 8, 0.1);
  }
  50% {
    background-color: rgba(234, 121, 8, 0.2);
  }
  100% {
    background-color: rgba(234, 121, 8, 0.1);
  }
}

@keyframes glowMove {
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 100% 0;
  }
}

.replay-info {
  flex: 1;
  margin-right: 1rem;
}

.replay-name {
  font-weight: 500;
}

.replay-file {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.replay-actions {
  display: flex;
  gap: 0.5rem;
}

.no-replays {
  text-align: center;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.6);
}

.temporary-replay-note {
  font-size: 0.875rem;
  color: var(--bng-orange-b400);
  padding: 0 1rem 1rem 1rem;
}

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

.replay-button {
  --bng-icon-size: 2.2em;
  padding: 0.2rem 0.6em;
  margin: 0;

  --bng-button-custom-enabled: rgba(255, 255, 255, 0.2);
  --bng-button-custom-hover: rgba(255, 255, 255, 0.3);
  --bng-button-custom-active: rgba(255, 255, 255, 0.4);
  --bng-button-custom-disabled: rgba(255, 255, 255, 0.1);
}

.title-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  justify-content: space-between;
}

.star-icon {
  color: #eab308;
  font-size: 2em;
  opacity: 0;
  transition: opacity 0.3s ease;

  &.saved {
    opacity: 1;
  }
}
</style>
