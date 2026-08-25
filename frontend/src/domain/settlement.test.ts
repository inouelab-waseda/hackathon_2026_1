import { describe, expect, it } from 'vitest'
import { calcCollected, calcSurplus, totalHeadCount } from './settlement'
import { byGrade } from '../types/warikan'
import type { WarikanInput } from '../types/warikan'

function makeInput(totalAmount: number, counts: WarikanInput['counts']): WarikanInput {
  return { totalAmount, counts, fixed: byGrade(false), fixedAmounts: byGrade(0) }
}

describe('totalHeadCount', () => {
  it('全学年の人数を合計する', () => {
    expect(totalHeadCount({ M2: 3, M1: 4, B4: 5, B3: 2 })).toBe(14)
  })
})

describe('calcCollected', () => {
  it('人数が0の学年は集計に含めない', () => {
    const counts = { M2: 2, M1: 0, B4: 3, B3: 0 }
    const perPerson = { M2: 5000, M1: 4000, B4: 3000, B3: 2000 }
    expect(calcCollected(counts, perPerson)).toBe(2 * 5000 + 3 * 3000)
  })
})

describe('calcSurplus', () => {
  const counts = { M2: 2, M1: 2, B4: 2, B3: 2 }

  it('ぴったりのときは0になる', () => {
    const input = makeInput(16000, counts)
    expect(calcSurplus(input, byGrade(2000))).toBe(0)
  })

  it('多く集めるときは正になる', () => {
    const input = makeInput(15000, counts)
    expect(calcSurplus(input, byGrade(2000))).toBe(1000)
  })

  it('足りないときは負になる', () => {
    const input = makeInput(17000, counts)
    expect(calcSurplus(input, byGrade(2000))).toBe(-1000)
  })
})
