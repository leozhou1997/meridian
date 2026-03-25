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
