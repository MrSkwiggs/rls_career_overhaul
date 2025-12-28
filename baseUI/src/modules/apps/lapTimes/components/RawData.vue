<template>
  <div class="laptimes-section">
    <h3 @click="toggleCollapse" class="collapsible-header">
      <span class="collapse-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
      Raw Stream Data
    </h3>

    <div v-show="!isCollapsed" class="collapsible-content">
      <div class="raw-data-container">

        <!-- Fast Data Stream -->
        <div class="data-stream" v-if="fastData">
          <h4>Fast Stream Data {{ fastData.timestamp }}</h4>
          <pre class="data-content">{{ JSON.stringify(fastData, null, 1) }}</pre>
        </div>

        <!-- Slow Data Stream -->
        <div class="data-stream" v-if="slowData">
          <h4>Slow Stream Data {{ slowData.timestamp }}</h4>
          <pre class="data-content">{{ JSON.stringify(slowData, null, 1) }}</pre>
        </div>

        <!-- Static Data Stream -->
        <div class="data-stream" v-if="staticData">
          <h4>Static Stream Data {{ staticData.timestamp }}</h4>
          <pre class="data-content">{{ JSON.stringify(staticData, null, 1) }}</pre>
        </div>

        <!-- Placement Data Stream -->
        <div class="data-stream" v-if="placementData">
          <h4>Placement Stream Data {{ placementData.timestamp }}</h4>
          <pre class="data-content">{{ JSON.stringify(placementData, null, 1) }}</pre>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  fastData: {
    type: Object,
    required: true
  },
  slowData: {
    type: Object,
    required: true
  },
  staticData: {
    type: Object,
    required: true
  },
  placementData: {
    type: Object,
    required: true
  }
})

// Collapsible state
const isCollapsed = ref(true) // Start collapsed by default since this is debug info
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped lang="scss">
@use "../common.scss";

.collapsible-header {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;

  &:hover {
    opacity: 0.8;
  }
}

.collapse-icon {
  margin-right: 0.5rem;
  font-size: 0.8rem;
  transition: transform 0.2s ease;
}

.collapsible-content {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.raw-data-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 0.5rem;
}

.data-stream {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.25rem;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);

  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 0.25rem;
  }
}

.data-content {
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  line-height: 1.3;
  color: #ccc;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
  border-radius: 0.125rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;

  /* Custom scrollbar for better visibility */
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }
}

/* Responsive layout for smaller screens */
@media (max-width: 900px) {
  .raw-data-container {
    grid-template-columns: 1fr;
  }
}
</style>
