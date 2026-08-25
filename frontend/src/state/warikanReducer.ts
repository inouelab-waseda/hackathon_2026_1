import { byGrade } from '../types/warikan'
import type { ByGrade, Grade, Plan, WarikanInput } from '../types/warikan'
import { calculatePlans } from '../domain/calculate'
import { validateInput } from '../domain/validation'
import { calcSurplus } from '../domain/settlement'

/**
 * 開いているシート。判別可能なユニオンにすることで
 * 「調整シートと結果シートが同時に開いている」といった不正な状態を作れなくする。
 */
export type SheetState =
  | { kind: 'none' }
  | { kind: 'adjust'; planName: string; amounts: ByGrade<number> }
  | {
      kind: 'result'
      planName: string
      amounts: ByGrade<number>
      eventName: string
      shopName: string
      saved: boolean
    }

export type WarikanState = {
  input: WarikanInput
  /** 入力欄が展開されているか（未計算のときは常に展開する） */
  inputsOpen: boolean
  /** null は「まだ計算していない」を意味する */
  plans: Plan[] | null
  errors: string[]
  sheet: SheetState
}

export type WarikanAction =
  | { type: 'setTotal'; value: string }
  | { type: 'incCount'; grade: Grade }
  | { type: 'decCount'; grade: Grade }
  | { type: 'toggleFix'; grade: Grade }
  | { type: 'setFixedAmount'; grade: Grade; value: string }
  | { type: 'calculate' }
  | { type: 'toggleInputs' }
  | { type: 'choosePlan'; plan: Plan }
  | { type: 'adjustAmount'; grade: Grade; delta: number }
  | { type: 'confirmAdjust' }
  | { type: 'closeSheet' }
  | { type: 'setEventName'; value: string }
  | { type: 'setShopName'; value: string }
  | { type: 'markSaved' }

/**
 * 初期値。デモですぐ動きを確認できるようにサンプル値を入れてある。
 * 実運用に入れる際は 0 に戻してよい。
 */
export const initialState: WarikanState = {
  input: {
    totalAmount: 48000,
    counts: { M2: 3, M1: 4, B4: 5, B3: 2 },
    fixed: byGrade(false),
    fixedAmounts: { M2: 5000, M1: 4000, B4: 3000, B3: 2500 },
  },
  inputsOpen: true,
  plans: null,
  errors: [],
  sheet: { kind: 'none' },
}

/** 文字列の入力から数字だけを取り出す。空なら0。 */
function toAmount(value: string): number {
  const digits = value.replace(/[^0-9]/g, '')
  return digits === '' ? 0 : Number.parseInt(digits, 10)
}

/**
 * 入力が変わったら計算結果を必ず捨てる。
 * 古い提案が残ったまま新しい入力が表示される状態を防ぐための共通処理。
 */
function withInput(state: WarikanState, input: WarikanInput): WarikanState {
  return { ...state, input, plans: null, errors: [], inputsOpen: true, sheet: { kind: 'none' } }
}

export function warikanReducer(state: WarikanState, action: WarikanAction): WarikanState {
  switch (action.type) {
    case 'setTotal':
      return withInput(state, { ...state.input, totalAmount: toAmount(action.value) })

    case 'incCount':
      return withInput(state, {
        ...state.input,
        counts: { ...state.input.counts, [action.grade]: state.input.counts[action.grade] + 1 },
      })

    case 'decCount':
      return withInput(state, {
        ...state.input,
        counts: {
          ...state.input.counts,
          [action.grade]: Math.max(0, state.input.counts[action.grade] - 1),
        },
      })

    case 'toggleFix':
      return withInput(state, {
        ...state.input,
        fixed: { ...state.input.fixed, [action.grade]: !state.input.fixed[action.grade] },
      })

    case 'setFixedAmount':
      return withInput(state, {
        ...state.input,
        fixedAmounts: { ...state.input.fixedAmounts, [action.grade]: toAmount(action.value) },
      })

    case 'calculate': {
      const errors = validateInput(state.input)
      if (errors.length > 0) {
        return { ...state, errors, plans: null }
      }
      return {
        ...state,
        errors: [],
        plans: calculatePlans(state.input),
        // 提案が出たら入力欄は折りたたんで、3案に画面を使う
        inputsOpen: false,
      }
    }

    case 'toggleInputs':
      // 未計算のときは折りたためない（入力するしかない画面なので）
      if (state.plans === null) return state
      return { ...state, inputsOpen: !state.inputsOpen }

    case 'choosePlan':
      return {
        ...state,
        sheet: {
          kind: 'adjust',
          planName: action.plan.name,
          amounts: { ...action.plan.perPerson },
        },
      }

    case 'adjustAmount': {
      if (state.sheet.kind !== 'adjust') return state
      const current = state.sheet.amounts[action.grade]
      return {
        ...state,
        sheet: {
          ...state.sheet,
          amounts: { ...state.sheet.amounts, [action.grade]: Math.max(0, current + action.delta) },
        },
      }
    }

    case 'confirmAdjust': {
      if (state.sheet.kind !== 'adjust') return state
      // 不足している状態では確定させない（画面側でもボタンを無効化している）
      if (calcSurplus(state.input, state.sheet.amounts) < 0) return state
      return {
        ...state,
        sheet: {
          kind: 'result',
          planName: state.sheet.planName,
          amounts: state.sheet.amounts,
          eventName: '',
          shopName: '',
          saved: false,
        },
      }
    }

    case 'closeSheet':
      return { ...state, sheet: { kind: 'none' } }

    case 'setEventName':
      if (state.sheet.kind !== 'result') return state
      return { ...state, sheet: { ...state.sheet, eventName: action.value, saved: false } }

    case 'setShopName':
      if (state.sheet.kind !== 'result') return state
      return { ...state, sheet: { ...state.sheet, shopName: action.value, saved: false } }

    case 'markSaved':
      if (state.sheet.kind !== 'result') return state
      return { ...state, sheet: { ...state.sheet, saved: true } }

    default:
      return state
  }
}
