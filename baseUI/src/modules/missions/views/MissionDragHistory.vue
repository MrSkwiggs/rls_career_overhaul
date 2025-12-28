<!-- Drag History -->
<template>
  <LayoutSingle class="drag-history-layout" v-bng-blur>
      <div
        v-if="historyData !== undefined"
        bng-ui-scope="dragHistory"
        class="drag-history-wrapper"
        v-bng-on-ui-nav:back,menu="exit">
        <BngScreenHeading :preheadings="[$t(level)]">{{ $t(name) }} History</BngScreenHeading>
        <div class="drag-history-container" v-if="historyData && historyData.history && historyData.history.length > 0">
          <div class="drag-history-filters">
            <div v-for="filter in filterDefinitions" :key="filter.key" class="filter-item">
              <div class="filter-label">{{ filter.label }}</div>
              <BngDropdown
                v-model="selectedFilters[filter.key]"
                :items="availableFilterOptions[filter.key]"
                :show-search="true"
                @update:modelValue="(val) => handleFilterChange(filter.key, val)"
              />
              <div class="filter-active">
                <div class="filter-buttons" v-if="activeFilters.some(f => f.type === filter.key)">
                  <BngButton
                    v-for="activeFilter in activeFilters.filter(f => f.type === filter.key)"
                    :key="activeFilter.value"
                    size="small"
                    accent="orange"
                    @click="removeFilter(activeFilter)"
                  >
                    {{ activeFilter.value }} ×
                  </BngButton>
                </div>
                <div v-else class="no-filters">No filters selected</div>
              </div>
            </div>
          </div>
          <div class="drag-history-list">
            <div class="drag-history-tab-wrapper" :class="{ 'drag-history-empty': filteredHistory.length === 0 }">
              <template v-if="filteredHistory.length > 0">
                <div
                  bng-nav-item
                  v-bng-sound-class="'bng_click_generic_small'"
                  class="drag-history-item"
                  v-for="entry in filteredHistory"
                  @click="toggleExpand(entry)"
                  :class="{ selected: selectedEntry !== undefined && selectedEntry == entry }">
                  <div class="drag-history-item-content">
                    <div class="drag-history-meta">
                      <div v-bng-relative-time="entry.stripInfo.dateTime"></div>
                    </div>
                    <div class="drag-history-item-label">{{entry.stripInfo.dateTime}}</div>
                  </div>
                </div>
              </template>
              <div v-else class="drag-history-item">
                <div class="drag-history-item-content">
                  <div class="drag-history-item-label">No matches found for current filters</div>
                </div>
              </div>
            </div>
          </div>

          <div class="drag-history-details">
            <BngCard class="drag-history-content-card">
              <BngCardHeading class="drag-history-heading" type="ribbon">
                {{ $t(level) }} - {{ $t(name) }}
              </BngCardHeading>
              <template v-if="filteredHistory.length > 0">
                <div class="drag-history-slip-wrap" v-if="selectedEntry">
                  <Timeslip class="drag-history-slip-item" :slip="selectedEntry" />
                </div>
              </template>
              <div v-else class="drag-history-empty-message">
                No timeslips match the selected filters. Try adjusting your filter criteria.
              </div>
            </BngCard>
          </div>
        </div>
        <div v-else class="drag-history-container">
          <div class="drag-history-list">
            <div class="drag-history-tab-wrapper drag-history-empty">
              <div class="drag-history-item">
                <div class="drag-history-item-content">
                  <div class="drag-history-item-label">No History Available</div>
                </div>
              </div>
            </div>
          </div>

          <div class="drag-history-details">
            <BngCard class="drag-history-content-card">
              <BngCardHeading class="drag-history-heading" type="ribbon">
                {{ $t(level) }} - {{ $t(name) }}
              </BngCardHeading>
              <div class="drag-history-empty-message">
                No drag race history yet. Start a practice run or play a drag race challenge!
              </div>
            </BngCard>
          </div>
        </div>
      </div>
  </LayoutSingle>
</template>

<script setup>
import { LayoutSingle } from "@/common/layouts"
import { BngButton, ACCENTS, BngScreenHeading, BngDropdown, BngCard, BngCardHeading, BngUnit, BngBinding } from "@/common/components/base"
import { Tabs, Tab, DynamicComponent } from "@/common/components/utility"
import { vBngRelativeTime, vBngBlur, vBngSoundClass, vBngOnUiNav } from "@/common/directives"
import { $content, $translate } from "@/services"
import Timeslip from '@/modules/apps/dragRace/Timeslip.vue';
import { lua } from "@/bridge"
import { ref, computed, onMounted } from "vue"
//import RewardsPills from "../components/progress/RewardsPills.vue"
import { useUINavScope } from "@/services/uiNav"
useUINavScope("dragHistory") // UI Nav events to fire from (or from focused element inside) element with attribute: bng-ui-scope="dragHistory"

const props = defineProps({
     id: { type: String, required: true },
     name: { type: String, required: true },
     level: { type: String, required: true }
   })

const entryId = computed(() => (props.id !== undefined ? ("" + props.id).replace(/\%/g, "/") : undefined))
const name = computed(() => (props.name !== undefined ? props.name : undefined))
const level = computed(() => (props.level !== undefined ? props.level : undefined))

const historyData = ref(undefined)

const value = ref(null)

const filterDefinitions = [
  { key: 'brand', label: 'Brand' },
  { key: 'country', label: 'Country' },
  { key: 'drivetrain', label: 'Drivetrain' },
  { key: 'fuelType', label: 'Fuel Type' },
  { key: 'transmission', label: 'Transmission' },
  { key: 'configType', label: 'Config Type' },
  { key: 'inductionType', label: 'Induction Type' },
  { key: 'tree', label: 'Tree Type' }
]

const selectedFilters = ref({})
const activeFilters = ref([])

const availableFilterOptions = computed(() => {
  if (!historyData.value?.history) return {}

  const options = {}

  filterDefinitions.forEach(filter => {
    options[filter.key] = new Set()
  })

  historyData.value.history.forEach(entry => {
    const vehicleInfo = entry.racerInfos[0]
    filterDefinitions.forEach(filter => {
      if (filter.key === 'tree') {
        if (entry.tree) {
          options[filter.key].add(entry.tree)
        }
      } else if (vehicleInfo[filter.key]) {
        options[filter.key].add(vehicleInfo[filter.key])
      }
    })
  })
  return Object.fromEntries(
    Object.entries(options).map(([key, values]) => [
      key,
      [...values].sort().map(value => ({
        label: value,
        value: value
      }))
    ])
  )
})

const filteredHistory = computed(() => {
  if (!historyData.value?.history || activeFilters.value.length === 0) {
    return historyData.value?.history || []
  }

  return historyData.value.history.filter(entry => {
    const vehicleInfo = entry.racerInfos[0]
    return activeFilters.value.some(filter => {
      if (filter.type === 'tree') {
        return entry.tree === filter.value
      }
      return vehicleInfo[filter.type] === filter.value
    })
  })
})

function setup(data) {
  historyData.value = data
  if (historyData.value && historyData.value.history && Array.isArray(historyData.value.history) && historyData.value.history.length > 0) {
    toggleExpand(historyData.value.history[0])
  }
}

const entry = ref({}),
  selectedEntry = ref(undefined)

const toggleExpand = entry => setTimeout(()=>{
  if (selectedEntry.value !== entry) selectedEntry.value = entry
},0)

const handleFilterChange = (filterKey, selectedValue) => {
  if (!selectedValue) return

  if (activeFilters.value.some(f => f.type === filterKey && f.value === selectedValue)) {
    return
  }

  const newFilterIndex = filterDefinitions.findIndex(f => f.key === filterKey)
  const insertIndex = activeFilters.value.findIndex(f =>
    filterDefinitions.findIndex(fd => fd.key === f.type) > newFilterIndex
  )

  const newFilter = {
    type: filterKey,
    value: selectedValue
  }

  if (insertIndex === -1) {
    activeFilters.value.push(newFilter)
  } else {
    activeFilters.value.splice(insertIndex, 0, newFilter)
  }

  selectedEntry.value = filteredHistory.value[0]
}

const exit = () => window.bngVue.gotoGameState("play")

const start = () => {
  lua.gameplay_drag_dragBridge.getHistory(entryId.value).then(setup)
  filterDefinitions.forEach(filter => {
    selectedFilters.value[filter.key] = null
  })
}

const removeFilter = (filterToRemove) => {
  activeFilters.value = activeFilters.value.filter(f =>
    !(f.type === filterToRemove.type && f.value === filterToRemove.value)
  )
  selectedFilters.value[filterToRemove.type] = null

  selectedEntry.value = filteredHistory.value[0]
}

onMounted(start)

</script>

<style lang="scss" scoped>

$textcolor: #fff;
$fontsize: 1rem;

.drag-history-layout {

  --safezone-top: 0;
  --safezone-bottom: var(--safezone-new-info-bar);
  --content-flow: column nowrap;
  color: $textcolor;
  font-size: $fontsize;
  :deep(.layout-content) {
  }
}

.drag-history-wrapper {
  display: flex;
  flex-flow: column;
  width: max-content;
  height: 100%;
  align-self: center;
  justify-self: center;
  padding-top: 1rem;
  .drag-history-container{
    display: flex;
    flex-flow: row;
    width: 100%;
    height: 100%;
    overflow: hidden;
    .drag-history-filters{
      display: flex;
      flex-direction: column;
      width: 10vw;
      min-width: 12rem;
      background-color: var(--bng-black-o6);
      border-radius: var(--bng-corners-2);
      margin-right: 1vh;
      max-height: 100%;
      overflow-y: auto;

      .filter-item {
        margin: 0.5vh 1vh 0 1vh;
        color: white;

        .filter-label {
          color: white;
          margin-bottom: 0.5vh;
          font-weight: 800;
        }

        :deep(.bng-dropdown) {
          width: fit-content;

          .dropdown-toggle {
            color: white;
          }

          .dropdown-menu {
            color: white;
          }
        }
      }

      .active-filters-container {
        margin-top: 1vh;
        color: white;

        .filter-group {
          margin-top: 1vh;

          .filter-type {
            color: white;
            margin-bottom: 0.5vh;
          }

          .filter-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5vh;

            :deep(.bng-button) {
              margin-right: 0.5vh;
            }
          }
        }
      }
    }
    .drag-history-list {
      display: flex;
      flex-direction: column;
      flex: 0 0 auto;

      .drag-history-tab-wrapper{
        border-radius: var(--bng-corners-2);
        overflow: hidden;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: var(--bng-black-o6);

        .drag-history-item {
          display: flex;
          flex: 0 0 1;
          flex-direction: column;
          border-radius: var(--bng-corners-2);
          margin-top: 0.5rem;
          margin-left: 0.5rem;
          margin-right: 0.5rem;
          background-color: var(--bng-black-o6);
          position: relative;
          box-shadow: inset 0px 0 0 transparent;
          box-sizing: border-box;
          transition: all 0.2s ease-in-out;
          color: white;
          min-height: max-content;
          cursor: pointer;

          .drag-history-item-content {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            padding: 1em 1.5em 0.625em 1em;
            z-index: 9;
            .drag-history-meta {
              display: flex;
              flex-direction: row;
              justify-content: flex-start;
              align-items: baseline;
              color: var(--bng-cool-gray-200);
              flex: 0 0 auto;
              font-family: var(--fnt-defs) !important;
              line-height: 1.5em;
            }

            .drag-history-item-label {
              padding: 0.2em 0 0 0;
              font-size: 1.25em;
              font-weight: 800;
              line-height: 125%;
              flex: 1 0 auto;
              font-family: "Overpass", var(--fnt-defs);
            }
          }

        }
        .drag-history-item.selected:after {
          box-shadow: inset -0.25em 0 0 var(--bng-orange-600);
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0;
          width: 25%;
          background: linear-gradient(270deg, rgba(255, 102, 0, 0.4) 0%, rgba(255, 102, 0, 0) 100%);
          border-radius: 0 var(--bng-corners-1) var(--bng-corners-1) 0;
          z-index: 7;
        }
      }
    }

    .drag-history-details {
      display: flex;
      flex-direction: column;
      padding-left: 0.5rem;

      .drag-history-content-card {
        display: flex;
        flex: 1 0 auto;
        overflow: hidden auto;
        background-color: var(--bng-ter-blue-gray-900) !important;
        height: 100%;
        & :deep(.card-cnt) {
          background-color: var(--bng-ter-blue-gray-900) !important;
        }

        .drag-history-slip-wrap{
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2vh;
          max-width: 30rem;
          :deep(.timeslip){
            font-size: 1vw;
          }

        .drag-history-slip-item{
          width: 19vw;
          height: 30vw;
        }
        }
      }
    }
  }
  .drag-history-container-nodata{
    display: flex;
    background-color: var(--bng-ter-blue-gray-900);
    color: #fff;
    padding: 4rem;
    border-radius: var(--bng-corners-2);
  }
}

.drag-history-content-card .drag-history-heading {
  color: #fff;
}

.drag-history-content-card .drag-history-meta {
  color: #fff;
  padding-left: 2.5em;
}

.drag-history-empty {
  opacity: 0.5;

  .drag-history-item {
    pointer-events: none;

    .drag-history-item-label {
      color: var(--bng-cool-gray-200);
      font-style: italic;
    }
  }
}

.drag-history-empty-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
  color: var(--bng-cool-gray-200);
  font-size: 1.2em;
  font-style: italic;
}

.no-filters {
  color: grey;
  font-size: 1em;
  font-style: italic;
}

</style>