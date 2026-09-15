import { describe, it, expect } from 'vitest'
import { advanceStreak, currentStreakAsOf, localDateKey } from './streak'

const jst = (iso: string) => new Date(iso)

describe('localDateKey', () => {
  it('uses the site timezone, so late-night JST counts as that day', () => {
    // 2026-09-15T23:50 JST is still 2026-09-15 locally, though it is 14:50 UTC.
    expect(localDateKey(jst('2026-09-15T14:50:00.000Z'))).toBe('2026-09-15')
    // 2026-09-15T00:30 JST is 2026-09-14T15:30 UTC — the previous UTC day.
    expect(localDateKey(jst('2026-09-14T15:30:00.000Z'))).toBe('2026-09-15')
  })
})

describe('advanceStreak', () => {
  const empty = { currentStreak: 0, longestStreak: 0, lastActivityDate: null }

  it('starts a streak on the first completion', () => {
    expect(advanceStreak(empty, jst('2026-09-15T01:00:00.000Z'))).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: '2026-09-15',
    })
  })

  it('does not double-count two completions on the same day', () => {
    const first = advanceStreak(empty, jst('2026-09-15T01:00:00.000Z'))
    const second = advanceStreak(first, jst('2026-09-15T09:00:00.000Z'))
    expect(second.currentStreak).toBe(1)
  })

  it('extends the streak on consecutive days', () => {
    let state = advanceStreak(empty, jst('2026-09-13T01:00:00.000Z'))
    state = advanceStreak(state, jst('2026-09-14T01:00:00.000Z'))
    state = advanceStreak(state, jst('2026-09-15T01:00:00.000Z'))
    expect(state.currentStreak).toBe(3)
    expect(state.longestStreak).toBe(3)
  })

  it('restarts after a missed day but keeps the best record', () => {
    let state = { currentStreak: 7, longestStreak: 12, lastActivityDate: '2026-09-10' }
    state = advanceStreak(state, jst('2026-09-15T01:00:00.000Z'))
    expect(state.currentStreak).toBe(1)
    expect(state.longestStreak).toBe(12)
  })

  it('handles a stored date in the future without going negative', () => {
    const state = advanceStreak(
      { currentStreak: 3, longestStreak: 3, lastActivityDate: '2026-09-20' },
      jst('2026-09-15T01:00:00.000Z')
    )
    expect(state.currentStreak).toBe(3)
  })

  it('accepts an ISO timestamp as the stored last activity date', () => {
    const state = advanceStreak(
      { currentStreak: 2, longestStreak: 2, lastActivityDate: '2026-09-14T23:11:00.000Z' },
      jst('2026-09-15T01:00:00.000Z')
    )
    expect(state.currentStreak).toBe(3)
  })
})

describe('currentStreakAsOf', () => {
  it('keeps the streak on the same day and the next day', () => {
    const state = { currentStreak: 5, longestStreak: 9, lastActivityDate: '2026-09-15' }
    expect(currentStreakAsOf(state, jst('2026-09-15T05:00:00.000Z'))).toBe(5)
    expect(currentStreakAsOf(state, jst('2026-09-16T05:00:00.000Z'))).toBe(5)
  })

  it('drops to zero once a day has been missed', () => {
    const state = { currentStreak: 5, longestStreak: 9, lastActivityDate: '2026-09-15' }
    expect(currentStreakAsOf(state, jst('2026-09-17T05:00:00.000Z'))).toBe(0)
  })

  it('is zero when there is no recorded activity', () => {
    expect(currentStreakAsOf({ currentStreak: 3, longestStreak: 3, lastActivityDate: null }, new Date())).toBe(0)
  })
})
