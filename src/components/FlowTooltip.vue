<script setup lang="ts">
import type { FlowNodeData } from '~/types/flow'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  data: FlowNodeData | null
}>()
</script>

<template>
  <div
    v-if="props.visible && props.data"
    class="pointer-events-none absolute z-50"
    :style="{ left: `${props.x}px`, top: `${props.y}px` }"
  >
    <div class="text-xs text-white px-3 py-2 rounded-md bg-[#1e3a8a] opacity-95 min-w-[220px] shadow-lg">
      <div class="text-sm font-semibold mb-2">
        {{ props.data.title }}
      </div>
      <div class="flex gap-4 justify-between">
        <span class="opacity-80">Case Count</span>
        <span class="font-semibold">{{ props.data.stats.caseCount }}</span>
      </div>
      <div class="flex gap-4 justify-between">
        <span class="opacity-80">Execution Count</span>
        <span class="font-semibold">{{ props.data.stats.executionCount }}</span>
      </div>
      <div class="text-[11px] tracking-wide mt-2 opacity-70 uppercase">
        Throughput Time
      </div>
      <div class="mt-1 flex gap-4 justify-between">
        <span class="opacity-80">Median</span>
        <span class="font-semibold">{{ props.data.stats.throughput.median }}</span>
      </div>
      <div class="flex gap-4 justify-between">
        <span class="opacity-80">Max</span>
        <span class="font-semibold">{{ props.data.stats.throughput.max }}</span>
      </div>
      <div class="flex gap-4 justify-between">
        <span class="opacity-80">Min</span>
        <span class="font-semibold">{{ props.data.stats.throughput.min }}</span>
      </div>
    </div>
  </div>
</template>
