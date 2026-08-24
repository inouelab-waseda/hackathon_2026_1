import { GRADES } from '../types/warikan'
import type { ByGrade, Grade, WarikanInput } from '../types/warikan'
import { yen } from '../lib/format'
import { ADJUST_STEP } from '../state/warikanReducer'

type Props = {
  input: WarikanInput
  planName: string
  amounts: ByGrade<number>
  surplus: number
  onIncrease: (grade: Grade) => void
  onDecrease: (grade: Grade) => void
  onConfirm: () => void
}

/**
 * 調整シート（シートの第1段階）。
 * 100円単位で負担額を動かし、余剰が不足（負）のあいだは確定させない。
 */
export default function AdjustSheet({
  input,
  planName,
  amounts,
  surplus,
  onIncrease,
  onDecrease,
  onConfirm,
}: Props) {
  const shortage = surplus < 0
  const visibleGrades = GRADES.filter((grade) => input.counts[grade] > 0)

  return (
    <>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-black tracking-wide">負担額の調整</h2>
        <span className="font-mono text-[11px] text-muted">
          {planName} · 合計 {yen(input.totalAmount)}
        </span>
      </div>

      <div className="mb-3.5 flex flex-col gap-2">
        {visibleGrades.map((grade) => {
          const isFixed = input.fixed[grade]
          return (
            <div
              key={grade}
              className={`flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 ${
                isFixed ? 'border border-alert/45 bg-alert/6' : 'border border-line bg-card'
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-mono text-base font-semibold ${
                    isFixed ? 'text-alert' : 'text-ink'
                  }`}
                >
                  {grade}
                </span>
                {isFixed && (
                  <span className="rounded bg-alert px-1.5 py-px text-[9.5px] font-bold tracking-wide text-white">
                    固定
                  </span>
                )}
                <span className="text-[11px] text-faint">{input.counts[grade]}人</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`min-w-[74px] text-right font-mono text-[19px] font-semibold ${
                    isFixed ? 'text-alert' : 'text-ink'
                  }`}
                >
                  {yen(amounts[grade])}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onDecrease(grade)}
                    aria-label={`${grade}の負担額を${ADJUST_STEP}円減らす`}
                    className="h-11 w-11 rounded-lg border border-line bg-card text-[15px] leading-none text-muted select-none active:bg-subtle"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => onIncrease(grade)}
                    aria-label={`${grade}の負担額を${ADJUST_STEP}円増やす`}
                    className="h-11 w-11 rounded-lg border border-line bg-card text-[15px] leading-none text-muted select-none active:bg-subtle"
                  >
                    ＋
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div
        className={`mb-3 flex items-center justify-between rounded-xl px-3.5 py-3 ${
          shortage
            ? 'bg-alert/8 text-alert'
            : surplus === 0
              ? 'bg-accent/12 text-accent'
              : 'border border-line bg-card text-ink'
        }`}
      >
        <span className="text-[11px] font-bold tracking-[0.08em]">余剰</span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[19px] font-semibold">{yen(surplus)}</span>
          <span className="text-[11px] font-bold">
            {shortage ? '不足しています' : surplus === 0 ? 'ぴったり' : '余り'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={shortage}
        className={`w-full rounded-xl py-4 text-sm font-bold tracking-wide ${
          shortage ? 'cursor-not-allowed bg-line text-faint' : 'bg-ink text-white active:bg-accent'
        }`}
      >
        {shortage ? '支払い金額に足りません' : 'この金額で決定'}
      </button>
    </>
  )
}
