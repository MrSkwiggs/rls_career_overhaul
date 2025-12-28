<template>
  <div class="insurance-tiers">
    <div class="tier" v-for="tier in props.tiers" :key="tier.id">
      <div class="tier-discount" :class="{'isCurrent':tier.isCurrent}">
        <div v-if="props.showTier">
          Tier {{ tier.id }}
        </div>
        <div>
          {{ tier.discount * 100 }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  tiers: {
    type: Array,
    required: true,
  },
  showTier: {
    type: Boolean,
    default: false,
  }
})

</script>

<style lang="scss">
@import "insuranceStyle.css";
</style>

<style scoped lang="scss">

.tier{
  flex: 1;
  display:flex;
  flex-direction:column;
  align-items: center;
  justify-content: center;
}

.insurance-tiers{
  display: flex;
  flex-direction: row;
  gap: 10px;
  width: 100%;
}

.tier-discount{
  display: flex;
  flex-direction: column;

  width: 95%;
  text-align: center;
  border-radius: var(--bng-corners-2);
  background-color: var(--blue-500);
  padding-top:10px;
  padding-bottom:8px;

  opacity: 0.8;

  &.isCurrent{
    background-color: var(--orange-shade-20);
    opacity: 1;
  }
}
</style>