<template>
  <bng-flash-message :message-source="'SimpleFlashMessage'" />
</template>

<script setup>
import { onMounted } from 'vue'
import { useEvents } from '@/services/events'
import BngFlashMessage from '@/common/components/appsUtilities/bngFlashMessage.vue'

const events = useEvents()

// Listen for legacy format messages
onMounted(() => {
  events.on('ScenarioFlashMessage', (data) => {
    const convertedData = Array.isArray(data) ? data.map(item => ({
      msg: typeof item[0] === 'object' ? item[0].txt : item[0],
      ttl: item[1],
      luaCall: typeof item[2] === 'string' ? item[2] : undefined,
      jsCallback: typeof item[2] === 'function' ? item[2] : undefined,
      big: item[3] ?? false
    })) : data;

    events.emit('SimpleFlashMessage', convertedData);
  });

  // Cleanup on scenario end
  events.on('ScenarioNotRunning', () => {
    events.emit('SimpleFlashMessage', { msg: '', ttl: 0 });
  });
})
</script>

<style lang="scss" scoped>
// No styles needed as they are handled by the bngFlashMessage component
</style>
