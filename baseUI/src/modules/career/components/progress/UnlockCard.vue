<template>
  <template v-if="data.type != 'tasklist'">
    <div class="wrapper">
      <BngIcon class="icon" :type="icons[data.icon]" />
      <div class="heading">
        {{ data.heading }}
      </div>
      <div class="description">
        {{ data.description }}
      </div>
    </div>
  </template>
  <template v-if="data.type == 'tasklist'">
    <div class="tasklist wrapper">
      <div class="task" v-for="task in data.tasklistData.tasks" :key="task.label">
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
</template>

<script setup>
import { BngIcon, icons } from "@/common/components/base"
import TaskGoal from "@/modules/tasks/components/TaskGoal.vue"
const props = defineProps({
  data: Object,
})
</script>

<style scoped lang="scss">
.wrapper {
  width: auto;
  padding: 0.5rem;
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
 gap: 0.5rem;
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
