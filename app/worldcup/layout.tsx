import type { Metadata } from 'next';
import { Black_Han_Sans, Noto_Sans_KR } from 'next/font/google';
import WorldcupLayoutHider from '@/components/worldcup/layout-hider';

const blackHanSans = Black_Han_Sans({
  weight: '400',
  variable: '--font-black-han-sans',
  subsets: ['latin'],
});

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '불호 월드컵 | 결정소',
  description: '팍팍한 세상, 싫음을 표출하고 살자! 불호 월드컵에서 가장 킹받는 것을 골라보세요.',
  openGraph: {
    title: '불호 월드컵 | 결정소',
    description: '팍팍한 세상, 싫음을 표출하고 살자!',
    type: 'website',
    siteName: '결정소',
  },
  twitter: {
    card: 'summary_large_image',
    title: '불호 월드컵 | 결정소',
    description: '팍팍한 세상, 싫음을 표출하고 살자!',
  },
};

export default function WorldcupRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-worldcup className={`${blackHanSans.variable} ${notoSansKR.variable}`}>
      <WorldcupLayoutHider />
      {children}
    </div>
  );
}
