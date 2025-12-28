<template>
  <div class="timeslip" id="slip">
    <div class="rip reverse top"></div>
    <div class="paper">
      <div class="header">
        <div v-for="info in slip.stripInfo" :key="info">
          {{$tt(info)}}
        </div>
      </div>
      <div class="table-wrapper">
        <table class="custom-table">
          <tbody>
            <tr v-for="(rowInfo, rowIndex) in TIMER_ROWS_INFO" :key="'timer-' + rowIndex"
                :class="{ 'quarter-mile-row': rowInfo.key === 'time_1_4' }">
              <td class="left-align">{{ rowInfo.label }}</td>
              <td class="right-align">{{ getTimerValue(2, rowInfo.key) }}</td>
              <td class="right-align">{{ getTimerValue(1, rowInfo.key) }}</td>
            </tr>
            <tr v-if="slip.racerInfos.length > 1">
              <td class="left-align"></td>
              <td class="right-align">{{ getWinnerResult(2) }}</td>
              <td class="right-align">{{ getWinnerResult(1) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <template v-for="racer in slip.racerInfos" :key="racer.name">
        <div class="racer">
          <div class="header">
            <div class="left">
              {{ racer.lane }}
            </div>
            <div class="right">
              {{ racer.licenseText }}
            </div>
          </div>
          <div class="name">
            {{ racer.name }}
          </div>
          <div v-if="Object.keys(racer.rewards).length !== 0" class="rewards">
            Rewards...
            <template v-for="reward in racer.rewards">
              <div class="reward">
                {{ reward }} BMRA-XP
                <BngIcon
                class="reward-icon"
                :type="icons.wheelOutline"
                :color="'black'"
                />
              </div>
            </template>
            <template>
              ...
            </template>
          </div>
        </div>
      </template>
      <div class="header">
        <div>
          {{ units.buildString('temperature', slip.env.tempC, 1, 'c') }} /
          {{ units.buildString('temperature', slip.env.tempC, 1, 'f') }}
        </div>
        <div v-if="slip.env.customGrav">
          {{ $tt("ui.environment.gravity") }}: {{ slip.env.gravity }}
        </div>
      </div>
    </div>
    <div class="rip bottom"></div>
  </div>
</template>

<script setup>
import { useBridge } from '@/bridge';
import { BngIcon, icons } from "@/common/components/base"
const { units } = useBridge()

const props = defineProps({
  slip: Object,
});

const TIMER_ROWS_INFO = [
  { key: "laneName", label: "Lane" },
  { key: null, label: "" },
  { key: "dial", label: "DIAL" },
  { key: "reactionTime", label: "R/T" },
  { key: "time_60", label: "60'" },
  { key: "time_330", label: "330'" },
  { key: "time_1_8", label: "1/8" },
  { key: "velAt_1_8_kmh", label: "KM/H" },
  { key: "velAt_1_8_mph", label: "MPH" },
  { key: "time_1000", label: "1000'" },
  { key: "time_1_4", label: "1/4" },
  { key: "velAt_1_4_kmh", label: "KM/H" },
  { key: "velAt_1_4_mph", label: "MPH" },
  { key: "dialDiff", label: "DIFF" },
]

const RACER_ROWS_INFO = [
  { key: "lane", label: "Lane" },
  { key: "licenseText", label: "License" },
  { key: "name", label: "Vehicle" },
  { key: "stock", label: "" },
]

const getRacerByLane = (laneNum) => {
  return props.slip.racerInfos.find(racer => racer.laneNum === laneNum)
}

const getRacerValue = (laneNum, key) => {
  const racer = getRacerByLane(laneNum)
  if (!racer) return '-'

  const value = racer[key]
  if (value === undefined || value === null) return '-'

  if (key === 'dial') {
    const num = parseFloat(value)
    if (isNaN(num)) return '-'
    return num.toFixed(3)
  }

  return value
}

const getTimerValue = (laneNum, timerKey) => {
  const racer = getRacerByLane(laneNum)
  if (!racer) return '-'

  if (timerKey === null) return ''

  if (timerKey === 'laneName') {
    return racer.lane || '-'
  }

  if (timerKey === 'dial') {
    if (props.slip.dragType !== 'bracketRace') return '-'
    const racer = getRacerByLane(laneNum)
    if (!racer) return '-'
    const value = racer.timers.dial
    if (value === undefined || value === null) return '-'
    const num = parseFloat(value)
    if (isNaN(num)) return '-'
    return num.toFixed(3)
  }

  if (timerKey === 'dialDiff') {
    if (props.slip.dragType !== 'bracketRace') return '-'
    const racer = getRacerByLane(laneNum)
    if (!racer) return '-'
    const value = racer.dialDiff
    if (value === undefined || value === null) return '-'
    return formatDialDiff(value)
  }

  if (timerKey.includes('velAt_')) {
    if (timerKey.includes('_kmh')) {
      const baseKey = timerKey.replace('_kmh', '')
      return racer.velocities[baseKey + '_km/h'] || '-'
    } else if (timerKey.includes('_mph')) {
      const baseKey = timerKey.replace('_mph', '')
      return racer.velocities[baseKey + '_mph'] || '-'
    }
  }

  return racer.timers[timerKey] || '-'
}

const formatDialDiff = (value) => {
  if (value === '-') return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  return (num > 0 ? '+' : '') + num.toFixed(3)
}

const getWinnerResult = (laneNum) => {
  const racer = getRacerByLane(laneNum)
  if (!racer) return '-'

  if (racer.disqualification) return 'DQ'

  if (props.slip.racerInfos.length === 1) return '-'

  const otherLane = laneNum === 1 ? 2 : 1
  const otherRacer = getRacerByLane(otherLane)

  if (!otherRacer) return '-'
  if (otherRacer.disqualification) return 'WINNER'

  if (props.slip.dragType === 'bracketRace') {
    const thisDiff = parseFloat(racer.dialDiff)
    const otherDiff = parseFloat(otherRacer.dialDiff)

    if (thisDiff === otherDiff) return 'TIE'
    if (thisDiff > 0 && otherDiff > 0) {
      return thisDiff < otherDiff ? 'WINNER' : ' '
    } else {
      return thisDiff > otherDiff ? 'WINNER' : 'Break Out'
    }
  } else {
    const thisTime = parseFloat(racer.finalTime)
    const otherTime = parseFloat(otherRacer.finalTime)

    if (thisTime > otherTime) {
      return `+${(thisTime - otherTime).toFixed(3)}`
    } else {
      return 'WINNER'
    }
  }
}

</script>

<style scoped lang="scss">

 $top-paper: rgb(240,240,245);
 $mid-paper: rgb(255,255,255);
 $bot-paper: rgb(230,230,240);
 $dark-paper: rgb(200,200,215);

.timeslip {
  --font-size: calc(100% / 1vw);
  filter: drop-shadow(5px 5px 2px #8884);
  font-family: 'Courier New', monospace;
  color: rgba(20,10,0,0.8) !important;
  font-size: 14px;
  font-weight: bold;
  padding: 0.2rem 0.5rem  !important;
  height: auto;
  width: 100%;
  display: flex;
  flex-flow: column;

  .paper {
    background: linear-gradient( 180deg,
    $top-paper 0,
    $mid-paper 40%,
    $bot-paper 92%,
    $dark-paper 100%) repeat !important;

    > .header {
      display: flex;
      flex-flow:column;
      align-items: center;
      width: 100%;
      padding: 0.5rem 1rem;
      text-align:center;
    }

    > .table-wrapper {
      padding: 1rem;
      .custom-table {
        border-collapse: collapse;
        table-layout: fixed;
      }

      .custom-table td {
        padding: 0.25rem 0.5rem;
      }

      .left-align {
        text-align: left;
        white-space: nowrap;
        width: 0%;
      }

      .right-align {
        text-align: right;
        width: 30%;
      }

      .quarter-mile-row {
        font-size: 18px;
        font-weight: bold;
      }
    }

    .racer {
      padding: 0.5rem  1rem;
      display: flex;
      flex-flow:column;
      width: 100%;
      .header {
        display:flex;
        flex-flow: row;
        .left {
          flex: 1 1  auto;
        }
        .right {
          flex: 0 0 auto;
        }
      }
      .name {
        flex: 1 1 auto;
        text-align: justify;
        display: flex;
        flex-flow:column;
      }
      .rewards{
        display: flex;
        flex-direction: row;
        padding-top: 0.25rem;
        .reward{
          display: flex;
          flex: 1;
          text-align: justify;
          display: flex;
          flex-flow:row;
          padding-left: 1rem;
          .reward-icon{
            padding-left: 0.5rem;
            transform: translateY(-0.1rem);
          }
        }
      }
    }
  }
  .rip {
    content: "";
    width: 100%;
    height: 0.5rem;
    mask-image: url('/ui/ui-vue/src/modules/apps/dragRace/rip.svg');
    mask-size: contain;
    -webkit-mask-image: url('/ui/ui-vue/src/modules/apps/dragRace/rip.svg');
    -webkit-mask-size: contain;
    background-color: white;
  }
  .top {
    background-color: $top-paper;
  }
  .bottom {
    background-color: $dark-paper;
  }
  .reverse {
      transform: rotate(180deg);
  }
}

</style>