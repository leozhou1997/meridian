import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== Creating Demo Account for 拓疆者 BuilderX ===\n');

  // 1. Create user
  const openId = 'demo_tuojiangzhe_001';
  const [existingUser] = await conn.query('SELECT id FROM users WHERE openId = ?', [openId]);
  
  let userId;
  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    console.log(`User already exists with id=${userId}, skipping creation`);
  } else {
    const [userResult] = await conn.query(
      `INSERT INTO users (openId, name, email, role, loginMethod, lastSignedIn) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [openId, 'Demo 演示', 'demo@meridianos.ai', 'admin', 'demo']
    );
    userId = userResult.insertId;
    console.log(`Created user: id=${userId}, email=demo@meridianos.ai`);
  }

  // 2. Create tenant
  const [existingTenant] = await conn.query('SELECT id FROM tenants WHERE slug = ?', ['tuojiangzhe']);
  
  let tenantId;
  if (existingTenant.length > 0) {
    tenantId = existingTenant[0].id;
    console.log(`Tenant already exists with id=${tenantId}, skipping creation`);
  } else {
    const [tenantResult] = await conn.query(
      `INSERT INTO tenants (name, slug, plan) VALUES (?, ?, ?)`,
      ['拓疆者 BuilderX', 'tuojiangzhe', 'enterprise']
    );
    tenantId = tenantResult.insertId;
    console.log(`Created tenant: id=${tenantId}, name=拓疆者 BuilderX`);
  }

  // 3. Create tenant member
  const [existingMember] = await conn.query(
    'SELECT id FROM tenantMembers WHERE tenantId = ? AND userId = ?', 
    [tenantId, userId]
  );
  
  if (existingMember.length > 0) {
    console.log('Tenant member already exists, skipping');
  } else {
    await conn.query(
      `INSERT INTO tenantMembers (tenantId, userId, role) VALUES (?, ?, ?)`,
      [tenantId, userId, 'owner']
    );
    console.log(`Created tenant member: tenantId=${tenantId}, userId=${userId}, role=owner`);
  }

  // 4. Create company profile
  const [existingProfile] = await conn.query(
    'SELECT id FROM companyProfiles WHERE tenantId = ?', [tenantId]
  );
  
  if (existingProfile.length > 0) {
    console.log('Company profile already exists, updating...');
    await conn.query(
      `UPDATE companyProfiles SET 
        companyName = ?,
        companyWebsite = ?,
        companyDescription = ?,
        industry = ?,
        products = ?,
        targetMarket = ?,
        headquarters = ?,
        estimatedSize = ?,
        keyDifferentiator = ?,
        salesStages = ?,
        avgDealSize = ?,
        avgDealCycle = ?,
        salesTeamSize = ?,
        icpIndustries = ?,
        icpCompanySize = ?,
        icpTitles = ?,
        icpPainPoints = ?,
        knowledgeBaseText = ?,
        onboardingCompleted = 1
      WHERE tenantId = ?`,
      [
        '北京拓疆者智能科技有限公司 (BuilderX)',
        'https://www.tuojiangzhe.com/',
        '拓疆者是一家专注于工程机械智能远程操控系统的科技公司，成立于2018年。核心产品是工程机械远程智控系统，能够将传统工程机械设备升级为可远程操控的智能机器人。系统由传感器集群、智控中心和智能驾驶舱三大核心模块组成，支持挖掘机、装载机、推土机、钻机、矿卡等十余种设备。公司由隋少龙创立，核心团队来自苹果、特斯拉、谷歌等知名企业，获得奇绩创坛、联想之星、成为资本等投资机构支持，2025年入选福布斯亚洲最值得关注企业100强。',
        '工程机械智能化 / 矿山自动化',
        JSON.stringify(['工程机械远程智控系统', '智能驾驶舱', '5G远程操控方案', 'AI辅助作业系统', '行人检测预警系统']),
        '大型煤矿企业（央企/省属国企）、港口物流企业、海外矿业公司（日本、澳大利亚等）',
        '北京',
        '100-200人',
        '5G远程操控+AI辅助深度融合，不同于市面上的近场遥控或简单5G遥控，实现从"可用"到"好用"的跨越。已实现跨国远程操控（北京操控日本设备），2025年入选福布斯亚洲100强。',
        JSON.stringify(['线索获取', '需求调研', '技术验证(POC)', '商务谈判', '项目实施', '运维扩展']),
        '5000000',
        '9',
        '15',
        '煤矿、金属矿山、港口物流、基建施工',
        '年产量500万吨以上的大型矿山，年吞吐量1000万吨以上的港口',
        '矿长/总经理、总工程师、安全部门负责人、采购部门、设备管理部门',
        '煤矿作业面安全隐患（塌方、粉尘爆炸、高温）、国家智能化建设政策合规压力（2026年80%目标）、矿山用工荒、港口24小时运营与排班矛盾',
        '拓疆者远程智控系统是面向工程机械的智能化升级解决方案，将传统设备升级为可远程操控的智能机器人。核心技术特性包括5G远程操控+AI辅助、自然体感交互、夜间作业能力、华为认证加密。已服务新疆天池能源、内蒙古平庄煤业、国家能源集团、营口港等客户。',
        tenantId
      ]
    );
    console.log('Updated company profile');
  } else {
    await conn.query(
      `INSERT INTO companyProfiles (tenantId, userId, companyName, companyWebsite, companyDescription, industry, products, targetMarket, headquarters, estimatedSize, keyDifferentiator, salesStages, avgDealSize, avgDealCycle, salesTeamSize, icpIndustries, icpCompanySize, icpTitles, icpPainPoints, knowledgeBaseText, onboardingCompleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        tenantId, userId,
        '北京拓疆者智能科技有限公司 (BuilderX)',
        'https://www.tuojiangzhe.com/',
        '拓疆者是一家专注于工程机械智能远程操控系统的科技公司，成立于2018年。核心产品是工程机械远程智控系统，能够将传统工程机械设备升级为可远程操控的智能机器人。系统由传感器集群、智控中心和智能驾驶舱三大核心模块组成，支持挖掘机、装载机、推土机、钻机、矿卡等十余种设备。公司由隋少龙创立，核心团队来自苹果、特斯拉、谷歌等知名企业，获得奇绩创坛、联想之星、成为资本等投资机构支持，2025年入选福布斯亚洲最值得关注企业100强。',
        '工程机械智能化 / 矿山自动化',
        JSON.stringify(['工程机械远程智控系统', '智能驾驶舱', '5G远程操控方案', 'AI辅助作业系统', '行人检测预警系统']),
        '大型煤矿企业（央企/省属国企）、港口物流企业、海外矿业公司（日本、澳大利亚等）',
        '北京',
        '100-200人',
        '5G远程操控+AI辅助深度融合，不同于市面上的近场遥控或简单5G遥控，实现从"可用"到"好用"的跨越。已实现跨国远程操控（北京操控日本设备），2025年入选福布斯亚洲100强。',
        JSON.stringify(['线索获取', '需求调研', '技术验证(POC)', '商务谈判', '项目实施', '运维扩展']),
        '5000000',
        '9',
        '15',
        '煤矿、金属矿山、港口物流、基建施工',
        '年产量500万吨以上的大型矿山，年吞吐量1000万吨以上的港口',
        '矿长/总经理、总工程师、安全部门负责人、采购部门、设备管理部门',
        '煤矿作业面安全隐患（塌方、粉尘爆炸、高温）、国家智能化建设政策合规压力（2026年80%目标）、矿山用工荒、港口24小时运营与排班矛盾',
        '拓疆者远程智控系统是面向工程机械的智能化升级解决方案，将传统设备升级为可远程操控的智能机器人。核心技术特性包括5G远程操控+AI辅助、自然体感交互、夜间作业能力、华为认证加密。已服务新疆天池能源、内蒙古平庄煤业、国家能源集团、营口港等客户。'
      ]
    );
    console.log('Created company profile');
  }

  // 5. Create KB documents
  const productSheetContent = fs.readFileSync(
    path.join(__dirname, '../tuojiangzhe-research/product-sheet.md'), 'utf-8'
  );
  const salesProcessContent = fs.readFileSync(
    path.join(__dirname, '../tuojiangzhe-research/sales-process.md'), 'utf-8'
  );
  const icpContent = fs.readFileSync(
    path.join(__dirname, '../tuojiangzhe-research/icp.md'), 'utf-8'
  );

  // Delete existing KB docs for this tenant to avoid duplicates
  await conn.query('DELETE FROM kbDocuments WHERE tenantId = ?', [tenantId]);
  console.log('Cleared existing KB documents for tenant');

  const kbDocs = [
    {
      name: '拓疆者产品手册 — 工程机械远程智控系统',
      category: 'product',
      description: '拓疆者核心产品介绍，包括产品架构（传感器集群、智控中心、智能驾驶舱）、适配设备类型、核心技术特性（5G远程操控+AI辅助）、智能化功能矩阵（行人检测、斗齿磨损预警等）、客户价值（安全/效率/合规）。',
      fileType: 'md',
      content: productSheetContent,
    },
    {
      name: '拓疆者销售流程 — 企业级B2B复杂销售',
      category: 'playbook',
      description: '六阶段销售流程定义（线索获取→需求调研→POC→商务谈判→项目实施→运维扩展），典型销售周期（3-12个月），关键决策角色分析（矿长、总工、安全部门、采购部门），竞争格局分析。',
      fileType: 'md',
      content: salesProcessContent,
    },
    {
      name: '拓疆者理想客户画像（ICP）',
      category: 'icp',
      description: '三级目标客户定义：一级（大型煤矿企业，年产量500万吨+），二级（港口物流企业），三级（海外矿业）。包含客户特征、核心痛点、典型案例、购买驱动力、排除标准、最佳切入时机。',
      fileType: 'md',
      content: icpContent,
    },
  ];

  for (const doc of kbDocs) {
    const [result] = await conn.query(
      `INSERT INTO kbDocuments (tenantId, name, category, description, fileType, content, uploadedBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, doc.name, doc.category, doc.description, doc.fileType, doc.content, userId]
    );
    console.log(`Created KB doc: ${doc.name} (id=${result.insertId})`);
  }

  console.log('\n=== Demo Account Setup Complete ===');
  console.log(`User: demo@meridianos.ai (openId: ${openId}, id: ${userId})`);
  console.log(`Tenant: 拓疆者 BuilderX (id: ${tenantId})`);
  console.log(`KB Documents: 3 (product, playbook, icp)`);
  console.log(`\nTo login, visit: /api/demo-login?account=tuojiangzhe`);

  await conn.end();
}

main().catch(console.error);
