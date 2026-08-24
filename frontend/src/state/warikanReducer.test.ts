import { describe, expect, it } from 'vitest'
import { initialState, warikanReducer } from './warikanReducer'
import type { WarikanState } from './warikanReducer'
import { byGrade } from '../types/warikan'

/** 計算済みの状態を作る。 */
function calculated(): WarikanState {
  return warikanReducer(initialState, { type: 'calculate' })
}

describe('calculate', () => {
  it('正常な入力なら3案が生成され、入力欄が折りたたまれる', () => {
    const state = calculated()
    expect(state.plans).toHaveLength(3)
    expect(state.inputsOpen).toBe(false)
    expect(state.errors).toEqual([])
  })

  it('バリデーションNGなら計算せずエラーだけを持つ', () => {
    const empty = { ...initialState, input: { ...initialState.input, totalAmount: 0 } }
    const state = warikanReducer(empty, { type: 'calculate' })
    expect(state.plans).toBeNull()
    expect(state.errors.length).toBeGreaterThan(0)
  })
})

describe('入力変更との連動', () => {
  it('人数を変えると計算結果が破棄される', () => {
    const state = warikanReducer(calculated(), { type: 'incCount', grade: 'M2' })
    expect(state.plans).toBeNull()
    expect(state.inputsOpen).toBe(true)
  })

  it('合計金額を変えると計算結果が破棄される', () => {
    const state = warikanReducer(calculated(), { type: 'setTotal', value: '30000' })
    expect(state.input.totalAmount).toBe(30000)
    expect(state.plans).toBeNull()
  })

  it('数字以外の文字は取り除かれる', () => {
    const state = warikanReducer(initialState, { type: 'setTotal', value: '¥12,345あ' })
    expect(state.input.totalAmount).toBe(12345)
  })

  it('人数は0より小さくならない', () => {
    const zero = { ...initialState, input: { ...initialState.input, counts: byGrade(0) } }
    const state = warikanReducer(zero, { type: 'decCount', grade: 'B3' })
    expect(state.input.counts.B3).toBe(0)
  })
})

describe('シートの遷移', () => {
  it('案を選ぶと調整シートが開き、金額がコピーされる', () => {
    const base = calculated()
    const plan = base.plans![0]
    const state = warikanReducer(base, { type: 'choosePlan', plan })
    expect(state.sheet.kind).toBe('adjust')
    if (state.sheet.kind === 'adjust') {
      expect(state.sheet.amounts).toEqual(plan.perPerson)
    }
  })

  it('調整は100円単位で増減し、0より小さくならない', () => {
    const base = calculated()
    const opened = warikanReducer(base, { type: 'choosePlan', plan: base.plans![0] })
    const before = opened.sheet.kind === 'adjust' ? opened.sheet.amounts.M2 : 0

    const up = warikanReducer(opened, { type: 'adjustAmount', grade: 'M2', delta: 100 })
    expect(up.sheet.kind === 'adjust' && up.sheet.amounts.M2).toBe(before + 100)

    let down = opened
    for (let i = 0; i < 200; i += 1) {
      down = warikanReducer(down, { type: 'adjustAmount', grade: 'M2', delta: -100 })
    }
    expect(down.sheet.kind === 'adjust' && down.sheet.amounts.M2).toBe(0)
  })

  it('不足している状態では確定できない', () => {
    const base = calculated()
    let state = warikanReducer(base, { type: 'choosePlan', plan: base.plans![0] })
    // 全学年を0円にすれば必ず不足する
    for (const grade of ['M2', 'M1', 'B4', 'B3'] as const) {
      for (let i = 0; i < 200; i += 1) {
        state = warikanReducer(state, { type: 'adjustAmount', grade, delta: -100 })
      }
    }
    const confirmed = warikanReducer(state, { type: 'confirmAdjust' })
    expect(confirmed.sheet.kind).toBe('adjust')
  })

  it('余剰が0以上なら確定して結果シートへ進む', () => {
    const base = calculated()
    const opened = warikanReducer(base, { type: 'choosePlan', plan: base.plans![0] })
    const state = warikanReducer(opened, { type: 'confirmAdjust' })
    expect(state.sheet.kind).toBe('result')
  })

  it('結果シートで行事名を変えると保存済みフラグが下りる', () => {
    const base = calculated()
    const opened = warikanReducer(base, { type: 'choosePlan', plan: base.plans![0] })
    const result = warikanReducer(opened, { type: 'confirmAdjust' })
    const saved = warikanReducer(result, { type: 'markSaved' })
    expect(saved.sheet.kind === 'result' && saved.sheet.saved).toBe(true)

    const edited = warikanReducer(saved, { type: 'setEventName', value: '追いコン' })
    expect(edited.sheet.kind === 'result' && edited.sheet.saved).toBe(false)
  })
})
