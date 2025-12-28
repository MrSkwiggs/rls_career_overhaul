<!-- Reusable Progress View Layout Component -->
<template>
  <LayoutSingle v-bng-on-ui-nav:back,menu="handleExit" class="progress-view-layout" v-bng-blur>
    <div class="progress-view-wrapper" :style="branchStyle" bng-ui-scope="progressView" v-bng-on-ui-nav:back,menu="handleExit">
      <div class="progress-view-actions">
        <BngBreadcrumbs
          class="progress-view-breadcrumbs"
          :items="breadcrumbItems"
          limit="5"
          simple
          disable-last-item
          :show-back-button="showBackButton"
          @click="handleBreadcrumbClick"
          @back="handleBreadcrumbBack"
        />
        <CareerStatus class="progress-view-career-status" slim />
      </div>
      <div class="progress-view-page">
        <div class="progress-view-header">
          <template v-if="skillInfo">
            <div class="header-skill" :class="{ 'is-locked': !skillInfo.unlocked }" @click="$emit('skill-click', skillInfo.id)">
              <div class="branch-icon-assembly large">
                <div class="branch-background" :style="getIconBackgroundStyle(skillInfo.color)"></div>
                <BngIcon :type="icons[skillInfo.unlocked ? skillInfo.icon : 'lockClosed']" class="assembly-icon large" />
              </div>
              <BranchSkillProgressBar
                class="main-stat-progress-bar skill-progress-bar"
                :skill="skillInfo"
                :showLevel="false"
                mode="with-value-label"
                :showLockedIcon="true"
                :isMainProgress="true"
              />
            </div>
            <div class="reward-multiplier" v-if="skillInfo.rewardMultiplier">

              <div class="reward-multiplier-label">
                <BngIcon :type="skillInfo.rewardMultiplierSourceIcon" />
                Reward Multiplier:
              </div>
              <div class="reward-multiplier-value">
                <BngIcon :type="icons.beamCurrency" />
                ×{{ skillInfo.rewardMultiplier.toFixed(2) }}
              </div>
            </div>
          </template>
          <template v-else>
            <BngScreenHeadingV2 type="2" class="header-title-v2">
              {{ headingText }}
            </BngScreenHeadingV2>
          </template>
        </div>
        <div class="progress-view-contents">
          <div class="progress-view-description">
            <slot name="description"></slot>
          </div>
          <div class="progress-view-divider"></div>
          <div class="progress-view-scrollable">
            <slot></slot>
          </div>
        </div>
      </div>
    </div>
  </LayoutSingle>
</template>

<script setup>
import { LayoutSingle } from "@/common/layouts"
import { BngScreenHeadingV2, BngIcon, icons, BngBreadcrumbs } from "@/common/components/base"
import { vBngBlur, vBngOnUiNav } from "@/common/directives"
import { CareerStatus } from "@/modules/career/components"
import BranchSkillProgressBar from "./progress/BranchSkillProgressBar.vue"
import { getIconBackgroundStyle } from "@/utils/colorUtils"

const props = defineProps({
  skillInfo: {
    type: Object,
    default: null
  },
  headingText: {
    type: String,
    default: ""
  },
  breadcrumbItems: {
    type: Array,
    required: true
  },
  branchStyle: {
    type: Object,
    required: true
  },
  showBackButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['breadcrumb-click', 'breadcrumb-back', 'exit', 'skill-click'])

const handleBreadcrumbClick = (item) => {
  emit('breadcrumb-click', item)
}

const handleBreadcrumbBack = () => {
  emit('breadcrumb-back')
}

const handleExit = () => {
  emit('exit')
}
</script>

<style lang="scss" scoped>
$textcolor: #fff;
$fontsize: 1rem;

.progress-view-layout {
  --safezone-top: 0;
  --safezone-bottom: var(--safezone-new-info-bar);
  --content-flow: column nowrap;
  color: $textcolor;
  margin-top: 1rem;
  font-size: $fontsize;
}

.progress-view-wrapper {
  display: flex;
  flex-flow: column;
  flex: 0 1 auto;
  margin: 0 auto;
  width: 100%;
  max-width: 76rem;
  padding-top: 1rem;
  height: 100%;
}

.progress-view-page {
  display: flex;
  flex-flow: column;
  background: rgba(0, 0, 0, 0.6);
  border-radius: var(--bng-corners-2);
  width: 100%;
  position: relative;
  height: calc(100% - 2.5rem);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #424242;
    opacity: 0.8;
    border-radius: var(--bng-corners-2);
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom,
      rgba(var(--branch-color), 0.2),
      rgba(var(--branch-color), 0.2) 10rem,
      rgba(var(--branch-color), 0.05) 20rem,
      rgba(var(--branch-color), 0.01) 100%),
      rgba(3, 1, 1, 0.6);
    border-radius: var(--bng-corners-2);
    z-index: 1;
  }

  > * {
    position: relative;
    z-index: 2;
  }
}

.progress-view-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: var(--bng-corners-2) var(--bng-corners-2) 0 0;
  --bng-heading-background-opacity: 0;
  min-height: 3.6rem;
  flex: 0 0 5.5rem;

  > :deep(.bng-button) {
    margin-top: 0.75rem !important;
  }
  .header-title-v2 {
    margin-left: 0.5rem;
    margin-bottom: 0.25rem;
  }
}

.progress-view-contents {
  display: flex;
  flex-flow: column;
  flex: 1 1 auto;
  min-height: 0;
}

.progress-view-description {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--branch-color), 0.2);
  border-radius: var(--bng-corners-2);
  margin: 1rem;
  margin-top: 0.5rem;
  margin-bottom: 0rem;
  padding: 0.5rem;

}

.progress-view-divider {
  width: 100%;
  height: 1px;
  margin: 0.5rem 0;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(var(--branch-accent-color), 0.5) 50%,
      transparent
    );
  }
}
.progress-view-scrollable {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1rem;
  overflow-y: scroll;
}

.progress-view-actions {
  flex: 0 0 auto;
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.progress-view-career-status {
  flex: 0 0 auto;
  background-color: rgba(0, 0, 0, 0.66);
  border-radius: var(--bng-corners-2);
}

.progress-view-breadcrumbs {
  $bg: rgba(0, 0, 0, 0.66);
  --background-color: #{$bg};
  --bng-breadcrumbs-enabled-opacity: 0.01;
  align-self: flex-start;
}

.header-skill {
  display: flex;
  padding: 0.5rem 1rem;
  position: relative;
  z-index: 2;
  flex: 1 1 auto;
  gap: 0.5rem;
  background-color: rgba(var(--branch-accent-color), 0.1);
  height: 100%;
  box-sizing: border-box;
  align-items: center;

  .skill-progress-bar {
    flex: 1 1 auto;
    :deep(.header) {
      font-size: 2rem;
    }
  }
}
.reward-multiplier {
  flex: 0 1 auto;
  font-size: 1.2rem;
  height: 100%;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.25rem 1rem;
  background-color: rgba(var(--branch-accent-color), 0.15);
  .reward-multiplier-label {
    font-size: 0.8rem;
    font-weight: 600;
  }
  .reward-multiplier-value {
    font-size: 1.2rem;
    font-weight: 600;
  }
}

.branch-icon-assembly {
  position: relative;
  flex: 0 0 auto;
  height: 2.4em;
  width: 2.4em;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0;

  &.large {
    height: 3.8em;
    width: 3.8em;
  }

  .branch-background {
    position: absolute;
    top: -0.18rem;
    bottom: -0.18rem;
    left: -0.18rem;
    right: -0.18rem;
    mask-image: url(/ui/assets/SVG/24/branchXP-bg.svg);
    -webkit-mask-image: url(/ui/assets/SVG/24/branchXP-bg.svg);
    mask-repeat: no-repeat;
    -webkit-mask-repeat: no-repeat;
    mask-size: contain;
    -webkit-mask-size: contain;
    mask-position: 50% 50%;
    -webkit-mask-position: 50% 50%;
    z-index: 1;
  }

  .assembly-icon {
    position: relative;
    font-size: 2.4em;
    z-index: 2;
    justify-self: center;
    font-style: normal;

    &.large {
      font-size: 3.8em;
    }
  }
}

.is-locked {
  color: rgba(255, 255, 255, 0.6);

  .branch-icon-assembly {
    opacity: 0.6;
  }
}
</style>

