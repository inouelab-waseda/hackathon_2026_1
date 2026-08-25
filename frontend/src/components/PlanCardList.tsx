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

/** 3案を横に並べて最初から全部見せる。人数が0の学年は行ごと出さない。 */
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
    <div className="animate-fade-in flex shrink-0 gap-2">
      {plans.map((plan) => {
        const theme = PLAN_THEME[plan.id]

        return (
          <div
            key={plan.id}
            className={`flex min-w-0 flex-1 flex-col gap-2 overflow-hidden rounded-2xl border bg-card p-2.5 ${
              colored ? theme.cardBorder : 'border-line'
            }`}
          >
            <div
              className={`-mx-2.5 -mt-2.5 px-2 py-1.5 text-center text-[10px] font-bold tracking-wider whitespace-nowrap ${
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
                    className={`flex flex-col overflow-hidden rounded-lg border ${
                      isFixed
                        ? 'border-alert/35 bg-alert/6'
                        : diffs
                          ? `border-transparent ${theme.rowBgDiff}`
                          : 'border-line/60 bg-subtle'
                    }`}
                  >
                    <div
                      className={`text-center font-mono text-[9.5px] font-bold tracking-wide ${
                        isFixed
                          ? 'bg-alert text-white'
                          : diffs
                            ? `${theme.labelBgDiff} text-white`
                            : 'text-faint'
                      }`}
                    >
                      {grade}
                    </div>
                    <div className="flex flex-col items-center gap-px py-1">
                      <span
                        className={`font-mono text-[11.5px] font-semibold ${
                          isFixed ? 'text-alert' : diffs ? theme.amountTextDiff : 'text-ink'
                        }`}
                      >
                        {yen(plan.perPerson[grade])}
                      </span>
                      <span className="h-[11px] font-mono text-[8.5px] font-bold text-faint">
                        {diffs
                          ? delta === 0
                            ? '基準'
                            : `${delta > 0 ? '+' : '−'}${Math.abs(delta).toLocaleString('ja-JP')}`
                          : ' '}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              className={`flex items-center justify-between border-t px-0.5 pt-1.5 ${
                colored ? theme.restBorder : 'border-line/60'
              }`}
            >
              <span className="text-[9px] font-bold tracking-wide text-faint">余剰</span>
              <span
                className={`font-mono text-[10.5px] font-semibold ${
                  plan.surplus === 0 ? (colored ? theme.amountTextDiff : 'text-accent') : 'text-ink'
                }`}
              >
                {yen(plan.surplus)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onChoose(plan)}
              className={`mt-auto rounded-lg px-1 py-2 text-[10px] font-bold tracking-wide whitespace-nowrap text-white ${
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
