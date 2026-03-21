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
