import type { ByGrade } from '../types/warikan'

/** 3案を識別する ID。 */
export type PlanId = 'steep' | 'standard' | 'flat'

export type WeightPreset = {
  id: PlanId
  name: string
  weights: ByGrade<number>
}

/**
 * 3案の傾斜係数。B3 を 1.00 とした相対値。
 *
 * ここの数値は **まだチームで合意していない暫定値**（プロトタイプ設計の値をそのまま採用）。
 * 傾斜を変えたいときは、この表の数字だけを書き換えればよい。
 * 計算式ではなく表として持っているのは、その場で1学年だけ調整できるようにするため。
 *
 * name はアプリが傾斜の性格を決めつけないよう「案A/B/C」の識別だけにとどめる。
 * どの案が妥当かは、金額を見た人が判断する。
 */
export const WEIGHT_PRESETS: readonly WeightPreset[] = [
  {
    id: 'steep',
    name: '案A',
    weights: { M2: 2.08, M1: 1.68, B4: 1.21, B3: 1.0 },
  },
  {
    id: 'standard',
    name: '案B',
    weights: { M2: 1.6, M1: 1.4, B4: 1.1, B3: 1.0 },
  },
  {
    id: 'flat',
    name: '案C',
    weights: { M2: 1.12, M1: 1.12, B4: 0.99, B3: 1.0 },
  },
]
