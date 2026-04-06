import { describe, it, expect } from 'vitest'
import { buildPageMap, getDisplayOrderedRecipes } from '@/lib/cookbookPages'

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

describe('getDisplayOrderedRecipes', () => {
  it('sorts by orderIndex when there are no chapters', () => {
    const recipes = [
      { id: 'r3', orderIndex: 2 },
      { id: 'r1', orderIndex: 0 },
      { id: 'r2', orderIndex: 1 },
    ]

    expect(getDisplayOrderedRecipes(recipes).map((recipe) => recipe.id)).toEqual([
      'r1',
      'r2',
      'r3',
    ])
  })

  it('orders chapter recipes by chapter order, then appends uncategorized recipes', () => {
    const recipes = [
      { id: 'uncategorized', orderIndex: 0, chapterId: null },
      { id: 'chapter-b', orderIndex: 1, chapterId: 'chapter-b' },
      { id: 'chapter-a', orderIndex: 2, chapterId: 'chapter-a' },
    ]
    const chapters = [
      { id: 'chapter-a', orderIndex: 0 },
      { id: 'chapter-b', orderIndex: 1 },
    ]

    expect(
      getDisplayOrderedRecipes(recipes, chapters).map((recipe) => recipe.id),
    ).toEqual(['chapter-a', 'chapter-b', 'uncategorized'])
  })
})
