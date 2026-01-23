'use client'

interface Tab {
  id: string
  label: string
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex border-b border-[var(--card-border)] bg-[var(--card)]/50 backdrop-blur-sm sticky top-[73px] z-10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? 'text-[var(--accent)]'
              : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)]/20'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)] rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  )
}
