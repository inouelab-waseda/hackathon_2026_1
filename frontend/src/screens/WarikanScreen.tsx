import { useState } from 'react'
import { useWarikan } from '../state/useWarikan'
import { createRecord, save } from '../storage/historyStore'
import TotalAmountField from '../components/TotalAmountField'
import GradeInputList from '../components/GradeInputList'
import PlanCardList from '../components/PlanCardList'
import BottomSheet from '../components/BottomSheet'
import AdjustSheet from '../components/AdjustSheet'
import ResultSheet from '../components/ResultSheet'

type Props = {
  /** 保存が完了したら履歴画面へ再読み込みを促す */
  onSaved: () => void
}

/** 状態1（入力）と状態2（提案）をまとめた画面。 */
export default function WarikanScreen({ onSaved }: Props) {
  const { state, actions, inputsOpen, sheetSurplus } = useWarikan()
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = () => {
    if (state.sheet.kind !== 'result') return
    try {
      save(
        createRecord({
          totalAmount: state.input.totalAmount,
          counts: state.input.counts,
          perPerson: state.sheet.amounts,
          surplus: sheetSurplus,
          eventName: state.sheet.eventName,
          shopName: state.sheet.shopName,
        }),
      )
      setSaveError(null)
      actions.markSaved()
      onSaved()
    } catch {
      setSaveError('保存に失敗しました。ブラウザの設定を確認してください。')
    }
  }

  return (
    <>
      <header className="pt-safe flex items-baseline justify-between px-5 pb-3">
        <h1 className="text-[26px] font-black tracking-wide">割り勘</h1>
        <span className="text-[11px] font-medium tracking-[0.08em] text-muted">研究室の飲み会</span>
      </header>

      {/* シートを開いている間は背面をスクロールさせない（スマホで指が背面に効いてしまうため） */}
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col gap-3.5 px-4 pb-7 ${
          state.sheet.kind === 'none' ? 'overflow-y-auto' : 'overflow-hidden'
        }`}
      >
        <TotalAmountField value={state.input.totalAmount} onChange={actions.setTotal} />

        <GradeInputList
          input={state.input}
          open={inputsOpen}
          collapsible={state.plans !== null}
          errors={state.errors}
          onToggle={actions.toggleInputs}
          onIncrement={actions.incCount}
          onDecrement={actions.decCount}
          onFixedAmountChange={actions.setFixedAmount}
          onCalculate={actions.calculate}
        />

        {state.plans !== null && (
          <PlanCardList
            plans={state.plans}
            counts={state.input.counts}
            fixed={state.input.fixed}
            onChoose={actions.choosePlan}
          />
        )}

        <p className="shrink-0 px-1 text-[11px] leading-relaxed text-faint">
          固定した学年はその金額のまま、残額を他の学年で分担します。候補は500円単位で計算し、
          多めに集めたぶんを余剰として表示します。
        </p>
      </div>

      <BottomSheet
        open={state.sheet.kind === 'adjust'}
        onClose={actions.closeSheet}
      >
        {state.sheet.kind === 'adjust' && (
          <AdjustSheet
            input={state.input}
            planName={state.sheet.planName}
            amounts={state.sheet.amounts}
            surplus={sheetSurplus}
            onIncrease={actions.increaseAmount}
            onDecrease={actions.decreaseAmount}
            onConfirm={actions.confirmAdjust}
          />
        )}
      </BottomSheet>

      <BottomSheet
        open={state.sheet.kind === 'result'}
        onClose={actions.closeSheet}
      >
        {state.sheet.kind === 'result' && (
          <ResultSheet
            input={state.input}
            amounts={state.sheet.amounts}
            surplus={sheetSurplus}
            eventName={state.sheet.eventName}
            shopName={state.sheet.shopName}
            saved={state.sheet.saved}
            saveError={saveError}
            onEventNameChange={actions.setEventName}
            onShopNameChange={actions.setShopName}
            onSave={handleSave}
          />
        )}
      </BottomSheet>
    </>
  )
}
