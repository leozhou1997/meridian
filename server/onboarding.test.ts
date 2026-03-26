import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the onboarding router procedures.
 * Covers: company profile CRUD, URL analysis, target company analysis,
 * and deal creation with AI agent flow.
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
  createCompanyProfile: vi.fn(),
  updateCompanyProfile: vi.fn(),
  getCompanyProfile: vi.fn(),
  createKbDocument: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";
import {
  getOrCreateDefaultTenant,
  createDeal,
  createStakeholder,
  createSnapshot,
  createCompanyProfile,
  updateCompanyProfile,
  getCompanyProfile,
} from "./db";

const mockedInvokeLLM = vi.mocked(invokeLLM);
const mockedGetOrCreateDefaultTenant = vi.mocked(getOrCreateDefaultTenant);
const mockedCreateDeal = vi.mocked(createDeal);
const mockedCreateStakeholder = vi.mocked(createStakeholder);
const mockedCreateSnapshot = vi.mocked(createSnapshot);
const mockedCreateCompanyProfile = vi.mocked(createCompanyProfile);
const mockedUpdateCompanyProfile = vi.mocked(updateCompanyProfile);
const mockedGetCompanyProfile = vi.mocked(getCompanyProfile);

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

// ─── Company Profile Tests ──────────────────────────────────────────────────

describe("onboarding.getCompanyProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetOrCreateDefaultTenant.mockResolvedValue({ id: 1, name: "Test Tenant" } as any);
  });

  it("returns null when no company profile exists", async () => {
    mockedGetCompanyProfile.mockResolvedValue(undefined as any);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.onboarding.getCompanyProfile();

    expect(result).toBeNull();
    expect(mockedGetCompanyProfile).toHaveBeenCalledWith(1);
  });

  it("returns existing company profile", async () => {
    mockedGetCompanyProfile.mockResolvedValue({
      id: 1,
      tenantId: 1,
      companyName: "Doctor Scrap",
      industry: "Waste Management",
    } as any);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.onboarding.getCompanyProfile();

    expect(result).not.toBeNull();
    expect(result!.companyName).toBe("Doctor Scrap");
  });
});

describe("onboarding.saveCompanyProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetOrCreateDefaultTenant.mockResolvedValue({ id: 1, name: "Test Tenant" } as any);
  });

  it("creates a new company profile when none exists", async () => {
    mockedGetCompanyProfile.mockResolvedValue(undefined as any);
    mockedCreateCompanyProfile.mockResolvedValue(42);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.saveCompanyProfile({
      companyName: "Doctor Scrap",
      companyWebsite: "https://www.doctorscrap.com",
      industry: "Waste Management",
      products: ["Scrap Metal Trading Platform"],
      salesStages: ["Discovery", "Demo", "POC", "Negotiation"],
      icpIndustries: "Manufacturing, Automotive",
      icpTitles: "VP of Procurement",
    });

    expect(result.profileId).toBe(42);
    expect(mockedCreateCompanyProfile).toHaveBeenCalledTimes(1);
    expect(mockedCreateCompanyProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 1,
        companyName: "Doctor Scrap",
        companyWebsite: "https://www.doctorscrap.com",
        onboardingCompleted: true,
      })
    );
  });

  it("updates existing company profile", async () => {
    mockedGetCompanyProfile.mockResolvedValue({ id: 5, tenantId: 1 } as any);
    mockedUpdateCompanyProfile.mockResolvedValue(undefined);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.saveCompanyProfile({
      companyName: "Doctor Scrap Updated",
      industry: "Recycling",
    });

    expect(result.profileId).toBe(5);
    expect(mockedUpdateCompanyProfile).toHaveBeenCalledTimes(1);
    expect(mockedCreateCompanyProfile).not.toHaveBeenCalled();
  });
});

// ─── Analyze Company URL Tests (Onboarding — YOUR company) ─────────────────

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
          message: { content: JSON.stringify(mockAnalysis), role: "assistant" },
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
          message: { content: "I cannot analyze this URL", role: "assistant" },
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

    expect(result.companyName).toBe("example.com");
    expect(result.description).toBe("Company information extracted from URL");
  });
});

// ─── Analyze Target Company Tests (Deal Creation) ──────────────────────────

describe("onboarding.analyzeTargetCompany", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetOrCreateDefaultTenant.mockResolvedValue({ id: 1, name: "Test Tenant" } as any);
  });

  it("includes seller context from company profile in analysis", async () => {
    mockedGetCompanyProfile.mockResolvedValue({
      id: 1,
      companyName: "Doctor Scrap",
      products: ["Scrap Metal Trading Platform"],
      targetMarket: "Manufacturing companies",
      icpIndustries: "Automotive, Steel",
    } as any);

    const mockAnalysis = {
      companyName: "Stellantis N.V.",
      description: "Global automaker",
      industry: "Automotive Manufacturing",
      products: ["Vehicles"],
      sellerAngle: "Doctor Scrap can help manage scrap metal from manufacturing",
    };

    mockedInvokeLLM.mockResolvedValue({
      choices: [
        {
          message: { content: JSON.stringify(mockAnalysis), role: "assistant" },
          index: 0,
          finish_reason: "stop",
        },
      ],
    } as any);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.analyzeTargetCompany({
      url: "https://www.stellantis.com",
    });

    expect(result.companyName).toBe("Stellantis N.V.");
    expect(result.sellerAngle).toContain("Doctor Scrap");

    // Verify LLM prompt includes seller context
    const llmCall = mockedInvokeLLM.mock.calls[0];
    const systemMsg = llmCall[0].messages[0].content as string;
    expect(systemMsg).toContain("Doctor Scrap");
    expect(systemMsg).toContain("Scrap Metal Trading Platform");
  });

  it("works without company profile (no seller context)", async () => {
    mockedGetCompanyProfile.mockResolvedValue(undefined as any);

    const mockAnalysis = {
      companyName: "Generic Corp",
      description: "A company",
      industry: "Technology",
    };

    mockedInvokeLLM.mockResolvedValue({
      choices: [
        {
          message: { content: JSON.stringify(mockAnalysis), role: "assistant" },
          index: 0,
          finish_reason: "stop",
        },
      ],
    } as any);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.analyzeTargetCompany({
      url: "https://www.generic.com",
    });

    expect(result.companyName).toBe("Generic Corp");
    expect(result.sellerAngle).toBe("");
  });
});

// ─── Create Deal from URL Tests ────────────────────────────────────────────

describe("onboarding.createDealFromUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetOrCreateDefaultTenant.mockResolvedValue({ id: 1, name: "Test Tenant" } as any);
    mockedCreateDeal.mockResolvedValue(42);
    mockedCreateStakeholder.mockResolvedValue({} as any);
    mockedCreateSnapshot.mockResolvedValue({} as any);
    mockedGetCompanyProfile.mockResolvedValue(null as any);
  });

  it("creates a deal with stakeholders and insights", async () => {
    const mockStakeholders = [
      { name: "Maria Rodriguez", title: "Head of Sustainability", role: "Champion", sentiment: "Positive", engagement: "High", keyInsights: "Focused on ESG" },
      { name: "David Chen", title: "CFO", role: "Decision Maker", sentiment: "Neutral", engagement: "Medium", keyInsights: "Cost-focused" },
    ];

    const mockInsights = {
      whatsHappening: "Initial discovery phase",
      keyRisks: [{ title: "Budget constraints", detail: "Q2 freeze", stakeholders: [] }],
      whatsNext: [{ action: "Schedule call", rationale: "Build rapport", suggestedContacts: [] }],
    };

    mockedInvokeLLM
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockStakeholders), role: "assistant" }, index: 0, finish_reason: "stop" }],
      } as any)
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockInsights), role: "assistant" }, index: 0, finish_reason: "stop" }],
      } as any);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.createDealFromUrl({
      targetCompanyUrl: "https://www.stellantis.com",
      targetCompanyName: "Stellantis N.V.",
      targetCompanyDescription: "Global automaker",
      targetIndustry: "Automotive",
    });

    expect(result.dealId).toBe(42);
    expect(result.stakeholderCount).toBe(2);

    // Verify deal was created with correct name (no " - New Opportunity" suffix)
    expect(mockedCreateDeal).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Stellantis N.V.",
        company: "Stellantis N.V.",
        website: "https://www.stellantis.com",
        stage: "Discovery",
        confidenceScore: 30,
      })
    );

    // Verify stakeholders were created
    expect(mockedCreateStakeholder).toHaveBeenCalledTimes(2);

    // Verify snapshot was created
    expect(mockedCreateSnapshot).toHaveBeenCalledTimes(1);
    expect(mockedCreateSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        dealId: 42,
        whatsHappening: "Initial discovery phase",
        aiGenerated: true,
      })
    );
  });

  it("creates deal with fallback stakeholders when LLM fails", async () => {
    mockedInvokeLLM
      .mockRejectedValueOnce(new Error("LLM unavailable"))
      .mockRejectedValueOnce(new Error("LLM unavailable"));

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.createDealFromUrl({
      targetCompanyUrl: "https://www.example.com",
      targetCompanyName: "Example Corp",
    });

    expect(result.dealId).toBe(42);
    expect(result.stakeholderCount).toBe(1);
    expect(mockedCreateStakeholder).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Contact Person",
        role: "Champion",
      })
    );
  });

  it("includes seller context when company profile exists", async () => {
    mockedGetCompanyProfile.mockResolvedValue({
      id: 1,
      companyName: "Doctor Scrap",
      products: ["Scrap Metal Trading"],
      targetMarket: "Manufacturing",
      icpIndustries: "Automotive",
      icpTitles: "VP Procurement",
      icpPainPoints: "Opaque pricing",
      keyDifferentiator: "AI pricing",
    } as any);

    const mockStakeholders = [
      { name: "Test", title: "VP", role: "Champion", sentiment: "Positive", engagement: "High", keyInsights: "Test" },
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
      targetCompanyUrl: "https://test.com",
      targetCompanyName: "Test Co",
    });

    // Verify the LLM prompt includes seller context
    const stakeholderCall = mockedInvokeLLM.mock.calls[0];
    const systemMsg = stakeholderCall[0].messages[0].content as string;
    expect(systemMsg).toContain("Doctor Scrap");
    expect(systemMsg).toContain("Scrap Metal Trading");
    expect(systemMsg).toContain("VP Procurement");
  });
});
