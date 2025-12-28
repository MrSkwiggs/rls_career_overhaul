<template>
  <LayoutSingle class="cargo-overview-main-layout" bng-ui-scope="delivery" ref="screenCover">
    <div class="screen" @click="cargoOverviewStore.cardDeselect()" @click.capture="popHideAll">
      <div v-if="cargoOverviewStore.cargoData" class="heading-container">
        <BngScreenHeading :preheadings="['Delivery Mode']" divider>
          {{ cargoOverviewStore.cargoData.facility ? cargoOverviewStore.cargoData.facility.name : "My Cargo" }}
        </BngScreenHeading>
        <BngCard class="status-container">
          <CareerStatus />
          <div class="status-add">
            <BngPropVal
              v-for="(skill, index) in cargoOverviewStore.cargoData.skillLevels"
              :key="index"
              :iconType="icons[skill.icon]"
              :valueLabel="$ctx_t(skill.levelLabel)"
            />
            <BngPropVal
              v-if="cargoOverviewStore.cargoData.facility && cargoOverviewStore.cargoData.facility.organization"
              :iconType="icons.peopleOutline"
              :valueLabel="$ctx_t(cargoOverviewStore.cargoData.facility.organization.reputation.label)" />
            <!--
          <div class="item">
            Penalty for abandoning deliveries:
            <BngUnit :money="cargoOverviewStore.cargoData.player.penaltyForAbandon" />
          </div>
          <div class="item">
            Reward sum:
            <BngUnit :money="cargoOverviewStore.cargoData.player.loadedCargoMoneySum" />
          </div>
          <div class="item">
            Cargo weight:
            {{ units.buildString("weight", cargoOverviewStore.cargoData.player.weightSum, 1) }}
          </div>
            -->
          </div>
        </BngCard>
      </div>

      <div class="controls-row">
        <BngButton class="back-button" :accent="ACCENTS.attention" v-bng-on-ui-nav:back,menu.asMouse @click="close">
          <BngBinding ui-event="back" deviceMask="xinput" />
          {{ $t("ui.common.close") }}
        </BngButton>
        <!-- TODO: add shoulder-buttons to cycle tabs/filter -->
        <!-- NOTE - to do this, these should be replaced with Tabs, since PillFilters were not designed for this and are being used inappropriately here -->
        <!-- Do not start hacking around with PillFilters to try to accomodate this -->
        <BngPillFilters
          ref="tabPills"
          required
          v-if="cargoOverviewStore.cargoData && cargoOverviewStore.filterSets && facilityId"
          v-model="selectedFilters"
          :options="cargoOverviewStore.filterSets"
          @valueChanged="cargoOverviewStore.selectFilter" />
        <!-- TODO only include filters based on showInFilterTabs properties
        <div style="color:white">
          <template v-for="filter in cargoOverviewStore.filterSets">
            {{filter.value}} {{filter.showInFilterTabs}}
          </template>
        </div>-->
        <BngButton v-if="!facilityId && cargoOverviewStore.cargoData && cargoOverviewStore.cargoData.player.penaltyForAbandon.money < 0" accent="attention" :iconLeft="icons.trashBin1" @click="exitMode" class="right-button">
          Abandon all deliveries
        </BngButton>
      </div>

      <div v-if="cargoOverviewStore.cargoData" class="content-container">
        <div class="panel-flex" :class="{ reverse: !facilityId }" v-if="!cargoOverviewStore.selectedFilter.isFacilityPage || !facilityId">
          <BngCard class="content-row provided-orders-panel" v-if="facilityId">
            <div class="header-container">
              <BngCardHeading type="ribbon" class="cardHeadingFlex wide" v-if="cargoOverviewStore.selectedFilter">
                <span>{{ cargoOverviewStore.selectedFilter.label }}</span>
                <!--<BngButton class="right" @click="cargoOverviewStore.openCargoScreenSettings" :accent="'text'" :icon="icons.order" v-bng-tooltip="'Filters'" />-->
                <TutorialButton
                  class="howto-button right"
                  accent="secondary"
                  :icon="icons.help"
                  v-if="cargoOverviewStore.selectedFilter.howTo"
                  :pages="cargoOverviewStore.selectedFilter.howTo.pages">
                </TutorialButton>
              </BngCardHeading>
              <div class="info-line">
                <BngIcon :type="icons.info" />
                <span>{{ cargoOverviewStore.selectedFilter.shortDescription }}</span>
              </div>
              <div class="header-flex padding">
                <BngButton
                  class="groupSortButton"
                  :accent="ACCENTS.text"
                  :icon="icons.group"
                  v-bng-popover:bottom.click="'facility-grouping'"
                  @click.stop>
                  Grouping:
                  {{ cargoOverviewStore.cargoData.facilityCardGroupSets[cargoOverviewStore.facilityGroupingKey].label }}
                </BngButton>
                <BngPopoverMenu name="facility-grouping" focus @show="popShown" @hide="popHidden">
                  <template #default="{ hide }">
                    <BngButton
                      v-for="key in cargoOverviewStore.facilityGroupings"
                      :key="key"
                      :accent="ACCENTS.menu"
                      :class="{ selected: cargoOverviewStore.facilityGroupingKey === key }"
                      v-bng-on-ui-nav:ok.focusRequired.asMouse
                      @click.stop="
                        () => {
                          cargoOverviewStore.facilityGroupingKey = key
                          hide()
                        }
                      ">
                      {{ cargoOverviewStore.cargoData.facilityCardGroupSets[key].label }}
                    </BngButton>
                  </template>
                </BngPopoverMenu>

                <div class="groupSortButtons">
                  <BngButton
                    class="groupSortButton"
                    :accent="ACCENTS.text"
                    :icon="icons.order"
                    v-bng-popover:bottom.click="'facility-sorting'"
                    @click.stop>
                    Sorting:
                    {{ cargoOverviewStore.cargoData.sortingSets[cargoOverviewStore.facilitySortingKey].label }}
                  </BngButton>
                  <BngButton class="groupSortButtonSmall" :accent="ACCENTS.text"
                    :icon="facilitySortAsc ? icons.sortAsc : icons.sortDesc"
                    v-bng-tooltip:top="facilitySortAsc ? 'Ascending order' : 'Descending order'"
                    @click.stop="facilitySortAsc = !facilitySortAsc" />
                </div>
                <BngPopoverMenu name="facility-sorting" focus @show="popShown" @hide="popHidden">
                  <template #default="{ hide }">
                    <BngButton
                      v-for="key in cargoOverviewStore.facilitySortings"
                      :key="key"
                      :accent="ACCENTS.menu"
                      :class="{ selected: cargoOverviewStore.facilitySortingKey === key }"
                      v-bng-on-ui-nav:ok.focusRequired.asMouse
                      @click="
                        () => {
                          cargoOverviewStore.facilitySortingKey = key
                          hide()
                        }
                      ">
                      {{ cargoOverviewStore.cargoData.sortingSets[key].label }}
                    </BngButton>
                  </template>
                </BngPopoverMenu>
              </div>
            </div>
            <div class="separator"></div>

            <div class="scroll-panel">
              <template v-if="cargoOverviewStore.currentFilterTutorialInfo?.tasks">
                <div class="tasklist">
                  <div class="tasklist-header">
                    {{ cargoOverviewStore.selectedFilter.label }} Tutorial
                  </div>
                  <div class="task" v-for="task in cargoOverviewStore.currentFilterTutorialInfo.tasks" :key="task.label">
                    <BngIcon class="icon" :type="icons[task.done ? 'checkboxOn' : 'checkboxOff']" />
                    <div class="task-content">
                      <div class="heading">
                        {{ task.label }}
                      </div>
                      <div class="description">
                        {{ task.description }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <ProvidedOrdersPanel
                :groupSets="cargoOverviewStore.cargoData.facilityCardGroupSets"
                :groupIdx="cargoOverviewStore.facilityGroupingKey"
                :sortingSets="cargoOverviewStore.cargoData.sortingSets"
                :sortIdx="cargoOverviewStore.facilitySortingKey"
                :sortAsc="facilitySortAsc"
                @cardHovered="cargoOverviewStore.cardHovered"
                @cardClicked="cargoOverviewStore.cardClicked" />
            </div>
          </BngCard>

          <div class="content-row selected-and-map-panel" :class="{ wide: !facilityId }">
            <BngCard class="cargo-detail" v-if="facilityId">
              <CargoCard
                v-if="cargoOverviewStore.focusedCargo || cargoOverviewStore.selectedCargo"
                :card="cargoOverviewStore.focusedCargo || cargoOverviewStore.selectedCargo"
                detailed
                :show-buttons="
                  (!cargoOverviewStore.focusedCargo && cargoOverviewStore.selectedCargo) || cargoOverviewStore.focusedCargo === cargoOverviewStore.selectedCargo
                " />
              <div v-else class="empty-cargo-card">Select a card to view details.</div>
            </BngCard>

            <div class="map" ref="mapPanel">
              <!-- TODO: click to open map, route distance...-->
              <div class="header-container">
                <div class="header-flex">
                  <BngCardHeading type="ribbon" class="cardHeading wide">
                    {{ $t(cargoOverviewStore.cargoData.levelInfo.name) }}
                  </BngCardHeading>
                  <BngSwitch v-model="cargoOverviewStore.automaticRoute" @click.stop> Automatic route </BngSwitch>
                </div>
              </div>

              <div class="map-overlay" v-if="!facilityId">
                <BngCard class="cargo-detail">
                  <CargoCard
                    v-if="cargoOverviewStore.focusedCargo || cargoOverviewStore.selectedCargo"
                    :card="cargoOverviewStore.focusedCargo || cargoOverviewStore.selectedCargo"
                    detailed
                    :show-buttons="
                      (!cargoOverviewStore.focusedCargo && cargoOverviewStore.selectedCargo) || cargoOverviewStore.focusedCargo === cargoOverviewStore.selectedCargo
                    " />
                  <div v-else class="empty-cargo-card">
                    Select a card to view details.
                  </div>
                </BngCard>
              </div>
            </div>
          </div>

          <BngCard class="content-row my-cargo-panel">
            <div class="header-container">
              <BngCardHeading type="ribbon" class="cardHeadingFlex wide">
                <span>My Cargo</span>
                <!--<BngButton class="right" @click.stop="cargoOverviewStore.openCargoScreenSettings" :accent="ACCENTS.text" :icon="icons.order" v-bng-tooltip="'Filters'" />-->
                <TutorialButton class="howto-button right" accent="secondary" :icon="icons.help" :pages="['delivery/myCargo', 'delivery/parcelDelivery']" />
              </BngCardHeading>
              <div class="info-line">
                <BngIcon :type="icons.info" />
                <span>Check your loaded cargo and other delivery-related tasks.</span>
              </div>
              <div class="header-flex wrap padding">
                <BngButton
                  class="groupSortButton"
                  :accent="ACCENTS.text"
                  :icon="icons.group"
                  v-bng-popover:bottom.click="'player-grouping'"
                  @click.stop>
                  Grouping:
                  {{ cargoOverviewStore.cargoData.playerCardGroupSets[cargoOverviewStore.playerGroupingKey].label }}
                </BngButton>
                <BngPopoverMenu name="player-grouping" focus @show="popShown" @hide="popHidden">
                  <template #default="{ hide }">
                    <BngButton
                      v-for="key in cargoOverviewStore.playerGroupings"
                      :key="key"
                      :accent="ACCENTS.menu"
                      :class="{ selected: cargoOverviewStore.playerGroupingKey === key }"
                      v-bng-on-ui-nav:ok.focusRequired.asMouse
                      @click="
                        () => {
                          cargoOverviewStore.playerGroupingKey = key
                          hide()
                        }
                      ">
                      {{ cargoOverviewStore.cargoData.playerCardGroupSets[key].label }}
                    </BngButton>
                  </template>
                </BngPopoverMenu>

                <div class="groupSortButtons">
                  <BngButton
                    class="groupSortButton"
                    :accent="ACCENTS.text"
                    :icon="icons.order"
                    v-bng-popover:bottom.click="'player-sorting'"
                    @click.stop>
                    Sorting:
                    {{ cargoOverviewStore.cargoData.sortingSets[cargoOverviewStore.playerSortingKey].label }}
                  </BngButton>
                  <BngButton class="groupSortButtonSmall" :accent="ACCENTS.text"
                    :icon="playerSortAsc ? icons.sortAsc : icons.sortDesc"
                    v-bng-tooltip:top="playerSortAsc ? 'Ascending order' : 'Descending order'"
                    @click.stop="playerSortAsc = !playerSortAsc" />
                </div>
                <BngPopoverMenu name="player-sorting" focus @show="popShown" @hide="popHidden">
                  <template #default="{ hide }">
                    <BngButton
                      v-for="key in cargoOverviewStore.playerSortings"
                      :key="key"
                      :accent="ACCENTS.menu"
                      :class="{ selected: cargoOverviewStore.playerSortingKey === key }"
                      v-bng-on-ui-nav:ok.focusRequired.asMouse
                      @click.stop="
                        () => {
                          cargoOverviewStore.playerSortingKey = key
                          hide()
                        }
                      ">
                      {{ cargoOverviewStore.cargoData.sortingSets[key].label }}
                    </BngButton>
                  </template>
                </BngPopoverMenu>

                <div class="cargohold-info">
                  <template v-for="(group, index) in cargoOverviewStore.cargoData.playerCardGroupSets['totalStorages'].groups" :key="index">
                    <CargoInfo class="info-with-gradient" v-if="group.meta.totalCargoSlots" :meta="group.meta" />
                  </template>
                </div>
              </div>
            </div>

            <div class="separator"></div>

            <div class="scroll-panel padding">
              <template v-if="cargoOverviewStore.selectedFilter.noContainers">
                <BngCard class="no-container-card">
                  <div class="content">
                    <span>
                      <BngIcon :type="icons.info" />
                      You do not have any containers installed that can load this type of cargo.
                    </span>
                    <TutorialButton
                      class="button"
                      accent="secondary"
                      :icon="icons.help"
                      :pages="['delivery/cargoContainerHowTo']"
                      :text="'How do I install cargo containers?'" />
                  </div>
                </BngCard>
              </template>
              <ProvidedOrdersPanel
                :groupSets="cargoOverviewStore.cargoData.playerCardGroupSets"
                :groupIdx="cargoOverviewStore.playerGroupingKey"
                :sortingSets="cargoOverviewStore.cargoData.sortingSets"
                :sortIdx="cargoOverviewStore.playerSortingKey"
                :sortAsc="playerSortAsc"
                :ignoreFilter="true"
                @cardHovered="cargoOverviewStore.cardHovered"
                @cardClicked="cargoOverviewStore.cardClicked" />
            </div>

            <div class="buttons-wrapper" v-if="cargoOverviewStore.cargoData && facilityId">
              <!--<BngButton class="cancel-button" accent="attention" :icon="icons.undo" @click.stop="close">
            Discard
          </BngButton>-->
              <BngButton class="accept-button" :icon="icons.checkmark" @click.stop="acceptLoad" v-if="cargoOverviewStore.cargoData.confirmButtonInfo.itemCount > 0">
                Continue ({{ cargoOverviewStore.cargoData.confirmButtonInfo.itemCount }} items)
              </BngButton>
            </div>
          </BngCard>
        </div>

        <BngCard class="detailedFilterSelector" v-else>
          <div class="content flex-container">
            <BngCard class="info-left">
              <BngCardHeading v-if="cargoOverviewStore.cargoData.facility.organization" type="ribbon" class="cardHeadingFlex">
                <span>
                <span>Reputation:&nbsp;</span>
                <span>{{cargoOverviewStore.cargoData.facility.organization.reputation.label +
                      ' (lvl ' +
                      cargoOverviewStore.cargoData.facility.organization.reputation.level +
                      ')'}}
                    </span>
                  </span>
                <BngButton :icon="icons.signal05a" accent="secondary" @click="gotoOrganizations(cargoOverviewStore.cargoData.facility.organization.id)">Progress</BngButton>
               </BngCardHeading >
              <div class="header-flex progress-bar-padding" v-if="cargoOverviewStore.cargoData.facility.organization">
                <BngIcon class="progress-icon" :type="icons.peopleOutline" />
                <div class="progress-bar-wrapper wide" v-if="cargoOverviewStore.cargoData.facility.organization">
                  <BngProgressBar
                    class="bar"
                    gradient
                    :value="cargoOverviewStore.cargoData.facility.organization.reputation.value"
                    :max="cargoOverviewStore.cargoData.facility.organization.reputation.nextThreshold"
                    :min="cargoOverviewStore.cargoData.facility.organization.prevThreshold"
                    :showValueLabel="false"

                    />
                </div>
              </div>
              <AspectRatio class="image" :ratio="'5:3'" :external-image="cargoOverviewStore.cargoData.facility.preview"> </AspectRatio>
              <BngCardHeading type="ribbon" class="cardHeading"> Facility Information </BngCardHeading>
              <div class="content text-justify" v-html="$content.bbcode.parse(cargoOverviewStore.cargoData.facility.longDescription)"></div>
            </BngCard>

            <div class="info-right">
              <template v-for="(panel, index) in cargoOverviewStore.cargoData.facilityPanels" :key="index">
                <BngCard class="panel">
                  <BngCardHeading type="ribbon" class="cardHeadingFlex">
                    <span>
                      <span>{{ panel.heading }}:&nbsp;</span>
                      <span v-if="panel.skillInfo">{{panel.skillInfo.unlocked ? $ctx_t(panel.skillInfo.levelLabel) : ''}}</span>
                    </span>
                    <BngButton v-if="panel.skillInfo" :icon="icons.signal05a" accent="secondary" @click="gotoSkillProgress(panel)">Progress</BngButton>
                  </BngCardHeading>
                  <div class="header-flex progress-bar-padding"  v-if="panel.skillInfo">
                      <BngIcon class="progress-icon" :type="icons[panel.skillInfo.icon]" />
                      <div class="progress-bar-wrapper wide">
                        <BngProgressBar
                          class="bar"
                          gradient

                          :value="panel.skillInfo.max == -1 ? 1 : panel.skillInfo.value - panel.skillInfo.min"
                          :max="panel.skillInfo.max == -1 ? 1 : panel.skillInfo.max - panel.skillInfo.min"
                          :showValueLabel="true"
                          :valueLabelFormat="panel.skillInfo.max === -1 ? 'Max' : panel.skillInfo.value + '&nbspXP'" />
                      </div>
                  </div>
                  <div class="content">
                    <span>
                      <BngIcon :type="icons.info" />
                      {{ panel.description }}
                    </span>
                    <div class="filterSelectGrid">
                      <FilterCard v-for="filterKey in panel.filterValueButtons" :key="filterKey" :filter="cargoOverviewStore.filterSetsByValue[filterKey]" />

                      <!--<ServiceButton
                        v-if="panel.externalButtons"
                        v-for="btn in panel.externalButtons"
                        :label="btn.label"
                        @click.stop="extButtonClicked(btn.externalButtonId)" />-->
                    </div>
                  </div>
                </BngCard>
              </template>
            </div>
          </div>

          <!--
        <div class="info-right panel-grid">







        </div>

-->

          <!--


        <BngCardHeading type="ribbon" class="cardHeading" >
          Progress
        </BngCardHeading>
        <div class="progress-wrapper content">
          <template v-for="skill in cargoOverviewStore.cargoData.skillLevels">
            <div class="progress-bar-wrapper">
              <BngIcon class="icon" :type="icons[skill.icon]"/>
              <BngProgressBar
                v-if="branchKey != 'labourer' || skills.length > 1"
                class="bar"
                :headerLeft="$ctx_t(skill.name)"
                :headerRight="skill.unlocked ? $ctx_t(skill.levelLabel) : ''"
                :value="skill.max == -1 ? 1 : skill.value - skill.min"
                :max="skill.max == -1 ? 1 : skill.max - skill.min"
                :showValueLabel="true"
                :valueLabelFormat="skill.max === -1 ? 'Max' : skill.value + '&nbspXP'" />
              </div>
          </template>

        </div>
        {{cargoOverviewStore.cargoData.facility.thumbnail}}
        <BngCardHeading type="ribbon" class="cardHeading" >
          Facility Information
        </BngCardHeading>
        <div class="flex-description">
          <span>
          Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
        </span>
        <br>
        <br>
        <span>
          Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
        </span>


        </div>
        < !--
        <BngCardHeading type="ribbon" class="cardHeading" >
          Delivery
        </BngCardHeading>
        <div class="content">
          Select any of these filters to start delivering goods and earn money and reputation.
          <TutorialButton class="howto-button" accent="text" :icon="icons.help" :pages="['delivery/cargoScreen']" :text="'How does this screen work?'"
          />


        </div>

        <template v-if="cargoOverviewStore.filterSetsDetailed.other.length > 0">
          <BngCardHeading type="ribbon" class="cardHeading" >
            Other Services
          </BngCardHeading>
          <div class="content">
            Any other services this facility has to offer.
            <div class="filterSelectGrid">
              <template v-for="filter in cargoOverviewStore.filterSetsDetailed.other">
                <FilterCard :filter="filter" v-if="!filter.hideDetailed" />
              </template>
            </div>

          </div>
        </template>
        <div class="buttons-wrapper" >
          <BngButton class="accept-button" :icon="icons.checkmark" @click.stop="close" v-if="cargoOverviewStore.cargoData.confirmButtonInfo.itemCount > 0">
            Continue ({{cargoOverviewStore.cargoData.confirmButtonInfo.itemCount}} items)
          </BngButton>

      </div>
      -->
        </BngCard>
      </div>
    </div>
  </LayoutSingle>
</template>
<script></script>

<script setup>
import { lua } from "@/bridge"
import { useCargoOverviewStore } from "../stores/cargoOverviewStore"
import { ref, watch, onMounted, onBeforeUnmount, onUnmounted, nextTick } from "vue"
import {
  BngCard,
  BngCardHeading,
  BngSwitch,
  icons,
  BngPropVal,
  BngPillFilters,
  BngIcon,
  BngButton,
  BngProgressBar,
  BngPopoverMenu,
  BngScreenHeading,
  BngBinding,
  ACCENTS,
} from "@/common/components/base"
import { AspectRatio } from "@/common/components/utility"
import { vBngPopover, vBngTooltip, vBngOnUiNav } from "@/common/directives"
import { useUINavScope } from "@/services/uiNav"
import { CareerStatus } from "@/modules/career/components"
import ProvidedOrdersPanel from "../components/cargoOverview/panels/ProvidedOrdersPanel.vue"
import CargoCard from "../components/cargoOverview/CargoCard.vue"
import FilterCard from "../components/cargoOverview/FilterCard.vue"
import CargoInfo from "../components/cargoOverview/CargoInfo.vue"
import { LayoutSingle } from "@/common/layouts"
import TutorialButton from "@/modules/career/components/TutorialButton.vue"
import { openConfirmation } from "@/services/popup"
import { $content } from "@/services"

const tabPills = ref()

useUINavScope("delivery")

const props = defineProps({
  facilityId: String,
  parkingSpotPath: String,
})

const cargoOverviewStore = useCargoOverviewStore()

const updateCargoDataAll = () => {}

async function openDiscardPopupExtButton(id) {
  const res = await openConfirmation(null, "Discard Changes?")
  if (res) {
    lua.career_modules_delivery_cargoScreen.cancelDeliveryConfiguration()
    lua.career_modules_delivery_cargoScreen.exitCargoOverviewScreen()
    lua.career_modules_delivery_cargoScreen.deliveryScreenExternalButtonPressed(id)
  } else {
  }
}

const extButtonClicked = (id) => {
  if (cargoOverviewStore.cargoData.confirmButtonInfo.itemCount > 0 && props.facilityId) {
    openDiscardPopupExtButton(id)
  } else {
    lua.career_modules_delivery_cargoScreen.cancelDeliveryConfiguration()
    lua.career_modules_delivery_cargoScreen.exitCargoOverviewScreen()
    lua.career_modules_delivery_cargoScreen.deliveryScreenExternalButtonPressed(id)
  }
}

async function openDiscardPopup() {
  const res = await openConfirmation(null, "Discard Changes?")
  if (res) {
    lua.career_modules_delivery_cargoScreen.cancelDeliveryConfiguration()
    lua.career_modules_delivery_cargoScreen.exitCargoOverviewScreen()
    window.bngVue.gotoGameState("play")
  } else {
  }
}
//exiting screen
const close = () => {
  if (cargoOverviewStore.cargoData.confirmButtonInfo.itemCount > 0 && props.facilityId) {
    openDiscardPopup()
  } else {
    lua.career_modules_delivery_cargoScreen.exitCargoOverviewScreen()
    window.bngVue.gotoGameState("play")
  }
}

const acceptLoad = () => {
  lua.career_modules_delivery_cargoScreen.commitDeliveryConfiguration()
  lua.career_modules_delivery_cargoScreen.exitCargoOverviewScreen()
  window.bngVue.gotoGameState("play")
}

async function openExitModePopup() {
  const res = await openConfirmation(null, "Throw away all cargo and exit delivery mode?")
  if (res) {
    lua.career_modules_delivery_cargoScreen.exitDeliveryMode()
    lua.career_modules_delivery_cargoScreen.exitCargoOverviewScreen()
    window.bngVue.gotoGameState("play")
  } else {
  }
}

const exitMode = () => {
  openExitModePopup()
}

async function gotoSkillProgress(panel) {
  if (cargoOverviewStore.cargoData.confirmButtonInfo.itemCount > 0) {

  } else {
    window.bngVue.gotoGameState("branchPage", { params: { branchKey:panel.branchId, skillKey:panel.skillId } })
  }
}

async function gotoOrganizations(id) {
  if (cargoOverviewStore.cargoData.confirmButtonInfo.itemCount > 0) {

  } else {
    window.bngVue.gotoGameState("organizations", { params: { orgId : id } })
  }
}

/// sorting asc/desc
const facilitySortAsc = ref(false)
const playerSortAsc = ref(true)

const activePopovers = {}
const popShown = pop => nextTick(() => activePopovers[pop.name] = pop)
const popHidden = pop => nextTick(() => delete activePopovers[pop.name])
function popHideAll() {
  for (const pop of Object.values(activePopovers))
    pop.hide()
}

// map resize
const screenCover = ref()
const mapPanel = ref(null)
let observer, mapClipChanged
function resizer() {
  const elScreen = screenCover.value?.$el || screenCover.value
  if (!mapPanel.value || !elScreen) {
    if (mapClipChanged) {
      mapClipChanged = false
      screenCover.value.style.setProperty("--map-clip", "unset")
    }
    return
  }
  const pad = 3 // padding in pixels
  const { width, height } = elScreen.getBoundingClientRect()
  let rect = mapPanel.value.getBoundingClientRect()
  const relative = [(rect.x + pad) / width, (rect.y + pad) / height, (rect.x + rect.width - pad) / width, (rect.y + rect.height - pad) / height]
  const percentile = relative.map(n => `${n * 100}%`)
  elScreen.style.setProperty(
    "--map-clip",
    `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${percentile[0]} ${percentile[1]}, ${percentile[0]} ${percentile[3]}, ${percentile[2]} ${percentile[3]}, ${percentile[2]} ${percentile[1]}, ${percentile[0]} ${percentile[1]})`
  )
  mapClipChanged = true

  // FIXME: please try `relative` variable :)
  // `relative` is in a form of [0.3, 0.2, 0.5, 0.9] (x1, y1, x2, y2), relative to the screen, so it might be easier to use it instead
  lua.freeroam_bigMapMode.setBigmapScreenBounds({ width, height }, rect)
}

// when element changes
watch(
  () => mapPanel.value,
  (elm, prev) => {
    prev && observer.unobserve(prev)
    elm && observer.observe(elm)
  },
  { immediate: true }
)
// when we're in or out of facility overview screen
watch(
  () => cargoOverviewStore.selectedFilter?.isFacilityPage,
  () => nextTick(resizer)
)

// switch filters
const selectedFilters = ref([])
watch(
  () => cargoOverviewStore.selectedFilter,
  filter => {
    selectedFilters.value = [filter.value]
    cargoOverviewStore.focusedCargo = null
  }
)

//mounting and unmounting
onMounted(() => {
  observer = new ResizeObserver(resizer)
  resizer()
  cargoOverviewStore.requestCargoData(props.facilityId, props.parkingSpotPath)
  // set initial filter (don't use watcher for immediate set)
  selectedFilters.value = [cargoOverviewStore.selectedFilter.value]
})
onBeforeUnmount(() => {
  observer?.disconnect()
})
onUnmounted(() => {
  lua.career_modules_delivery_cargoScreen.exitCargoOverviewScreen()
  cargoOverviewStore.menuClosed()
})
</script>

<style lang="scss" scoped>
.cargo-overview-main-layout {
  --safezone-top: 0;
  --safezone-bottom: 0;
  --content-flow: column nowrap;
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    clip-path: var(--map-clip);
    background-color: var(--bng-cool-gray-900);
    background-image: url("/ui/ui-vue/src/modules/career/components/cargoOverview/cargoScreenBackgroundBlurred.jpg");
    background-position: 50% 50%;
    background-size: cover;
  }
}

.screen {
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  justify-content: stretch;
  width: 100%;
  height: 100%;
  padding: 1.5rem;
  overflow: hidden;
}

.heading-container {
  flex: 0 0 auto;

  position: relative;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: flex-start;

  box-sizing: border-box;
  align-self: stretch;

  > :deep(.bng-screen-heading) {
    margin: 0;
    flex: 1 auto;
  }

  .status-container {
    position: absolute;
    top: 0;
    right: 0;
    border-radius: var(--bng-corners-2);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    .status-add {
      text-align: center;
      padding: 0.25rem 0.5rem;
    }
  }
}

.controls-row {
  display: flex;
  flex-flow: row nowrap;
  align-items: baseline;
  padding: 1em 0;
  .back-button {
    margin-right: 1rem;
  }
  .right-button {
    position: absolute;
    right: 1.5rem;
  }
}

.content-container {
  flex: 1 1 auto;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  > * {
    height: 100%;
    max-height: 100%;
  }
}

:deep(.bng-card-wrapper > .card-cnt) {
  flex: 1 1 auto;
}
.content {
  padding: 0 !important; // override for BngCard rule
}

.text-justify {
  text-align: justify;
}

.cardHeading,
.cardHeadingFlex {
  color: white;
}
.cardHeadingFlex {
  display: flex;
  align-items: center;
  // margin-left: -1rem;
  margin-bottom:0.25rem;
  > span:first-child {
    // a title assumed
    align-self: start;
    margin-top: 0.25em;
    flex: 1 1 auto;
  }
  &::before {
    top: 0.25em;
  }
  &.wide {
    > * {
      flex: 0 0 auto;
    }
    > span:first-child {
      flex: 1 1 auto;
    }
  }
}

.detailedFilterSelector {
  color: white;
  background-color: var(--bng-ter-blue-gray-700);
  > :deep(.card-cnt) {
    padding: 1rem;
  }

  .flex-container {
    display: flex;
    flex-flow: row nowrap;
    align-items: stretch;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .info-left {
    flex: 0 0 35rem;
    width: 35rem;
    height: 100%;
    max-height: 100%;
    padding: 1rem 0 1rem 1rem;
    overflow: hidden;
    :deep(.card-cnt) {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      .content {
        flex: 0 0 auto;
        width: 100%;
        height: 20%;
        max-height: 20%;
        padding: 0 1rem !important;
        overflow: hidden auto;
      }
    }
  }

  .info-right {
    flex: 1 0 auto;
    display: flex;
    flex-flow: row wrap;
    align-items: stretch;
    width: 50%;
    max-height: 100%;
    padding-left: 1rem;
    overflow: hidden auto;

    .panel {
      flex: 1 0 auto;
      height: auto;
      // min-height: 18rem;
      // padding-right: 1rem;
      // padding-bottom: 1rem;
      padding: 1rem;

      &:last-child {
        //padding-bottom: 0;
      }
      .content {
        padding: 0 1rem !important;
      }
    }
  }

  .filterSelectGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 14rem));
    justify-content: stretch;
    align-content: start;
    width: 100%;
    height: auto;
    gap: 0.75rem;
    padding: 1rem 0.75rem;
    > * {
      width: unset;
      margin: 0 !important;
    }
  }
}

.progress-icon {
  font-size: 2.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  font-style: normal;
}

.progress-bar-wrapper {
  min-width: 10rem;
  padding: 0 0.5rem;
  flex: 1 0 auto;
  display: flex;
  .bar {
    flex: 1 0 auto;
  }
}

.progress-bar-padding {
  padding-bottom: 1rem;
  padding-left: 0.5rem;
}

.header-flex {
  display: flex;
  align-items: center; /* Align items vertically center if needed */
  width: 100%; /* Fill whole width */
  padding-right: 0.5rem;
  &.wrap {
    flex-wrap: wrap;
  }
  &.nowrap {
    flex-wrap: nowrap;
  }
}

.header-flex .wide {
  flex: 1 1 auto;
}

.cargohold-info {
  flex: 1 1 auto;
  display: flex;
  flex-flow: row nowrap;
  // margin: 0 auto; // centers container when there's a space
  // margin: 0 0 0 auto; // moves to the right
  > * {
    flex: 1 1 auto;
    min-width: 5em;
    max-width: 10em;
    margin: 0 0.25rem;
    background-image: linear-gradient(180deg, rgba(var(--bng-cool-gray-700-rgb), 0.5) 0.251rem, rgba(var(--bng-cool-gray-700-rgb), 0.25) 100%);
    :deep(.header) {
      padding-top: 0;
    }
    :deep(.props) {
      padding-right: 0;
      flex: 1 1 auto;
      justify-content: center;
    }
  }
}

.scroll-panel {
  overflow-y: scroll;
  flex: 1 1 auto;
  padding-bottom: 0.5rem;
}
.panel-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  height: 100%;
  position: relative;
  overflow: hidden;

  color: #fff;

  > * {
    flex: 0 0 calc(33% - 0.5rem);
    width: calc(33% - 0.5rem);
  }

  > .wide {
    flex: 0 0 calc(67% - 0.5rem);
    width: calc(67% - 0.5rem);
  }

  &.reverse {
    flex-direction: row-reverse;
    justify-content: center;
  }

  .content-row {
    align-self: stretch;
    height: auto;
  }

  .provided-orders-panel {
    color: white;
    background-color: var(--bng-ter-blue-gray-700);
  }
  .my-cargo-panel {
    background-color: var(--bng-ter-blue-gray-700);
    grid-column: 3;
  }

  .selected-and-map-panel {
    display: flex;
    flex-direction: column;
    align-content: stretch;
    overflow: hidden;

    &.wide {
      max-width: 90rem;
    }

    .cargo-detail {
      flex: 0 0 auto;
      margin-bottom: 1rem;
      background-color: var(--bng-ter-blue-gray-700);

      .empty-cargo-card {
        color: white;
        min-height: 20rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        background-color: rgba(0, 0, 0, 0.6);
        border-radius: var(--bng-corners-2);
      }
    }

    .map {
      flex: 1 1 auto;
      border: 3px solid #000;

      > .header-container {
        background-color: rgba(0, 0, 0, 0.6);
        height: 3.8rem;
      }

      .map-overlay {
        padding: 1rem;
        .cargo-detail {
          width: 30%;
          min-width: 35rem;
          max-width: 100%;
        }
      }
    }
  }

  .no-container-card {
    color: white;
    padding: 0.2rem 1rem;
    .content {
      display: flex;
      flex-flow: column;
      align-items: stretch;
      padding-right: 1.4rem;
      .button {
        max-width: 100%;
        width: 100%;
      }
    }

    .header-container {
      width: 100%;
      height: 8.5rem;
      color: white;
    }

    .padding {
      padding-left: 0.5rem;
    }

    .groupSortButton {
      flex: 1;
    }

    .howto-button {
      width: 1rem;
    }
  }

  .groupSortButtons {
    display: flex;
    flex-flow: row nowrap;
    justify-items: stretch;
    .groupSortButton {
      margin-right: 0;
      border-radius: var(--bng-corners-1) 0 0 var(--bng-corners-1);
    }
    .groupSortButtonSmall {
      margin-left: 0;
      border-radius: 0 var(--bng-corners-1) var(--bng-corners-1) 0;
    }
  }

  .info-line {
    display: flex;
    align-items: center;
    margin: 0.5rem 0;
    padding-left: 0.2rem;
    > *:first-child {
      padding-right: 0.2rem;
    }
    > *:last-child {
      line-height: 1.5;
    }
  }

  .separator {
    width: 100%;
    height: 0.3rem;
    background: #fff3;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
}

.buttons-wrapper {
  display: flex;
  flex-flow: row-nowrap;
  flex: 0 0 auto;
  padding: 0.5rem 0.5rem 0.8rem 0.5rem;
  .cancel-button {
    flex: 0 0 auto;
  }
  :deep(.bng-button) {
    &.accept-button {
      font-size: 1.5rem;
      font-weight: 700;
      font-style: italic;
      font-family: "Overpass", var(--fnt-defs);
      padding: 1rem;

      max-width: none;
      flex: 1 1 auto;

      .loading-note {
        font-weight: 100;
      }
    }
  }
}


// Tasklist styles
.wrapper {
  width: auto;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: var(--bng-corners-2);
  display: grid;
  grid-template: min-content auto / 2.5rem 2fr;

  .icon {
    font-size: 2em;
    grid-row: 1 / -1;
    align-self: baseline;
  }

  .heading {
    font-weight: 600;
    font-size: 1.25em;
  }

  .description {
    font-weight: 400;
    font-size: 0.8em;
  }

}
.tasklist {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 0.5rem;
  gap: 0.5rem;
  margin: 0 0.5rem;

  background-image: linear-gradient(180deg,
      rgba(var(--bng-cool-gray-700-rgb),1) 0%,
      rgba(var(--bng-cool-gray-700-rgb),1) 0.25rem,
      rgba(var(--bng-cool-gray-700-rgb),0.5) 0.251rem,
      rgba(var(--bng-cool-gray-700-rgb),0.15) 100%,
    );
  .tasklist-header {
    font-weight: 600;
    font-size: 1.25em;
  }
  .task {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    .heading {
      font-weight: 500;
      font-size: 1.1em;
    }
    .description {
      font-weight: 300;
      font-size: 0.7em;
    }
  }
}
</style>
