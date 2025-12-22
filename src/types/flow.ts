export interface FlowStats {
  caseCount: number
  executionCount: number
  throughput: {
    median: string
    max: string
    min: string
  }
}

export interface FlowNodeData {
  title: string
  duration: string
  index: number
  stats: FlowStats
}
