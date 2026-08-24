import { GRADES } from '../types/warikan'
import type { WarikanInput } from '../types/warikan'
import { totalHeadCount } from './settlement'

/**
 * 「計算する」を押したときの入力チェック。
 * 問題がなければ空配列を返す。返した文字列はそのまま画面に表示される。
 */
export function validateInput(input: WarikanInput): string[] {
  const errors: string[] = []

  if (input.totalAmount <= 0) {
    errors.push('合計金額を入力してください。')
  }

  if (totalHeadCount(input.counts) === 0) {
    errors.push('人数を1人以上入力してください。')
  }

  // 傾斜で配分する対象（固定しておらず、かつ人数がいる学年）が1つも無いと3案を作れない。
  // 「全学年を固定した場合」だけでなく「固定していない学年が全員0人」もここで弾かれる。
  const hasDistributable = GRADES.some((grade) => !input.fixed[grade] && input.counts[grade] > 0)
  if (totalHeadCount(input.counts) > 0 && !hasDistributable) {
    errors.push('すべての学年を固定すると案を作れません。1つ以上の学年の固定を外してください。')
  }

  return errors
}
