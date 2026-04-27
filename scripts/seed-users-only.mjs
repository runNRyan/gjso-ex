#!/usr/bin/env node
/**
 * SEED-90: Seed dummy users only (1000 users)
 *
 * Usage: node scripts/seed-users-only.mjs [--cleanup]
 *   --cleanup: Delete existing dummy users first
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Parse CSV to get unique nicknames ──
function getUniqueNicknames(csvPath) {
  let content = readFileSync(csvPath, 'utf-8')
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)
  const lines = content.split(/\r?\n/).filter(l => l.trim())
  const nicknames = new Set()
  for (let i = 1; i < lines.length; i++) {
    const nickname = lines[i].split(',')[0]?.trim()
    if (nickname) nicknames.add(nickname)
  }
  return [...nicknames]
}

// ── Cleanup existing dummy users ──
async function cleanupDummyUsers() {
  console.log('Cleaning up existing dummy users...')

  // List all users and filter dummy ones
  let page = 1
  let deleted = 0
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) { console.error('List error:', error.message); break }
    if (!users || users.length === 0) break

    const dummyUsers = users.filter(u => u.email?.endsWith('@example.fake'))
    for (const user of dummyUsers) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(user.id)
      if (delErr) {
        console.error(`  Delete error [${user.email}]: ${delErr.message}`)
      } else {
        deleted++
      }
      if (deleted % 50 === 0 && deleted > 0) {
        console.log(`  Deleted: ${deleted}`)
        await sleep(300)
      }
    }

    if (users.length < 1000) break
    page++
  }
  console.log(`  Total deleted: ${deleted}\n`)
}

async function main() {
  console.log('=== SEED-90: Create Dummy Users ===\n')

  const doCleanup = process.argv.includes('--cleanup')

  if (doCleanup) {
    await cleanupDummyUsers()
  }

  const nicknames = getUniqueNicknames(resolve(ROOT, 'dummy_data.csv'))
  console.log(`Unique nicknames: ${nicknames.length}\n`)

  let created = 0
  let skipped = 0
  let errors = 0
  const userMap = {} // nickname → userId

  for (let i = 0; i < nicknames.length; i++) {
    const nickname = nicknames[i]
    // Use index-based email to avoid collisions
    const email = `dummy_${String(i + 1).padStart(4, '0')}@example.fake`

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: 'DummyPass1234!',
      email_confirm: true,
      user_metadata: { nickname }
    })

    if (error) {
      if (error.message.includes('already been registered')) {
        skipped++
      } else {
        errors++
        if (errors <= 5) console.error(`  Error [${nickname}]: ${error.message}`)
      }
    } else {
      userMap[nickname] = data.user.id
      created++
    }

    const total = created + skipped + errors
    if (total % 100 === 0) {
      console.log(`  Progress: ${total}/${nicknames.length} (created: ${created}, skipped: ${skipped}, errors: ${errors})`)
    }

    // Rate limit
    if (created > 0 && created % 50 === 0) await sleep(300)
  }

  console.log(`\n=== Result ===`)
  console.log(`  Created: ${created}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`  Errors: ${errors}`)

  // Update profiles: nickname + user_type
  if (created > 0) {
    console.log(`\nUpdating profiles with nickname & user_type=member...`)
    let updated = 0

    for (const [nickname, userId] of Object.entries(userMap)) {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname, user_type: 'member' })
        .eq('id', userId)

      if (!error) updated++
      if (updated % 200 === 0 && updated > 0) {
        console.log(`  Profiles: ${updated}/${Object.keys(userMap).length}`)
      }
    }
    console.log(`  Profiles updated: ${updated}`)
  }

  // Verify
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'member')
  console.log(`\nTotal member profiles: ${count}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
