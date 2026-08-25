import { afterEach, describe, expect, it, vi } from 'vitest'
import { WarikanApiError, requestPlans } from './warikanApi'
import { byGrade } from '../types/warikan'
import type { Plan, WarikanInput } from '../types/warikan'

const input: WarikanInput = {
  totalAmount: 48000,
  counts: { M2: 3, M1: 4, B4: 5, B3: 2 },
  fixed: byGrade(false),
  fixedAmounts: byGrade(0),
}

const validPlan: Plan = {
  id: 'steep',
  name: '案A',
  perPerson: { M2: 5000, M1: 4000, B4: 3000, B3: 2500 },
  surplus: 3000,
}

/** fetch の応答を差し替える。 */
function mockFetch(status: number, body: unknown) {
  const response = { ok: status >= 200 && status < 300, status, json: async () => body }
  vi.stubGlobal('fetch', vi.fn(async () => response as unknown as Response))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('requestPlans', () => {
  it('正常なレスポンスから Plan[] を返す', async () => {
    mockFetch(200, [validPlan, validPlan, validPlan])
    const plans = await requestPlans(input)
    expect(plans).toHaveLength(3)
    expect(plans[0].perPerson.M2).toBe(5000)
  })

  it('入力を JSON にして POST する', async () => {
    mockFetch(200, [validPlan])
    await requestPlans(input)
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toBe('/api/calculate')
    expect(call[1]?.method).toBe('POST')
    expect(JSON.parse(String(call[1]?.body))).toEqual(input)
  })

  it('400 のときはサーバーのエラーメッセージをそのまま伝える', async () => {
    mockFetch(400, { error: 'validation_failed', errors: ['合計金額を入力してください。'] })
    await expect(requestPlans(input)).rejects.toThrow(WarikanApiError)
    await expect(requestPlans(input)).rejects.toMatchObject({
      messages: ['合計金額を入力してください。'],
    })
  })

  it('errors が無いエラー応答でもステータスを含むメッセージになる', async () => {
    mockFetch(500, {})
    await expect(requestPlans(input)).rejects.toMatchObject({
      messages: ['計算に失敗しました（HTTP 500）。'],
    })
  })

  it('サーバーに繋がらないときは通信エラーとして扱う', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    await expect(requestPlans(input)).rejects.toMatchObject({
      messages: ['サーバーに接続できませんでした。通信環境を確認してください。'],
    })
  })

  it('配列でない応答はエラーにする', async () => {
    mockFetch(200, { plans: [] })
    await expect(requestPlans(input)).rejects.toThrow(WarikanApiError)
  })

  it('学年キーが欠けている案はエラーにする（形式の食い違いを早期に見つける）', async () => {
    mockFetch(200, [{ ...validPlan, perPerson: { M2: 5000, M1: 4000 } }])
    await expect(requestPlans(input)).rejects.toThrow(WarikanApiError)
  })

  it('surplus が数値でない案はエラーにする', async () => {
    mockFetch(200, [{ ...validPlan, surplus: '3000' }])
    await expect(requestPlans(input)).rejects.toThrow(WarikanApiError)
  })
})
