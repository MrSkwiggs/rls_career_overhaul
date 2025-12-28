<template>
  <div
    v-show="visible"
    class="info-bar"
    :class="{ 'info-bar-solid': solidBar }"
    bng-no-nav="true"
    v-bng-blur="solidBar && !SysInfo.mainMenuBackgroundRequired.value"
  >

    <div v-if="showSysInfo" class="info-bar-stats">
      <BngIcon style="--bng-icon-size: 1.25em; padding: 0;" :type="SysInfo.online ? icons.globeSimplified : icons.globeSimpleNotSign" v-bng-tooltip:top="SysInfo.online ? 'Online' : 'Offline'" />
      <template v-for="(info, key) in SysInfo.serviceProviders.value">
        <span v-if="SysInfo.serviceProvidersOnline.value[key]">
          <BngImageAsset :src="`images/mainmenu/${key}icon.png`" />
          {{ info.playerName }}
          <BngIcon style="--bng-icon-size: 1.25em; padding: 0;" v-if="info.branch && info.branch !== 'public'" :type="icons.branch" v-bng-tooltip:top="'Branch: ' + info.branch" />
          {{ info.branch && info.branch !== "public" ? info.branch : "" }}
        </span>
      </template>
      <span v-if="SysInfo.online || SysInfo.serviceProvidersOnline.value.any" class="divider" />
      <span @click="toggleBuildInfo">
        <span v-if="!showBuildInfo">Alpha v.{{ SysInfo.versionSimple }}</span>
        <template v-else>
          <span class="sysinfo">Alpha v.{{ SysInfo.version }}</span>
          <span class="sysinfo">{{ SysInfo.buildInfo }}</span>
        </template>
      </span>
    </div>

    <div class="spacer"></div>

    <div v-if="hints.length" class="info-bar-buttons" bng-no-child-nav="true">
      <Hint v-for="item in hints" :key="item.id" :data="item" />
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { useRoute } from "vue-router"
import SysInfo from "@/services/sysInfo"
import { useInfoBar } from "@/services/infoBar"
import { BngIcon, icons, BngImageAsset } from "@/common/components/base"
import { vBngBlur, vBngTooltip } from "@/common/directives"
import Hint from "../components/Hint.vue"
import { storeToRefs } from "pinia"

const infoBarObj = useInfoBar()
const { visible, showSysInfo, withAngular, hints } = storeToRefs(infoBarObj)

const showBuildInfo = ref(false)

const toggleBuildInfo = () => showBuildInfo.value = !showBuildInfo.value

const route = useRoute()
const solidBar = computed(() => {
  if (route.name !== "menu.mainmenu") {
    return withAngular.value
  } else {
    return !SysInfo.mainMenuBackgroundRequired.value
  }
})
</script>

<style lang="scss" scoped>
$height: 2.9em;
$bg-grad: transparent 1.05rem, #f60 1.15rem 1.4rem, var(--info-grad-bg) 1.5rem;
$bg-grad-pad: 1.2rem;

.info-bar {
  position: absolute;
  bottom: 1em;
  width: 100%;
  height: $height;
  display: flex;
  flex-direction: row;
  > * {
    height: $height;
    line-height: $height;
    overflow: hidden;
  }
  --info-grad-bg: var(--bng-black-o6);
  &.info-bar-solid {
    bottom: 0;
    background-color: var(--bng-black-o6);
    --info-grad-bg: transparent;
  }

  .spacer {
    flex: 1 0 0;
  }

  .info-bar-stats,
  .info-bar-buttons {
    color: white;
    pointer-events: all;
    span {
      padding-left: 0.25em;
      padding-right: 0.25em;
    }
  }

  .info-bar-stats {
    position: relative;
    flex: 0 0 auto;
    padding-left: 1.4em;
    padding-right: $bg-grad-pad;
    display: flex;
    flex-direction: row;
    align-items: center;
    // border-left: 4px solid #f60;
    border-top-left-radius: var(--bng-corners-1);
    border-bottom-left-radius: var(--bng-corners-1);
    background-image: linear-gradient(-67deg, $bg-grad);
    .sysinfo {
      font-size: 0.8em;
    }
  }

  .info-bar-solid .info-bar-stats {
    border-left: none;
  }

  .info-bar-buttons {
    position: relative;
    padding-left: $bg-grad-pad;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-right: 1em;
    background-image: linear-gradient(113deg, $bg-grad);
    border-top-right-radius: var(--bng-corners-1);
    border-bottom-right-radius: var(--bng-corners-1);
    span > span {
      padding: 0.5em 0;
    }
    .binding:hover {
      background-color: var(--bng-orange-b400);
    }
    .binding span {
      padding-left: 0;
      padding-right: 0;
    }
  }

  .divider {
    display: inline-block;
    width: 0.25rem;
    height: 1.8em;
    margin-left: 0.5rem;
    margin-right: 0.2rem;
    padding: 0 !important;
    background-color: #f60;
    transform: skewX(-23deg);
  }
}
</style>
