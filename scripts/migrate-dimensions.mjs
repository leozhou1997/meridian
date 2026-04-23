/**
 * Migrate dimension keys from old model to new critical-path model.
 * 
 * Old → New mapping:
 *   tech_validation → tech_validation (keep)
 *   commercial_breakthrough → commercial_close (absorbs budget_advancement)
 *   executive_engagement → relationship_penetration
 *   competitive_defense → competitive_defense (keep)
 *   budget_advancement → commercial_close
 *   case_support → value_proposition
 * 
 * Tables affected: dealDimensions, nextActions, stakeholderNeeds
 */
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const MAPPING = {
  'tech_validation': 'tech_validation',
  'commercial_breakthrough': 'commercial_close',
  'executive_engagement': 'relationship_penetration',
  'competitive_defense': 'competitive_defense',
  'budget_advancement': 'commercial_close',
  'case_support': 'value_proposition',
};

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  console.log('=== Migrating dimension keys ===\n');
  
  // 1. Migrate dealDimensions
  // For merged keys (budget_advancement → commercial_close), we need to handle duplicates
  // Strategy: update the first occurrence, delete the duplicate
  console.log('--- dealDimensions ---');
  
  // First, handle the simple renames (no merge conflicts)
  for (const [oldKey, newKey] of Object.entries(MAPPING)) {
    if (oldKey === 'budget_advancement') continue; // handle merge separately
    const [result] = await conn.query(
      'UPDATE dealDimensions SET dimensionKey = ? WHERE dimensionKey = ?',
      [newKey, oldKey]
    );
    console.log(`  ${oldKey} → ${newKey}: ${result.affectedRows} rows`);
  }
  
  // Handle budget_advancement → commercial_close merge
  // For each deal, if commercial_close already exists (from commercial_breakthrough),
  // delete the budget_advancement row. Otherwise, rename it.
  const [budgetRows] = await conn.query(
    'SELECT dd.id, dd.dealId FROM dealDimensions dd WHERE dd.dimensionKey = ?',
    ['budget_advancement']
  );
  for (const row of budgetRows) {
    const [existing] = await conn.query(
      'SELECT id FROM dealDimensions WHERE dealId = ? AND dimensionKey = ?',
      [row.dealId, 'commercial_close']
    );
    if (existing.length > 0) {
      // Duplicate — delete the budget_advancement row
      await conn.query('DELETE FROM dealDimensions WHERE id = ?', [row.id]);
      console.log(`  budget_advancement (deal ${row.dealId}): deleted (merged into existing commercial_close)`);
    } else {
      await conn.query(
        'UPDATE dealDimensions SET dimensionKey = ? WHERE id = ?',
        ['commercial_close', row.id]
      );
      console.log(`  budget_advancement (deal ${row.dealId}): renamed to commercial_close`);
    }
  }
  
  // Now add the new dimension "need_discovery" for each deal that has dimensions
  const [deals] = await conn.query(
    'SELECT DISTINCT dealId, tenantId FROM dealDimensions'
  );
  for (const deal of deals) {
    const [existing] = await conn.query(
      'SELECT id FROM dealDimensions WHERE dealId = ? AND dimensionKey = ?',
      [deal.dealId, 'need_discovery']
    );
    if (existing.length === 0) {
      await conn.query(
        'INSERT INTO dealDimensions (dealId, tenantId, dimensionKey, status, sortOrder) VALUES (?, ?, ?, ?, ?)',
        [deal.dealId, deal.tenantId, 'need_discovery', 'not_started', 0]
      );
      console.log(`  Added need_discovery for deal ${deal.dealId}`);
    }
  }
  
  // Also add value_proposition if it doesn't exist (case_support was renamed)
  for (const deal of deals) {
    const [existing] = await conn.query(
      'SELECT id FROM dealDimensions WHERE dealId = ? AND dimensionKey = ?',
      [deal.dealId, 'value_proposition']
    );
    if (existing.length === 0) {
      await conn.query(
        'INSERT INTO dealDimensions (dealId, tenantId, dimensionKey, status, sortOrder) VALUES (?, ?, ?, ?, ?)',
        [deal.dealId, deal.tenantId, 'value_proposition', 'not_started', 1]
      );
      console.log(`  Added value_proposition for deal ${deal.dealId}`);
    }
  }
  
  // Update sort orders for new model
  const SORT_ORDER = {
    'need_discovery': 0,
    'value_proposition': 1,
    'commercial_close': 2,
    'relationship_penetration': 3,
    'tech_validation': 4,
    'competitive_defense': 5,
  };
  for (const [key, order] of Object.entries(SORT_ORDER)) {
    await conn.query(
      'UPDATE dealDimensions SET sortOrder = ? WHERE dimensionKey = ?',
      [order, key]
    );
  }
  console.log('  Sort orders updated');
  
  // 2. Migrate nextActions
  console.log('\n--- nextActions ---');
  for (const [oldKey, newKey] of Object.entries(MAPPING)) {
    const [result] = await conn.query(
      'UPDATE nextActions SET dimensionKey = ? WHERE dimensionKey = ?',
      [newKey, oldKey]
    );
    if (result.affectedRows > 0) {
      console.log(`  ${oldKey} → ${newKey}: ${result.affectedRows} rows`);
    }
  }
  
  // 3. Migrate stakeholderNeeds
  console.log('\n--- stakeholderNeeds ---');
  for (const [oldKey, newKey] of Object.entries(MAPPING)) {
    const [result] = await conn.query(
      'UPDATE stakeholderNeeds SET dimensionKey = ? WHERE dimensionKey = ?',
      [newKey, oldKey]
    );
    if (result.affectedRows > 0) {
      console.log(`  ${oldKey} → ${newKey}: ${result.affectedRows} rows`);
    }
  }
  
  // Verify
  console.log('\n=== Verification ===');
  const [dimKeys] = await conn.query('SELECT DISTINCT dimensionKey FROM dealDimensions ORDER BY dimensionKey');
  console.log('dealDimensions keys:', dimKeys.map(r => r.dimensionKey));
  const [actKeys] = await conn.query('SELECT DISTINCT dimensionKey FROM nextActions WHERE dimensionKey IS NOT NULL ORDER BY dimensionKey');
  console.log('nextActions keys:', actKeys.map(r => r.dimensionKey));
  const [needKeys] = await conn.query('SELECT DISTINCT dimensionKey FROM stakeholderNeeds WHERE dimensionKey IS NOT NULL ORDER BY dimensionKey');
  console.log('stakeholderNeeds keys:', needKeys.map(r => r.dimensionKey));
  
  await conn.end();
  console.log('\nDone!');
}

main().catch(err => { console.error(err); process.exit(1); });
