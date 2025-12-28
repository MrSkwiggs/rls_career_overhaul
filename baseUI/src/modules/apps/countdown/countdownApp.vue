<template>
  <bng-flash-message :message-source="'CountdownMessage'" />
</template>

<script setup>
import { onMounted } from 'vue'
import { useEvents } from '@/services/events'
import BngFlashMessage from '@/common/components/appsUtilities/bngFlashMessage.vue'

const events = useEvents()

// TODO: Fix the data on LUA side please - convert to object format directly
function convertLegacyMessage(data) {
  if (Array.isArray(data)) {
    return data.map(item => ({
      msg: typeof item[0] === 'object' ? item[0].txt : item[0],
      ttl: item[1],
      luaCall: typeof item[2] === 'string' ? item[2] : undefined,
      jsCallback: typeof item[2] === 'function' ? item[2] : undefined,
      big: item[3] ?? false
    }));
  }
  return data; // If already in object format
}

// Listen for legacy format messages
onMounted(() => {
  events.on('ScenarioFlashMessage', (data) => {
    const convertedData = convertLegacyMessage(data);

    // Add callback to the last message if it's a countdown sequence
    if (Array.isArray(convertedData) && convertedData.length > 0) {
      const lastMessage = convertedData[convertedData.length - 1];
      if (lastMessage.msg === "GO!") {
        lastMessage.jsCallback = () => {
          events.emit('CountdownEnded');
        };
      }
    }

    events.emit('CountdownMessage', convertedData);
  });

  // Cleanup on scenario end
  events.on('ScenarioNotRunning', () => {
    events.emit('CountdownMessage', { msg: '', ttl: 0 });
  });
})
</script>

<style lang="scss" scoped>
// No styles needed as they are handled by the bngFlashMessage component
</style>
