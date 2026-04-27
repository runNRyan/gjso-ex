#!/usr/bin/env node
/**
 * SEED-90: Trim votes to 80~150 per user for natural distribution
 * Also removes orphaned predictions (prediction without a vote)
 *
 * Triggers handle: vote_count update, point_balance refund, point_history cleanup
 *
 * Usage: node scripts/trim-votes.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const envContent = readFileSync(resolve(ROOT, '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const [k, ...rest] = l.split('=')
      return [k.trim(), rest.join('=').trim().replace(/^"|"$/g, '')]
    })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  console.log('=== Trim Votes: 80~150 per user ===\n')

  // 1. Get all dummy user IDs
  const userIds = []
  let page = 1
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !users || users.length === 0) break
    for (const u of users) {
      if (u.email?.endsWith('@example.fake')) userIds.push(u.id)
    }
    if (users.length < 1000) break
    page++
  }
  console.log(`Dummy users: ${userIds.length}`)

  // 2. For each user, decide how many votes to keep (80~150)
  let totalDeleted = 0
  let totalPredDeleted = 0
  let processed = 0

  for (const userId of userIds) {
    const keepCount = 80 + Math.floor(Math.random() * 71) // 80~150

    // Get all votes for this user, ordered by created_at
    const { data: votes, error } = await supabase
      .from('votes')
      .select('id, question_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error || !votes) {
      console.error(`  Error fetching votes for ${userId}:`, error?.message)
      continue
    }

    if (votes.length <= keepCount) {
      processed++
      continue
    }

    // Delete excess votes (remove from the end = newer votes)
    const toDelete = votes.slice(keepCount)
    const deleteIds = toDelete.map(v => v.id)
    const deleteQuestionIds = toDelete.map(v => v.question_id)

    // Delete predictions for these question+user combos first
    for (const qId of deleteQuestionIds) {
      const { count } = await supabase
        .from('predictions')
        .delete({ count: 'exact' })
        .eq('user_id', userId)
        .eq('question_id', qId)

      totalPredDeleted += (count || 0)
    }

    // Delete votes in batches of 100
    for (let i = 0; i < deleteIds.length; i += 100) {
      const batch = deleteIds.slice(i, i + 100)
      const { error: delErr } = await supabase
        .from('votes')
        .delete()
        .in('id', batch)

      if (delErr) {
        console.error(`  Delete error for user ${userId}:`, delErr.message)
      }
    }

    totalDeleted += toDelete.length
    processed++

    if (processed % 100 === 0) {
      console.log(`  Progress: ${processed}/${userIds.length} users, deleted ${totalDeleted} votes, ${totalPredDeleted} predictions`)
      await sleep(500)
    }
  }

  console.log(`\n=== Result ===`)
  console.log(`  Users processed: ${processed}`)
  console.log(`  Votes deleted: ${totalDeleted}`)
  console.log(`  Predictions deleted: ${totalPredDeleted}`)

  // 3. Verify distribution
  console.log('\n=== Point Distribution (top 10) ===')
  const { data: dist } = await supabase.rpc('get_point_distribution').select()
    .catch(() => ({ data: null }))

  // Fallback: manual check
  const { count: voteCount } = await supabase.from('votes').select('*', { count: 'exact', head: true })
  const { count: predCount } = await supabase.from('predictions').select('*', { count: 'exact', head: true })
  console.log(`  Remaining votes: ${voteCount}`)
  console.log(`  Remaining predictions: ${predCount}`)

  console.log('\n=== Done! ===')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
