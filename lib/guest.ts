export type GuestActivity = {
  schemaVersion: 1
  guestId: string
  votes: Array<{ questionId: string; choice: 'a' | 'b'; timestamp: number }>
  predictions: Array<{ questionId: string; predictionType: 'a' | 'b' | 'golden'; timestamp: number }>
  virtualPoints: number
  activityCount: number
}

const GUEST_ID_KEY = 'app_guest_id'
const GUEST_ACTIVITY_KEY = 'app_guest_activity'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getGuestId(): string {
  if (!isBrowser()) return ''

  let id = localStorage.getItem(GUEST_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(GUEST_ID_KEY, id)
  }
  return id
}

function defaultActivity(): GuestActivity {
  return {
    schemaVersion: 1,
    guestId: getGuestId(),
    votes: [],
    predictions: [],
    virtualPoints: 0,
    activityCount: 0,
  }
}

export function getGuestActivity(): GuestActivity {
  if (!isBrowser()) return defaultActivity()

  try {
    const raw = localStorage.getItem(GUEST_ACTIVITY_KEY)
    if (!raw) return defaultActivity()
    const parsed = JSON.parse(raw) as GuestActivity
    if (parsed.schemaVersion !== 1) return defaultActivity()
    return parsed
  } catch {
    return defaultActivity()
  }
}

function saveGuestActivity(activity: GuestActivity): void {
  if (!isBrowser()) return
  localStorage.setItem(GUEST_ACTIVITY_KEY, JSON.stringify(activity))
}

export function hasGuestVoted(questionId: string): boolean {
  const activity = getGuestActivity()
  return activity.votes.some(v => v.questionId === questionId)
}

export function hasGuestPredicted(questionId: string): boolean {
  const activity = getGuestActivity()
  return activity.predictions.some(p => p.questionId === questionId)
}

export function getGuestVoteChoice(questionId: string): 'a' | 'b' | null {
  const activity = getGuestActivity()
  const vote = activity.votes.find(v => v.questionId === questionId)
  return vote?.choice ?? null
}

export function recordGuestVote(questionId: string, choice: 'a' | 'b'): GuestActivity {
  const activity = getGuestActivity()

  if (activity.votes.some(v => v.questionId === questionId)) {
    return activity
  }

  activity.votes.push({ questionId, choice, timestamp: Date.now() })
  activity.virtualPoints += 10
  activity.activityCount += 1
  saveGuestActivity(activity)
  return activity
}

export function changeGuestVote(questionId: string, newChoice: 'a' | 'b'): GuestActivity {
  const activity = getGuestActivity()
  const vote = activity.votes.find(v => v.questionId === questionId)
  if (vote) {
    vote.choice = newChoice
    vote.timestamp = Date.now()
  }
  saveGuestActivity(activity)
  return activity
}

export function withdrawGuestVote(questionId: string): GuestActivity {
  const activity = getGuestActivity()
  const idx = activity.votes.findIndex(v => v.questionId === questionId)
  if (idx !== -1) {
    activity.votes.splice(idx, 1)
    activity.virtualPoints = Math.max(0, activity.virtualPoints - 10)
    activity.activityCount = Math.max(0, activity.activityCount - 1)
  }
  // Also remove any prediction for this question
  const predIdx = activity.predictions.findIndex(p => p.questionId === questionId)
  if (predIdx !== -1) {
    const pred = activity.predictions[predIdx]
    const points = pred.predictionType === 'golden' ? 1000 : 100
    activity.predictions.splice(predIdx, 1)
    activity.virtualPoints = Math.max(0, activity.virtualPoints - points)
    activity.activityCount = Math.max(0, activity.activityCount - 1)
  }
  saveGuestActivity(activity)
  return activity
}

export function recordGuestPrediction(questionId: string, predictionType: 'a' | 'b' | 'golden'): GuestActivity {
  const activity = getGuestActivity()

  if (activity.predictions.some(p => p.questionId === questionId)) {
    return activity
  }

  activity.predictions.push({ questionId, predictionType, timestamp: Date.now() })
  activity.virtualPoints += predictionType === 'golden' ? 1000 : 100
  activity.activityCount += 1
  saveGuestActivity(activity)
  return activity
}

export function clearGuestActivity(): void {
  if (!isBrowser()) return
  localStorage.removeItem(GUEST_ACTIVITY_KEY)
  localStorage.removeItem(GUEST_ID_KEY)
}
