import { FormResult } from '@/lib/api'

const DOT_CLASS: Record<FormResult, string> = {
  W: 'form-dot form-dot-win',
  D: 'form-dot form-dot-draw',
  L: 'form-dot form-dot-loss',
}

const LABEL: Record<FormResult, string> = { W: 'Win', D: 'Draw', L: 'Loss' }

export function FormIndicator({ results }: { results: FormResult[] }) {
  if (results.length === 0) {
    return <span className="text-xs text-[var(--muted)]">-</span>
  }

  return (
    <div className="flex items-center gap-1" role="list" aria-label="Recent form">
      {results.map((r, i) => (
        <span
          key={i}
          className={DOT_CLASS[r]}
          role="listitem"
          aria-label={LABEL[r]}
          title={LABEL[r]}
        />
      ))}
    </div>
  )
}
