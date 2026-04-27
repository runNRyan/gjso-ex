export interface Vote {
  id: number
  questionId: string
  question: string
  optionA: string
  optionB: string
  myChoice: 'A' | 'B'
  resultA: number
  resultB: number
  status: 'closed' | 'live'
  closedAt: string
  closeAt: string | null
  category: string
  isNew: boolean
  voteCreatedAt: string
}

export interface Prediction {
  id: number
  questionId: string
  question: string
  optionA: string
  optionB: string
  myPrediction: 'A' | 'B'
  resultA: number
  resultB: number
  majorityChoice: 'A' | 'B'
  isCorrect: boolean
  status: 'closed' | 'live'
  closedAt: string
  isNew: boolean
}

export interface PointEntry {
  id: number
  date: string
  type: 'vote' | 'predict' | 'bonus'
  question: string
  points: number
  desc: string
}

export const MOCK_VOTES: Vote[] = [
  { id: 1, questionId: 'q1', question: '월요일 아침 vs 일요일 저녁', optionA: '월요일 아침', optionB: '일요일 저녁', myChoice: 'A', resultA: 1847, resultB: 1253, status: 'closed', closedAt: '2026-02-28', closeAt: null, category: '일상', isNew: true, voteCreatedAt: '2026-02-27T10:00:00Z' },
  { id: 2, questionId: 'q2', question: '소개팅 노쇼 vs 소개팅 3시간 지각', optionA: '소개팅 노쇼', optionB: '소개팅 3시간 지각', myChoice: 'B', resultA: 2105, resultB: 895, status: 'closed', closedAt: '2026-02-25', closeAt: null, category: '연애', isNew: true, voteCreatedAt: '2026-02-24T10:00:00Z' },
  { id: 3, questionId: 'q3', question: '여름에 에어컨 고장 vs 겨울에 보일러 고장', optionA: '에어컨 고장', optionB: '보일러 고장', myChoice: 'A', resultA: 1560, resultB: 2440, status: 'closed', closedAt: '2026-02-20', closeAt: null, category: '일상', isNew: false, voteCreatedAt: '2026-02-19T10:00:00Z' },
  { id: 4, questionId: 'q4', question: '상사한테 혼나기 vs 후배한테 무시당하기', optionA: '상사한테 혼나기', optionB: '후배한테 무시당하기', myChoice: 'B', resultA: 1320, resultB: 1680, status: 'closed', closedAt: '2026-02-15', closeAt: null, category: '직장', isNew: false, voteCreatedAt: '2026-02-14T10:00:00Z' },
  { id: 6, questionId: 'q6', question: '치킨 못먹기 vs 피자 못먹기', optionA: '치킨 못먹기', optionB: '피자 못먹기', myChoice: 'A', resultA: 3210, resultB: 1790, status: 'closed', closedAt: '2026-02-10', closeAt: null, category: '음식', isNew: false, voteCreatedAt: '2026-02-09T10:00:00Z' },
  { id: 8, questionId: 'q8', question: '지하철 만원 vs 버스 환승 3번', optionA: '지하철 만원', optionB: '버스 환승 3번', myChoice: 'A', resultA: 1980, resultB: 1020, status: 'closed', closedAt: '2026-02-05', closeAt: null, category: '일상', isNew: false, voteCreatedAt: '2026-02-04T10:00:00Z' },
  { id: 9, questionId: 'q9', question: '알람 10개 울리기 vs 알람 없이 일어나기', optionA: '알람 10개', optionB: '알람 없이', myChoice: 'A', resultA: 2800, resultB: 1200, status: 'closed', closedAt: '2026-01-30', closeAt: null, category: '일상', isNew: false, voteCreatedAt: '2026-01-29T10:00:00Z' },
  { id: 10, questionId: 'q10', question: '카톡 안읽씹 vs 카톡 읽씹', optionA: '안읽씹', optionB: '읽씹', myChoice: 'B', resultA: 1100, resultB: 2900, status: 'closed', closedAt: '2026-01-25', closeAt: null, category: '연애', isNew: false, voteCreatedAt: '2026-01-24T10:00:00Z' },
  { id: 11, questionId: 'q11', question: '회식 2차 노래방 vs 회식 2차 포차', optionA: '노래방', optionB: '포차', myChoice: 'A', resultA: 1750, resultB: 2250, status: 'closed', closedAt: '2026-01-20', closeAt: null, category: '직장', isNew: false, voteCreatedAt: '2026-01-19T10:00:00Z' },
  { id: 12, questionId: 'q12', question: '짜장면 곱빼기 vs 짬뽕 곱빼기', optionA: '짜장 곱빼기', optionB: '짬뽕 곱빼기', myChoice: 'B', resultA: 1600, resultB: 2400, status: 'closed', closedAt: '2026-01-15', closeAt: null, category: '음식', isNew: false, voteCreatedAt: '2026-01-14T10:00:00Z' },
]

export const MOCK_PREDICTIONS: Prediction[] = [
  { id: 1, questionId: 'q1', question: '월요일 아침 vs 일요일 저녁', optionA: '월요일 아침', optionB: '일요일 저녁', myPrediction: 'A', resultA: 1847, resultB: 1253, majorityChoice: 'A', isCorrect: true, status: 'closed', closedAt: '2026-02-28', isNew: true },
  { id: 2, questionId: 'q2', question: '소개팅 노쇼 vs 소개팅 3시간 지각', optionA: '소개팅 노쇼', optionB: '소개팅 3시간 지각', myPrediction: 'A', resultA: 2105, resultB: 895, majorityChoice: 'A', isCorrect: true, status: 'closed', closedAt: '2026-02-25', isNew: true },
  { id: 3, questionId: 'q3', question: '여름에 에어컨 고장 vs 겨울에 보일러 고장', optionA: '에어컨 고장', optionB: '보일러 고장', myPrediction: 'A', resultA: 1560, resultB: 2440, majorityChoice: 'B', isCorrect: false, status: 'closed', closedAt: '2026-02-20', isNew: false },
  { id: 4, questionId: 'q4', question: '상사한테 혼나기 vs 후배한테 무시당하기', optionA: '상사한테 혼나기', optionB: '후배한테 무시당하기', myPrediction: 'B', resultA: 1320, resultB: 1680, majorityChoice: 'B', isCorrect: true, status: 'closed', closedAt: '2026-02-15', isNew: false },
  { id: 6, questionId: 'q6', question: '치킨 못먹기 vs 피자 못먹기', optionA: '치킨 못먹기', optionB: '피자 못먹기', myPrediction: 'A', resultA: 3210, resultB: 1790, majorityChoice: 'A', isCorrect: true, status: 'closed', closedAt: '2026-02-10', isNew: false },
  { id: 7, questionId: 'q7', question: '지하철 만원 vs 버스 환승 3번', optionA: '지하철 만원', optionB: '버스 환승 3번', myPrediction: 'A', resultA: 1980, resultB: 1020, majorityChoice: 'A', isCorrect: true, status: 'closed', closedAt: '2026-02-05', isNew: false },
  { id: 8, questionId: 'q8', question: '알람 10개 울리기 vs 알람 없이 일어나기', optionA: '알람 10개', optionB: '알람 없이', myPrediction: 'A', resultA: 2800, resultB: 1200, majorityChoice: 'A', isCorrect: true, status: 'closed', closedAt: '2026-01-30', isNew: false },
  { id: 9, questionId: 'q9', question: '카톡 안읽씹 vs 카톡 읽씹', optionA: '안읽씹', optionB: '읽씹', myPrediction: 'A', resultA: 1100, resultB: 2900, majorityChoice: 'B', isCorrect: false, status: 'closed', closedAt: '2026-01-25', isNew: false },
  { id: 10, questionId: 'q10', question: '회식 2차 노래방 vs 회식 2차 포차', optionA: '노래방', optionB: '포차', myPrediction: 'B', resultA: 1750, resultB: 2250, majorityChoice: 'B', isCorrect: true, status: 'closed', closedAt: '2026-01-20', isNew: false },
  { id: 11, questionId: 'q11', question: '짜장면 곱빼기 vs 짬뽕 곱빼기', optionA: '짜장 곱빼기', optionB: '짬뽕 곱빼기', myPrediction: 'B', resultA: 1600, resultB: 2400, majorityChoice: 'B', isCorrect: true, status: 'closed', closedAt: '2026-01-15', isNew: false },
]

export const MOCK_POINTS: PointEntry[] = [
  { id: 1, date: '2026-02-28', type: 'vote', question: '월요일 아침 vs 일요일 저녁', points: 10, desc: '투표 참여' },
  { id: 2, date: '2026-02-28', type: 'predict', question: '월요일 아침 vs 일요일 저녁', points: 10, desc: '예측 참여' },
  { id: 3, date: '2026-02-28', type: 'bonus', question: '월요일 아침 vs 일요일 저녁', points: 50, desc: '예측 적중' },
  { id: 4, date: '2026-02-25', type: 'vote', question: '소개팅 노쇼 vs 소개팅 3시간 지각', points: 10, desc: '투표 참여' },
  { id: 5, date: '2026-02-25', type: 'predict', question: '소개팅 노쇼 vs 소개팅 3시간 지각', points: 10, desc: '예측 참여' },
  { id: 6, date: '2026-02-25', type: 'bonus', question: '소개팅 노쇼 vs 소개팅 3시간 지각', points: 50, desc: '예측 적중' },
  { id: 7, date: '2026-02-20', type: 'vote', question: '여름에 에어컨 고장 vs 겨울에 보일러 고장', points: 10, desc: '투표 참여' },
  { id: 8, date: '2026-02-20', type: 'predict', question: '여름에 에어컨 고장 vs 겨울에 보일러 고장', points: 10, desc: '예측 참여' },
  { id: 9, date: '2026-02-15', type: 'vote', question: '상사한테 혼나기 vs 후배한테 무시당하기', points: 10, desc: '투표 참여' },
  { id: 10, date: '2026-02-15', type: 'predict', question: '상사한테 혼나기 vs 후배한테 무시당하기', points: 10, desc: '예측 참여' },
  { id: 11, date: '2026-02-15', type: 'bonus', question: '상사한테 혼나기 vs 후배한테 무시당하기', points: 50, desc: '예측 적중' },
  { id: 12, date: '2026-02-10', type: 'vote', question: '치킨 못먹기 vs 피자 못먹기', points: 10, desc: '투표 참여' },
  { id: 13, date: '2026-02-10', type: 'predict', question: '치킨 못먹기 vs 피자 못먹기', points: 10, desc: '예측 참여' },
  { id: 14, date: '2026-02-10', type: 'bonus', question: '치킨 못먹기 vs 피자 못먹기', points: 50, desc: '예측 적중' },
  { id: 15, date: '2026-02-05', type: 'vote', question: '지하철 만원 vs 버스 환승 3번', points: 10, desc: '투표 참여' },
  { id: 16, date: '2026-02-05', type: 'predict', question: '지하철 만원 vs 버스 환승 3번', points: 10, desc: '예측 참여' },
  { id: 17, date: '2026-02-05', type: 'bonus', question: '지하철 만원 vs 버스 환승 3번', points: 50, desc: '예측 적중' },
  { id: 18, date: '2026-01-30', type: 'vote', question: '알람 10개 울리기 vs 알람 없이 일어나기', points: 10, desc: '투표 참여' },
  { id: 19, date: '2026-01-30', type: 'predict', question: '알람 10개 울리기 vs 알람 없이 일어나기', points: 10, desc: '예측 참여' },
  { id: 20, date: '2026-01-30', type: 'bonus', question: '알람 10개 울리기 vs 알람 없이 일어나기', points: 50, desc: '예측 적중' },
  { id: 21, date: '2026-01-25', type: 'vote', question: '카톡 안읽씹 vs 카톡 읽씹', points: 10, desc: '투표 참여' },
  { id: 22, date: '2026-01-25', type: 'predict', question: '카톡 안읽씹 vs 카톡 읽씹', points: 10, desc: '예측 참여' },
  { id: 23, date: '2026-01-20', type: 'vote', question: '회식 2차 노래방 vs 회식 2차 포차', points: 10, desc: '투표 참여' },
  { id: 24, date: '2026-01-20', type: 'predict', question: '회식 2차 노래방 vs 회식 2차 포차', points: 10, desc: '예측 참여' },
  { id: 25, date: '2026-01-20', type: 'bonus', question: '회식 2차 노래방 vs 회식 2차 포차', points: 50, desc: '예측 적중' },
  { id: 26, date: '2026-01-15', type: 'vote', question: '짜장면 곱빼기 vs 짬뽕 곱빼기', points: 10, desc: '투표 참여' },
  { id: 27, date: '2026-01-15', type: 'predict', question: '짜장면 곱빼기 vs 짬뽕 곱빼기', points: 10, desc: '예측 참여' },
  { id: 28, date: '2026-01-15', type: 'bonus', question: '짜장면 곱빼기 vs 짬뽕 곱빼기', points: 50, desc: '예측 적중' },
]
