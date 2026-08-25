/**
 * バックエンド（Flask）との通信をまとめたファイル。
 *
 * 画面・状態層はこのファイルの関数しか知らない。
 * エンドポイントの形が変わっても、ここだけを直せば済むようにしてある。
 * 通信仕様は docs/api-contract.md を参照。
 */

import { GRADES } from '../types/warikan'
import type { ByGrade, Plan, WarikanInput } from '../types/warikan'

/** 計算 API のパス。Vite の proxy 経由で backend コンテナへ転送される。 */
const CALCULATE_ENDPOINT = '/api/calculate'

/**
 * API 由来のエラー。messages はそのまま画面に出せる日本語の配列。
 * 通信断・サーバエラー・入力エラーをすべてこの形に揃えて画面へ渡す。
 */
export class WarikanApiError extends Error {
  readonly messages: string[]

  constructor(messages: string[]) {
    super(messages[0] ?? '計算に失敗しました。')
    this.name = 'WarikanApiError'
    this.messages = messages
  }
}

/** 割り勘の3案をバックエンドに計算してもらう。 */
export async function requestPlans(input: WarikanInput): Promise<Plan[]> {
  let response: Response
  try {
    response = await fetch(CALCULATE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    // ネットワークに到達できない（サーバ未起動・オフラインなど）
    throw new WarikanApiError([
      'サーバーに接続できませんでした。通信環境を確認してください。',
    ])
  }

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const messages = extractErrorMessages(body)
    throw new WarikanApiError(
      messages.length > 0 ? messages : [`計算に失敗しました（HTTP ${response.status}）。`],
    )
  }

  return parsePlans(body)
}

/** エラーレスポンス `{ "errors": ["..."] }` から日本語メッセージを取り出す。 */
function extractErrorMessages(body: unknown): string[] {
  if (typeof body !== 'object' || body === null) return []
  const errors = (body as { errors?: unknown }).errors
  if (!Array.isArray(errors)) return []
  return errors.filter((message): message is string => typeof message === 'string')
}

/**
 * レスポンスが期待した形かを確認してから Plan[] として扱う。
 * 形が違うときは「動くけど表示が壊れる」ではなく明示的なエラーにして、
 * フロントとバックエンドのどちらがずれているかを見つけやすくする。
 *
 * 成功時のボディは Plan の配列そのもの（`[{...}, {...}, {...}]`）。
 */
function parsePlans(body: unknown): Plan[] {
  if (!Array.isArray(body) || body.length === 0) {
    throw new WarikanApiError(['サーバーの応答を解釈できませんでした（案が返ってきていません）。'])
  }

  return body.map((plan, index) => {
    if (!isPlan(plan)) {
      throw new WarikanApiError([
        `サーバーの応答を解釈できませんでした（${index + 1}件目の案の形式が想定と違います）。`,
      ])
    }
    return plan
  })
}

function isPlan(value: unknown): value is Plan {
  if (typeof value !== 'object' || value === null) return false
  const plan = value as Partial<Plan>
  return (
    typeof plan.id === 'string' &&
    typeof plan.name === 'string' &&
    typeof plan.surplus === 'number' &&
    isByGradeNumber(plan.perPerson)
  )
}

function isByGradeNumber(value: unknown): value is ByGrade<number> {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return GRADES.every((grade) => typeof record[grade] === 'number')
}
