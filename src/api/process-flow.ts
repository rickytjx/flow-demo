import type { ProcessFlowData, ProcessFlowRequest, ProcessFlowResponse } from '~/types/flow'
import { http } from './http'

export async function fetchProcessFlow(payload: ProcessFlowRequest): Promise<ProcessFlowData> {
  const response = await http.post<ProcessFlowResponse>('/process-flow', payload)
  const { data } = response

  if (data.code !== 0)
    throw new Error(data.message || 'Request failed')
  if (!data.data)
    throw new Error('Empty response data')

  return data.data
}
