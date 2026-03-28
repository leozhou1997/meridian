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

## Comprehensive Update (i18n + Sales Models + Stakeholder Map + AI Prompts)

### 1. Full Chinese i18n (including AI dynamic content)
- [x] AI-generated content respects user language preference (Deal Insight, What's Happening, Key Risks, What's Next, Pre-meeting Brief all output in Chinese when language=zh)
- [x] Pass language preference to all AI prompt calls
- [ ] Onboarding page full Chinese translation
- [ ] All remaining hardcoded English strings translated

### 2. Sales Model Switching (MEDDIC/BANT/Custom)
- [x] DB: Add salesModel field to deals table + salesModels table for custom models
- [x] Preset models: MEDDIC, BANT, SPICED, MEDDICC (4 built-in models with full dimension definitions)
- [x] Custom model: user can define model name + dimensions (CRUD API + DB persistence)
- [x] UI: Model selector dropdown on Deal Insight panel (badge + popover)
- [x] AI generates insights structured by selected model dimensions (prompt references framework by name)
- [x] Store custom models in DB per tenant (salesModels table with tenantId)

### 3. Concentric Circle Stakeholder Map
- [x] Replace current column layout with concentric circle layout
- [x] Inner ring: Decision Makers/Champions, Middle ring: Influencers/Evaluators, Outer ring: Blockers
- [x] Color coding: ring colors (blue inner, green middle, red outer) with role-based assignment
- [x] Connection lines between stakeholders preserved from previous implementation
- [x] AI-powered initial positioning based on role → ring assignment algorithm
- [x] Maintain drag-and-drop capability for manual adjustment

### 4. AI Prompt Optimization
- [x] Optimize Deal Insight generation prompt (veteran strategist persona, framework-grounded, political dynamics focus)
- [x] Optimize Stakeholder analysis prompt (realistic titles, cultural names, org-reality role assignment)
- [x] Optimize Pre-meeting Brief prompt (30-sec summary, power map, conversation playbook, landmines, specific ask)
- [x] Optimize Key Risks prompt (consequence-focused, stakeholder-named, framework-dimension-linked)
- [x] Optimize What's Next prompt (person+action+outcome format, mentor-style rationale)
- [x] Test all AI outputs end-to-end (40 tests passing, salesModels test suite added)

## AI Grounding & Stakeholder Map Overhaul (March 27)

### 1. AI Insight Grounding (eliminate hallucination)
- [x] Rewrite generateDealInsight: two-mode system (early-stage vs evidence-based) grounded in transcripts
- [x] No-transcript state: early-stage warning banner + hypothesis-labeled output (no fabrication)
- [x] Early-stage (no transcripts): company profile + stakeholder roles only, all labeled as hypotheses
- [x] With transcripts: evidence-based mode grounds all insights in specific meeting content
- [x] AI must cite/reference specific meeting evidence when generating insights
- [x] chatWithDeal: also ground responses in available transcript data

### 2. Stakeholder Map Visual Overhaul
- [x] Concentric circles scale dynamically with zoom (SVG rings inside zoom transform div)
- [x] Expand/Collapse toggle button in toolbar: compact = small avatar dots, expanded = full detail cards
- [x] Cards positioned within ring radii by concentric layout algorithm
- [x] View switching: Concentric / Stages toggle buttons in toolbar
- [x] Stage-based view: columns for each buying stage with role-based inference + column dividers
- [x] Fix reset button (was Maximize2 icon, now RotateCcw icon, resets layout + zoom)

### 3. English-first focus
- [x] Pause Chinese i18n work, focus on English demo quality

## Deal Activity Timeline (March 27)

### Merge Account Signals + All Interactions into unified timeline
- [x] Remove Account Signals tab
- [x] Remove All Interactions tab
- [x] Create new "Deal Timeline" tab (replaces both)
- [x] Vertical timeline component: top-to-bottom chronological (newest first), center line
- [x] Left side: AI-generated insights (snapshots — What's Happening, Key Risks, What's Next)
- [x] Right side: Transcript/meeting events (uploaded recordings, call notes)
- [x] Each node expandable: click to see full details (animated expand/collapse)
- [x] Fix [object Object] bug in Key Risks rendering on snapshot cards (proper formatKeyRisk helper)
- [ ] Editable metadata on timeline nodes (date, source, etc.)
- [x] Clear source labeling: "AI Analysis" vs "Initial Assessment" badges on snapshot nodes
- [x] Company Overview card at the top of timeline as anchor

## Logo/Avatar Placeholders + Knowledge Base Rebuild (March 27)

### 1. Smart Placeholders for Missing Logos & Avatars
- [x] Company logo: if no real logo URL, show colored initial letter circle (e.g., Nike → "N" in orange)
- [x] Stakeholder avatar: if no real avatar URL, show cartoon/icon placeholder (consistent style)
- [x] Apply across all views: Pipeline sidebar, Deal Detail, Stakeholder Map, Timeline, Dashboard

### 2. Knowledge Base — Sales Framework Section
- [x] New dedicated "Sales Frameworks" section in Knowledge Base page
- [x] Display all built-in models (MEDDIC, BANT, SPICED, MEDDICC) as expandable cards
- [x] Each model card: name, description, dimensions with explanations, expand/collapse
- [x] Fork/customize: user can create variant of built-in model (copy + modify dimensions)
- [x] Create fully custom model from scratch
- [x] Custom Prompt field: let user inject additional AI analysis instructions per model
- [x] Edit/delete custom models

### 3. Knowledge Base — Document Cards Redesign
- [x] Redesign KB documents as expandable file-style cards (look like real PDF/Doc files)
- [x] File icon + title + date + type badge (PDF, Doc, etc.)
- [x] Click to expand and see full content
- [x] Visual distinction from Sales Framework section

## Stakeholder Map Fixes + AI Context + Demo Data Rebuild (March 27)

### 1. Stakeholder Map — Collision Detection & Connection Lines
- [x] Fix card overlap in Expanded mode: improve collision detection algorithm so cards don't stack on top of each other
- [x] Fix connection lines z-order: lines render AFTER cards in DOM with z-index 25 so they appear above z-20 cards
- [x] Fix connection lines in Compact mode: coordinates now use COMPACT_NODE_W/H, SVG layer fixed
- [x] Ensure lines are clearly visible (color, opacity, stroke-width) in both modes

### 2. AI Context Fix — Use Leo's Knowledge Base
- [x] Deal Insight AI must read from tenant's companyProfile (Leo's Meridian product info) as the seller context
- [x] Remove any logic that uses deal's target company as the "seller" context
- [x] Verify all AI prompts (generateDealInsight, chatWithDeal, generateBrief) use companyProfile as seller identity

### 3. Demo Data Rebuild
- [x] Clear ALL existing deals, stakeholders, meetings, snapshots, nextActions from Leo's account
- [x] Create 4 demo deals (Meridian selling to enterprise targets): Acme Corp, GlobalTech, Nexus Systems, Nike
- [x] Each deal: 4-6 stakeholders with realistic titles and roles
- [x] Each deal: 4-6 rich transcripts (30-min conversation level, detailed summaries)
- [x] Transcripts show realistic sales progression (discovery → demo → technical eval → negotiation)
- [x] Generate AI snapshots for each deal based on transcripts (via seed-snapshots.mjs)
- [x] Verify Deal Insight correctly references Meridian as the product being sold

## Bug Fixes (March 27)

- [x] Fix WhatsNextCard: TypeError "Cannot read properties of undefined (reading 'split')" on /deal/4

## Stakeholder Map: Circles & Stages Rebuild

- [x] Stages view: vertical lane columns (Stage 1 → Stage 4) from left to right
- [x] Stages view: each lane is a tall vertical rectangle as background
- [x] Stages view: editable lane titles (click to rename)
- [x] Stages view: independent position storage (separate from Circles positions)
- [x] Stages view: no role legend (Decision Maker / Influencer / Blocker) in top-left
- [x] Circles view: legend only shows in Circles mode, hidden in Stages mode
- [x] Switching between Circles and Stages auto-restores each view's independent positions
- [x] Stages positions persisted to DB (separate column or key from Circles positions)

## StakeholderMap Interaction Fixes (March 28)

- [x] Fix Edit Mode: cards cannot be dragged (broken after Circles/Stages rebuild)
- [x] Fix connection lines: all lines missing from map (SVG layer broken)
- [x] Fix Draw Link: clicking card after activating Draw Link does nothing
- [x] Add canvas pan: left-click drag on background moves the entire map viewport

## Bug Fixes (March 28 - Post Checkpoint)

- [x] Fix all stakeholder cards invisible: validIds Set<number> vs p.id string mismatch — positions filtered to empty, all cards disappeared

## Stakeholder Map + Data Cleanup (March 28)

- [ ] Fix stakeholder cards still not visible (debug root cause in browser)
- [ ] Delete MiraclePlus and Adidas AG deals from Leo's account
- [ ] Stages view: auto-assign stakeholders to lanes based on role on first switch
- [ ] Stages view: cross-lane connections only (hide same-lane connections or show as thin dashed)

## Stakeholder Map Layout Fixes (March 28)

- [x] Fix card overlap: dynamic ring radii based on card count and container width
- [x] Fix cards going off-screen: scale ring radii to fit within container bounds
- [x] Fix ring SVG background misalignment: use computeRingGeometry() for both card positions and SVG circles
- [x] Fix connection lines not rendering: buildDefaultConnections now uses role-based logic instead of stage-based
- [x] Delete stale demo deals (Adidas AG, MiraclePlus) from database

## Stakeholder Map UX Fixes (March 28 - Round 2)

- [x] Fix duplicate profile modal: clicking a card opens two overlapping modals — root cause was duplicate onStakeholderClick call in handleMouseUp AND handleNodeClick; removed from handleMouseUp
- [x] Fix connection lines overlapping cards: SVG moved before cards (z-10 < z-20), edge-to-edge routing from card border not center, hover-only labels
- [x] Increase spacing between cards: ring radii scale dynamically, edge gap added to getEdgePoint()

## Stakeholder Profile Modal Fix (March 28)

- [x] Fix Stakeholder Profile modal: content not scrollable, info cut off at bottom of viewport

## Visual Cleanup (March 28)

- [x] Remove concentric ring background circles and center DEAL label from Stakeholder Map
- [x] Fix Stakeholder Profile modal: content not scrollable (replace ScrollArea with overflow-y-auto div)

## Stakeholder Map Ring Fix (March 28)

- [x] Restore concentric ring backgrounds (colored fills + dashed borders), remove only the center gray dot and DEAL label

## Stakeholder Map UX Improvements (March 28)

- [x] Ring legend: align colors to actual ring colors (blue=Decision Makers, green=Influencers, red=Blockers), hover ring to highlight legend
- [x] Connection lines: upgrade to cubic bezier arcs bowing perpendicular to line direction (22% bow, min 30px, max 80px)
- [x] Reset Layout button: clear localStorage cache (positions + history) and rebuild default connections
- [x] Map empty state: show guided prompt when a deal has no stakeholders

## Stakeholder Map Improvements Round 2 (March 28)

- [x] Ring legend hover: highlight corresponding ring SVG circle + dim cards of other roles
- [x] Auto-pan/zoom to newly added stakeholder after creation
- [x] Redesign connection lines for non-compact mode: adaptive bow (80px+ for short connections), always-visible type dot at midpoint, glow effect on hover, larger arrow markers

## Stakeholder Card Hover-Expand Redesign (March 28)

- [x] Merge Compact/Full card modes into single hover-expand card (~148×76px collapsed, full detail on hover)
- [x] Collapsed state: avatar + name + role badge, enough to identify the person without clutter
- [x] Expanded state (hover): full card with title, sentiment, interaction count, last contact, notes
- [x] Update ring radii and layout geometry for new smaller default card dimensions
- [x] Update connection line routing to use collapsed card dimensions as base
- [x] Remove the Compact/Full mode toggle button from the toolbar (no longer needed)

## Stakeholder Card Always-Visible Compact Redesign (March 28)

- [ ] Remove hover-expand pattern — all key info always visible (no AnimatePresence expand)
- [ ] Compress card to ~148×110px: tighten padding, merge title+heat into single row, inline interaction count
- [ ] Layout: row1=avatar+name+role badge+sentiment dot, row2=title (truncated), row3=heat bar + touchpoints + interaction count inline
- [ ] Hover: subtle border highlight only, no layout change
- [ ] Edit mode: show delete button + drag grip, same layout
- [ ] Update NODE_H to match new fixed card height

## Pipeline Sidebar & Toggle Button Redesign (March 28)

- [x] Restrict Pipeline sidebar to only Dashboard (/) and Deal detail (/deal/:id) pages — hide on Settings, Stakeholders, Transcripts, Ask, Knowledge
- [x] Remove the floating toggle button from AppLayout — it should not exist as a standalone element
- [x] Add PipelineContext to manage toggle state and pass to child pages
- [x] Deal detail page: add PipelineToggleButton in the deal header
- [x] Export PipelineToggleButton component for reuse in other pages
- [x] Add Deals button to left icon sidebar (Briefcase icon) between Dashboard and Stakeholders
- [x] Show Pipeline toggle button in left icon sidebar when sidebar is collapsed on Deal pages

## Editable Deal Info (March 28)

- [ ] Add inline-editable deal fields: company name, deal name, ACV/value, website, stage — click to edit, save on blur/Enter
- [ ] Place edit controls in the deal header or a dedicated "Deal Info" card in the overview tab

## Next Steps Redesign (March 28)

- [ ] Redesign Next Steps with status per item: Accepted / Rejected / Pending (for AI suggestions) + Done / In Progress / Blocked (for tasks)
- [ ] Keep history of all past AI-generated next steps snapshots (each insight refresh creates a new snapshot)
- [ ] Allow sales rep to mark each suggestion as accepted/rejected/pending
- [ ] Show historical snapshots in a collapsible timeline view

## Deal Timeline Rebuild (March 28)

- [ ] Rename "Deal Timeline" to "Deal Hub" or similar — make it a 3-tier content management library
- [ ] Tier 1 (top): AI-generated Insights (existing)
- [ ] Tier 2 (middle): Notes — text notes, conversation screenshots, any freeform context
- [ ] Tier 3 (bottom): Sales Actions — outbound artifacts sent to customer (PDFs, proposals, emails)
- [ ] Support multi-type uploads: Meeting Transcript (text), Video/Audio file, Screenshot (image), PDF document
- [ ] Remove the "Update Customer History" refresh button from deal header (or move into timeline as a CRM sync action item)
- [ ] Frontend only — no backend parsing needed yet, just UI scaffolding with upload placeholders

## Deals Management Page & Pipeline Handle Redesign (March 28)

- [ ] Create Deals management page (/deals) — comprehensive table/list view with filtering, sorting, stage grouping
- [ ] Pipeline sidebar only shows on Deal Detail pages (/deal/:id), NOT on Dashboard or Deals page
- [ ] Remove Pipeline toggle from icon sidebar nav items
- [ ] Add edge-tab handle: when Pipeline sidebar is collapsed on Deal Detail, show a protruding tab on the right edge of icon sidebar with arrow icon (→), clicking expands the Pipeline sidebar
- [ ] Handle should visually "poke out" from the icon sidebar layer, suggesting a hidden layer behind it
- [ ] Register /deals route in App.tsx
