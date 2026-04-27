'use client'

import { cn } from '@/lib/utils'

interface FilterChipsProps<T extends string> {
  label: string
  options: { k: T; l: string }[]
  value: T
  onChange: (v: T) => void
  activeColor?: 'violet' | 'emerald' | 'amber'
}

const colorMap = {
  violet: 'border-violet-500 bg-violet-50 text-violet-700',
  emerald: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-500 bg-amber-50 text-amber-700',
}

export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
  activeColor = 'violet',
}: FilterChipsProps<T>) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      {options.map((opt) => (
        <button
          key={opt.k}
          onClick={() => onChange(opt.k)}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all',
            value === opt.k
              ? colorMap[activeColor]
              : 'border-border text-muted-foreground hover:bg-muted',
          )}
        >
          {opt.l}
        </button>
      ))}
    </div>
  )
}
