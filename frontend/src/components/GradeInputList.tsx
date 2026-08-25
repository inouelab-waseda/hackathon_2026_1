import { GRADES } from '../types/warikan'
import type { Grade, WarikanInput } from '../types/warikan'
import { totalHeadCount } from '../domain/settlement'

type Props = {
  input: WarikanInput
  open: boolean
  /** 未計算のうちは折りたためない */
  collapsible: boolean
  /** 計算をバックエンドに依頼して待っている間は true */
  isCalculating: boolean
  errors: string[]
  onToggle: () => void
  onIncrement: (grade: Grade) => void
  onDecrement: (grade: Grade) => void
  onFixedAmountChange: (grade: Grade, value: string) => void
  onCalculate: () => void
}

/** 学年ごとの人数・固定額を入力するリスト。計算後は折りたたまれる。 */
export default function GradeInputList({
  input,
  open,
  collapsible,
  isCalculating,
  errors,
  onToggle,
  onIncrement,
  onDecrement,
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
                  <div
                    className={`flex items-center gap-1 rounded-[9px] border bg-card px-2.5 py-1.5 transition-colors ${
                      isFixed ? 'border-accent' : 'border-line'
                    }`}
                  >
                    <span className="font-mono text-xs text-faint">¥</span>
                    <input
                      value={input.fixedAmounts[grade] === 0 ? '' : String(input.fixedAmounts[grade])}
                      onChange={(event) => onFixedAmountChange(grade, event.target.value)}
                      inputMode="numeric"
                      placeholder="固定値"
                      aria-label={`${grade}の固定金額`}
                      className={`w-16 border-none bg-transparent p-0 text-right font-mono text-[17px] font-semibold outline-none transition-colors placeholder:text-[11px] placeholder:font-medium ${
                        isFixed ? 'font-bold text-ink placeholder:text-faint' : 'text-ink placeholder:text-faint'
                      }`}
                    />
                  </div>
                </div>

                <span
                  role="img"
                  aria-label={isFixed ? `${grade}は固定中` : `${grade}は未固定`}
                  title={isFixed ? '固定中' : '固定値を入力すると固定されます'}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center transition-colors ${
                    isFixed ? 'text-accent' : 'text-faint/60'
                  }`}
                >
                  {isFixed ? (
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-[18px] w-[18px]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="5" y="10" width="14" height="10" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-[18px] w-[18px]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="5" y="10" width="14" height="10" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 7.5-2" />
                    </svg>
                  )}
                </span>
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
              disabled={isCalculating}
              className={`rounded-[10px] px-5 py-3 text-[12.5px] font-bold tracking-wider ${
                isCalculating
                  ? 'cursor-not-allowed bg-line text-faint'
                  : 'bg-ink text-white active:bg-accent'
              }`}
            >
              {isCalculating ? '計算中…' : '計算する'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
