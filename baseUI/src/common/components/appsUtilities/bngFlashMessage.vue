<template>
  <div class="message-container">
    <div class="message" :class="['message', animationClass, fontSizeClass]">
      {{ txt }}
    </div>
  </div>
</template>

<script setup>
import { useEvents } from '@/services/events'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBridge } from '@/bridge'

const props = defineProps({
  messageSource: {
    type: String,
    default: 'ScenarioFlashMessage',
  }
})

const events = useEvents()
const { api } = useBridge()
const txt = ref('')
const messageQueue = ref([])
const stepTimeout = ref(null)
const animationClass = ref('')
const fontSizeClass = ref('font-small')
const paused = ref(false)

onMounted(() => {
  events.on(props.messageSource, (data) => {

    // Check if data is an array or an object
    if (Array.isArray(data)) {
      // If the data is an array, map it to an object
      data.forEach((item) => {
        const messageObject = {
          msg: item[0],                 // First element as the actual message
          ttl: item[1],                 // Second element as the time-to-live (in seconds)
          luaCall: item[2] && typeof item[2] === 'string' ? item[2] : undefined,  // Lua call if provided and is a string
          jsCallback: item[2] && typeof item[2] === 'function' ? item[2] : undefined, // JS callback if provided and is a function
          big: item[3] !== undefined ? item[3] : false // Fourth element as "big" flag, defaults to false if not provided
        };
        messageQueue.value.push(messageObject)
      });
      // Call the animation function after adding messages
      if (messageQueue.value.length > 0 && !stepTimeout.value) {
        playMessagesAnimation();
      }
    } else if (typeof data === 'object') {
      // If the data is an object, directly push it into the queue
      const messageObject = {
        msg: data.msg,                                 // The actual message
        ttl: data.ttl,                                 // Time-to-live (in seconds)
        luaCall: data.luaCall || undefined,            // Lua call if provided
        jsCallback: data.jsCallback || undefined,      // JS callback if provided
        big: data.big !== undefined ? data.big : false // "big" flag, defaults to false if not provided
      }
      messageQueue.value.push(messageObject)
      // Start the animation if no current animation is in progress
      if (!stepTimeout.value) {
        playMessagesAnimation();
      }
    } else {
      console.warn('Unexpected data format received for FlashMessage')
    }
  })

  events.on('physicsStateChanged', (state) => {
    paused.value = !state;
    if (paused.value) {
      if (stepTimeout.value) {
        clearTimeout(stepTimeout.value); // Clear active timeout
        stepTimeout.value = null; // Reset timeout reference
      }
    } else if (state) {
      playMessagesAnimation(); // Resume message animation if not paused
    }
  });
})

onUnmounted(() => {
  if (stepTimeout.value) {
    clearTimeout(stepTimeout.value) // Clear timeout to avoid memory leaks
    stepTimeout.value = null // Reset after clearing
  }
})

function playMessagesAnimation() {
  if (messageQueue.value.length === 0) {
    resetCountdown()
    return
  }

  // Start the animation for the first message
  animationClass.value = 'fade-in' // Apply fade-in class

  setTimeout(() => {
    animationClass.value = '' // Remove fade-in after it's done
  }, 200)

  const msg = messageQueue.value[0]

  // Set the text and font size class
  txt.value = msg.msg // Set the message text
  fontSizeClass.value = msg.big ? 'font-large' : 'font-small' // Set large or default font size class based on 'big' property

  // Handle Lua call if provided
  if (msg.luaCall && typeof msg.luaCall === 'string') {
    api.engineLua(msg.luaCall) // Assuming `bngApi` is accessible globally
  }

  // Handle JavaScript callback if provided
  if (msg.jsCallback && typeof msg.jsCallback === 'function') {
    msg.jsCallback() // Execute the callback function
  }

  // Remove the processed message from the queue
  messageQueue.value.shift()


  // Set fade-out animation
  setTimeout(() => {
    animationClass.value = 'fade-out';
  }, (msg.ttl * 1000) - 200)

  // Set the timeout for the next message
  stepTimeout.value = setTimeout(() => {
    playMessagesAnimation();
  }, msg.ttl * 1000)
}

// Reset the message queue and clear the timeout
function resetCountdown() {
  if (stepTimeout.value) {
    clearTimeout(stepTimeout.value)
  }
  messageQueue.value = []
  txt.value = ''
  stepTimeout.value = null // Reset the timeout reference to null
}

</script>

<style lang="scss" scoped>
.message-container {
  min-height: 4rem;

  @keyframes message-fade-in {
    0% {
      opacity: 0;
      text-shadow: 0px 0px 2rem var(--bng-off-white);
      transform: scale(1.3);
    }
    100% {
      opacity: 1;
      text-shadow: 0px 0px 0rem var(--bng-off-white);
      transform: scale(1);
    }
  }

  @keyframes message-fade-out {
    0% {
      opacity: 1;
      text-shadow: 0px 0px 0rem var(--bng-off-white);
      transform: scale(1);
    }
    100% {
      opacity: 0;
      text-shadow: 0px 0px 3rem var(--bng-off-white);
      transform: scale(0);
    }
  }

  .message {
    font-family: 'Overpass', var(--fnt-defs);
    font-weight: 700;
    font-style: italic;
    text-align: center;
    line-height: 1.1em;
    margin: 0.5rem 0 0 0;
    padding: 0.25rem 1rem;
    color: var(--flash-message-color, var(--bng-off-white));
    &.font-small {
      font-size: 2.25rem;
    }
    &.font-large {
      font-size: 8rem;
    }
    &.fade-in {
      animation: message-fade-in 0.2s 1 backwards;
    }
    &.fade-out {
      animation: message-fade-out 0.2s 1;
    }
  }
}
</style>
