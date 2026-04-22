import { createPool } from 'mysql2/promise';
const pool = createPool(process.env.DATABASE_URL);
const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM kbDocuments');
console.log('Total KB docs:', rows[0].cnt);
const [tenants] = await pool.query('SELECT id, name FROM tenants');
console.log('Tenants:', JSON.stringify(tenants));
const [users] = await pool.query('SELECT id, name FROM users LIMIT 3');
console.log('Users:', JSON.stringify(users));
await pool.end();
