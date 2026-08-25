/**
 * 割り勘アプリのドメイン型。
 *
 * ここで定義する型は、フロントエンドの内部表現であると同時に
 * **バックエンド（Flask）との API 契約**でもある。
 * フィールド名はそのまま JSON のキーとして使える形にしてある。
 * 変更するときは必ずバックエンド担当と合意すること。
 */

/** 学年。GRADES の順に画面へ表示する（上級生が上）。 */
export type Grade = 'M2' | 'M1' | 'B4' | 'B3'

/** 学年ごとに値を1つ持つオブジェクト。人数も金額もすべてこの形で扱う。 */
export type ByGrade<T> = Record<Grade, T>

/** 画面・計算・API のすべてでこの順序を使う。 */
export const GRADES: readonly Grade[] = ['M2', 'M1', 'B4', 'B3']

/** 割り勘の計算に必要な入力一式。API のリクエストボディに相当する。 */
export type WarikanInput = {
  /** 支払いたい合計金額 */
  totalAmount: number
  /** 学年ごとの人数 */
  counts: ByGrade<number>
  /** 金額をあらかじめ固定した学年 */
  fixed: ByGrade<boolean>
  /** 固定した場合の1人あたり金額（fixed が false の学年の値は使わない） */
  fixedAmounts: ByGrade<number>
}

/** 傾斜1パターンぶんの計算結果。3案ぶん生成される。 */
export type Plan = {
  /** 'steep' | 'standard' | 'flat' */
  id: string
  /** 画面に出す案の名前 */
  name: string
  /** 学年ごとの1人あたり負担額 */
  perPerson: ByGrade<number>
  /** 余剰金額（徴収合計 − 支払い金額）。必ず0以上になる。 */
  surplus: number
}

/** 決済履歴APIへ送信する保存内容。idと日時はバックエンドが発行する。 */
export type SettlementInput = {
  /** 行事名（任意入力なので未入力なら null） */
  eventName: string | null
  /** 店名（任意入力なので未入力なら null） */
  shopName: string | null
  totalAmount: number
  counts: ByGrade<number>
  perPerson: ByGrade<number>
  surplus: number
  /** 徴収額が不足し、幹事による立て替えが発生したか */
  hasPayerContribution: boolean
  /** 幹事が立て替える金額。立て替えがなければ0 */
  payerContributionAmount: number
}

/** 保存される1件の決済記録。API のレスポンス／DB の1行に相当する。 */
export type SettlementRecord = SettlementInput & {
  id: string
  /** ISO8601 の日時文字列 */
  savedAt: string
}

/** 全学年を同じ値で初期化した ByGrade を作る。 */
export function byGrade<T>(value: T): ByGrade<T> {
  return { M2: value, M1: value, B4: value, B3: value }
}
