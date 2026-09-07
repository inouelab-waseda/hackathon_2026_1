import { useState } from 'react'
import { GRADES } from '../types/warikan'
import type { ByGrade, WarikanInput } from '../types/warikan'
import { yen } from '../lib/format'
import { totalHeadCount } from '../domain/settlement'

type Props = {
  input: WarikanInput
  amounts: ByGrade<number>
  surplus: number
  eventName: string
  shopName: string
  saved: boolean
  isSaving: boolean
  saveError: string | null
  onEventNameChange: (value: string) => void
  onShopNameChange: (value: string) => void
  onSave: () => void
}

/**
 * 結果シート（シートの第2段階）。
 * 確定した金額を確認し、行事名・店名を付けて保存する。どちらも任意入力。
 */
export default function ResultSheet({
  input,
  amounts,
  surplus,
  eventName,
  shopName,
  saved,
  isSaving,
  saveError,
  onEventNameChange,
  onShopNameChange,
  onSave,
}: Props) {
  const [isCopied, setCopied] = useState(false)
  const visibleGrades = GRADES.filter((grade) => input.counts[grade] > 0)

  const handleCopy = () => {
    const body = visibleGrades.map((grade) => `${grade} ${yen(amounts[grade])}`).join(' / ')
    const difference = surplus < 0 ? ` / 幹事立て替え ${yen(-surplus)}` : ''
    const text = `${body}（合計 ${yen(input.totalAmount)}${difference}）`
    void navigator.clipboard?.writeText(text)
    setCopied(true)
  }

  return (
    <>
      <div className="mb-2 text-[11px] font-bold tracking-[0.1em] text-muted">一人あたり</div>

      <div className="mb-3.5 flex flex-col gap-2">
        {visibleGrades.map((grade) => {
          const isFixed = input.fixed[grade]
          return (
            <div
              key={grade}
              className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                isFixed ? 'border border-alert/45 bg-alert/6' : 'border border-line bg-card'
              }`}
            >
              <div className="flex items-baseline gap-2.5">
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
              <span
                className={`font-mono text-xl font-semibold ${isFixed ? 'text-alert' : 'text-ink'}`}
              >
                {yen(amounts[grade])}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between px-1 pb-4 text-xs text-muted">
        <span>
          合計 {yen(input.totalAmount)} / {totalHeadCount(input.counts)}人
        </span>
        <span>
          {surplus < 0
            ? `幹事立て替え ${yen(-surplus)}`
            : surplus === 0
              ? '余剰なし'
              : `余剰 ${yen(surplus)}`}
        </span>
      </div>

      <div className="mb-3.5 flex flex-col gap-2 border-t border-line pt-3.5">
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 py-3">
          <label htmlFor="event-name" className="w-14 shrink-0 text-[11px] font-bold tracking-wide text-muted">
            行事名
          </label>
          <input
            id="event-name"
            value={eventName}
            onChange={(event) => onEventNameChange(event.target.value)}
            placeholder="例）追いコン"
            className="min-w-0 flex-1 border-none bg-transparent p-0 text-base font-medium text-ink outline-none placeholder:text-faint"
          />
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 py-3">
          <label htmlFor="shop-name" className="w-14 shrink-0 text-[11px] font-bold tracking-wide text-muted">
            店名
          </label>
          <input
            id="shop-name"
            value={shopName}
            onChange={(event) => onShopNameChange(event.target.value)}
            placeholder="例）鳥貴族 駅前店"
            className="min-w-0 flex-1 border-none bg-transparent p-0 text-base font-medium text-ink outline-none placeholder:text-faint"
          />
        </div>
      </div>

      {saveError !== null && (
        <p className="mb-3 text-[11.5px] text-alert">{saveError}</p>
      )}

      <div className="flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-xl border border-line bg-card px-4 py-3.5 text-[13px] font-bold tracking-wide text-ink"
        >
          {isCopied ? 'コピーしました' : '結果をコピー'}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saved || isSaving}
          className={`shrink-0 rounded-xl px-5 py-3.5 text-[13px] font-bold tracking-wide whitespace-nowrap ${
            saved ? 'cursor-default bg-accent/12 text-accent' : 'bg-accent text-white'
          }`}
        >
          {saved ? '保存されました' : isSaving ? '保存中…' : '保存'}
        </button>
      </div>
    </>
  )
}
