import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB functions
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  let notes: any[] = [];
  let nextId = 1;

  return {
    ...actual,
    getOrCreateDefaultTenant: vi.fn().mockResolvedValue({ id: 1, name: "Test Tenant", slug: "test", plan: "trial", createdAt: new Date(), updatedAt: new Date() }),
    getStrategyNotes: vi.fn(async (dealId: number, tenantId: number) => {
      return notes.filter(n => n.dealId === dealId && n.tenantId === tenantId);
    }),
    createStrategyNote: vi.fn(async (data: any) => {
      const id = nextId++;
      notes.push({ id, ...data, createdAt: new Date(), updatedAt: new Date() });
      return id;
    }),
    updateStrategyNote: vi.fn(async (id: number, tenantId: number, data: any) => {
      notes = notes.map(n => n.id === id && n.tenantId === tenantId ? { ...n, ...data, updatedAt: new Date() } : n);
    }),
    deleteStrategyNote: vi.fn(async (id: number, tenantId: number) => {
      notes = notes.filter(n => !(n.id === id && n.tenantId === tenantId));
    }),
  };
});

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("strategyNotes", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(createAuthContext());
  });

  it("creates a strategy note and returns it", async () => {
    const result = await caller.strategyNotes.create({
      dealId: 1,
      category: "pricing",
      content: "Max discount is 15% for this deal",
    });
    expect(result).toBeDefined();
    expect(result.category).toBe("pricing");
    expect(result.content).toBe("Max discount is 15% for this deal");
  });

  it("lists strategy notes for a deal", async () => {
    // Create another note
    await caller.strategyNotes.create({
      dealId: 1,
      category: "competitive",
      content: "Competitor X is also bidding",
    });
    const notes = await caller.strategyNotes.listByDeal({ dealId: 1 });
    expect(notes.length).toBeGreaterThanOrEqual(1);
  });

  it("updates a strategy note", async () => {
    const created = await caller.strategyNotes.create({
      dealId: 2,
      category: "internal",
      content: "Need VP approval",
    });
    const result = await caller.strategyNotes.update({
      id: created.id,
      content: "Need SVP approval - escalated",
      category: "internal",
    });
    expect(result.success).toBe(true);
  });

  it("deletes a strategy note", async () => {
    const created = await caller.strategyNotes.create({
      dealId: 3,
      category: "relationship",
      content: "CTO is a former colleague",
    });
    const result = await caller.strategyNotes.delete({ id: created.id });
    expect(result.success).toBe(true);
  });

  it("validates category enum", async () => {
    await expect(
      caller.strategyNotes.create({
        dealId: 1,
        category: "invalid_category" as any,
        content: "test",
      })
    ).rejects.toThrow();
  });

  it("allows empty content for new notes (filled during editing)", async () => {
    const note = await caller.strategyNotes.create({
      dealId: 1,
      category: "pricing",
      content: "",
    });
    expect(note.content).toBe("");
    expect(note.category).toBe("pricing");
  });
});
