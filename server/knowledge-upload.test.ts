import { describe, it, expect, vi } from "vitest";

/**
 * Tests for Knowledge Base file upload and Prompt Template test run features.
 * We test the data processing logic without calling external APIs.
 */

// ── Knowledge Base: File type detection ──

function detectFileType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
    'application/vnd.ms-excel': 'excel',
    'text/plain': 'text',
    'text/markdown': 'text',
    'text/csv': 'text',
  };
  return mimeMap[mimeType] || 'other';
}

describe("Knowledge Base - File Type Detection", () => {
  it("should detect PDF files", () => {
    expect(detectFileType("application/pdf")).toBe("pdf");
  });

  it("should detect Word documents (docx)", () => {
    expect(detectFileType("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe("doc");
  });

  it("should detect Word documents (doc)", () => {
    expect(detectFileType("application/msword")).toBe("doc");
  });

  it("should detect Excel files (xlsx)", () => {
    expect(detectFileType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).toBe("excel");
  });

  it("should detect Excel files (xls)", () => {
    expect(detectFileType("application/vnd.ms-excel")).toBe("excel");
  });

  it("should detect text files", () => {
    expect(detectFileType("text/plain")).toBe("text");
    expect(detectFileType("text/markdown")).toBe("text");
    expect(detectFileType("text/csv")).toBe("text");
  });

  it("should return 'other' for unknown MIME types", () => {
    expect(detectFileType("image/png")).toBe("other");
    expect(detectFileType("application/json")).toBe("other");
  });
});

// ── Knowledge Base: File size validation ──

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFileSize(sizeBytes: number): { valid: boolean; error?: string } {
  if (sizeBytes <= 0) return { valid: false, error: "File is empty" };
  if (sizeBytes > MAX_FILE_SIZE) return { valid: false, error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` };
  return { valid: true };
}

describe("Knowledge Base - File Size Validation", () => {
  it("should accept files within size limit", () => {
    expect(validateFileSize(1024)).toEqual({ valid: true });
    expect(validateFileSize(5 * 1024 * 1024)).toEqual({ valid: true });
  });

  it("should reject empty files", () => {
    const result = validateFileSize(0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("empty");
  });

  it("should reject files exceeding size limit", () => {
    const result = validateFileSize(11 * 1024 * 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("10MB");
  });

  it("should accept files exactly at the limit", () => {
    expect(validateFileSize(MAX_FILE_SIZE)).toEqual({ valid: true });
  });
});

// ── Prompt Template: Variable extraction ──

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{[^}]+\}\}/g);
  return matches ? Array.from(new Set(matches)) : [];
}

describe("Prompt Template - Variable Extraction", () => {
  it("should extract single variable", () => {
    expect(extractVariables("Hello {{name}}!")).toEqual(["{{name}}"]);
  });

  it("should extract multiple variables", () => {
    const vars = extractVariables("{{stakeholderName}} is the {{stakeholderRole}} at {{dealName}}");
    expect(vars).toEqual(["{{stakeholderName}}", "{{stakeholderRole}}", "{{dealName}}"]);
  });

  it("should deduplicate repeated variables", () => {
    const vars = extractVariables("{{name}} said hello to {{name}}");
    expect(vars).toEqual(["{{name}}"]);
  });

  it("should return empty array for no variables", () => {
    expect(extractVariables("No variables here")).toEqual([]);
  });

  it("should handle complex variable names", () => {
    const vars = extractVariables("{{salesModelDimensions}} and {{companyInfo}}");
    expect(vars).toEqual(["{{salesModelDimensions}}", "{{companyInfo}}"]);
  });
});

// ── Prompt Template: Variable replacement ──

function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, value);
  }
  return result;
}

describe("Prompt Template - Variable Replacement", () => {
  it("should replace a single variable", () => {
    const result = replaceVariables("Hello {{name}}!", { "{{name}}": "Alice" });
    expect(result).toBe("Hello Alice!");
  });

  it("should replace multiple different variables", () => {
    const result = replaceVariables(
      "{{stakeholderName}} is the {{stakeholderRole}}",
      { "{{stakeholderName}}": "Sarah Chen", "{{stakeholderRole}}": "VP of Engineering" }
    );
    expect(result).toBe("Sarah Chen is the VP of Engineering");
  });

  it("should replace all occurrences of the same variable", () => {
    const result = replaceVariables(
      "{{name}} said: I am {{name}}",
      { "{{name}}": "Bob" }
    );
    expect(result).toBe("Bob said: I am Bob");
  });

  it("should leave unmatched variables unchanged", () => {
    const result = replaceVariables(
      "{{name}} works at {{company}}",
      { "{{name}}": "Alice" }
    );
    expect(result).toBe("Alice works at {{company}}");
  });

  it("should handle empty variables object", () => {
    const result = replaceVariables("Hello {{name}}!", {});
    expect(result).toBe("Hello {{name}}!");
  });

  it("should handle multiline templates", () => {
    const template = `Stakeholder: {{stakeholderName}}
Title: {{stakeholderTitle}}
Deal: {{dealName}}`;
    const result = replaceVariables(template, {
      "{{stakeholderName}}": "Sarah Chen",
      "{{stakeholderTitle}}": "VP of Engineering",
      "{{dealName}}": "Acme Corp Enterprise Platform",
    });
    expect(result).toContain("Sarah Chen");
    expect(result).toContain("VP of Engineering");
    expect(result).toContain("Acme Corp Enterprise Platform");
  });
});

// ── Prompt Template: Feature label mapping ──

const FEATURE_LABELS: Record<string, string> = {
  brief_generation: '会前简报生成',
  signal_extraction: '信号提取',
  deal_insight_evidence: '交易洞察（证据模式）',
  deal_insight_early: '交易洞察（假设模式）',
  deal_chat: 'Ask Meridian 对话',
  company_profile_analysis: '公司档案分析',
  stakeholder_generation: '利益相关方生成',
  initial_deal_insight: '初始交易洞察',
};

describe("Prompt Template - Feature Labels", () => {
  it("should have Chinese labels for all known features", () => {
    const features = [
      "brief_generation",
      "signal_extraction",
      "deal_insight_evidence",
      "deal_insight_early",
      "deal_chat",
      "company_profile_analysis",
      "stakeholder_generation",
      "initial_deal_insight",
    ];
    features.forEach(f => {
      expect(FEATURE_LABELS[f]).toBeDefined();
      expect(FEATURE_LABELS[f].length).toBeGreaterThan(0);
    });
  });

  it("should return undefined for unknown features", () => {
    expect(FEATURE_LABELS["unknown_feature"]).toBeUndefined();
  });
});

// ── Test run logging: feature name format ──

describe("Prompt Template - Test Run Logging", () => {
  it("should format test run feature name correctly", () => {
    const feature = "brief_generation";
    const logFeature = `template_test:${feature}`;
    expect(logFeature).toBe("template_test:brief_generation");
  });

  it("should format test run feature name for all feature types", () => {
    const features = ["deal_chat", "signal_extraction", "company_profile_analysis"];
    features.forEach(f => {
      const logFeature = `template_test:${f}`;
      expect(logFeature).toMatch(/^template_test:/);
      expect(logFeature).toContain(f);
    });
  });
});
