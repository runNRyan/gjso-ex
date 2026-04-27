#!/usr/bin/env node
/**
 * SEED-90: Seed dummy comments from CSV
 * - 20,000 comments from dummy_comments_20.csv
 * - Comment created_at: random between vote time and 2026-03-09
 *
 * Usage: node scripts/seed-comments.mjs
 * Requires: dummy users + votes already seeded
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

// ── Parse CSV (handles quoted fields with commas) ──
function parseCSV(path) {
  let content = readFileSync(path, 'utf-8')
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)
  const lines = content.split(/\r?\n/).filter(l => l.trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i])
    if (fields.length < 5) continue
    const [nickname, qid, , , comment] = fields
    if (!nickname || !qid || !comment) continue
    rows.push({
      nickname: nickname.trim(),
      qid: qid.trim(),
      comment: comment.trim()
    })
  }
  return rows
}

function parseCSVLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current)
  return fields
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
      const { error } = await supabase.from(table).insert(batch)
      if (!error) break
      console.error(`  Error ${table} batch ${Math.floor(i / batchSize)} (attempt ${attempt + 1}):`, error.message)
      if (attempt === 2) throw error
      await sleep(3000 * (attempt + 1))
    }
    inserted += batch.length
    if (inserted % 5000 === 0 || inserted === rows.length) {
      console.log(`  ${table}: ${inserted}/${rows.length}`)
    }
    if (i % 3000 === 0 && i > 0) await sleep(500)
  }
  return inserted
}

// ── Main ──
async function main() {
  console.log('=== SEED-90 Dummy Comments ===\n')

  // 1. Read CSV
  console.log('Step 1: Reading CSV...')
  const csvPath = resolve(ROOT, 'dummy_comments_20.csv')
  const rows = parseCSV(csvPath)
  console.log(`  CSV rows: ${rows.length}`)

  // 2. Fetch dummy users
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

  // 4. Fetch vote times for realistic comment timestamps
  console.log('\nStep 4: Fetching vote timestamps...')
  const voteTimeMap = {} // `${userId}_${questionId}` → created_at
  // Fetch in batches by user
  const userIds = Object.values(userMap)
  for (let i = 0; i < userIds.length; i += 100) {
    const batch = userIds.slice(i, i + 100)
    const { data: votes } = await supabase
      .from('votes')
      .select('user_id, question_id, created_at')
      .in('user_id', batch)
    if (votes) {
      for (const v of votes) {
        voteTimeMap[`${v.user_id}_${v.question_id}`] = new Date(v.created_at)
      }
    }
    if (i % 500 === 0 && i > 0) console.log(`  Vote times: ${i}/${userIds.length} users`)
  }
  console.log(`  Vote time entries: ${Object.keys(voteTimeMap).length}`)

  // 5. Build comment records
  console.log('\nStep 5: Building comment records...')
  const commentRecords = []
  let skipped = 0

  for (const row of rows) {
    const userId = userMap[row.nickname]
    const qInfo = qMap[row.qid]
    if (!userId || !qInfo) { skipped++; continue }

    const voteKey = `${userId}_${qInfo.id}`
    const voteTime = voteTimeMap[voteKey]
    // Comment time: after vote (or after published_at if no vote found)
    const startTime = voteTime || qInfo.published_at
    const commentTime = randomBetween(startTime.getTime(), DEADLINE.getTime())

    commentRecords.push({
      question_id: qInfo.id,
      user_id: userId,
      content: row.comment,
      created_at: commentTime.toISOString(),
      updated_at: commentTime.toISOString()
    })
  }

  console.log(`  Comments to insert: ${commentRecords.length}, skipped: ${skipped}`)

  // 6. Insert comments
  console.log('\nStep 6: Inserting comments...')
  const inserted = await batchInsert('comments', commentRecords, 300)
  console.log(`  Comments inserted: ${inserted}`)

  // 7. Verify
  console.log('\n=== Verification ===')
  const { count } = await supabase.from('comments').select('*', { count: 'exact', head: true })
  console.log(`  Total comments: ${count}`)

  console.log('\n=== Done! ===')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
