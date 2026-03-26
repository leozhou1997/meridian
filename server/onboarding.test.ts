import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the onboarding router procedures.
 * These tests mock the LLM and DB to verify the onboarding flow logic.
 */

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock the DB module
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getOrCreateDefaultTenant: vi.fn(),
  createDeal: vi.fn(),
  createStakeholder: vi.fn(),
  createSnapshot: vi.fn(),
  getDealById: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";
import {
  getOrCreateDefaultTenant,
  createDeal,
  createStakeholder,
  createSnapshot,
} from "./db";

const mockedInvokeLLM = vi.mocked(invokeLLM);
const mockedGetOrCreateDefaultTenant = vi.mocked(getOrCreateDefaultTenant);
const mockedCreateDeal = vi.mocked(createDeal);
const mockedCreateStakeholder = vi.mocked(createStakeholder);
const mockedCreateSnapshot = vi.mocked(createSnapshot);

function createTestContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-open-id",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("onboarding.analyzeCompanyUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetOrCreateDefaultTenant.mockResolvedValue({ id: 1, name: "Test Tenant" } as any);
  });

  it("returns parsed company analysis from LLM", async () => {
    const mockAnalysis = {
      companyName: "Doctor Scrap",
      description: "Waste management and recycling company",
      industry: "Waste Management",
      products: ["Scrap Metal Recycling", "Industrial Waste Processing"],
      targetMarket: "Manufacturing companies",
      headquarters: "Hangzhou, China",
      estimatedSize: "200-500 employees",
      keyDifferentiator: "AI-powered scrap pricing",
    };

    mockedInvokeLLM.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockAnalysis),
            role: "assistant",
          },
          index: 0,
          finish_reason: "stop",
        },
      ],
    } as any);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.analyzeCompanyUrl({
      url: "https://www.doctorscrap.com",
    });

    expect(result.companyName).toBe("Doctor Scrap");
    expect(result.industry).toBe("Waste Management");
    expect(result.products).toEqual(["Scrap Metal Recycling", "Industrial Waste Processing"]);
    expect(result.headquarters).toBe("Hangzhou, China");
    expect(mockedInvokeLLM).toHaveBeenCalledTimes(1);
  });

  it("handles LLM returning markdown-wrapped JSON", async () => {
    const mockAnalysis = {
      companyName: "TestCo",
      description: "A test company",
      industry: "Technology",
      products: ["SaaS"],
      targetMarket: "Enterprises",
    };

    mockedInvokeLLM.mockResolvedValue({
      choices: [
        {
          message: {
            content: "```json\n" + JSON.stringify(mockAnalysis) + "\n```",
            role: "assistant",
          },
          index: 0,
          finish_reason: "stop",
        },
      ],
    } as any);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.analyzeCompanyUrl({
      url: "https://testco.com",
    });

    expect(result.companyName).toBe("TestCo");
    expect(result.industry).toBe("Technology");
  });

  it("returns fallback when LLM returns invalid JSON", async () => {
    mockedInvokeLLM.mockResolvedValue({
      choices: [
        {
          message: {
            content: "I cannot analyze this URL because...",
            role: "assistant",
          },
          index: 0,
          finish_reason: "stop",
        },
      ],
    } as any);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.analyzeCompanyUrl({
      url: "https://www.example.com",
    });

    // Should return fallback with domain-extracted name
    expect(result.companyName).toBe("example.com");
    expect(result.description).toBe("Company information extracted from URL");
  });
});

describe("onboarding.createDealFromUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetOrCreateDefaultTenant.mockResolvedValue({ id: 1, name: "Test Tenant" } as any);
    mockedCreateDeal.mockResolvedValue(42);
    mockedCreateStakeholder.mockResolvedValue({} as any);
    mockedCreateSnapshot.mockResolvedValue({} as any);
  });

  it("creates a deal with stakeholders and insights", async () => {
    const mockStakeholders = [
      {
        name: "Maria Rodriguez",
        title: "Head of Sustainability",
        role: "Champion",
        sentiment: "Positive",
        engagement: "High",
        keyInsights: "Focused on ESG goals",
      },
      {
        name: "David Chen",
        title: "CFO",
        role: "Decision Maker",
        sentiment: "Neutral",
        engagement: "Medium",
        keyInsights: "Cost-focused",
      },
    ];

    const mockInsights = {
      whatsHappening: "Initial discovery phase with Doctor Scrap",
      keyRisks: [{ title: "Budget constraints", detail: "Q2 budget freeze", stakeholders: [] }],
      whatsNext: [{ action: "Schedule discovery call", rationale: "Build rapport", suggestedContacts: [] }],
    };

    // First LLM call: stakeholder generation
    // Second LLM call: insight generation
    mockedInvokeLLM
      .mockResolvedValueOnce({
        choices: [
          {
            message: { content: JSON.stringify(mockStakeholders), role: "assistant" },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any)
      .mockResolvedValueOnce({
        choices: [
          {
            message: { content: JSON.stringify(mockInsights), role: "assistant" },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.createDealFromUrl({
      companyUrl: "https://www.doctorscrap.com",
      companyName: "Doctor Scrap",
      companyDescription: "Waste management company",
      industry: "Waste Management",
    });

    expect(result.dealId).toBe(42);
    expect(result.stakeholderCount).toBe(2);

    // Verify deal was created
    expect(mockedCreateDeal).toHaveBeenCalledTimes(1);
    expect(mockedCreateDeal).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Doctor Scrap - New Opportunity",
        company: "Doctor Scrap",
        website: "https://www.doctorscrap.com",
        stage: "Discovery",
        confidenceScore: 30,
      })
    );

    // Verify stakeholders were created
    expect(mockedCreateStakeholder).toHaveBeenCalledTimes(2);
    expect(mockedCreateStakeholder).toHaveBeenCalledWith(
      expect.objectContaining({
        dealId: 42,
        name: "Maria Rodriguez",
        title: "Head of Sustainability",
        role: "Champion",
      })
    );

    // Verify snapshot was created with insights
    expect(mockedCreateSnapshot).toHaveBeenCalledTimes(1);
    expect(mockedCreateSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        dealId: 42,
        whatsHappening: "Initial discovery phase with Doctor Scrap",
        confidenceScore: 30,
        aiGenerated: true,
      })
    );
  });

  it("creates deal with fallback stakeholders when LLM fails", async () => {
    // LLM fails for stakeholders
    mockedInvokeLLM
      .mockRejectedValueOnce(new Error("LLM unavailable"))
      .mockRejectedValueOnce(new Error("LLM unavailable"));

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.createDealFromUrl({
      companyUrl: "https://www.example.com",
      companyName: "Example Corp",
    });

    expect(result.dealId).toBe(42);
    expect(result.stakeholderCount).toBe(1); // Fallback creates 1 minimal stakeholder
    expect(mockedCreateStakeholder).toHaveBeenCalledTimes(1);
    expect(mockedCreateStakeholder).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Contact Person",
        role: "Champion",
      })
    );
  });

  it("includes ICP context in stakeholder generation prompt", async () => {
    const mockStakeholders = [
      { name: "Test Person", title: "VP", role: "Champion", sentiment: "Positive", engagement: "High", keyInsights: "Test" },
    ];

    mockedInvokeLLM
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockStakeholders), role: "assistant" }, index: 0, finish_reason: "stop" }],
      } as any)
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ whatsHappening: "Test", keyRisks: [], whatsNext: [] }), role: "assistant" }, index: 0, finish_reason: "stop" }],
      } as any);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await caller.onboarding.createDealFromUrl({
      companyUrl: "https://test.com",
      companyName: "Test Co",
      icp: {
        titles: "VP of Procurement, Supply Chain Director",
        painPoints: "Opaque pricing, difficult supplier management",
      },
    });

    // Verify the LLM was called with ICP context in the prompt
    const stakeholderCall = mockedInvokeLLM.mock.calls[0];
    const userMessage = stakeholderCall[0].messages[1].content as string;
    expect(userMessage).toContain("VP of Procurement, Supply Chain Director");
    expect(userMessage).toContain("Opaque pricing");
  });
});
