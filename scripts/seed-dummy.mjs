#!/usr/bin/env node
/**
 * SEED-90: Seed dummy votes & predictions
 * - 150K votes + ~120K predictions from CSV (published questions)
 * - Legend questions: random votes/predictions from existing dummy users
 * - Vote created_at: random between published_at and 2026-03-09
 * - Prediction created_at: vote time + random 0~5 min
 * - No prediction without a vote
 *
 * Usage: node scripts/seed-dummy.mjs
 * Requires: 1000 dummy users already created (seed-users-only.mjs)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Load .env.local ──
const envContent = readFileSync(resolve(ROOT, '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const [k, ...rest] = l.split('=')
      return [k.trim(), rest.join('=').trim().replace(/^"|"$/g, '')]
    })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const DEADLINE = new Date('2026-03-09T00:00:00Z')

// ── Parse CSV ──
function parseCSV(path) {
  let content = readFileSync(path, 'utf-8')
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)
  const lines = content.split(/\r?\n/).filter(l => l.trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const [nickname, qid, vote, prediction] = lines[i].split(',')
    if (!nickname || !qid || !vote) continue
    rows.push({ nickname: nickname.trim(), qid: qid.trim(), vote: vote.trim(), prediction: (prediction || '').trim() })
  }
  return rows
}

// ── Helpers ──
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function randomBetween(startMs, endMs) {
  return new Date(startMs + Math.random() * (endMs - startMs))
}

async function batchInsert(table, rows, batchSize = 300) {
  let inserted = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase.from(table).upsert(batch, { ignoreDuplicates: true })
      if (!error) break
      console.error(`  Error ${table} batch ${Math.floor(i / batchSize)} (attempt ${attempt + 1}):`, error.message)
      if (attempt === 2) throw error
      await sleep(3000 * (attempt + 1))
    }
    inserted += batch.length
    if (inserted % 5000 === 0 || inserted === rows.length) {
      console.log(`  ${table}: ${inserted}/${rows.length}`)
    }
    // Rate limit: small delay every batch
    if (i % 3000 === 0 && i > 0) await sleep(500)
  }
  return inserted
}

// ── Main ──
async function main() {
  console.log('=== SEED-90 Dummy Votes & Predictions ===\n')

  // 1. Read CSV
  console.log('Step 1: Reading CSV...')
  const csvPath = resolve(ROOT, 'dummy_data.csv')
  const rows = parseCSV(csvPath)
  console.log(`  CSV rows: ${rows.length}`)

  const nicknames = [...new Set(rows.map(r => r.nickname))]
  console.log(`  Unique users: ${nicknames.length}`)

  // 2. Fetch existing dummy users
  console.log('\nStep 2: Fetching dummy users...')
  const userMap = {} // nickname → userId
  let page = 1
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !users || users.length === 0) break
    for (const u of users) {
      if (u.email?.endsWith('@example.fake') && u.user_metadata?.nickname) {
        userMap[u.user_metadata.nickname] = u.id
      }
    }
    if (users.length < 1000) break
    page++
  }
  console.log(`  Found ${Object.keys(userMap).length} dummy users`)

  // 3. Fetch question mapping
  console.log('\nStep 3: Fetching questions...')

  // Published questions: Q001-Q191
  const { data: publishedQs } = await supabase
    .from('questions')
    .select('id, published_at')
    .eq('status', 'published')
    .order('created_at', { ascending: true })

  const qMap = {} // Q### → { id, published_at }
  publishedQs.forEach((q, i) => {
    const key = `Q${String(i + 1).padStart(3, '0')}`
    qMap[key] = { id: q.id, published_at: new Date(q.published_at) }
  })
  console.log(`  Published: ${Object.keys(qMap).length}`)

  // Legend questions
  const { data: legendQs } = await supabase
    .from('questions')
    .select('id, published_at')
    .eq('status', 'legend')
    .order('created_at', { ascending: true })

  console.log(`  Legend: ${legendQs.length}`)

  // Verify CSV question IDs
  const csvQids = [...new Set(rows.map(r => r.qid))]
  const missing = csvQids.filter(q => !qMap[q])
  if (missing.length > 0) {
    console.error(`  Missing question mappings: ${missing.join(', ')}`)
    process.exit(1)
  }

  // 4. Build vote & prediction records from CSV (random 80~150 per user)
  console.log('\nStep 4: Building records from CSV (80~150 per user)...')
  const predMapVal = { 'A': 'a', 'B': 'b', '황금밸런스': 'golden' }
  const voteRecords = []
  const predRecords = []

  // Group rows by nickname
  const rowsByUser = {}
  for (const row of rows) {
    if (!rowsByUser[row.nickname]) rowsByUser[row.nickname] = []
    rowsByUser[row.nickname].push(row)
  }

  // For each user, randomly select 80~150 rows
  for (const [nickname, userRows] of Object.entries(rowsByUser)) {
    const userId = userMap[nickname]
    if (!userId) continue

    const keepCount = 80 + Math.floor(Math.random() * 71) // 80~150
    const shuffled = [...userRows].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, keepCount)

    for (const row of selected) {
      const qInfo = qMap[row.qid]
      if (!qInfo) continue

      const voteTime = randomBetween(qInfo.published_at.getTime(), DEADLINE.getTime())

      voteRecords.push({
        question_id: qInfo.id,
        user_id: userId,
        choice: row.vote.toLowerCase(),
        created_at: voteTime.toISOString()
      })

      if (row.prediction && predMapVal[row.prediction]) {
        const predTime = new Date(voteTime.getTime() + Math.random() * 5 * 60 * 1000)
        predRecords.push({
          question_id: qInfo.id,
          user_id: userId,
          prediction: predMapVal[row.prediction],
          created_at: predTime.toISOString()
        })
      }
    }
  }

  console.log(`  CSV votes: ${voteRecords.length}, predictions: ${predRecords.length}`)

  // 5. Generate legend question votes/predictions
  console.log('\nStep 5: Generating legend question data...')
  const allUserIds = Object.values(userMap)

  for (const lq of legendQs) {
    const publishedAt = new Date(lq.published_at)
    // Each legend question gets ~150 random votes from random users
    const shuffled = [...allUserIds].sort(() => Math.random() - 0.5)
    const voterCount = 100 + Math.floor(Math.random() * 100) // 100~200 voters

    for (let i = 0; i < voterCount && i < shuffled.length; i++) {
      const voteTime = randomBetween(publishedAt.getTime(), DEADLINE.getTime())
      const choice = Math.random() < 0.5 ? 'a' : 'b'

      voteRecords.push({
        question_id: lq.id,
        user_id: shuffled[i],
        choice,
        created_at: voteTime.toISOString()
      })

      // ~80% chance of prediction
      if (Math.random() < 0.8) {
        const predChoices = ['a', 'b', 'golden']
        const prediction = predChoices[Math.floor(Math.random() * 3)]
        const predTime = new Date(voteTime.getTime() + Math.random() * 5 * 60 * 1000)
        predRecords.push({
          question_id: lq.id,
          user_id: shuffled[i],
          prediction,
          created_at: predTime.toISOString()
        })
      }
    }
  }

  console.log(`  Total votes: ${voteRecords.length}, predictions: ${predRecords.length}`)

  // 6. Insert votes
  console.log('\nStep 6: Inserting votes...')
  const votesInserted = await batchInsert('votes', voteRecords, 500)
  console.log(`  Votes inserted: ${votesInserted}`)

  // 7. Insert predictions
  console.log('\nStep 7: Inserting predictions...')
  const predsInserted = await batchInsert('predictions', predRecords, 500)
  console.log(`  Predictions inserted: ${predsInserted}`)

  // 8. Verify
  console.log('\n=== Verification ===')
  const { count: voteCount } = await supabase.from('votes').select('*', { count: 'exact', head: true })
  const { count: predCount } = await supabase.from('predictions').select('*', { count: 'exact', head: true })
  console.log(`  Total votes: ${voteCount}`)
  console.log(`  Total predictions: ${predCount}`)

  console.log('\n=== Done! ===')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
