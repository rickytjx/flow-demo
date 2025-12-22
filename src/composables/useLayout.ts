import type { Edge, Node } from '@vue-flow/core'
import { Position } from '@vue-flow/core'
import * as dagre from 'dagre'
import { NODE_HEIGHT, NODE_WIDTH } from '~/constants/flow'

interface LayoutOptions {
  direction?: 'TB' | 'LR'
  nodeSep?: number
  rankSep?: number
}

export function useLayout(options: LayoutOptions = {}) {
  const {
    direction = 'TB',
    nodeSep = 32,
    rankSep = 56,
  } = options

  return (nodes: Node[], edges: Edge[]) => {
    const graph = new dagre.graphlib.Graph()
    graph.setDefaultEdgeLabel(() => ({}))
    graph.setGraph({ rankdir: direction, nodesep: nodeSep, ranksep: rankSep })

    nodes.forEach((node) => {
      graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
    })

    edges.forEach((edge) => {
      graph.setEdge(edge.source, edge.target)
    })

    dagre.layout(graph)

    return nodes.map((node) => {
      const layouted = graph.node(node.id)
      const position = {
        x: layouted.x - NODE_WIDTH / 2,
        y: layouted.y - NODE_HEIGHT / 2,
      }

      return {
        ...node,
        position,
        targetPosition: direction === 'TB' ? Position.Top : Position.Left,
        sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
      }
    })
  }
}
