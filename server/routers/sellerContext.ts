/**
 * Shared helper to build seller context for AI prompts.
 * Aggregates companyProfile + kbDocuments extractedContent.
 */
import { getCompanyProfile, getKbDocuments } from "../db";

const MAX_KB_CHARS = 6000; // Total budget for knowledge base content

export interface SellerContextResult {
  /** Full seller context block to inject into AI system prompts */
  contextBlock: string;
  /** Company name (for reference in prompts) */
  companyName: string | null;
}

/**
 * Build a comprehensive seller context block from:
 * 1. companyProfiles table (company info, products, ICP, etc.)
 * 2. kbDocuments table (extractedContent from uploaded docs)
 *
 * Returns a formatted string ready to inject into AI system prompts.
 */
export async function buildSellerContext(tenantId: number): Promise<SellerContextResult> {
  const profile = await getCompanyProfile(tenantId);
  const kbDocs = await getKbDocuments(tenantId);

  if (!profile && kbDocs.length === 0) {
    return { contextBlock: "", companyName: null };
  }

  const parts: string[] = [];
  const companyName = profile?.companyName ?? null;

  // ── Company Profile ──
  if (profile) {
    parts.push(`=== SELLER CONTEXT (CRITICAL — READ FIRST) ===
You are analyzing deals on behalf of **${profile.companyName}**.
Seller Company: ${profile.companyName}
Seller Products: ${(profile.products as string[] | null)?.join(", ") ?? "Not specified"}
Seller Description: ${profile.companyDescription ?? ""}
Key Differentiators: ${profile.keyDifferentiator ?? ""}
Target Market: ${profile.targetMarket ?? ""}
ICP Pain Points: ${profile.icpPainPoints ?? ""}`);
  }

  // ── Knowledge Base Documents ──
  // Aggregate extractedContent from all kbDocuments, respecting the char budget
  const completedDocs = kbDocs.filter(
    (d) => d.processingStatus === "completed" && d.extractedContent && d.extractedContent.trim().length > 0
  );

  if (completedDocs.length > 0) {
    let totalChars = 0;
    const docBlocks: string[] = [];

    for (const doc of completedDocs) {
      const content = doc.extractedContent!.trim();
      const remaining = MAX_KB_CHARS - totalChars;
      if (remaining <= 200) break; // Stop if budget nearly exhausted

      const truncated = content.length > remaining ? content.slice(0, remaining) + "..." : content;
      docBlocks.push(`[${doc.category.toUpperCase()}: ${doc.name}]\n${truncated}`);
      totalChars += truncated.length;
    }

    if (docBlocks.length > 0) {
      parts.push(`\n=== KNOWLEDGE BASE (${docBlocks.length} documents) ===\n${docBlocks.join("\n\n")}`);
    }
  } else if (profile?.knowledgeBaseText) {
    // Fallback: use legacy knowledgeBaseText field
    parts.push(`\nKnowledge Base:\n${profile.knowledgeBaseText.slice(0, MAX_KB_CHARS)}`);
  }

  // ── Critical instruction ──
  if (companyName) {
    parts.push(
      `\nCRITICAL: All deal analysis must be from the perspective of ${companyName} selling their products to the prospect. The "company" in the deal is the PROSPECT (buyer), not the seller.`
    );
  }

  return {
    contextBlock: parts.length > 0 ? "\n\n" + parts.join("\n") : "",
    companyName,
  };
}
