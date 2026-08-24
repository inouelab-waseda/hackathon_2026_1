import { describe, expect, it } from 'vitest'
import { ROUNDING_UNIT, calculatePlans } from './calculate'
import { GRADES, byGrade } from '../types/warikan'
import type { WarikanInput } from '../types/warikan'

const base: WarikanInput = {
  totalAmount: 48000,
  counts: { M2: 3, M1: 4, B4: 5, B3: 2 },
  fixed: byGrade(false),
  fixedAmounts: byGrade(0),
}

describe('calculatePlans', () => {
  it('3案を返す', () => {
    const plans = calculatePlans(base)
    expect(plans.map((plan) => plan.id)).toEqual(['steep', 'standard', 'flat'])
  })

  it('すべての案で余剰が0以上になる（不足を出さない）', () => {
    for (const plan of calculatePlans(base)) {
      expect(plan.surplus).toBeGreaterThanOrEqual(0)
    }
  })

  it('負担額はすべて500円の倍数になる', () => {
    for (const plan of calculatePlans(base)) {
      for (const grade of GRADES) {
        expect(plan.perPerson[grade] % ROUNDING_UNIT).toBe(0)
      }
    }
  })

  it('上級生を厚めにした案ほど M2 の負担が大きい', () => {
    const [steep, standard, flat] = calculatePlans(base)
    expect(steep.perPerson.M2).toBeGreaterThanOrEqual(standard.perPerson.M2)
    expect(standard.perPerson.M2).toBeGreaterThanOrEqual(flat.perPerson.M2)
  })

  it('固定した学年の金額はそのまま据え置かれる', () => {
    const input: WarikanInput = {
      ...base,
      fixed: { ...byGrade(false), M2: true },
      fixedAmounts: { ...byGrade(0), M2: 6000 },
    }
    for (const plan of calculatePlans(input)) {
      expect(plan.perPerson.M2).toBe(6000)
      expect(plan.surplus).toBeGreaterThanOrEqual(0)
    }
  })

  it('人数が0の学年の負担額は0になる', () => {
    const input: WarikanInput = { ...base, counts: { M2: 0, M1: 4, B4: 5, B3: 2 } }
    for (const plan of calculatePlans(input)) {
      expect(plan.perPerson.M2).toBe(0)
    }
  })

  it('固定分だけで支払い金額を超えていても余剰は0以上になる', () => {
    const input: WarikanInput = {
      ...base,
      totalAmount: 5000,
      fixed: { ...byGrade(false), M2: true },
      fixedAmounts: { ...byGrade(0), M2: 10000 },
    }
    for (const plan of calculatePlans(input)) {
      expect(plan.surplus).toBeGreaterThanOrEqual(0)
    }
  })
})
