import { useEffect, useState } from 'react'

type Health = {
  status: string
  service: string
}

/**
 * 環境構築の疎通確認用の暫定画面。
 * フロント（Vite）とバック（Flask）が Docker 上で繋がっていることを目で確認できる。
 * 実際の割り勘画面を作り始めたら、この中身は差し替えてよい。
 */
export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // vite.config.ts の proxy 設定により、/api は backend コンテナに転送される
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<Health>
      })
      .then(setHealth)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">研究室割り勘アプリ</h1>
          <p className="text-sm text-slate-500 mt-1">開発環境の疎通確認</p>
        </div>

        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-slate-700">フロントエンド (Vite)</span>
            <span className="font-medium text-emerald-600">起動中</span>
          </li>
          <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-slate-700">バックエンド (Flask)</span>
            {health ? (
              <span className="font-medium text-emerald-600">接続OK</span>
            ) : error ? (
              <span className="font-medium text-red-600">接続失敗</span>
            ) : (
              <span className="font-medium text-slate-400">確認中…</span>
            )}
          </li>
        </ul>

        {health && (
          <p className="text-xs text-slate-500">
            応答: <code className="text-slate-700">{JSON.stringify(health)}</code>
          </p>
        )}
        {error && (
          <p className="text-xs text-red-600">
            エラー: {error}
            <br />
            backend コンテナが起動しているか確認してください。
          </p>
        )}

        <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
          この画面が両方「起動中 / 接続OK」になれば環境構築は完了です。
        </p>
      </div>
    </div>
  )
}
