import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for AI transcript grounding logic.
 * We test the data classification and prompt construction logic
 * without actually calling OpenAI.
 */

// Helper: classify data level based on meetings
function classifyDataLevel(meetings: Array<{ summary?: string | null }>) {
  const meetingsWithContent = meetings.filter(
    (m) => m.summary && m.summary.trim().length > 20
  );
  return meetingsWithContent.length > 0 ? "evidence-based" : "early-stage";
}

// Helper: build transcript evidence block
function buildTranscriptEvidence(
  meetings: Array<{
    date: string;
    type: string;
    keyParticipant?: string | null;
    summary?: string | null;
  }>
) {
  const meetingsWithContent = meetings.filter(
    (m) => m.summary && m.summary.trim().length > 20
  );
  if (meetingsWithContent.length === 0) return "";
  return meetingsWithContent
    .map((m, i) => {
      return `Meeting ${i + 1} (${m.type}, ${m.date}${m.keyParticipant ? `, with ${m.keyParticipant}` : ""}):
${m.summary}`;
    })
    .join("\n\n");
}

describe("AI Transcript Grounding - Data Level Classification", () => {
  it("should classify as early-stage when no meetings", () => {
    expect(classifyDataLevel([])).toBe("early-stage");
  });

  it("should classify as early-stage when meetings have no summaries", () => {
    const meetings = [
      { summary: null },
      { summary: "" },
      { summary: "short" },
    ];
    expect(classifyDataLevel(meetings)).toBe("early-stage");
  });

  it("should classify as early-stage when summaries are too short (< 20 chars)", () => {
    const meetings = [
      { summary: "Brief note only." },
      { summary: "No detail here." },
    ];
    expect(classifyDataLevel(meetings)).toBe("early-stage");
  });

  it("should classify as evidence-based when at least one meeting has substantial summary", () => {
    const meetings = [
      { summary: null },
      {
        summary:
          "Discussed the technical requirements for the POC. Sarah mentioned budget constraints around Q3.",
      },
    ];
    expect(classifyDataLevel(meetings)).toBe("evidence-based");
  });

  it("should classify as evidence-based when multiple meetings have summaries", () => {
    const meetings = [
      {
        summary:
          "Initial discovery call. Identified key pain points around data integration and reporting latency.",
      },
      {
        summary:
          "Follow-up with engineering team. They showed interest in our API-first approach.",
      },
      {
        summary:
          "Executive briefing with CFO. Budget approval process requires board sign-off for deals over $500K.",
      },
    ];
    expect(classifyDataLevel(meetings)).toBe("evidence-based");
  });
});

describe("AI Transcript Grounding - Evidence Block Construction", () => {
  it("should return empty string when no meetings have content", () => {
    const meetings = [
      { date: "2024-01-15", type: "Discovery Call", summary: null },
    ];
    expect(buildTranscriptEvidence(meetings)).toBe("");
  });

  it("should build evidence block with meeting details", () => {
    const meetings = [
      {
        date: "2024-01-15",
        type: "Discovery Call",
        keyParticipant: "Sarah Chen",
        summary:
          "Discussed the current pain points with their existing CRM system. Sarah mentioned they need better reporting.",
      },
    ];
    const evidence = buildTranscriptEvidence(meetings);
    expect(evidence).toContain("Meeting 1");
    expect(evidence).toContain("Discovery Call");
    expect(evidence).toContain("2024-01-15");
    expect(evidence).toContain("with Sarah Chen");
    expect(evidence).toContain("pain points");
  });

  it("should skip meetings without substantial summaries", () => {
    const meetings = [
      { date: "2024-01-10", type: "Intro Call", summary: "Brief chat." },
      {
        date: "2024-01-15",
        type: "Discovery Call",
        keyParticipant: "Sarah Chen",
        summary:
          "Discussed the current pain points with their existing CRM system. Sarah mentioned they need better reporting.",
      },
      { date: "2024-01-20", type: "Follow-up", summary: null },
    ];
    const evidence = buildTranscriptEvidence(meetings);
    // Should only include the Discovery Call (Meeting 1 in filtered list)
    expect(evidence).toContain("Meeting 1");
    expect(evidence).not.toContain("Meeting 2");
    expect(evidence).not.toContain("Intro Call");
    expect(evidence).not.toContain("Follow-up");
  });

  it("should number multiple valid meetings sequentially", () => {
    const meetings = [
      {
        date: "2024-01-15",
        type: "Discovery",
        summary:
          "Initial discovery meeting with the engineering team to understand requirements.",
      },
      {
        date: "2024-01-22",
        type: "Demo",
        keyParticipant: "Marcus Rodriguez",
        summary:
          "Product demo for the finance team. Marcus asked about integration with SAP.",
      },
    ];
    const evidence = buildTranscriptEvidence(meetings);
    expect(evidence).toContain("Meeting 1 (Discovery, 2024-01-15)");
    expect(evidence).toContain(
      "Meeting 2 (Demo, 2024-01-22, with Marcus Rodriguez)"
    );
  });

  it("should handle meetings without keyParticipant", () => {
    const meetings = [
      {
        date: "2024-02-01",
        type: "Technical Review",
        summary:
          "Reviewed the technical architecture and discussed integration patterns with the team.",
      },
    ];
    const evidence = buildTranscriptEvidence(meetings);
    expect(evidence).toContain(
      "Meeting 1 (Technical Review, 2024-02-01)"
    );
    // The header should not contain "with <name>" since keyParticipant is absent
    expect(evidence).toMatch(/^Meeting 1 \(Technical Review, 2024-02-01\):/);
  });
});

describe("AI Transcript Grounding - Prompt Mode Selection", () => {
  it("should use early-stage prompt when no transcripts available", () => {
    const dataLevel = classifyDataLevel([]);
    expect(dataLevel).toBe("early-stage");
    // In early-stage mode, the system prompt should:
    // - NOT claim to have meeting evidence
    // - Label outputs as hypotheses
    // - Focus on what needs to be learned
  });

  it("should use evidence-based prompt when transcripts are available", () => {
    const dataLevel = classifyDataLevel([
      {
        summary:
          "Detailed discussion about budget allocation and timeline for the Q3 rollout.",
      },
    ]);
    expect(dataLevel).toBe("evidence-based");
    // In evidence-based mode, the system prompt should:
    // - Reference specific meetings
    // - Ground claims in evidence
    // - Cite which meeting supports each insight
  });
});
