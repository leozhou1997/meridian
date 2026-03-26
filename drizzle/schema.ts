import {
  boolean,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Tenants ──────────────────────────────────────────────────────────────────

export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  plan: mysqlEnum("plan", ["trial", "starter", "pro", "enterprise"]).default("trial").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;

// ─── Tenant Members ───────────────────────────────────────────────────────────

export const tenantMembers = mysqlTable("tenantMembers", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TenantMember = typeof tenantMembers.$inferSelect;

// ─── Deals ────────────────────────────────────────────────────────────────────

export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  website: varchar("website", { length: 500 }),
  logo: varchar("logo", { length: 500 }),
  stage: mysqlEnum("stage", [
    "Discovery",
    "Demo",
    "Technical Evaluation",
    "POC",
    "Negotiation",
    "Closed Won",
    "Closed Lost",
  ]).default("Discovery").notNull(),
  value: int("value").default(0).notNull(),
  confidenceScore: int("confidenceScore").default(50).notNull(),
  daysInStage: int("daysInStage").default(0).notNull(),
  lastActivity: varchar("lastActivity", { length: 100 }),
  riskOneLiner: text("riskOneLiner"),
  companyInfo: text("companyInfo"),
  buyingStages: json("buyingStages"),
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// ─── Stakeholders ─────────────────────────────────────────────────────────────

export const stakeholders = mysqlTable("stakeholders", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  role: mysqlEnum("role", [
    "Champion",
    "Decision Maker",
    "Influencer",
    "Blocker",
    "User",
    "Evaluator",
  ]).default("User").notNull(),
  roles: json("roles"),
  sentiment: mysqlEnum("sentiment", ["Positive", "Neutral", "Negative"]).default("Neutral").notNull(),
  engagement: mysqlEnum("engagement", ["High", "Medium", "Low"]).default("Medium").notNull(),
  avatar: varchar("avatar", { length: 500 }),
  email: varchar("email", { length: 320 }),
  linkedIn: varchar("linkedIn", { length: 500 }),
  keyInsights: text("keyInsights"),
  personalNotes: text("personalNotes"),
  personalSignals: json("personalSignals"),
  mapX: float("mapX"),
  mapY: float("mapY"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Stakeholder = typeof stakeholders.$inferSelect;
export type InsertStakeholder = typeof stakeholders.$inferInsert;

// ─── Meetings ─────────────────────────────────────────────────────────────────

export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  tenantId: int("tenantId").notNull(),
  date: timestamp("date").notNull(),
  type: mysqlEnum("type", [
    "Discovery Call",
    "Demo",
    "Technical Review",
    "POC Check-in",
    "Negotiation",
    "Executive Briefing",
    "Follow-up",
  ]).default("Follow-up").notNull(),
  keyParticipant: varchar("keyParticipant", { length: 255 }),
  summary: text("summary"),
  duration: int("duration").default(30),
  transcriptUrl: text("transcript"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

// ─── Deal Snapshots ───────────────────────────────────────────────────────────

export const snapshots = mysqlTable("snapshots", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  tenantId: int("tenantId").notNull(),
  date: timestamp("date").notNull(),
  whatsHappening: text("whatsHappening"),
  whatsNext: json("whatsNext").$type<Array<{ action: string; rationale: string; suggestedContacts?: Array<{ name: string; title: string; reason: string }> }>>(),
  keyRisks: json("keyRisks").$type<Array<{ title: string; detail: string; stakeholders: string[] }> | string[]>(),
  confidenceScore: int("confidenceScore").default(50).notNull(),
  confidenceChange: int("confidenceChange").default(0).notNull(),
  interactionType: varchar("interactionType", { length: 100 }),
  keyParticipant: varchar("keyParticipant", { length: 255 }),
  aiGenerated: boolean("aiGenerated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Snapshot = typeof snapshots.$inferSelect;
export type InsertSnapshot = typeof snapshots.$inferInsert;

// ─── Next Actions ─────────────────────────────────────────────────────────────

export const nextActions = mysqlTable("nextActions", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  tenantId: int("tenantId").notNull(),
  stakeholderId: int("stakeholderId"),
  text: text("text").notNull(),
  dueDate: timestamp("dueDate"),
  completed: boolean("completed").default(false).notNull(),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NextAction = typeof nextActions.$inferSelect;
export type InsertNextAction = typeof nextActions.$inferInsert;

// ─── Knowledge Base Documents ─────────────────────────────────────────────────

export const kbDocuments = mysqlTable("kbDocuments", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["product", "playbook", "icp"]).default("product").notNull(),
  description: text("description"),
  fileType: mysqlEnum("fileType", ["pdf", "doc", "md", "txt"]).default("md").notNull(),
  content: text("content"),
  fileUrl: varchar("fileUrl", { length: 500 }),
  fileSize: varchar("fileSize", { length: 50 }),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KbDocument = typeof kbDocuments.$inferSelect;
export type InsertKbDocument = typeof kbDocuments.$inferInsert;

// ─── AI Logs ──────────────────────────────────────────────────────────────────

export const aiLogs = mysqlTable("aiLogs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  feature: varchar("feature", { length: 100 }).notNull(),
  promptVersion: varchar("promptVersion", { length: 50 }),
  inputContext: json("inputContext"),
  systemPrompt: text("systemPrompt"),
  userPrompt: text("userPrompt"),
  rawOutput: text("rawOutput"),
  parsedOutput: json("parsedOutput"),
  modelUsed: varchar("modelUsed", { length: 100 }),
  tokensUsed: int("tokensUsed"),
  latencyMs: int("latencyMs"),
  rating: mysqlEnum("rating", ["good", "bad", "edited"]),
  editedOutput: text("editedOutput"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiLog = typeof aiLogs.$inferSelect;
export type InsertAiLog = typeof aiLogs.$inferInsert;

// ─── Prompt Templates ─────────────────────────────────────────────────────────

export const promptTemplates = mysqlTable("promptTemplates", {
  id: int("id").autoincrement().primaryKey(),
  feature: varchar("feature", { length: 100 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  systemPrompt: text("systemPrompt").notNull(),
  userPromptTemplate: text("userPromptTemplate").notNull(),
  description: varchar("description", { length: 500 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type InsertPromptTemplate = typeof promptTemplates.$inferInsert;

// ─── Company Profiles (Onboarding / CRM Init) ───────────────────────────────

export const companyProfiles = mysqlTable("companyProfiles", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  // Company info
  companyName: varchar("companyName", { length: 255 }).notNull(),
  companyWebsite: varchar("companyWebsite", { length: 500 }),
  companyDescription: text("companyDescription"),
  industry: varchar("industry", { length: 255 }),
  products: json("products").$type<string[]>(),
  targetMarket: text("targetMarket"),
  headquarters: varchar("headquarters", { length: 255 }),
  estimatedSize: varchar("estimatedSize", { length: 100 }),
  keyDifferentiator: text("keyDifferentiator"),
  // Sales process
  salesStages: json("salesStages").$type<string[]>(),
  avgDealSize: varchar("avgDealSize", { length: 100 }),
  avgDealCycle: varchar("avgDealCycle", { length: 100 }),
  salesTeamSize: varchar("salesTeamSize", { length: 100 }),
  // ICP
  icpIndustries: text("icpIndustries"),
  icpCompanySize: varchar("icpCompanySize", { length: 255 }),
  icpTitles: text("icpTitles"),
  icpPainPoints: text("icpPainPoints"),
  // Knowledge base text (raw pasted content)
  knowledgeBaseText: text("knowledgeBaseText"),
  // Metadata
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = typeof companyProfiles.$inferInsert;
