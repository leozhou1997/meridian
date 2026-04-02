import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check snapshots for deal 210001 (包钢集团)
console.log('=== SNAPSHOTS for 包钢集团 (210001) ===');
const [snaps1] = await conn.query(
  'SELECT id, date, confidenceScore, confidenceChange, interactionType, LEFT(whatsHappening, 80) as wh, JSON_LENGTH(keyRisks) as riskCount, JSON_LENGTH(whatsNext) as nextCount FROM snapshots WHERE dealId = 210001 ORDER BY date ASC'
);
for (const s of snaps1) {
  console.log(`  ${s.id} | ${new Date(s.date).toISOString().split('T')[0]} | ${s.confidenceScore}% | type: ${s.interactionType} | risks: ${s.riskCount} | next: ${s.nextCount} | wh: ${s.wh}...`);
}

// Check snapshots for deal 210002 (江西铜业)
console.log('\n=== SNAPSHOTS for 江西铜业 (210002) ===');
const [snaps2] = await conn.query(
  'SELECT id, date, confidenceScore, confidenceChange, interactionType, LEFT(whatsHappening, 80) as wh, JSON_LENGTH(keyRisks) as riskCount, JSON_LENGTH(whatsNext) as nextCount FROM snapshots WHERE dealId = 210002 ORDER BY date ASC'
);
for (const s of snaps2) {
  console.log(`  ${s.id} | ${new Date(s.date).toISOString().split('T')[0]} | ${s.confidenceScore}% | type: ${s.interactionType} | risks: ${s.riskCount} | next: ${s.nextCount} | wh: ${s.wh}...`);
}

// Check meetings for deal 210001
console.log('\n=== MEETINGS for 包钢集团 (210001) ===');
const [meets1] = await conn.query(
  'SELECT id, date, type, keyParticipant, LEFT(summary, 80) as summary, attachmentUrl IS NOT NULL as hasAttachment FROM meetings WHERE dealId = 210001 ORDER BY date ASC'
);
for (const m of meets1) {
  console.log(`  ${m.id} | ${new Date(m.date).toISOString().split('T')[0]} | ${m.type} | ${m.keyParticipant} | attach: ${m.hasAttachment} | ${m.summary}...`);
}

// Check meetings for deal 210002
console.log('\n=== MEETINGS for 江西铜业 (210002) ===');
const [meets2] = await conn.query(
  'SELECT id, date, type, keyParticipant, LEFT(summary, 80) as summary, attachmentUrl IS NOT NULL as hasAttachment FROM meetings WHERE dealId = 210002 ORDER BY date ASC'
);
for (const m of meets2) {
  console.log(`  ${m.id} | ${new Date(m.date).toISOString().split('T')[0]} | ${m.type} | ${m.keyParticipant} | attach: ${m.hasAttachment} | ${m.summary}...`);
}

// Check strategy notes
console.log('\n=== STRATEGY NOTES for 包钢集团 (210001) ===');
const [notes1] = await conn.query(
  'SELECT id, title, category, LEFT(content, 80) as content, date FROM strategy_notes WHERE dealId = 210001 ORDER BY date ASC'
);
for (const n of notes1) {
  console.log(`  ${n.id} | ${n.date ? new Date(n.date).toISOString().split('T')[0] : 'no date'} | ${n.category} | ${n.title} | ${n.content}...`);
}

console.log('\n=== STRATEGY NOTES for 江西铜业 (210002) ===');
const [notes2] = await conn.query(
  'SELECT id, title, category, LEFT(content, 80) as content, date FROM strategy_notes WHERE dealId = 210002 ORDER BY date ASC'
);
for (const n of notes2) {
  console.log(`  ${n.id} | ${n.date ? new Date(n.date).toISOString().split('T')[0] : 'no date'} | ${n.category} | ${n.title} | ${n.content}...`);
}

await conn.end();
