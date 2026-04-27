import { readFileSync } from 'fs';

// ── CSV parser (handles quoted fields) ──
function parseCSV(text) {
  const rows = [];
  let i = text.charCodeAt(0) === 0xFEFF ? 1 : 0;

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
    if (row.length >= 5) rows.push(row);
  }
  return rows;
}

// ── Supabase REST insert (bypasses RLS with service role key) ──
async function insertBatch(records) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const res = await fetch(`${url}/rest/v1/comments`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(records),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Insert failed (${res.status}): ${text}`);
  }
}

// ── Main ──
const csv = readFileSync('dummy_comments_201_enriched.csv', 'utf-8');
const rows = parseCSV(csv);
const data = rows.slice(1); // skip header

console.log(`Rows to insert: ${data.length}`);

const BATCH_SIZE = 500;
let inserted = 0;

for (let i = 0; i < data.length; i += BATCH_SIZE) {
  const batch = data.slice(i, i + BATCH_SIZE).map(([nickname, , content, questionId, userId]) => ({
    question_id: questionId,
    user_id: userId || null,
    guest_nickname: nickname,
    content,
  }));

  await insertBatch(batch);
  inserted += batch.length;
  console.log(`Inserted ${inserted}/${data.length}`);
}

console.log('Done!');
