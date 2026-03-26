# Meridian TODO

## Completed

- [x] Basic dashboard with KPI cards, At Risk Deals, Pipeline by Stage
- [x] Deal Detail page with Buying Committee tab
- [x] Stakeholder Map with drag-and-drop, collision detection, connection lines
- [x] Deal Summary sidebar (fixed left panel)
- [x] Stakeholder Profile Panel (right sidebar)
- [x] All Interactions tab with rich transcript UI
- [x] Deal Strategy tab for internal notes
- [x] Know Your Stakeholder section (AI signals + personal notes)
- [x] View/Edit mode toggle on stakeholder map
- [x] Version history panel in edit mode
- [x] Dark/light mode toggle
- [x] Transcripts page (global meetings view)
- [x] Knowledge Base page
- [x] Rename Interaction → Meeting throughout codebase (TypeScript errors fixed)
- [x] Add NextAction type and nextActions field to Deal data model
- [x] Seed nextActions for all 5 deals
- [x] Next Actions module in Deal Summary sidebar (checkable tasks with due dates, add/delete)
- [x] Confidence score sparkline (trend chart from snapshots data)
- [x] Pre-meeting Brief button in stakeholder profile panel (modal with structured summary)

## In Progress / Planned

- [x] AI functionality framework with real LLM API integration (OpenAI GPT-4o)
- [x] AI Admin backend for prompt debugging (/admin/ai route)
- [x] Backend persistence — full database schema (12 tables: tenants, users, deals, stakeholders, meetings, snapshots, nextActions, kbDocuments, aiLogs, promptTemplates, tenantMembers)
- [x] All pages wired to real tRPC API (Dashboard, DealDetail, Transcripts, KnowledgeBase, Stakeholders)
- [x] Pre-meeting Brief modal wired to real OpenAI API
- [x] Demo data seeded (5 deals, 3 stakeholders per deal, meetings, snapshots, next actions, 5 KB documents)
- [ ] Deal Stuck warnings on Dashboard (visual alerts when daysInStage exceeds thresholds)
- [ ] Meeting upload / transcript submission to backend
- [ ] Voice transcription integration
- [ ] Multi-tenancy (team invite flow)
- [ ] Stripe billing integration
- [x] Collapsible Pipeline sidebar (auto-collapses on DealDetail, toggle button, persists preference)
- [x] Deal Summary moved to right-side Inspector Panel (Deal Intelligence) with improved visual hierarchy
- [x] Deal Insight panel moved to left side of Buying Committee tab (Confidence trend + What's Happening + Key Risks + What's Next + Next Actions)
- [x] Stakeholder Map moved to right side of Buying Committee tab
- [x] Inline Contextual Chat input at bottom of Deal Insight panel (AI-powered update of insights)
- [x] Deal Overview (static info) accessible separately, not blocking main insight view (Pipeline sidebar overlay mode on deal pages)
- [x] Remove Account Signals / All Interactions quick-nav buttons from Deal Insight panel
- [x] Remove Ask Meridian static bar from Stakeholder Map area
- [x] Pipeline overlay backdrop: dim Deal Insight when Pipeline is open, click-away to close
- [x] Simplify Deal Insight header: remove duplicate Stage/ACV, keep only Confidence score + trend chart
- [x] Stakeholder name highlighting in What's Happening / What's Next (hover underline + map node highlight, click to open profile)
- [x] Key Risks stakeholder name highlighting (same hover+click linkage as What's Happening/What's Next)
- [x] Deal Insight panel collapse/expand toggle (full-width Stakeholder Map when collapsed)
- [x] What's Next redesigned as expandable action cards with AI-suggested contacts and Add to Map button
- [x] Fix StakeholderLinkedText: match by title (CTO, VP of Engineering, etc.) in addition to full name
- [x] Migrate whatsNext to structured array {action, rationale} in AI snapshot generation
- [x] WhatsNextCard: add AI rationale section between title and contacts when expanded
- [x] WhatsNextCard: add Accept/Dismiss/Later feedback buttons (Accept → add to Next Actions)
- [x] Stakeholder Profile: redesign as centered modal with backdrop blur (replace right-side panel)
- [x] Fix WhatsNextCard: always expandable with rationale + Accept/Dismiss/Later, not gated on stakeholder presence
- [x] Fix generateDealInsight API error: "expected number received undefined" (missing confidenceScore field)
- [x] Persist AI insights to DB snapshot (whatsNext as JSON array) — insights survive page refresh, no re-generation needed
- [x] Remove Refresh button from Deal Insight panel header; replace with subtle Analyse button in confidence section
- [x] Pre-meeting Brief moved to first screen of Stakeholder Profile Modal (Brief tab default, auto-generates on open; Profile tab for full details)
- [x] Suggested Contacts in WhatsNextCard: AI-recommended people not yet on map, with Add to Map button and LinkedIn search link
- [x] whatsNext schema migrated from text to JSON in database
- [x] Fix What's Next: DB-persisted items still show "Hit Refresh" message instead of rationale
- [x] Fix stakeholder hover highlight (underline + blue highlight) broken after recent changes
- [x] Fix Key Risks AI prompt: generates verbose/redundant text after Analyze Deal (repeats stage/value/confidence already shown in header)
- [x] Fix left DVC panel not scrollable (content cut off on smaller screens)
- [x] Provide AI Prompt admin link for Key Risks prompt review (see /admin/ai route in app)
- [x] Fix Deal Insight panel scroll (still not working after h-full fix) — fixed via min-h-0 + overflow-hidden on ScrollArea
- [x] Fix What's Next rationale inconsistency — root cause was wrong .$type<string[]>() on whatsNext JSON column; corrected to WhatsNextItem[] type
- [x] Enrich demo data: AI-generated company logos for all 5 deals (Clearbit not applicable for fictional domains)
- [x] Enrich demo data: AI-generated realistic headshots for all 8 stakeholders (LinkedIn-quality)
- [x] Upload all enriched assets to CDN and update DB with real URLs (avatars + logos)
- [x] Key Risks: redesign as expandable cards matching WhatsNextCard format (title, rationale, relevant stakeholders)
- [x] Update AI prompt: Key Risks to return structured {title, detail, stakeholders[]} instead of plain text
- [x] Settings page: language switch (EN/ZH), account management (display name), team invite
- [x] Surface AI Prompt admin interface URL to user — /admin/playground

## Demo Prep (Doctor Scrap - March 27)

- [x] Onboarding wizard page (3-step: company website → sales process → ICP)
- [x] URL auto-crawl: AI scrapes company website and generates company profile
- [x] Auto-generate stakeholder map from company URL (AI-powered)
- [x] New Deal creation flow from onboarding wizard
- [x] Chinese language translations for all demo-facing pages
- [x] Doctor Scrap demo data (pre-seeded deals with their real customer types - auto-generated via onboarding)
- [ ] Demo guide document for Leo

## Onboarding Refactor + Deal Creation Flow

- [x] DB: Add companyProfile table (name, website, description, products, targetMarket, salesProcess, icp) — persistent company knowledge base
- [x] Refactor Onboarding page → "Company Setup" (CRM init: input YOUR company info, not target customer)
- [x] Onboarding Step 1: Company website + product info → AI ingests and creates Knowledge Base entry
- [x] Onboarding Step 2: Sales process definition (stages, deal size, cycle, team)
- [x] Onboarding Step 3: ICP definition (industries, company size, titles, pain points)
- [x] Persist all onboarding data to companyProfile table in DB
- [x] New Deal Creation flow (separate from onboarding) — input target customer URL
- [x] AI Agent animation: visual "robot working" window during deal creation (crawling website → analyzing → finding stakeholders → building map)
- [x] Deal creation reads companyProfile from DB to contextualize AI analysis
- [x] Auto-generate stakeholders and sync directly to Deal Map with positions
- [x] Fix "deal not found" error on new deal pages
- [x] Demo account: create a fresh account that shows empty state + onboarding prompt
- [x] Empty state: Dashboard shows "Welcome! Set up your company profile to get started" when no deals exist
- [x] Ensure Leo's existing account retains all current demo data

## Self-hosted Auth + Data Isolation + Fixes

- [x] Self-hosted auth: email+password registration page
- [x] Self-hosted auth: email+password login page
- [x] Self-hosted auth: bcrypt password hashing, JWT session management
- [x] Self-hosted auth: logout functionality (visible in UI)
- [x] Remove Manus OAuth dependency from auth flow
- [x] User data isolation: all queries filtered by tenantId (deals, stakeholders, meetings, snapshots, etc.)
- [x] Auto-create tenant on user registration (1 user = 1 tenant initially)
- [x] Create Leo demo account (leo@meridianos.ai / demo123) with existing demo data
- [x] New user empty state: register → onboarding → first deal creation
- [x] Fix /deal/new routing (currently shows "Deal not found")
- [x] Optimize onboarding AI prompt (company analysis too generic, needs specific product/value prop extraction)
