import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// ── Mock DB helpers ──────────────────────────────────────────────────────────

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");

  const mockNeeds = [
    {
      id: 1, dealId: 1, tenantId: 1, stakeholderId: 10,
      needType: "organizational", title: "数据安全合规",
      description: "CTO关注数据安全合规问题", status: "unmet",
      dimensionKey: "tech_validation", priority: "critical",
      aiGenerated: true, sortOrder: 0, createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 2, dealId: 1, tenantId: 1, stakeholderId: 10,
      needType: "professional", title: "推动数字化转型",
      description: "CTO希望通过此项目展示领导力", status: "in_progress",
      dimensionKey: "executive_engagement", priority: "important",
      aiGenerated: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 3, dealId: 1, tenantId: 1, stakeholderId: 11,
      needType: "personal", title: "减少手工工作量",
      description: "VP Sales希望减少团队手工报告工作", status: "unmet",
      dimensionKey: null, priority: "important",
      aiGenerated: true, sortOrder: 2, createdAt: new Date(), updatedAt: new Date(),
    },
  ];

  let nextId = 10;

  return {
    ...actual,
    getOrCreateDefaultTenant: vi.fn().mockResolvedValue({ id: 1, name: "Test Team", slug: "test" }),
    getStakeholderNeeds: vi.fn().mockResolvedValue(mockNeeds),
    createStakeholderNeed: vi.fn().mockImplementation(async () => ++nextId),
    updateStakeholderNeed: vi.fn().mockResolvedValue(undefined),
    deleteStakeholderNeed: vi.fn().mockResolvedValue(undefined),
    bulkCreateStakeholderNeeds: vi.fn().mockImplementation(async (arr: any[]) => {
      return arr.map(() => ++nextId);
    }),
    deleteStakeholderNeedsByDeal: vi.fn().mockResolvedValue(undefined),
    getDealById: vi.fn().mockResolvedValue({
      id: 1, company: "包钢集团", name: "ERP升级项目", stage: "Technical Evaluation",
      value: 500000, confidenceScore: 55, companyInfo: "大型国企",
    }),
    getStakeholders: vi.fn().mockResolvedValue([
      { id: 10, name: "张伟", title: "CTO", role: "Decision Maker", sentiment: "Neutral", engagement: "Medium", keyInsights: "关注数据安全" },
      { id: 11, name: "李芳", title: "VP of Sales", role: "Champion", sentiment: "Positive", engagement: "High", keyInsights: "积极推动项目" },
    ]),
    getMeetings: vi.fn().mockResolvedValue([
      { id: 1, date: new Date(), type: "meeting", keyParticipant: "张伟", summary: "讨论了数据安全合规要求，张伟表示需要通过安全审计" },
    ]),
    getNextActions: vi.fn().mockResolvedValue([]),
    getStrategyNotes: vi.fn().mockResolvedValue([]),
    ensureDealDimensions: vi.fn().mockResolvedValue([
      { dimensionKey: "tech_validation", status: "in_progress", aiSummary: "POC进行中" },
    ]),
    getCompanyProfile: vi.fn().mockResolvedValue({
      id: 1, tenantId: 1, companyName: "测试公司", products: ["产品A"],
      companyDescription: "测试描述", keyDifferentiator: "测试优势",
      targetMarket: "中大型企业", icpPainPoints: "效率低",
      knowledgeBaseText: null,
    }),
    getKbDocuments: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          stakeholders: [
            {
              stakeholderId: 10,
              needs: [
                { needType: "organizational", title: "数据安全合规", description: "CTO关注安全", status: "unmet", dimensionKey: "tech_validation", priority: "critical" },
                { needType: "professional", title: "推动数字化转型", description: "展示领导力", status: "in_progress", dimensionKey: "executive_engagement", priority: "important" },
              ],
            },
            {
              stakeholderId: 11,
              needs: [
                { needType: "personal", title: "减少手工工作量", description: "减少报告工作", status: "unmet", priority: "important" },
              ],
            },
          ],
        }),
      },
    }],
  }),
}));

// ── Import router after mocks ────────────────────────────────────────────────

import { stakeholderNeedsRouter } from "./routers/stakeholderNeeds";

const caller = stakeholderNeedsRouter.createCaller({
  user: { id: "test-user-id", name: "Test User", role: "admin" },
} as TrpcContext);

// ── Tests ────────────────────────────────────────────────────────────────────

describe("stakeholderNeeds router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listByDeal", () => {
    it("returns all needs for a deal", async () => {
      const result = await caller.listByDeal({ dealId: 1 });
      expect(result).toHaveLength(3);
      expect(result[0].title).toBe("数据安全合规");
      expect(result[0].needType).toBe("organizational");
    });
  });

  describe("create", () => {
    it("creates a new need with correct fields", async () => {
      const result = await caller.create({
        dealId: 1,
        stakeholderId: 10,
        needType: "organizational",
        title: "系统集成需求",
        description: "需要与现有ERP系统集成",
        status: "unmet",
        priority: "critical",
      });
      expect(result.success).toBe(true);
      expect(result.id).toBeGreaterThan(0);
    });

    it("validates required fields", async () => {
      await expect(
        caller.create({
          dealId: 1,
          stakeholderId: 10,
          needType: "organizational",
          title: "", // empty title should fail
          status: "unmet",
          priority: "important",
        })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("updates need status", async () => {
      const result = await caller.update({
        id: 1,
        status: "satisfied",
      });
      expect(result.success).toBe(true);
    });

    it("updates need priority", async () => {
      const result = await caller.update({
        id: 1,
        priority: "critical",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("delete", () => {
    it("deletes a need", async () => {
      const result = await caller.delete({ id: 1 });
      expect(result.success).toBe(true);
    });
  });

  describe("aiGenerate", () => {
    it("generates needs for all stakeholders via AI", async () => {
      const result = await caller.aiGenerate({
        dealId: 1,
        language: "zh",
        regenerate: false,
      });
      expect(result.success).toBe(true);
      expect(result.needsCreated).toBe(3); // 2 for stakeholder 10, 1 for stakeholder 11
    });

    it("clears existing needs when regenerate=true", async () => {
      const { deleteStakeholderNeedsByDeal } = await import("./db");
      const result = await caller.aiGenerate({
        dealId: 1,
        language: "zh",
        regenerate: true,
      });
      expect(result.success).toBe(true);
      expect(deleteStakeholderNeedsByDeal).toHaveBeenCalledWith(1, 1);
    });

    it("validates stakeholder IDs from AI response", async () => {
      // The mock LLM returns stakeholderIds 10 and 11, which are valid
      const result = await caller.aiGenerate({
        dealId: 1,
        language: "en",
        regenerate: false,
      });
      expect(result.success).toBe(true);
      // Should only create needs for valid stakeholder IDs
      expect(result.needsCreated).toBeGreaterThan(0);
    });

    it("handles invalid AI response gracefully", async () => {
      const { invokeLLM } = await import("./_core/llm");
      (invokeLLM as any).mockResolvedValueOnce({
        choices: [{ message: { content: "not valid json" } }],
      });
      const result = await caller.aiGenerate({
        dealId: 1,
        language: "zh",
        regenerate: false,
      });
      expect(result.success).toBe(false);
      expect((result as any).error).toContain("parse");
    });

    it("returns error when no stakeholders exist", async () => {
      const { getStakeholders } = await import("./db");
      (getStakeholders as any).mockResolvedValueOnce([]);
      const result = await caller.aiGenerate({
        dealId: 1,
        language: "zh",
        regenerate: false,
      });
      expect(result.success).toBe(false);
      expect((result as any).error).toContain("stakeholder");
    });
  });
});
