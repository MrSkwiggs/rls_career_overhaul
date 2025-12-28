<template>
  <div class="icons-list">
    <BngInput floating-label="Search by name and tags" :leading-icon="icons.search" v-model="browseSearch" />
    <BngList
      class="big-list" big immediate
      :target-width="5" :target-height="6" :target-margin="0.25"
    >
      <BngImageTile
        v-for="icon in browseList"
        :key="icon.__name"
        :icon="icon"
        :label="icon.__name"
        @click="select(icon.__name)"
      />
    </BngList>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { BngInput, BngList, BngImageTile, icons } from "@/common/components/base"

const emit = defineEmits(["select"])

const browseSearch = ref("")
const browseSearchable = computed(() => Object.keys(icons).map(name => ({ ...icons[name], __name: name, __search: `${name.toLowerCase()}|${icons[name].tags.join("|")}` })))

const browseList = computed(() => {
  if (!browseSearch.value) return browseSearchable.value
  const search = browseSearch.value.trim().toLowerCase().split(/ +/)
  return browseSearchable.value.filter(icon => search.every(word => icon.__search.includes(word)))
})

const select = name => emit("select", { name, ...icons[name] })
</script>

<style lang="scss" scoped>
.icons-list {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  width: 100%;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

.big-list {
  flex: 1 1 auto;
  overflow: hidden;
  :deep(.tile) {
    display: inline-block;
    min-width: unset;
    > * {
      display: block;
    }
    .slotted {
      overflow: hidden;
    }
    .label {
      padding: 0;
      font-size: 0.8em;
      overflow-wrap: break-word;
    }
  }
}
</style>
