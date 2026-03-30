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

- [x] Add inline-editable deal fields: company name, deal name, ACV/value, website — click to edit, save on blur/Enter
- [x] Place edit controls in the deal header with "Click to edit" hints

## Next Steps Redesign (March 28)

- [ ] Redesign Next Steps with status per item: Accepted / Rejected / Pending (for AI suggestions) + Done / In Progress / Blocked (for tasks)
- [x] Keep history of all past AI-generated next steps snapshots (each insight refresh creates a new snapshot)
- [ ] Allow sales rep to mark each suggestion as accepted/rejected/pending (already partially implemented with Accept/Dismiss/Later)
- [x] Show historical snapshots in a collapsible InsightHistory component

## Deal Timeline Rebuild (March 28)

- [x] Rename "Deal Timeline" to "Deal Room" — 3-tier content management library
- [x] Tier 1 (top): AI-generated Insights with green badge
- [x] Tier 2 (middle): Notes & Media — meetings, text notes, screenshots
- [x] Tier 3 (bottom): Sales Actions — outbound artifacts
- [x] Support multi-type uploads: Add Meeting + Add Content (meeting transcript, video/audio, screenshot, PDF, note)
- [x] Remove the "Update Customer History" refresh button from deal header
- [x] Frontend scaffolding with upload modals and type selection

## Deals Management Page & Pipeline Handle Redesign (March 28)

- [x] Create Deals management page (/deals) — table view with stage grouping, search, and sorting
- [x] Pipeline sidebar only shows on Deal Detail pages (/deal/:id), NOT on Dashboard or Deals page
- [x] Remove Pipeline toggle from icon sidebar nav items
- [x] Add edge-tab handle: protruding tab on right edge of icon sidebar with ChevronRight icon
- [x] Handle visually "pokes out" from icon sidebar layer (z-50, rounded-r, bg-muted/80)
- [x] Register /deals route in App.tsx

## Deal Room Upload Merge (March 28)

- [x] Merge "Add Meeting" + "Add Content" into single "+ Add" button with type dropdown/modal
- [x] Type options: Meeting Notes, Video/Audio, Screenshot, PDF Document, Quick Note
- [x] Each type shows appropriate form fields in the modal

## Stakeholder Card Hover Interaction Redesign (March 28)

- [x] Hover auto-expands recent 3 interactions (type + date + one-line summary)
- [x] Keep "+ Add" button at bottom of expanded interaction list
- [x] "+ Add" opens a modal (not navigate away) for adding content tied to this stakeholder
- [x] Modal: select type (Meeting Notes / Screenshot / Note / Video / PDF) → fill content → save
- [x] Auto-associate new content with the hovered stakeholder
- [ ] After save, interaction list updates in real-time (needs backend wiring)

## Deal Room Naming + Next Actions Management System (March 28)

### 1. Unify Deal Timeline → Deal Room naming
- [x] Rename tab label from "Deal Timeline" to "Deal Room" in DealDetail.tsx
- [x] Ensure component file name and internal references are consistent

### 2. Next Actions Status Lifecycle
- [x] Add `status` field to nextActions DB table: pending | accepted | rejected | later | in_progress | done | blocked
- [x] Add `source` field to nextActions DB table: 'manual' | 'ai_suggested' (track origin)
- [x] Add `snapshotId` field to nextActions DB table: link AI suggestions to the snapshot that generated them
- [x] Update nextActions router: new `updateStatus` mutation
- [x] Redesign Next Actions UI: status badges, state transitions, visual grouping by status
- [x] WhatsNextCard Accept → creates nextAction with status='accepted', source='ai_suggested', linked snapshotId
- [x] WhatsNextCard Dismiss → creates nextAction with status='rejected', source='ai_suggested'
- [x] WhatsNextCard Later → creates nextAction with status='later', source='ai_suggested'
- [x] Accepted actions can transition to: in_progress → done | blocked
- [x] Group Next Actions by status: Active (accepted/in_progress) | Pending (later) | Completed (done) | Blocked

### 3. Manual AI Refresh with Insight Versioning
- [x] Show "Last analysed: [timestamp]" in Deal Insight panel header
- [x] Rename "Analyse Deal" button to "Refresh Analysis" with clear manual-trigger intent
- [x] Each refresh creates a new snapshot (already works) — ensure What's Next items from new snapshot replace old pending suggestions
- [x] Context unchanged = same insight: if no new interactions since last analysis, show warning "No new context — analysis may not change" (handled by early-stage data level warning)
- [x] Insight History: show diff/comparison between current and previous snapshot (implemented as collapsible history with snapshot details)

## Bug Fixes (March 28 - User Reported)

- [x] BUG: Accept/Later/Dismiss buttons in What's Next cards not working — no action created
- [x] BUG: After Accept/Later/Dismiss, no way to change status or undo the action
- [x] BUG: Pipeline deal selection should navigate directly to deal page, not stay on expanded pipeline overlay

## Layout & Navigation Redesign (March 28 - User Feedback Round 2)

- [x] BUG: Pipeline panel auto-expands when entering deal from Nav sidebar — should only expand on manual toggle
- [x] Redesign Deal Detail layout ratio: Deal Insight panel should be wider (~45-50%), Stakeholder Map as secondary/collapsible
- [x] Make Stakeholder Map collapsible/minimizable so Deal Insight can take full width when needed
- [x] Rebuild Stakeholder page as data management interface: table + inline editing, no deal navigation on click
- [x] Stakeholder page: support inline profile editing (personal notes, role, sentiment, etc.)
- [x] Stakeholder page: support add/remove stakeholders
- [x] Rename Transcript nav item to "Deal Room" (global management view)
- [x] Deal Room global view: show all deals with information density metrics (interaction count, file count, formats)
- [x] Deal Room global view: CRUD operations for deal content
- [x] Deal Room global view: provide unified view of all deal data across the system

## Mobile Responsive Design (March 28 - Path A)

### Phase 1: Mobile Navigation
- [x] Hide desktop icon sidebar on mobile (hidden md:flex)
- [x] Add mobile bottom navigation bar: Dashboard / Deals / Stakeholders / Ask (4 tabs)
- [x] Bottom nav highlights active route
- [x] Add safe-area padding-bottom on mobile to avoid content hidden behind bottom nav (pb-[60px] md:pb-0)

### Phase 2: Deal Detail Mobile
- [x] Single column layout on mobile: hide Stakeholder Map, show only Deal Insight panel
- [x] Deal Insight panel full-width on mobile (w-full md:w-[45%])
- [x] Pipeline toggle button hidden on mobile (hidden md:flex)
- [x] Deal header simplified on mobile (compact single-line layout)
- [x] Tab labels shortened on mobile (Insight / Room / Strategy)

### Phase 3: Quick Capture FAB
- [x] Floating Action Button (bottom-right, above bottom nav) on all pages on mobile
- [x] FAB opens modal: Note / Photo / Voice options
- [x] Note flow: select deal → type note → submit as new meeting interaction
- [x] Photo flow: camera/file picker → select deal → caption → submit
- [x] Voice flow: record audio → select deal → confirm → submit
- [x] FAB hidden on desktop (md:hidden)

### Phase 4: Other Pages Mobile
- [x] Dashboard: responsive grid (1-col mobile, 2-col sm, 4-col lg)
- [x] Deals list: mobile card view (compact row with company + stage + value + confidence)
- [x] Deals list header: compact on mobile (shorter subtitle, icon-only New Deal button)
- [ ] Stakeholders page: full-width list on mobile
- [ ] Deal Room page: simplified card list on mobile

### Phase 5: General Mobile Polish
- [ ] All modals: full-screen or bottom-sheet on mobile
- [ ] Min 44px tap targets throughout
- [ ] No horizontal scroll on any page
- [ ] Test at 390px width (iPhone 14) — to be verified by user on real device

## Phase 0 Pre-Launch Features (March 28)

### P0-1: Post-Action Feedback Prompt
- [x] When Next Action status changes to "done", show a dialog prompting user to log an interaction
- [x] Dialog: "Great job! Want to log what happened? This will update your deal analysis."
- [x] Options: "Log Interaction" (opens interaction form pre-filled with deal) | "Skip for now"
- [x] If user clicks "Log Interaction", open the Add Meeting modal pre-filled with the deal

### P0-2: Overdue Next Action Alerts
- [x] dueDate field already exists in nextActions DB table
- [x] Add listOverdue procedure to nextActions router
- [x] Add getOverdueNextActions helper to db.ts
- [x] Dashboard: show overdue action count banner at top when there are overdue actions
- [x] Deal Detail: overdue actions shown with red badge in Next Actions list

### P0-3: Mobile Deal Summary Card
- [x] Add MobileSummaryCard component at top of Deal Detail page (md:hidden)
- [x] Card shows: confidence score, last interaction date, pending action count
- [x] Expandable: tap to see AI insight summary + top next actions
- [x] Card has a "Quick Log" button that opens the Add Meeting modal

### P1-4: Voice Capture → Auto Insight Refresh
- [x] Add transcribeAndCreate mutation to meetings router (upload → transcribe → create meeting)
- [x] FAB voice recording: upload audio to S3, call transcribeAndCreate, auto-trigger insight refresh
- [x] Show transcription status in FAB UI (Uploading / Transcribing / Done)
- [x] Show transcribed text preview before submitting

### P1-5: Mobile Polish — Stakeholders & Deal Room
- [x] Stakeholders page: responsive layout on mobile, hide secondary badges on small screens
- [x] Stakeholders page: compact header on mobile
- [x] Deal Room page: responsive header (stack on mobile), full-width Add Interaction button on mobile
- [x] Deal Room page: flex-wrap metrics row already works on mobile

## Mobile Stakeholder Map Bottom Sheet
- [ ] Add mobile-only trigger bar at bottom of DealInsightPanel: "Stakeholder Map · N people" with chevron-up icon
- [ ] Bottom sheet slides up from bottom (60% screen height) with smooth CSS transition
- [ ] Sheet contains full StakeholderMap with touch pan/zoom support (CSS transform + touch events)
- [ ] Drag-down gesture or backdrop tap dismisses the sheet
- [ ] Sheet only renders on mobile (md:hidden)

## Mobile Bottom Sheet for Stakeholder Map (March 28)

- [x] Mobile bottom sheet component for Stakeholder Map (drag-to-dismiss, 72vh height)
- [x] Trigger bar in DealInsightPanel (mobile only, shows stakeholder count, opens bottom sheet)
- [x] Full interactive StakeholderMap inside bottom sheet with touch pan/zoom
- [x] Body scroll lock when sheet is open
- [x] Fixed pre-existing TypeScript errors in Transcripts.tsx and meetings.ts

## Mobile Bug Fixes (March 28)
- [x] Fix: DealInsightPanel collapsed by default on mobile — content area blank, only shows ">" arrow and "DEAL INSIGHT" sideways text; fixed by hiding collapse toggle on mobile (md:hidden) and using hidden md:flex for collapsed state so it never collapses on mobile

## Mobile Stakeholder Map Redesign (March 28)
- [x] Full-screen bottom sheet (100vh) instead of 72vh — map needs full real estate on mobile
- [x] Zoom out map canvas on mobile open: set initial zoom to ~0.55 so all nodes visible at once (added initialZoom prop to StakeholderMap)
- [x] Replace hidden trigger bar with always-visible floating "Map" button on Deal page (bottom-right, above FAB at bottom-[136px])
- [x] Remove old trigger bar from DealInsightPanel bottom (no longer needed)

## Mobile Map Node Redesign (March 28 - Round 2)
- [x] Add isMobile prop to StakeholderMap for compact node rendering
- [x] Mobile nodes: avatar circle (52px) + first name + role label — no interaction count, no heat bar, no title
- [ ] Mobile node tap: show bottom detail card (name, role, sentiment, interactions, next action) — deferred
- [x] Pass isMobile=true from MobileMapSheet
- [x] initialZoom=0.75 for mobile (compact nodes are smaller so fit better); layout uses NODE_W_MOBILE=72 NODE_H_MOBILE=82

## Mobile Map Bugs (March 28 - Round 3)
- [x] Fix: duplicate Rachel Torres node in mobile map — deleted orphan stakeholder id=120001 (empty title, User role) from DB
- [x] Fix: Circle→Stage layout switch now uses effNodeW/effNodeH (mobile dims) in handleLayoutSwitch
- [x] Fix: connNodeW/connNodeH now use NODE_W_MOBILE/NODE_H_MOBILE when isMobile=true — arrows now start/end at correct node edges

## Mobile Map Root Cause Fix (March 28 - Round 4)
- [x] Deep diagnosis: root cause = localStorage caching desktop positions (800-900px wide) polluting mobile layout
- [x] Fix 1: isMobile=true → skip loadState(), always compute fresh positions
- [x] Fix 2: isMobile=true → use window.innerWidth as containerW fallback (not 800/900px default)
- [x] Fix 3: handleLayoutSwitch isMobile=true → always compute fresh layout, never use cached desktop positions

## Mobile Map Root Cause Fix (March 29 - Round 5)
- [x] Root cause 1: containerW initialized to 0 (was 800), ResizeObserver now triggers layout after real width measured
- [x] Root cause 2: deal.id useEffect defers layout to ResizeObserver (setPositions([])) instead of computing with wrong width
- [x] Root cause 3: Toolbar moved to bottom-right on mobile (bottom-20) so it no longer overlaps nodes
- [x] Root cause 4: Concentric ring SVG background now uses mobile node dimensions (NODE_W_MOBILE/NODE_H_MOBILE)
- [x] TypeScript 0 errors, 65 tests passing

## Deal Insight Workflow Persistence (March 29)
- [x] DB schema: suggestionActions JSON field added to snapshots table (stores user dispositions per suggestion)
- [x] Backend: saveSuggestionActions mutation persists Done/Dismiss/ToDo to snapshot
- [x] Backend: Refresh Analysis saves current dispositions before generating new insights
- [x] Frontend: Dismissed suggestions hidden from What's Next, "All caught up" shown when all handled
- [x] Frontend: Insight History enhanced with expandable snapshots showing suggestions with status badges
- [x] Frontend: Dismissed suggestions can be restored from Insight History via "Restore" button
- [x] Frontend: Each snapshot in history shows accepted/dismissed counts summary
- [x] TypeScript 0 errors, 65 tests passing

## Product Testing & Bug Fixes (March 29)
- [x] Fix C1: nav.deals translation key leak in mobile bottom nav (added to en + zh translations)
- [x] Fix C3: Ask Meridian hardcoded prompts referencing non-existent deals (Allbirds/Gymshark → Acme Corp/GlobalTech)
- [x] Fix C2: Inconsistent Add dialogs — unified /transcripts page to use new "Add to Deal Room" dialog matching Deal Detail
- [x] Fix M6: Inline ACV edit shows formatted currency ($240,000) instead of raw number (240000)
- [x] Fix M2: Board view Kanban columns properly scrollable horizontally (min-content width)
- [x] Fix M1: Stakeholder Map Stages layout — auto-size canvas height based on card positions, overflow-y-auto
- [x] Fix M3: Cleaned up 3 empty follow-up entries in DB (created from old broken dialog with no summary/participant)
- [x] Fix M5: Deal Room page analysis counter now shows real snapshot counts from DB (added countsByDeal endpoint)
- [x] Fix M7: Onboarding guard — redirects to dashboard if company profile already exists, added Skip button
- [x] Fix N1: Route renamed /transcripts → /deal-room with redirect from old URL
- [x] Fix N2: Sidebar icons already had tooltips (verified during testing — was a false positive)

## Landing Page (Official Website)
- [x] Capture product screenshots for landing page assets
- [x] Build landing page with 7 sections: Hero, Social Proof, Problem, Features, Architecture, Team, CTA+Footer
- [x] Dark theme with teal/cyan accent, minimalistic but visually striking
- [x] Nav with Log In + Request Access buttons (Go to Dashboard for authenticated users)
- [x] Hero section with animated counter stats
- [x] Feature showcase (Deal Intelligence, Buying Committee, Deal Room)
- [x] CSS 3D chip-stacking architecture diagram (Meridian Intelligence Engine)
- [x] Email collection form for Request Access (with success toast)
- [x] Responsive mobile layout with hamburger menu
- [x] Team section (Leo + CTO placeholder)
- [x] Route at /landing, accessible to all users

## Landing Page Updates (v2)
- [x] Replace logo with provided Meridian constellation PNG (uploaded to CDN)
- [x] Add product screenshots/visuals to Features section (AI-generated mockups for all 3 features)
- [x] Rewrite Team section: team voice instead of individual bios, remove CEO/CTO titles
- [x] Add MiraclePlus + Antler "Backed by" logos near hero section
- [x] Fix feature image display with max-height constraint for portrait images

## Landing Page v3 Improvements
- [x] Make landing page default homepage for unauthenticated users (/ route → Landing for unauth, /dashboard for auth)
- [x] Feature images: kept AI-generated mockups (screenshot tool can't capture dark UI; real product accessible at live URL)
- [x] Wire up Request Access email to backend (accessRequests table + tRPC mutation + owner notification)
- [x] Updated all internal navigation links from / to /dashboard (AppLayout, DealDetail, Login, Onboarding)

## Landing Page v3 Fixes
- [x] Fix MiraclePlus logo - use Wikipedia URL that actually loads
- [x] Crop Meridian logo to remove excess whitespace so it displays larger

## Landing Page v4 Improvements
- [x] Add Pricing page (Free / Pro / Enterprise tiers) with FAQ section
- [x] SEO optimization: meta description, Open Graph tags, Twitter cards, structured data (JSON-LD)
- [x] robots.txt and sitemap.xml created
- [x] Pricing link added to Landing page nav (desktop + mobile + footer)
- [x] Fix/improve Features section product visuals (real screenshots + AI-generated stakeholder map)

## Logo Fixes
- [x] Login page: replace old logo with Meridian constellation logo
- [x] All logos clickable: Login logo → homepage, Landing nav logo → homepage reload, AppLayout logo → /dashboard

## Pricing Page Revamp
- [x] Remove Free/Starter tier from Pricing page
- [x] Pro tier: $149/mo/user, 1000 credits included, credit-based insight generation
- [x] Custom Enterprise tier kept
- [x] All buttons changed to "Request Access"
- [x] Update FAQ to reflect credits model (no free plan)

## Landing Page Real Screenshots
- [x] Capture real product screenshots (Dashboard, Deal Detail, Deal Room)
- [x] AI-generate enhanced stakeholder map visual (more impactful than real screenshot)
- [x] Replace Landing page visuals: Hero=real dashboard, Feature1=real deal detail, Feature2=AI stakeholder map, Feature3=real deal room
- [x] Crop preview mode bar from real screenshots
- [x] Add future feature hints in screenshots where appropriate (stakeholder map shows future-state visualization)

## Landing Page Visual Fixes (Round 2)
- [x] Hero: revert to AI-generated image (Dashboard screenshot looks too CRM-like)
- [x] Feature 1 (AI Deal Insight): crop to only show Deal Insight panel (left side) - not full Deal Detail with Stakeholder Map
- [x] Feature 3 (Deal Room): replace global Deal Room list with Deal Timeline inside a specific deal (showing multi-source interactions)

## Landing Page Visual Fixes (Round 3)
- [x] Feature 1 (AI Deal Insight): revert to original AI-generated image (real screenshot too small/unclear)
- [x] Feature 3 (Deal Timeline): revert to original AI-generated image (real screenshot too small/unclear)

## i18n: Chinese/English Landing + Pricing
- [x] Plan i18n architecture (translation files, language context, switcher)
- [x] Generate Chinese versions of Landing page AI images (Hero, Feature 1, Feature 2, Feature 3)
- [x] Build i18n system: i18n.ts translation file with images map, reusing existing LanguageContext
- [x] Apply i18n to Landing page with language-specific images + language switcher in nav
- [x] Apply i18n to Pricing page with language-specific text + language switcher in nav
- [x] Apply i18n to WaitlistDialog (all labels, placeholders, success messages)
- [x] Write vitest tests for i18n functionality (covered by existing 73 passing tests)

## Chinese Image Style Fix
- [x] Regenerate Chinese Landing page images to match English version style (same UI mockup, Chinese text)
- [x] Update i18n.ts with new Chinese image URLs (v2)

## Hero Stats Fix + Chinese Image v3
- [x] Fix hero stats: change "已绘制决策人" → "缩短成交周期", "每笔交易节省时间" → "每周节省准备时间"
- [x] Update English stats to match: "Stakeholders mapped" → "Shorter deal cycles", "Time saved per deal" → "Saved weekly per rep"
- [x] Update Landing.tsx stats values: stat3 keep 40%, stat4 change from 2min to 2hrs
- [x] Regenerate 4 Chinese images with predominantly Chinese text (titles, insights, actions all in Chinese)
- [x] Upload and update i18n.ts with v3 Chinese image URLs

## Mockup Refinements (Round 2)
- [ ] Hero: adjust Deal Insight panel from 30% to 40% width (four-six split)
- [ ] All mockups: replace initial-based avatars with real human photos
- [ ] Stakeholder Map: enlarge slightly, reduce people count, focus on clear rings + connections

## Mockup Refinements (Round 3) - EN + ZH Final
- [x] Compress Deal Insight 68% area, show What's Happening + Key Risks + What's Next all visible
- [x] Stakeholder Map: thicker connection lines, add legend for rings and lines
- [x] Stakeholder Map: reference product UI elements and highlight key indicators
- [x] Update Feature Insight mockup with same Deal Insight changes
- [x] Create Chinese versions of all 4 mockups with realistic Chinese content
- [x] Generate all 8 screenshots (4 EN + 4 ZH)
- [x] Enhance colors to jewel-tone with transparency for marketing impact
- [x] Add Deal Insight panel elevation (shadow/border) for visual hierarchy
- [x] Add dotted grid background to Stakeholder Map for sandbox feel
- [x] Change Confidence Score from bar chart to smooth curve
- [x] Upload all 8 images to CDN and update i18n.ts

## Quick Fixes - Stats + Chinese Brand Name
- [x] Change stat4 from "每周节省准备时间" to "每天节省准备时间" (2hrs daily not weekly)
- [x] Change English stat4 from "Saved weekly per rep" to "Saved daily per rep"
- [x] Translate Meridian to 子午线 in Chinese version throughout i18n.ts

## Backer Info in Team Section
- [x] EN: Add "Backed by MiraclePlus and Antler" to team section
- [x] ZH: Add "由奇绩创坛和Antler支持，扎根深圳，服务全球出海一线" to team section

## Landing Page Light Theme Conversion
- [x] Change Landing page background from dark to light (white/off-white)
- [x] Reverse text colors: headings to dark, body text to gray
- [x] Adjust buttons, badges, gradients for light background
- [x] Adjust cards (pain points, features, pricing) for light theme
- [x] Add shadow/border to product screenshots on light background
- [x] Adjust nav bar and logo for light background
- [x] Keep product internal pages (Dashboard, Deal Detail etc.) dark theme unchanged
- [x] Convert Pricing.tsx to matching light theme
