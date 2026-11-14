import { describe, expect, it } from 'vitest'
import { fitLandmarks, type Vec3 } from './astrobone'

describe('fitLandmarks', () => {
  it('recovers a known scale and offset', () => {
    const t = (p: Vec3): Vec3 => [p[0] * 1.7 + 0.02, p[1] * 1.7 + 0.01, p[2] * 1.7 - 0.03]
    const a: Vec3[] = [[0.01, 0.76, 0.02], [0, 0.64, -0.01], [0, 0.95, 0], [0, 0.52, 0]]
    const { scale, offset } = fitLandmarks(a.map((p) => [p, t(p)]))
    expect(scale).toBeCloseTo(1.7, 1)
    expect(offset[0]).toBeCloseTo(0.02, 2)
    expect(offset[2]).toBeCloseTo(-0.03, 2)
  })
  it('keeps the feet near the floor', () => {
    const { scale, offset } = fitLandmarks([[[0, 0.75, 0], [0, 1.3, 0]]])
    expect(scale * 0 + offset[1]).toBeCloseTo(0, 1)
  })
})
