<!-- bngCard - a generic card -->
<template>
  <!-- TODO: remove bng-card-wrapper so that this component's root class name is 'bng-card' which matches its component name -->
  <div class="bng-card bng-card-wrapper" :class="{ 'with-background-image': backgroundImageStyle }">
    <div class="card-cnt">
      <slot>BNG Card</slot>
    </div>
    <!--  TODO: assess buttonsContainer usage if still necessary or can be removed -->
    <Transition :name="animateFooter ? animateFooterType : ''">
      <div v-if="hasFooter" ref="buttonsContainer" class="footer-container" :style="footerStyles">
        <slot name="buttons"></slot>
        <slot name="footer"></slot>
      </div>
    </Transition>
  </div>
</template>

<script>
const ANIMATION_TYPES = ["fade", "slide"]
</script>

<script setup>
import { useSlots, computed, ref } from "vue"

const props = defineProps({
  backgroundImage: String,
  footerStyles: Object,
  hideFooter: Boolean,
  animateFooter: Boolean,
  animateFooterType: {
    type: String,
    default: "fade",
    validator: value => ANIMATION_TYPES.includes(value),
  },
})

const slots = useSlots()
const hasFooter = computed(() => (slots.footer || slots.buttons) && !props.hideFooter)
const buttonsContainer = ref()
const backgroundImageStyle = computed(() => (props.backgroundImage ? `url('${props.backgroundImage}')` : ""))

defineExpose({
  buttonsContainer,
})
</script>

<style lang="scss" scoped>
.bng-card {
  --bg-opacity: 0.6;
  font-size: 1rem;
  font-family: Overpass, var(--fnt-defs);
  background-color: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
  border-radius: var(--bng-corners-2);
  height: fit-content;

  &.with-background-image {
    background-image: v-bind(backgroundImageStyle);
    background-size: cover;
    background-position: 50% 50%;
    background-repeat: no-repeat;

    > .card-cnt {
      background-color: transparent;
    }
  }

  > .card-cnt {
    overflow: hidden;
    height: inherit;
    border-top-left-radius: var(--bng-corners-2);
    border-top-right-radius: var(--bng-corners-2);

    background-color: rgba(black, var(--bg-opacity));
    display: flex;
    flex-flow: column nowrap;
    // background-color: rgba(black, var(--bg-opacity));
    flex: 0 1 auto;
  }

  > :last-child {
    overflow: hidden;
    border-bottom-left-radius: var(--bng-corners-2);
    border-bottom-right-radius: var(--bng-corners-2);
  }

  > .footer-container {
    background-color: rgba(var(--bng-ter-blue-gray-900-rgb), calc(var(--bg-opacity) + 0.2));
    border-top: 0.125em solid rgba(var(--bng-ter-blue-gray-800-rgb), calc(var(--bg-opacity) + 0.2));
    display: flex;
    justify-content: flex-end;
    padding: 0.5em 0.5em 0.5em 0.5em;
    margin-top: auto;
    flex: 0 0 auto;

    & :first-child:last-child {
      flex: 1 1 auto;
      justify-content: center;
      max-width: unset;
    }
  }

  :deep(.content) {
    padding: 0.5em 0.75em;
  }
}

// ANIMATION STYLES
.fade-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(0.5em);
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.slide-enter-active,
.slide-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(4em);
}
.slide-enter-to,
.slide-leave-from {
  transform: translateY(0);
}
</style>
