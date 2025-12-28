<template>
  <div class="veh-debug">
    <h3>{{ $tt("ui.debug.vehicle") }}</h3>

    <div v-for="toggle in controls.vehicle.toggleGroup_1" :key="toggle.key">
      <BngSwitch v-model="geState[toggle.key]" @valueChanged="toggle.onChange()">{{ $tt(toggle.label) }}</BngSwitch>
    </div>

    <div class="buttons">
      <BngButton
        v-for="btn in controls.vehicle.buttonGroup_1"
        :key="btn.label"
        @click="btn.action()"
        :disabled="disableVehicleButtons"
        :accent="ACCENTS.secondary"
        >{{ $tt(btn.label) }}</BngButton
      >
    </div>

    <hr />

    <h4>{{ $tt("ui.debug.vehicle.jbeamVis") }}</h4>

    <div class="buttons">
      <BngButton v-for="btn in controls.jbeamvis.buttonGroup_1" :key="btn.label" @click="btn.action()" :accent="ACCENTS.secondary">{{
        $tt(btn.label)
      }}</BngButton>
    </div>

    <!-- Part selector -->
    <div class="bng-short-select-item">
      <span class="label-width">{{ $tt("ui.debug.vehicle.partsSelected") }}</span>
      <BngDropdownContainer class="bng-select-fullwidth dropdown-width">
        <BngList :layout="LIST_LAYOUTS.LIST" :target-width="31">
          <BngInput v-model.trim="partsSelectedSearchTerm" :floating-label="$t('ui.debug.vehicle.partsSelectedSearchText')" />
          <div v-if="partsFiltered && partsFiltered.length > 0">
            <BngSwitch
              v-for="part in partsFiltered"
              v-bng-tooltip:right="part.label + ' \\ ' + part.reversePath"
              :model-value="part.selected"
              :key="part.value"
              :label-alignment="LABEL_ALIGNMENTS.START"
              :inline="false"
              class="parts-switch"
              @change="value => partsSelectedChanged(part.value, value)">
              <span class="parts-switch-label">
                <strong>{{ part.label }}</strong> {{ part.reversePath ? "\\" + part.reversePath : "" }}
              </span>
            </BngSwitch>
          </div>
        </BngList>
      </BngDropdownContainer>
      <BngSwitch
        v-model="selectAllParts"
        :class="{ 'switch-indeterminate': partsSelectedIndeterminate(), 'switch-width': true }"
        @onClicked="partsSelectedClicked" />
    </div>

    <template v-if="state.vehicle">
      <!-- Beam Text Mode -->
      <div class="control-row">
        <span class="control-label">{{ $tt("ui.debug.vehicle.beamText") }}</span>
        <BngDropdown v-model="state.vehicle.beamTextMode" :items="beamTextModeItems" @valueChanged="applyState" class="control-input" />
      </div>

      <!-- Beam Visualization Mode -->
      <div class="control-row">
        <span class="control-label">{{ $tt("ui.debug.vehicle.beamVis") }}</span>
        <BngDropdown v-model="state.vehicle.beamVisMode" :items="beamVisModeItems" @valueChanged="applyState" class="control-input" />
      </div>

      <!-- Visualization Controls -->
      <div v-if="currentBeamVisMode && currentBeamVisMode.usesRange">
        <!-- Range Min -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.visRangeMin") }}</span>
          <div class="control-group">
            <BngSlider
              v-model="currentBeamVisMode.rangeMin"
              :min="currentBeamVisMode.rangeMinCap"
              :max="currentBeamVisMode.rangeMaxCap"
              :step="(currentBeamVisMode.rangeMaxCap - currentBeamVisMode.rangeMinCap) / 100"
              @valueChanged="applyState" />
            <BngInput
              v-model="currentBeamVisMode.rangeMin"
              type="number"
              :min="currentBeamVisMode.rangeMinCap"
              :max="currentBeamVisMode.rangeMaxCap"
              :step="(currentBeamVisMode.rangeMaxCap - currentBeamVisMode.rangeMinCap) / 1000"
              @valueChanged="applyState" />
            <BngSwitch v-model="currentBeamVisMode.rangeMinEnabled" @valueChanged="applyState" />
          </div>
        </div>

        <!-- Range Max -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.visRangeMax") }}</span>
          <div class="control-group">
            <BngSlider
              v-model="currentBeamVisMode.rangeMax"
              :min="currentBeamVisMode.rangeMinCap"
              :max="currentBeamVisMode.rangeMaxCap"
              :step="(currentBeamVisMode.rangeMaxCap - currentBeamVisMode.rangeMinCap) / 100"
              @valueChanged="applyState" />
            <BngInput
              v-model="currentBeamVisMode.rangeMax"
              type="number"
              :min="currentBeamVisMode.rangeMinCap"
              :max="currentBeamVisMode.rangeMaxCap"
              :step="(currentBeamVisMode.rangeMaxCap - currentBeamVisMode.rangeMinCap) / 1000"
              @valueChanged="applyState" />
            <BngSwitch v-model="currentBeamVisMode.rangeMaxEnabled" @valueChanged="applyState" />
          </div>
        </div>

        <!-- Inclusive Range -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.useInclusiveRange") }}</span>
          <BngSwitch v-model="currentBeamVisMode.usesInclusiveRange" @valueChanged="applyState" />
        </div>

        <!-- Show Infinity -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.showInf") }}</span>
          <BngSwitch v-model="currentBeamVisMode.showInfinity" @valueChanged="applyState" />
        </div>
      </div>

      <!-- Highlighted beams, width and transparency controls -->
      <template v-if="state.vehicle.beamVisMode !== 1">
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.showHighlighted") }}</span>
          <div class="control-group">
            <BngSwitch v-model="state.vehicle.beamVisShowHighlighted" :disabled="state.vehicle.beamVisMode === 3" @valueChanged="applyState" />
          </div>
        </div>

        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.width") }}</span>
          <div class="control-group">
            <BngSlider v-model="state.vehicle.beamVisWidthScale" :min="0.1" :max="5" :step="0.1" @valueChanged="applyState" />
            <BngInput v-model="state.vehicle.beamVisWidthScale" type="number" :min="0.1" :max="5" :step="0.1" @valueChanged="applyState" />
          </div>
        </div>

        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.transparency") }}</span>
          <div class="control-group">
            <BngSlider v-model="state.vehicle.beamVisAlpha" :min="0" :max="1" :step="0.01" @valueChanged="applyState" />
            <BngInput v-model="state.vehicle.beamVisAlpha" type="number" :min="0" :max="1" :step="0.01" @valueChanged="applyState" />
          </div>
        </div>
      </template>

      <!-- Node Text Mode -->
      <div class="control-row">
        <span class="control-label">{{ $tt("ui.debug.vehicle.nodeText") }}</span>
        <BngDropdown v-model="state.vehicle.nodeTextMode" :items="nodeTextModeItems" @valueChanged="applyState" class="control-input" />
      </div>

      <!-- Visualization Controls -->
      <div v-if="currentNodeTextMode && currentNodeTextMode.usesRange">
        <!-- Range Min -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.visRangeMin") }}</span>
          <div class="control-group">
            <BngSlider
              v-model="currentNodeTextMode.rangeMin"
              :min="currentNodeTextMode.rangeMinCap"
              :max="currentNodeTextMode.rangeMaxCap"
              :step="(currentNodeTextMode.rangeMaxCap - currentNodeTextMode.rangeMinCap) / 100"
              @valueChanged="applyState" />
            <BngInput
              v-model="currentNodeTextMode.rangeMin"
              type="number"
              :min="currentNodeTextMode.rangeMinCap"
              :max="currentNodeTextMode.rangeMaxCap"
              :step="(currentNodeTextMode.rangeMaxCap - currentNodeTextMode.rangeMinCap) / 1000"
              @valueChanged="applyState" />
            <BngSwitch v-model="currentNodeTextMode.rangeMinEnabled" @valueChanged="applyState" />
          </div>
        </div>

        <!-- Range Max -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.visRangeMax") }}</span>
          <div class="control-group">
            <BngSlider
              v-model="currentNodeTextMode.rangeMax"
              :min="currentNodeTextMode.rangeMinCap"
              :max="currentNodeTextMode.rangeMaxCap"
              :step="(currentNodeTextMode.rangeMaxCap - currentNodeTextMode.rangeMinCap) / 100"
              @valueChanged="applyState" />
            <BngInput
              v-model="currentNodeTextMode.rangeMax"
              type="number"
              :min="currentNodeTextMode.rangeMinCap"
              :max="currentNodeTextMode.rangeMaxCap"
              :step="(currentNodeTextMode.rangeMaxCap - currentNodeTextMode.rangeMinCap) / 1000"
              @valueChanged="applyState" />
            <BngSwitch v-model="currentNodeTextMode.rangeMaxEnabled" @valueChanged="applyState" />
          </div>
        </div>

        <!-- Inclusive Range -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.useInclusiveRange") }}</span>
          <BngSwitch v-model="currentNodeTextMode.usesInclusiveRange" @valueChanged="applyState" />
        </div>

        <!-- Show Infinity -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.showInf") }}</span>
          <BngSwitch v-model="currentNodeTextMode.showInfinity" @valueChanged="applyState" />
        </div>
      </div>

      <!-- Node text max distance -->
      <div class="control-row" v-if="state.vehicle.nodeTextMode !== 1">
        <span class="control-label indented">{{ $tt("ui.debug.vehicle.maxDist") }}</span>
        <div class="control-group">
          <BngSlider v-model="state.vehicle.nodeTextMaxDist" :min="0.1" :max="state.vehicle.nodeTextMaxDistCap" :step="0.1" @valueChanged="applyState" />
          <BngInput
            v-model="state.vehicle.nodeTextMaxDist"
            type="number"
            :min="0.1"
            :max="state.vehicle.nodeTextMaxDistCap"
            :step="0.1"
            @valueChanged="applyState" />
        </div>
      </div>

      <!-- Show Wheels -->
      <div class="control-row" v-if="state.vehicle.nodeTextMode !== 1">
        <span class="control-label indented">{{ $tt("ui.debug.vehicle.showWheels") }}</span>
        <BngSwitch v-model="state.vehicle.nodeTextShowWheels" @valueChanged="applyState" />
      </div>

      <!-- Node Visualization Mode -->
      <div class="control-row">
        <span class="control-label">{{ $tt("ui.debug.vehicle.nodeVis") }}</span>
        <BngDropdown v-model="state.vehicle.nodeVisMode" :items="nodeVisModeItems" @valueChanged="applyState" class="control-input" />
      </div>

      <!-- Visualization Controls -->
      <div v-if="currentNodeVisMode && currentNodeVisMode.usesRange">
        <!-- Range Min -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.visRangeMin") }}</span>
          <div class="control-group">
            <BngSlider
              v-model="currentNodeVisMode.rangeMin"
              :min="currentNodeVisMode.rangeMinCap"
              :max="currentNodeVisMode.rangeMaxCap"
              :step="(currentNodeVisMode.rangeMaxCap - currentNodeVisMode.rangeMinCap) / 100"
              @valueChanged="applyState" />
            <BngInput
              v-model="currentNodeVisMode.rangeMin"
              type="number"
              :min="currentNodeVisMode.rangeMinCap"
              :max="currentNodeVisMode.rangeMaxCap"
              :step="(currentNodeVisMode.rangeMaxCap - currentNodeVisMode.rangeMinCap) / 1000"
              @valueChanged="applyState" />
            <BngSwitch v-model="currentNodeVisMode.rangeMinEnabled" @valueChanged="applyState" />
          </div>
        </div>

        <!-- Range Max -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.visRangeMax") }}</span>
          <div class="control-group">
            <BngSlider
              v-model="currentNodeVisMode.rangeMax"
              :min="currentNodeVisMode.rangeMinCap"
              :max="currentNodeVisMode.rangeMaxCap"
              :step="(currentNodeVisMode.rangeMaxCap - currentNodeVisMode.rangeMinCap) / 100"
              @valueChanged="applyState" />
            <BngInput
              v-model="currentNodeVisMode.rangeMax"
              type="number"
              :min="currentNodeVisMode.rangeMinCap"
              :max="currentNodeVisMode.rangeMaxCap"
              :step="(currentNodeVisMode.rangeMaxCap - currentNodeVisMode.rangeMinCap) / 1000"
              @valueChanged="applyState" />
            <BngSwitch v-model="currentNodeVisMode.rangeMaxEnabled" @valueChanged="applyState" />
          </div>
        </div>

        <!-- Inclusive Range -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.useInclusiveRange") }}</span>
          <BngSwitch v-model="currentNodeVisMode.usesInclusiveRange" @valueChanged="applyState" />
        </div>

        <!-- Show Infinity -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.showInf") }}</span>
          <BngSwitch v-model="currentNodeVisMode.showInfinity" @valueChanged="applyState" />
        </div>
      </div>

      <!-- Highlighted nodes, width and transparency controls -->
      <template v-if="state.vehicle.nodeVisMode !== 1">
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.showHighlighted") }}</span>
          <div class="control-group">
            <BngSwitch v-model="state.vehicle.nodeVisShowHighlighted" :disabled="state.vehicle.nodeVisMode === 3" @valueChanged="applyState" />
          </div>
        </div>

        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.width") }}</span>
          <div class="control-group">
            <BngSlider v-model="state.vehicle.nodeVisWidthScale" :min="0.3" :max="5" :step="0.1" @valueChanged="applyState" />
            <BngInput v-model="state.vehicle.nodeVisWidthScale" type="number" :min="0.3" :max="5" :step="0.1" @valueChanged="applyState" />
          </div>
        </div>

        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.transparency") }}</span>
          <div class="control-group">
            <BngSlider v-model="state.vehicle.nodeVisAlpha" :min="0" :max="1" :step="0.01" @valueChanged="applyState" />
            <BngInput v-model="state.vehicle.nodeVisAlpha" type="number" :min="0" :max="1" :step="0.01" @valueChanged="applyState" />
          </div>
        </div>
      </template>

      <!-- Torsion Bar Visualization Mode select -->
      <div class="control-row">
        <span class="control-label">{{ $tt("ui.debug.vehicle.torsionBarVis") }}</span>
        <BngDropdown
          v-model="state.vehicle.torsionBarVisMode"
          :items="torsionBarVisModeItems"
          @valueChanged="
            value => {
              console.log('change triggered', value)
              applyState()
            }
          "
          class="control-input" />
      </div>

      <!-- Torsion Bar Visualization Controls -->
      <template v-if="currentTorsionBarVisMode?.usesRange">
        <!-- Range Min -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.visRangeMin") }}</span>
          <div class="control-group">
            <BngSlider
              v-model="currentTorsionBarVisMode.rangeMin"
              :min="currentTorsionBarVisMode.rangeMinCap"
              :max="currentTorsionBarVisMode.rangeMaxCap"
              :step="(currentTorsionBarVisMode.rangeMaxCap - currentTorsionBarVisMode.rangeMinCap) / 100"
              @valueChanged="applyState" />
            <BngInput
              v-model="currentTorsionBarVisMode.rangeMin"
              type="number"
              :min="currentTorsionBarVisMode.rangeMinCap"
              :max="currentTorsionBarVisMode.rangeMaxCap"
              :step="(currentTorsionBarVisMode.rangeMaxCap - currentTorsionBarVisMode.rangeMinCap) / 1000"
              @valueChanged="applyState" />
            <BngSwitch v-model="currentTorsionBarVisMode.rangeMinEnabled" @valueChanged="applyState" />
          </div>
        </div>

        <!-- Range Max -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.visRangeMax") }}</span>
          <div class="control-group">
            <BngSlider
              v-model="currentTorsionBarVisMode.rangeMax"
              :min="currentTorsionBarVisMode.rangeMinCap"
              :max="currentTorsionBarVisMode.rangeMaxCap"
              :step="(currentTorsionBarVisMode.rangeMaxCap - currentTorsionBarVisMode.rangeMinCap) / 100"
              @valueChanged="applyState" />
            <BngInput
              v-model="currentTorsionBarVisMode.rangeMax"
              type="number"
              :min="currentTorsionBarVisMode.rangeMinCap"
              :max="currentTorsionBarVisMode.rangeMaxCap"
              :step="(currentTorsionBarVisMode.rangeMaxCap - currentTorsionBarVisMode.rangeMinCap) / 1000"
              @valueChanged="applyState" />
            <BngSwitch v-model="currentTorsionBarVisMode.rangeMaxEnabled" @valueChanged="applyState" />
          </div>
        </div>

        <!-- Inclusive Range -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.useInclusiveRange") }}</span>
          <BngSwitch v-model="currentTorsionBarVisMode.usesInclusiveRange" @valueChanged="applyState" />
        </div>

        <!-- Show Infinity -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.showInf") }}</span>
          <BngSwitch v-model="currentTorsionBarVisMode.showInfinity" @valueChanged="applyState" />
        </div>
      </template>

      <!-- Torsion Bar Vis Width and Transparency -->
      <template v-if="state.vehicle.torsionBarVisMode !== 1">
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.width") }}</span>
          <div class="control-group">
            <BngSlider v-model="state.vehicle.torsionBarVisWidthScale" :min="0.1" :max="5" :step="0.1" @valueChanged="applyState" />
            <BngInput v-model="state.vehicle.torsionBarVisWidthScale" type="number" :min="0.1" :max="5" :step="0.1" @valueChanged="applyState" />
          </div>
        </div>

        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.transparency") }}</span>
          <div class="control-group">
            <BngSlider v-model="state.vehicle.torsionBarVisAlpha" :min="0" :max="1" :step="0.01" @valueChanged="applyState" />
            <BngInput v-model="state.vehicle.torsionBarVisAlpha" type="number" :min="0" :max="1" :step="0.01" @valueChanged="applyState" />
          </div>
        </div>
      </template>

      <!-- Rails Slidenodes Visualization Mode select -->
      <div class="control-row">
        <span class="control-label">{{ $tt("ui.debug.vehicle.railsSlideNodesVis") }}</span>
        <BngDropdown v-model="state.vehicle.railsSlideNodesVisMode" :items="railsSlideNodesModeItems" @valueChanged="applyState" class="control-input" />
      </div>

      <template v-if="state.vehicle.railsSlideNodesVisMode !== 1">
        <!-- Rails Slidenodes Vis Width slider -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.width") }}</span>
          <div class="control-group">
            <BngSlider v-model="state.vehicle.railsSlideNodesVisWidthScale" :min="0.1" :max="5" :step="0.1" @valueChanged="applyState" />
            <BngInput v-model="state.vehicle.railsSlideNodesVisWidthScale" type="number" :min="0.1" :max="5" :step="0.1" @valueChanged="applyState" />
          </div>
        </div>

        <!-- Rails Slidenodes Vis Transparency slider -->
        <div class="control-row">
          <span class="control-label indented">{{ $tt("ui.debug.vehicle.transparency") }}</span>
          <div class="control-group">
            <BngSlider v-model="state.vehicle.railsSlideNodesVisAlpha" :min="0" :max="1" :step="0.01" @valueChanged="applyState" />
            <BngInput v-model="state.vehicle.railsSlideNodesVisAlpha" type="number" :min="0" :max="1" :step="0.01" @valueChanged="applyState" />
          </div>
        </div>
      </template>

      <!-- Center of Gravity select -->
      <div class="control-row">
        <span class="control-label">{{ $tt("ui.debug.vehicle.centerOfGravity") }}</span>
        <BngDropdown v-model="state.vehicle.cogMode" :items="cogModeItems" @valueChanged="applyState" class="control-input" />
      </div>

      <!-- Collision Triangles mode -->
      <div class="control-row">
        <span class="control-label">{{ $tt("ui.debug.vehicle.collisionTriangle") }}</span>
        <BngDropdown v-model="state.vehicle.collisionTriangleVisMode" :items="collisionTriangleModeItems" @valueChanged="applyState" class="control-input" />
      </div>

      <!-- Collision Triangles Transparency slider -->
      <div class="control-row" v-if="state.vehicle.collisionTriangleVisMode !== 1">
        <span class="control-label indented">{{ $tt("ui.debug.vehicle.transparency") }}</span>
        <div class="control-group">
          <BngSlider v-model="state.vehicle.collisionTriangleVisAlpha" :min="0" :max="1" :step="0.01" @valueChanged="applyState" />
          <BngInput v-model="state.vehicle.collisionTriangleVisAlpha" type="number" :min="0" :max="1" :step="0.01" @valueChanged="applyState" />
        </div>
      </div>

      <!-- Aerodynamics Mode select -->
      <div class="control-row">
        <span class="control-label">{{ $tt("ui.debug.vehicle.aerodynamics") }}</span>
        <BngDropdown v-model="state.vehicle.aeroMode" :items="aeroModeItems" @valueChanged="applyState" class="control-input" />
      </div>

      <!-- Aero scale slider -->
      <div class="control-row" v-if="state.vehicle.aeroMode !== 1">
        <span class="control-label indented">{{ $tt("ui.debug.vehicle.aerodynamicsScale") }}</span>
        <div class="control-group">
          <BngSlider v-model="state.vehicle.aerodynamicsScale" :min="0" :max="0.2" :step="0.01" @valueChanged="applyState" />
          <BngInput v-model="state.vehicle.aerodynamicsScale" type="number" :min="0" :max="0.2" :step="0.01" @valueChanged="applyState" />
        </div>
      </div>

      <!-- Tire Contact Point checkbox -->
      <div class="control-row">
        <span class="control-label">{{ $tt("ui.debug.vehicle.tireContactPoint") }}</span>
        <BngSwitch v-model="state.vehicle.tireContactPoint" @valueChanged="applyState" />
      </div>

      <!-- Steering geometry checkbox -->
      <div class="control-row">
        <span class="control-label">{{ $tt("ui.debug.vehicle.steeringGeometry") }}</span>
        <BngSwitch v-model="state.vehicle.steeringGeometry" @valueChanged="applyState" />
      </div>

      <!-- Steering geometry line length -->
      <div class="control-row" v-if="state.vehicle.steeringGeometry">
        <span class="control-label indented">{{ $tt("ui.debug.vehicle.steeringGeometryLineLength") }}</span>
        <div class="control-group">
          <BngSlider v-model="state.vehicle.steeringGeometryLineLength" :min="0" :max="50" :step="0.1" @valueChanged="applyState" />
          <BngInput v-model="state.vehicle.steeringGeometryLineLength" type="number" :min="0" :max="50" :step="0.1" @valueChanged="applyState" />
        </div>
      </div>

      <!-- Wheel thermals checkbox -->
      <div class="control-row" v-if="!shipping">
        <span class="control-label">{{ $tt("ui.debug.vehicle.wheelThermals") }} 🐞</span>
        <BngSwitch v-model="state.vehicle.wheelThermals" @valueChanged="applyState" />
      </div>
    </template>

    <!-- Mesh Visibility Controls -->
    <div class="mesh-visibility">
      <div class="control-row">
        <span class="control-label">{{ $tt("ui.debug.vehicle.meshVisibility") }}</span>
        <div class="mesh-buttons">
          <BngButton
            v-for="btn in controls.jbeamvis.meshVisButtonGroup"
            :key="btn.label"
            @click="btn.action()"
            :disabled="disableVehicleButtons"
            :accent="ACCENTS.outlined"
            class="mesh-button"
            >{{ btn.label }}</BngButton
          >
        </div>
      </div>
    </div>

    <hr />

    <h4>{{ $tt("ui.debug.terrain") }}</h4>

    <div class="buttons">
      <BngButton v-for="btn in controls.terrain.buttonGroup_1" :key="btn.label" @click="btn.action()" :accent="ACCENTS.secondary">{{
        $tt(btn.label)
      }}</BngButton>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue"
import {
  BngButton,
  BngSwitch,
  BngDropdown,
  BngDropdownContainer,
  BngInput,
  BngSlider,
  BngList,
  ACCENTS,
  LIST_LAYOUTS,
  LABEL_ALIGNMENTS,
} from "@/common/components/base"
import { vBngTooltip } from "@/common/directives"
import { useBridge } from "@/bridge"
import { useEvents } from "@/services/events"
import { $translate } from "@/services"
import { useUINavBlocker } from "@/services/uiNavTracker"

const navBlocker = useUINavBlocker()
navBlocker.blockOnly(["context"])

const { lua, api } = useBridge()
const events = useEvents()

const state = reactive({})
const stateNoReset = reactive({
  vehicle: {
    parts: [],
    partNameToIdx: {},
    partsSelected: {},
    partsSelectedIdxs: [],
  },
})
const partsState = reactive({
  partsSorted: [],
  partsHighlightedIdxs: [],
})

const partsFiltered = computed(() => {
  let res = partsState.partsSorted
  if (!Array.isArray(res)) {
    return []
  }

  if (partsSelectedSearchTerm.value) {
    res = res.filter(part => part.includes(partsSelectedSearchTerm.value))
  }

  return res.map(p => {
    const segments = p.split("/")
    const label = segments[segments.length - 1]
    const reversePath = segments.slice(0, -1).reverse().join("\\")

    return {
      label,
      reversePath,
      value: p,
      selected: Array.isArray(partsState.partsHighlightedIdxs) && partsState.partsHighlightedIdxs.includes(partsState.partsSorted.indexOf(p) + 1),
    }
  })
})

const shipping = computed(() => window.beamng && window.beamng.shipping)

const geState = reactive({
  physicsEnabled: true,
  debugSpawnEnabled: false,
})

const partsSelectedSearchTerm = ref("")
const disableVehicleButtons = ref(false)

const controls = {
  vehicle: {
    buttonGroup_1: [
      { label: "ui.debug.vehicle.loadDefault", action: () => lua.core_vehicles.loadDefault() },
      { label: "ui.debug.vehicle.spawnNew", action: () => lua.core_vehicles.spawnDefault() },
      { label: "ui.debug.vehicle.removeCurrent", action: () => lua.core_vehicles.removeCurrent() },
      { label: "ui.debug.vehicle.cloneCurrent", action: () => lua.core_vehicles.cloneCurrent() },
      { label: "ui.debug.vehicle.removeAll", action: () => lua.core_vehicles.removeAll() },
      { label: "ui.debug.vehicle.removeOthers", action: () => lua.core_vehicles.removeAllExceptCurrent() },
      { label: "ui.debug.vehicle.resetAll", action: () => lua.resetGameplay(-1) },
      { label: "ui.debug.vehicle.reloadAll", action: () => lua.core_vehicle_manager.reloadAllVehicles() },
    ],
    toggleGroup_1: [
      { label: "ui.debug.activatePhysics", key: "physicsEnabled", onChange: () => lua.simTimeAuthority.togglePause() },
      { label: "ui.debug.debugSpawnEnabled", key: "debugSpawnEnabled", onChange: () => lua.core_vehicle_manager.toggleDebug() },
    ],
  },
  jbeamvis: {
    buttonGroup_1: [
      { label: "ui.debug.vehicle.toggleVis", action: () => api.activeObjectLua(`bdebug.toggleEnabled()`) },
      { label: "ui.debug.vehicle.clearSettings", action: () => api.activeObjectLua(`bdebug.resetModes()`) },
    ],
    meshVisButtonGroup: [
      { label: "0%", action: () => lua.core_vehicles.setMeshVisibility(0) },
      { label: "25%", action: () => lua.core_vehicles.setMeshVisibility(0.25) },
      { label: "50%", action: () => lua.core_vehicles.setMeshVisibility(0.5) },
      { label: "75%", action: () => lua.core_vehicles.setMeshVisibility(0.75) },
      { label: "100%", action: () => lua.core_vehicles.setMeshVisibility(1.0) },
    ],
  },
  terrain: {
    buttonGroup_1: [
      { label: "ui.debug.terrain.groundmodel", action: () => api.engineLua(`extensions.load("util_groundModelDebug") util_groundModelDebug.openWindow()`) },
    ],
  },
}

onMounted(async () => {
  geState.physicsEnabled = !(await lua.simTimeAuthority.getPause())
  geState.debugSpawnEnabled = await lua.core_vehicle_manager.getDebug()
  api.activeObjectLua("bdebug.requestState()")
  lua.core_gamestate.requestGameState()
  lua.extensions.core_vehicle_partmgmt.sendPartsSelectorStateToUI()
})

const applyState = (notSendBack = false) => {
  notSendBack = !!notSendBack
  api.activeObjectLua(`bdebug.setState(${api.serializeToLua(state)}, ${api.serializeToLua(stateNoReset)}, ${notSendBack})`)
}

const partsSelectedChanged = (part, value) => {
  if (!Array.isArray(partsState.partsHighlightedIdxs)) {
    partsState.partsHighlightedIdxs = []
  }

  const idx = partsState.partsSorted.indexOf(part) + 1
  const idxInArray = partsState.partsHighlightedIdxs.indexOf(idx)
  if (value && idxInArray === -1) {
    partsState.partsHighlightedIdxs.push(idx)
  } else if (!value && idxInArray !== -1) {
    partsState.partsHighlightedIdxs.splice(idxInArray, 1)
  }
  applyState(true)
  lua.extensions.core_vehicle_partmgmt.partsSelectorChanged(partsState)
}

const partsSelectorChanged = () => {
  applyState(true)
  lua.extensions.core_vehicle_partmgmt.partsSelectorChanged(partsState)
}

const partsSelectedChecked = () => partsState.partsHighlightedIdxs.length === partsState.partsSorted.length

const partsSelectedIndeterminate = () => {
  return partsState.partsHighlightedIdxs.length !== 0 && partsState.partsHighlightedIdxs.length !== partsState.partsSorted.length
}

const partsSelectedClicked = () => {
  const shouldCheck = partsState.partsHighlightedIdxs.length !== partsState.partsSorted.length

  if (shouldCheck) {
    // Check all
    partsState.partsHighlightedIdxs = Array.from({ length: partsState.partsSorted.length }, (_, i) => i + 1)
  } else {
    // Uncheck all
    partsState.partsHighlightedIdxs = []
  }

  applyState()
  lua.extensions.core_vehicle_partmgmt.partsSelectorChanged(partsState)
}

const syncSelectedPartsWithPartsList = () => api.activeObjectLua(`bdebug.syncSelectedPartsWithPartsList()`)
const showOnlySelectedPartsMeshChanged = () => api.activeObjectLua(`bdebug.showOnlySelectedPartsMeshChanged()`)

const reversePath = path => {
  const parts = path.split("/")
  const basename = parts[parts.length - 1]
  const dirname = parts.slice(0, -1).reverse()
  return "<strong>" + basename + "</strong>" + "\\" + dirname.join("\\")
}

const selectAllParts = computed({
  get: () => partsSelectedChecked(),
  set: () => partsSelectedClicked(),
})

const beamTextModeItems = computed(() => {
  if (!state.vehicle?.beamTextModes) return []
  return state.vehicle.beamTextModes.map((mode, index) => ({
    value: index + 1,
    label: mode.name ? $translate.instant(`vehicle.bdebug.beamTextMode.${mode.name}`) : "",
  }))
})

const beamVisModeItems = computed(() => {
  if (!state.vehicle?.beamVisModes) return []
  return state.vehicle.beamVisModes.map((mode, index) => ({
    value: index + 1,
    label: mode.name ? $translate.instant(`vehicle.bdebug.beamVisMode.${mode.name}`) : "",
  }))
})

const currentBeamVisMode = computed(() => {
  if (!state.vehicle?.beamVisModes) return null
  return state.vehicle.beamVisModes[state.vehicle.beamVisMode - 1]
})

const nodeTextModeItems = computed(() => {
  if (!state.vehicle?.nodeTextModes) return []
  return state.vehicle.nodeTextModes.map((mode, index) => ({
    value: index + 1,
    label: mode.name ? $translate.instant(`vehicle.bdebug.nodeTextMode.${mode.name}`) : "",
  }))
})

const currentNodeTextMode = computed(() => {
  if (!state.vehicle?.nodeTextModes) return null
  return state.vehicle.nodeTextModes[state.vehicle.nodeTextMode - 1]
})

const nodeVisModeItems = computed(() => {
  if (!state.vehicle?.nodeVisModes) return []
  return state.vehicle.nodeVisModes.map((mode, index) => ({
    value: index + 1,
    label: mode.name ? $translate.instant(`vehicle.bdebug.nodeVisMode.${mode.name}`) : "",
  }))
})

const currentNodeVisMode = computed(() => {
  if (!state.vehicle?.nodeVisModes) return null
  return state.vehicle.nodeVisModes[state.vehicle.nodeVisMode - 1]
})

const torsionBarVisModeItems = computed(() => {
  if (!state.vehicle?.torsionBarVisModes) return []
  return state.vehicle.torsionBarVisModes.map((mode, index) => ({
    value: index + 1,
    label: mode.name ? $translate.instant(`vehicle.bdebug.torsionBarVisMode.${mode.name}`) : "",
  }))
})

const currentTorsionBarVisMode = computed(() => {
  if (!state.vehicle?.torsionBarVisModes) return null
  return state.vehicle.torsionBarVisModes[state.vehicle.torsionBarVisMode - 1]
})

const railsSlideNodesModeItems = computed(() => {
  if (!state.vehicle?.railsSlideNodesVisModes) return []
  return state.vehicle.railsSlideNodesVisModes.map((mode, index) => ({
    value: index + 1,
    label: mode.name ? $translate.instant(`vehicle.bdebug.railsSlideNodesVisMode.${mode.name}`) : "",
  }))
})

const cogModeItems = computed(() => {
  if (!state.vehicle?.cogModes) return []
  return state.vehicle.cogModes.map((mode, index) => ({
    value: index + 1,
    label: mode.name ? $translate.instant(`vehicle.bdebug.cogMode.${mode.name}`) : "",
  }))
})

const collisionTriangleModeItems = computed(() => {
  if (!state.vehicle?.collisionTriangleVisModes) return []
  return state.vehicle.collisionTriangleVisModes.map((mode, index) => ({
    value: index + 1,
    label: mode.name ? $translate.instant(`vehicle.bdebug.collisionTriangleVisMode.${mode.name}`) : "",
  }))
})

const aeroModeItems = computed(() => {
  if (!state.vehicle?.aeroModes) return []
  return state.vehicle.aeroModes.map((mode, index) => ({
    value: index + 1,
    label: mode.name ? $translate.instant(`vehicle.bdebug.aeroMode.${mode.name}`) : "",
  }))
})

events.on("BdebugUpdate", (debugState, newStateNoReset) => {
  Object.assign(state, debugState)
  Object.assign(stateNoReset, newStateNoReset)
})

events.on("PartsSelectorUpdate", state => {
  Object.assign(partsState, state)
})

events.on("VehicleFocusChanged", () => {
  api.activeObjectLua("bdebug.requestState()")
  lua.extensions.core_vehicle_partmgmt.sendPartsSelectorStateToUI()
})

events.on("physicsStateChanged", state => (geState.physicsEnabled = !!state))
events.on("debugSpawnChanged", state => (geState.debugSpawnEnabled = !!state))
events.on("GameStateUpdate", gamestate => (disableVehicleButtons.value = gamestate.state.toLowerCase().indexOf("scenario") > -1))
</script>

<style lang="scss" scoped>
.veh-debug {
  width: 100%;
  height: 100%;
  overflow: hidden auto;
}

.buttons {
  display: flex;
  flex-flow: row wrap;
  > * {
    flex: 1 1 45%;
  }
}

.control-row {
  display: flex;
  align-items: center;
  margin: 8px 0;
  width: 100%;

  .control-label {
    &.indented {
      text-indent: 30px;
    }
  }
}

.control-label {
  flex: 0 0 50%;
}

.control-input {
  flex: 1;
}

.control-group {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 15px;

  .bng-slider {
    flex: 1;
  }

  .bng-input {
    width: 80px;
  }
}

.mesh-buttons {
  display: flex;
  flex: 1;
}

.mesh-button {
  min-width: unset !important;
  flex: 0 0 auto;
}

.mesh-visibility {
  margin-top: 16px;
}

.bng-short-select-item {
  display: flex;
  align-items: center;
  margin: 8px 0;
}

:deep() {
  .parts-switch {
    margin: 0.25em 0;
  }

  .parts-switch-label {
    display: inline-block;
    width: 100%;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.switch-indeterminate {
  :deep(.bng-switch-indicator) {
    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 2px;
      background-color: currentColor;
    }
  }
}

.label-width {
  width: 50%;
}

.dropdown-width {
  width: 205px;
}

.switch-width {
  width: 15%;
}
</style>
