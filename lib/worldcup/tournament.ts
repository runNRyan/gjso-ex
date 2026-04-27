/**
 * 불호 월드컵 토너먼트 로직 (survivor vs challenger 연속 생존 구조)
 */

export interface Option {
  id: number;
  text: string;
}

export interface CategoryData {
  question: string;
  options: Option[];
}

export interface Match {
  left: Option;
  right: Option;
}

export interface TournamentState {
  question: string;
  selectedCategory: string;
  pool: Option[];
  survivor: Option | null;
  survivorSide: 'left' | 'right';
  challengerIndex: number;
  matchCount: number;
  totalMatches: number;
  roundName: string;
  isComplete: boolean;
  champion: Option | null;
}

function getRoundName(matchCount: number, totalMatches: number): string {
  const remaining = totalMatches - matchCount;
  if (remaining >= 14) return '16강';
  if (remaining >= 6) return '8강';
  if (remaining >= 2) return '4강';
  if (remaining === 1) return '결승';
  return '우승';
}

export const GAME_CATEGORIES = [
  { id: '연애', label: '연애', emoji: '💔', desc: '연애 불호' },
  { id: '일상', label: '일상', emoji: '😤', desc: '일상 불호' },
  { id: '직장', label: '직장', emoji: '💼', desc: '직장 불호' },
  { id: '패션', label: '패션', emoji: '👗', desc: '패션 불호' },
];

export const CATEGORY_COLOR: Record<string, string> = {
  '연애': '#1E5C52',
  '일상': '#1E5C52',
  '직장': '#1E5C52',
  '패션': '#1E5C52',
};

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createTournament(
  categoriesData: Record<string, CategoryData>,
  selectedCategory: string = '연애'
): TournamentState {
  let question = '다음 중 더 불호인 것은?';
  let optionPool: Option[] = [];

  const catData = categoriesData[selectedCategory];
  if (catData) {
    optionPool = catData.options || [];
    question = catData.question || question;
  }

  const pool = shuffle(optionPool).slice(0, 16);
  const totalMatches = pool.length - 1;

  return {
    question,
    selectedCategory,
    pool,
    survivor: null,
    survivorSide: 'left',
    challengerIndex: 1,
    matchCount: 0,
    totalMatches,
    roundName: '16강',
    isComplete: false,
    champion: null,
  };
}

export function getCurrentMatch(state: TournamentState): Match | null {
  const { pool, survivor, survivorSide, challengerIndex } = state;

  if (challengerIndex >= pool.length) return null;

  const challenger = pool[challengerIndex];

  if (!survivor) {
    return { left: pool[0], right: challenger };
  }

  if (survivorSide === 'left') {
    return { left: survivor, right: challenger };
  } else {
    return { left: challenger, right: survivor };
  }
}

export function selectWinner(
  state: TournamentState,
  winner: Option,
  winnerSide: 'left' | 'right'
): TournamentState {
  const nextMatchCount = state.matchCount + 1;
  const nextChallengerIndex = state.challengerIndex + 1;
  const isComplete = nextChallengerIndex >= state.pool.length;

  if (isComplete) {
    return {
      ...state,
      survivor: winner,
      survivorSide: winnerSide,
      challengerIndex: nextChallengerIndex,
      matchCount: nextMatchCount,
      roundName: '우승',
      isComplete: true,
      champion: winner,
    };
  }

  return {
    ...state,
    survivor: winner,
    survivorSide: winnerSide,
    challengerIndex: nextChallengerIndex,
    matchCount: nextMatchCount,
    roundName: getRoundName(nextMatchCount, state.totalMatches),
    isComplete: false,
    champion: null,
  };
}

export function getProgress(state: TournamentState): number {
  return Math.min(Math.round((state.matchCount / state.totalMatches) * 100), 100);
}

export function getMatchInfo(state: TournamentState): { current: number; total: number } {
  return {
    current: state.matchCount + 1,
    total: state.totalMatches,
  };
}
