import { useState } from 'react'
import { GRADES } from '../types/warikan'
import type { SettlementRecord } from '../types/warikan'
import { formatDateTime, yen } from '../lib/format'
import { totalHeadCount } from '../domain/settlement'

type Props = {
  records: SettlementRecord[]
}

/** 状態3。保存済みの決済を新しい順に並べ、タップで内訳を開く。 */
export default function HistoryScreen({ records }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <>
      <header className="pt-safe flex items-baseline justify-between px-5 pb-3">
        <h1 className="text-[26px] font-black tracking-wide">履歴</h1>
        <span className="text-[11px] font-medium tracking-[0.08em] text-muted">
            {records.length}件
        </span>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-7">
        {records.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm font-bold text-muted">まだ履歴がありません</p>
            <p className="mt-1.5 text-[11.5px] text-faint">
              割り勘を保存すると、ここに一覧が表示されます。
            </p>
          </div>
        ) : (
          records.map((record) => {
            const open = record.id === openId
            const visibleGrades = GRADES.filter((grade) => record.counts[grade] > 0)
            return (
              <div key={record.id} className="overflow-hidden rounded-2xl border border-line bg-card">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : record.id)}
                  className="w-full px-4 py-3.5 text-left"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-bold">
                      {record.eventName ?? '（行事名なし）'}
                    </span>
                    <span className="shrink-0 font-mono text-[15px] font-semibold">
                      {yen(record.totalAmount)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-2 text-[11px] text-faint">
                    <span className="truncate">
                      {record.shopName ?? '店名なし'} · {formatDateTime(record.savedAt)}
                    </span>
                    <span className="shrink-0 font-mono">
                      {totalHeadCount(record.counts)}人 · 余剰 {yen(record.surplus)}
                    </span>
                  </div>
                </button>

                {open && (
                  <div className="flex flex-col gap-1 border-t border-line/60 px-4 py-3">
                    {visibleGrades.map((grade) => (
                      <div
                        key={grade}
                        className="flex items-baseline justify-between rounded-lg bg-subtle px-2.5 py-1.5"
                      >
                        <span className="font-mono text-[11.5px] font-semibold text-muted">
                          {grade} · {record.counts[grade]}人
                        </span>
                        <span className="font-mono text-[13px] font-semibold">
                          {yen(record.perPerson[grade])}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
