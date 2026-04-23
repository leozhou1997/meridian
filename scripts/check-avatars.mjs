import 'dotenv/config';
import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
console.log("URL present:", !!url);
const conn = await mysql.createConnection(url);
const [deals] = await conn.execute('SELECT id, company FROM deals LIMIT 5');
console.log("Deals:", JSON.stringify(deals));
if (deals.length > 0) {
  const [stkh] = await conn.execute('SELECT id, name, role, sentiment, avatar FROM stakeholders WHERE dealId = ?', [deals[0].id]);
  console.log("Stakeholders:", JSON.stringify(stkh, null, 2));
}
await conn.end();
