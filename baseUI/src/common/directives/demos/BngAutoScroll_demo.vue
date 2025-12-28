<!-- BNGAutoScroll Directive Demo -->
<template>
    <div class="scroller" v-bng-auto-scroll:bottom>
        <div v-for="item in items">
            Item {{ item }}
        </div>
    </div>
    <BngButton @click="() => items++">Add Item</BngButton>The list should automatically scroll to the bottom
</template>

<script setup>
import { ref } from 'vue'
import { vBngAutoScroll } from '@/common/directives'
import { BngButton } from '@/common/components/base';

const items = ref(100)
</script>

<style scoped lang="scss">
.scroller {
    margin:1em;
    overflow-y: auto;
    height: 20em;
    width:15em;
    border: 1px solid #333;
    border-radius: var(--bng-corners-2);
    padding:0.5em;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./BngAutoScroll_demo.vue?raw"
export default {
  source,
  title: "Auto scroll an element",
  description: `Will auto scroll the element to the position specified by the directive's argument - should be either \`top\` or \`bottom\``,
}

</script>