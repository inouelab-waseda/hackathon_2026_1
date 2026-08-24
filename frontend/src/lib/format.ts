/** 金額を「¥12,345」の形にする。 */
export function yen(value: number): string {
  return `¥${Math.round(value).toLocaleString('ja-JP')}`
}

/** ISO8601 の日時を「8/25 3:40」の形にする。 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const time = date.toLocaleTimeString('ja-JP', { hour: 'numeric', minute: '2-digit' })
  return `${date.getMonth() + 1}/${date.getDate()} ${time}`
}
