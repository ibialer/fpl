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
    <div className="flex border-b border-[var(--card-border)] bg-[var(--card)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
