'use client'

import { useCountUp } from './use-count-up'

interface AccuracyRingProps {
  accPct: number
  active: boolean
  correctCount: number
  missCount: number
  showRank?: boolean
}

export function AccuracyRing({
  accPct,
  active,
  correctCount,
  missCount,
  showRank = true,
}: AccuracyRingProps) {
  const R = 46
  const C = 2 * Math.PI * R
  const animPct = useCountUp(accPct, 1400, active)

  const color =
    accPct >= 70
      ? 'text-emerald-500'
      : accPct >= 50
        ? 'text-amber-500'
        : 'text-red-500'

  const strokeColor =
    accPct >= 70 ? '#10B981' : accPct >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[110px] w-[110px]">
        <svg width="110" height="110" className="-rotate-90">
          <circle
            cx="55"
            cy="55"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-100"
          />
          <circle
            cx="55"
            cy="55"
            r={R}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeDasharray={C}
            strokeDashoffset={C - (animPct / 100) * C}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-[28px] font-black tabular-nums ${color}`}>
            {animPct}%
          </span>
          <span className="text-[10.5px] font-semibold text-muted-foreground">
            예측 적중률
          </span>
        </div>
      </div>

      {showRank && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          👑 상위 12% 예측러
        </span>
      )}

      <div className="mt-3 grid w-full max-w-[200px] grid-cols-2 gap-2">
        <div className="rounded-lg bg-gray-50 py-2 text-center">
          <div className="text-lg font-extrabold text-emerald-500">
            {correctCount}
          </div>
          <div className="text-[10px] text-muted-foreground">적중</div>
        </div>
        <div className="rounded-lg bg-gray-50 py-2 text-center">
          <div className="text-lg font-extrabold text-red-500">{missCount}</div>
          <div className="text-[10px] text-muted-foreground">빗나감</div>
        </div>
      </div>
    </div>
  )
}
