export type ScreenName = 'warikan' | 'history'

type Props = {
  current: ScreenName
  onChange: (screen: ScreenName) => void
}

const TABS: { name: ScreenName; label: string }[] = [
  { name: 'warikan', label: '割り勘' },
  { name: 'history', label: '履歴' },
]

/** 画面下部のタブ。割り勘画面と履歴画面を切り替える。 */
export default function BottomTabBar({ current, onChange }: Props) {
  return (
    <nav className="pb-safe-tab flex shrink-0 border-t border-line bg-card">
      {TABS.map((tab) => {
        const active = tab.name === current
        return (
          <button
            key={tab.name}
            type="button"
            onClick={() => onChange(tab.name)}
            className={`flex-1 py-3.5 text-[12.5px] font-bold tracking-wide ${
              active ? 'text-ink' : 'text-faint'
            }`}
          >
            {tab.label}
            <span
              className={`mx-auto mt-1.5 block h-0.5 w-6 rounded-full ${
                active ? 'bg-accent' : 'bg-transparent'
              }`}
            />
          </button>
        )
      })}
    </nav>
  )
}
