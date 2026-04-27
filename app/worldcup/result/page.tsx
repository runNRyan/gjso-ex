'use client';

/**
 * 결정소 - 불호 월드컵 최종 결과 페이지 (v7 - Canvas 공유 이미지)
 * Colors: #FFFFFF (배경), #1E5C52 (헤더/푸터/강조), #2F4845 (텍스트)
 * Design: 임팩트 있는 타이포, 풀블리드 컬러 섹션, Canvas 공유 이미지 생성
 */
import { Suspense, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import Confetti from '@/components/worldcup/confetti';
import WorldcupLayout from '@/components/worldcup/worldcup-layout';
import { CATEGORY_COLOR, type Option } from '@/lib/worldcup/tournament';

function getGuestId(): string {
  const key = 'app_guest_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

const GREEN = '#1E5C52';
const WHITE = '#FFFFFF';
const BG = '#FFFFFF';
const DARK = '#2F4845';

interface PersonalityType {
  type: string;
  emoji: string;
  subtitle: string;
  description: string;
  answers: string[];
}

// Canvas에 한국어 텍스트 줄바꿈 처리
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split('');
  const lines: string[] = [];
  let current = '';
  for (const char of words) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Canvas 이미지 생성 (공유/저장 공통)
// mode: 'share' = 공유용(바이럴 텍스트 중심), 'save' = 저장용(결정소 브랜딩 상단 강조)
async function generateShareImage(
  category: string,
  question: string,
  championText: string,
  personality: PersonalityType | null,
  categoryColor: string
): Promise<string> {
  const W = 1080;
  const H = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 배경
  ctx.fillStyle = '#F8F7F4';
  ctx.fillRect(0, 0, W, H);

  // ── 최상단 결정소 브랜딩 배너 ──
  const topBrandH = 90;
  ctx.fillStyle = '#1E3A5F'; // 네이비
  ctx.fillRect(0, 0, W, topBrandH);

  // 결정소 로고 텍스트
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 36px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐄 결정소  |  불호 월드컵', W / 2, topBrandH / 2 - 10);

  // EXAMPLE.COM 서브텍스트
  ctx.font = '22px "Noto Sans KR", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText('팍팍한 세상, 싫음을 표출하고 살자!  |  EXAMPLE.COM', W / 2, topBrandH / 2 + 22);

  // ── 카테고리 질문 배너 ──
  const bannerH = 110;
  const bannerTop = topBrandH;
  ctx.fillStyle = categoryColor;
  ctx.fillRect(0, bannerTop, W, bannerH);

  // 질문 텍스트
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 38px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(question, W / 2, bannerTop + bannerH / 2);

  // 우승 답변 카드
  const cardPad = 40;
  const cardTop = topBrandH + bannerH + 30;
  const cardH = 200;
  ctx.fillStyle = WHITE;
  ctx.strokeStyle = categoryColor;
  ctx.lineWidth = 6;
  roundRect(ctx, cardPad, cardTop, W - cardPad * 2, cardH, 16);
  ctx.fill();
  ctx.stroke();

  // 우승 답변 텍스트
  ctx.fillStyle = DARK;
  const fontSize = championText.length > 25 ? 38 : championText.length > 15 ? 46 : 54;
  ctx.font = `900 ${fontSize}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = wrapText(ctx, championText, W - cardPad * 2 - 60);
  const lineH = fontSize * 1.4;
  const totalH = lines.length * lineH;
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, cardTop + cardH / 2 - totalH / 2 + i * lineH + lineH / 2);
  });

  // 구분선
  const divY = cardTop + cardH + 24;
  ctx.strokeStyle = 'rgba(47,72,69,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardPad, divY);
  ctx.lineTo(W - cardPad, divY);
  ctx.stroke();

  if (personality) {
    // "당신은 어떤 사람일까요?" 배너
    const p2Top = divY + 30;
    const p2BannerH = 80;
    ctx.fillStyle = categoryColor;
    ctx.beginPath();
    roundRect(ctx, cardPad, p2Top, W - cardPad * 2, p2BannerH, 12);
    ctx.fill();

    ctx.fillStyle = WHITE;
    ctx.font = 'bold 34px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('당신은 어떤 사람일까요?', W / 2, p2Top + p2BannerH / 2);

    // personality 카드
    const p2CardTop = p2Top + p2BannerH + 16;
    const p2CardH = 340;
    ctx.fillStyle = WHITE;
    ctx.strokeStyle = categoryColor;
    ctx.lineWidth = 6;
    roundRect(ctx, cardPad, p2CardTop, W - cardPad * 2, p2CardH, 16);
    ctx.fill();
    ctx.stroke();

    // 이모지
    ctx.font = '120px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(personality.emoji, W / 2, p2CardTop + 130);

    // 유형명
    ctx.fillStyle = categoryColor;
    ctx.font = `900 56px "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(personality.type, W / 2, p2CardTop + 230);

    // 서브타이틀
    ctx.fillStyle = categoryColor;
    ctx.font = `bold 28px "Noto Sans KR", sans-serif`;
    ctx.globalAlpha = 0.8;
    ctx.fillText(personality.subtitle, W / 2, p2CardTop + 295);
    ctx.globalAlpha = 1;
  }

  // 하단 브랜딩
  const brandY = H - 80;
  ctx.fillStyle = categoryColor;
  ctx.fillRect(0, brandY, W, 80);

  ctx.fillStyle = WHITE;
  ctx.font = 'bold 32px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('나도 해보기 → EXAMPLE.COM', W / 2, brandY + 30);

  ctx.font = '24px "Noto Sans KR", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('팍팍한 세상, 싫음을 표출하고 살자!', W / 2, brandY + 60);

  return canvas.toDataURL('image/png');
}

// 둥근 사각형 path 헬퍼
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function Result() {
  return (
    <Suspense fallback={
      <WorldcupLayout>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏆</div>
            <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: '22px', color: '#2F4845' }}>결과 로딩중...</div>
          </div>
        </div>
      </WorldcupLayout>
    }>
      <ResultContent />
    </Suspense>
  );
}

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [champion, setChampion] = useState<Option | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('연애');
  const [personality, setPersonality] = useState<PersonalityType | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [isSharedView, setIsSharedView] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const saveCardRef = useRef<HTMLDivElement>(null);

  const RANDOM_MESSAGES = [
    '아오, 킹받네...',
    '혈압이 오르는군...',
    '아놔, 생각만 해도...',
    '킹받쥬?',
    '명상해야지...',
    '술땡긴다...',
  ];
  const [randomMsg] = useState(() => RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)]);

  useEffect(() => {
    const idParam = searchParams.get('id');
    const championParam = searchParams.get('champion');
    const categoryParam = searchParams.get('category') || '연애';

    if (idParam) {
      // 짧은 공유 링크로 접근: DB에서 결과 조회
      fetch(`/api/worldcup-results?id=${idParam}`)
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then(async (data) => {
          setSelectedCategory(data.category);
          setChampion({ id: 0, text: data.champion_text });
          setShareId(idParam);
          setIsSharedView(true);

          let desc = data.personality_description ?? '';

          // DB에 description이 없으면 personality.json에서 가져오기
          if (!desc && data.personality_type) {
            try {
              const pRes = await fetch('/worldcup/personality.json');
              const pData: Record<string, PersonalityType[]> = await pRes.json();
              const types = pData[data.category];
              if (types) {
                const found = types.find((t) => t.type === data.personality_type);
                if (found) desc = found.description;
              }
            } catch { /* ignore */ }
          }

          if (data.personality_type) {
            setPersonality({
              type: data.personality_type,
              emoji: data.personality_emoji ?? '',
              subtitle: data.personality_subtitle ?? '',
              description: desc,
              answers: [],
            });
          }
          setTimeout(() => setShowConfetti(true), 100);
          setTimeout(() => setShowContent(true), 400);
          setTimeout(() => setShowConfetti(false), 5000);
        })
        .catch(() => router.push('/worldcup'));
      return;
    }

    setSelectedCategory(categoryParam);

    if (championParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(championParam));
        setChampion(parsed);

        fetch('/worldcup/personality.json')
          .then((r) => r.json())
          .then((data: Record<string, PersonalityType[]>) => {
            const types = data[categoryParam];
            if (!types) return;
            const championText = parsed.text ?? '';
            const matched = types.find((t) =>
              t.answers.some((a) => a.trim() === championText.trim())
            );
            const p = matched ?? types[Math.floor(Math.random() * types.length)];
            setPersonality(p);

            // DB에 결과 저장 → 짧은 공유 ID 생성
            fetch('/api/worldcup-results', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                category: categoryParam,
                championText,
                personality: p,
                guestId: getGuestId(),
              }),
            })
              .then((r) => r.json())
              .then((res) => { if (res.id) setShareId(res.id); })
              .catch(() => {});
          })
          .catch(() => {});
      } catch {
        router.push('/worldcup');
        return;
      }
    } else {
      router.push('/worldcup');
      return;
    }

    setTimeout(() => setShowConfetti(true), 100);
    setTimeout(() => setShowContent(true), 400);
    setTimeout(() => setShowConfetti(false), 5000);
  }, [router, searchParams]);

  const CATEGORY_QUESTION: Record<string, string> = {
    '연애': '연애할 때 가장 킹받는 애인 행동은?',
    '일상': '일상에서 가장 킹받는 빌런은?',
    '직장': '직장에서 가장 열받게 하는 빌런은?',
    '패션': '약속 장소에 등장한 친구, 최악의 패션은?',
  };

  // 바이럴 공유 텍스트 생성
  const getViralShareText = () => {
    const championText = champion?.text ?? '';
    const pType = personality?.type ?? '';
    const pEmoji = personality?.emoji ?? '';
    const pSubtitle = personality?.subtitle ?? '';

    const viralMessages: Record<string, string> = {
      '연애': `나의 연애 불호 1위는 "${championText}" 🚨\n나는 ${pEmoji} ${pType} — ${pSubtitle}\n너는?`,
      '일상': `일상 킹받는 빌런 1위 "${championText}" 🤯\n나는 ${pEmoji} ${pType} — ${pSubtitle}\n너는?`,
      '직장': `직장 최악의 빌런 1위 "${championText}" 💢\n나는 ${pEmoji} ${pType} — ${pSubtitle}\n너는?`,
      '패션': `최악의 패션 1위 "${championText}" 😱\n나는 ${pEmoji} ${pType} — ${pSubtitle}\n너는?`,
    };
    return viralMessages[selectedCategory] ?? `불호 월드컵 우승: "${championText}" ${pEmoji} ${pType}`;
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);

    const origin = window.location.origin;
    const shareUrl = shareId
      ? `${origin}/worldcup/result?id=${shareId}`
      : window.location.href;
    const shareText = getViralShareText();

    try {
      if (navigator.share) {
        await navigator.share({
          title: '불호 월드컵 | 결정소',
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = `${shareText}\n${shareUrl}`;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        });
        setCopied(true);
        toast.success('링크가 복사되었습니다!');
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        toast.success('링크가 복사되었습니다!');
        setTimeout(() => setCopied(false), 2000);
      } catch { /* ignore */ }
    } finally {
      setSharing(false);
    }
  };

  const handleSaveImage = async () => {
    if (saving || !saveCardRef.current) return;
    setSaving(true);
    try {
      const el = saveCardRef.current;
      el.style.visibility = 'visible';
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.top = '0';

      const canvas = await html2canvas(el, {
        backgroundColor: '#FFFFFF',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });

      el.style.visibility = 'hidden';
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.top = '0';

      const imageDataUrl = canvas.toDataURL('image/png');
      const fileName = `불호월드컵_${selectedCategory}_결과.png`;

      // 모바일: Web Share API로 공유 시트 열기 (사진 저장 가능)
      try {
        const res = await fetch(imageDataUrl);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file] });
          return;
        }
      } catch {
        // share 실패 시 다운로드로 fallback
      }

      // fallback: 모바일은 새 탭에 이미지 열기, 데스크탑은 다운로드
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const w = window.open('');
        if (w) {
          w.document.write(`<html><head><title>결과 이미지</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#000"><img src="${imageDataUrl}" style="max-width:100%;height:auto" /><p style="position:fixed;top:12px;left:0;right:0;text-align:center;color:#fff;font-size:15px;font-family:sans-serif">이미지를 꾹 눌러서 저장하세요</p></body></html>`);
          w.document.close();
        }
      } else {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = imageDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error('이미지 저장 실패:', e);
    } finally {
      setSaving(false);
    }
  };

  if (!champion) return null;

  const categoryColor = CATEGORY_COLOR[selectedCategory] || DARK;
  const championText = champion.text ?? '';
  const textLen = championText.length;
  const championFontSize = textLen > 30 ? '18px' : textLen > 18 ? '22px' : '28px';
  const bannerQuestion = CATEGORY_QUESTION[selectedCategory] || `${selectedCategory} 불호 월드컵 우승, 너로 골랐다`;

  return (
    <WorldcupLayout>
      {showConfetti && <Confetti />}

      <style>{`
        @keyframes slam-in {
          0% { transform: scale(1.4) rotate(-2deg); opacity: 0; }
          60% { transform: scale(0.96) rotate(0.5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes slide-up {
          0% { transform: translateY(28px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes personality-reveal {
          0% { transform: translateY(24px) scale(0.96); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes emoji-bounce {
          0%, 100% { transform: scale(1) rotate(-4deg); }
          50% { transform: scale(1.18) rotate(4deg); }
        }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(242,214,75,0.4), 0 0 0 0 rgba(242,214,75,0.6); }
          50% { box-shadow: 0 4px 18px rgba(242,214,75,0.6), 0 0 0 8px rgba(242,214,75,0); }
        }
        @keyframes btnShine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .app-btn {
          animation: btnPulse 1.8s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        .app-btn::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: btnShine 2.2s linear infinite;
          pointer-events: none;
        }
        .app-btn:hover {
          animation: none;
          box-shadow: 0 4px 18px rgba(242,214,75,0.6);
        }
        .action-btn {
          transition: background-color 0.15s ease, transform 0.1s ease;
        }
        .action-btn:hover {
          transform: translateY(-1px);
        }
        .action-btn:active {
          transform: translateY(0);
        }
      `}</style>

      <div style={{ backgroundColor: BG, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* ── 풀블리드 랜덤 메시지 섹션 ── */}
        <div
          style={{
            backgroundColor: categoryColor,
            padding: '22px 20px',
            textAlign: 'center',
            opacity: showContent ? 1 : 0,
            animation: showContent ? 'slam-in 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' : 'none',
          }}
        >
          <div
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: '36px',
              color: WHITE,
              lineHeight: '1',
              letterSpacing: '0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
          >
            {randomMsg}
          </div>
        </div>

        {/* ── 메인 콘텐츠 ── */}
        <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* ── 캡처 대상 영역 ── */}
          <div ref={captureRef} style={{ backgroundColor: BG, display: 'flex', flexDirection: 'column', gap: '10px', padding: '2px 0' }}>

            {/* 우승 카드 */}
            <div
              style={{
                backgroundColor: BG,
                border: `3px solid ${categoryColor}`,
                textAlign: 'center',
                opacity: showContent ? 1 : 0,
                animation: showContent ? 'slide-up 0.5s ease 0.25s both' : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* 상단 배너 */}
              <div
                style={{
                  backgroundColor: categoryColor,
                  color: WHITE,
                  fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                  fontSize: 'clamp(13px, 4vw, 19.5px)',
                  fontWeight: '800',
                  padding: '10px 16px',
                  letterSpacing: '0.02em',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {bannerQuestion}
              </div>

              {/* 우승 텍스트 */}
              <div
                style={{
                  fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                  fontSize: championFontSize,
                  fontWeight: '900',
                  color: DARK,
                  lineHeight: '1.45',
                  wordBreak: 'keep-all',
                  padding: '22px 20px',
                  letterSpacing: '-0.01em',
                }}
              >
                {championText}
              </div>
            </div>

            {/* ★ Personality 카드 */}
            {personality && showContent && (
              <div
                style={{
                  backgroundColor: BG,
                  border: `3px solid ${categoryColor}`,
                  position: 'relative',
                  animation: 'personality-reveal 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.5s both',
                  overflow: 'hidden',
                }}
              >
                {/* 상단 배너 */}
                <div
                  style={{
                    backgroundColor: categoryColor,
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                      fontSize: '19.5px',
                      fontWeight: '800',
                      color: WHITE,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {isSharedView ? '당신의 친구는 어떤 사람일까요?' : '당신은 어떤 사람일까요?'}
                  </span>
                </div>

                {/* 캐릭터 메인 영역 */}
                <div
                  style={{
                    padding: '20px 16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {/* 이모지 */}
                  <div
                    style={{
                      fontSize: '64px',
                      lineHeight: '1',
                      animation: 'emoji-bounce 2s ease-in-out infinite',
                      filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))',
                    }}
                  >
                    {personality.emoji}
                  </div>

                  {/* 유형명 */}
                  <div
                    style={{
                      fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                      fontSize: '32px',
                      fontWeight: '900',
                      color: categoryColor,
                      letterSpacing: '0.01em',
                      lineHeight: '1.1',
                      textAlign: 'center',
                      marginTop: '10px',
                    }}
                  >
                    {personality.type}
                  </div>

                  {/* 서브타이틀 */}
                  <div
                    style={{
                      fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                      fontSize: '14px',
                      fontWeight: '700',
                      color: categoryColor,
                      letterSpacing: '0.03em',
                      marginTop: '2px',
                      opacity: 0.85,
                    }}
                  >
                    {personality.subtitle}
                  </div>
                </div>

                {/* 해설 보기 토글 */}
                <div style={{ padding: '4px 16px 12px', textAlign: 'center' }}>
                  <button
                    onClick={() => setDescExpanded((v) => !v)}
                    style={{
                      background: 'none',
                      border: `1.5px solid ${categoryColor}`,
                      borderRadius: '20px',
                      padding: '5px 18px',
                      fontSize: '12px',
                      fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                      fontWeight: '700',
                      color: categoryColor,
                      cursor: 'pointer',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {descExpanded ? '해설 닫기 ▲' : '해설 보기 ▼'}
                  </button>
                </div>

                {/* 해설 텍스트 */}
                {descExpanded && (
                  <div
                    style={{
                      padding: '4px 20px 16px',
                      fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                      fontSize: '13px',
                      fontStyle: 'italic',
                      color: 'rgba(47,72,69,0.72)',
                      lineHeight: '1.8',
                      fontWeight: '600',
                      wordBreak: 'keep-all',
                      textAlign: 'center',
                    }}
                  >
                    &ldquo;{personality.description}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>
          {/* ── 캡처 대상 영역 끝 ── */}

          {/* 결정소 링크 섹션 */}
          <div
            style={{
              backgroundColor: '#F2D64B',
              border: '3px solid #d4b93a',
              padding: '16px',
              textAlign: 'center',
              opacity: showContent ? 1 : 0,
              transition: 'opacity 0.4s ease 0.7s',
              marginBottom: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                fontSize: 'clamp(13px, 3.8vw, 16px)',
                color: '#482F32',
                letterSpacing: '0.04em',
                fontWeight: '700',
                lineHeight: '1.4',
                wordBreak: 'keep-all',
              }}
            >
              팍팍한 인생,<br></br> &lsquo;결정소&rsquo;에서 더 많은 불호 투표와 예측을 하세요!
            </div>
            <button
              onClick={() => router.push('/list')}
              className="app-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#FFFFFF',
                color: '#482F32',
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: '18px',
                padding: '6px 20px',
                textDecoration: 'none',
                letterSpacing: '0.06em',
                border: '2px solid #482F32',
                cursor: 'pointer',
                borderRadius: '20px',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f5f5f5'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF'; }}
            >
              <img
                src="/worldcup/images/ddabongso.png"
                alt="따봉소"
                style={{
                  width: '70px',
                  height: '70px',
                  display: 'block',
                  objectFit: 'contain',
                }}
              />
              결정소 방문하기

              <img
                src="/worldcup/images/ddabongso.png"
                alt="따봉소"
                style={{
                  width: '70px',
                  height: '70px',
                  display: 'block',
                  objectFit: 'contain',
                }}
              />
            </button>
          </div>

          {/* 버튼 영역 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>

            {/* 공유 링크로 접근한 경우: 월드컵 시작하기 버튼 */}
            {isSharedView && (
              <button
                className="action-btn"
                onClick={() => router.push(`/worldcup/game?category=${encodeURIComponent(selectedCategory)}`)}
                style={{
                  width: '100%',
                  backgroundColor: categoryColor,
                  color: WHITE,
                  border: 'none',
                  borderRadius: '24px',
                  fontFamily: "'Black Han Sans', sans-serif",
                  fontSize: '17px',
                  padding: '14px 6px',
                  cursor: 'pointer',
                  opacity: showContent ? 1 : 0,
                  transition: 'opacity 0.4s ease 0.8s, background-color 0.15s ease, transform 0.1s ease',
                  letterSpacing: '0.04em',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#163f38'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = categoryColor; }}
              >
                🎮 나도 월드컵 시작하기
              </button>
            )}

            {!isSharedView && (
              <>
                {/* 결과 공유하기 + 결과 사진 저장 (가로 배치) */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="action-btn"
                    onClick={handleShare}
                    disabled={sharing}
                    style={{
                      flex: 1,
                      backgroundColor: categoryColor,
                      color: WHITE,
                      border: 'none',
                      borderRadius: '24px',
                      fontFamily: "'Black Han Sans', sans-serif",
                      fontSize: '15px',
                      padding: '12px 6px',
                      cursor: sharing ? 'not-allowed' : 'pointer',
                      opacity: showContent ? (sharing ? 0.7 : 1) : 0,
                      transition: 'opacity 0.4s ease 0.9s, background-color 0.15s ease, transform 0.1s ease',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => { if (!sharing) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#163f38'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = categoryColor; }}
                  >
                    {sharing ? '⏳ 공유중...' : copied ? '✅ 복사됨!' : '🔗 결과 공유하기'}
                  </button>

                  <button
                    className="action-btn"
                    onClick={handleSaveImage}
                    disabled={saving}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(47,72,69,0.08)',
                      color: DARK,
                      border: `2px solid rgba(47,72,69,0.22)`,
                      borderRadius: '24px',
                      fontFamily: "'Black Han Sans', sans-serif",
                      fontSize: '15px',
                      padding: '12px 6px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: showContent ? (saving ? 0.6 : 1) : 0,
                      transition: 'opacity 0.4s ease 1s, background-color 0.15s ease, transform 0.1s ease',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(47,72,69,0.15)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(47,72,69,0.08)'; }}
                  >
                    {saving ? '⏳ 저장중...' : '📷 결과 사진 저장'}
                  </button>
                </div>

                {/* 다시 하기 (전체 너비) */}
                <button
                  className="action-btn"
                  onClick={() => router.push('/worldcup')}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    color: 'rgba(47,72,69,0.55)',
                    border: `1.5px solid rgba(47,72,69,0.18)`,
                    borderRadius: '24px',
                    fontFamily: "'Black Han Sans', sans-serif",
                    fontSize: '14px',
                    padding: '10px 6px',
                    cursor: 'pointer',
                    opacity: showContent ? 1 : 0,
                    transition: 'opacity 0.4s ease 0.8s, background-color 0.15s ease, transform 0.1s ease',
                    letterSpacing: '0.04em',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(47,72,69,0.06)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                >
                  🔄 다시 하기
                </button>
              </>
            )}
          </div>


        </div>
      </div>
      {/* ── 저장용 숨김 캡처 카드 (화면 밖에 렌더링) ── */}
      {personality && champion && (
        <div
          ref={saveCardRef}
          style={{
            visibility: 'hidden',
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '390px',
            backgroundColor: '#FFFFFF',
            fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
          }}
        >
          {/* 결정소 헤더 */}
          <div style={{ backgroundColor: GREEN, padding: '10px 16px' }}>
            <span style={{ color: WHITE, fontWeight: '800', fontSize: '16px', letterSpacing: '0.04em' }}>결정소</span>
          </div>

          {/* 불호 월드컵 타이틀 */}
          <div style={{ backgroundColor: '#FFFFFF', textAlign: 'center', padding: '18px 16px 14px' }}>
            <div style={{ fontSize: '13px', color: 'rgba(47,72,69,0.6)', fontWeight: '600', marginBottom: '6px' }}>팍팍한 세상, 싫음을 표출하고 살자!</div>
            <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: '36px', color: GREEN, letterSpacing: '0.06em', lineHeight: '1' }}>불호 월드컵</div>
          </div>

          {/* 질문 + 우승 답변 카드 */}
          <div style={{ margin: '0 16px 12px', border: `3px solid ${categoryColor}` }}>
            <div style={{ backgroundColor: categoryColor, padding: '12px 16px', textAlign: 'center' }}>
              <span style={{ color: WHITE, fontWeight: '800', fontSize: '16px' }}>{bannerQuestion}</span>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '22px 20px', textAlign: 'center' }}>
              <div style={{
                fontWeight: '900',
                fontSize: champion.text.length > 25 ? '18px' : champion.text.length > 15 ? '22px' : '26px',
                color: DARK,
                lineHeight: '1.5',
                wordBreak: 'keep-all',
              }}>
                {champion.text}
              </div>
            </div>
          </div>

          {/* personality 카드 */}
          <div style={{ margin: '0 16px 12px', border: `3px solid ${categoryColor}` }}>
            <div style={{ backgroundColor: categoryColor, padding: '12px 16px', textAlign: 'center' }}>
              <span style={{ color: WHITE, fontWeight: '800', fontSize: '16px' }}>당신은 어떤 사람일까요?</span>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '24px 16px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '72px', lineHeight: '1' }}>{personality.emoji}</div>
              <div style={{ fontWeight: '900', fontSize: '28px', color: categoryColor, marginTop: '8px' }}>{personality.type}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: categoryColor, opacity: 0.85 }}>{personality.subtitle}</div>
              {personality.description && (
                <div style={{ marginTop: '12px', fontSize: '12px', fontStyle: 'italic', color: 'rgba(47,72,69,0.7)', lineHeight: '1.8', wordBreak: 'keep-all', padding: '0 8px' }}>
                  &ldquo;{personality.description}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* EXAMPLE.COM 섹션 */}
          <div style={{ margin: '0 16px 20px', border: '1.5px solid rgba(30,92,82,0.18)', backgroundColor: 'rgba(30,92,82,0.03)', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'rgba(47,72,69,0.6)', fontWeight: '600', marginBottom: '12px' }}>불호를 더 표현하고 싶으시면 <strong style={{ color: DARK }}>결정소</strong>에 오세요</div>
            <div style={{ display: 'inline-block', backgroundColor: GREEN, color: WHITE, fontFamily: "'Black Han Sans', sans-serif", fontSize: '18px', padding: '10px 28px', letterSpacing: '0.06em' }}>EXAMPLE.COM →</div>
          </div>
        </div>
      )}
    </WorldcupLayout>
  );
}
