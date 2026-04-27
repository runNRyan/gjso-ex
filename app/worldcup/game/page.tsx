'use client';

/**
 * 결정소 - 불호 월드컵 게임 진행 화면 (v3)
 */
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WorldcupLayout from '@/components/worldcup/worldcup-layout';
import {
  type Option,
  type TournamentState,
  type CategoryData,
  createTournament,
  getCurrentMatch,
  selectWinner,
  getProgress,
  getMatchInfo,
  CATEGORY_COLOR,
} from '@/lib/worldcup/tournament';

const WHITE = '#FFFFFF';
const BG = '#FFFFFF';
const DARK = '#2F4845';

type AnimState = 'idle' | 'left-win' | 'right-win' | 'transitioning';

export default function Game() {
  return (
    <Suspense fallback={
      <WorldcupLayout>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎲</div>
            <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: '22px', color: '#2F4845' }}>옵션 선발 중...</div>
          </div>
        </div>
      </WorldcupLayout>
    }>
      <GameContent />
    </Suspense>
  );
}

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || '연애';

  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [animState, setAnimState] = useState<AnimState>('idle');
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cardKey, setCardKey] = useState(0);

  useEffect(() => {
    fetch('/worldcup/categories.json')
      .then((res) => res.json())
      .then((categoriesData: Record<string, CategoryData>) => {
        const state = createTournament(categoriesData, selectedCategory);
        setTournament(state);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [selectedCategory]);

  const handleSelect = useCallback(
    (side: 'left' | 'right') => {
      if (!tournament || animState !== 'idle') return;
      const match = getCurrentMatch(tournament);
      if (!match) return;

      setSelectedSide(side);
      setAnimState(side === 'left' ? 'left-win' : 'right-win');

      const winner = side === 'left' ? match.left : match.right;

      setTimeout(() => {
        setAnimState('transitioning');
        const newState = selectWinner(tournament, winner, side);

        if (newState.isComplete) {
          router.push(
            `/worldcup/result?champion=${encodeURIComponent(JSON.stringify(newState.champion))}&category=${encodeURIComponent(selectedCategory)}`
          );
          return;
        }

        setTournament(newState);
        setCardKey((k) => k + 1);
        setAnimState('idle');
        setSelectedSide(null);
      }, 500);
    },
    [tournament, animState, router, selectedCategory]
  );

  if (isLoading) {
    return (
      <WorldcupLayout>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎲</div>
            <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: '22px', color: DARK }}>
              옵션 선발 중...
            </div>
          </div>
        </div>
      </WorldcupLayout>
    );
  }

  if (!tournament) return null;

  const match = getCurrentMatch(tournament);
  if (!match) return null;

  const progress = getProgress(tournament);
  const matchInfo = getMatchInfo(tournament);
  const categoryColor = CATEGORY_COLOR[selectedCategory] || DARK;

  return (
    <WorldcupLayout showBackButton onBack={() => router.push('/worldcup')}>
      <div style={{ backgroundColor: BG, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* category banner */}
        <div style={{ backgroundColor: BG, borderBottom: `2px solid ${categoryColor}`, padding: '6px 16px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif", fontSize: '17px', fontWeight: '800', color: categoryColor, letterSpacing: '0.02em' }}>
            {selectedCategory} 불호 월드컵
          </div>
        </div>
        {/* progress bar */}
        <div style={{ backgroundColor: 'rgba(47,72,69,0.04)', borderBottom: '1px solid rgba(47,72,69,0.1)', padding: '8px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif", fontSize: '13px', fontWeight: '800', color: DARK }}>
              {matchInfo.current}/{matchInfo.total}경기
            </span>
            <span style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif", fontSize: '13px', color: 'rgba(47,72,69,0.6)', fontWeight: '700' }}>
              {progress}%
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(47,72,69,0.1)' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: categoryColor, transition: 'width 0.4s ease' }} />
          </div>
        </div>
        {/* question text with animation */}
        <style>{`
          @keyframes questionFadeIn {
            0% { opacity: 0; transform: translateY(-6px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div style={{ backgroundColor: BG, borderBottom: '1px solid rgba(47,72,69,0.08)', padding: '12px 20px', textAlign: 'center', flexShrink: 0 }}>
          <div key={cardKey} style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif", fontSize: 'clamp(13px, 3.8vw, 21px)', fontWeight: '900', fontStyle: 'italic', color: '#1E3A8A', letterSpacing: '-0.02em', lineHeight: '1.4', textShadow: '0 1px 0 rgba(0,0,0,0.08)', animation: 'questionFadeIn 0.4s ease forwards', whiteSpace: 'normal', wordBreak: 'keep-all' }}>
            &ldquo;{selectedCategory === '일상' ? '일상에서 가장 킹받는 빌런은?' : selectedCategory === '연애' ? '연애할 때 가장 킹받는 애인(썸남/썸녀)의 행동은?' : selectedCategory === '직장' ? '직장생활에서 가장 열받게 하는 빌런은?' : selectedCategory === '패션' ? '약속 장소에 등장한 친구, 최악의 패션은?' : `${selectedCategory}에서 가장 킹받는 상황은?`}&rdquo;
          </div>
        </div>
        {/* hint */}
        <div style={{ backgroundColor: 'rgba(47,72,69,0.03)', borderBottom: `2px solid ${categoryColor}`, padding: '6px 16px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif", fontSize: '12px', color: 'rgba(47,72,69,0.4)', fontWeight: '500' }}>
            아래 A 혹은 B 중 선택해주세요
          </div>
        </div>
        {/* option cards */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 16px', gap: '0', overflow: 'hidden' }}>
          <OptionCard key={`left-${cardKey}`} option={match.left} label="A" side="left" animState={animState} selectedSide={selectedSide} onSelect={() => handleSelect('left')} categoryColor={categoryColor} />
          {/* VS divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, padding: '6px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(47,72,69,0.15)' }} />
            <div style={{ backgroundColor: BG, color: DARK, border: '1px solid rgba(47,72,69,0.2)', padding: '2px 12px', fontFamily: "'Black Han Sans', sans-serif", fontSize: '20px', letterSpacing: '0.05em' }}>VS</div>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(47,72,69,0.15)' }} />
          </div>
          <OptionCard key={`right-${cardKey}`} option={match.right} label="B" side="right" animState={animState} selectedSide={selectedSide} onSelect={() => handleSelect('right')} categoryColor={categoryColor} />
        </div>
      </div>
    </WorldcupLayout>
  );
}

// OptionCard component - PRESERVE EXACTLY
interface OptionCardProps {
  option: Option;
  label: 'A' | 'B';
  side: 'left' | 'right';
  animState: AnimState;
  selectedSide: 'left' | 'right' | null;
  onSelect: () => void;
  categoryColor: string;
}

function OptionCard({ option, label, side, animState, selectedSide, onSelect, categoryColor }: OptionCardProps) {
  const isWinner = selectedSide === side && (animState === 'left-win' || animState === 'right-win');
  const isLoser = selectedSide !== null && selectedSide !== side && (animState === 'left-win' || animState === 'right-win');
  const fontSize = '21px';

  return (
    <button onClick={onSelect} disabled={animState !== 'idle'} style={{ flex: '1 1 0', minHeight: 0, width: '100%', border: isWinner ? `3px solid ${categoryColor}` : '2px solid rgba(47,72,69,0.2)', backgroundColor: isWinner ? `${categoryColor}15` : 'rgba(47,72,69,0.04)', boxShadow: isWinner ? `0 0 20px 4px ${categoryColor}33` : '0 2px 8px rgba(47,72,69,0.08)', textAlign: 'center', cursor: animState === 'idle' ? 'pointer' : 'default', transform: isLoser ? 'scale(0.97)' : isWinner ? 'scale(1.01)' : 'none', opacity: isLoser ? 0.4 : 1, transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px 16px' }}>
      {/* Label badge */}
      <div style={{ position: 'absolute', top: '8px', left: '10px', backgroundColor: categoryColor, color: WHITE, fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif", fontSize: '12px', fontWeight: '900', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px', transition: 'all 0.25s ease' }}>{label}</div>
      {/* Answer text */}
      <div style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif", fontSize, fontWeight: '700', color: isWinner ? categoryColor : DARK, lineHeight: '1.5', letterSpacing: '-0.02em', wordBreak: 'keep-all', paddingLeft: '12px', paddingRight: '12px', paddingBottom: isWinner ? '28px' : '0', transition: 'color 0.25s ease' }}>{option.text}</div>
      {/* Winner badge */}
      {isWinner && (
        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: categoryColor, color: '#FFFFFF', fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif", fontSize: '13px', fontWeight: '900', padding: '3px 14px', borderRadius: '20px', letterSpacing: '0.04em', pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: `0 2px 8px ${categoryColor}55` }}>✓ 선택!</div>
      )}
      {/* Loser overlay */}
      {isLoser && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(47,72,69,0.12)', fontSize: '26px', color: 'rgba(47,72,69,0.35)', pointerEvents: 'none' }}>✕</div>
      )}
    </button>
  );
}
