'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Trophy,
  Gamepad2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Crown,
  Sparkles,
} from 'lucide-react'
import { fetchWorldcupStats } from '@/lib/admin/worldcup-actions'
import type { WorldcupStats } from '@/lib/admin/worldcup-actions'

const BRAND = '#1E5C52'
const BRAND_LIGHT = '#2D8A7A'
const BRAND_PALE = '#4A9B8E'
const CHART_COLORS = ['#1E5C52', '#2D8A7A', '#4A9B8E', '#6BB8A8', '#A8D8D0', '#C5E8E2']

const CATEGORY_COLORS: Record<string, string> = {
  연애: '#E85D75',
  일상: '#4A9B8E',
  직장: '#6B7FD4',
  패션: '#D4A84B',
  기타: '#9E9E9E',
}

const RANGE_OPTIONS = [
  { label: '오늘', value: 1 },
  { label: '7일', value: 7 },
  { label: '14일', value: 14 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
  { label: '전체', value: 0 },
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`
  return n.toLocaleString('ko-KR')
}

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? '#9E9E9E'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: color + '18', color }}
    >
      {category}
    </span>
  )
}

interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  icon: React.ElementType
  trend?: number
  trendLabel?: string
  accentColor?: string
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  accentColor = BRAND,
}: StatCardProps) {
  const TrendIcon =
    trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown
  const trendColor =
    trend === undefined || trend === 0
      ? 'text-gray-400'
      : trend > 0
        ? 'text-emerald-600'
        : 'text-red-500'

  return (
    <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
      <div className="h-1" style={{ backgroundColor: accentColor }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            <Icon size={18} style={{ color: accentColor }} strokeWidth={2} />
          </div>
        </div>
        <p className="text-3xl font-bold tabular-nums">{formatNumber(value)}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend !== undefined && trendLabel && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={13} strokeWidth={2.5} />
            <span>
              {trend > 0 ? '+' : ''}
              {trend}
              {trendLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-muted-foreground">
            {p.name}: <span className="font-bold text-foreground">{p.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

interface Props {
  initialData: WorldcupStats
}

export default function WorldcupClient({ initialData }: Props) {
  const [data, setData] = useState(initialData)
  const [range, setRange] = useState(30)
  const [loading, setLoading] = useState(false)

  async function handleRangeChange(days: number) {
    setRange(days)
    setLoading(true)
    try {
      const result = await fetchWorldcupStats(days)
      if (result.data) setData(result.data)
    } finally {
      setLoading(false)
    }
  }

  const rangeLabelShort = range === 0 ? '전체' : range === 1 ? '오늘' : `최근 ${range}일`

  const dailyChartData = data.dailyPlays.map((d) => ({
    date: formatDate(d.date),
    플레이수: d.count,
  }))

  const categoryChartData = data.categoryBreakdown.map((c) => ({
    name: c.category,
    플레이수: c.plays,
  }))

  const champChartData = data.topChampions.slice(0, 8).map((c) => ({
    name: c.champion_text.length > 16 ? c.champion_text.slice(0, 16) + '…' : c.champion_text,
    fullName: c.champion_text,
    category: c.category,
    count: c.count,
  }))

  return (
    <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">불호월드컵 대시보드</h1>
          <p className="text-xs text-muted-foreground mt-0.5">worldcup_results 기반 분석</p>
        </div>
        <div className="flex gap-1.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleRangeChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                range === opt.value
                  ? 'text-white border-transparent'
                  : 'bg-card text-muted-foreground border-border hover:border-foreground/30'
              }`}
              style={
                range === opt.value ? { backgroundColor: BRAND, borderColor: BRAND } : {}
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 설명 배너 */}
      <div className="bg-[#1E5C52]/5 border border-[#1E5C52]/15 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 size={16} className="text-[#1E5C52]" />
          <span className="font-semibold text-sm text-[#1E5C52]">
            불호월드컵 (example.com/worldcup)
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          카테고리별 16개 답변 중 가장 킹받는 것을 고르는 토너먼트 게임입니다.
          <strong className="text-foreground"> result_count</strong>는 동일 결과의 누적 횟수이며,
          <strong className="text-foreground"> 총 플레이 수</strong>는 이를 합산한 실제 게임 완료
          횟수입니다.
        </p>
      </div>

      <div className="space-y-6">
        {/* KPI - 리스트 */}
        <div className="bg-card rounded-xl shadow-sm border divide-y">
          {[
            { label: `${rangeLabelShort} 플레이`, value: data.rangePlays, icon: Calendar, color: BRAND },
            { label: '오늘 플레이', value: data.todayPlays, icon: TrendingUp, color: BRAND_LIGHT, sub: data.yesterdayPlays > 0 ? `어제 ${data.yesterdayPlays}회` : undefined },
            { label: '전체 게임 완료', value: data.totalPlays, icon: Gamepad2, color: '#3B7A6E' },
            { label: '고유 결과 수', value: data.totalRows, icon: Sparkles, color: BRAND_PALE },
          ].map(({ label, value, icon: Icon, color, sub }, idx) => (
            <div key={idx} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon size={16} style={{ color }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                </div>
              </div>
              <p className="text-lg font-bold tabular-nums">{formatNumber(value)}</p>
            </div>
          ))}
        </div>

        {/* 일별 플레이 추이 */}
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <h2 className="text-base font-semibold mb-1">
            {range === 1 ? '오늘 플레이 현황' : '일별 플레이 추이'}
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            {range === 1 ? '오늘 게임 완료 수' : `최근 ${range}일간 일별 게임 완료 수`}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wcPlayGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={BRAND} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#888' }}
                tickLine={false}
                axisLine={false}
                interval={Math.max(0, Math.floor(dailyChartData.length / 6))}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#888' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="플레이수"
                stroke={BRAND}
                strokeWidth={2}
                fill="url(#wcPlayGrad)"
                dot={false}
                activeDot={{ r: 4, fill: BRAND }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 카테고리별 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <h2 className="text-base font-semibold mb-1">카테고리별 플레이 수</h2>
            <p className="text-xs text-muted-foreground mb-5">어떤 카테고리가 가장 인기 있나요?</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={categoryChartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#555' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="플레이수" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        CATEGORY_COLORS[entry.name] ?? CHART_COLORS[index % CHART_COLORS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl shadow-sm border p-6">
            <h2 className="text-base font-semibold mb-1">카테고리 비율</h2>
            <p className="text-xs text-muted-foreground mb-5">전체 플레이 중 카테고리 점유율</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="플레이수"
                  nameKey="name"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        CATEGORY_COLORS[entry.name] ?? CHART_COLORS[index % CHART_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${Number(value).toLocaleString()}회`, name]}
                />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 챔피언 TOP 10 */}
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={16} className="text-amber-500" />
            <h2 className="text-base font-semibold">최종 우승 TOP 10</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            가장 많이 최종 우승한 불호 항목 (사람들이 가장 킹받는다고 선택한 것)
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={champChartData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#888' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#444' }}
                tickLine={false}
                axisLine={false}
                width={130}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as (typeof champChartData)[0]
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3 text-xs max-w-xs">
                        <p className="font-semibold mb-1">{d.fullName}</p>
                        <p className="text-muted-foreground">
                          우승 횟수: <span className="font-bold">{d.count}회</span>
                        </p>
                        <p className="text-muted-foreground mt-0.5">카테고리: {d.category}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="count" fill={BRAND} radius={[0, 4, 4, 0]} maxBarSize={20}>
                {champChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      CATEGORY_COLORS[entry.category] ??
                      CHART_COLORS[index % CHART_COLORS.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 퍼스널리티 타입 분포 */}
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-[#1E5C52]" />
            <h2 className="text-base font-semibold">퍼스널리티 타입 분포</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            게임 결과로 부여된 성격 유형 — 어떤 유형이 가장 많이 나왔나요?
          </p>
          <div className="space-y-3">
            {data.topPersonalities.map((p, i) => {
              const total = data.totalPlays || 1
              const pct = Math.round((p.count / total) * 100)
              return (
                <div key={p.personality_type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      {p.personality_emoji && <span>{p.personality_emoji}</span>}
                      {p.personality_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.count.toLocaleString()}회 ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 최근 결과 테이블 */}
        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-base font-semibold">최근 게임 결과</h2>
            <p className="text-xs text-muted-foreground mt-0.5">최근 20개 결과 기록</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-xs">
                  <th className="text-left px-6 py-3 font-medium">카테고리</th>
                  <th className="text-left px-6 py-3 font-medium">최종 우승</th>
                  <th className="text-left px-6 py-3 font-medium">퍼스널리티</th>
                  <th className="text-left px-6 py-3 font-medium">횟수</th>
                  <th className="text-left px-6 py-3 font-medium">날짜</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.recentResults.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3">
                      <CategoryBadge category={r.category} />
                    </td>
                    <td className="px-6 py-3 font-medium text-xs max-w-[200px]">
                      <span className="line-clamp-2">{r.champion_text}</span>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">
                      {r.personality_emoji && <span className="mr-1">{r.personality_emoji}</span>}
                      {r.personality_type}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#1E5C52]/10 text-[#1E5C52]">
                        {r.result_count}회
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground" suppressHydrationWarning>
                      {new Date(r.created_at).toLocaleDateString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
                {data.recentResults.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                      월드컵 결과 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
