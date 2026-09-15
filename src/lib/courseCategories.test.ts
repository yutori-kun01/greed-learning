import { describe, it, expect } from 'vitest'
import { categoriesFrom, categoryLabel } from './courseCategories'

describe('categoriesFrom', () => {
  it('only offers categories that courses actually use', () => {
    expect(categoriesFrom([{ cat: 'strategy' }, { cat: 'strategy' }, { cat: 'content' }])).toEqual([
      { id: 'all', label: 'すべて' },
      { id: 'strategy', label: '戦略・思考' },
      { id: 'content', label: 'コンテンツ' },
    ])
  })

  it('includes categories the admin invented, labelled by their id', () => {
    const chips = categoriesFrom([{ cat: 'strategy' }, { cat: 'automation' }])
    expect(chips.map(c => c.id)).toEqual(['all', 'strategy', 'automation'])
    expect(categoryLabel('automation')).toBe('automation')
  })

  it('is just すべて for an empty catalogue', () => {
    expect(categoriesFrom([])).toEqual([{ id: 'all', label: 'すべて' }])
  })
})
