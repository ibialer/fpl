interface HeaderProps {
  leagueName: string
  currentEvent: number
}

export function Header({ leagueName, currentEvent }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--card-border)] px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{leagueName}</h1>
          <p className="text-sm text-[var(--muted)]">Gameweek {currentEvent}</p>
        </div>
      </div>
    </header>
  )
}
