<template>
  <div class="objective-panel">
    <div class="objective-heading">Schedule</div>
    <div class="objective-schedule">
      <div>
        {{ scheduleStr }}
      </div>
        <div>
          <span class="status-value">{{ statusStr }}</span>
          <!-- <span v-if="latenessStr" class="separator">|</span> -->
        </div>
        <div>
          <span class="lateness-value" :class="latenessClass" v-html="latenessStr"></span>
        </div>
    </div>
    <div class="objective-heading">Rally School</div>
    <div class="objective-instructions">{{ instructions }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  scheduleStr: {
    type: String,
    default: ''
  },
  statusStr: {
    type: String,
    default: ''
  },
  latenessStr: {
    type: String,
    default: ''
  },
  latenessType: {
    type: String,
    default: null
  },
  instructions: {
    type: String,
    default: ''
  }
})

const latenessClass= computed(() => {
  if (props.latenessType === 'late') {
    return 'lateness-value-late'
  } else if (props.latenessType === 'early') {
    return 'lateness-value-early'
  } else {
    return 'lateness-value-on-time'
  }
})
</script>

<style lang="scss" scoped>
.objective-panel {
  padding: 0 0.25rem;

  // --color-white: rgba(255, 255, 255, 1);

  .objective-heading {
    font-size: 1.1rem;
    color: var(--color-theme);
    font-style: italic;
    font-weight: bold;
    // margin-top: 0.15rem;
    // margin-bottom: 0.25rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }

  .objective-schedule {
    font-size: 1.3rem;
    color: var(--color-white);
    border-bottom: 1px solid var(--color-theme);
    padding: 0 0.25rem 0.25rem 0.25rem;
  }

  .objective-instructions {
    font-size: 1.3rem;
    font-style: italic;
    color: var(--color-white);
    line-height: 1.4;
    padding: 0 0.25rem 0.25rem 0.25rem;
  }

  .no-objective {
    color: var(--color-white);
    text-align: center;
    font-style: italic;
  }

  .status-value {
    color: var(--color-white);
  }

  .lateness-value {
    color: var(--color-white);
  }

  // .status-value {
    // padding-right: 1.0rem;
  // }

  .lateness-value-late {
    color: var(--color-red-light);
  }

  .lateness-value-early {
    color: var(--color-red-light);
  }

  .lateness-value-on-time {
    color: var(--color-green);
  }

  .separator {
    padding: 0 0.5rem;
  }
}
</style>

