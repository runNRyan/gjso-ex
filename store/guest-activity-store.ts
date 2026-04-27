import { create } from 'zustand'
import {
  getGuestActivity,
  recordGuestVote,
  recordGuestPrediction,
  changeGuestVote,
  withdrawGuestVote,
  clearGuestActivity,
  type GuestActivity,
} from '@/lib/guest'

interface GuestActivityState {
  activityCount: number
  virtualPoints: number
  votes: GuestActivity['votes']
  predictions: GuestActivity['predictions']
  isGuest: boolean
  hydrate: () => void
  recordVote: (questionId: string, choice: 'a' | 'b') => void
  recordPrediction: (questionId: string, predictionType: 'a' | 'b' | 'golden') => void
  changeVote: (questionId: string, newChoice: 'a' | 'b') => void
  withdrawVote: (questionId: string) => void
  clear: () => void
  setIsGuest: (isGuest: boolean) => void
}

export const useGuestActivityStore = create<GuestActivityState>((set) => ({
  activityCount: 0,
  virtualPoints: 0,
  votes: [],
  predictions: [],
  isGuest: false,

  hydrate: () => {
    const activity = getGuestActivity()
    set({
      activityCount: activity.activityCount,
      virtualPoints: activity.virtualPoints,
      votes: activity.votes,
      predictions: activity.predictions,
    })
  },

  recordVote: (questionId, choice) => {
    const activity = recordGuestVote(questionId, choice)
    set({
      activityCount: activity.activityCount,
      virtualPoints: activity.virtualPoints,
      votes: [...activity.votes],
    })
  },

  recordPrediction: (questionId, predictionType) => {
    const activity = recordGuestPrediction(questionId, predictionType)
    set({
      activityCount: activity.activityCount,
      virtualPoints: activity.virtualPoints,
      predictions: [...activity.predictions],
    })
  },

  changeVote: (questionId, newChoice) => {
    const activity = changeGuestVote(questionId, newChoice)
    set({ votes: [...activity.votes] })
  },

  withdrawVote: (questionId) => {
    const activity = withdrawGuestVote(questionId)
    set({
      activityCount: activity.activityCount,
      virtualPoints: activity.virtualPoints,
      votes: [...activity.votes],
      predictions: [...activity.predictions],
    })
  },

  clear: () => {
    clearGuestActivity()
    set({
      activityCount: 0,
      virtualPoints: 0,
      votes: [],
      predictions: [],
      isGuest: false,
    })
  },

  setIsGuest: (isGuest) => set({ isGuest }),
}))
