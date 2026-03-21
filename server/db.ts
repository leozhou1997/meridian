import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  aiLogs,
  deals,
  kbDocuments,
  meetings,
  nextActions,
  promptTemplates,
  snapshots,
  stakeholders,
  tenantMembers,
  tenants,
  users,
  type InsertAiLog,
  type InsertDeal,
  type InsertKbDocument,
  type InsertMeeting,
  type InsertNextAction,
  type InsertPromptTemplate,
  type InsertSnapshot,
  type InsertStakeholder,
  type InsertUser,
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
