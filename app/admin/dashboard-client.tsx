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
  Users,
  Vote,
  UserPlus,
  Activity,
  BarChart3,
  HelpCircle,
  Eye,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchDashboardStats } from '@/lib/admin/dashboard-actions'
import type { DashboardStats } from '@/lib/admin/dashboard-actions'

const BRAND = '#1E5C52'
const BRAND_LIGHT = '#2D8A7A'
const BRAND_PALE = '#4A9B8E'
const COLORS = [BRAND, BRAND_LIGHT, BRAND_PALE, '#6BB5A8', '#8DCAC0', '#B0DDD8']

const RANGE_OPTIONS = [
  { label: '오늘', value: 1 },
  { label: '7일', value: 7 },
  { label: '14일', value: 14 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
  { label: '전체', value: 0 },
]

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  kakao: '카카오',
  naver: '네이버',
  email: '이메일',
  unknown: '기타',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`
  return n.toLocaleString('ko-KR')
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'short', day: 'numeric' })
}

// ─── Reusable components ─────────────────────────────────────

interface StatCardProps {
  title: string
  value: number | string
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
        <p className="text-3xl font-bold tabular-nums">
          {typeof value === 'number' ? formatNumber(value) : value}
        </p>
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

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
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

function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    google: 'bg-blue-50 text-blue-700',
    email: 'bg-gray-100 text-gray-600',
    kakao: 'bg-yellow-50 text-yellow-700',
    naver: 'bg-green-50 text-green-700',
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        colors[provider] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {PROVIDER_LABEL[provider] ?? provider}
    </span>
  )
}

function UserTypeBadge({ type }: { type: string }) {
  if (type === 'admin') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1E5C52]/10 text-[#1E5C52]">
        관리자
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      일반
    </span>
  )
}

// ─── Main component ──────────────────────────────────────────

interface Props {
  initialData: DashboardStats
}

export default function DashboardClient({ initialData }: Props) {
  const [data, setData] = useState<DashboardStats>(initialData)
  const [range, setRange] = useState(7)
  const [loading, setLoading] = useState(false)
  const [includeDummy, setIncludeDummy] = useState(true)

  async function fetchData(days: number, dummy: boolean) {
    setLoading(true)
    try {
      const result = await fetchDashboardStats(days, dummy)
      if (result.data) setData(result.data)
    } finally {
      setLoading(false)
    }
  }

  function handleRangeChange(days: number) {
    setRange(days)
    fetchData(days, includeDummy)
  }

  function handleDummyToggle() {
    const next = !includeDummy
    setIncludeDummy(next)
    fetchData(range, next)
  }

  const rangeLabelShort = range === 0 ? '전체' : range === 1 ? '오늘' : `최근 ${range}일`

  // 선택 기간 합계 (차트 데이터에서 계산)
  const rangeSignups = data.dailySignups.reduce((s, d) => s + d.count, 0)
  const rangeVotes = data.dailyVotes.reduce((s, d) => s + d.count, 0)
  const rangeDau = data.dailyDau.length > 0
    ? Math.round(data.dailyDau.reduce((s, d) => s + d.dau, 0) / data.dailyDau.length)
    : 0

  const signupChartData = data.dailySignups.map((d) => ({
    date: formatDate(d.date),
    회원가입: d.count,
  }))
  const voteChartData = data.dailyVotes.map((d) => ({
    date: formatDate(d.date),
    투표수: d.count,
  }))
  const dauChartData = data.dailyDau.map((d) => ({
    date: formatDate(d.date),
    활성사용자: d.dau,
  }))
  const pieData = data.providerBreakdown.map((p) => ({
    name: PROVIDER_LABEL[p.provider] ?? p.provider,
    value: p.count,
  }))

  // Combined chart data for signup vs votes overlay
  const overlayChartData = signupChartData.map((s, i) => ({
    date: s.date,
    회원가입: s.회원가입,
    투표수: voteChartData[i]?.투표수 ?? 0,
  }))

  return (
    <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
      {/* Header */}
      <h1 className="text-xl font-bold mb-4">대시보드</h1>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-0.5 bg-muted rounded-lg p-0.5 sm:gap-1 sm:p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleRangeChange(opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                range === opt.value
                  ? 'bg-white text-[#1E5C52] shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
            ))}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <TabsList>
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="visitors">방문자</TabsTrigger>
            <TabsTrigger value="signups">회원가입</TabsTrigger>
            <TabsTrigger value="votes">투표</TabsTrigger>
          </TabsList>
          <button
            onClick={handleDummyToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all duration-200 ${
              includeDummy
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'bg-[#1E5C52]/8 border-[#1E5C52]/30 text-[#1E5C52] hover:bg-[#1E5C52]/15'
            }`}
          >
            <FlaskConical size={12} strokeWidth={2} />
            <span className="sm:hidden">Dummy</span>
            <span className="hidden sm:inline">{includeDummy ? 'Dummy 포함' : 'Dummy 제외'}</span>
            <span
              className={`inline-block w-8 h-4 rounded-full relative transition-colors duration-200 ${
                includeDummy ? 'bg-[#1E5C52]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${
                  includeDummy ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </span>
          </button>
        </div>

        {/* ─── 개요 ─── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={`${rangeLabelShort} 가입`}
              value={rangeSignups}
              subtitle={`${rangeLabelShort} 신규 가입자`}
              icon={UserPlus}
              trend={data.todaySignups}
              trendLabel=" 명 (오늘)"
              accentColor={BRAND}
            />
            <StatCard
              title={`${rangeLabelShort} 투표`}
              value={rangeVotes}
              subtitle={`${rangeLabelShort} 투표 수`}
              icon={Vote}
              trend={data.todayVotes}
              trendLabel=" 건 (오늘)"
              accentColor={BRAND_LIGHT}
            />
            <StatCard
              title="전체 회원 수"
              value={data.totalUsers}
              subtitle="누적 가입자"
              icon={Users}
              accentColor="#3B7A6E"
            />
            <StatCard
              title={`평균 DAU`}
              value={rangeDau}
              subtitle={`${rangeLabelShort} 일평균 활성 사용자`}
              icon={Activity}
              accentColor={BRAND_PALE}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="일별 회원가입" description={`${rangeLabelShort} 신규 가입자`}>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart
                  data={signupChartData}
                  margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="ovSignup" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={BRAND} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#aaa' }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(0, Math.floor(signupChartData.length / 5))}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#aaa' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="회원가입"
                    stroke={BRAND}
                    strokeWidth={2}
                    fill="url(#ovSignup)"
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="일별 투표 활동" description={`${rangeLabelShort} 투표 수`}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={voteChartData}
                  margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#aaa' }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(0, Math.floor(voteChartData.length / 5))}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#aaa' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="투표수" fill={BRAND_LIGHT} radius={[3, 3, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>

        {/* ─── 방문자 ─── */}
        <TabsContent value="visitors" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="오늘 활성 사용자"
              value={data.dailyDau.at(-1)?.dau ?? 0}
              subtitle="투표 참여 순 사용자 (DAU)"
              icon={Eye}
              accentColor={BRAND}
            />
            <StatCard
              title={`${rangeLabelShort} 활성 사용자`}
              value={
                data.dailyDau.length > 0
                  ? new Set(data.dailyDau.flatMap(() => [])).size || // use sum as proxy
                    data.dailyDau.reduce((s, d) => s + d.dau, 0)
                  : 0
              }
              subtitle="기간 내 순 투표 사용자"
              icon={Users}
              accentColor={BRAND_LIGHT}
            />
            <StatCard
              title="평균 투표 수/사용자"
              value={data.avgVotesPerUser}
              subtitle="기간 내 1인당 평균 투표"
              icon={Activity}
              accentColor="#3B7A6E"
            />
            <StatCard
              title="전체 질문 수"
              value={data.totalQuestions}
              subtitle="누적 등록 질문"
              icon={HelpCircle}
              accentColor={BRAND_PALE}
            />
          </div>

          {/* 지표 정의 안내 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-amber-800 mb-1">지표 정의</p>
            <ul className="text-amber-700 space-y-1 text-xs leading-relaxed">
              <li>
                <strong>활성 사용자(DAU)</strong>: 해당 기간 내 최소 1회 이상 투표를 완료한 순
                사용자 수. 방문자 수의 proxy 지표로 사용합니다.
              </li>
              <li>
                <strong>평균 투표 수/사용자</strong>: 기간 내 총 투표 수 / 순 투표 사용자 수.
                사용자의 서비스 참여 깊이(체류 시간 proxy)를 나타냅니다.
              </li>
            </ul>
          </div>

          <ChartCard title="일별 활성 사용자 (DAU)" description={`${rangeLabelShort} 투표 참여 순 사용자 수`}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dauChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
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
                  interval={Math.max(0, Math.floor(dauChartData.length / 6))}
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
                  dataKey="활성사용자"
                  stroke={BRAND}
                  strokeWidth={2}
                  fill="url(#dauGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: BRAND }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 유입경로 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="유입경로별 회원 분포" description="가입 시 사용한 인증 방법 기준">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString()}명`, '회원 수']}
                  />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="유입경로 상세" description="가입 방법별 회원 수 및 비율">
              <div className="space-y-3">
                {data.providerBreakdown.map((p, i) => {
                  const total = data.totalUsers || 1
                  const pct = Math.round((p.count / total) * 100)
                  return (
                    <div key={p.provider}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {PROVIDER_LABEL[p.provider] ?? p.provider}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.count.toLocaleString()}명 ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        {/* ─── 회원가입 ─── */}
        <TabsContent value="signups" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="전체 회원 수"
              value={data.totalUsers}
              subtitle="누적 가입자"
              icon={Users}
              trend={data.weeklySignups}
              trendLabel=" 명 (7일 신규)"
              accentColor={BRAND}
            />
            <StatCard
              title="오늘 신규 가입"
              value={data.todaySignups}
              subtitle="오늘 가입한 회원"
              icon={UserPlus}
              trend={data.todaySignups - data.yesterdaySignups}
              trendLabel={` 명 (전일 ${data.yesterdaySignups}명 대비)`}
              accentColor={BRAND_LIGHT}
            />
            <StatCard
              title={`${rangeLabelShort} 신규 가입`}
              value={data.weeklySignups}
              subtitle="기간 내 신규 가입자"
              icon={UserPlus}
              accentColor={BRAND_PALE}
            />
          </div>

          <ChartCard
            title={range === 1 ? '오늘 회원가입' : '일별 회원가입 추이'}
            description={
              range === 1 ? '오늘 신규 가입자 수' : `최근 ${range}일간 신규 가입자 수`
            }
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={signupChartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="signupGrad2" x1="0" y1="0" x2="0" y2="1">
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
                  interval={Math.max(0, Math.floor(signupChartData.length / 6))}
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
                  dataKey="회원가입"
                  stroke={BRAND}
                  strokeWidth={2}
                  fill="url(#signupGrad2)"
                  dot={false}
                  activeDot={{ r: 4, fill: BRAND }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 최근 가입자 테이블 */}
          <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-base font-semibold">최근 가입자</h2>
              <p className="text-xs text-muted-foreground mt-0.5">최근 가입한 회원 100명</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground text-xs">
                    <th className="text-left px-6 py-3 font-medium">닉네임</th>
                    <th className="text-left px-6 py-3 font-medium">이메일</th>
                    <th className="text-left px-6 py-3 font-medium">가입 방법</th>
                    <th className="text-left px-6 py-3 font-medium">유형</th>
                    <th className="text-left px-6 py-3 font-medium">가입일</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 font-medium">{user.nickname || '—'}</td>
                      <td className="px-6 py-3 text-muted-foreground text-xs">
                        {user.email ?? '—'}
                      </td>
                      <td className="px-6 py-3">
                        <ProviderBadge provider={user.provider ?? 'unknown'} />
                      </td>
                      <td className="px-6 py-3">
                        <UserTypeBadge type={user.user_type ?? 'normal'} />
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-xs">
                        <span suppressHydrationWarning>
                          {user.created_at ? formatRelativeTime(user.created_at) : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.recentUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-muted-foreground text-sm"
                      >
                        회원 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ─── 투표 ─── */}
        <TabsContent value="votes" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="전체 투표 수"
              value={data.totalVotes}
              subtitle="누적 투표 기록"
              icon={Vote}
              trend={data.weeklyVotes}
              trendLabel=" 건 (7일 신규)"
              accentColor={BRAND}
            />
            <StatCard
              title="오늘 투표 수"
              value={data.todayVotes}
              subtitle="오늘 발생한 투표"
              icon={Activity}
              trend={data.todayVotes - data.yesterdayVotes}
              trendLabel={` 건 (전일 ${data.yesterdayVotes}건 대비)`}
              accentColor={BRAND_LIGHT}
            />
            <StatCard
              title={`${rangeLabelShort} 투표 수`}
              value={data.weeklyVotes}
              subtitle="기간 내 총 투표"
              icon={BarChart3}
              accentColor="#3B7A6E"
            />
            <StatCard
              title="전체 질문 수"
              value={data.totalQuestions}
              subtitle="누적 등록 질문"
              icon={HelpCircle}
              accentColor={BRAND_PALE}
            />
          </div>

          <ChartCard
            title={range === 1 ? '오늘 투표 활동' : '일별 투표 활동'}
            description={range === 1 ? '오늘 투표 수' : `최근 ${range}일간 일별 투표 수`}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={voteChartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#888' }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.floor(voteChartData.length / 6))}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="투표수" fill={BRAND_LIGHT} radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 회원가입 vs 투표 트렌드 오버레이 */}
          <ChartCard title="회원가입 vs 투표 트렌드" description="두 지표의 상관관계 분석">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={overlayChartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trendSignup" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="trendVote" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_LIGHT} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={BRAND_LIGHT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#888' }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.floor(overlayChartData.length / 6))}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="회원가입"
                  stroke={BRAND}
                  strokeWidth={2}
                  fill="url(#trendSignup)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="투표수"
                  stroke={BRAND_LIGHT}
                  strokeWidth={2}
                  fill="url(#trendVote)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
