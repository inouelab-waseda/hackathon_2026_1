import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createSettlementInput,
  load,
  save,
  SettlementApiError,
} from './historyStore'
import type { SettlementRecord } from '../types/warikan'

const record: SettlementRecord = {
  id: 'record-1',
  savedAt: '2026-08-25T12:00:00.000Z',
  eventName: '歓迎会',
  shopName: '研究室食堂',
  totalAmount: 48000,
  counts: { M2: 3, M1: 4, B4: 5, B3: 2 },
  perPerson: { M2: 5000, M1: 4000, B4: 2500, B3: 2500 },
  surplus: 500,
  hasPayerContribution: false,
  payerContributionAmount: 0,
}

function mockFetch(status: number, body: unknown) {
  const response = { ok: status >= 200 && status < 300, status, json: async () => body }
  vi.stubGlobal('fetch', vi.fn(async () => response as unknown as Response))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createSettlementInput', () => {
  it('不足額を幹事立て替えとして組み立てる', () => {
    const input = createSettlementInput({
      totalAmount: 49000,
      counts: record.counts,
      perPerson: record.perPerson,
      surplus: -500,
      eventName: '  歓迎会  ',
      shopName: '  ',
    })
    expect(input.eventName).toBe('歓迎会')
    expect(input.shopName).toBeNull()
    expect(input.hasPayerContribution).toBe(true)
    expect(input.payerContributionAmount).toBe(500)
  })
})

describe('決済履歴API', () => {
  it('履歴をGETで取得する', async () => {
    mockFetch(200, [record])
    await expect(load()).resolves.toEqual([record])
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/settlements')
  })

  it('保存内容をPOSTし、バックエンドが発行した記録を返す', async () => {
    mockFetch(201, record)
    const { id: _id, savedAt: _savedAt, ...input } = record
    await expect(save(input)).resolves.toEqual(record)

    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toBe('/api/settlements')
    expect(call[1]?.method).toBe('POST')
    expect(JSON.parse(String(call[1]?.body))).toEqual(input)
  })

  it('サーバーのエラーメッセージを画面向けに返す', async () => {
    mockFetch(400, { errors: ['徴収合計と余剰金額が一致しません。'] })
    const { id: _id, savedAt: _savedAt, ...input } = record
    await expect(save(input)).rejects.toEqual(
      new SettlementApiError('徴収合計と余剰金額が一致しません。'),
    )
  })
})
