/** 決済履歴APIとの通信をまとめる。 */

import { GRADES } from '../types/warikan'
import type { ByGrade, SettlementInput, SettlementRecord } from '../types/warikan'

const SETTLEMENTS_ENDPOINT = '/api/settlements'

export class SettlementApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SettlementApiError'
  }
}

/** 保存済みの記録を新しい順に取得する。 */
export async function load(): Promise<SettlementRecord[]> {
  const response = await request(SETTLEMENTS_ENDPOINT)
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new SettlementApiError(extractErrorMessage(body, '履歴を取得できませんでした。'))
  }
  if (!Array.isArray(body) || !body.every(isSettlementRecord)) {
    throw new SettlementApiError('履歴APIの応答形式が正しくありません。')
  }
  return body
}

/** 確定した割り勘をバックエンドへ保存する。 */
export async function save(input: SettlementInput): Promise<SettlementRecord> {
  const response = await request(SETTLEMENTS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new SettlementApiError(extractErrorMessage(body, '保存に失敗しました。'))
  }
  if (!isSettlementRecord(body)) {
    throw new SettlementApiError('保存APIの応答形式が正しくありません。')
  }
  return body
}

/** 画面の確定内容から保存APIのリクエストを組み立てる。 */
export function createSettlementInput(params: {
  totalAmount: number
  counts: ByGrade<number>
  perPerson: ByGrade<number>
  surplus: number
  eventName: string
  shopName: string
}): SettlementInput {
  const payerContributionAmount = Math.max(0, -params.surplus)
  return {
    eventName: normalizeOptionalText(params.eventName),
    shopName: normalizeOptionalText(params.shopName),
    totalAmount: params.totalAmount,
    counts: params.counts,
    perPerson: params.perPerson,
    surplus: params.surplus,
    hasPayerContribution: payerContributionAmount > 0,
    payerContributionAmount,
  }
}

async function request(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch {
    throw new SettlementApiError('サーバーに接続できませんでした。')
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (typeof body !== 'object' || body === null) return fallback
  const errors = (body as { errors?: unknown }).errors
  if (!Array.isArray(errors)) return fallback
  return errors.find((message): message is string => typeof message === 'string') ?? fallback
}

function normalizeOptionalText(value: string): string | null {
  const normalized = value.trim()
  return normalized === '' ? null : normalized
}

function isSettlementRecord(value: unknown): value is SettlementRecord {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Partial<SettlementRecord>
  return (
    typeof record.id === 'string' &&
    typeof record.savedAt === 'string' &&
    (record.eventName === null || typeof record.eventName === 'string') &&
    (record.shopName === null || typeof record.shopName === 'string') &&
    typeof record.totalAmount === 'number' &&
    isByGradeNumber(record.counts) &&
    isByGradeNumber(record.perPerson) &&
    typeof record.surplus === 'number' &&
    typeof record.hasPayerContribution === 'boolean' &&
    typeof record.payerContributionAmount === 'number'
  )
}

function isByGradeNumber(value: unknown): value is ByGrade<number> {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return GRADES.every((grade) => typeof record[grade] === 'number')
}
