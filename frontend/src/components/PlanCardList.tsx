import { GRADES } from '../types/warikan'
import type { ByGrade, Grade, Plan } from '../types/warikan'
import { yen } from '../lib/format'

type Props = {
  plans: Plan[]
  counts: ByGrade<number>
  fixed: ByGrade<boolean>
  onChoose: (plan: Plan) => void
  /** 参考デザインの案ごとの色分け・基準案との差分表示を使うかどうか */
  colored: boolean
}

/**
 * 案ごとの色（参考HTML「Warikan App.dc.html」の配色をそのまま採用）。
 * 案の名前（案A/B/C）は中立のまま維持しつつ、色だけで傾斜の強さを見分けられるようにする。
 */
const PLAN_THEME: Record<
  string,
  {
    cardBorder: string
    headerBg: string
    headerText: string
    headerBorder: string
    rowBgDiff: string
    labelBgDiff: string
    amountTextDiff: string
    restBorder: string
    button: string
  }
> = {
  steep: {
    cardBorder: 'border-[#3f6fb5]/40',
    headerBg: 'bg-[#3f6fb5]/10',
    headerText: 'text-[#2f5b98]',
    headerBorder: 'border-b-2 border-[#3f6fb5]',
    rowBgDiff: 'bg-[#3f6fb5]/8',
    labelBgDiff: 'bg-[#3f6fb5]',
    amountTextDiff: 'text-[#2f5b98]',
    restBorder: 'border-t-[#3f6fb5]/25',
    button: 'bg-[#3f6fb5]',
  },
  standard: {
    cardBorder: 'border-accent/40',
    headerBg: 'bg-accent/10',
    headerText: 'text-[#178056]',
    headerBorder: 'border-b-2 border-accent',
    rowBgDiff: 'bg-accent/8',
    labelBgDiff: 'bg-accent',
    amountTextDiff: 'text-[#178056]',
    restBorder: 'border-t-accent/25',
    button: 'bg-accent',
  },
  flat: {
    cardBorder: 'border-[#c98a1e]/40',
    headerBg: 'bg-[#c98a1e]/10',
    headerText: 'text-[#a06d10]',
    headerBorder: 'border-b-2 border-[#c98a1e]',
    rowBgDiff: 'bg-[#c98a1e]/8',
    labelBgDiff: 'bg-[#c98a1e]',
    amountTextDiff: 'text-[#a06d10]',
    restBorder: 'border-t-[#c98a1e]/25',
    button: 'bg-[#c98a1e]',
  },
}

/** 3案を横スクロールで並べる。人数が0の学年は行ごと出さない。 */
export default function PlanCardList({ plans, counts, fixed, onChoose, colored }: Props) {
  const visibleGrades = GRADES.filter((grade) => counts[grade] > 0)
  const standardPlan = plans.find((plan) => plan.id === 'standard') ?? plans[0]

  // 学年ごとに、3案の間で金額が割れているかどうか（割れていなければどの案も強調しない）
  const variesByGrade: Partial<Record<Grade, boolean>> = {}
  for (const grade of visibleGrades) {
    const amounts = plans.map((plan) => plan.perPerson[grade])
    variesByGrade[grade] = amounts.some((amount) => amount !== amounts[0])
  }

  return (
    <div className="animate-fade-in no-scrollbar -mx-4 flex shrink-0 snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1">
      {plans.map((plan) => {
        const theme = PLAN_THEME[plan.id]

        return (
          <div
            key={plan.id}
            className={`flex w-[78%] shrink-0 snap-start flex-col gap-2 overflow-hidden rounded-2xl border bg-card p-3 ${
              colored ? theme.cardBorder : 'border-line'
            }`}
          >
            <div
              className={`-mx-3 -mt-3 px-3 py-2 text-center text-[11px] font-bold tracking-wider ${
                colored ? `${theme.headerBg} ${theme.headerText} ${theme.headerBorder}` : 'text-muted'
              }`}
            >
              {plan.name}
            </div>

            <div className="flex flex-col gap-1">
              {visibleGrades.map((grade) => {
                const isFixed = fixed[grade]
                const diffs = colored && !isFixed && (variesByGrade[grade] ?? false)
                const delta = plan.perPerson[grade] - standardPlan.perPerson[grade]

                return (
                  <div
                    key={grade}
                    className={`flex items-baseline justify-between gap-1 rounded-lg px-2 py-1 ${
                      isFixed ? 'bg-alert/8 text-alert' : diffs ? `${theme.rowBgDiff} ${theme.amountTextDiff}` : 'bg-subtle text-ink'
                    }`}
                  >
                    <span
                      className={`rounded font-mono text-[11px] font-semibold ${
                        diffs ? `${theme.labelBgDiff} px-1 text-white` : 'opacity-75'
                      }`}
                    >
                      {grade}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-[13px] font-semibold">
                        {yen(plan.perPerson[grade])}
                      </span>
                      {diffs && (
                        <span className="font-mono text-[9px] font-bold opacity-80">
                          {delta === 0
                            ? '基準'
                            : `${delta > 0 ? '+' : '−'}${Math.abs(delta).toLocaleString('ja-JP')}`}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              className={`flex items-center justify-between border-t px-1 pt-2 ${
                colored ? theme.restBorder : 'border-line/60'
              }`}
            >
              <span className="text-[9.5px] font-bold tracking-wide text-faint">余剰</span>
              <span
                className={`font-mono text-[11.5px] font-semibold ${
                  plan.surplus === 0 ? (colored ? theme.amountTextDiff : 'text-accent') : 'text-ink'
                }`}
              >
                {yen(plan.surplus)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onChoose(plan)}
              className={`mt-auto rounded-lg px-1 py-2.5 text-[11px] font-bold tracking-wide text-white ${
                colored ? theme.button : 'bg-ink active:bg-accent'
              }`}
            >
              この案にする
            </button>
          </div>
        )
      })}
    </div>
  )
}
