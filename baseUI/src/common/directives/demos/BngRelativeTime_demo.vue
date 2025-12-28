<!-- BNGRelativeTime Directive Demo -->
<template>
	<BngButton :accent="ACCENTS.secondary" tabindex="1" @click="randomise">Randomise datetime</BngButton><br />
	<span v-bng-relative-time="+datetime / 1000"></span><br />({{ datetime.toLocaleString("en-gb") }})
</template>

<style scoped>
.bng-button {
	margin-bottom: 1em;
}
span {
	font-weight: bold;
}
</style>

<script setup>
import { BngButton, ACCENTS } from "@/common/components/base"
import { ref } from "vue"

import { vBngRelativeTime } from "@/common/directives"

const datetime = ref(new Date())

function randomise() {
	const now = new Date()
	const dir = Math.random() > 0.5 ? -1 : 1
	datetime.value = randomDate(new Date(+now - 4 * 60 * 60 * 1000 * dir), now)
}

function randomDate(start, end) {
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}
</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./BngRelativeTime_demo.vue?raw"
export default {
  source,
  title: "TODO - Friendly name",
  description: `TODO - Description of directive`,
  propInfo: [],
  attrInfo: [],
}

</script>

