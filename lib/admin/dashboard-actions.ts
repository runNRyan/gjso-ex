'use server'

import { createClient } from '@/lib/supabase/server'

export interface DailyCount {
  date: string
  count: number
}

export interface DailyDau {
  date: string
  dau: number
}

export interface ProviderCount {
  provider: string
  count: number
}

export interface RecentUser {
  id: string
  nickname: string | null
  email: string | null
  provider: string | null
  user_type: string | null
  created_at: string | null
}

export interface DashboardStats {
  totalUsers: number
  totalVotes: number
  totalQuestions: number
  todaySignups: number
  todayVotes: number
  weeklySignups: number
  weeklyVotes: number
  yesterdaySignups: number
  yesterdayVotes: number
  providerBreakdown: ProviderCount[]
  dailySignups: DailyCount[]
  dailyVotes: DailyCount[]
  dailyDau: DailyDau[]
  recentUsers: RecentUser[]
  avgVotesPerUser: number
}

export interface DashboardResult {
  error: string | null
  data?: DashboardStats
}

export async function fetchDashboardStats(
  rangeDays: number = 7,
  includeDummy: boolean = true
): Promise<DashboardResult> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_dashboard_stats', {
    p_range_days: rangeDays,
    p_include_dummy: includeDummy,
  })

  if (error) return { error: (error as { message: string }).message }

  const result = data as Record<string, unknown>

  if (result.error) return { error: result.error as string }

  return {
    error: null,
    data: {
      totalUsers: (result.totalUsers as number) ?? 0,
      totalVotes: (result.totalVotes as number) ?? 0,
      totalQuestions: (result.totalQuestions as number) ?? 0,
      todaySignups: (result.todaySignups as number) ?? 0,
      todayVotes: (result.todayVotes as number) ?? 0,
      weeklySignups: (result.weeklySignups as number) ?? 0,
      weeklyVotes: (result.weeklyVotes as number) ?? 0,
      yesterdaySignups: (result.yesterdaySignups as number) ?? 0,
      yesterdayVotes: (result.yesterdayVotes as number) ?? 0,
      providerBreakdown: (result.providerBreakdown as ProviderCount[]) ?? [],
      dailySignups: (result.dailySignups as DailyCount[]) ?? [],
      dailyVotes: (result.dailyVotes as DailyCount[]) ?? [],
      dailyDau: (result.dailyDau as DailyDau[]) ?? [],
      recentUsers: (result.recentUsers as RecentUser[]) ?? [],
      avgVotesPerUser: (result.avgVotesPerUser as number) ?? 0,
    },
  }
}
