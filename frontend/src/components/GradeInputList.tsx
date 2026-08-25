import { GRADES } from '../types/warikan'
import type { Grade, WarikanInput } from '../types/warikan'
import { totalHeadCount } from '../domain/settlement'

type Props = {
  input: WarikanInput
  open: boolean
  /** 未計算のうちは折りたためない */
  collapsible: boolean
  errors: string[]
  onToggle: () => void
  onIncrement: (grade: Grade) => void
  onDecrement: (grade: Grade) => void
  onToggleFix: (grade: Grade) => void
  onFixedAmountChange: (grade: Grade, value: string) => void
  onCalculate: () => void
}

/** 学年ごとの人数・固定額を入力するリスト。計算後は折りたたまれる。 */
export default function GradeInputList({
  input,
  open,
  collapsible,
  errors,
  onToggle,
  onIncrement,
  onDecrement,
  onToggleFix,
  onFixedAmountChange,
  onCalculate,
}: Props) {
  return (
    <div className="shrink-0 overflow-hidden rounded-2xl border border-line bg-card">
      <button
        type="button"
        onClick={onToggle}
        disabled={!collapsible}
        className="flex w-full items-center gap-2 px-4 pt-3.5 pb-3 text-left select-none disabled:cursor-default"
      >
        <span
          className={`text-[9px] leading-none text-faint transition-transform ${
            open ? '' : '-rotate-90'
          }`}
        >
          ▼
        </span>
        <span className="text-[11px] font-bold tracking-[0.1em] text-muted">
          学年ごとの人数と負担
        </span>
        <span className="ml-auto font-mono text-[11px] font-medium text-faint">
          {totalHeadCount(input.counts)}人
        </span>
      </button>

      {open && (
        <div>
          {GRADES.map((grade) => {
            const isFixed = input.fixed[grade]
            return (
              <div
                key={grade}
                className="flex items-center gap-2.5 border-t border-line/60 py-2.5 pr-4 pl-[18px]"
              >
                <span className="w-8 font-mono text-[15px] font-semibold">{grade}</span>

                {/* 指で押す前提なので、± は 44px 角を確保する（隣を誤タップしないため） */}
                <div className="flex items-center rounded-[9px] bg-subtle p-[3px]">
                  <button
                    type="button"
                    onClick={() => onDecrement(grade)}
                    aria-label={`${grade}の人数を減らす`}
                    className="h-11 w-11 rounded-[7px] text-[17px] font-semibold text-muted select-none active:bg-line"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-mono text-[15px] font-semibold">
                    {input.counts[grade]}
                  </span>
                  <button
                    type="button"
                    onClick={() => onIncrement(grade)}
                    aria-label={`${grade}の人数を増やす`}
                    className="h-11 w-11 rounded-[7px] text-[17px] font-semibold text-muted select-none active:bg-line"
                  >
                    ＋
                  </button>
                </div>

                <div className="flex min-w-0 flex-1 justify-end">
                  {isFixed ? (
                    <div className="flex items-center gap-1 rounded-[9px] border border-alert bg-card px-2.5 py-1.5">
                      <span className="font-mono text-xs text-faint">¥</span>
                      <input
                        value={input.fixedAmounts[grade] === 0 ? '' : String(input.fixedAmounts[grade])}
                        onChange={(event) => onFixedAmountChange(grade, event.target.value)}
                        inputMode="numeric"
                        placeholder="0"
                        aria-label={`${grade}の固定金額`}
                        className="w-16 border-none bg-transparent p-0 text-right font-mono text-[17px] font-semibold text-alert outline-none"
                      />
                    </div>
                  ) : (
                    <span className="pr-1 text-[11px] text-faint">自動で計算</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onToggleFix(grade)}
                  className={`h-10 rounded-lg px-2.5 text-[10px] font-bold tracking-wider whitespace-nowrap transition-colors ${
                    isFixed
                      ? 'border border-alert bg-alert text-white'
                      : 'border border-line bg-card text-faint'
                  }`}
                >
                  固定
                </button>
              </div>
            )
          })}

          {errors.length > 0 && (
            <ul className="border-t border-line/60 px-4 pt-3 pb-1">
              {errors.map((message) => (
                <li key={message} className="text-[11.5px] leading-relaxed text-alert">
                  {message}
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end border-t border-line/60 px-4 pt-3 pb-3.5">
            <button
              type="button"
              onClick={onCalculate}
              className="rounded-[10px] bg-ink px-5 py-3 text-[12.5px] font-bold tracking-wider text-white active:bg-accent"
            >
              計算する
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
