<template>
	<GridSelector backendName="appSelector" routePath="/app-selector" :defaultPath="{keys: ['allApps']}" defaultDetailsMode="advanced">
		<template #item-details="{ activeItem, activeItemDetails, executeButton, toggleFavourite }">
			<AppDetails
				:activeItem="activeItem"
				:activeItemDetails="activeItemDetails"
				:executeButton="executeButton"
				:toggleFavourite="toggleFavourite"
			/>
		</template>
	</GridSelector>
</template>

<script setup>
import GridSelector from "@/common/modules/gridSelector/GridSelector.vue"
import AppDetails from "../components/AppDetails.vue"
</script>



