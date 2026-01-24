'use client'

import { useRef, useEffect, useState } from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const innerContainerRef = useRef<HTMLDivElement>(null)

  // Update indicator position when active tab changes
  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab)
    const activeTabElement = tabRefs.current[activeIndex]

    if (activeTabElement && innerContainerRef.current) {
      const containerRect = innerContainerRef.current.getBoundingClientRect()
      const tabRect = activeTabElement.getBoundingClientRect()

      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      })
    }
  }, [activeTab, tabs])

  // Scroll active tab into view on mobile
  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab)
    const activeTabElement = tabRefs.current[activeIndex]

    if (activeTabElement) {
      activeTabElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeTab, tabs])

  return (
    <nav
className="sticky top-[105px] sm:top-[85px] z-[calc(var(--z-sticky)+1)] glass bg-[var(--card)] border-b border-[var(--card-border)]"
      role="tablist"
      aria-label="Dashboard navigation"
    >
      <div ref={innerContainerRef} className="max-w-6xl mx-auto relative">
        {/* Tab buttons */}
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[index] = el
                }}
                onClick={() => onTabChange(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                tabIndex={isActive ? 0 : -1}
                className={`
                  relative flex-1 min-w-[80px] px-4 py-3.5
                  flex items-center justify-center gap-2
                  text-sm font-medium
                  touch-target btn-press
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)]/30'
                  }
                `}
              >
                {/* Icon (if provided) */}
                {tab.icon && (
                  <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                    {tab.icon}
                  </span>
                )}

                {/* Label */}
                <span className="whitespace-nowrap">{tab.label}</span>

                {/* Active indicator dot for mobile (fallback) */}
                {isActive && (
                  <span className="sm:hidden absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Animated indicator bar - desktop only for smoother UX */}
        <div
          className="hidden sm:block absolute bottom-0 h-0.5 bg-[var(--accent)] rounded-full transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />

        {/* Static indicator for mobile (simpler, more reliable) */}
        <div className="sm:hidden absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--card-border)]">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <div
                key={tab.id}
                className={`absolute top-0 h-full transition-all duration-200 ${
                  isActive ? 'bg-[var(--accent)]' : ''
                }`}
                style={{
                  left: `${(tabs.findIndex((t) => t.id === tab.id) / tabs.length) * 100}%`,
                  width: `${100 / tabs.length}%`,
                }}
              />
            )
          })}
        </div>
      </div>
    </nav>
  )
}

// Pre-built icons for common tabs
export const TabIcons = {
  live: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"
      />
    </svg>
  ),
  results: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  fixtures: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  whatif: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
}
