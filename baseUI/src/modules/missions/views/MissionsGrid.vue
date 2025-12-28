<template>
  <LayoutSingle
    v-bng-blur
    class="layout-content-full flex-column"
    bng-ui-scope="missions-grid">
    <BngScreenHeading  divider>
      Challenges
    </BngScreenHeading>

    <div class="content-container">
        <!-- Tile List Demo -->
      <!--
      <div class="list-demo">
        <BngList class="list" :target-width="100" :target-margin="0.5">
          <TileGroup v-for="groupKey in data.groupKeys" :label="data.groupsByKey[groupKey].label" :meta="data.groupsByKey[groupKey].meta">
            <template v-for="id in data.groupsByKey[groupKey].tileIdsUnsorted">
              <MissionTile :name="data.tilesById[id].name" :image="data.tilesById[id].image"/>
            </template>
          </TileGroup>
        </BngList>
      </div>
      -->
      <div class="grid-list" v-if="data && data.groupsByKey">
          <!--
        <TileGroup class="list" v-for="groupKey in data.groupKeys" :label="data.groupsByKey[groupKey].label" :meta="data.groupsByKey[groupKey].meta">
        </TileGroup>
        -->

        <template v-for="groupKey in data.groupKeys" >
          <!-- remove this condition for hardcore testing lol -->
          <template v-if="data.groupsByKey[groupKey].propName == 'Type'">
            <div class="label">
              {{data.groupsByKey[groupKey].label}}
            </div>
            <template  v-for="id in data.groupsByKey[groupKey].tileIdsUnsorted">
              <MissionTile class="card" :card="data.tilesById[id]" @click="cardClicked(id)" v-if="data.tilesById[id].expandGroupKey"/>
              <template v-if="data.tilesById[id].expanded" v-for="subId in data.groupsByKey[data.tilesById[id].expandGroupKey].tileIdsUnsorted ">
                <MissionTile class="card" :card="data.tilesById[subId]" @click="cardClicked(subId)"/>
              </template>
            </template>
          </template>
        </template>
      </div>
      <div class="details-panel">
        Panel
      </div>
    </div>
  </LayoutSingle>
</template>


<script setup>
import { computed, onBeforeMount, onUnmounted, reactive, watch, ref } from "vue"
import { storeToRefs } from "pinia"
import { $translate } from "@/services"
import { useUINavScope } from "@/services/uiNav"
import {
  BngImageCarousel,
  BngButton,
  ACCENTS,
  BngScreenHeading,
  BngSelect,
  BngDivider,
  BngSwitch,
  BngSlider,
  BngInput,
  BngPropVal,
  BngIcon,
  icons,
  BngList
} from "@/common/components/base"
import { SlotSwitcher } from "@/common/components/utility"
import { LayoutSingle } from "@/common/layouts"
import { vBngBlur } from "@/common/directives"
import { vBngOnUiNav } from "@/common/directives"
import { useMissionDetailsStore } from "@/modules/missions/stores/missionDetailsStore"
import MissionTile from "@/modules/missions/components/MissionTile.vue"
import TileGroup from "@/modules/missions/components/TileGroup.vue"
import AspectRatio from "@/common/components/utility/aspectRatio.vue"
import { lua, useBridge } from "@/bridge"

const uiNavScope = useUINavScope("missions-grid")
//const store = useMissionDetailsStore()

//const { availableMissions, selectedMission, missionBasicInfo, missionProgress, missionSettings, missionStartableDetails } = storeToRefs(store)

const data = ref({})

onBeforeMount(async () => {
//  await store.init()
  data.value = await lua.core_vehicles.getVehicleTiles()
})

onUnmounted(() => {
//  store.$dispose()
})

function cardClicked(id) {
  let card = data.value.tilesById[id]
  if(!id) return

  if(card.expandGroupKey) {
    card.expanded = !card.expanded
  }
}


</script>

<style scoped lang="scss">

.content-container {
  flex: 1 1 auto;
  display: flex;

  .list-demo {
    flex: 1 1 auto;
    background-color: #8888;
    display: flex;
    flex-direction:column;
    overflow: auto;
    .label {

    }
  }
  .grid-list {
    flex: 1 1 auto;
    background-color: #8888;
    display: grid;
    gap: 0.5rem;
    padding: 0.5rem;
    grid-template-columns: repeat(auto-fill, minmax(12em, 1fr));
    overflow-y:scroll;
    .card {
      height: 8rem;
    }
    .label {
      grid-column: 1 / -1;
      font-style: italic;
      font-size: 1.5em;
      font-weight: 600;
      color: white;
    }
  }

    

  .details-panel {
    flex: 0 1 30rem;
    background-color: #8888;
    margin-left: 1rem;
  }
}

</style>
