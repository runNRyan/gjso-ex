import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '질문 제안하기 | 결정소',
  description: '나만의 질문을 제안해보세요.',
  openGraph: {
    title: '질문 제안하기 | 결정소',
    description: '나만의 질문을 제안해보세요.',
    type: 'website',
    siteName: '결정소',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: '결정소 질문 제안' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '질문 제안하기 | 결정소',
    description: '나만의 질문을 제안해보세요.',
    images: ['/og-default.png'],
  },
}

export default function SuggestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
