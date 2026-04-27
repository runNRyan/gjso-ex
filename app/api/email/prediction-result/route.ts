import { getResend, EMAIL_FROM } from '@/lib/resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Supabase admin client (bypasses RLS)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/email/prediction-result
// Supabase Database Webhook 또는 cron에서 호출
// Body: { question_id: string }
export async function POST(request: NextRequest) {
  try {
    // 간단한 API 키 인증
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.RESEND_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { question_id } = await request.json()

    if (!question_id) {
      return NextResponse.json(
        { error: 'question_id is required' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // 질문 정보 가져오기
    const { data: question, error: qError } = await supabase
      .from('questions')
      .select('id, title, option_a, option_b, balance_type')
      .eq('id', question_id)
      .single()

    if (qError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // 해당 질문의 예측 결과 + 유저 이메일 가져오기
    const { data: predictions, error: pError } = await supabase
      .from('predictions')
      .select(`
        id,
        prediction,
        is_correct,
        reward_points,
        user_id,
        profiles!inner (
          email,
          nickname
        )
      `)
      .eq('question_id', question_id)
      .not('is_correct', 'is', null)

    if (pError || !predictions || predictions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No predictions to notify' })
    }

    let sentCount = 0

    for (const pred of predictions) {
      const profile = pred.profiles as unknown as { email: string | null; nickname: string | null }
      if (!profile?.email) continue

      const isCorrect = pred.is_correct
      const nickname = profile.nickname || '회원'
      const reward = pred.reward_points || 0

      const predictionLabel =
        pred.prediction === 'a' ? question.option_a :
        pred.prediction === 'b' ? question.option_b : '황금밸런스'

      const subject = isCorrect
        ? `🎉 예측 적중! +${reward}P 획득`
        : '예측 결과가 나왔어요'

      const html = buildPredictionResultEmail({
        nickname,
        questionTitle: question.title,
        predictionLabel,
        isCorrect: !!isCorrect,
        reward,
        questionId: question.id,
      })

      const { error: sendError } = await getResend().emails.send({
        from: EMAIL_FROM,
        to: profile.email,
        subject,
        html,
      })

      if (sendError) {
        console.error(`Failed to send email to ${profile.email}:`, sendError)
      } else {
        sentCount++
      }
    }

    return NextResponse.json({ sent: sentCount })
  } catch (error) {
    console.error('Prediction result email error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function buildPredictionResultEmail(params: {
  nickname: string
  questionTitle: string
  predictionLabel: string
  isCorrect: boolean
  reward: number
  questionId: string
}) {
  const { nickname, questionTitle, predictionLabel, isCorrect, reward, questionId } = params
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  const resultUrl = `${siteUrl}/questions/${questionId}`

  const resultMessage = isCorrect
    ? `<span style="color: #1E5C52; font-weight: bold;">🎉 적중! +${reward}P를 획득했어요!</span>`
    : `<span style="color: #482F12;">아쉽게 빗나갔어요 😢</span>`

  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#F5F0EF;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','맑은 고딕',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#1E5C52;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;">결정소</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#1A1A19;font-size:16px;">안녕하세요, <strong>${nickname}</strong>님!</p>
      <p style="margin:0 0 24px;color:#558481;font-size:14px;">예측하신 질문의 결과가 나왔어요.</p>

      <div style="background:#F6F8F4;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#558481;font-size:12px;">질문</p>
        <p style="margin:0 0 16px;color:#1A1A19;font-size:15px;font-weight:600;">${questionTitle}</p>
        <p style="margin:0 0 8px;color:#558481;font-size:12px;">나의 예측</p>
        <p style="margin:0 0 16px;color:#1E5C52;font-size:15px;font-weight:600;">${predictionLabel}</p>
        <p style="margin:0 0 8px;color:#558481;font-size:12px;">결과</p>
        <p style="margin:0;font-size:16px;">${resultMessage}</p>
      </div>

      <a href="${resultUrl}" style="display:block;text-align:center;background:#F2D64B;color:#1A1A19;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        결과 확인하기
      </a>
    </div>
    <div style="padding:16px 32px;background:#F5F0EF;border-top:1px solid #E0E7D9;">
      <p style="margin:0;color:#558481;font-size:12px;text-align:center;">결정소 | 당신의 선택이 결과를 만듭니다</p>
    </div>
  </div>
</body>
</html>`
}
