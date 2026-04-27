'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface TrendPoint {
  label: string
  countA: number
  countB: number
  totalA: number
  totalB: number
}

interface VoteTrendChartProps {
  questionId: string
  optionALabel: string
  optionBLabel: string
}

function TrendTip({
  active,
  payload,
  optionALabel,
  optionBLabel,
}: {
  active?: boolean
  payload?: { payload: TrendPoint; value: number; dataKey: string }[]
  optionALabel: string
  optionBLabel: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  const total = d.totalA + d.totalB
  const pctA = total > 0 ? Math.round((d.totalA / total) * 100) : 50
  const pctB = total > 0 ? Math.round((d.totalB / total) * 100) : 50
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 shadow-lg text-xs">
      <div className="text-[10px] text-muted-foreground mb-1">{d.label}</div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
        <span>A. {optionALabel}: {d.totalA}표 ({pctA}%)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
        <span>B. {optionBLabel}: {d.totalB}표 ({pctB}%)</span>
      </div>
    </div>
  )
}

export function VoteTrendChart({ questionId, optionALabel, optionBLabel }: VoteTrendChartProps) {
  const [data, setData] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVoteTrend() {
      const supabase = createClient()

      const { data: votes, error } = await supabase
        .from('votes')
        .select('choice, created_at')
        .eq('question_id', questionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Vote trend fetch error:', error)
        setLoading(false)
        return
      }

      if (!votes || votes.length === 0) {
        setLoading(false)
        return
      }

      // Group votes into time buckets
      const firstVote = new Date(votes[0].created_at!).getTime()
      const lastVote = new Date(votes[votes.length - 1].created_at!).getTime()
      const span = lastVote - firstVote

      // Always use 1-day buckets with date labels
      const bucketMs = 86400000
      const formatLabel = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`

      const buckets: Map<number, { a: number; b: number }> = new Map()

      for (const v of votes) {
        const t = new Date(v.created_at!).getTime()
        const bucket = Math.floor((t - firstVote) / bucketMs) * bucketMs + firstVote
        const existing = buckets.get(bucket) || { a: 0, b: 0 }
        if (v.choice === 'a') existing.a++
        else existing.b++
        buckets.set(bucket, existing)
      }

      // Build cumulative trend
      const sorted = [...buckets.entries()].sort((a, b) => a[0] - b[0])
      let cumA = 0
      let cumB = 0
      const points: TrendPoint[] = sorted.map(([ts, counts]) => {
        cumA += counts.a
        cumB += counts.b
        return {
          label: formatLabel(new Date(ts)),
          countA: counts.a,
          countB: counts.b,
          totalA: cumA,
          totalB: cumB,
        }
      })

      setData(points)
      setLoading(false)
    }

    fetchVoteTrend()
  }, [questionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (data.length === 0) return null

  const maxValue = Math.max(...data.map(d => Math.max(d.totalA, d.totalB)))

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h3 className="flex items-center gap-1.5 text-sm font-bold mb-3">
        📊 투표 추이
      </h3>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 6, left: -24, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(0,0,0,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, Math.ceil(maxValue * 1.1)]}
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<TrendTip optionALabel={optionALabel} optionBLabel={optionBLabel} />}
            cursor={{ stroke: 'rgba(0,0,0,0.05)' }}
          />
          <Area
            type="monotone"
            dataKey="totalA"
            stroke="#22C55E"
            fill="#22C55E"
            fillOpacity={0.15}
            strokeWidth={2}
            name={`A. ${optionALabel}`}
          />
          <Area
            type="monotone"
            dataKey="totalB"
            stroke="#EF4444"
            fill="#EF4444"
            fillOpacity={0.15}
            strokeWidth={2}
            name={`B. ${optionBLabel}`}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px' }}
            iconType="circle"
            iconSize={8}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
