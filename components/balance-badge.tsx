import { cn } from "@/lib/utils"
import { Sparkles, Minus } from "lucide-react"
import type { Database } from "@/lib/supabase/types"

interface BalanceBadgeProps {
  type: Database["public"]["Enums"]["balance_type"] | null
  className?: string
}

const config = {
  golden: {
    icon: Sparkles,
    label: "황금밸런스",
    container: "border-amber-400 bg-amber-50 dark:bg-amber-950/30",
    icon_color: "text-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-100 dark:bg-amber-900/40",
  },
  normal: {
    icon: Minus,
    label: "일반",
    container: "border-muted bg-muted/30",
    icon_color: "text-muted-foreground",
    text: "text-muted-foreground",
    badge: "bg-muted",
  },
} as const

export function BalanceBadge({ type, className }: BalanceBadgeProps) {
  if (!type) return null

  const c = config[type]
  const Icon = c.icon

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
      c.container,
      c.badge,
      className,
    )}>
      <Icon className={cn("h-3.5 w-3.5", c.icon_color)} />
      <span className={cn("text-xs font-semibold", c.text)}>
        {c.label}
      </span>
    </div>
  )
}
