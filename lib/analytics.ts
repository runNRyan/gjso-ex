import { createClient } from '@/lib/supabase/client'

type EventType =
  | 'question_view'
  | 'vote_submit'
  | 'vote_bonus_issued'
  | 'prediction_submit'
  | 'question_closed'
  | 'reward_issued'
  | 'question_suggested'

type EventMetadata = Record<string, unknown>

export async function trackEvent(
  eventType: EventType,
  metadata?: EventMetadata
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Type assertion needed until Supabase types are regenerated after migration
    await (supabase as any).from('event_logs').insert({
      event_type: eventType,
      user_id: user?.id || null,
      metadata: metadata || {},
    })
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.error('Analytics error:', error)
  }
}
