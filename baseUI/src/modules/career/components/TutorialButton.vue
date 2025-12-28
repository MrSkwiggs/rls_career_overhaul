<template>
  <BngButton ref="buttonRef" class="tut-btn" :icon="icon" @click.stop="clickHandler"
    :class="{blink : !seen}" v-bng-tooltip="!text ? 'View tutorial for this section' : undefined"
    >
    <!--:class="{ blink: !seen }"-->
    <span v-if="text">{{ text }}</span>
  </BngButton>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { BngButton, icons } from "@/common/components/base";
import { vBngTooltip } from "@/common/directives";
import { lua } from "@/bridge";
const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  icon: {
    type: Object,
    default: () => icons.questionmark
  },
  pages: {
    type: Object,
    default: [],
  }
});

const buttonRef = ref(null);
let animationInterval = null;
const seen = ref(true)

function clickHandler() {
  for(let key of props.pages){
    lua.career_modules_linearTutorial.introPopup(key, true)
  }
  seen.value = true;
}

onMounted(() => {
  //lua.career_modules_linearTutorial.wasIntroPopupsSeen(Object.values(props.pages)).then((s) => {seen.value = s;})
});

onUnmounted(() => {
});
</script>

<style scoped lang="scss">
.tut-btn {
  min-width: unset !important;
  :deep(.icon) {
    padding-right: 0 !important;
  }
}

@keyframes blink {
  from { color:white; }
  to { color:orange }
}

.blink {
  animation: blink 1s linear infinite;
}

</style>
