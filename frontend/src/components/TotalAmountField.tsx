type Props = {
  value: number
  onChange: (value: string) => void
}

/** 支払いたい合計金額の入力欄。数字以外は reducer 側で取り除かれる。 */
export default function TotalAmountField({ value, onChange }: Props) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-2.5">
      <label
        htmlFor="total-amount"
        className="text-[11px] font-bold tracking-[0.1em] text-muted"
      >
        合計金額
      </label>
      <div className="flex items-center gap-1 border-b-2 border-accent pb-px">
        <span className="font-mono text-base font-medium text-faint">¥</span>
        <input
          id="total-amount"
          value={value === 0 ? '' : String(value)}
          onChange={(event) => onChange(event.target.value)}
          inputMode="numeric"
          placeholder="0"
          className="w-32 border-none bg-transparent p-0 text-right font-mono text-[22px] font-semibold text-ink outline-none"
        />
      </div>
    </div>
  )
}
