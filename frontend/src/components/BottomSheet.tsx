import type { ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * 下からせり上がる共通のシート。調整シートと結果シートの両方がこれを使う。
 * 背景をタップすると閉じ、シートの中をタップしても閉じない。
 */
export default function BottomSheet({ open, onClose, children }: Props) {
  if (!open) return null

  return (
    <div
      className="absolute inset-0 z-20 flex items-end bg-ink/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-sheet-up pb-safe max-h-[88%] w-full overflow-y-auto overscroll-contain rounded-t-[22px] bg-paper px-5 pt-4"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-line" />
        {children}
      </div>
    </div>
  )
}
