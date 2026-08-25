import { describe, expect, it } from 'vitest'
import { validateInput } from './validation'
import { byGrade } from '../types/warikan'
import type { WarikanInput } from '../types/warikan'

const valid: WarikanInput = {
  totalAmount: 48000,
  counts: { M2: 3, M1: 4, B4: 5, B3: 2 },
  fixed: byGrade(false),
  fixedAmounts: byGrade(0),
}

describe('validateInput', () => {
  it('正常な入力ならエラーを返さない', () => {
    expect(validateInput(valid)).toEqual([])
  })

  it('合計金額が0以下ならエラーになる', () => {
    expect(validateInput({ ...valid, totalAmount: 0 })).toContain('合計金額を入力してください。')
  })

  it('総人数が0ならエラーになる', () => {
    const input = { ...valid, counts: byGrade(0) }
    expect(validateInput(input)).toContain('人数を1人以上入力してください。')
  })

  it('すべての学年を固定するとエラーになる', () => {
    const input = { ...valid, fixed: byGrade(true), fixedAmounts: byGrade(3000) }
    expect(validateInput(input)).toHaveLength(1)
    expect(validateInput(input)[0]).toContain('すべての学年を固定すると')
  })

  it('固定していない学年が全員0人の場合もエラーになる', () => {
    const input: WarikanInput = {
      ...valid,
      counts: { M2: 3, M1: 0, B4: 0, B3: 0 },
      fixed: { M2: true, M1: false, B4: false, B3: false },
      fixedAmounts: byGrade(5000),
    }
    expect(validateInput(input)[0]).toContain('すべての学年を固定すると')
  })
})
