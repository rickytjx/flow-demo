<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import type { FlowNodeData } from '~/types/flow'
import { Handle, Position } from '@vue-flow/core'
import { NODE_HEIGHT, NODE_WIDTH } from '~/constants/flow'

const props = defineProps<NodeProps<FlowNodeData>>()

const nodeStyle = {
  width: `${NODE_WIDTH}px`,
  height: `${NODE_HEIGHT}px`,
}
</script>

<template>
  <div
    class="px-3 border border-slate-200 rounded-md bg-white flex gap-3 items-center relative dark:border-slate-700 dark:bg-slate-900"
    :style="nodeStyle"
  >
    <Handle
      type="target"
      :position="Position.Top"
      class="!border-white !bg-blue-600 !h-2 !w-2"
    />
    <Handle
      type="source"
      :position="Position.Bottom"
      class="!border-white !bg-blue-600 !h-2 !w-2"
    />

    <div class="text-sm text-white font-semibold rounded-sm bg-blue-600 flex shrink-0 h-8 w-8 items-center justify-center dark:bg-blue-500">
      <slot name="badge" :index="props.data?.index">
        {{ props.data?.index }}
      </slot>
    </div>

    <div class="min-w-0">
      <div class="text-sm text-slate-900 font-semibold truncate dark:text-slate-100">
        {{ props.data?.title ?? props.label }}
      </div>
      <div class="text-xs text-slate-500 dark:text-slate-400">
        {{ props.data?.duration }}
      </div>
    </div>
  </div>
</template>
