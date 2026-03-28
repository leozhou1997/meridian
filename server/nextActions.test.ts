import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => {
  let actions: any[] = [];
  let nextId = 1;
  let tenantId = 1;

  return {
    getOrCreateDefaultTenant: vi.fn(async () => ({ id: tenantId, name: "Test Tenant" })),
    getNextActions: vi.fn(async (dealId: number, tid: number) =>
      actions.filter(a => a.dealId === dealId && a.tenantId === tid)
    ),
    createNextAction: vi.fn(async (data: any) => {
      const id = nextId++;
      actions.push({ id, ...data, completed: data.completed ?? false, createdAt: new Date(), updatedAt: new Date() });
      return id;
    }),
    updateNextAction: vi.fn(async (id: number, tid: number, data: any) => {
      const idx = actions.findIndex(a => a.id === id && a.tenantId === tid);
      if (idx >= 0) actions[idx] = { ...actions[idx], ...data };
    }),
    deleteNextAction: vi.fn(async (id: number, tid: number) => {
      actions = actions.filter(a => !(a.id === id && a.tenantId === tid));
    }),
    // Reset helper for tests
    __resetActions: () => { actions = []; nextId = 1; },
  };
});

// Import the mocked module to use __resetActions
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("nextActions router", () => {
  beforeEach(() => {
    (db as any).__resetActions();
  });

  describe("create", () => {
    it("creates a manual action with default status 'pending'", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nextActions.create({
        dealId: 1,
        text: "Follow up with CTO",
        priority: "high",
      });

      expect(result).toBeDefined();
      expect(result.text).toBe("Follow up with CTO");
      expect(result.status).toBe("pending");
      expect(result.source).toBe("manual");
    });

    it("creates an AI-suggested action with source='ai_suggested'", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nextActions.create({
        dealId: 1,
        text: "Schedule technical deep-dive",
        source: "ai_suggested",
        status: "pending",
        snapshotId: 42,
      });

      expect(result.source).toBe("ai_suggested");
      expect(result.snapshotId).toBe(42);
    });

    it("creates an action with accepted status", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nextActions.create({
        dealId: 1,
        text: "Prepare demo",
        status: "accepted",
        source: "manual",
      });

      expect(result.status).toBe("accepted");
    });
  });

  describe("updateStatus", () => {
    it("transitions action from accepted to in_progress", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.nextActions.create({
        dealId: 1,
        text: "Draft proposal",
        status: "accepted",
      });

      const result = await caller.nextActions.updateStatus({
        id: 1,
        status: "in_progress",
      });

      expect(result).toEqual({ success: true });
    });

    it("transitions action to done and sets completed=true", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.nextActions.create({
        dealId: 1,
        text: "Send contract",
        status: "accepted",
      });

      const result = await caller.nextActions.updateStatus({
        id: 1,
        status: "done",
      });

      expect(result).toEqual({ success: true });

      // Verify the action was updated via the mock
      const { updateNextAction } = await import("./db");
      expect(updateNextAction).toHaveBeenCalledWith(1, expect.any(Number), {
        status: "done",
        completed: true,
      });
    });

    it("transitions action to blocked", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.nextActions.create({
        dealId: 1,
        text: "Get budget approval",
        status: "in_progress",
      });

      const result = await caller.nextActions.updateStatus({
        id: 1,
        status: "blocked",
      });

      expect(result).toEqual({ success: true });
    });

    it("transitions action from rejected back to accepted (undo dismiss)", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.nextActions.create({
        dealId: 1,
        text: "Optional follow-up",
        status: "rejected",
        source: "ai_suggested",
      });

      const result = await caller.nextActions.updateStatus({
        id: 1,
        status: "accepted",
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe("toggle (backward compat)", () => {
    it("toggles completed and syncs status to done", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.nextActions.create({
        dealId: 1,
        text: "Old-style toggle action",
      });

      const result = await caller.nextActions.toggle({
        id: 1,
        completed: true,
      });

      expect(result).toEqual({ success: true });

      const { updateNextAction } = await import("./db");
      expect(updateNextAction).toHaveBeenCalledWith(1, expect.any(Number), {
        completed: true,
        status: "done",
      });
    });

    it("toggles uncompleted and syncs status to accepted", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.nextActions.create({
        dealId: 1,
        text: "Reopened action",
      });

      const result = await caller.nextActions.toggle({
        id: 1,
        completed: false,
      });

      expect(result).toEqual({ success: true });

      const { updateNextAction } = await import("./db");
      expect(updateNextAction).toHaveBeenCalledWith(1, expect.any(Number), {
        completed: false,
        status: "accepted",
      });
    });
  });

  describe("listByDeal", () => {
    it("returns actions for a specific deal", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.nextActions.create({ dealId: 1, text: "Action A" });
      await caller.nextActions.create({ dealId: 1, text: "Action B" });
      await caller.nextActions.create({ dealId: 2, text: "Action C" });

      const result = await caller.nextActions.listByDeal({ dealId: 1 });

      expect(result).toHaveLength(2);
      expect(result.map(a => a.text)).toEqual(["Action A", "Action B"]);
    });
  });

  describe("delete", () => {
    it("deletes an action", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.nextActions.create({ dealId: 1, text: "To be deleted" });

      const result = await caller.nextActions.delete({ id: 1 });
      expect(result).toEqual({ success: true });

      const remaining = await caller.nextActions.listByDeal({ dealId: 1 });
      expect(remaining).toHaveLength(0);
    });
  });

  describe("status values validation", () => {
    it("rejects invalid status values", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.nextActions.updateStatus({ id: 1, status: "invalid_status" as any })
      ).rejects.toThrow();
    });

    it("rejects invalid source values on create", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.nextActions.create({ dealId: 1, text: "Test", source: "invalid" as any })
      ).rejects.toThrow();
    });
  });
});
