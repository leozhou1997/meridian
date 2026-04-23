import { and, desc, eq, lt, isNotNull, ne, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  aiLogs,
  companyProfiles,
  deals,
  dealChatMessages,
  dealDimensions,
  dealStrategyNotes,
  kbDocuments,
  meetings,
  nextActions,
  promptTemplates,
  snapshots,
  stakeholders,
  tenantMembers,
  salesModels,
  tenants,
  users,
  type InsertAiLog,
  type InsertCompanyProfile,
  type InsertDeal,
  type InsertDealChatMessage,
  type InsertDealDimension,
  type InsertDealStrategyNote,
  type InsertKbDocument,
  type InsertMeeting,
  type InsertNextAction,
  type InsertPromptTemplate,
  type InsertSnapshot,
  type InsertStakeholder,
  type InsertSalesModel,
  type InsertUser,
  stakeholderNeeds,
  type InsertStakeholderNeed,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const [result] = await db.insert(users).values({
    openId,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    loginMethod: 'email',
    lastSignedIn: new Date(),
  });
  return (result as any).insertId as number;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Tenants ──────────────────────────────────────────────────────────────────

export type InsertTenant = typeof tenants.$inferInsert;

export async function getTenantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrCreateDefaultTenant(userId: number, userName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers).where(eq(tenantMembers.userId, userId)).limit(1);
  if (existing.length > 0) {
    const tenant = await getTenantById(existing[0].tenantId);
    return tenant!;
  }
  const slug = `workspace-${userId}-${Date.now()}`;
  const [result] = await db.insert(tenants).values({ name: `${userName}'s Workspace`, slug, plan: 'trial' });
  const tenantId = (result as any).insertId as number;
  await db.insert(tenantMembers).values({ tenantId, userId, role: 'owner' });
  const tenant = await getTenantById(tenantId);
  return tenant!;
}

export async function getTenantForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers).where(eq(tenantMembers.userId, userId)).limit(1);
  if (result.length === 0) return undefined;
  return getTenantById(result[0].tenantId);
}

// ─── Deals ────────────────────────────────────────────────────────────────────

export async function getDeals(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deals)
    .where(and(eq(deals.tenantId, tenantId), eq(deals.isArchived, false)))
    .orderBy(desc(deals.updatedAt));
}

export async function getDealById(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deals)
    .where(and(eq(deals.id, id), eq(deals.tenantId, tenantId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDeal(data: InsertDeal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(deals).values(data);
  return (result as any).insertId as number;
}

export async function updateDeal(id: number, tenantId: number, data: Partial<InsertDeal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deals).set(data).where(and(eq(deals.id, id), eq(deals.tenantId, tenantId)));
}

export async function deleteDeal(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deals).set({ isArchived: true }).where(and(eq(deals.id, id), eq(deals.tenantId, tenantId)));
}

// ─── Stakeholders ─────────────────────────────────────────────────────────────

export async function getStakeholders(dealId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stakeholders)
    .where(and(eq(stakeholders.dealId, dealId), eq(stakeholders.tenantId, tenantId)))
    .orderBy(stakeholders.createdAt);
}

export async function getAllStakeholdersForTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stakeholders)
    .where(eq(stakeholders.tenantId, tenantId))
    .orderBy(desc(stakeholders.updatedAt));
}

export async function createStakeholder(data: InsertStakeholder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(stakeholders).values(data);
  return (result as any).insertId as number;
}

export async function updateStakeholder(id: number, tenantId: number, data: Partial<InsertStakeholder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(stakeholders).set(data).where(and(eq(stakeholders.id, id), eq(stakeholders.tenantId, tenantId)));
}

export async function deleteStakeholder(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(stakeholders).where(and(eq(stakeholders.id, id), eq(stakeholders.tenantId, tenantId)));
}

// ─── Meetings ─────────────────────────────────────────────────────────────────

export async function getMeetings(dealId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetings)
    .where(and(eq(meetings.dealId, dealId), eq(meetings.tenantId, tenantId)))
    .orderBy(desc(meetings.date));
}

export async function getAllMeetingsForTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetings)
    .where(eq(meetings.tenantId, tenantId))
    .orderBy(desc(meetings.date));
}

export async function createMeeting(data: InsertMeeting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(meetings).values(data);
  return (result as any).insertId as number;
}

export async function updateMeeting(id: number, tenantId: number, data: Partial<InsertMeeting>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(meetings).set(data).where(and(eq(meetings.id, id), eq(meetings.tenantId, tenantId)));
}

export async function deleteMeeting(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(meetings).where(and(eq(meetings.id, id), eq(meetings.tenantId, tenantId)));
}

// ─── Snapshots ────────────────────────────────────────────────────────────────

export async function getSnapshots(dealId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(snapshots)
    .where(and(eq(snapshots.dealId, dealId), eq(snapshots.tenantId, tenantId)))
    .orderBy(desc(snapshots.date));
}

export async function createSnapshot(data: InsertSnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(snapshots).values(data);
  return (result as any).insertId as number;
}

export async function updateSnapshotSuggestionActions(
  snapshotId: number,
  tenantId: number,
  suggestionActions: Array<{ action: string; status: 'accepted' | 'rejected' | 'later' | 'pending'; actionId?: number }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(snapshots)
    .set({ suggestionActions: suggestionActions as any })
    .where(and(eq(snapshots.id, snapshotId), eq(snapshots.tenantId, tenantId)));
}

export async function getLatestSnapshot(dealId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(snapshots)
    .where(and(eq(snapshots.dealId, dealId), eq(snapshots.tenantId, tenantId)))
    .orderBy(desc(snapshots.date))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSnapshotCountsByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ dealId: snapshots.dealId, count: count() })
    .from(snapshots)
    .where(eq(snapshots.tenantId, tenantId))
    .groupBy(snapshots.dealId);
}

// ─── Next Actions ─────────────────────────────────────────────────────────────

export async function getNextActions(dealId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(nextActions)
    .where(and(eq(nextActions.dealId, dealId), eq(nextActions.tenantId, tenantId)))
    .orderBy(nextActions.createdAt);
}

export async function createNextAction(data: InsertNextAction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(nextActions).values(data);
  return (result as any).insertId as number;
}

export async function updateNextAction(id: number, tenantId: number, data: Partial<InsertNextAction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(nextActions).set(data).where(and(eq(nextActions.id, id), eq(nextActions.tenantId, tenantId)));
}

export async function deleteNextAction(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(nextActions).where(and(eq(nextActions.id, id), eq(nextActions.tenantId, tenantId)));
}

export async function getOverdueNextActions(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(nextActions)
    .where(and(
      eq(nextActions.tenantId, tenantId),
      isNotNull(nextActions.dueDate),
      lt(nextActions.dueDate, now),
      ne(nextActions.status, 'done'),
      ne(nextActions.status, 'rejected'),
    ))
    .orderBy(nextActions.dueDate);
}

// ─── Knowledge Base ───────────────────────────────────────────────────────────

export async function getKbDocuments(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kbDocuments)
    .where(eq(kbDocuments.tenantId, tenantId))
    .orderBy(desc(kbDocuments.createdAt));
}

export async function createKbDocument(data: InsertKbDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(kbDocuments).values(data);
  return (result as any).insertId as number;
}

export async function updateKbDocument(id: number, tenantId: number, data: Partial<InsertKbDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(kbDocuments).set(data).where(and(eq(kbDocuments.id, id), eq(kbDocuments.tenantId, tenantId)));
}

export async function getKbDocumentById(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(kbDocuments)
    .where(and(eq(kbDocuments.id, id), eq(kbDocuments.tenantId, tenantId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteKbDocument(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(kbDocuments).where(and(eq(kbDocuments.id, id), eq(kbDocuments.tenantId, tenantId)));
}

// ─── AI Logs ──────────────────────────────────────────────────────────────────

export async function createAiLog(data: InsertAiLog) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(aiLogs).values(data);
  return (result as any).insertId as number;
}

export async function getAiLogs(tenantId: number, feature?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = feature
    ? and(eq(aiLogs.tenantId, tenantId), eq(aiLogs.feature, feature))
    : eq(aiLogs.tenantId, tenantId);
  return db.select().from(aiLogs).where(conditions).orderBy(desc(aiLogs.createdAt)).limit(100);
}

export async function rateAiLog(id: number, tenantId: number, rating: 'good' | 'bad' | 'edited', editedOutput?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiLogs).set({ rating, editedOutput: editedOutput ?? null })
    .where(and(eq(aiLogs.id, id), eq(aiLogs.tenantId, tenantId)));
}

// ─── Prompt Templates ─────────────────────────────────────────────────────────

export async function getActivePrompt(feature: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(promptTemplates)
    .where(and(eq(promptTemplates.feature, feature), eq(promptTemplates.isActive, true)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPromptsByFeature(feature: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promptTemplates)
    .where(eq(promptTemplates.feature, feature))
    .orderBy(desc(promptTemplates.createdAt));
}

export async function getAllPrompts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promptTemplates).orderBy(desc(promptTemplates.updatedAt));
}

export async function createPromptTemplate(data: InsertPromptTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(promptTemplates).values(data);
  return (result as any).insertId as number;
}

export async function updatePromptTemplate(id: number, data: Partial<InsertPromptTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(promptTemplates).set(data).where(eq(promptTemplates.id, id));
}

export async function setActivePrompt(id: number, feature: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(promptTemplates).set({ isActive: false }).where(eq(promptTemplates.feature, feature));
  await db.update(promptTemplates).set({ isActive: true }).where(eq(promptTemplates.id, id));
}

// ─── Company Profiles ────────────────────────────────────────────────────────

export async function getCompanyProfile(tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companyProfiles)
    .where(eq(companyProfiles.tenantId, tenantId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCompanyProfile(data: InsertCompanyProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(companyProfiles).values(data);
  return (result as any).insertId as number;
}

export async function updateCompanyProfile(id: number, tenantId: number, data: Partial<InsertCompanyProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(companyProfiles).set(data)
    .where(and(eq(companyProfiles.id, id), eq(companyProfiles.tenantId, tenantId)));
}


// ─── Sales Models ──────────────────────────────────────────────────────────

export async function getSalesModels(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesModels).where(eq(salesModels.tenantId, tenantId));
}

export async function getSalesModelById(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(salesModels)
    .where(and(eq(salesModels.id, id), eq(salesModels.tenantId, tenantId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSalesModel(data: InsertSalesModel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(salesModels).values(data);
  return (result as any).insertId as number;
}

export async function updateSalesModel(id: number, tenantId: number, data: Partial<InsertSalesModel>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(salesModels).set(data)
    .where(and(eq(salesModels.id, id), eq(salesModels.tenantId, tenantId)));
}

export async function deleteSalesModel(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(salesModels)
    .where(and(eq(salesModels.id, id), eq(salesModels.tenantId, tenantId)));
}

export async function updateDealSalesModel(dealId: number, tenantId: number, salesModel: string, customModelId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deals).set({ salesModel, customModelId: customModelId ?? null })
    .where(and(eq(deals.id, dealId), eq(deals.tenantId, tenantId)));
}

// ─── Deal Strategy Notes ─────────────────────────────────────────────────────

export async function getStrategyNotes(dealId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealStrategyNotes)
    .where(and(eq(dealStrategyNotes.dealId, dealId), eq(dealStrategyNotes.tenantId, tenantId)))
    .orderBy(desc(dealStrategyNotes.createdAt));
}

export async function createStrategyNote(data: InsertDealStrategyNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(dealStrategyNotes).values(data);
  return (result as any).insertId as number;
}

export async function updateStrategyNote(id: number, tenantId: number, data: Partial<InsertDealStrategyNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dealStrategyNotes).set(data)
    .where(and(eq(dealStrategyNotes.id, id), eq(dealStrategyNotes.tenantId, tenantId)));
}

export async function deleteStrategyNote(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dealStrategyNotes)
    .where(and(eq(dealStrategyNotes.id, id), eq(dealStrategyNotes.tenantId, tenantId)));
}


// ─── Deal Dimensions (Decision Map) ─────────────────────────────────────────

const DEFAULT_DIMENSIONS = [
  { key: "need_discovery", sortOrder: 0 },
  { key: "value_proposition", sortOrder: 1 },
  { key: "commercial_close", sortOrder: 2 },
  { key: "relationship_penetration", sortOrder: 3 },
  { key: "tech_validation", sortOrder: 4 },
  { key: "competitive_defense", sortOrder: 5 },
] as const;

export async function getDealDimensions(dealId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealDimensions)
    .where(and(eq(dealDimensions.dealId, dealId), eq(dealDimensions.tenantId, tenantId)))
    .orderBy(dealDimensions.sortOrder);
}

export async function ensureDealDimensions(dealId: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getDealDimensions(dealId, tenantId);
  if (existing.length > 0) return existing;
  // Create default 6 dimensions for this deal
  const toInsert: InsertDealDimension[] = DEFAULT_DIMENSIONS.map(d => ({
    dealId,
    tenantId,
    dimensionKey: d.key,
    status: "not_started" as const,
    sortOrder: d.sortOrder,
  }));
  await db.insert(dealDimensions).values(toInsert);
  return getDealDimensions(dealId, tenantId);
}

export async function updateDealDimension(
  id: number,
  tenantId: number,
  data: Partial<InsertDealDimension>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dealDimensions).set(data)
    .where(and(eq(dealDimensions.id, id), eq(dealDimensions.tenantId, tenantId)));
}

export async function bulkUpdateDealDimensions(
  dealId: number,
  tenantId: number,
  updates: Array<{ dimensionKey: string; status: string; aiSummary?: string; notes?: string }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (const u of updates) {
    await db.update(dealDimensions)
      .set({
        status: u.status as any,
        aiSummary: u.aiSummary ?? null,
        notes: u.notes ?? null,
      })
      .where(and(
        eq(dealDimensions.dealId, dealId),
        eq(dealDimensions.tenantId, tenantId),
        eq(dealDimensions.dimensionKey, u.dimensionKey),
      ));
  }
}

// ─── Deal Chat Messages ─────────────────────────────────────────────────────

export async function getDealChatMessages(dealId: number, tenantId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealChatMessages)
    .where(and(eq(dealChatMessages.dealId, dealId), eq(dealChatMessages.tenantId, tenantId)))
    .orderBy(dealChatMessages.createdAt)
    .limit(limit);
}

export async function createDealChatMessage(data: InsertDealChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(dealChatMessages).values(data);
  return (result as any).insertId as number;
}

// ─── Stakeholder Needs (Battle Map) ────────────────────────────────────────

export async function getStakeholderNeeds(dealId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stakeholderNeeds)
    .where(and(eq(stakeholderNeeds.dealId, dealId), eq(stakeholderNeeds.tenantId, tenantId)))
    .orderBy(stakeholderNeeds.sortOrder, stakeholderNeeds.createdAt);
}

export async function getStakeholderNeedsByStakeholder(stakeholderId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stakeholderNeeds)
    .where(and(eq(stakeholderNeeds.stakeholderId, stakeholderId), eq(stakeholderNeeds.tenantId, tenantId)))
    .orderBy(stakeholderNeeds.sortOrder, stakeholderNeeds.createdAt);
}

export async function createStakeholderNeed(data: InsertStakeholderNeed) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(stakeholderNeeds).values(data);
  return (result as any).insertId as number;
}

export async function updateStakeholderNeed(id: number, tenantId: number, data: Partial<InsertStakeholderNeed>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(stakeholderNeeds).set(data).where(and(eq(stakeholderNeeds.id, id), eq(stakeholderNeeds.tenantId, tenantId)));
}

export async function deleteStakeholderNeed(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(stakeholderNeeds).where(and(eq(stakeholderNeeds.id, id), eq(stakeholderNeeds.tenantId, tenantId)));
}

export async function bulkCreateStakeholderNeeds(dataArr: InsertStakeholderNeed[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (dataArr.length === 0) return [];
  const ids: number[] = [];
  for (const data of dataArr) {
    const [result] = await db.insert(stakeholderNeeds).values(data);
    ids.push((result as any).insertId as number);
  }
  return ids;
}

export async function deleteStakeholderNeedsByDeal(dealId: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(stakeholderNeeds).where(and(eq(stakeholderNeeds.dealId, dealId), eq(stakeholderNeeds.tenantId, tenantId)));
}

// ─── Next Actions by Dimension ──────────────────────────────────────────────

export async function getNextActionsByDimension(dealId: number, tenantId: number, dimensionKey: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(nextActions)
    .where(and(
      eq(nextActions.dealId, dealId),
      eq(nextActions.tenantId, tenantId),
      eq(nextActions.dimensionKey, dimensionKey),
    ))
    .orderBy(nextActions.createdAt);
}
