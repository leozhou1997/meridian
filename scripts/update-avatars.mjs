import 'dotenv/config';
import mysql from 'mysql2/promise';

const AVATAR_MAP = {
  // 华锐汽车集团
  300001: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/avatar-chen-zhiyuan-Sm3kowFeyt6bE4tL7sUDj4.webp', // 陈志远
  300002: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/avatar-lin-xuemei-FTtcrsBBTtMNfUiFwYMbma.webp', // 林雪梅
  300003: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/avatar-wang-jianguo-Lu4NH7hxeLZtPSU4zz9PEE.webp', // 王建国
  300004: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/avatar-zhao-minghui-WnL3wE7NCoDuxTYah62mJ2.webp', // 赵明辉
  300005: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/avatar-liu-fang-W5XEFAvsGKdvNFjUi9g4Yr.webp', // 刘芳
  // 鼎盛精密电子科技集团
  300006: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/avatar-sun-haoran-NWha5RVt5wvsJCaWpyW2g9.webp', // 孙浩然
  300007: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/avatar-zhou-ting-eCfo39wd8dXzyZJKTsRhkB.webp', // 周婷
  300008: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/avatar-ma-guoqiang-PJNTw7kqVr223EaBJVjDYw.webp', // 马国强
};

const conn = await mysql.createConnection(process.env.DATABASE_URL);

for (const [id, avatar] of Object.entries(AVATAR_MAP)) {
  const [result] = await conn.execute(
    'UPDATE stakeholders SET avatar = ? WHERE id = ?',
    [avatar, Number(id)]
  );
  console.log(`Updated stakeholder ${id}: ${result.affectedRows} row(s)`);
}

await conn.end();
console.log('Done!');
