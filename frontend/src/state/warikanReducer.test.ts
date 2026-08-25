import { describe, expect, it } from 'vitest'
import { initialState, warikanReducer } from './warikanReducer'
import type { WarikanState } from './warikanReducer'
import { byGrade } from '../types/warikan'
import type { Plan } from '../types/warikan'

/** バックエンドが返す3案を模したデータ。合計48,000円 / M2:3 M1:4 B4:5 B3:2 に対応する。 */
const apiPlans: Plan[] = [
  {
    id: 'steep',
    name: '案A',
    perPerson: { M2: 5000, M1: 3500, B4: 3000, B3: 2000 },
    surplus: 0,
  },
  {
    id: 'standard',
    name: '案B',
    perPerson: { M2: 4000, M1: 4000, B4: 3000, B3: 2500 },
    surplus: 0,
  },
  {
    id: 'flat',
    name: '案C',
    perPerson: { M2: 3500, M1: 3500, B4: 3500, B3: 3000 },
    surplus: 0,
  },
]

/** 計算が成功した状態を作る（実際の通信は state 層の外で行われる）。 */
function calculated(): WarikanState {
  const started = warikanReducer(initialState, { type: 'calculateStarted' })
  return warikanReducer(started, { type: 'calculateSucceeded', plans: apiPlans })
}

describe('計算の開始・成功・失敗', () => {
  it('開始すると待機状態になり、古い提案とエラーが消える', () => {
    const state = warikanReducer(calculated(), { type: 'calculateStarted' })
    expect(state.isCalculating).toBe(true)
    expect(state.plans).toBeNull()
    expect(state.errors).toEqual([])
  })

  it('成功すると3案が入り、入力欄が折りたたまれる', () => {
    const state = calculated()
    expect(state.isCalculating).toBe(false)
    expect(state.plans).toHaveLength(3)
    expect(state.inputsOpen).toBe(false)
  })

  it('失敗するとエラーだけが残り、提案は入らない', () => {
    const started = warikanReducer(initialState, { type: 'calculateStarted' })
    const state = warikanReducer(started, {
      type: 'calculateFailed',
      errors: ['サーバーに接続できませんでした。通信環境を確認してください。'],
    })
    expect(state.isCalculating).toBe(false)
    expect(state.plans).toBeNull()
    expect(state.errors).toHaveLength(1)
  })
})

describe('入力変更との連動', () => {
  it('固定金額の初期値は全学年で空欄として扱う0', () => {
    expect(initialState.input.fixedAmounts).toEqual(byGrade(0))
  })

  it('固定中の金額を空にすると固定も解除される', () => {
    const fixed = {
      ...initialState,
      input: {
        ...initialState.input,
        fixed: { ...initialState.input.fixed, M2: true },
        fixedAmounts: { ...initialState.input.fixedAmounts, M2: 5000 },
      },
    }
    const state = warikanReducer(fixed, { type: 'setFixedAmount', grade: 'M2', value: '' })
    expect(state.input.fixed.M2).toBe(false)
    expect(state.input.fixedAmounts.M2).toBe(0)
  })

  it('固定金額を入力すると自動で固定される', () => {
    const state = warikanReducer(initialState, {
      type: 'setFixedAmount',
      grade: 'M2',
      value: '5000',
    })
    expect(state.input.fixed.M2).toBe(true)
  })

  it('人数を変えると計算結果が破棄される', () => {
    const state = warikanReducer(calculated(), { type: 'incCount', grade: 'M2' })
    expect(state.plans).toBeNull()
    expect(state.inputsOpen).toBe(true)
  })

  it('計算の依頼中に入力を変えると待機状態が解除される', () => {
    const started = warikanReducer(initialState, { type: 'calculateStarted' })
    const state = warikanReducer(started, { type: 'setTotal', value: '30000' })
    expect(state.isCalculating).toBe(false)
    expect(state.plans).toBeNull()
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
