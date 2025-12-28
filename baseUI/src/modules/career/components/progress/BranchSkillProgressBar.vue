<template>
  <div v-if="mode === 'simple'" class="simple-progress" :class="{ 'is-locked': !props.skill.unlocked }">
    <div class="left">
      <div class="branch-icon-assembly">
        <div class="branch-background" v-if="!skill.isSkill && !skill.isBranch" :style="branchBackgroundStyle"></div>
        <BngIcon :type="skillIcon" class="assembly-icon" />
      </div>
      {{ $ctx_t(headerLeft) }}
    </div>
    <div class="right" v-html="valueLabelFormat"></div>
  </div>
  <div v-else class="flex-column" :class="{ 'is-locked': !props.skill.unlocked }">
    <BngProgressBar
      class="stat-progress-bar"
      :class="{ short: mode === 'short', isMainProgress: isMainProgress }"
      :headerLeft="$ctx_t(headerLeft)"
      :headerRight="$ctx_t(headerRightLevelOrStars)"
      :value="value"
      :max="max +0.001"
      :showValueLabel="true"
      :valueLabelFormat="''"
      :valueColor="'#eeeeee'"
    />
    <template v-if="!props.skill.unlocked && mode === 'with-value-label' && props.showLockedIcon">
    </template>
    <div class="below-progress-bar" v-if="mode === 'with-value-label'" v-html="belowValueLabelFormat"></div>
  </div>
</template>

<script setup>
import { lua } from "@/bridge"
import { BngProgressBar, BngIcon, icons } from "@/common/components/base"
import { onMounted, ref, computed } from "vue"
import { $translate } from "@/services/translation"
const props = defineProps({
  skill: Object,
  mode: {
    type: String,
    default: 'long',
    validator: (value) => ['long', 'short', 'simple', 'with-value-label'].includes(value)
  },
  showLevel: {
    type: Boolean,
    default: false
  },
  showLockedIcon: {
    type: Boolean,
    default: false
  },
  isMainProgress: {
    type: Boolean,
    default: false
  }
})

// Computed properties for cleaner template logic
const headerLeft = computed(() => props.skill.name)
const headerRightLevelOrStars = computed(() => {
  if (props.skill.isInDevelopment) return ""
  if(!props.skill.unlocked) return $translate.contextTranslate('ui.career.locked')
  if (props.showLevel && props.skill.unlocked) {
  }
  if(props.skill.showProgressAsStars) {
    return $translate.contextTranslate({txt:'ui.career.slashStars', context: { cur: props.skill.value, max: props.skill.max }  })
  }
  if (props.skill.levelLabel) {
    return props.skill.levelLabel
  }
  if (props.skill.level) {
    return $translate.contextTranslate({txt:'ui.career.lvlLabel', context: { lvl: props.skill.level }  })
  }
  return `Level ${props.skill.level}`
})
const value = computed(() => props.skill.max === -1 ? 1 : props.skill.value - props.skill.min)
const max = computed(() => props.skill.max === -1 ? 1 : props.skill.max - props.skill.min)
const valueLabelFormat = computed(() => {

  if (props.skill.isInDevelopment) return $translate.contextTranslate('ui.career.inDevelopment')
  if (!props.skill.unlocked) return $translate.contextTranslate('ui.career.locked')

  if (props.mode === 'simple') {
    if (props.skill.showProgressAsStars) {
      return $translate.contextTranslate({txt:'ui.career.slashStars', context: { cur: value.value, max: max.value }  })
    }
    return $translate.contextTranslate({txt:'ui.career.lvlLabel', context: { lvl: props.skill.level }  })
  }

  let unit = props.skill.showProgressAsStars ? 'Stars' :'XP'
  if (props.skill.max === -1) return $translate.contextTranslate({txt:'ui.career.just'+unit, context: { cur: value.value }  })
  return $translate.contextTranslate({txt:'ui.career.slashXP', context: { cur: value.value, max: max.value }  })
})
const skillIcon = computed(() => {
  if (props.skill.isInDevelopment) {
    return icons.roadblockL
  }
  return props.skill.unlocked ? props.skill.icon || "info" : "lockClosed"
})

const belowValueLabelFormat = computed(() => {
  if(!props.skill.unlocked && props.skill.lockedReason) {
    return $translate.contextTranslate(props.skill.lockedReason?.label || "ui.career.locked")
  }
  if (props.skill.isInDevelopment) {
    return $translate.contextTranslate('ui.career.inDevelopment')
  }
  if (props.skill.isMaxLevel) {
    return "\u200B";
  }
  if (!props.skill.showProgressAsStars) {
    return $translate.contextTranslate({txt:'ui.career.justXP', context: { cur: props.skill.value}  })
  }
})

const branchBackgroundStyle = computed(() => {
  const color = props.skill.accentColor
  if (!color) return { 'background-color': '#555555' }
  if (color.startsWith('--')) return { 'background-color': `var(${color})` }
  if (color.startsWith('#')) return { 'background-color': color }
  return { 'background-color': `rgb(${color})` }
})

</script>

<style scoped lang="scss">
.simple-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05));
  border-radius: var(--bng-corners-1);
  padding: 0.2rem 0.5rem 0.10rem 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  .left {
    flex: 1 0 auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;


    > .branch-icon-assembly {
      position: relative;
      flex: 0 0 auto;
      height: 1.4em;
      width: 1.4em;
      display: flex;
      align-items: center;
      justify-content: center;

      > .branch-background {
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

      > .assembly-icon {
        position: relative;
        font-size: 1.6em;
        z-index: 2;
        justify-self: center;
      }
    }


  }

  .right {
    white-space: nowrap;
    padding-right: 0.25rem;
    .value-label {
      font-weight: bold;
    }
  }
}
.flex-column {
  display: flex;
  flex-direction: column;
}
.stat-progress-bar {
  width: 100%;
  padding-bottom: 0.25rem;
  //font-size: 1.5rem;
  :deep(.progress-bar) {
    height: 0.75rem;
    border-radius: var(--bng-corners-2);
  }
  &.short {
  }

  &.isMainProgress {
    :deep(.header) {
      font-size: 1.8rem;
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }
    .progress-bar {
      height: 1rem;
    }
  }
}
.below-progress-bar {
  flex: 1 0 auto;
  width: 100%;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: right;
  padding-right: 0.25rem;
}
.is-locked {
  color: rgba(255, 255, 255, 0.6);


  .branch-icon-assembly {
    opacity: 0.6;
  }
}
</style>
