# Sales Intelligence Workflow — Product Insight

## Core Insight: Account Research as a Sales Acceleration Motion

The act of researching a target account before engaging is not a one-off task — it is a **repeatable, structured workflow** that every competent AE performs manually today. Meridian's long-term opportunity is to automate this workflow end-to-end, surfacing the right signals at the right moment in the deal cycle.

## The Manual Workflow (What AEs Do Today)

### Layer 1: Company-Level Research

When an AE targets a new account (e.g., McDonald's), they typically:

1. **Visit the company's official website** — scan for stated corporate strategy, mission, and priorities (e.g., "digital transformation", "sustainability", "operational efficiency")
2. **Search for recent news** — look for press releases, executive speeches, earnings calls, or industry announcements that signal a buying intent or strategic shift
3. **Identify Buying Signals** — e.g., if a Chief Strategy Officer publicly announces a digital transformation initiative, and the AE sells a digital product, this is a high-confidence buying signal that should immediately surface in the deal analysis

### Layer 2: Stakeholder-Level Research

Once the target company is identified, the AE drills down to the specific people they need to engage:

1. **LinkedIn profile review** — background, career history, current role, recent posts, shared connections
2. **Photo / visual impression** — AEs want to see what the person looks like before a meeting; this creates a mental anchor and helps with recognition and memory
3. **Google / news search** — if LinkedIn is not available, AEs search for the person's name + company to find photos, interviews, or quotes from industry events
4. **Signal extraction** — recent LinkedIn posts, articles shared, or public statements that reveal the person's priorities, concerns, or openness to specific solutions

## Why This Matters for Meridian

This workflow is currently **100% manual and undocumented**. AEs do it in their heads, in browser tabs, and in personal notes. Meridian's opportunity is to:

- **Automate the research layer**: when a new deal or stakeholder is added, Meridian should automatically pull company news, executive signals, and stakeholder profiles
- **Persist the intelligence**: store it as structured data in the deal's knowledge graph, not just as free-form notes
- **Surface it at the right moment**: e.g., before a meeting, show the AE "this stakeholder posted about AI adoption last week — mention it"
- **Feed it into the AI analysis**: buying signals from public sources should automatically enrich the `whatsHappening`, `keyRisks`, and `whatsNext` fields

## Planned Feature: Auto-Enrichment on Deal/Stakeholder Onboarding

**Trigger**: When a user adds a new deal (company name) or a new stakeholder (person name + company)

**Actions**:
1. Search company website → extract stated strategy and priorities
2. Search recent news (last 90 days) → extract buying signals and risk signals
3. Search LinkedIn / Google → fetch stakeholder photo, title, background summary
4. Store all extracted data as structured fields in the deal's knowledge graph
5. Auto-generate or update `whatsHappening` and `keyRisks` with the new signals

**Implementation options** (in order of cost/complexity):
- **Clearbit / Apollo / Hunter APIs** — cheapest for company data and email enrichment
- **Manus built-in search** — for news and web content extraction
- **Browser automation** — for LinkedIn (requires careful rate limiting and account management)
- **OpenAI + web search** — for synthesizing signals into structured insights

## Current Status

- Demo data uses AI-generated avatars and Clearbit logos (as of this version)
- Auto-enrichment workflow is **not yet implemented** — planned for a future sprint
- This feature should be designed as a background job that runs on deal/stakeholder creation, with results surfaced in the Deal Detail page

---

*Recorded: 2026-03-26 | Source: Product discussion with Leo Zhou*
