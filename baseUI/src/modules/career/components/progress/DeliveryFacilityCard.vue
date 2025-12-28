<template>

  <div class="facility-info" :class="{ 'invisible': !facility }" v-if="facility">
    <div class="button" v-if="facility">
      <BngButton accent="text" :icon="icons.location2" @click="goToBigMap" />
    </div>
    <div class="info-text">
      <div class="name">{{ $tt(facility.label) }}</div>
      <div v-if="facility.description" class="description">
        {{ $tt(facility.description) }}
      </div>
    </div>
  </div>

  <div class="orders-box available" v-if="facility">
    <div class="orders-container">
      <template v-for="orders in facility.availableOrders">
        <div v-if="orders.amounts.available > 0" class="order-item">
          <BngIcon :type="icons[orders.icon]" class="icon" />
          <div class="order-amount">×{{orders.amounts.available}}</div>
        </div>
      </template>
      <div v-if="!hasAvailableOrders" class="empty-message">
        None
      </div>
    </div>
  </div>

  <div class="orders-box locked" v-if="facility">
    <div class="orders-container">
      <template v-for="orders in facility.availableOrders">
        <div v-if="orders.amounts.locked > 0" class="order-item">
          <BngIcon :type="icons[orders.icon]" class="icon" />
          <div class="order-amount">×{{orders.amounts.locked}}</div>
        </div>
      </template>
      <div v-if="!hasLockedOrders" class="empty-message">
        None
      </div>
    </div>
  </div>

  <!-- Undiscovered facility -->
  <div class="facility-info gray" v-if="!facility" style="grid-column: 1 / -1">
    <div class="name">Facility not yet discovered</div>
    <div class="description">
      Find this facility in the world to track it here
    </div>
  </div>
</template>

<script>

</script>

<script setup>
import { BngIcon, icons, BngCard,  BngButton } from "@/common/components/base"
import { vBngDisabled } from "@/common/directives"
import RewardsPills from "../progress/RewardsPills.vue"
import { computed } from 'vue'

const props = defineProps({
  facility: Object,
  invisible: Number,
  isSkeleton: Boolean,
})

const emit = defineEmits(["goToBigMap"])

const goToBigMap = () => emit("goToBigMap", props.facility)

const hasAvailableOrders = computed(() => {
  if (!props.facility || !props.facility.availableOrders) return false
  return props.facility.availableOrders.some(order => order.amounts.available > 0)
})

const hasLockedOrders = computed(() => {
  if (!props.facility || !props.facility.availableOrders) return false
  return props.facility.availableOrders.some(order => order.amounts.locked > 0)
})
</script>

<style scoped lang="scss">

.facility-info {
  padding: 0.5rem;
  padding-right: 1rem;
  background-color: rgba(var(--bng-cool-gray-700-rgb), 0.5);
  border-radius: var(--bng-corners-2);
  display: flex;
  gap: 1rem;

  .button {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-left: 0.5rem;
  }

  &.invisible {
    opacity: 0.6;
  }

  &.gray {
    grid-column: 1 / -1;
    text-align: center;
    align-items: center;
    justify-content: center;
    color: rgba(var(--bng-cool-gray-600-rgb),0.6);
    background-color: rgba(var(--bng-cool-gray-900-rgb), 0.9);
  }

  .info-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .name {
    font-weight: 800;
    font-size: 1.25rem;
  }
  .description {
    font-weight: 300;
  }
}

.orders-box {
  padding: 0.5rem;
  background-color: rgba(var(--bng-cool-gray-700-rgb), 0.9);
  border-radius: var(--bng-corners-2);

  &.available {
    background-color: rgba(var(--branch-accent-color), 0.2);
  }

  &.locked {
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.5);
    .order-item {
      opacity: 0.6;
    }
  }

  .orders-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }

  .order-item {
    display: flex;
    flex-flow: row;
    align-items: center;
    padding: 0.3rem 0.5rem;

    > .icon {
      padding-right: 0.15rem;
      font-size: 2.5rem;
    }

    > .order-amount {
      font-size: 1.8rem;
      display: flex;
      align-items: center;
    }
  }

  .empty-message {
    opacity: 0.5;
    padding: 1rem;
    text-align: center;
    font-style: italic;
  }
}

// Update hover states to preserve accent color
.facility-info,
.orders-box.locked {
  &:hover {
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.9);
  }
}

.orders-box.available {
  &:hover {
    background-color: rgba(var(--branch-accent-color), 0.3);
  }
}
</style>
