import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'

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

const minNodes = 3
const defaultMaxNodes = 10

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

function randomFloat(rng: () => number, min: number, max: number, precision = 1) {
  const factor = 10 ** precision
  return Math.round((rng() * (max - min) + min) * factor) / factor
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function buildSteps(seed: string, maxNodes: number) {
  const rng = createRng(seedFromString(seed))
  const count = randomInt(rng, minNodes, Math.max(minNodes, maxNodes))

  return Array.from({ length: count }, (_, index) => {
    const caseCount = randomInt(rng, 120, 1200)
    const minMinutes = randomFloat(rng, 5, 120)
    const medianMinutes = minMinutes + randomFloat(rng, 30, 360)
    const maxMinutes = medianMinutes + randomFloat(rng, 180, 1440)
    const id = `step-${index + 1}`

    return {
      id,
      name: titlePool[randomInt(rng, 0, titlePool.length - 1)],
      order: index + 1,
      durationMinutes: randomInt(rng, 30, 6000),
      stats: {
        caseCount,
        executionCount: caseCount,
        throughputMinutes: {
          min: minMinutes,
          median: medianMinutes,
          max: maxMinutes,
        },
      },
    }
  })
}

function buildLinks(steps: { id: string }[]) {
  return steps.slice(0, -1).map((step, index) => ({
    id: `edge-${step.id}-${steps[index + 1].id}`,
    sourceId: step.id,
    targetId: steps[index + 1].id,
  }))
}

export default [
  {
    url: '/api/process-flow',
    method: 'post',
    response: ({ body }) => {
      const seed = String(body?.seed ?? '').trim()
      if (!seed) {
        return {
          code: 4001,
          message: 'seed is required',
          data: null,
        }
      }

      const maxNodesInput = Number(body?.maxNodes ?? defaultMaxNodes)
      const maxNodes = clamp(Number.isFinite(maxNodesInput) ? maxNodesInput : defaultMaxNodes, minNodes, 10)
      const steps = buildSteps(seed, maxNodes)
      const links = buildLinks(steps)

      return Mock.mock({
        code: 0,
        message: 'ok',
        data: {
          steps,
          links,
        },
      })
    },
  },
] as MockMethod[]
