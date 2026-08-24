/**
 * 決済履歴の保存先。
 *
 * ※ 現在はブラウザの localStorage を使う暫定実装です。
 * バックエンド（Flask）ができたら **このファイルの中身だけ** を
 * fetch('/api/settlements') に書き換えれば移行が完了します。
 * 画面側は load() / save() の2つしか知らないので、影響は出ません。
 */

import type { ByGrade, SettlementRecord } from '../types/warikan'

const STORAGE_KEY = 'warikan.settlements.v1'

/** 保存済みの記録を新しい順に返す。読めなければ空配列。 */
export function load(): SettlementRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    // 壊れたデータが入っていても画面を落とさない
    return Array.isArray(parsed) ? (parsed as SettlementRecord[]) : []
  } catch {
    return []
  }
}

/**
 * 1件追加して保存する。
 * 保存に失敗した場合は例外を投げる（呼び出し側で画面にエラーを出すため、握りつぶさない）。
 */
export function save(record: SettlementRecord): void {
  const next = [record, ...load()]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

/** 保存する1件ぶんのデータを組み立てる。id と日時はここで付与する。 */
export function createRecord(params: {
  totalAmount: number
  counts: ByGrade<number>
  perPerson: ByGrade<number>
  surplus: number
  eventName: string
  shopName: string
}): SettlementRecord {
  return {
    id: createId(),
    savedAt: new Date().toISOString(),
    eventName: params.eventName.trim() === '' ? null : params.eventName.trim(),
    shopName: params.shopName.trim() === '' ? null : params.shopName.trim(),
    totalAmount: params.totalAmount,
    counts: params.counts,
    perPerson: params.perPerson,
    surplus: params.surplus,
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
