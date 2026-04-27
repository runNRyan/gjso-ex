import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import QuestionDetailPage from './question-detail'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: question } = await supabase
    .from('questions')
    .select('title, option_a, option_b')
    .eq('id', id)
    .single()

  if (!question) {
    return {
      title: '질문을 찾을 수 없습니다 | 결정소',
    }
  }

  const title = `${question.title} | 결정소`
  const description = `A: ${question.option_a} vs B: ${question.option_b} — 결정소에서 투표하고 결과를 예측해보세요!`

  const ogImage = `/api/og?id=${id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: '결정소',
      images: [{ url: ogImage, width: 1200, height: 630, alt: question.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function Page() {
  return <QuestionDetailPage />
}
