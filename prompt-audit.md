# AI Prompt Audit

## All Prompt Locations

### 1. ai.ts - Brief Generation (`brief_generation`)
- DEFAULT_BRIEF_SYSTEM_PROMPT (line 61-90)
- Already checks `getActivePrompt("brief_generation")` 
- User prompt built dynamically (line 166-189)

### 2. ai.ts - Signal Extraction (`signal_extraction`)
- DEFAULT_SIGNAL_SYSTEM_PROMPT (line 92-102)
- Already checks `getActivePrompt("signal_extraction")`
- User prompt built dynamically (line 224-226)

### 3. ai.ts - Deal Insight Generation (`deal_insight_generation`)
- Evidence-based system prompt (line 424-459) - hardcoded
- Early-stage system prompt (line 462-500) - hardcoded
- User prompt built dynamically (line 507-518)
- Does NOT use getActivePrompt yet

### 4. ai.ts - Deal Chat (`deal_chat`)
- System prompt (line 648-668) - hardcoded
- User prompt built dynamically (line 682-694)
- Does NOT use getActivePrompt yet

### 5. onboarding.ts - Company Profile Analysis (`company_profile_analysis`)
- System prompt (line 34) - hardcoded
- User prompt built dynamically (line 60)

### 6. onboarding.ts - Stakeholder Generation (`stakeholder_generation`)
- System prompt inline (line 252-253 area) - hardcoded

### 7. onboarding.ts - Insight Generation (`insight_generation`)
- System prompt inline (line 316-317 area) - hardcoded

### 8. onboarding.ts - Target Company Analysis (`target_company_analysis`)
- System prompt (line 369) - hardcoded
- User prompt (line 395)

## Summary
- 8 distinct prompt features
- 2 already use getActivePrompt (brief_generation, signal_extraction)
- 6 need to be refactored to use DB prompts
- promptTemplates table already exists in schema

## Plan
- Seed all 8 prompts into DB
- Refactor all 6 remaining to use getActivePrompt
- Build admin UI for managing all prompts
