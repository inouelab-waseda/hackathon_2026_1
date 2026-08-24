import { GRADES } from '../types/warikan'
import type { ByGrade, Plan } from '../types/warikan'
import { yen } from '../lib/format'

type Props = {
  plans: Plan[]
  counts: ByGrade<number>
  fixed: ByGrade<boolean>
  onChoose: (plan: Plan) => void
}

/** 3案を横スクロールで並べる。人数が0の学年は行ごと出さない。 */
export default function PlanCardList({ plans, counts, fixed, onChoose }: Props) {
  const visibleGrades = GRADES.filter((grade) => counts[grade] > 0)

  return (
    <div className="animate-fade-in no-scrollbar -mx-4 flex shrink-0 snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="flex w-[78%] shrink-0 snap-start flex-col gap-2 rounded-2xl border border-line bg-card p-3"
        >
          <div className="text-[11px] font-bold tracking-wider text-muted">{plan.name}</div>

          <div className="flex flex-col gap-1">
            {visibleGrades.map((grade) => (
              <div
                key={grade}
                className={`flex items-baseline justify-between gap-1 rounded-lg px-2 py-1 ${
                  fixed[grade] ? 'bg-alert/8 text-alert' : 'bg-subtle text-ink'
                }`}
              >
                <span className="font-mono text-[11px] font-semibold opacity-75">{grade}</span>
                <span className="font-mono text-[13px] font-semibold">
                  {yen(plan.perPerson[grade])}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-line/60 px-1 pt-2">
            <span className="text-[9.5px] font-bold tracking-wide text-faint">余剰</span>
            <span
              className={`font-mono text-[11.5px] font-semibold ${
                plan.surplus === 0 ? 'text-accent' : 'text-ink'
              }`}
            >
              {yen(plan.surplus)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onChoose(plan)}
            className="mt-auto rounded-lg bg-ink px-1 py-2.5 text-[11px] font-bold tracking-wide text-white active:bg-accent"
          >
            この案にする
          </button>
        </div>
      ))}
    </div>
  )
}
