<template>
  <div
    class="level-configuration-modal popup"
    :bng-ui-scope="scopeName"
    v-bng-on-ui-nav:back,menu="handleCancelWithBack"
  >
    <div class="popup-content">
      <div class="modal-header">
        <h2>Freeroam Spawning Options</h2>
        <BngIcon
          type="xmarkBold"
          class="close-button"
          @click="closeModal"
          :color="'var(--bng-cool-gray-100)'"
        />
      </div>

      <!-- Vehicle Selector -->
      <div class="vehicle-selector-section">
        <h3 class="group-title">Vehicle</h3>
        <div class="vehicle-tile-wrapper">
          {{ vehicleTile }}
          <Tile
            :tile="vehicleTile"
            displaySize="small"
            :isConfig="true"
            @click="openVehicleSelector"
          />
        </div>
      </div>

      <div class="modal-content">
        <!-- Selected Spawnpoint Section -->
        <div class="spawnpoint-section">
          <h3>Selected Spawnpoint</h3>
          <div class="spawnpoint-info">
            <div class="spawnpoint-preview" v-if="levelData?.spawnPoint?.previews?.[0]">
              <img :src="levelData.spawnPoint.previews[0]" alt="Spawnpoint preview" />
            </div>
            <div class="spawnpoint-name">
              {{ $tt(levelData?.spawnPoint?.translationId || "No Name?") }}
            </div>
          </div>
        </div>

        <!-- Configuration Options -->
        <div class="config-section" v-if="spawningOptions.length > 0">
          <div class="config-group" v-for="group in spawningOptions" :key="group.name">
            <h3 class="group-title">{{ group.name }}</h3>
            <div class="config-item" v-for="option in group.options" :key="option.key">
              <label v-if="option.label">
                <BngIcon v-if="option.icon" :type="option.icon" class="option-icon" />
                {{ option.label }}:
              </label>

              <!-- Select dropdown for all options -->
              <BngSelect
                v-model="config[option.key]"
                :options="option.options"
                loop
                :config="{ value: opt => opt.value, label: opt => opt.label }"
                @update:modelValue="(newValue) => handleOptionChange(option.key, newValue)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Always show dialogue checkbox -->
      <div class="always-show-section">
        <BngSwitch
          v-model="alwaysShowDialogue"
          @update:modelValue="handleAlwaysShowDialogueChange"
          label="Always show this dialogue"
          labelBefore
        />
      </div>

      <div class="modal-footer" v-if="spawningOptions.length > 0 || (levelData?.buttonInfo && levelData.buttonInfo.length > 0)">
        <!-- Dynamic buttons from buttonInfo -->
        <template v-if="levelData?.buttonInfo && levelData.buttonInfo.length > 0">
          <BngButton
            v-for="button in levelData.buttonInfo"
            :key="button.buttonId"
            :label="button.label"
            :icon="button.icon"
            :accent="button.primary ? 'main' : 'secondary'"
            @click="handleButtonClick(button.buttonId)"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch, provide } from "vue"
import { BngButton, BngIcon, BngSelect, BngSwitch } from "@/common/components/base"
import { vBngOnUiNav } from "@/common/directives"
import { usePopupUINavScopeName } from "@/services/uiNav"
import { useUINavBlocker } from "@/services/uiNavTracker"
import { useBridge } from "@/bridge"
import Tile from "@/common/modules/gridSelector/components/Tile.vue"

const navBlocker = useUINavBlocker()
navBlocker.allowNavigationOnly()

const { lua, events } = useBridge()

const props = defineProps({
  levelData: {
    type: Object,
    required: true
  },
})

const emit = defineEmits(["return"])

const scopeName = usePopupUINavScopeName("_levelConfigPopup", props)

// Provide a dummy gridSelectionState so Tile's inject() doesn't break when used outside Grid
provide("gridSelectionState", ref(null))

// Dynamic options loaded from Lua backend
const spawningOptions = ref([])

// Configuration state - will be populated dynamically
const config = reactive({})

// Checkbox state for "always show this dialogue"
const alwaysShowDialogue = ref(false)

// Vehicle tile model
const vehicleTile = ref({})

// Load spawning options from Lua backend
const loadSpawningOptions = async () => {
  try {
    const levelName = props.levelData?.levelName
    const backendName = props.levelData?.backendName
    const result = await lua.ui_gameplaySelector_tileGenerators_levelTiles.getSpawningOptions(levelName, backendName)

    if (result) {
      // Handle new structure with options and alwaysShowDialogue
      const options = result.options || []
      spawningOptions.value = options
      alwaysShowDialogue.value = result.alwaysShowDialogue || false

      // Vehicle tile from backend (mock supported)
      if (result.vehicleTile) {
        vehicleTile.value = {
          key: "vehicle-selector",
          name: result.vehicleTile.name || "Select Vehicle",
          preview: result.vehicleTile.preview || "/ui/modules/vehicleSelector/placeholder.png",
          sourceIcons: result.vehicleTile.sourceIcons || [],
        }
      } else {
        vehicleTile.value = {
          key: "vehicle-selector",
          name: "Select Vehicle",
          preview: "/ui/modules/vehicleSelector/placeholder.png",
          sourceIcons: [],
        }
      }

      // Initialize config with current values
      options.forEach(group => {
        if (group.options && Array.isArray(group.options)) {
          group.options.forEach(option => {
            if (option.key && option.value !== undefined) {
              config[option.key] = option.value
            }
          })
        }
      })
    }
  } catch (error) {
    console.error("Failed to load spawning options:", error)
    // Leave options empty if Lua doesn't return proper data
  }
}

// Handle option changes directly from select elements
const handleOptionChange = async (key, newValue) => {
  try {
    await lua.ui_gameplaySelector_tileGenerators_levelTiles.changeSpawningOption(key, newValue)
    // Trigger refresh of current item details
    events.emit("gridSelectorRefreshCurrentItemDetails", "freeroamSelector")
  } catch (error) {
    console.error(`Failed to update ${key} option:`, error)
  }
}

// Handle checkbox change
const handleAlwaysShowDialogueChange = async (newValue) => {
  try {
    const backendName = props.levelData?.backendName
    await lua.ui_gameplaySelector_tileGenerators_levelTiles.setAlwaysShowDialogue(backendName, newValue)
    events.emit("gridSelectorRefreshCurrentItemDetails", "freeroamSelector")
  } catch (error) {
    console.error("Failed to save default action preference:", error)
  }
}

// Open vehicle selector from modal
const openVehicleSelector = async () => {
  try {
    await lua.ui_vehicleSelector_general.openVehicleSelectorForFreeroamModal()
    emit("return", true)
  } catch (e) {
    console.error("Failed to open vehicle selector:", e)
  }
}

// Load options when component mounts
onMounted(() => {
  loadSpawningOptions()
})

const closeModal = () => {
  emit("return", false)
}

const handleButtonClick = (buttonId) => {
  closeModal()
  events.emit("gridSelectorExecuteButton", "freeroamSelector", buttonId)
}

const handleCancelWithBack = () => {
  closeModal()
}
</script>

<style scoped lang="scss">
.level-configuration-modal {
  display: flex;
  flex-direction: column;
  background-color: rgba(var(--bng-ter-blue-gray-800-rgb), 0.95);
  border-radius: 0.5rem;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;

  &.popup {
    .popup-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(var(--bng-ter-blue-gray-400-rgb), 0.3);
  background-color: rgba(var(--bng-ter-blue-gray-700-rgb), 0.8);
  gap: 1rem;


  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--bng-cool-gray-100);
  }

  .close-button {
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
    background-color: rgba(var(--bng-ter-blue-gray-600-rgb), 0.25);

    &:hover {
      background-color: rgba(var(--bng-ter-blue-gray-600-rgb), 0.5);
    }
  }
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.spawnpoint-section {
  h3 {
    margin: 0 0 0.75rem 0;
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--bng-cool-gray-100);
    border-bottom: 1px solid rgba(var(--bng-ter-blue-gray-400-rgb), 0.2);
    padding-bottom: 0.5rem;
  }
}

.spawnpoint-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.spawnpoint-preview {
  width: 200px;
  height: 100px;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: rgba(var(--bng-ter-blue-gray-600-rgb), 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.spawnpoint-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--bng-cool-gray-100);
  text-align: center;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.config-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--bng-cool-gray-100);
  border-bottom: 1px solid rgba(var(--bng-ter-blue-gray-400-rgb), 0.2);
  padding-bottom: 0.5rem;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--bng-cool-gray-200);
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .option-icon {
      font-size: 1rem;
      color: var(--bng-cool-gray-300);
    }
  }
}

.always-show-section {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(var(--bng-ter-blue-gray-400-rgb), 0.3);
  background-color: rgba(var(--bng-ter-blue-gray-700-rgb), 0.5);
  >* {
    width: calc(100% - 1.5rem);
  }
}

.vehicle-selector-section {
  padding: 0 1.5rem 1rem 1.5rem;
}

.vehicle-tile-wrapper {
  padding: 0.25rem 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(var(--bng-ter-blue-gray-400-rgb), 0.3);
  background-color: rgba(var(--bng-ter-blue-gray-700-rgb), 0.8);

  > * {
    width: 100%;
  }
}
</style>
