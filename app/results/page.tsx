import type { Metadata } from 'next'
import { ResultsDashboard } from '@/components/results/results-dashboard'

export const metadata: Metadata = {
  title: '결과 | 결정소',
  description: '투표 결과를 확인해보세요.',
  openGraph: {
    title: '결과 | 결정소',
    description: '투표 결과를 확인해보세요.',
    type: 'website',
    siteName: '결정소',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: '결정소 결과' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '결과 | 결정소',
    description: '투표 결과를 확인해보세요.',
    images: ['/og-default.png'],
  },
}

export default function ResultsPage() {
  return <ResultsDashboard />
}
