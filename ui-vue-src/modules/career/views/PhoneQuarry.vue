<template>
  <PhoneWrapper app-name="Quarry" status-font-color="#FFFFFF" status-blend-mode="normal">
    <div class="quarry-container">
      <!-- Header Stats -->
      <div class="stats-bubble" v-if="currentState !== 'idle'">
        <span class="stat">Lvl {{ playerLevel }}</span>
        <span class="divider">|</span>
        <span class="stat">{{ contractsCompleted }} done</span>
      </div>

      <!-- IDLE State -->
      <div class="state-panel centered" v-if="currentState === 'idle'">
        <div class="state-icon">🏔️</div>
        <div class="state-title">Quarry Jobs</div>
        <div class="state-message">Drive a WL40 loader to a quarry loading zone to see available contracts.</div>
      </div>

      <!-- CONTRACT SELECT State -->
      <div class="contract-list" v-if="currentState === 'contract_select'">
        <div class="contracts-header">
          <div class="header-title">Available Contracts</div>
          <div class="header-subtitle">Level {{ playerLevel }} • {{ contractsCompleted }} completed</div>
        </div>

        <div class="contracts-scroll">
          <div v-if="!availableContracts || availableContracts.length === 0" class="no-contracts">
            No contracts available
          </div>

          <div 
            v-for="(contract, index) in availableContracts" 
            :key="contract.id" 
            class="contract-card"
            :class="[getTierClass(contract.tier), { 'urgent': contract.isUrgent }]"
          >
            <div class="contract-header">
              <span class="contract-name">{{ contract.name }}</span>
              <span class="contract-payout">${{ formatNumber(contract.totalPayout) }}</span>
            </div>
            <div class="contract-details">
              <span class="tier-badge" :class="getTierClass(contract.tier)">
                Tier {{ contract.tier }}
              </span>
              <span class="material-badge">{{ (contract.material || 'rocks').toUpperCase() }}</span>
              <span v-if="contract.isUrgent" class="urgent-badge">⚡ +25%</span>
            </div>
            <div class="contract-info">
              <!-- Show blocks for marble, tons for rocks -->
              <span v-if="contract.material === 'marble' && contract.requiredBlocks">
                {{ formatBlockRequirements(contract.requiredBlocks) }}
              </span>
              <span v-else>
                {{ contract.requiredTons }} tons
              </span>
              <span>• Pay on Completion</span>
            </div>
            <div class="contract-expiration" :class="getExpirationClass(contract.hoursRemaining)">
              <span v-if="contract.hoursRemaining <= 1">⏰ Expires in {{ Math.floor(contract.hoursRemaining * 60) }} min</span>
              <span v-else-if="contract.hoursRemaining <= 2">⏰ {{ contract.hoursRemaining.toFixed(1) }} hrs left</span>
              <span v-else>⏰ {{ Math.floor(contract.hoursRemaining) }} hrs left</span>
            </div>
            <div class="contract-modifiers" v-if="contract.modifiers && contract.modifiers.length > 0">
              <span v-for="mod in contract.modifiers" :key="mod.name" class="modifier-badge">
                {{ mod.name }}
              </span>
            </div>
            <button class="accept-button" @click="acceptContract(index)">
              Accept Contract
            </button>
          </div>
        </div>

        <button class="action-button decline" @click="declineAll">
          Decline All
        </button>
      </div>

      <!-- CHOOSING ZONE State - Player selecting which zone to load from -->
      <div class="state-panel" v-if="currentState === 'choosing_zone'">
        <div class="active-contract-info" v-if="activeContract">
          <div class="contract-name">{{ activeContract.name }}</div>
          <div class="contract-details">
            <span class="material-badge">{{ (activeContract.material || 'rocks').toUpperCase() }}</span>
          </div>
        </div>
        <div class="state-icon">📍</div>
        <div class="state-title">Choose Loading Zone</div>
        <div class="state-message">Drive to any compatible loading zone. Markers are shown on the map.</div>
        <button class="action-button decline" @click="abandonContract">
          Abandon Contract
        </button>
      </div>

      <!-- DRIVING TO SITE State -->
      <div class="state-panel" v-if="currentState === 'driving_to_site'">
        <div class="active-contract-info" v-if="activeContract">
          <div class="contract-name">{{ activeContract.name }}</div>
          <div class="contract-progress">
            <template v-if="activeContract.material === 'marble' && activeContract.requiredBlocks">
              {{ formatBlockProgress(contractProgress.deliveredBlocks, activeContract.requiredBlocks) }}
            </template>
            <template v-else>
              {{ formatNumber(contractProgress.deliveredTons || 0) }} / {{ activeContract.requiredTons }} tons
            </template>
          </div>
        </div>
        
        <div class="status-section">
          <div class="status-icon pulsing">📍</div>
          <div class="status-title" v-if="!markerCleared">Travel to Marker</div>
          <div class="status-title" v-else>In Loading Zone</div>
          <div class="status-message" v-if="!markerCleared">
            Drive to the quarry loading zone
          </div>
          <div class="status-message" v-else-if="!truckStopped">
            Waiting for truck to arrive...
          </div>
          <div class="status-message" v-else>
            Truck arrived. Ready to load.
          </div>
        </div>

        <button class="action-button danger" @click="abandonContract">
          Abandon Contract
        </button>
      </div>

      <!-- TRUCK ARRIVING State -->
      <div class="state-panel" v-if="currentState === 'truck_arriving'">
        <div class="active-contract-info" v-if="activeContract">
          <div class="contract-name">{{ activeContract.name }}</div>
          <div class="contract-progress">
            <template v-if="activeContract.material === 'marble' && activeContract.requiredBlocks">
              {{ formatBlockProgress(contractProgress.deliveredBlocks, activeContract.requiredBlocks) }}
            </template>
            <template v-else>
              {{ formatNumber(contractProgress.deliveredTons || 0) }} / {{ activeContract.requiredTons }} tons
            </template>
          </div>
        </div>

        <div class="status-section">
          <div class="status-icon pulsing">🚚</div>
          <div class="status-title">Truck Arriving</div>
          <div class="status-message">Waiting for truck to arrive at loading zone...</div>
        </div>

        <button class="action-button danger" @click="abandonContract">
          Abandon Contract
        </button>
      </div>

      <!-- LOADING State -->
      <div class="state-panel loading" v-if="currentState === 'loading'">
        <div class="active-contract-info" v-if="activeContract">
          <div class="contract-name">{{ activeContract.name }}</div>
          <div class="contract-progress">
            <template v-if="activeContract.material === 'marble' && activeContract.requiredBlocks">
              {{ formatBlockProgress(contractProgress.deliveredBlocks, activeContract.requiredBlocks) }}
            </template>
            <template v-else>
              {{ formatNumber(contractProgress.deliveredTons || 0) }} / {{ activeContract.requiredTons }} tons
            </template>
          </div>
        </div>

        <div class="payload-section">
          <div class="payload-header">
            <span class="payload-label">Payload</span>
            <span class="payload-value">{{ formatNumber(currentLoadMass) }} / {{ formatNumber(targetLoad) }} kg</span>
          </div>
          <div class="payload-bar-container">
            <div 
              class="payload-bar" 
              :class="{ full: loadPercent >= 80 }"
              :style="{ width: loadPercent + '%' }"
            ></div>
          </div>
          <div class="payload-percent">{{ loadPercent.toFixed(0) }}%</div>
        </div>

        <!-- Marble Block Status -->
        <div class="blocks-section" v-if="materialType === 'marble' && marbleBlocks && marbleBlocks.length > 0">
          <div class="blocks-header">
            <span>Marble Blocks</span>
            <span v-if="anyMarbleDamaged" class="damage-warning">Damaged blocks won't count</span>
          </div>
          <div class="blocks-list">
            <div 
              v-for="block in marbleBlocks" 
              :key="block.index" 
              class="block-item"
              :class="{ damaged: block.isDamaged, loaded: block.isLoaded }"
            >
              <span class="block-label">Block {{ block.index }}</span>
              <span class="block-status" :class="{ damaged: block.isDamaged }">
                {{ block.isDamaged ? 'DAMAGED' : 'OK' }}
              </span>
              <span class="block-loaded">
                {{ block.isLoaded ? 'Loaded' : 'Not loaded' }}
              </span>
            </div>
          </div>
        </div>

        <button class="action-button primary" @click="sendTruck">
          Send Truck
        </button>

        <button class="action-button danger small" @click="abandonContract">
          Abandon Contract
        </button>
      </div>

      <!-- DELIVERING State -->
      <div class="state-panel" v-if="currentState === 'delivering'">
        <div class="active-contract-info" v-if="activeContract">
          <div class="contract-name">{{ activeContract.name }}</div>
          <div class="contract-progress">
            <template v-if="activeContract.material === 'marble' && activeContract.requiredBlocks">
              {{ formatBlockProgress(contractProgress.deliveredBlocks, activeContract.requiredBlocks) }}
            </template>
            <template v-else>
              {{ formatNumber(contractProgress.deliveredTons || 0) }} / {{ activeContract.requiredTons }} tons
            </template>
          </div>
        </div>

        <div class="status-section">
          <div class="status-icon pulsing">🚛</div>
          <div class="status-title">Delivering</div>
          <div class="status-message">Truck driving to destination...</div>
        </div>

        <!-- Delivering blocks info -->
        <div class="delivering-blocks" v-if="materialType === 'marble' && deliveryBlocks && deliveryBlocks.length > 0">
          <div class="delivering-header">Delivering:</div>
          <div 
            v-for="block in deliveryBlocks.filter(b => b.isLoaded)" 
            :key="block.index"
            class="delivering-block"
            :class="{ damaged: block.isDamaged }"
          >
            Block {{ block.index }} ({{ block.isDamaged ? 'DAMAGED' : 'OK' }})
          </div>
        </div>

        <button class="action-button danger" @click="abandonContract">
          Abandon Contract
        </button>
      </div>

      <!-- RETURN TO QUARRY State -->
      <div class="state-panel" v-if="currentState === 'return_to_quarry'">
        <div class="active-contract-info" v-if="activeContract">
          <div class="contract-name">{{ activeContract.name }}</div>
          <div class="contract-progress" :class="{ complete: isContractComplete }">
            <template v-if="activeContract.material === 'marble' && activeContract.requiredBlocks">
              {{ formatBlockProgress(contractProgress.deliveredBlocks, activeContract.requiredBlocks) }}
            </template>
            <template v-else>
              {{ formatNumber(contractProgress.deliveredTons || 0) }} / {{ activeContract.requiredTons }} tons
            </template>
            <span v-if="isContractComplete" class="complete-badge">COMPLETE!</span>
          </div>
          <div class="payout-info">
            Payout: ${{ formatNumber(activeContract.totalPayout || 0) }}
          </div>
        </div>

        <div class="status-section">
          <div class="status-icon pulsing">↩️</div>
          <div class="status-title">Return to Starter Zone</div>
          <div class="status-message">
            {{ isContractComplete ? 'Contract complete! Return to starter zone to finalize and get paid.' : 'Return to starter zone to continue.' }}
          </div>
        </div>

        <button class="action-button danger" @click="abandonContract">
          Abandon Contract
        </button>
      </div>

      <!-- AT QUARRY DECIDE State -->
      <div class="state-panel" v-if="currentState === 'at_quarry_decide'">
        <div class="active-contract-info" v-if="activeContract">
          <div class="contract-name">{{ activeContract.name }}</div>
          <div class="contract-progress" :class="{ complete: isContractComplete }">
            <template v-if="activeContract.material === 'marble' && activeContract.requiredBlocks">
              {{ formatBlockProgress(contractProgress.deliveredBlocks, activeContract.requiredBlocks) }}
              ({{ progressPercent.toFixed(0) }}%)
            </template>
            <template v-else>
              {{ formatNumber(contractProgress.deliveredTons || 0) }} / {{ activeContract.requiredTons }} tons
              ({{ progressPercent.toFixed(0) }}%)
            </template>
          </div>
          <div class="payout-info complete">
            Payout: ${{ formatNumber(activeContract.totalPayout || 0) }}
          </div>
        </div>

        <div class="status-section" v-if="isContractComplete">
          <div class="status-icon">✅</div>
          <div class="status-title complete">Contract Complete!</div>
          <div class="status-message">Finalize to collect your payment.</div>
        </div>
        
        <div class="status-section" v-else>
          <div class="status-icon">📍</div>
          <div class="status-title">At Starter Zone</div>
          <div class="status-message">Load more materials or continue your contract.</div>
        </div>

        <div class="actions-section">
          <button v-if="isContractComplete" class="action-button success" @click="finalizeContract">
            Finalize & Get Paid
          </button>
          <button v-else class="action-button primary" @click="loadMore">
            Load More
          </button>
          <button class="action-button danger small" @click="abandonContract">
            Abandon Contract
          </button>
        </div>
      </div>
    </div>
  </PhoneWrapper>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PhoneWrapper from './PhoneWrapper.vue'
import { useEvents } from '@/services/events'
import { lua } from '@/bridge'

const events = useEvents()

// State
const currentState = ref('idle')
const playerLevel = ref(1)
const contractsCompleted = ref(0)

// Contracts
const availableContracts = ref([])
const activeContract = ref(null)
const contractProgress = ref({
  deliveredTons: 0,
  totalPaidSoFar: 0,
  deliveryCount: 0
})

// Loading state
const currentLoadMass = ref(0)
const targetLoad = ref(25000)
const materialType = ref('rocks')
const marbleBlocks = ref([])
const anyMarbleDamaged = ref(false)
const deliveryBlocks = ref([])

// Navigation state
const markerCleared = ref(false)
const truckStopped = ref(false)

// Computed
const loadPercent = computed(() => {
  if (targetLoad.value <= 0) return 0
  return Math.min(100, (currentLoadMass.value / targetLoad.value) * 100)
})

const isContractComplete = computed(() => {
  if (!activeContract.value) return false
  // For marble contracts, check block counts
  if (activeContract.value.material === 'marble' && activeContract.value.requiredBlocks) {
    const delivered = contractProgress.value.deliveredBlocks || { big: 0, small: 0 }
    const required = activeContract.value.requiredBlocks
    return (delivered.big >= required.big) && (delivered.small >= required.small)
  }
  // For rocks contracts, check tons
  return (contractProgress.value.deliveredTons || 0) >= (activeContract.value.requiredTons || Infinity)
})

const progressPercent = computed(() => {
  if (!activeContract.value) return 0
  // For marble, calculate based on blocks
  if (activeContract.value.material === 'marble' && activeContract.value.requiredBlocks) {
    const delivered = contractProgress.value.deliveredBlocks || { big: 0, small: 0 }
    const required = activeContract.value.requiredBlocks
    const totalRequired = required.big + required.small
    const totalDelivered = delivered.big + delivered.small
    if (totalRequired <= 0) return 0
    return (totalDelivered / totalRequired) * 100
  }
  // For rocks, calculate based on tons
  if (!activeContract.value.requiredTons) return 0
  return ((contractProgress.value.deliveredTons || 0) / activeContract.value.requiredTons) * 100
})

// Methods
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return Math.round(num).toString()
}

const formatBlockRequirements = (blocks) => {
  if (!blocks) return '? blocks'
  const parts = []
  if (blocks.big > 0) {
    parts.push(`${blocks.big} Large`)
  }
  if (blocks.small > 0) {
    parts.push(`${blocks.small} Small`)
  }
  if (parts.length === 0) return '? blocks'
  return parts.join(' + ') + ' block' + (blocks.total > 1 ? 's' : '')
}

const formatBlockProgress = (delivered, required) => {
  if (!delivered || !required) return 'Loading...'
  const parts = []
  if (required.big > 0) {
    parts.push(`${delivered.big || 0}/${required.big} Large`)
  }
  if (required.small > 0) {
    parts.push(`${delivered.small || 0}/${required.small} Small`)
  }
  if (parts.length === 0) return '0 blocks'
  return parts.join(', ')
}

const getTierClass = (tier) => {
  return `tier-${tier || 1}`
}

const getExpirationClass = (hoursRemaining) => {
  if (hoursRemaining <= 1) return 'expiring-soon'
  if (hoursRemaining <= 2) return 'expiring-warning'
  return 'expiring-normal'
}

const acceptContract = (index) => {
  console.log('[PhoneQuarry] Accepting contract at index:', index, '-> Lua index:', index + 1)
  console.log('[PhoneQuarry] Current state:', currentState.value)
  bngApi.engineLua(`gameplay_quarry.acceptContractFromUI(${index + 1})`)
}

const declineAll = () => {
  bngApi.engineLua('gameplay_quarry.declineAllContracts()')
}

const abandonContract = () => {
  bngApi.engineLua('gameplay_quarry.abandonContractFromUI()')
}

const sendTruck = () => {
  bngApi.engineLua('gameplay_quarry.sendTruckFromUI()')
}

const finalizeContract = () => {
  bngApi.engineLua('gameplay_quarry.finalizeContractFromUI()')
}

const loadMore = () => {
  bngApi.engineLua('gameplay_quarry.loadMoreFromUI()')
}

// State update handler
const handleStateUpdate = (data) => {
  if (!data) return
  
  // Map numeric states to string states
  const stateMap = {
    0: 'idle',
    1: 'contract_select',
    2: 'choosing_zone',      // NEW: Player choosing which zone to load from
    3: 'driving_to_site',
    4: 'truck_arriving',
    5: 'loading',
    6: 'delivering',
    7: 'return_to_quarry',
    8: 'at_quarry_decide'
  }
  
  currentState.value = stateMap[data.state] || 'idle'
  playerLevel.value = data.playerLevel || 1
  contractsCompleted.value = data.contractsCompleted || 0
  availableContracts.value = data.availableContracts || []
  activeContract.value = data.activeContract || null
  contractProgress.value = data.contractProgress || { deliveredTons: 0, totalPaidSoFar: 0, deliveryCount: 0 }
  currentLoadMass.value = data.currentLoadMass || 0
  targetLoad.value = data.targetLoad || 25000
  materialType.value = data.materialType || 'rocks'
  marbleBlocks.value = data.marbleBlocks || []
  anyMarbleDamaged.value = data.anyMarbleDamaged || false
  deliveryBlocks.value = data.deliveryBlocks || []
  markerCleared.value = data.markerCleared || false
  truckStopped.value = data.truckStopped || false
}

onMounted(() => {
  events.on('updateQuarryState', handleStateUpdate)
  // Request initial state using bngApi
  bngApi.engineLua('gameplay_quarry.requestQuarryState()')
})

onUnmounted(() => {
  events.off('updateQuarryState', handleStateUpdate)
})
</script>

<style scoped lang="scss">
.quarry-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow-y: auto;
  padding-bottom: 2em;
}

.stats-bubble {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  padding: 0.5em 1em;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 0.95em;
  display: flex;
  gap: 0.5em;
  align-items: center;
  z-index: 5;
  
  .divider {
    opacity: 0.4;
  }
}

// State Panels
.state-panel {
  padding: 80px 1em 1em 1em;
  display: flex;
  flex-direction: column;
  gap: 1em;
  
  &.centered {
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 100%;
    padding-top: 40%;
  }
  
  &.loading {
    padding-top: 70px;
  }
}

.state-icon {
  font-size: 4em;
  margin-bottom: 0.25em;
  
  &.pulsing {
    animation: pulse 2s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.state-title {
  font-size: 1.5em;
  font-weight: 700;
  color: #fff;
  
  &.complete {
    color: #4ade80;
  }
}

.state-message {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1em;
  max-width: 280px;
}

// Contract List
.contract-list {
  padding: 70px 0.75em 1em 0.75em;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.contracts-header {
  margin-bottom: 1em;
  
  .header-title {
    font-size: 1.3em;
    font-weight: 700;
    color: #fff;
  }
  
  .header-subtitle {
    font-size: 0.9em;
    color: rgba(255, 255, 255, 0.6);
  }
}

.contracts-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  margin-bottom: 1em;
  padding-right: 0.25em;
}

.no-contracts {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 2em;
}

.contract-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.75em;
  text-align: left;
  transition: all 0.2s ease;
  
  &.tier-1 { border-left: 3px solid #4ade80; }
  &.tier-2 { border-left: 3px solid #60a5fa; }
  &.tier-3 { border-left: 3px solid #fbbf24; }
  &.tier-4 { border-left: 3px solid #f87171; }
}

.contract-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5em;
  
  .contract-name {
    font-weight: 600;
    color: #fff;
    font-size: 1em;
  }
  
  .contract-payout {
    font-weight: 700;
    color: #4ade80;
    font-size: 1.1em;
  }
}

.contract-details {
  display: flex;
  gap: 0.5em;
  margin-bottom: 0.5em;
  flex-wrap: wrap;
}

.tier-badge, .material-badge, .location-badge {
  font-size: 0.75em;
  padding: 0.2em 0.5em;
  border-radius: 4px;
  font-weight: 600;
}

.tier-badge {
  &.tier-1 { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
  &.tier-2 { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
  &.tier-3 { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
  &.tier-4 { background: rgba(248, 113, 113, 0.2); color: #f87171; }
}

.material-badge {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.location-badge {
  background: rgba(147, 51, 234, 0.2);
  color: #c084fc;
}

.contract-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  color: rgba(255, 255, 255, 0.6);
}

.contract-modifiers {
  display: flex;
  gap: 0.4em;
  margin-top: 0.5em;
  flex-wrap: wrap;
}

.modifier-badge {
  font-size: 0.7em;
  padding: 0.15em 0.4em;
  border-radius: 3px;
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  font-weight: 500;
}

.urgent-badge {
  font-size: 0.7em;
  padding: 0.15em 0.5em;
  border-radius: 3px;
  background: linear-gradient(135deg, rgba(255, 140, 0, 0.3), rgba(255, 80, 0, 0.3));
  color: #ff8c00;
  font-weight: 600;
  animation: urgentPulse 1.5s ease-in-out infinite;
}

@keyframes urgentPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.contract-card.urgent {
  border-color: rgba(255, 140, 0, 0.5);
  background: linear-gradient(135deg, rgba(255, 140, 0, 0.1), rgba(255, 255, 255, 0.08));
}

.contract-expiration {
  font-size: 0.75em;
  margin-top: 0.4em;
  padding: 0.3em 0.5em;
  border-radius: 4px;
}

.contract-expiration.expiring-soon {
  background: rgba(255, 100, 100, 0.2);
  color: #ff6b6b;
  animation: expiringBlink 1s ease-in-out infinite;
}

@keyframes expiringBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.contract-expiration.expiring-warning {
  background: rgba(255, 180, 100, 0.15);
  color: #ffb464;
}

.contract-expiration.expiring-normal {
  background: rgba(100, 100, 100, 0.15);
  color: rgba(255, 255, 255, 0.5);
}

.accept-button {
  width: 100%;
  margin-top: 0.75em;
  padding: 0.6em 1em;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, #16a34a, #15803d);
    transform: scale(1.02);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

// Active Contract Info
.active-contract-info {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 0.75em;
  
  .contract-name {
    font-weight: 600;
    color: #fff;
    font-size: 1em;
    margin-bottom: 0.25em;
  }
  
  .contract-progress {
    font-size: 0.9em;
    color: rgba(255, 255, 255, 0.8);
    
    &.complete {
      color: #4ade80;
    }
  }
  
  .complete-badge {
    background: #4ade80;
    color: #000;
    padding: 0.1em 0.4em;
    border-radius: 4px;
    font-size: 0.8em;
    font-weight: 700;
    margin-left: 0.5em;
  }
  
  .payout-info {
    font-size: 0.9em;
    color: #4ade80;
    margin-top: 0.25em;
    font-weight: 600;
    
    &.complete {
      color: #22c55e;
      font-size: 1em;
    }
  }
}

// Status Section
.status-section {
  text-align: center;
  padding: 1.5em 0;
}

// Payload Section
.payload-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 0.75em;
}

.payload-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5em;
  
  .payload-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9em;
  }
  
  .payload-value {
    color: #fff;
    font-weight: 600;
    font-size: 0.9em;
  }
}

.payload-bar-container {
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.payload-bar {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  border-radius: 12px;
  transition: width 0.3s ease;
  
  &.full {
    background: linear-gradient(90deg, #4ade80, #22c55e);
  }
}

.payload-percent {
  text-align: center;
  font-weight: 700;
  font-size: 1.2em;
  color: #fff;
  margin-top: 0.5em;
}

// Blocks Section
.blocks-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 0.75em;
}

.blocks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5em;
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.8);
  
  .damage-warning {
    color: #fbbf24;
    font-size: 0.8em;
  }
}

.blocks-list {
  display: flex;
  flex-direction: column;
  gap: 0.4em;
}

.block-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4em 0.6em;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 0.85em;
  
  &.damaged {
    background: rgba(248, 113, 113, 0.15);
  }
  
  .block-label {
    color: #fff;
    font-weight: 500;
  }
  
  .block-status {
    color: #4ade80;
    font-weight: 600;
    
    &.damaged {
      color: #f87171;
      animation: blink 1s ease-in-out infinite;
    }
  }
  
  .block-loaded {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9em;
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// Delivering Blocks
.delivering-blocks {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 0.75em;
  
  .delivering-header {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9em;
    margin-bottom: 0.5em;
  }
  
  .delivering-block {
    font-size: 0.85em;
    color: #4ade80;
    padding: 0.2em 0;
    
    &.damaged {
      color: #fbbf24;
      opacity: 0.7;
    }
  }
}

// Actions Section
.actions-section {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
}

// Action Buttons
.action-button {
  width: 100%;
  padding: 0.9em;
  border: none;
  border-radius: 12px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.02);
  }
  
  &.primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: #fff;
  }
  
  &.success {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff;
  }
  
  &.danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: #fff;
  }
  
  &.decline {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    
    &:hover {
      background: rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
  }
  
  &.small {
    padding: 0.6em;
    font-size: 0.9em;
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    
    &:hover {
      background: rgba(239, 68, 68, 0.4);
    }
  }
}
</style>


