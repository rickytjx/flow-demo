<script setup lang="ts">
import type { Edge, Node, NodeMouseEvent } from '@vue-flow/core'
import type { FlowNodeData, FlowStats } from '~/types/flow'
import { ControlButton, Controls } from '@vue-flow/controls'
import { MarkerType, useVueFlow, VueFlow } from '@vue-flow/core'
import FlowTooltip from '~/components/FlowTooltip.vue'
import ProcessNode from '~/components/ProcessNode.vue'
import { useLayout } from '~/composables/useLayout'

defineOptions({
  name: 'IndexPage',
})

const seedText = ref('demo-mode')
const nodes = ref<Node<FlowNodeData>[]>([])
const edges = ref<Edge[]>([])
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

const titlePool = [
  'Application',
  'Review',
  'Approval',
  'Risk Check',
  'Investigation App',
  'Archive',
  'Verification',
  'Assessment',
  'Payment',
  'Closure',
]

function seedFromString(input: string) {
  let seed = 0
  for (let i = 0; i < input.length; i += 1) {
    seed = (seed + input.charCodeAt(i)) >>> 0
  }
  return seed || 1
}

function createRng(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function randomInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min
}

function formatDuration(totalMinutes: number) {
  if (totalMinutes < 60)
    return `${totalMinutes.toFixed(1)}m`
  if (totalMinutes < 1440)
    return `${(totalMinutes / 60).toFixed(1)}h`
  return `${(totalMinutes / 1440).toFixed(1)}d`
}

function buildStats(rng: () => number): FlowStats {
  const caseCount = randomInt(rng, 120, 1200)
  const minMinutes = randomInt(rng, 5, 120)
  const medianMinutes = minMinutes + randomInt(rng, 30, 360)
  const maxMinutes = medianMinutes + randomInt(rng, 180, 1440)

  return {
    caseCount,
    executionCount: caseCount,
    throughput: {
      min: formatDuration(minMinutes),
      median: formatDuration(medianMinutes),
      max: formatDuration(maxMinutes),
    },
  }
}

function buildFlow(input: string) {
  const seed = seedFromString(input.trim())
  const rng = createRng(seed)
  const count = randomInt(rng, 3, 10)

  const generatedNodes: Node<FlowNodeData>[] = Array.from({ length: count }, (_, index) => {
    const title = titlePool[randomInt(rng, 0, titlePool.length - 1)]
    const duration = formatDuration(randomInt(rng, 30, 6000))
    const stats = buildStats(rng)
    const id = `step-${index + 1}`

    return {
      id,
      type: 'process',
      position: { x: 0, y: 0 },
      data: {
        title,
        duration,
        index: index + 1,
        stats,
      },
    }
  })

  const generatedEdges: Edge[] = generatedNodes.slice(0, -1).map((node, index) => {
    const target = generatedNodes[index + 1]
    return {
      id: `edge-${node.id}-${target.id}`,
      source: node.id,
      target: target.id,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
      },
    }
  })

  return {
    nodes: generatedNodes,
    edges: generatedEdges,
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

function rebuildFlow() {
  hideTooltip()
  const { nodes: nextNodes, edges: nextEdges } = buildFlow(seedText.value)
  nodes.value = layout(nextNodes, nextEdges)
  edges.value = nextEdges
}

function handleNodesInitialized() {
  fitView(fitViewOptions)
}

const rebuildFlowDebounced = useDebounceFn(rebuildFlow, 300)

watch(seedText, () => {
  rebuildFlowDebounced()
})

onMounted(() => {
  rebuildFlow()
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
      <div class="flex gap-3 items-center">
        <label class="text-sm text-slate-600 dark:text-slate-300" for="seed-input">测试字符串</label>
        <input
          id="seed-input"
          v-model="seedText"
          type="text"
          placeholder="Enter a string"
          class="text-sm text-slate-800 px-3 py-2 border border-slate-200 rounded-md w-64 dark:text-slate-100 focus:outline-none dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
        >
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
            <div v-if="isDark" class="i-carbon-moon text-slate-200" />
            <div v-else class="i-carbon-sun text-slate-700" />
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
