/**
 * ============================================================================
 * ※ このファイルは暫定実装（スタブ）です。
 *
 * 正式な計算方法は別紙「学年ごとの傾斜付き割り勘の定式化 v2」の飴玉モデル
 * （支払総額を500円単位に繰り上げた個数を目標比で配り、超過を最小化する）。
 *
 * 差し替えるときは calculatePlans の中身だけを書き換えればよく、
 * UI・状態層には一切手を入れる必要はありません。入出力の型が契約です。
 * 差し替え後は calculate.test.ts がそのまま回帰テストとして機能します。
 * ============================================================================
 */

import { GRADES, byGrade } from '../types/warikan'
import type { ByGrade, Plan, WarikanInput } from '../types/warikan'
import { WEIGHT_PRESETS } from './weights'
import { calcSurplus } from './settlement'

/** 1人あたりの金額を丸める単位。「きりの良い金額」にするため500円刻みにする。 */
export const ROUNDING_UNIT = 500

/** 3案（上級生を厚めに / 標準 / フラット寄りに）をまとめて生成する。 */
export function calculatePlans(input: WarikanInput): Plan[] {
  return WEIGHT_PRESETS.map((preset) => {
    const perPerson = allocate(input, preset.weights)
    return {
      id: preset.id,
      name: preset.name,
      perPerson,
      surplus: calcSurplus(input, perPerson),
    }
  })
}

/**
 * 固定した学年はその金額のまま据え置き、残額を残りの学年へ重みの比率で配分する。
 *
 * 丸めは必ず「切り上げ」にする。切り捨てると徴収合計が支払い金額を下回り、
 * 余剰金額が負（＝幹事の持ち出し）になってしまうため。
 */
function allocate(input: WarikanInput, weights: ByGrade<number>): ByGrade<number> {
  const perPerson = byGrade(0)

  // 固定した学年を先に確定させ、残額を求める
  let remaining = input.totalAmount
  for (const grade of GRADES) {
    if (input.fixed[grade]) {
      perPerson[grade] = Math.max(0, input.fixedAmounts[grade])
      remaining -= input.counts[grade] * perPerson[grade]
    }
  }

  // 固定していない学年（かつ人数がいる学年）へ配分する
  const openGrades = GRADES.filter((grade) => !input.fixed[grade] && input.counts[grade] > 0)
  const denominator = openGrades.reduce(
    (sum, grade) => sum + input.counts[grade] * weights[grade],
    0,
  )

  // 固定分だけで支払い金額を超えている場合は remaining が負になるので0として扱う
  const base = denominator > 0 ? Math.max(0, remaining) / denominator : 0
  for (const grade of openGrades) {
    perPerson[grade] = Math.ceil((base * weights[grade]) / ROUNDING_UNIT) * ROUNDING_UNIT
  }

  return perPerson
}
