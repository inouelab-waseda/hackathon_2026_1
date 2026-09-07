import { useCallback, useEffect, useState } from 'react'
import type { SettlementRecord } from './types/warikan'
import { load } from './storage/historyStore'
import BottomTabBar from './components/BottomTabBar'
import type { ScreenName } from './components/BottomTabBar'
import WarikanScreen from './screens/WarikanScreen'
import HistoryScreen from './screens/HistoryScreen'

/**
 * アプリの入口。画面（割り勘 / 履歴）の切り替えと、履歴データの読み込みを担当する。
 * 画面が2つだけなのでルーティングライブラリは使っていない。
 */
export default function App() {
  const [screen, setScreen] = useState<ScreenName>('warikan')
  const [records, setRecords] = useState<SettlementRecord[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)

  // 保存直後と初回表示で履歴を読み直す
  const reloadRecords = useCallback(async () => {
    try {
      setRecords(await load())
      setHistoryError(null)
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : '履歴を取得できませんでした。')
    }
  }, [])

  useEffect(() => {
    void reloadRecords()
  }, [reloadRecords])

  return (
    <div className="flex min-h-dvh justify-center overflow-x-hidden">
      {/* flex アイテムは min-width:auto のままだと中身の幅で広がってしまうので min-w-0 を付ける */}
      {/* 画面の高さぴったりに固定し、中身だけをスクロールさせる（下のタブを常に見せる） */}
      <div className="relative flex h-dvh w-full max-w-[430px] min-w-0 flex-col overflow-hidden bg-paper">
        {screen === 'warikan' ? (
          <WarikanScreen onSaved={() => void reloadRecords()} />
        ) : (
          <HistoryScreen
            records={records}
            error={historyError}
            onRetry={() => void reloadRecords()}
          />
        )}
        <BottomTabBar current={screen} onChange={setScreen} />
      </div>
    </div>
  )
}
