export function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const medalColors = {
      1: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      2: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
      3: 'bg-amber-700/20 text-amber-600 border-amber-700/30',
    }[rank]

    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border ${medalColors}`}
      >
        {rank}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-[var(--muted)]">
      {rank}
    </span>
  )
}
