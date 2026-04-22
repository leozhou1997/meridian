import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const IMAGE_URLS = {
  wechat_linxuemei: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/wechat-linxuemei-zhangwei-du5Pb4FyuUAR9Pip2aYHr6.webp",
  email_poc: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/email-poc-proposal-K7qyXBf53fMSq6pw38jk2R.webp",
  factory_poc: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/factory-poc-site-2ybPXCgLBhLEpyqHovVa55.webp",
  poc_report: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/poc-data-report-eha5TD8UXwDJiyQBhLAN7D.webp",
  wechat_group: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/wechat-group-poc-update-8TY5wUMpTuqYuxoaPfgJZq.webp",
  whiteboard: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/whiteboard-strategy-6ZmDe8iZrywdy5LHKPEb3f.webp",
};

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // Find the democn tenant
    const [tenants] = await conn.execute(
      "SELECT id FROM tenants WHERE slug LIKE 'democn%'"
    );
    if (tenants.length === 0) {
      console.error("democn tenant not found");
      return;
    }
    const tenantId = tenants[0].id;
    console.log(`Found tenant: ${tenantId}`);

    // Get all meetings for this tenant, ordered by date
    const [meetings] = await conn.execute(
      "SELECT id, type, date, keyParticipant, summary FROM meetings WHERE tenantId = ? ORDER BY date ASC",
      [tenantId]
    );
    console.log(`Found ${meetings.length} meetings`);

    // Map meetings to images based on type and content
    for (const m of meetings) {
      let imageUrl = null;
      const summary = m.summary || "";

      // Match by meeting type and content
      if (m.type === "Email" && summary.includes("POC方案")) {
        imageUrl = IMAGE_URLS.email_poc;
        console.log(`  Meeting ${m.id} (Email - POC方案) → email screenshot`);
      } else if (m.type === "WeChat" && summary.includes("林雪梅")) {
        imageUrl = IMAGE_URLS.wechat_linxuemei;
        console.log(`  Meeting ${m.id} (WeChat - 林雪梅) → WeChat screenshot`);
      } else if (m.type === "Site Visit" && summary.includes("POC启动")) {
        imageUrl = IMAGE_URLS.factory_poc;
        console.log(`  Meeting ${m.id} (Site Visit - POC启动) → factory photo`);
      } else if (m.type === "Phone Call" && summary.includes("换线测试")) {
        imageUrl = IMAGE_URLS.wechat_group;
        console.log(`  Meeting ${m.id} (Phone Call - 换线测试) → WeChat group screenshot`);
      } else if (m.type === "Executive Briefing" && summary.includes("CFO")) {
        imageUrl = IMAGE_URLS.poc_report;
        console.log(`  Meeting ${m.id} (Executive Briefing - CFO) → POC data report`);
      } else if (m.type === "Internal Meeting" || (m.type === "Discovery Call" && summary.includes("首次"))) {
        imageUrl = IMAGE_URLS.whiteboard;
        console.log(`  Meeting ${m.id} (${m.type}) → whiteboard strategy`);
      }

      if (imageUrl) {
        await conn.execute(
          "UPDATE meetings SET attachmentUrl = ? WHERE id = ?",
          [imageUrl, m.id]
        );
      }
    }

    // Verify updates
    const [updated] = await conn.execute(
      "SELECT id, type, attachmentUrl FROM meetings WHERE tenantId = ? AND attachmentUrl IS NOT NULL ORDER BY date ASC",
      [tenantId]
    );
    console.log(`\n✅ Updated ${updated.length} meetings with image attachments:`);
    for (const m of updated) {
      console.log(`  ID ${m.id} (${m.type}): ${m.attachmentUrl.substring(0, 60)}...`);
    }

  } finally {
    await conn.end();
  }
}

main().catch(console.error);
