import { describe, it, expect } from 'vitest'
import { buildPageMap } from '@/lib/cookbookPages'

describe('buildPageMap', () => {
  it('returns an empty map for an empty input', () => {
    const map = buildPageMap([])
    expect(map.size).toBe(0)
  })

  it('assigns page 1 to the first recipe', () => {
    const map = buildPageMap([{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }])
    expect(map.get('r1')).toBe(1)
  })

  it('assigns sequential page numbers', () => {
    const map = buildPageMap([{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }])
    expect(map.get('r2')).toBe(2)
    expect(map.get('r3')).toBe(3)
  })

  it('has the correct number of entries', () => {
    const recipes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
    const map = buildPageMap(recipes)
    expect(map.size).toBe(4)
  })
})
