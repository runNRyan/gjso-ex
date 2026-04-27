import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface GuestVote {
  questionId: string
  choice: 'a' | 'b'
  timestamp: number
}

interface GuestPrediction {
  questionId: string
  predictionType: 'a' | 'b' | 'golden'
  timestamp: number
}

interface MigrateRequest {
  guestActivity: {
    votes: GuestVote[]
    predictions: GuestPrediction[]
  }
}

const MAX_MIGRATION_POINTS = 500

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다' }, { status: 401 })
    }

    // Check if already migrated (one-time only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('guest_migrated')
      .eq('id', user.id)
      .single()

    if (profile?.guest_migrated) {
      return NextResponse.json({ success: false, error: '이미 마이그레이션을 완료했습니다' }, { status: 409 })
    }

    const body: MigrateRequest = await request.json()
    const { guestActivity } = body

    if (!guestActivity?.votes && !guestActivity?.predictions) {
      return NextResponse.json({ success: false, error: '마이그레이션할 데이터가 없습니다' }, { status: 400 })
    }

    const now = Date.now()
    let migratedVotes = 0
    let migratedPredictions = 0
    let pointsAwarded = 0

    // Process votes
    if (guestActivity.votes?.length) {
      const questionIds = guestActivity.votes.map(v => v.questionId)

      // Validate question IDs exist
      const { data: validQuestions } = await supabase
        .from('questions')
        .select('id')
        .in('id', questionIds)

      const validIds = new Set(validQuestions?.map(q => q.id) || [])

      // Check existing votes
      const { data: existingVotes } = await supabase
        .from('votes')
        .select('question_id')
        .eq('user_id', user.id)
        .in('question_id', questionIds)

      const alreadyVoted = new Set(existingVotes?.map(v => v.question_id) || [])

      for (const vote of guestActivity.votes) {
        if (pointsAwarded >= MAX_MIGRATION_POINTS) break
        if (!validIds.has(vote.questionId)) continue
        if (alreadyVoted.has(vote.questionId)) continue
        if (vote.timestamp > now) continue

        const { error } = await supabase
          .from('votes')
          .insert({
            question_id: vote.questionId,
            user_id: user.id,
            choice: vote.choice,
          })

        if (!error) {
          migratedVotes++
          pointsAwarded += 10
        }
      }
    }

    // Process predictions
    if (guestActivity.predictions?.length && pointsAwarded < MAX_MIGRATION_POINTS) {
      const questionIds = guestActivity.predictions.map(p => p.questionId)

      const { data: validQuestions } = await supabase
        .from('questions')
        .select('id')
        .in('id', questionIds)

      const validIds = new Set(validQuestions?.map(q => q.id) || [])

      // Check existing predictions
      const { data: existingPredictions } = await supabase
        .from('predictions')
        .select('question_id')
        .eq('user_id', user.id)
        .in('question_id', questionIds)

      const alreadyPredicted = new Set(existingPredictions?.map(p => p.question_id) || [])

      // Check that user has voted on the question (either migrated or existing)
      const { data: userVotes } = await supabase
        .from('votes')
        .select('question_id')
        .eq('user_id', user.id)
        .in('question_id', questionIds)

      const hasVoted = new Set(userVotes?.map(v => v.question_id) || [])

      for (const pred of guestActivity.predictions) {
        if (pointsAwarded >= MAX_MIGRATION_POINTS) break
        if (!validIds.has(pred.questionId)) continue
        if (alreadyPredicted.has(pred.questionId)) continue
        if (!hasVoted.has(pred.questionId)) continue
        if (pred.timestamp > now) continue

        const predPoints = pred.predictionType === 'golden' ? 1000 : 100
        // Cap: don't exceed max
        if (pointsAwarded + predPoints > MAX_MIGRATION_POINTS) continue

        const { error } = await supabase
          .from('predictions')
          .insert({
            question_id: pred.questionId,
            user_id: user.id,
            prediction: pred.predictionType,
          })

        if (!error) {
          migratedPredictions++
          pointsAwarded += predPoints
        }
      }
    }

    // Cap final points (safety net)
    pointsAwarded = Math.min(pointsAwarded, MAX_MIGRATION_POINTS)

    // Award points
    if (pointsAwarded > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('point_balance')
        .eq('id', user.id)
        .single()

      await supabase
        .from('profiles')
        .update({ point_balance: (profile?.point_balance ?? 0) + pointsAwarded })
        .eq('id', user.id)

      // Record in point_history
      if (migratedVotes > 0) {
        await supabase
          .from('point_history')
          .insert({
            user_id: user.id,
            amount: Math.min(migratedVotes * 10, pointsAwarded),
            type: 'vote_bonus' as const,
          })
      }
      if (migratedPredictions > 0) {
        await supabase
          .from('point_history')
          .insert({
            user_id: user.id,
            amount: pointsAwarded - Math.min(migratedVotes * 10, pointsAwarded),
            type: 'prediction_reward' as const,
          })
      }
    }

    // Mark as migrated (one-time flag)
    await supabase
      .from('profiles')
      .update({ guest_migrated: true })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      migratedVotes,
      migratedPredictions,
      pointsAwarded,
    })
  } catch (error) {
    console.error('Guest migration error:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
