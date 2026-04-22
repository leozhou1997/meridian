import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

// ── Mock DB helpers (inline data to avoid hoisting issues) ──────────────────

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");

  const dims = [
    { id: 1, dealId: 1, tenantId: 1, dimensionKey: "tech_validation", status: "in_progress", aiSummary: "POC进行中", notes: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, dealId: 1, tenantId: 1, dimensionKey: "commercial_breakthrough", status: "not_started", aiSummary: null, notes: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 3, dealId: 1, tenantId: 1, dimensionKey: "executive_engagement", status: "blocked", aiSummary: "无高管接触", notes: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 4, dealId: 1, tenantId: 1, dimensionKey: "competitive_defense", status: "completed", aiSummary: "竞对已出局", notes: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 5, dealId: 1, tenantId: 1, dimensionKey: "budget_advancement", status: "in_progress", aiSummary: "预算审批中", notes: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 6, dealId: 1, tenantId: 1, dimensionKey: "case_support", status: "not_started", aiSummary: null, notes: null, createdAt: new Date(), updatedAt: new Date() },
  ];

  const actions = [
    { id: 1, dealId: 1, tenantId: 1, text: "安排POC演示", priority: "high", status: "pending", dimensionKey: "tech_validation", source: "ai_suggested" },
    { id: 2, dealId: 1, tenantId: 1, text: "准备竞对对比", priority: "medium", status: "done", dimensionKey: "competitive_defense", source: "ai_suggested" },
  ];

  const chatMsgs = [
    { id: 1, dealId: 1, tenantId: 1, userId: 1, role: "user", content: "分析一下当前局势", createdAt: new Date() },
    { id: 2, dealId: 1, tenantId: 1, userId: 1, role: "assistant", content: "当前交易处于技术验证阶段...", createdAt: new Date() },
  ];

  return {
    ...actual,
    getOrCreateDefaultTenant: vi.fn().mockResolvedValue({ id: 1, name: "Test Team", slug: "test" }),
    ensureDealDimensions: vi.fn().mockResolvedValue(dims),
    getDealDimensions: vi.fn().mockResolvedValue(dims),
    updateDealDimension: vi.fn().mockResolvedValue(undefined),
    bulkUpdateDealDimensions: vi.fn().mockResolvedValue(undefined),
    getNextActionsByDimension: vi.fn().mockImplementation((_dealId: number, _tenantId: number, dimKey: string) =>
      actions.filter(a => a.dimensionKey === dimKey)
    ),
    getDealChatMessages: vi.fn().mockResolvedValue(chatMsgs),
    createDealChatMessage: vi.fn().mockResolvedValue(1),
    getDealById: vi.fn().mockResolvedValue({
      id: 1, company: "Acme Corp", name: "Enterprise Deal", stage: "Technical Evaluation",
      value: 240000, confidenceScore: 68, daysInStage: 18, companyInfo: "Enterprise software company",
    }),
    getStakeholders: vi.fn().mockResolvedValue([
      { name: "Jennifer Walsh", title: "VP of Sales", role: "Champion", sentiment: "Positive", engagement: "High" },
    ]),
    getMeetings: vi.fn().mockResolvedValue([
      { id: 1, date: new Date(), type: "call", keyParticipant: "Jennifer Walsh", summary: "Discussed technical requirements and POC timeline. Jennifer confirmed budget range." },
    ]),
    getNextActions: vi.fn().mockResolvedValue(actions),
    getStrategyNotes: vi.fn().mockResolvedValue([]),
    createNextAction: vi.fn().mockResolvedValue(1),
  };
});

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          dimensions: [
            { dimensionKey: "tech_validation", status: "in_progress", aiSummary: "POC进行中", actions: [{ text: "安排技术演示", priority: "high", status: "pending" }] },
            { dimensionKey: "commercial_breakthrough", status: "not_started", aiSummary: "尚未开始", actions: [] },
            { dimensionKey: "executive_engagement", status: "blocked", aiSummary: "无高管接触", actions: [{ text: "寻找高管引荐路径", priority: "high", status: "pending" }] },
            { dimensionKey: "competitive_defense", status: "completed", aiSummary: "竞对已出局", actions: [] },
            { dimensionKey: "budget_advancement", status: "in_progress", aiSummary: "预算审批中", actions: [] },
            { dimensionKey: "case_support", status: "not_started", aiSummary: "需要准备案例", actions: [] },
          ],
          quickInsights: ["技术验证是当前关键路径", "需要尽快接触高管", "竞对已出局是好消息"],
        }),
      },
    }],
  }),
}));

// ── Import router AFTER mocks ───────────────────────────────────────────────

import { appRouter } from "./routers";

// ── Test Context ────────────────────────────────────────────────────────────

function createTestContext(): TrpcContext {
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

// ── Dimensions Router Tests ─────────────────────────────────────────────────

describe("dimensions.listByDeal", () => {
  it("returns 6 dimensions for a deal", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dimensions.listByDeal({ dealId: 1 });

    expect(result).toHaveLength(6);
    expect(result[0]).toHaveProperty("dimensionKey");
    expect(result[0]).toHaveProperty("status");
  });

  it("each dimension has a valid status", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dimensions.listByDeal({ dealId: 1 });

    const validStatuses = ["not_started", "in_progress", "completed", "blocked"];
    for (const dim of result) {
      expect(validStatuses).toContain(dim.status);
    }
  });

  it("returns all 6 dimension keys", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dimensions.listByDeal({ dealId: 1 });

    const keys = result.map((d: any) => d.dimensionKey);
    expect(keys).toContain("tech_validation");
    expect(keys).toContain("commercial_breakthrough");
    expect(keys).toContain("executive_engagement");
    expect(keys).toContain("competitive_defense");
    expect(keys).toContain("budget_advancement");
    expect(keys).toContain("case_support");
  });
});

describe("dimensions.update", () => {
  it("updates a dimension status successfully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dimensions.update({
      id: 1,
      status: "completed",
    });

    expect(result).toEqual({ success: true });
  });

  it("updates dimension notes", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dimensions.update({
      id: 1,
      notes: "POC通过，技术团队确认",
    });

    expect(result).toEqual({ success: true });
  });
});

describe("dimensions.bulkUpdate", () => {
  it("bulk updates all dimensions", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dimensions.bulkUpdate({
      dealId: 1,
      dimensions: [
        { dimensionKey: "tech_validation", status: "completed", aiSummary: "POC通过" },
        { dimensionKey: "commercial_breakthrough", status: "in_progress", aiSummary: "合同谈判中" },
      ],
    });

    expect(result).toEqual({ success: true });
  });
});

describe("dimensions.getActions", () => {
  it("returns actions filtered by dimension", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dimensions.getActions({
      dealId: 1,
      dimensionKey: "tech_validation",
    });

    expect(result).toHaveLength(1);
    expect(result[0].dimensionKey).toBe("tech_validation");
  });

  it("returns empty array for dimension with no actions", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dimensions.getActions({
      dealId: 1,
      dimensionKey: "case_support",
    });

    expect(result).toHaveLength(0);
  });
});

describe("dimensions.generateMap", () => {
  it("generates a Decision Map with AI analysis", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dimensions.generateMap({
      dealId: 1,
      language: "zh",
    });

    expect(result.success).toBe(true);
    expect(result.dimensionsUpdated).toBe(6);
    expect(result.actionsCreated).toBeGreaterThanOrEqual(0);
    expect(result.quickInsights).toBeDefined();
    if (result.quickInsights) {
      expect(result.quickInsights.length).toBeGreaterThan(0);
    }
  });
});

// ── Deal Chat Router Tests ──────────────────────────────────────────────────

describe("dealChat.list", () => {
  it("returns chat history for a deal", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dealChat.list({ dealId: 1 });

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("role");
    expect(result[0]).toHaveProperty("content");
  });
});

describe("dealChat.send", () => {
  it("sends a message and returns AI response", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dealChat.send({
      dealId: 1,
      message: "分析一下当前的渗透策略",
    });

    expect(result).toHaveProperty("userMessage");
    expect(result).toHaveProperty("aiMessage");
    expect(result.userMessage.role).toBe("user");
    expect(result.aiMessage.role).toBe("assistant");
    expect(result.userMessage.content).toBe("分析一下当前的渗透策略");
    expect(result.aiMessage.content).toBeTruthy();
  });
});
