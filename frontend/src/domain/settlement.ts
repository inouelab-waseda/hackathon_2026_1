import { GRADES } from '../types/warikan'
import type { ByGrade, WarikanInput } from '../types/warikan'

/** 参加者の総数。 */
export function totalHeadCount(counts: ByGrade<number>): number {
  return GRADES.reduce((sum, grade) => sum + counts[grade], 0)
}

/** 徴収額の合計（学年ごとの人数 × 1人あたり金額）。 */
export function calcCollected(counts: ByGrade<number>, perPerson: ByGrade<number>): number {
  return GRADES.reduce((sum, grade) => sum + counts[grade] * perPerson[grade], 0)
}

/**
 * 余剰金額 = 徴収合計 − 支払い金額。
 * 正なら余り、0ならぴったり、負なら不足（幹事の持ち出しになるので許さない）。
 */
export function calcSurplus(input: WarikanInput, perPerson: ByGrade<number>): number {
  return calcCollected(input.counts, perPerson) - input.totalAmount
}
