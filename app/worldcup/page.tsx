'use client';

/**
 * 결정소 - 불호 이상형 월드컵 시작 화면
 * Colors: #FFFFFF (배경), #1E5C52 (헤더/버튼), #F2D64B (강조), #2F4845 (텍스트)
 * Fonts: Noto Sans KR (전체), Black Han Sans (타이틀)
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import WorldcupLayout from '@/components/worldcup/worldcup-layout';
import { GAME_CATEGORIES, CATEGORY_COLOR } from '@/lib/worldcup/tournament';

const GREEN = '#1E5C52';
const BG = '#FFFFFF';
const DARK = '#2F4845';
const GOLD = '#F2D64B';

export default function Home() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('연애');

  const handleShare = async () => {
    const url = window.location.href.split('?')[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: '불호 월드컵 | 결정소', text: '세상에서 제일 킹받는 건 뭘까? 16강 토너먼트로 나의 불호 1위를 가려보세요!', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('URL이 복사되었습니다! 친구에게 공유해보세요 🔗');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('URL이 복사되었습니다! 친구에게 공유해보세요 🔗');
      } catch {
        toast.error('복사에 실패했습니다. 주소창에서 직접 복사해주세요.');
      }
    }
  };

  const handleStart = () => {
    router.push(`/worldcup/game?category=${encodeURIComponent(selectedCategory)}`);
  };

  return (
    <WorldcupLayout>
      <style>{`
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(242,214,75,0.4), 0 0 0 0 rgba(242,214,75,0.6); }
          50% { box-shadow: 0 4px 18px rgba(242,214,75,0.6), 0 0 0 8px rgba(242,214,75,0); }
        }
        @keyframes btnShine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes catPulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(30,58,138,0.3), 0 0 0 0 rgba(30,58,138,0.5); }
          50% { box-shadow: 0 4px 16px rgba(30,58,138,0.5), 0 0 0 6px rgba(30,58,138,0); }
        }
        .title-text {
          display: inline-block;
          position: relative;
        }
        .start-btn {
          animation: btnPulse 1.8s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        .start-btn::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: btnShine 2.2s linear infinite;
          pointer-events: none;
        }
        .start-btn:hover {
          animation: none;
          box-shadow: 0 4px 18px rgba(242,214,75,0.6);
        }
        .cat-btn-selected {
          animation: catPulse 1.8s ease-in-out infinite;
        }
      `}</style>
      <div style={{ backgroundColor: BG, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* 서비스명 + 타이틀 배너 */}
        <div
          style={{
            backgroundColor: BG,
            padding: '8px 16px 10px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: '13px',
              color: 'rgba(47,72,69,0.6)',
              letterSpacing: '0.06em',
              marginBottom: '4px',
              fontWeight: '700',
            }}
          >
            팍팍한 세상, 싫음을 표출하고 살자!
          </div>

          <div
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: '40px',
              color: GREEN,
              lineHeight: '1.1',
              letterSpacing: '-0.01em',
              textShadow: `1px 1px 0px rgba(30,92,82,0.3), 3px 3px 0px rgba(0,0,0,0.15)`,
              display: 'inline-block',
              marginTop: '6px',
            }}
            className="title-text"
          >
            불호 월드컵
          </div>
        </div>

        {/* 카테고리 선택 + 시작하기 버튼 영역 */}
        <div
          style={{
            backgroundColor: BG,
            borderBottom: `2px solid rgba(47,72,69,0.12)`,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: '14px',
              color: DARK,
              fontWeight: '700',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}
          >
            질문 주제 카테고리를 선택 해주세요.
          </div>

          {/* 카테고리 버튼 */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              justifyContent: 'center',
              flexWrap: 'nowrap',
            }}
          >
            {GAME_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const color = CATEGORY_COLOR[cat.id] || DARK;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={isSelected ? 'cat-btn-selected' : ''}
                  style={{
                    backgroundColor: isSelected ? '#1E3A8A' : 'rgba(30,58,138,0.06)',
                    color: isSelected ? '#FFFFFF' : 'rgba(30,58,138,0.7)',
                    border: isSelected
                      ? `2px solid #1E3A8A`
                      : `2px solid rgba(30,58,138,0.22)`,
                    fontFamily: "'Black Han Sans', sans-serif",
                    fontSize: '16px',
                    padding: '7px 8px',
                    letterSpacing: '0.02em',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                    flex: '1 1 0',
                    minWidth: '0',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* 선택된 카테고리 설명 */}
          <div
            style={{
              textAlign: 'center',
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: '13px',
              color: 'rgba(47,72,69,0.5)',
              fontWeight: '500',
              minHeight: '20px',
            }}
          >
            {selectedCategory} 최악 16강 대결
          </div>

          {/* 시작 버튼 */}
          <button
            onClick={handleStart}
            className="start-btn"
            style={{
              backgroundColor: GOLD,
              color: '#482F32',
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: '26px',
              padding: '13px',
              width: '100%',
              border: `3px solid #d4b93a`,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            지금 시작하기 →
          </button>
        </div>

        {/* ── 하단 콘텐츠 영역 ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 16px 14px', gap: '12px' }}>

          {/* 게임 방법 안내 */}
          <div
            style={{
              backgroundColor: 'rgba(47,72,69,0.03)',
              border: '1.5px solid rgba(47,72,69,0.1)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: '12px',
                fontWeight: '800',
                color: 'rgba(47,72,69,0.45)',
                letterSpacing: '0.08em',
                marginBottom: '2px',
              }}
            >
              게임 방법
            </div>
            {[
              { icon: '🎲', text: '주제 카테고리별 16개 답변 옵션이 랜덤으로 선발됩니다.' },
              { icon: '⚔️', text: '매 라운드 더 킹받는 답변을 고르세요.' },
              { icon: '🏆', text: '결과 카드의 내용을 확인하고 친구들에게 공유하세요.' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{ fontSize: '15px', flexShrink: 0 }}>{icon}</span>
                <span
                  style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: 'clamp(11px, 3.1vw, 13.5px)',
                    color: DARK,
                    fontWeight: '600',
                    lineHeight: '1.4',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>

          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            style={{
              backgroundColor: 'transparent',
              color: 'rgba(47,72,69,0.65)',
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: '15px',
              fontWeight: '700',
              padding: '11px 24px',
              width: '100%',
              border: '2px solid rgba(47,72,69,0.2)',
              letterSpacing: '0.04em',
              transition: 'all 0.15s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(47,72,69,0.07)';
              (e.currentTarget as HTMLButtonElement).style.color = DARK;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(47,72,69,0.65)';
            }}
          >
            <span style={{ fontSize: '16px' }}>🔗</span>
            친구에게 공유하기
          </button>

          {/* 결정소 방문하기 링크 버튼 */}
          <button
            onClick={() => router.push('/list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: GREEN,
              color: '#FFFFFF',
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: '15px',
              fontWeight: '700',
              padding: '11px 24px',
              width: '100%',
              border: 'none',
              letterSpacing: '0.04em',
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#163f38';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = GREEN;
            }}
          >
            <span style={{ fontSize: '15px' }}>🏠</span>
            결정소 방문하기
          </button>

          {/* 따봉소 이미지 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '10px 0 6px',
            }}
          >
            <img
              src="/worldcup/images/ddabongso.png"
              alt="따봉소"
              style={{
                width: '195px',
                height: '195px',
                objectFit: 'contain',
              }}
            />
          </div>

        </div>
      </div>
    </WorldcupLayout>
  );
}
