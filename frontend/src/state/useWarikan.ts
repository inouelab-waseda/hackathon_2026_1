import { useCallback, useMemo, useReducer, useRef } from 'react'
import type { Grade, Plan } from '../types/warikan'
import { initialState, warikanReducer } from './warikanReducer'
import { ADJUST_STEP } from '../domain/constants'
import { validateInput } from '../domain/validation'
import { calcSurplus } from '../domain/settlement'
import { WarikanApiError, requestPlans } from '../api/warikanApi'

/**
 * 割り勘画面の状態をまとめて扱うフック。
 * 画面側は state を読み、名前の付いた操作関数を呼ぶだけでよい。
 *
 * 計算はバックエンドへの非同期リクエストになるため、reducer（純粋関数）ではなく
 * ここで実行し、開始・成功・失敗をアクションとして通知する。
 */
export function useWarikan() {
  const [state, dispatch] = useReducer(warikanReducer, initialState)

  // 計算依頼の世代番号。入力が変わったり再計算されたら増やし、
  // 古い依頼の応答が遅れて届いても捨てられるようにする。
  const requestSeq = useRef(0)
  const invalidatePendingRequest = useCallback(() => {
    requestSeq.current += 1
  }, [])

  const calculate = useCallback(async () => {
    // 通信する前に手元で弾けるものは弾く（無駄な往復を避け、反応も速い）
    const inputErrors = validateInput(state.input)
    if (inputErrors.length > 0) {
      dispatch({ type: 'calculateFailed', errors: inputErrors })
      return
    }

    const seq = (requestSeq.current += 1)
    dispatch({ type: 'calculateStarted' })

    try {
      const plans: Plan[] = await requestPlans(state.input)

      // 待っている間に入力が変わっていたら、この結果はもう正しくない
      if (requestSeq.current !== seq) return
      dispatch({ type: 'calculateSucceeded', plans })
    } catch (error) {
      if (requestSeq.current !== seq) return
      const errors =
        error instanceof WarikanApiError ? error.messages : ['計算に失敗しました。']
      dispatch({ type: 'calculateFailed', errors })
    }
  }, [state.input])

  const actions = useMemo(
    () => ({
      setTotal: (value: string) => {
        invalidatePendingRequest()
        dispatch({ type: 'setTotal', value })
      },
      incCount: (grade: Grade) => {
        invalidatePendingRequest()
        dispatch({ type: 'incCount', grade })
      },
      decCount: (grade: Grade) => {
        invalidatePendingRequest()
        dispatch({ type: 'decCount', grade })
      },
      setFixedAmount: (grade: Grade, value: string) => {
        invalidatePendingRequest()
        dispatch({ type: 'setFixedAmount', grade, value })
      },
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
    [invalidatePendingRequest],
  )

  // 未計算のうちは入力欄を折りたためない
  const inputsOpen = state.plans === null || state.inputsOpen

  // シートで表示中の金額に対する余剰。シートが閉じているときは0。
  const sheetSurplus =
    state.sheet.kind === 'none' ? 0 : calcSurplus(state.input, state.sheet.amounts)

  return { state, actions: { ...actions, calculate }, inputsOpen, sheetSurplus }
}
