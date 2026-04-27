'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

const COW_SIDE_URL = '/worldcup/images/cow-side.png';
const COW_FRONT_URL = '/worldcup/images/cow-front.png';

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generatePatternItems(count: number) {
  const rand = seededRandom(42);
  const images = [COW_SIDE_URL, COW_FRONT_URL];
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: i,
      src: images[Math.floor(rand() * 2)],
      top: rand() * 100,
      left: rand() * 100,
      rotation: rand() * 360,
      size: 48 + rand() * 36,
      opacity: 0.06 + rand() * 0.06,
    });
  }
  return items;
}

const PATTERN_ITEMS = generatePatternItems(32);

interface WorldcupLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  rightLabel?: string;
}

export default function WorldcupLayout({ children, showBackButton, onBack, rightLabel }: WorldcupLayoutProps) {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        maxWidth: '480px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Noto Sans KR', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 배경 도트 패턴 - 소 이미지들 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {PATTERN_ITEMS.map((item) => (
          <img
            key={item.id}
            src={item.src}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: `${item.top}%`,
              left: `${item.left}%`,
              width: `${item.size}px`,
              height: `${item.size}px`,
              objectFit: 'contain',
              transform: `rotate(${item.rotation}deg)`,
              opacity: item.opacity,
              userSelect: 'none',
              filter: 'invert(1) opacity(0.15)',
            }}
          />
        ))}
      </div>

      {/* 헤더 */}
      <header
        style={{
          backgroundColor: '#1E5C52',
          padding: '0 14px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showBackButton && (
            <button
              onClick={onBack}
              style={{
                color: '#FFFFFF',
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: '12px',
                fontWeight: '700',
                background: 'none',
                border: '1.5px solid rgba(255,255,255,0.5)',
                padding: '3px 8px',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              ← 처음으로
            </button>
          )}
          <div
            onClick={() => router.push('/worldcup')}
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: '18px',
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              cursor: 'pointer',
            }}
          >
            결정소
          </div>
        </div>

        {rightLabel && (
          <div
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: '13px',
              fontWeight: '700',
            }}
          >
            {rightLabel}
          </div>
        )}
      </header>

      {/* 콘텐츠 영역 */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {children}
      </main>

      {/* 푸터 */}
      <footer
        style={{
          backgroundColor: '#1E5C52',
          padding: '12px 16px',
          textAlign: 'center',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '11px',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: '400',
          }}
        >
          <span
            onClick={() => router.push('/worldcup')}
            style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
          >
            결정소
          </span>
          {' '}| Copyright by CINFLO
        </div>
      </footer>
    </div>
  );
}
