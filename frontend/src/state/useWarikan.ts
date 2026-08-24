import { useMemo, useReducer } from 'react'
import type { Grade, Plan } from '../types/warikan'
import { ADJUST_STEP, initialState, warikanReducer } from './warikanReducer'
import { calcSurplus } from '../domain/settlement'

/**
 * 割り勘画面の状態をまとめて扱うフック。
 * 画面側は state を読み、名前の付いた操作関数を呼ぶだけでよい。
 */
export function useWarikan() {
  const [state, dispatch] = useReducer(warikanReducer, initialState)

  const actions = useMemo(
    () => ({
      setTotal: (value: string) => dispatch({ type: 'setTotal', value }),
      incCount: (grade: Grade) => dispatch({ type: 'incCount', grade }),
      decCount: (grade: Grade) => dispatch({ type: 'decCount', grade }),
      toggleFix: (grade: Grade) => dispatch({ type: 'toggleFix', grade }),
      setFixedAmount: (grade: Grade, value: string) =>
        dispatch({ type: 'setFixedAmount', grade, value }),
      calculate: () => dispatch({ type: 'calculate' }),
      toggleInputs: () => dispatch({ type: 'toggleInputs' }),
      choosePlan: (plan: Plan) => dispatch({ type: 'choosePlan', plan }),
      increaseAmount: (grade: Grade) =>
        dispatch({ type: 'adjustAmount', grade, delta: ADJUST_STEP }),
      decreaseAmount: (grade: Grade) =>
        dispatch({ type: 'adjustAmount', grade, delta: -ADJUST_STEP }),
      confirmAdjust: () => dispatch({ type: 'confirmAdjust' }),
      closeSheet: () => dispatch({ type: 'closeSheet' }),
      setEventName: (value: string) => dispatch({ type: 'setEventName', value }),
      setShopName: (value: string) => dispatch({ type: 'setShopName', value }),
      markSaved: () => dispatch({ type: 'markSaved' }),
    }),
    [],
  )

  // 未計算のうちは入力欄を折りたためない
  const inputsOpen = state.plans === null || state.inputsOpen

  // シートで表示中の金額に対する余剰。シートが閉じているときは0。
  const sheetSurplus =
    state.sheet.kind === 'none' ? 0 : calcSurplus(state.input, state.sheet.amounts)

  return { state, actions, inputsOpen, sheetSurplus }
}
