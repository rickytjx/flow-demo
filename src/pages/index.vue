<script setup lang="ts">
import type { Edge, Node, NodeMouseEvent } from '@vue-flow/core'
import type { FlowNodeData, ProcessFlowData, ProcessFlowLink, ProcessFlowStep } from '~/types/flow'
import { ControlButton, Controls } from '@vue-flow/controls'
import { MarkerType, useVueFlow, VueFlow } from '@vue-flow/core'
import { fetchProcessFlow } from '~/api/process-flow'
import FlowTooltip from '~/components/FlowTooltip.vue'
import ProcessNode from '~/components/ProcessNode.vue'
import { useLayout } from '~/composables/useLayout'

defineOptions({
  name: 'IndexPage',
})

const seedText = ref('')
const nodes = ref<Node<FlowNodeData>[]>([])
const edges = ref<Edge[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const nodeTypes = {
  process: markRaw(ProcessNode),
}

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  data: null as FlowNodeData | null,
  nodeId: null as string | null,
  locked: false,
})

const flowWrapper = ref<HTMLDivElement | null>(null)
const layout = useLayout({ direction: 'TB' })
const flowId = 'process-flow'
const { fitView } = useVueFlow({ id: flowId })
const fitViewOptions = { padding: 0.2 }
const maxNodes = 10

function formatMinutes(totalMinutes: number) {
  const minutes = Number.isFinite(totalMinutes) ? totalMinutes : 0
  if (minutes < 60)
    return `${minutes.toFixed(1)}m`
  if (minutes < 1440)
    return `${(minutes / 60).toFixed(1)}h`
  return `${(minutes / 1440).toFixed(1)}d`
}

function mapStepsToNodes(steps: ProcessFlowStep[]): Node<FlowNodeData>[] {
  return steps.map(step => ({
    id: step.id,
    type: 'process',
    position: { x: 0, y: 0 },
    data: {
      title: step.name,
      duration: formatMinutes(step.durationMinutes),
      index: step.order,
      stats: {
        caseCount: step.stats.caseCount,
        executionCount: step.stats.executionCount,
        throughput: {
          min: formatMinutes(step.stats.throughputMinutes.min),
          median: formatMinutes(step.stats.throughputMinutes.median),
          max: formatMinutes(step.stats.throughputMinutes.max),
        },
      },
    },
  }))
}

function mapLinksToEdges(links: ProcessFlowLink[]): Edge[] {
  return links.map(link => ({
    id: link.id,
    source: link.sourceId,
    target: link.targetId,
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
    },
  }))
}

function buildEdgesFromSteps(steps: ProcessFlowStep[]): Edge[] {
  return steps.slice(0, -1).map((step, index) => ({
    id: `edge-${step.id}-${steps[index + 1].id}`,
    source: step.id,
    target: steps[index + 1].id,
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
    },
  }))
}

function applyFlow(data: ProcessFlowData) {
  hideTooltip()
  const sortedSteps = [...data.steps].sort((a, b) => a.order - b.order)
  const nextNodes = mapStepsToNodes(sortedSteps)
  const nextEdges = data.links.length > 0 ? mapLinksToEdges(data.links) : buildEdgesFromSteps(sortedSteps)
  nodes.value = layout(nextNodes, nextEdges)
  edges.value = nextEdges
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error)
    return error.message
  return '请求失败'
}

async function handleRequest() {
  const seed = seedText.value.trim()
  if (!seed) {
    errorMessage.value = '请输入测试字符串'
    return
  }

  errorMessage.value = ''
  isLoading.value = true

  try {
    const data = await fetchProcessFlow({ seed, maxNodes })
    applyFlow(data)
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
  finally {
    isLoading.value = false
  }
}

function isTouchLikeEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  if ('touches' in event || 'changedTouches' in event)
    return true
  return !!(event as any).sourceCapabilities?.firesTouchEvents
    || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
}

function getClientPoint(event: MouseEvent | TouchEvent) {
  if ('touches' in event) {
    const touch = event.touches[0] ?? event.changedTouches[0]
    return {
      x: touch?.clientX ?? 0,
      y: touch?.clientY ?? 0,
    }
  }
  return {
    x: event.clientX,
    y: event.clientY,
  }
}

function getRelativePoint(event: MouseEvent | TouchEvent) {
  const point = getClientPoint(event)
  const rect = flowWrapper.value?.getBoundingClientRect()
  if (!rect)
    return point

  return {
    x: point.x - rect.left + 12,
    y: point.y - rect.top + 12,
  }
}

function showTooltip(event: MouseEvent | TouchEvent, node: Node<FlowNodeData>, locked: boolean) {
  if (!node.data)
    return

  const { x, y } = getRelativePoint(event)
  tooltip.visible = true
  tooltip.x = x
  tooltip.y = y
  tooltip.data = node.data
  tooltip.nodeId = node.id
  tooltip.locked = locked
}

function updateTooltipPosition(event: MouseEvent | TouchEvent) {
  const { x, y } = getRelativePoint(event)
  tooltip.x = x
  tooltip.y = y
}

function hideTooltip() {
  tooltip.visible = false
  tooltip.data = null
  tooltip.nodeId = null
  tooltip.locked = false
}

function handleNodeMouseEnter({ event, node }: NodeMouseEvent) {
  if (isTouchLikeEvent(event))
    return
  showTooltip(event, node as Node<FlowNodeData>, false)
}

function handleNodeMouseMove({ event }: NodeMouseEvent) {
  if (isTouchLikeEvent(event) || !tooltip.visible || tooltip.locked)
    return
  updateTooltipPosition(event)
}

function handleNodeMouseLeave({ event }: NodeMouseEvent) {
  if (isTouchLikeEvent(event))
    return
  if (!tooltip.locked)
    hideTooltip()
}

function handleNodeClick({ event, node }: NodeMouseEvent) {
  if (!isTouchLikeEvent(event))
    return
  if (tooltip.visible && tooltip.nodeId === node.id && tooltip.locked) {
    hideTooltip()
    return
  }
  showTooltip(event, node as Node<FlowNodeData>, true)
}

function handlePaneClick() {
  if (tooltip.locked)
    hideTooltip()
}

function handleNodesInitialized() {
  if (nodes.value.length > 0)
    fitView(fitViewOptions)
}

watch(seedText, () => {
  if (errorMessage.value)
    errorMessage.value = ''
})
</script>

<template>
  <div class="bg-white flex flex-col h-full w-full dark:bg-slate-950">
    <header class="px-6 py-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between dark:border-slate-800">
      <div>
        <div class="text-lg text-slate-900 font-semibold dark:text-slate-100">
          流程图组件
        </div>
        <div class="text-sm text-slate-500 dark:text-slate-400">
          演示模式: 从输入生成确定性流程图
        </div>
      </div>
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex flex-col gap-1 min-w-[220px]">
          <label class="text-sm text-slate-600 dark:text-slate-300" for="seed-input">测试字符串</label>
          <input
            id="seed-input"
            v-model="seedText"
            type="text"
            placeholder="输入字符串"
            :disabled="isLoading"
            class="text-sm text-slate-800 px-3 py-2 border border-slate-200 rounded-md w-64 dark:text-slate-100 focus:outline-none dark:border-slate-700 dark:bg-slate-900 disabled:opacity-70 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
          >
          <div v-if="errorMessage" class="text-xs text-red-500 dark:text-red-400">
            {{ errorMessage }}
          </div>
        </div>
        <button
          type="button"
          :disabled="isLoading"
          class="text-sm text-white font-semibold px-4 rounded-md bg-blue-600 h-10 shadow-sm transition dark:bg-blue-500 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed dark:hover:bg-blue-400"
          @click="handleRequest"
        >
          {{ isLoading ? '请求中...' : '获取流程' }}
        </button>
      </div>
    </header>

    <div ref="flowWrapper" class="flex-1 relative">
      <VueFlow
        :id="flowId"
        v-model:nodes="nodes"
        v-model:edges="edges"
        :node-types="nodeTypes"
        :nodes-draggable="false"
        :nodes-connectable="false"
        :elements-selectable="false"
        :edges-updatable="false"
        :class="{ dark: isDark }"
        class="h-full w-full"
        @node-mouse-enter="handleNodeMouseEnter"
        @node-mouse-move="handleNodeMouseMove"
        @node-mouse-leave="handleNodeMouseLeave"
        @node-click="handleNodeClick"
        @nodes-initialized="handleNodesInitialized"
        @pane-click="handlePaneClick"
      >
        <Controls position="bottom-left">
          <ControlButton title="切换明暗" aria-label="切换明暗" @click="toggleDark()">
            <div v-if="isDark" class="i-carbon-sun text-slate-200" />
            <div v-else class="i-carbon-moon text-slate-700" />
          </ControlButton>
        </Controls>
      </VueFlow>

      <FlowTooltip
        :visible="tooltip.visible"
        :x="tooltip.x"
        :y="tooltip.y"
        :data="tooltip.data"
      />
    </div>
  </div>
</template>
