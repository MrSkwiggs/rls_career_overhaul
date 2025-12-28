<template>
	<LayoutSingle class="layout-content-full layout-align-center">
		Single content layout
	</LayoutSingle>
</template>

<script setup>
	import { LayoutSingle } from '@/common/layouts'

</script>

<style scoped lang="scss">
	.layout-content-full {
		pointer-events:none; // to allow 'view source' button to work
	}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./layoutSingle_demo.vue?raw"
export default {
  source,
  title: "TODO - Friendly name",
  description: `TODO - Description of layout`,
  propInfo: [],
  attrInfo: [],
}

</script>
