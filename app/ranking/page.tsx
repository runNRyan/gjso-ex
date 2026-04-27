import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Crown, Medal } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { RankingTabs, type Period } from './ranking-tabs'

export const metadata: Metadata = {
  title: '랭킹 | 결정소',
  description: '결정소 예측왕 랭킹을 확인해보세요.',
  openGraph: {
    title: '랭킹 | 결정소',
    description: '결정소 예측왕 랭킹을 확인해보세요.',
    type: 'website',
    siteName: '결정소',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: '결정소 랭킹' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '랭킹 | 결정소',
    description: '결정소 예측왕 랭킹을 확인해보세요.',
    images: ['/og-default.png'],
  },
}

type RankingEntry = {
  id: string
  nickname: string
  points: number
  isMock?: boolean
}

// Mock 데이터 - 사용자 수가 적을 때 랭킹을 채우기 위한 가상 프로필
const MOCK_PROFILES: Omit<RankingEntry, 'points'>[] = [
  { id: 'mock-1', nickname: '예측의신', isMock: true },
  { id: 'mock-2', nickname: '결정장인', isMock: true },
  { id: 'mock-3', nickname: '황금직감', isMock: true },
  { id: 'mock-4', nickname: '데이터분석가', isMock: true },
  { id: 'mock-5', nickname: '트렌드헌터', isMock: true },
  { id: 'mock-6', nickname: '감각투자자', isMock: true },
  { id: 'mock-7', nickname: '미래예언자', isMock: true },
  { id: 'mock-8', nickname: '확률마스터', isMock: true },
  { id: 'mock-9', nickname: '통계왕', isMock: true },
  { id: 'mock-10', nickname: '분석초보', isMock: true },
]

function getStartDate(period: Period): Date | null {
  const now = new Date()
  if (period === 'today') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return start
  }
  if (period === 'week') {
    const start = new Date(now)
    const day = start.getDay()
    // 월요일 기준 이번주 시작
    const diff = day === 0 ? 6 : day - 1
    start.setDate(start.getDate() - diff)
    start.setHours(0, 0, 0, 0)
    return start
  }
  return null
}

function getPeriodLabel(period: Period): string {
  if (period === 'today') return '오늘의'
  if (period === 'week') return '이번주'
  return '전체'
}

function getPointsLabel(period: Period): string {
  if (period === 'all') return '보유 포인트'
  return '획득 포인트'
}

function generateMockPoints(realEntries: RankingEntry[]): RankingEntry[] {
  // 실제 사용자 데이터의 최저 포인트를 기준으로 mock 포인트 생성
  const minReal = realEntries.length > 0
    ? Math.min(...realEntries.map(e => e.points))
    : 1000

  const needed = Math.max(0, 10 - realEntries.length)
  const mockEntries: RankingEntry[] = []

  for (let i = 0; i < needed && i < MOCK_PROFILES.length; i++) {
    const profile = MOCK_PROFILES[i]
    // mock 포인트는 실제 최저보다 낮게 설정
    const points = Math.max(10, Math.floor(minReal * (0.9 - i * 0.08)))
    mockEntries.push({ ...profile, points })
  }

  return mockEntries
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
  return null
}

function getRankBadgeClass(rank: number) {
  if (rank === 1) return 'bg-yellow-500 text-white'
  if (rank === 2) return 'bg-gray-400 text-white'
  if (rank === 3) return 'bg-amber-600 text-white'
  return 'bg-muted text-muted-foreground'
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const params = await searchParams
  const period: Period = (['today', 'week', 'all'].includes(params.period || '')
    ? params.period as Period
    : 'all')

  const supabase = await createClient()

  // getUser와 랭킹 데이터를 병렬로 가져오기
  const userPromise = supabase.auth.getUser()

  let rankingsPromise: Promise<{ rankings: RankingEntry[]; totalUserCount: number }>

  if (period === 'all') {
    rankingsPromise = Promise.all([
      supabase
        .from('public_profiles')
        .select('id, nickname, point_balance')
        .order('point_balance', { ascending: false })
        .limit(100),
      supabase
        .from('public_profiles')
        .select('*', { count: 'exact', head: true }),
    ]).then(([{ data: profileRankings }, { count }]) => ({
      rankings: (profileRankings || []).filter(p => p.id && p.nickname).map(p => ({
        id: p.id!,
        nickname: p.nickname!,
        points: p.point_balance ?? 0,
      })),
      totalUserCount: count || 0,
    }))
  } else {
    const startDate = getStartDate(period)!
    rankingsPromise = Promise.all([
      supabase.rpc('get_period_rankings', { start_date: startDate.toISOString() }),
      supabase.rpc('get_period_user_count', { start_date: startDate.toISOString() }),
    ]).then(([{ data: periodRankings }, { data: periodCount }]) => ({
      rankings: (periodRankings || []).map((r: { user_id: string; nickname: string; total_points: number }) => ({
        id: r.user_id,
        nickname: r.nickname,
        points: r.total_points,
      })),
      totalUserCount: typeof periodCount === 'number' ? periodCount : 0,
    }))
  }

  const [{ data: { user } }, { rankings: fetchedRankings, totalUserCount }] = await Promise.all([
    userPromise,
    rankingsPromise,
  ])

  // Mock 데이터로 패딩 (실제 사용자 < 10명일 때)
  let rankings = fetchedRankings
  if (rankings.length < 10) {
    const mockEntries = generateMockPoints(rankings)
    rankings = [...rankings, ...mockEntries]
  }

  // 내 순위 및 퍼센타일 계산
  let myRank = 0
  let myPoints = 0
  let myNickname: string | null = null
  let percentile = 0

  if (user) {
    if (period === 'all') {
      // 랭킹 데이터에서 내 정보를 먼저 찾기
      const myEntry = fetchedRankings.find(r => r.id === user.id)
      if (myEntry) {
        myNickname = myEntry.nickname
        myPoints = myEntry.points

        const { count: higherRankedCount } = await supabase
          .from('public_profiles')
          .select('*', { count: 'exact', head: true })
          .gt('point_balance', myPoints)

        myRank = (higherRankedCount || 0) + 1
      } else {
        // TOP 100 밖인 경우
        const { data } = await supabase
          .from('public_profiles')
          .select('nickname, point_balance')
          .eq('id', user.id)
          .single()
        if (data) {
          myNickname = data.nickname
          myPoints = data.point_balance ?? 0

          const { count: higherRankedCount } = await supabase
            .from('public_profiles')
            .select('*', { count: 'exact', head: true })
            .gt('point_balance', myPoints)

          myRank = (higherRankedCount || 0) + 1
        }
      }
    } else {
      // 기간별에서 내 순위 찾기
      const myIdx = fetchedRankings.findIndex(r => r.id === user.id)
      if (myIdx !== -1) {
        myRank = myIdx + 1
        myPoints = fetchedRankings[myIdx].points
        myNickname = fetchedRankings[myIdx].nickname
      } else {
        // 순위권 밖이지만 닉네임은 표시
        const { data } = await supabase
          .from('public_profiles')
          .select('nickname')
          .eq('id', user.id)
          .single()
        if (data) {
          myNickname = data.nickname
          myPoints = 0
          myRank = totalUserCount > 0 ? totalUserCount : 0
        }
      }
    }

    // 상위 N% 계산 (실제 사용자 수 기준)
    if (myRank > 0 && totalUserCount > 0) {
      percentile = Math.ceil((myRank / totalUserCount) * 100)
    }
  }

  const periodLabel = getPeriodLabel(period)
  const pointsLabel = getPointsLabel(period)

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">랭킹</h1>

      <div className="mb-6">
        <RankingTabs current={period} />
      </div>

      <div className="space-y-6">
        {/* My Rank Card */}
        {myNickname && (
          <div className="border rounded-lg p-6 bg-accent/50">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              내 순위
            </h2>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary shrink-0">
                    {myRank > 0 ? `#${myRank}` : '-'}
                  </span>
                  {percentile > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary shrink-0">
                      상위 {percentile}%
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground truncate">{myNickname}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold">{myPoints.toLocaleString()}P</div>
                <div className="text-xs text-muted-foreground">{pointsLabel}</div>
              </div>
            </div>
          </div>
        )}

        {/* Top 100 List */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{periodLabel} TOP 100</h2>
          <div className="space-y-2">
            {rankings && rankings.length > 0 ? (
              rankings.map((entry, index) => {
                const rank = index + 1
                const isMe = user ? entry.id === user.id : false

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isMe
                        ? 'bg-primary/10 border border-primary'
                        : entry.isMock
                          ? 'opacity-50'
                          : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[60px]">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${getRankBadgeClass(
                            rank
                          )}`}
                        >
                          #{rank}
                        </span>
                        {getRankIcon(rank)}
                      </div>
                      <div className={`font-medium ${isMe ? 'text-primary' : ''}`}>
                        {entry.nickname}
                        {isMe && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (나)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{entry.points}P</div>
                    </div>
                  </div>
                )
              })
            ) : (
              <EmptyState
                icon={Trophy}
                title="랭킹 정보가 없습니다"
                action={{ label: "투표하러 가기", href: "/" }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
