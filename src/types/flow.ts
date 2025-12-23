export interface ProcessFlowRequest {
  seed: string
  maxNodes?: number
}

export interface ProcessFlowResponse {
  code: number
  message: string
  data: ProcessFlowData | null
}

export interface ProcessFlowData {
  steps: ProcessFlowStep[]
  links: ProcessFlowLink[]
}

export interface ProcessFlowStep {
  id: string
  name: string
  order: number
  durationMinutes: number
  stats: ProcessFlowStats
}

export interface ProcessFlowLink {
  id: string
  sourceId: string
  targetId: string
}

export interface ProcessFlowStats {
  caseCount: number
  executionCount: number
  throughputMinutes: {
    median: number
    max: number
    min: number
  }
}

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
