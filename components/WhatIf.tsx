'use client'

import { useState } from 'react'
import { WhatIfSquad } from '@/lib/types'

interface WhatIfProps {
  squads: WhatIfSquad[]
}

export function WhatIf({ squads }: WhatIfProps) {
  const [expandedSquad, setExpandedSquad] = useState<number | null>(null)

  if (squads.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-4">
        <p className="text-[var(--muted)] text-sm text-center">No draft data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-4">
        <p className="text-sm text-[var(--muted)]">
          What if no one made any transfers? This shows each team's original draft squad
          and how many total points those players have scored this season.
        </p>
      </div>

      {/* Rankings */}
      <section className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-3 border-b border-[var(--card-border)]">
          Draft Squad Rankings
        </h2>
        <div className="divide-y divide-[var(--card-border)]">
          {squads.map((squad, index) => {
            const isExpanded = expandedSquad === squad.entryId

            return (
              <div key={squad.entryId}>
                <button
                  onClick={() => setExpandedSquad(isExpanded ? null : squad.entryId)}
                  className="w-full px-4 py-3 hover:bg-[var(--card-border)]/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-lg font-bold w-6 ${
                          index === 0
                            ? 'text-yellow-500'
                            : index === 1
                            ? 'text-slate-300'
                            : index === 2
                            ? 'text-amber-600'
                            : 'text-[var(--muted)]'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="text-left">
                        <div className="font-medium">{squad.teamName}</div>
                        <div className="text-xs text-[var(--muted)]">{squad.managerName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[var(--success)]">
                        {squad.totalPoints}
                      </div>
                      <div className="text-xs text-[var(--muted)]">points</div>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs text-[var(--muted)]">
                      {isExpanded ? '▲ Hide squad' : '▼ Show squad'}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="bg-[var(--background)] rounded-lg p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {squad.players.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between text-sm py-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--muted)] w-8 text-xs">
                                {player.positionName}
                              </span>
                              <span className="truncate">{player.name}</span>
                              <span className="text-xs text-[var(--muted)]">
                                ({player.teamShortName})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--muted)]">
                                R{player.draftRound}
                              </span>
                              <span
                                className={`font-medium w-10 text-right ${
                                  player.totalPoints > 0
                                    ? 'text-[var(--success)]'
                                    : 'text-[var(--muted)]'
                                }`}
                              >
                                {player.totalPoints}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
