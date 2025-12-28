<template>
  <LayoutSingle class="layout-content-full content-center layout-paddings" v-bng-blur>
    <div class="milestones-wrapper">
      <BngScreenHeading>Organizations</BngScreenHeading>
      <div bng-ui-scope="organizations" class="career-milestones-card" v-bng-on-ui-nav:back,menu="exit">
        <div class="career-milestones-container">
          <div class="actions">
            <BngButton class="exitButton" @click="exit" :accent="ACCENTS.attention"
              ><BngBinding tabindex="1" ui-event="back" deviceMask="xinput" />Back</BngButton
            >
            <CareerStatus class="career-page-status" ref="careerStatusRef" />
          </div>
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
            <OrganizationCard v-else
              :organization="selectedOrganization"
              :detail="true"
              @click="openOrganizationPage()"
              />
          </div>


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
                    <BngPropVal :iconType="icons.beamCurrency" :valueLabel="level.bonus" :keyLabel="'Delivery Rewards'" />
                  </div>
                </div>

                <div class="cards-container" v-if="(filteredOrganizationsByLevel[level.value] && filteredOrganizationsByLevel[level.value].length > 0)">
                  <OrganizationCard
                    tabindex="1"
                    v-for="organization in filteredOrganizationsByLevel[level.value]"
                    :organization="organization"
                    v-bng-sound-class="organization.visible ? 'bng_hover_generic': ''"
                    @click="openOrganizationPage(organization.id)" />

                </div>
                <div v-else stlye=""> </div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>
  </LayoutSingle>
</template>

<script setup>
import { LayoutSingle } from "@/common/layouts"
import { BngScreenHeading, BngPillFilters, BngBinding, BngButton, ACCENTS, BngIcon, icons, BngCard, BngCardHeading, BngPropVal } from "@/common/components/base"
import { vBngBlur, vBngOnUiNav, vBngSoundClass } from "@/common/directives"
import OrganizationCard from "../components/organizations/OrganizationCard.vue"
import OrganizationRewards from "../components/organizations/OrganizationRewards.vue"
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
  { value: 3, label: 'Partner', color: '#00f', bonus:"+40%" },
  { value: 2, label: 'Preferred', color: '#0f0',bonus:"+20%" },
  { value: 1, label: 'Reliable', color: '#ff0', bonus:"+10%" },
  { value: 0, label: 'Neutral', color: '#f00', bonus:"+0%" },
  { value: -1, label: 'Questionable', color: '#999', bonus:"-10%" },
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
  max-width: 80em;
  flex-flow: column;
  overflow: hidden;
  align-self: stretch;
  flex: 1 1 auto;
}

.career-milestones-card {
  display: flex;
  height: 100%;
  max-width: 80em;

  overflow: hidden;
}

.career-milestones-container {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  //justify-content: flex-start;
  //align-items: stretch;

  background: rgba(0, 0, 0, 0.8);
  border-radius: var(--bng-corners-3);
  overflow: hidden;
  width: 100%;
}

.scrollable-container {
  overflow-y: scroll;
  padding: 0.5rem 0;


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
   background-image: linear-gradient(180deg,
    rgba(var(--bng-add-green-400-rgb),1) 0%,
    rgba(var(--bng-add-green-600-rgb),1) 0.25rem,
    rgba(var(--bng-add-green-600-rgb),0.5) 0.251rem,
    rgba(var(--bng-add-green-700-rgb),0.15) 100%,
  );
}
.level-Preferred {
   background-image: linear-gradient(180deg,
    rgba(var(--bng-add-green-400-rgb),1) 0%,
    rgba(var(--bng-add-green-600-rgb),1) 0.25rem,
    rgba(var(--bng-add-green-600-rgb),0.5) 0.251rem,
    rgba(var(--bng-add-green-700-rgb),0.15) 100%,
  );
}
.level-Reliable {
   background-image: linear-gradient(180deg,
    rgba(var(--bng-ter-yellow-400-rgb),1) 0%,
    rgba(var(--bng-ter-yellow-600-rgb),1) 0.25rem,
    rgba(var(--bng-ter-yellow-600-rgb),0.5) 0.251rem,
    rgba(var(--bng-ter-yellow-700-rgb),0.15) 100%,
  );
}
.level-Neutral {
   background-image: linear-gradient(180deg,
    rgba(var(--bng-ter-yellow-400-rgb),1) 0%,
    rgba(var(--bng-ter-yellow-600-rgb),1) 0.25rem,
    rgba(var(--bng-ter-yellow-600-rgb),0.5) 0.251rem,
    rgba(var(--bng-ter-yellow-700-rgb),0.15) 100%,
  );
}
.level-Questionable {
   background-image: linear-gradient(180deg,
    rgba(var(--bng-add-red-500-rgb),1) 0%,
    rgba(var(--bng-add-red-600-rgb),1) 0.25rem,
    rgba(var(--bng-add-red-700-rgb),0.5) 0.251rem,
    rgba(var(--bng-add-red-700-rgb),0.15) 100%,
  );
}
.level-Undiscovered {
   background-image: linear-gradient(180deg,
    rgba(var(--bng-cool-gray-700-rgb),1) 0%,
    rgba(var(--bng-cool-gray-700-rgb),1) 0.25rem,
    rgba(var(--bng-cool-gray-700-rgb),0.5) 0.251rem,
    rgba(var(--bng-cool-gray-700-rgb),0.15) 100%,
  );
}

.level-header {

   padding: 0.5rem 1rem;
   margin-bottom: 0.5rem;
   display: flex;
   .label {
    flex: 1 1 auto;
    font-size: 1.5rem;
    font-weight: 800;
   }
   .info {
    flex: 0 0 auto;
    font-size: 1.25rem;
   }
}

.cards-container {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(20em, 1fr));
  padding: 1rem;

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

.actions {
  flex: 0 0 auto;
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 0.5rem 1rem;
  align-items: center;
  justify-content: space-between;
  > .exitButton {
    margin-right: 1rem;
  }
}

.general-info {
  flex: 0 0 auto;
  padding: 1rem;
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
