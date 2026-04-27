'use server'

import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.', supabase: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (!profile || profile.user_type !== 'admin') {
    return { error: '관리자 권한이 필요합니다.', supabase: null }
  }
  return { error: null, supabase }
}

export interface CategoryBreakdown {
  category: string
  plays: number
  rows: number
}

export interface ChampionRanking {
  champion_text: string
  category: string
  count: number
}

export interface PersonalityRanking {
  personality_type: string
  personality_emoji: string
  count: number
}

export interface WorldcupResultRow {
  id: string
  category: string
  champion_text: string
  personality_type: string
  personality_emoji: string
  result_count: number
  created_at: string
}

export interface DailyCount {
  date: string
  count: number
}

export interface WorldcupStats {
  totalPlays: number
  totalRows: number
  todayPlays: number
  yesterdayPlays: number
  rangePlays: number
  categoryBreakdown: CategoryBreakdown[]
  topChampions: ChampionRanking[]
  topPersonalities: PersonalityRanking[]
  dailyPlays: DailyCount[]
  recentResults: WorldcupResultRow[]
}

export async function fetchWorldcupStats(
  rangeDays: number = 30
): Promise<{ error: string | null; data?: WorldcupStats }> {
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return { error: error ?? '인증 오류' }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const rangeStart = new Date(today)
  // rangeDays=1이면 오늘 0시부터, rangeDays=7이면 7일 전 0시부터
  rangeStart.setDate(rangeStart.getDate() - (rangeDays > 0 ? rangeDays - 1 : 3650))

  const { data: allData, error: fetchError } = await supabase
    .from('worldcup_results')
    .select(
      'id,category,champion_text,personality_type,personality_emoji,result_count,created_at'
    )
    .order('created_at', { ascending: false })
    .limit(2000)

  if (fetchError) return { error: fetchError.message }

  const rows = allData ?? []
  const todayStr = today.toISOString().slice(0, 10)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)
  const rangeStartIso = rangeStart.toISOString()

  let totalPlays = 0
  let todayPlays = 0
  let yesterdayPlays = 0
  let rangePlays = 0
  const catMap = new Map<string, { plays: number; rows: number }>()
  const champMap = new Map<string, { count: number; category: string }>()
  const ptMap = new Map<string, { count: number; emoji: string }>()
  const dailyMap = new Map<string, number>()

  for (const r of rows) {
    if (!r.created_at) continue
    const cnt = r.result_count ?? 1
    const date = r.created_at.slice(0, 10)
    totalPlays += cnt

    if (date === todayStr) todayPlays += cnt
    if (date === yesterdayStr) yesterdayPlays += cnt
    if (r.created_at >= rangeStartIso) {
      rangePlays += cnt
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + cnt)
    }

    const cat = r.category || '기타'
    const catEx = catMap.get(cat) ?? { plays: 0, rows: 0 }
    catMap.set(cat, { plays: catEx.plays + cnt, rows: catEx.rows + 1 })

    const champKey = r.champion_text || '알 수 없음'
    const champEx = champMap.get(champKey) ?? { count: 0, category: r.category }
    champMap.set(champKey, { count: champEx.count + cnt, category: r.category })

    const ptKey = r.personality_type || '알 수 없음'
    const ptEx = ptMap.get(ptKey) ?? { count: 0, emoji: r.personality_emoji || '' }
    ptMap.set(ptKey, {
      count: ptEx.count + cnt,
      emoji: r.personality_emoji || ptEx.emoji,
    })
  }

  const dailyPlays: DailyCount[] = []
  if (rangeDays === 0) {
    // 전체: dailyMap의 실제 데이터를 날짜순 정렬
    Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, count]) => dailyPlays.push({ date, count }))
  } else {
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      dailyPlays.push({ date: dateStr, count: dailyMap.get(dateStr) ?? 0 })
    }
  }

  const { data: recentData } = await supabase
    .from('worldcup_results')
    .select(
      'id,category,champion_text,personality_type,personality_emoji,result_count,created_at'
    )
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    error: null,
    data: {
      totalPlays,
      totalRows: rows.length,
      todayPlays,
      yesterdayPlays,
      rangePlays,
      categoryBreakdown: Array.from(catMap.entries())
        .map(([category, v]) => ({ category, ...v }))
        .sort((a, b) => b.plays - a.plays),
      topChampions: Array.from(champMap.entries())
        .map(([champion_text, v]) => ({ champion_text, ...v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topPersonalities: Array.from(ptMap.entries())
        .map(([personality_type, v]) => ({
          personality_type,
          personality_emoji: v.emoji,
          count: v.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      dailyPlays,
      recentResults: (recentData ?? []).map((r) => ({
        id: r.id as string,
        category: r.category as string,
        champion_text: r.champion_text as string,
        personality_type: r.personality_type as string,
        personality_emoji: r.personality_emoji as string,
        result_count: r.result_count as number,
        created_at: r.created_at as string,
      })),
    },
  }
}
