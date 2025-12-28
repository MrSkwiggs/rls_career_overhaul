<template>
      <div class="milestones-wrapper">
        <div bng-ui-scope="organizations" class="career-milestones-card" v-bng-on-ui-nav:back,menu="exit">
          <div class="career-milestones-container">
            <!--
            <div class="general-info" >
              <div class="text">
                <div>
                  Deliver cargo for these organizations to increase your reputation. A higher reputation will increase the rewards you get for delivering cargo for that organization.
                </div>
                <div>
                  Some organizations also allow you to loan out vehicles. A higher reputation will grant you access to better vehicles. You will also have to pay a lower cut of the rewards to the company you loaned from.
                </div>
              </div>
              <template v-if="!selectedOrganization">
                <div class="card-wrapper selectedOrg">
                  <div class="header">
                    <div class="name">
                      Click an organization to view details.
                    </div>
                    <BngIcon class="glyph" :type="icons.peopleOutline" />
                  </div>
                </div>
              </template>
            </div>
            <div class="general-info">
              <OrganizationCard
              v-if="selectedOrganization"
              :organization="selectedOrganization"
              :detail="true"
              @click="openOrganizationPage()"
              />
            </div>
            -->

            <div class="scrollable-container" bng-nav-scroll-force>
              <template v-for="level in reputationLevels">
                <template v-if="level.value >=-1 || (filteredOrganizationsByLevel[level.value] && filteredOrganizationsByLevel[level.value].length > 0)" >
                  <div class="level-header" :class="{['level-'+level.label]:true}">
                    <div class="label" v-if="level.value >= -1">
                      {{level.label}} (Level {{level.value}})
                    </div>
                    <div class="label"  v-else>
                      Undiscovered Organizations
                    </div>
                    <div class="info" v-if="level.bonus">
                      <div class="tier-value-label">Money Rewards: </div>
                      <BngIcon class="tier-header-block-icon" :type="icons.beamCurrency" />
                      <div class="tier-value-label">× {{ level.bonus }}</div>
                    </div>
                  </div>

                  <div class="cards-container" v-if="(filteredOrganizationsByLevel[level.value] && filteredOrganizationsByLevel[level.value].length > 0)">
                    <OrganizationCard
                      tabindex="1"
                      v-for="organization in filteredOrganizationsByLevel[level.value]"
                      :organization="organization"
                      v-bng-sound-class="organization.visible ? 'bng_hover_generic': ''"
                      @click="openOrganizationPage(organization.id)"
                      :detail="selectedOrganization && selectedOrganization.id == organization.id" />

                  </div>
                  <div v-else stlye=""> </div>
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>
  </template>

  <script setup>
  import { LayoutSingle } from "@/common/layouts"
  import { BngScreenHeading, BngPillFilters, BngBinding, BngButton, ACCENTS, BngIcon, icons, BngCard, BngCardHeading, BngPropVal } from "@/common/components/base"
  import { vBngBlur, vBngOnUiNav, vBngSoundClass } from "@/common/directives"
  import OrganizationCard from "./OrganizationCard.vue"
  import OrganizationRewards from "./OrganizationRewards.vue"
  import { CareerStatus } from "@/modules/career/components"
  import { lua } from "@/bridge"
  import { ref, onMounted, computed, watch } from "vue"

  import { useUINavScope } from "@/services/uiNav"
  useUINavScope("organizations") // UI Nav events to fire from (or from focused element inside) element with attribute: bng-ui-scope="milestones"

  const props = defineProps({
    orgId: String,
  })
  const careerStatusRef = ref()
  const organizations = ref([])
  const selectedOrgId = ref("")
  const reputationLevels = computed(() => [
    { value: 3, label: 'Partner', color: '#00f', bonus:"1.40" },
    { value: 2, label: 'Preferred', color: '#0f0',bonus:"1.20" },
    { value: 1, label: 'Reliable', color: '#ff0', bonus:"1.10" },
    { value: 0, label: 'Neutral', color: '#f00', bonus:"1.00" },
    { value: -1, label: 'Questionable', color: '#999', bonus:"0.90" },
    { value: -2, label: 'Undiscovered', color: '#999' },
  ]);// Filter organizations by level
  // Create a computed property to filter organizations by each level
  const filteredOrganizationsByLevel = computed(() => {
    // Create an object to hold arrays of organizations for each level
    const levelMap = {};
    // Initialize arrays for each level
    reputationLevels.value.forEach(level => {
      levelMap[level.value] = [];
    });

    // Populate the arrays with organizations filtered by level
    organizations.value.forEach(org => {
      if (!org.visible) {
        // Assign to "Facilities" level if not visible
        levelMap[-2].push(org);
      } else if (levelMap[org.reputation.level] !== undefined) {
        // Assign to other levels based on reputation
        levelMap[org.reputation.level].push(org);
      }
    });

    return levelMap;
  });




  const selectedOrganization = computed(() => {
    if (!selectedOrgId.value) {
      return undefined
    }

    for (let organization of organizations.value) {
      if (organization.id == selectedOrgId.value) {
        return organization
      }
    }

    return undefined
  })

  function setup(data) {
    organizations.value = data
    organizations.value.sort((a,b) => {
      if (a.visible === b.visible)
        return a.name < b.name
      else
        return a.visible ? -1 : 1
    })
  }

  lua.freeroam_organizations.getUIData().then(setup)

  const openOrganizationPage = organizationId => {
    if(organizationId == selectedOrgId.value) {
      selectedOrgId.value = null
    } else {
      selectedOrgId.value = organizationId
    }
  }

  const exit = () => {
    window.bngVue.gotoGameState("progressLanding")
  }

  const start = () => {
    if (props.orgId) {
      selectedOrgId.value = props.orgId
    }
  }

  onMounted(start)
  </script>

  <style lang="scss" scoped>
  $textcolor: #fff;
  $fontsize: 1rem;

  hr {
    margin: 0.5em;
    border: none;
    border-top: 1px solid var(--bng-cool-gray-600);
  }

  .layout-content {
    color: $textcolor;
    font-size: $fontsize;
  }

  .milestones-wrapper {
    display: flex;
    flex-flow: column;
    overflow: hidden;
    align-self: stretch;
    flex: 1 1 auto;
  }

  .career-milestones-card {
    display: flex;
    height: 100%;

    overflow: hidden;
  }

  .career-milestones-container {
    display: flex;
    flex: 1 0 auto;
    flex-direction: column;
    //justify-content: flex-start;
    //align-items: stretch;

    border-radius: var(--bng-corners-3);
    overflow: hidden;
    width: 100%;
  }

  .scrollable-container {
  }

  .description {
    color: white;
  }

  .orgRewards {
    color: white;
    float: left;
    padding: 0.5em;
  }

  .selectedOrg {
    padding-left: 1em;
    width: fit-content;
  }

  .reputation {

  }


  .level-Partner {
    background-color: rgba(var(--bng-cool-gray-900-rgb), 0.9);
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: var(--bng-corners-2);
      background-image: linear-gradient(180deg,
       rgba(var(--bng-add-green-400-rgb),1) 0%,
       rgba(var(--bng-add-green-600-rgb),1) 0.25rem,
       rgba(var(--bng-add-green-600-rgb),0.5) 0.251rem,
       rgba(var(--bng-add-green-700-rgb),0.15) 100%,
     );
    }
  }
  .level-Preferred {
    background-color: rgba(var(--bng-cool-gray-900-rgb), 0.9);
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: var(--bng-corners-2);
      background-image: linear-gradient(180deg,
        rgba(var(--bng-add-green-400-rgb),1) 0%,
        rgba(var(--bng-add-green-600-rgb),1) 0.25rem,
        rgba(var(--bng-add-green-600-rgb),0.5) 0.251rem,
        rgba(var(--bng-add-green-700-rgb),0.15) 100%,
        );
    }
  }
  .level-Reliable {
    background-color: rgba(var(--bng-cool-gray-900-rgb), 0.9);
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: var(--bng-corners-2);
     background-image: linear-gradient(180deg,
      rgba(var(--bng-ter-yellow-400-rgb),1) 0%,
      rgba(var(--bng-ter-yellow-600-rgb),1) 0.25rem,
      rgba(var(--bng-ter-yellow-600-rgb),0.5) 0.251rem,
      rgba(var(--bng-ter-yellow-700-rgb),0.15) 100%,
    );
    }
  }
  .level-Neutral {
    background-color: rgba(var(--bng-cool-gray-900-rgb), 0.9);
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: var(--bng-corners-2);
     background-image: linear-gradient(180deg,
      rgba(var(--bng-ter-yellow-400-rgb),1) 0%,
      rgba(var(--bng-ter-yellow-600-rgb),1) 0.25rem,
      rgba(var(--bng-ter-yellow-600-rgb),0.5) 0.251rem,
      rgba(var(--bng-ter-yellow-700-rgb),0.15) 100%,
    );
    }
  }
  .level-Questionable {
    background-color: rgba(var(--bng-cool-gray-900-rgb), 0.9);
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: var(--bng-corners-2);
     background-image: linear-gradient(180deg,
      rgba(var(--bng-add-red-500-rgb),1) 0%,
      rgba(var(--bng-add-red-600-rgb),1) 0.25rem,
      rgba(var(--bng-add-red-700-rgb),0.5) 0.251rem,
      rgba(var(--bng-add-red-700-rgb),0.15) 100%,
    );
    }
  }
  .level-Undiscovered {
    background-color: rgba(var(--bng-cool-gray-900-rgb), 0.9);
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: var(--bng-corners-2);
     background-image: linear-gradient(180deg,
      rgba(var(--bng-cool-gray-700-rgb),1) 0%,
      rgba(var(--bng-cool-gray-700-rgb),1) 0.25rem,
      rgba(var(--bng-cool-gray-700-rgb),0.5) 0.251rem,
      rgba(var(--bng-cool-gray-700-rgb),0.15) 100%,
    );
    }
  }

  .level-header {

     padding: 0.5rem 1rem;
     margin-bottom: 0.5rem;
     display: flex;
     border-radius: var(--bng-corners-2);
     .label {
      flex: 1 1 auto;
      font-size: 1.5rem;
      font-weight: 800;
      z-index: 1;
     }
     .info {
      flex: 0 0 auto;
      font-size: 1.25rem;
      z-index: 1;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.2rem;
     }
  }

  .cards-container {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fill, minmax(20em, 1fr));
    padding-bottom: 1rem;

    .no-organizations {
      opacity: 0.5;
    }
  }

  .filters {
    flex: 0 0 auto;
    display: flex;
    flex-direction: row;
    width: fit-content;
  }

  .general-info {
    flex: 0 0 auto;
    padding: 1rem 0;
    display: flex;
    flex-flow: row;
    > .text {
      font-size: 1.25rem;
      padding-right: 2rem;
      text-align: justify;
      > * {
        padding-bottom: 1rem;
      }
    }
    > * {
      width: 50%;
    }

  }

  .career-filter-icon {
    font-size: 2em;
    padding-left: 1rem;
    padding-right: 0.5rem;
  }

  .career-page-status {
    padding: 0.5rem 0.75rem 0.5rem 0.5rem;
    font-weight: 800;
    display: flex;
    justify-content: center;
    align-items: left;
  }

  .card-wrapper {
    background-color: rgba(var(--bng-cool-gray-800-rgb), 0.9);
    border-radius: var(--bng-corners-2);
    flex: 1 1 auto;
    padding: 0.5rem;
    height: 100%;
    color: white;
    display: flex;
    flex-flow:column;


    > .header {
      padding-left: 0em;
      flex: 1 1 auto;
      align-items: auto;
      display: flex;
      flex-flow: row;
      > .name {
        font-weight: 800;
        font-size: 1.25rem;
        flex: 1 1 auto;
        padding-bottom: 0.75rem;
      }
      .glyph {
        font-size: 2rem;
        align-self: start;
      }

      .empty {
        opacity: 0.25;
        justify-content: center;
        align-items: center;
        font-weight: 50;
        color: rgba(var(--bng-cool-gray-300-rgb), 1);
      }
    }
    > .progress{
      align-items:flex-end;
      :deep(.progress-bar) {
        overflow: hidden;
        border-radius: var(--bng-corners-1);
      }
    }


    .center{
      flex: 1 1 auto;
      align-items:center;
      justify-content: center;
    }

  }
  </style>
