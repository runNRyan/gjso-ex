import { readFileSync, writeFileSync } from 'fs';

// ── CSV parser (handles quoted fields) ──
function parseCSV(text) {
  const rows = [];
  let i = text.charCodeAt(0) === 0xFEFF ? 1 : 0; // skip BOM

  while (i < text.length) {
    const row = [];
    while (i < text.length) {
      let value = '';
      if (text[i] === '"') {
        i++;
        while (i < text.length) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') { value += '"'; i += 2; }
            else { i++; break; }
          } else { value += text[i]; i++; }
        }
      } else {
        while (i < text.length && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          value += text[i]; i++;
        }
      }
      row.push(value);
      if (i < text.length && text[i] === ',') { i++; } else { break; }
    }
    if (i < text.length && text[i] === '\r') i++;
    if (i < text.length && text[i] === '\n') i++;
    if (row.length >= 3) rows.push(row);
  }
  return rows;
}

function escapeCSV(val) {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ── Supabase REST API (bypasses RLS with service role key) ──
async function fetchAllRest(table, columns) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const all = [];
  let offset = 0;
  const limit = 50; // Supabase project max_rows = 50

  while (true) {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=${columns}&offset=${offset}&limit=${limit}`,
      {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'count=exact',
        },
      }
    );
    if (!res.ok) {
      console.error(`REST error for ${table}:`, res.status, await res.text());
      process.exit(1);
    }
    const data = await res.json();
    all.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

// ── Main ──
const csv = readFileSync('dummy_comments_201.csv', 'utf-8');
const rows = parseCSV(csv);
const data = rows.slice(1); // skip header

console.log(`CSV rows: ${data.length}`);

// Fetch questions (title → id)
const questions = await fetchAllRest('questions', 'id,title');

const questionMap = new Map();
for (const q of questions) {
  if (!questionMap.has(q.title)) questionMap.set(q.title, q.id);
}
console.log(`Questions loaded: ${questions.length} (${questionMap.size} unique titles)`);

// Fetch profiles (nickname → id)
const profiles = await fetchAllRest('profiles', 'id,nickname');

const profileMap = new Map();
for (const p of profiles) {
  if (p.nickname && !profileMap.has(p.nickname)) profileMap.set(p.nickname, p.id);
}
console.log(`Profiles loaded: ${profiles.length} (${profileMap.size} unique nicknames)`);

// Enrich
let matchedQ = 0, unmatchedQ = 0;
let matchedP = 0, unmatchedP = 0;
const unmatchedTitles = new Set();
const unmatchedNicknames = new Set();

const outputRows = ['\uFEFF아이디명,질문내용,댓글,question_id,user_id'];

for (const [nickname, title, content] of data) {
  const qId = questionMap.get(title) || '';
  const uId = profileMap.get(nickname) || '';

  if (qId) matchedQ++; else { unmatchedQ++; unmatchedTitles.add(title); }
  if (uId) matchedP++; else { unmatchedP++; unmatchedNicknames.add(nickname); }

  outputRows.push(
    [escapeCSV(nickname), escapeCSV(title), escapeCSV(content), qId, uId].join(',')
  );
}

const outFile = 'dummy_comments_201_enriched.csv';
writeFileSync(outFile, outputRows.join('\n'), 'utf-8');

console.log(`\n=== Results ===`);
console.log(`Questions — matched: ${matchedQ}, unmatched: ${unmatchedQ}`);
console.log(`Profiles  — matched: ${matchedP}, unmatched: ${unmatchedP}`);
if (unmatchedTitles.size > 0) {
  console.log(`\nUnmatched question titles (${unmatchedTitles.size}):`);
  for (const t of unmatchedTitles) console.log(`  - "${t}"`);
}
if (unmatchedNicknames.size > 0) {
  console.log(`\nUnmatched nicknames (${unmatchedNicknames.size}):`);
  for (const n of [...unmatchedNicknames].slice(0, 20)) console.log(`  - "${n}"`);
  if (unmatchedNicknames.size > 20) console.log(`  ... and ${unmatchedNicknames.size - 20} more`);
}
console.log(`\nOutput: ${outFile}`);
