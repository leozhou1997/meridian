// Meridian Sales Intelligence — Mock Data
// All data simulates Meridian selling to B2B SaaS / enterprise software companies

export interface Stakeholder {
  id: string;
  name: string;
  title: string;
  role: 'Champion' | 'Decision Maker' | 'Influencer' | 'Blocker' | 'User' | 'Evaluator';
  roles?: string[]; // multi-role support
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  engagement: 'High' | 'Medium' | 'Low';
  avatar: string;
  email?: string;
  linkedIn?: string;
  keyInsights?: string;
  stage?: string;
  x?: number;
  y?: number;
}

export interface Snapshot {
  id: string;
  dealId: string;
  date: string;
  whatsHappening: string;
  whatsNext: string;
  keyRisks: string[];
  confidenceScore: number;
  confidenceChange: number;
  interactionType: string;
  keyParticipant: string;
}

export interface Interaction {
  id: string;
  dealId: string;
  date: string;
  type: 'Discovery Call' | 'Demo' | 'Technical Review' | 'POC Check-in' | 'Negotiation' | 'Executive Briefing' | 'Follow-up';
  keyParticipant: string;
  summary: string;
  duration: number; // minutes
  transcript?: string; // full meeting transcript
}

export interface Deal {
  id: string;
  name: string;
  company: string;
  website: string;
  logo: string;
  stage: 'Discovery' | 'Demo' | 'Technical Evaluation' | 'POC' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  value: number;
  confidenceScore: number;
  daysInStage: number;
  lastActivity: string;
  ownerEmail: string;
  riskOneLiner: string;
  stakeholders: Stakeholder[];
  snapshots: Snapshot[];
  interactions: Interaction[];
  buyingStages: string[];
  companyInfo?: string;
}

// Unsplash avatar URLs — each deal uses a unique set
const AVATARS = {
  // Deal 1 — Allbirds (professional headshots, corporate)
  d1_s1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
  d1_s2: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face',
  d1_s3: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
  d1_s4: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
  d1_s5: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
  d1_s6: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face',
  // Deal 2 — Gymshark
  d2_s1: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&crop=face',
  d2_s2: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face',
  d2_s3: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face',
  d2_s4: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=80&h=80&fit=crop&crop=face',
  // Deal 3 — Skechers
  d3_s1: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=80&h=80&fit=crop&crop=face',
  d3_s2: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face',
  d3_s3: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&crop=face',
  d3_s4: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&h=80&fit=crop&crop=face',
  d3_s5: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face',
  // Deal 4 — Lululemon
  d4_s1: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=80&h=80&fit=crop&crop=face',
  d4_s2: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face',
  d4_s3: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&h=80&fit=crop&crop=face',
  d4_s4: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face',
  // Deal 5 — Notion
  d5_s1: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face',
  d5_s2: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&h=80&fit=crop&crop=face',
  d5_s3: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face',
  d5_s4: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&h=80&fit=crop&crop=face',
};

export const deals: Deal[] = [
  // ─────────────────────────────────────────────
  // DEAL 1 — Allbirds | Technical Evaluation
  // ─────────────────────────────────────────────
  {
    id: 'deal-1',
    name: 'Allbirds Enterprise',
    company: 'Allbirds',
    website: 'www.allbirds.com',
    logo: 'https://logo.clearbit.com/allbirds.com',
    stage: 'Technical Evaluation',
    value: 420000,
    confidenceScore: 70,
    daysInStage: 67,
    lastActivity: '2026-02-28',
    ownerEmail: 'leo@meridian.ai',
    riskOneLiner: 'Champion Benny may leave in Q2 — succession plan needed',
    buyingStages: ['Champion Buy-in', 'Stakeholder Alignment', 'Procurement Approvals', 'Close'],
    companyInfo: 'Allbirds is a sustainable footwear and apparel company. Founded in 2016, they focus on using natural materials. Revenue ~$300M, 800+ employees. Growing enterprise sales team.',
    stakeholders: [
      { id: 'a1-s1', name: 'Benny Joseph', title: 'CTO & CSO', role: 'Champion', roles: ['Champion', 'Influencer'], sentiment: 'Positive', engagement: 'High', avatar: AVATARS.d1_s1, stage: 'Champion Buy-in', email: 'benny.joseph@allbirds.com', keyInsights: 'Strong internal advocate. Pushing for AI-driven sales tools. May transition to advisory role in Q2 — need to identify successor champion.', x: 150, y: 100 },
      { id: 'a1-s2', name: 'Annie Mitchell', title: 'CFO', role: 'Evaluator', roles: ['Evaluator', 'Decision Maker'], sentiment: 'Neutral', engagement: 'Medium', avatar: AVATARS.d1_s2, stage: 'Stakeholder Alignment', email: 'annie.mitchell@allbirds.com', keyInsights: 'Needs ROI proof. Skeptical about AI tools after previous failed implementation with a competitor. Wants 6-month payback period.', x: 420, y: 100 },
      { id: 'a1-s3', name: 'Christos Yatrokis', title: 'Chief Legal & People Officer', role: 'Blocker', roles: ['Blocker'], sentiment: 'Negative', engagement: 'Low', avatar: AVATARS.d1_s3, stage: 'Procurement Approvals', email: 'christos.y@allbirds.com', keyInsights: 'Concerned about data privacy and GDPR compliance. Requires SOC2 Type II documentation. Has blocked two previous vendor deals this year.', x: 680, y: 100 },
      { id: 'a1-s4', name: 'Joe Vernachio', title: 'CEO', role: 'Decision Maker', roles: ['Decision Maker'], sentiment: 'Neutral', engagement: 'Low', avatar: AVATARS.d1_s4, stage: 'Close', email: 'joe.v@allbirds.com', keyInsights: 'Final sign-off authority. Delegates most vendor decisions to CTO. Met briefly at industry event — positive first impression.', x: 920, y: 100 },
      { id: 'a1-s5', name: 'Zoe Daniels', title: 'VP, Revenue Operations', role: 'User', roles: ['User', 'Champion'], sentiment: 'Positive', engagement: 'Medium', avatar: AVATARS.d1_s5, stage: 'Stakeholder Alignment', email: 'zoe.daniels@allbirds.com', keyInsights: 'End user champion. Excited about POC results. Running parallel evaluation internally with RevOps team.', x: 420, y: 310 },
      { id: 'a1-s6', name: 'Robert Osburn', title: 'Director, Engineering', role: 'Influencer', roles: ['Evaluator', 'Influencer'], sentiment: 'Positive', engagement: 'High', avatar: AVATARS.d1_s6, stage: 'Procurement Approvals', email: 'robert.o@allbirds.com', keyInsights: 'Technical evaluator. Approved API integration approach. Will write internal recommendation memo.', x: 680, y: 310 },
    ],
    snapshots: [
      {
        id: 'snap-1c', dealId: 'deal-1', date: '2026-02-28',
        whatsHappening: 'Completed 2 rounds of demo. Legal review pending with Christos. Champion Benny has gone quiet for 17 days — likely preparing for role transition. CFO approval is the final hurdle before procurement.',
        whatsNext: 'Schedule ROI presentation for CFO Annie. Get SOC2 Type II docs to Legal. Re-engage Benny to understand succession plan.',
        keyRisks: ['Champion Benny may leave company in Q2', 'Legal review stalled — Christos blocking on data residency', 'CFO needs 6-month ROI proof before sign-off'],
        confidenceScore: 70, confidenceChange: -5, interactionType: 'POC Check-in', keyParticipant: 'Benny Joseph'
      },
      {
        id: 'snap-1b', dealId: 'deal-1', date: '2026-02-14',
        whatsHappening: 'POC going well. Benny enthusiastic about results. Engineering team approved integration approach. Zoe running internal pilot with 3 reps.',
        whatsNext: 'Present POC results to broader stakeholder group. Schedule CFO meeting.',
        keyRisks: ['Need to expand beyond champion', 'Budget cycle ends in March'],
        confidenceScore: 75, confidenceChange: 10, interactionType: 'Technical Review', keyParticipant: 'Robert Osburn'
      },
      {
        id: 'snap-1a', dealId: 'deal-1', date: '2026-01-20',
        whatsHappening: 'CFO demo completed. Annie engaged but skeptical. Requested case studies from similar-sized companies. Benny pushing hard internally.',
        whatsNext: 'Send 3 relevant case studies. Prepare ROI model with Allbirds-specific numbers.',
        keyRisks: ['CFO skepticism about AI tools', 'No executive sponsor above CTO yet'],
        confidenceScore: 65, confidenceChange: 5, interactionType: 'Demo', keyParticipant: 'Annie Mitchell'
      },
    ],
    interactions: [
      {
        id: 'int-1f', dealId: 'deal-1', date: '2026-02-28', type: 'POC Check-in', keyParticipant: 'Benny Joseph',
        summary: 'Reviewed POC metrics. 23% improvement in deal velocity. Benny mentioned potential role change in Q2.',
        duration: 30,
        transcript: `[Recording starts mid-conversation]

Leo Zhou (Meridian, AE): ...so if we look at the dashboard here, the deal velocity metric is showing a twenty-three percent improvement over the baseline we set in week one. Uh, Benny, does that track with what your team is seeing on the ground?

Benny Joseph (Allbirds, CTO): Yeah, yeah it does. I mean, honestly, the number that jumps out at me is the stakeholder coverage score. We went from like, what, two point one contacts per deal to four point eight? That's — that's the thing I've been trying to solve for two years.

Leo Zhou: Right, and that's exactly the use case we designed around. The idea being that if your reps are only talking to one or two people in an account, you're essentially flying blind on the political landscape.

Benny Joseph: Totally. And I showed this to Zoe last week and she was — she was really excited. She's already got three of her reps doing their weekly deal reviews through Meridian instead of Salesforce. Which, uh, I know that's not the official pilot scope but—

Leo Zhou: No, that's — honestly that's great signal. That kind of organic adoption is exactly what we want to see.

Benny Joseph: Yeah. Um, so I do want to flag something, and I want to be transparent with you about this. Uh, I'm — there's a chance I'm moving into a different role within the company in Q2. Nothing confirmed yet, but I want to make sure that if that happens, this deal doesn't fall through the cracks.

Leo Zhou: I appreciate you telling me that. Who would be the right person to bring in now so there's continuity?

Benny Joseph: Probably Zoe, honestly. She's the one who's going to live in this tool day-to-day. And Robert on the engineering side — he's already approved the integration architecture, so he's bought in technically.

Leo Zhou: Got it. Should we set up a call with Zoe and Robert together so I can do a proper handoff briefing, just in case?

Benny Joseph: Yeah, let's do that. Maybe next week? I'll send a calendar invite. Um, the other thing — Annie is still the blocker. She wants to see a six-month payback model with our specific numbers, not just generic benchmarks.

Leo Zhou: Understood. I can build that out with your RevOps data if Zoe can share the baseline metrics — average deal size, sales cycle length, win rate by stage.

Benny Joseph: She can do that. I'll intro you two over email today.

Leo Zhou: Perfect. And then on the legal side — Christos. Has there been any movement there?

Benny Joseph: [sighs] Christos is... Christos. He's blocked two vendor deals this year already. His main thing is data residency — he wants to know exactly where the conversation data is stored and whether it's subject to GDPR.

Leo Zhou: We're fully SOC2 Type II certified and all EU customer data is stored in Frankfurt. I can get you the full compliance documentation today.

Benny Joseph: That would help a lot. If you can send that directly to his EA, I'll make sure he reviews it before end of week.

Leo Zhou: Done. Okay, so to summarize — I'll send the SOC2 docs to Christos's EA, I'll work with Zoe on the ROI model, and we'll set up a continuity briefing with Zoe and Robert next week.

Benny Joseph: Yeah, that's the plan. I'm still pushing hard for this, Leo. I genuinely think this is the right tool for us. I just want to make sure we're set up for success regardless of what happens on my end.

Leo Zhou: I really appreciate that, Benny. We're going to make this work.

[Recording ends]`
      },
      {
        id: 'int-1e', dealId: 'deal-1', date: '2026-02-14', type: 'Technical Review', keyParticipant: 'Robert Osburn',
        summary: 'Engineering approved API integration. No security concerns. Robert will champion internally.',
        duration: 45,
        transcript: `[Auto-transcribed via Fireflies.ai — accuracy ~82%]

Leo Zhou: Alright, so Robert, thanks for making time. I know you've been heads down on the Q1 release. Um, today I wanted to walk through the technical architecture and make sure there are no blockers from the engineering side.

Robert Osburn (Allbirds, Director Engineering): Yeah, no, I've actually already looked through the API docs you sent over. Uh, the REST endpoints are clean, the authentication flow is standard OAuth 2.0, so there's nothing exotic there.

Leo Zhou: Good. And the data model — did you have a chance to look at how we handle the conversation data pipeline?

Robert Osburn: I did, yeah. So the way I understand it, the audio or transcript comes in through the webhook, gets processed by your NLP layer, and then the structured output — the stakeholder mentions, the sentiment tags, the action items — those get written back to your database and also optionally synced to Salesforce or HubSpot via their native APIs?

Leo Zhou: That's exactly right. And the sync is bidirectional — so if someone updates a contact in Salesforce, that change propagates back into Meridian within, uh, about fifteen minutes typically.

Robert Osburn: Okay. My one concern was around the Salesforce sync — we have some custom objects in our Salesforce instance that aren't standard. Like we have a custom "Buying Committee" object that tracks all the stakeholders per opportunity. Will Meridian be able to read and write to that?

Leo Zhou: Great question. So out of the box, we sync to standard Salesforce objects — Contacts, Opportunities, Activities. For custom objects, we have a field mapping configuration in the admin panel where you can define the mapping manually. It's a bit of setup work upfront, but once it's done it's fully automated.

Robert Osburn: How long does that setup typically take?

Leo Zhou: For a setup like yours, probably two to three hours with one of our implementation engineers. We'd do that as part of the onboarding.

Robert Osburn: That's fine. Um, the other thing I wanted to ask about — data retention. How long do you keep the raw transcript data?

Leo Zhou: Default is ninety days for raw transcripts, but that's configurable. You can set it to thirty days, or you can set it to indefinite if you want to build a long-term conversation archive.

Robert Osburn: Ninety days is probably fine for us. Okay, I think from a technical standpoint I'm comfortable. I'll write up a brief internal memo recommending we proceed. The main thing I'll flag is the custom object mapping — I'll want to be involved in that onboarding session.

Leo Zhou: Absolutely, we'll make sure you're on that call. I'll have our implementation team reach out to schedule.

Robert Osburn: Sounds good. Oh, one more thing — Benny mentioned something about an on-premise deployment option. Is that a thing?

Leo Zhou: We don't offer on-prem currently. We're cloud-native. But we do offer a private cloud deployment for enterprise customers — that's where your data is in a dedicated tenant, not shared infrastructure. That might address whatever concern Benny had.

Robert Osburn: Yeah, I think that was more of a Christos thing than a Benny thing, honestly. I'll mention the private cloud option in my memo.

Leo Zhou: That would be really helpful, thank you. Alright, I think we've covered everything. I'll send over the implementation timeline and the onboarding agenda after this call.

Robert Osburn: Perfect. Talk soon.

[Meeting ended — duration 44 minutes]`
      },
      {
        id: 'int-1d', dealId: 'deal-1', date: '2026-02-05', type: 'POC Check-in', keyParticipant: 'Zoe Daniels',
        summary: 'Zoe running internal pilot with 3 reps. Early results positive. Needs help with Salesforce field mapping.',
        duration: 25,
        transcript: `[Zoom recording — auto-transcribed]

Zoe Daniels (Allbirds, VP RevOps): Hey Leo! Sorry I'm a couple minutes late, I was just finishing up our weekly pipeline review.

Leo Zhou: No worries at all. How did the pipeline review go?

Zoe Daniels: It was actually — it was kind of funny because two of the reps were using Meridian to prep for it and their deal summaries were so much better than the people who weren't. Like, Marcus came in with this whole stakeholder map for his top deal and everyone was kind of like, where did that come from?

Leo Zhou: [laughs] That's exactly the kind of thing we love to hear. How many reps are actively using it now?

Zoe Daniels: Three. Marcus, Priya, and Jake. Um, I haven't pushed it to the whole team yet because I want to make sure the Salesforce sync is working properly first.

Leo Zhou: Right, what's happening with the sync?

Zoe Daniels: So the contacts are syncing fine, but the opportunity stage updates aren't coming through. Like when Marcus moved a deal from Discovery to Demo in Meridian, it didn't update in Salesforce.

Leo Zhou: Okay, that's a known issue with the bidirectional sync — there's a field mapping step that needs to be completed in the admin panel. I should have caught that during setup, that's on me. Can I get five minutes of screen share time with you after this call to fix it?

Zoe Daniels: Yeah, totally. Um, the other thing — and this is more of a feature request — is it possible to add a "next best action" recommendation? Like, based on the deal data, Meridian suggests what the rep should do next?

Leo Zhou: That's actually on our roadmap for Q3. Right now the closest thing is the "What's Next" section in the Deal Snapshot, which is AI-generated based on the meeting transcript. But a proactive recommendation engine is definitely coming.

Zoe Daniels: Okay cool. I'll put that in my internal feedback doc. Um, overall though, the three reps who are using it are really happy. Priya said it saved her like two hours of prep time last week.

Leo Zhou: That's great. Two hours per rep per week — that adds up fast across a team.

Zoe Daniels: Yeah, I'm going to use that number in my internal business case. Benny wants me to present to Annie next month and I need to have the ROI numbers locked down.

Leo Zhou: I can help you build that model. If you can share your baseline metrics — average deal size, win rate, sales cycle length — I can put together a Allbirds-specific ROI analysis.

Zoe Daniels: That would be amazing. I'll send you the data this week.

[Recording ends — 24 minutes]`
      },
      {
        id: 'int-1c', dealId: 'deal-1', date: '2026-01-20', type: 'Demo', keyParticipant: 'Annie Mitchell',
        summary: 'CFO demo focused on ROI. Annie wants 6-month payback proof. Requested case studies.',
        duration: 60,
        transcript: `[Chorus recording — Allbirds CFO Demo — Jan 20, 2026]

Leo Zhou: Good afternoon, Annie. Thanks for making time. I know your schedule is packed, so I'll make sure we're focused on what matters most to you.

Annie Mitchell (Allbirds, CFO): Appreciate that. I'll be direct — I've seen a lot of AI tools come through here in the last eighteen months and most of them have been a lot of promise and not a lot of delivery. So I'm going to need you to show me the numbers.

Leo Zhou: Completely fair. Let me start with outcomes, then we can look at the product. Our customers see on average a twenty-two percent improvement in win rate for deals over fifty thousand dollars, and a thirty-one percent reduction in sales cycle length for multi-stakeholder deals. Those are the two metrics that drive the most revenue impact.

Annie Mitchell: How are you measuring win rate improvement? Is that a controlled study or just self-reported?

Leo Zhou: Good question. It's a combination. We have a cohort of customers who've been on the platform for over twelve months, and we compare their win rates in the twelve months before versus after. The twenty-two percent is the median improvement across that cohort. I can share the methodology document if you'd like.

Annie Mitchell: Yes, please send that. Um, what's the payback period typically?

Leo Zhou: For a company your size — revenue operations team of, say, fifteen to twenty reps — the typical payback period is between four and seven months. The main driver is the reduction in deal slippage. If you're losing deals because reps don't have visibility into the full buying committee, that's revenue that's recoverable.

Annie Mitchell: What's the average deal slippage rate you see in your customer base?

Leo Zhou: About eighteen percent of pipeline is lost due to stakeholder blind spots — meaning the rep was talking to the wrong person or missed a key decision maker. Meridian's stakeholder mapping reduces that by about sixty percent.

Annie Mitchell: [pause] Okay. That's... that's actually a meaningful number if it holds up. What's the license cost for our team size?

Leo Zhou: For a team of twenty reps plus five managers, you're looking at roughly three hundred fifty to four hundred thousand annually. That's the enterprise tier with full Salesforce integration and dedicated customer success.

Annie Mitchell: So at four hundred thousand, I need to see at least four hundred thousand in recovered revenue within the first year to break even. Can you show me that math with our specific numbers?

Leo Zhou: Absolutely. If you can share your current pipeline value, average deal size, and win rate, I can build a model specific to Allbirds within forty-eight hours.

Annie Mitchell: I'll have Zoe send you the numbers. She has access to all of that. Um, I do want to see the product — can you show me what a rep actually sees day-to-day?

Leo Zhou: Of course. Let me pull up a live deal...

[Screen share begins]

Leo Zhou: So this is the Deal Detail view. On the left you have the pipeline — the deals are organized by stage, and you can see the confidence score for each one. The red ones are at risk. If I click into this deal here, you can see the Stakeholder Map...

Annie Mitchell: Oh, that's interesting. So you can see the whole org chart of who's involved in the deal?

Leo Zhou: Exactly. And the color coding tells you the sentiment — green is positive, yellow is neutral, red is a blocker. You can see here that the Legal person is red, which means the rep knows they need to address that before moving forward.

Annie Mitchell: And this is all populated automatically from meeting recordings?

Leo Zhou: Yes. The rep uploads the transcript or connects their calendar, and the AI extracts the stakeholder mentions, the sentiment signals, the action items. The rep doesn't have to manually enter any of this.

Annie Mitchell: What about data security? Our legal team is going to ask about where the conversation data is stored.

Leo Zhou: We're SOC2 Type II certified. All data is encrypted at rest and in transit. For US customers, data is stored in AWS US-East. We also offer a private cloud deployment for enterprise customers who need data isolation.

Annie Mitchell: Okay. I'll need to loop in Christos on that. He's our Chief Legal Officer and he's going to want to review the security documentation.

Leo Zhou: Of course. I'll prepare a full security and compliance package — SOC2 report, data processing agreement, privacy policy — and you can forward it directly to him.

Annie Mitchell: That would be helpful. Alright, I've seen enough for today. I'm not saying yes, but I'm not saying no. Send me the ROI model with our numbers and the security documentation, and I'll review both before we talk again.

Leo Zhou: Will do. I'll have everything to you by end of week.

Annie Mitchell: Good. Thanks, Leo.

[Recording ends — 58 minutes]`
      },
      {
        id: 'int-1b', dealId: 'deal-1', date: '2026-01-08', type: 'Discovery Call', keyParticipant: 'Benny Joseph',
        summary: 'Initial discovery. Benny frustrated with current CRM. Looking for AI-native solution.',
        duration: 45,
        transcript: `[Zoom auto-transcript — Discovery Call — Jan 8, 2026]

Leo Zhou: Hey Benny, great to finally connect. I saw your LinkedIn post about the challenges of scaling a sales team without the right intelligence infrastructure — that's actually what prompted me to reach out.

Benny Joseph: Yeah, that post got a lot of traction. It's something I feel pretty strongly about. We're at a stage where our sales team has grown from eight reps to thirty-two in the last eighteen months, and the processes that worked at eight people just don't work at thirty-two.

Leo Zhou: What does that look like in practice? What's breaking down?

Benny Joseph: A few things. One is deal visibility — I have no idea what's actually happening inside an account unless I'm on the call myself. Reps put stuff in Salesforce but it's always incomplete, always stale. I'll ask about a deal in the forecast call and the rep will say "oh yeah it's going great" and then it slips the next week.

Leo Zhou: So the CRM data isn't trustworthy.

Benny Joseph: It's not trustworthy and it's not actionable. Like, I can see that a deal is in "Technical Evaluation" but I can't see that the champion went quiet two weeks ago or that there's a new blocker who just joined the buying committee. That stuff lives in the rep's head.

Leo Zhou: And what happens when a rep leaves?

Benny Joseph: [laughs] Exactly. We lost a senior AE in November and basically had to rebuild three of his deals from scratch. It was a nightmare.

Leo Zhou: So institutional knowledge loss is a real pain point.

Benny Joseph: Huge. And the other thing is coaching. I can't coach on deals I don't have visibility into. I end up spending my coaching time on the deals where the rep is proactively sharing information, which is usually the deals that are going well anyway. The deals that need coaching are the ones where the rep is quiet.

Leo Zhou: That's a really common pattern. The reps who need the most help are often the least likely to ask for it.

Benny Joseph: Exactly. So what does Meridian actually do? I've looked at the website but I want to hear it from you.

Leo Zhou: At the core, Meridian is a deal intelligence platform. It takes your meeting recordings and transcripts and automatically extracts the information that matters — who's in the buying committee, what their sentiment is, what the risks are, what needs to happen next. It structures all of that into a Deal Snapshot that the rep and manager can both see.

Benny Joseph: So it's like... automatic CRM hygiene?

Leo Zhou: That's one way to think about it. But it goes beyond hygiene — it's actually generating insights. Like, it'll flag if a champion has gone quiet for more than seven days, or if a new stakeholder was mentioned in a meeting who isn't in the system yet.

Benny Joseph: Okay, that's interesting. What does the integration with Salesforce look like?

Leo Zhou: Bidirectional sync. Anything Meridian captures gets written back to Salesforce automatically. Contacts, activities, opportunity updates. So your Salesforce data actually stays current without the rep having to do anything.

Benny Joseph: That would be... that would be a game changer honestly. Our Salesforce data quality is terrible right now. What does implementation look like?

Leo Zhou: For a team your size, typically two to three weeks from contract to go-live. We handle the Salesforce integration, we do rep training, and we have a dedicated customer success manager for the first ninety days.

Benny Joseph: What's the pricing model?

Leo Zhou: Per seat, annual contract. For thirty-two reps plus managers, you're probably looking at the enterprise tier — I'll put together a specific proposal after this call.

Benny Joseph: Okay. I want to see a demo. Can we set something up for next week?

Leo Zhou: Absolutely. I'll send a calendar invite. Should I include anyone else from your team?

Benny Joseph: Include Zoe Daniels — she's my VP of RevOps. She'll be the one running this day-to-day if we move forward.

Leo Zhou: Perfect. I'll send the invite to both of you.

[Recording ends — 43 minutes]`
      },
    ],
  },

  // ─────────────────────────────────────────────
  // DEAL 2 — Gymshark | Demo Stage
  // ─────────────────────────────────────────────
  {
    id: 'deal-2',
    name: 'Gymshark Sales Suite',
    company: 'Gymshark',
    website: 'www.gymshark.com',
    logo: 'https://logo.clearbit.com/gymshark.com',
    stage: 'Demo',
    value: 180000,
    confidenceScore: 68,
    daysInStage: 34,
    lastActivity: '2026-02-25',
    ownerEmail: 'leo@meridian.ai',
    riskOneLiner: 'Competing with Gong — need to differentiate on relationship intelligence',
    buyingStages: ['Discovery', 'Evaluation', 'Decision'],
    companyInfo: 'Gymshark is a fitness apparel and accessories brand. Founded in 2012, grown to $500M+ revenue. Rapidly scaling B2B partnerships and enterprise sales team.',
    stakeholders: [
      { id: 'g2-s1', name: 'Marcus Chen', title: 'VP Sales', role: 'Champion', roles: ['Champion', 'Evaluator'], sentiment: 'Positive', engagement: 'High', avatar: AVATARS.d2_s1, stage: 'Evaluation', email: 'marcus.chen@gymshark.com', keyInsights: 'Active Gong user but frustrated with lack of relationship intelligence. Gong contract ends in 4 months — window of opportunity.', x: 200, y: 150 },
      { id: 'g2-s2', name: 'Sarah Kim', title: 'Sales Operations Manager', role: 'Evaluator', roles: ['Evaluator', 'User'], sentiment: 'Positive', engagement: 'High', avatar: AVATARS.d2_s2, stage: 'Evaluation', email: 'sarah.kim@gymshark.com', keyInsights: 'Running parallel evaluation with Clari. Loves our stakeholder mapping feature. Will write the internal recommendation.', x: 500, y: 150 },
      { id: 'g2-s3', name: 'David Park', title: 'CRO', role: 'Decision Maker', roles: ['Decision Maker'], sentiment: 'Neutral', engagement: 'Low', avatar: AVATARS.d2_s3, stage: 'Decision', email: 'd.park@gymshark.com', keyInsights: 'Will make final call. Needs team consensus first. Has approved Gong renewal twice — need to understand switching cost concern.', x: 750, y: 150 },
      { id: 'g2-s4', name: 'Priya Nair', title: 'Enterprise Account Executive', role: 'User', roles: ['User'], sentiment: 'Positive', engagement: 'Medium', avatar: AVATARS.d2_s4, stage: 'Evaluation', email: 'priya.nair@gymshark.com', keyInsights: 'Power user in the pilot. Gave detailed product feedback. Strong internal advocate among the AE team.', x: 500, y: 320 },
    ],
    snapshots: [
      {
        id: 'snap-2b', dealId: 'deal-2', date: '2026-02-25',
        whatsHappening: 'Full platform demo completed. Sarah running parallel eval with Clari. Marcus pushing for POC. CRO David not yet engaged — needs to be brought in before decision stage.',
        whatsNext: 'Send competitive comparison doc vs Gong and Clari. Schedule POC kickoff with Sarah and Priya.',
        keyRisks: ['Competing with Gong (incumbent) and Clari', 'CRO not yet engaged — decision risk', 'Gong may offer renewal discount to retain'],
        confidenceScore: 68, confidenceChange: 8, interactionType: 'Demo', keyParticipant: 'Sarah Kim'
      },
      {
        id: 'snap-2a', dealId: 'deal-2', date: '2026-02-10',
        whatsHappening: 'Discovery call with Marcus. Clear pain around relationship intelligence gap in Gong. Gong contract expires in 4 months — good timing.',
        whatsNext: 'Schedule full demo with Marcus and Sarah. Prepare Gymshark-specific demo environment.',
        keyRisks: ['Gong renewal pressure', 'Need to get Sarah involved early'],
        confidenceScore: 60, confidenceChange: 0, interactionType: 'Discovery Call', keyParticipant: 'Marcus Chen'
      },
    ],
    interactions: [
      {
        id: 'int-2c', dealId: 'deal-2', date: '2026-02-25', type: 'Demo', keyParticipant: 'Sarah Kim',
        summary: 'Full platform demo. Sarah impressed by stakeholder map. Wants to test with real deals.',
        duration: 60,
        transcript: `[Chorus recording — Gymshark Demo — Feb 25, 2026]

Leo Zhou: Alright, Marcus, Sarah, Priya — thanks for joining. I'm going to walk you through Meridian today, and I want to make it as relevant to Gymshark as possible. Marcus, you mentioned on our last call that the main gap with Gong is the relationship intelligence layer — so I'm going to start there.

Marcus Chen (Gymshark, VP Sales): Yeah, that's the thing. Gong is great for call recording and coaching, but it doesn't tell me anything about the buying committee. I know what was said in the meeting, but I don't know who else is involved in the decision that I'm not talking to.

Leo Zhou: Exactly. So let me show you the Stakeholder Map. This is a live deal in our system — I've anonymized it but the data is real. You can see every person involved in the buying committee, their role, their sentiment, and how they're connected to each other.

Sarah Kim (Gymshark, Sales Ops): Oh wow. So the arrows show the reporting relationships?

Leo Zhou: Right. And you can see the color coding — green means they're positive, yellow is neutral, red is a blocker or skeptic. So at a glance, the rep can see that the Legal person is a blocker and the CFO is neutral — those are the two people they need to focus on.

Sarah Kim: And this is all populated automatically from the meeting recordings?

Leo Zhou: Yes. The rep doesn't have to manually enter any of this. They upload the transcript or connect their calendar, and the AI extracts the stakeholder mentions, the sentiment signals, the relationship dynamics.

Priya Nair (Gymshark, AE): Can I ask — what happens if the AI gets it wrong? Like, if it misidentifies someone's sentiment?

Leo Zhou: Great question. The rep can always override the AI's assessment. There's an edit button on every stakeholder card — you can change the sentiment, the role, add notes. The AI is a starting point, not the final word.

Priya Nair: Okay, that's important. Because sometimes the sentiment in a meeting is different from what the person actually thinks.

Leo Zhou: Totally. And that's actually one of the things Meridian is designed to capture — the gap between what people say in meetings and what they actually think. The AI looks for signals like hedging language, questions about competitors, requests for more information that might indicate skepticism even if the person is being polite.

Marcus Chen: That's... actually really interesting. Can you give an example?

Leo Zhou: Sure. If someone says "that's interesting, we'll need to think about it" — that's a classic hedge. Meridian flags that as a neutral-to-negative signal, even though on the surface it sounds positive. Versus "when can we get started" — that's a strong positive signal.

Marcus Chen: [laughs] Yeah, I've been burned by the "we'll think about it" line more times than I can count.

Sarah Kim: I want to ask about the Salesforce integration. We're very heavily customized in Salesforce — we have custom objects, custom fields, a whole custom sales methodology built in. How does Meridian handle that?

Leo Zhou: We have a field mapping configuration in the admin panel where you can define exactly how Meridian data maps to your Salesforce objects. It supports standard and custom objects. The initial setup takes a few hours, but once it's done it's fully automated.

Sarah Kim: Okay. And what about Clari? We're also evaluating Clari for pipeline forecasting. Is there overlap?

Leo Zhou: There is some overlap in the forecasting layer, but Meridian's core differentiation is the relationship intelligence — the stakeholder mapping, the sentiment analysis, the deal narrative. Clari is primarily a forecasting tool. They don't do what we do on the qualitative side. Many of our customers actually use both.

Sarah Kim: Interesting. I'll want to do a feature comparison matrix.

Leo Zhou: I can send you one — we have a comparison doc that covers Meridian vs Gong, Clari, and Salesforce Einstein. I'll send it after this call.

Marcus Chen: What does a POC look like? I want to test this with real deals before we commit.

Leo Zhou: Standard POC is thirty days. We set up a dedicated environment with your Salesforce integration, train five to ten reps, and track a specific set of metrics — deal velocity, stakeholder coverage, forecast accuracy. At the end of thirty days, we do a readout with you and your team.

Marcus Chen: That sounds reasonable. Sarah, what do you think?

Sarah Kim: I think we should do it. I want to see how it performs on our actual deals, not a demo environment.

Leo Zhou: Great. I'll send over the POC agreement and we can kick off next week.

[Recording ends — 57 minutes]`
      },
      {
        id: 'int-2b', dealId: 'deal-2', date: '2026-02-10', type: 'Discovery Call', keyParticipant: 'Marcus Chen',
        summary: 'Marcus looking for relationship intelligence layer on top of Salesforce. Current Gong contract ends in 4 months.',
        duration: 30,
        transcript: `[Zoom auto-transcript — Discovery Call — Feb 10, 2026]

Leo Zhou: Hey Marcus, thanks for taking the call. I'll keep it focused — I know you're evaluating a few tools right now.

Marcus Chen: Yeah, we're in the middle of a pretty big RevTech evaluation. Our Gong contract is up in June and we're deciding whether to renew or switch.

Leo Zhou: What's prompting the re-evaluation?

Marcus Chen: Honestly, Gong is fine for what it does. Call recording, conversation intelligence, coaching. But it doesn't give me visibility into the relationship side of deals. I can see what was said in a meeting, but I can't see who else is involved in the decision that my reps aren't talking to.

Leo Zhou: The buying committee blind spot.

Marcus Chen: Exactly. We sell to enterprise accounts — average deal size is two hundred, two fifty thousand. These deals have five, six, seven people involved in the decision. My reps are typically only talking to two or three of them. And then we lose deals because there was a blocker we didn't know about.

Leo Zhou: How often does that happen?

Marcus Chen: More than I'd like. I'd say maybe twenty, twenty-five percent of our lost deals, when I do the post-mortem, the reason is "we didn't know about this person" or "this person changed their mind and we didn't catch it in time."

Leo Zhou: That's a recoverable problem. That's exactly what Meridian is designed to solve. Can I ask — when you say you can't see who else is involved, is that a data problem or a process problem?

Marcus Chen: Both, honestly. The data problem is that reps don't update Salesforce consistently. The process problem is that we don't have a structured way to map the buying committee — it's all in the rep's head.

Leo Zhou: And when a rep leaves?

Marcus Chen: [sighs] Yeah, we lost a senior AE last quarter and basically had to start over on two of his deals. It was painful.

Leo Zhou: Okay. So what I'm hearing is: you need better visibility into the buying committee, you need that information to be captured automatically rather than relying on rep discipline, and you need it to persist even when reps turn over.

Marcus Chen: That's a good summary, yeah.

Leo Zhou: That's exactly what Meridian does. I'd love to show you a demo. Can we get thirty minutes on the calendar with you and whoever else would be evaluating this?

Marcus Chen: Yeah, include Sarah Kim — she's my Sales Ops Manager. She'll be doing the technical evaluation.

Leo Zhou: Perfect. I'll send a calendar invite.

[Recording ends — 28 minutes]`
      },
      {
        id: 'int-2a', dealId: 'deal-2', date: '2026-01-28', type: 'Follow-up', keyParticipant: 'Marcus Chen',
        summary: 'Initial outbound — Marcus responded to LinkedIn message about stakeholder intelligence.',
        duration: 15,
        transcript: `[Phone call — brief intro — Jan 28, 2026]

Leo Zhou: Hey Marcus, Leo Zhou from Meridian. Thanks for connecting on LinkedIn and taking my call.

Marcus Chen: Yeah, your message caught my attention. You mentioned stakeholder intelligence for enterprise sales — that's something I've been thinking about a lot lately.

Leo Zhou: What's the context for you?

Marcus Chen: We're scaling our enterprise sales team and I'm realizing that the tools we have — Salesforce, Gong — they're good at tracking what happened, but they're not good at telling me what's happening right now in a deal. Especially on the relationship side.

Leo Zhou: That's exactly the gap Meridian fills. Can we set up a proper discovery call? I'd love to understand your specific situation better.

Marcus Chen: Sure. Send me some times.

[Call ends — 14 minutes]`
      },
    ],
  },

  // ─────────────────────────────────────────────
  // DEAL 3 — Skechers | POC (Stalled)
  // ─────────────────────────────────────────────
  {
    id: 'deal-3',
    name: 'Skechers Global',
    company: 'Skechers',
    website: 'www.skechers.com',
    logo: 'https://logo.clearbit.com/skechers.com',
    stage: 'POC',
    value: 650000,
    confidenceScore: 45,
    daysInStage: 135,
    lastActivity: '2026-02-20',
    ownerEmail: 'leo@meridian.ai',
    riskOneLiner: 'POC stalled 3 weeks — IT Director blocking integration over data residency',
    buyingStages: ['Technical Validation', 'Business Case', 'Procurement', 'Legal'],
    companyInfo: 'Skechers is a global footwear company with $8B+ revenue. Large enterprise sales team across 30+ countries. Complex IT governance and procurement processes.',
    stakeholders: [
      { id: 'sk3-s1', name: 'Rachel Torres', title: 'SVP Revenue Operations', role: 'Champion', roles: ['Champion', 'Influencer'], sentiment: 'Positive', engagement: 'Medium', avatar: AVATARS.d3_s1, stage: 'Business Case', email: 'r.torres@skechers.com', keyInsights: 'Strong sponsor but bandwidth limited. Delegating heavily to team. Has political capital to override IT if needed.', x: 300, y: 120 },
      { id: 'sk3-s2', name: 'Kevin Wright', title: 'IT Director', role: 'Blocker', roles: ['Blocker', 'Evaluator'], sentiment: 'Negative', engagement: 'High', avatar: AVATARS.d3_s2, stage: 'Technical Validation', email: 'k.wright@skechers.com', keyInsights: 'Concerned about SSO integration and data residency. Has blocked two vendor deals this year. Needs private cloud option.', x: 100, y: 120 },
      { id: 'sk3-s3', name: 'Lisa Huang', title: 'Sales Enablement Lead', role: 'User', roles: ['User', 'Champion'], sentiment: 'Positive', engagement: 'High', avatar: AVATARS.d3_s3, stage: 'Technical Validation', email: 'lisa.huang@skechers.com', keyInsights: 'End user champion. Already testing with 3 reps. Vocal advocate internally. Will present user feedback to Rachel.', x: 100, y: 310 },
      { id: 'sk3-s4', name: 'Tom Nakamura', title: 'VP Finance', role: 'Evaluator', roles: ['Evaluator', 'Decision Maker'], sentiment: 'Neutral', engagement: 'Low', avatar: AVATARS.d3_s4, stage: 'Procurement', email: 't.nakamura@skechers.com', keyInsights: 'Controls procurement budget. Has not been engaged yet. Rachel needs to brief him before we can move to contract.', x: 550, y: 120 },
      { id: 'sk3-s5', name: 'Carlos Mendez', title: 'CISO', role: 'Evaluator', roles: ['Evaluator', 'Blocker'], sentiment: 'Neutral', engagement: 'Low', avatar: AVATARS.d3_s5, stage: 'Technical Validation', email: 'c.mendez@skechers.com', keyInsights: 'Security review required for all SaaS tools. Has not been engaged yet. Kevin may escalate to him.', x: 300, y: 310 },
    ],
    snapshots: [
      {
        id: 'snap-3c', dealId: 'deal-3', date: '2026-02-20',
        whatsHappening: 'POC running but IT blocking full API integration. Kevin insists on on-prem or private cloud option. Rachel trying to override but limited bandwidth. Lisa\'s reps love the product but can\'t access full features without the integration.',
        whatsNext: 'Prepare private cloud deployment proposal. Schedule IT security review with Kevin and CISO Carlos. Get Rachel to escalate internally.',
        keyRisks: ['IT Director actively blocking — 3 weeks stalled', 'CISO not yet engaged — could be additional blocker', 'POC losing momentum — rep enthusiasm fading', 'Rachel\'s bandwidth limited — may lose champion attention'],
        confidenceScore: 45, confidenceChange: -15, interactionType: 'POC Check-in', keyParticipant: 'Lisa Huang'
      },
      {
        id: 'snap-3b', dealId: 'deal-3', date: '2026-02-05',
        whatsHappening: 'Technical review with Kevin raised data residency concerns. Kevin wants on-prem deployment. We don\'t offer on-prem — need to position private cloud as alternative.',
        whatsNext: 'Prepare private cloud architecture documentation. Get security team to join next call with Kevin.',
        keyRisks: ['On-prem requirement we can\'t meet', 'Kevin has blocked deals before'],
        confidenceScore: 60, confidenceChange: -5, interactionType: 'Technical Review', keyParticipant: 'Kevin Wright'
      },
      {
        id: 'snap-3a', dealId: 'deal-3', date: '2026-01-15',
        whatsHappening: 'POC kicked off. Rachel enthusiastic. Lisa\'s team onboarded. Early results positive — reps reporting time savings.',
        whatsNext: 'Continue POC. Schedule mid-point review with Rachel.',
        keyRisks: ['IT integration not yet complete', 'Need to engage procurement early'],
        confidenceScore: 65, confidenceChange: 5, interactionType: 'POC Check-in', keyParticipant: 'Rachel Torres'
      },
    ],
    interactions: [
      {
        id: 'int-3d', dealId: 'deal-3', date: '2026-02-20', type: 'POC Check-in', keyParticipant: 'Lisa Huang',
        summary: 'POC users love the product. 3 reps actively using. But IT has blocked API access.',
        duration: 25,
        transcript: `[Zoom recording — POC Check-in — Feb 20, 2026]

Leo Zhou: Hey Lisa, thanks for the update. How are the reps finding it?

Lisa Huang (Skechers, Sales Enablement Lead): Honestly, they love it. Like, genuinely love it. Jessica said it saved her two hours of prep time last week. And the stakeholder map — she used it in a deal review with Rachel and Rachel was really impressed.

Leo Zhou: That's great to hear. What's the main friction point right now?

Lisa Huang: The integration. We're still on manual transcript upload because Kevin hasn't approved the API connection. And that's... it's workable, but it's not sustainable. The reps are doing it because they see the value, but if they have to manually upload every transcript forever, adoption is going to drop off.

Leo Zhou: Understood. What's Kevin's specific concern?

Lisa Huang: Data residency, mostly. He wants to know that the conversation data isn't leaving the US. And he's also asking about SSO — we use Okta and he wants to make sure the integration is certified.

Leo Zhou: We're Okta certified and all US customer data is stored in AWS US-East. I can send him the documentation today.

Lisa Huang: I've tried sending him documentation. He reads it and then comes back with more questions. I think he needs to talk to your security team directly.

Leo Zhou: I can arrange that. Can you help me get a meeting with Kevin and your CISO — Carlos, right?

Lisa Huang: Carlos hasn't been involved yet. Kevin might escalate to him if he's not satisfied. That could be... complicated.

Leo Zhou: Better to get ahead of it. Can you intro me to Carlos before Kevin escalates?

Lisa Huang: I can try. Rachel would need to make that intro — I don't have a direct relationship with Carlos.

Leo Zhou: Can you ask Rachel to make that intro? I think if we can get a security review scheduled in the next two weeks, we can unblock the integration and save the POC.

Lisa Huang: Yeah, I'll talk to Rachel today. She's been frustrated with Kevin too — she wants this to move forward.

[Recording ends — 24 minutes]`
      },
      {
        id: 'int-3c', dealId: 'deal-3', date: '2026-02-05', type: 'Technical Review', keyParticipant: 'Kevin Wright',
        summary: 'Kevin raised data residency and SSO concerns. Wants on-prem deployment option.',
        duration: 45,
        transcript: `[Chorus recording — Technical Review — Feb 5, 2026]

Leo Zhou: Kevin, thanks for joining. I know you have a lot of questions about the technical architecture — I want to make sure we address all of them today.

Kevin Wright (Skechers, IT Director): Yeah, I've been looking through the documentation you sent and I have a number of concerns. Let me go through them.

Leo Zhou: Please.

Kevin Wright: First — data residency. Where exactly is the conversation data stored? And I mean physically — what data center, what region.

Leo Zhou: All US customer data is stored in AWS US-East-1, which is in Northern Virginia. We don't transfer data outside the US for US customers.

Kevin Wright: What about backups?

Leo Zhou: Backups are also in US-East-1. We have a secondary backup in US-West-2 for disaster recovery, but that's also within the US.

Kevin Wright: Okay. Second question — SSO. We use Okta. Is your Okta integration certified?

Leo Zhou: Yes, we're an Okta Integration Network certified partner. The SAML 2.0 integration is fully supported.

Kevin Wright: Do you support SCIM provisioning?

Leo Zhou: Yes, we support SCIM 2.0 for automated user provisioning and deprovisioning.

Kevin Wright: Okay. Third — data encryption. What encryption standard do you use for data at rest?

Leo Zhou: AES-256 for data at rest, TLS 1.3 for data in transit.

Kevin Wright: What about key management? Do you manage the encryption keys or do we?

Leo Zhou: By default, we manage the keys. But for enterprise customers, we offer customer-managed keys through AWS KMS. That's an add-on to the enterprise tier.

Kevin Wright: I'd want customer-managed keys. That's a requirement for us.

Leo Zhou: Understood. I'll include that in the proposal.

Kevin Wright: Fourth — and this is the big one — do you offer on-premise deployment?

Leo Zhou: We don't offer on-premise. We're cloud-native. However, we do offer a private cloud deployment for enterprise customers — that's a dedicated tenant in AWS where your data is completely isolated from other customers. No shared infrastructure.

Kevin Wright: That's not the same as on-prem.

Leo Zhou: It's not. But it provides the same level of data isolation. Your data never touches shared infrastructure. And you get the same security controls — customer-managed keys, dedicated VPC, private endpoints.

Kevin Wright: [pause] I'd need to see the architecture documentation for the private cloud deployment.

Leo Zhou: I can have that to you by end of week. I'll also have our Head of Security join our next call if that would be helpful — he can answer any technical questions I can't.

Kevin Wright: That would be appropriate. I'm not going to approve the API integration until I'm satisfied with the security posture.

Leo Zhou: I understand. I want to make sure you're fully comfortable before we proceed. Can we schedule a follow-up call for next week with our security team?

Kevin Wright: Send me some times.

[Recording ends — 43 minutes]`
      },
      {
        id: 'int-3b', dealId: 'deal-3', date: '2026-01-15', type: 'POC Check-in', keyParticipant: 'Rachel Torres',
        summary: 'POC kickoff. Rachel enthusiastic. Lisa\'s team onboarded. Early results positive.',
        duration: 30,
        transcript: `[Zoom recording — POC Kickoff — Jan 15, 2026]

Rachel Torres (Skechers, SVP RevOps): Leo, I'm really excited about this. I've been pushing for a tool like this for two years. The fact that we're finally doing a POC is a big deal.

Leo Zhou: I'm excited too. Let's make sure we set it up for success. I want to define the success metrics upfront so we have a clear picture at the end of thirty days.

Rachel Torres: Makes sense. What do you typically measure?

Leo Zhou: Three things: stakeholder coverage — how many contacts per deal on average; deal velocity — time from stage to stage; and forecast accuracy — how well the confidence scores predict actual outcomes.

Rachel Torres: I like that. Can we add rep time savings? I want to show the efficiency gain.

Leo Zhou: Absolutely. We can track that through a survey at the end of the POC — ask the reps how much time they're saving on deal prep and CRM updates.

Rachel Torres: Perfect. Lisa is going to be the day-to-day point of contact. She's already briefed the pilot reps — we have five reps who volunteered.

Leo Zhou: Great. I'll set up a kickoff call with Lisa and the five reps this week to do the onboarding.

Rachel Torres: One thing I want to flag — Kevin Wright, our IT Director, is going to want to review the technical architecture before he approves the API integration. He's... thorough.

Leo Zhou: I've worked with IT Directors like Kevin before. I'll prepare a comprehensive security and architecture document and reach out to him directly.

Rachel Torres: That would be helpful. He responds better to direct technical engagement than to me trying to relay information.

Leo Zhou: Understood. I'll set up a separate call with Kevin.

[Recording ends — 28 minutes]`
      },
      {
        id: 'int-3a', dealId: 'deal-3', date: '2026-01-05', type: 'Discovery Call', keyParticipant: 'Rachel Torres',
        summary: 'Initial discovery. Rachel frustrated with lack of deal visibility across 30-person sales team.',
        duration: 40,
        transcript: `[Zoom auto-transcript — Discovery Call — Jan 5, 2026]

Leo Zhou: Rachel, thanks for taking the call. I understand you're evaluating sales intelligence tools — can you tell me a bit about what's driving that?

Rachel Torres: Sure. We have a thirty-person enterprise sales team and I have almost no visibility into what's actually happening in our deals. I get the Salesforce data, which is always incomplete, and I get the rep's verbal update in the forecast call, which is always optimistic. What I don't get is the ground truth.

Leo Zhou: What does "ground truth" look like for you?

Rachel Torres: I want to know who's actually involved in the buying decision. I want to know if there's a blocker I don't know about. I want to know if the champion has gone quiet. Right now I find out about these things when the deal slips, not before.

Leo Zhou: And when deals slip, what's the typical reason?

Rachel Torres: Usually one of three things. One — we were talking to the wrong person and the actual decision maker said no. Two — there was a blocker we didn't know about. Three — the champion lost internal support and we didn't know.

Leo Zhou: All three of those are stakeholder intelligence problems.

Rachel Torres: Exactly. And the frustrating thing is that the information exists — it's in the meeting recordings, it's in the email threads — but nobody's synthesizing it. The reps are too busy selling to do the analysis.

Leo Zhou: That's exactly the problem Meridian solves. The AI does the synthesis automatically — from the meeting recordings, it extracts who's involved, what their sentiment is, what the risks are. The rep doesn't have to do anything extra.

Rachel Torres: How accurate is the AI?

Leo Zhou: About eighty to eighty-five percent accuracy on stakeholder identification and sentiment. The rep can always override if the AI gets it wrong. But in practice, most reps find the AI is right more often than not.

Rachel Torres: What does implementation look like?

Leo Zhou: For a team your size, two to three weeks from contract to go-live. We handle the Salesforce integration, we do rep training, and we have a dedicated CSM for the first ninety days.

Rachel Torres: I'd want to do a POC before committing. Can we do a thirty-day trial?

Leo Zhou: Absolutely. That's our standard approach. I'll put together a POC proposal.

[Recording ends — 38 minutes]`
      },
    ],
  },

  // ─────────────────────────────────────────────
  // DEAL 4 — Lululemon | Negotiation (Budget Freeze)
  // ─────────────────────────────────────────────
  {
    id: 'deal-4',
    name: 'Lululemon Analytics',
    company: 'Lululemon',
    website: 'www.lululemon.com',
    logo: 'https://logo.clearbit.com/lululemon.com',
    stage: 'Negotiation',
    value: 310000,
    confidenceScore: 60,
    daysInStage: 212,
    lastActivity: '2026-03-01',
    ownerEmail: 'leo@meridian.ai',
    riskOneLiner: 'Budget freeze until Q3 — deal at risk of competitor entering during pause',
    buyingStages: ['Alignment', 'Negotiation', 'Contract'],
    companyInfo: 'Lululemon is a premium athletic apparel company with $9B+ revenue. Growing enterprise B2B sales team. Recent CFO change — new CFO imposed company-wide budget freeze.',
    stakeholders: [
      { id: 'lu4-s1', name: 'Amanda Foster', title: 'VP Sales Operations', role: 'Champion', roles: ['Champion', 'Influencer'], sentiment: 'Positive', engagement: 'High', avatar: AVATARS.d4_s1, stage: 'Negotiation', email: 'amanda.foster@lululemon.com', keyInsights: 'Strong champion. Pushing hard internally despite budget freeze. Has political capital with new CFO. Frustrated by the delay.', x: 300, y: 150 },
      { id: 'lu4-s2', name: 'James Liu', title: 'CFO', role: 'Decision Maker', roles: ['Decision Maker'], sentiment: 'Neutral', engagement: 'Medium', avatar: AVATARS.d4_s2, stage: 'Contract', email: 'james.liu@lululemon.com', keyInsights: 'New CFO — imposed company-wide budget freeze in January. Open to Q3 start. Has not seen the product demo yet.', x: 600, y: 150 },
      { id: 'lu4-s3', name: 'Derek Walsh', title: 'CRO', role: 'Influencer', roles: ['Influencer', 'Champion'], sentiment: 'Positive', engagement: 'Medium', avatar: AVATARS.d4_s3, stage: 'Alignment', email: 'd.walsh@lululemon.com', keyInsights: 'Strong advocate. Introduced us to Amanda. Has been pushing for budget exception but limited influence over new CFO.', x: 150, y: 300 },
      { id: 'lu4-s4', name: 'Nina Patel', title: 'Legal Counsel', role: 'Evaluator', roles: ['Evaluator'], sentiment: 'Neutral', engagement: 'Low', avatar: AVATARS.d4_s4, stage: 'Contract', email: 'nina.patel@lululemon.com', keyInsights: 'Contract review in progress. No major concerns flagged yet. Standard enterprise review timeline.', x: 600, y: 310 },
    ],
    snapshots: [
      {
        id: 'snap-4b', dealId: 'deal-4', date: '2026-03-01',
        whatsHappening: 'Terms agreed but budget frozen company-wide by new CFO James Liu. Amanda negotiating for Q3 exception. Derek supporting internally. Legal review in progress but on hold pending budget approval.',
        whatsNext: 'Keep relationship warm with Amanda and Derek. Prepare Q3 start proposal. Consider offering pilot at reduced cost to maintain momentum.',
        keyRisks: ['Company-wide budget freeze — no exceptions so far', 'Long sales cycle fatigue (212 days)', 'Competitor may enter during Q2-Q3 pause', 'New CFO has not seen the product — needs executive briefing'],
        confidenceScore: 60, confidenceChange: -15, interactionType: 'Negotiation', keyParticipant: 'Amanda Foster'
      },
      {
        id: 'snap-4a', dealId: 'deal-4', date: '2026-02-01',
        whatsHappening: 'Terms negotiation going well. Amanda pushing for Q1 close. Legal review started. Then CFO change happened.',
        whatsNext: 'Navigate CFO transition. Get intro to new CFO James Liu.',
        keyRisks: ['CFO change — new CFO unknown quantity', 'Q1 close at risk'],
        confidenceScore: 75, confidenceChange: 5, interactionType: 'Negotiation', keyParticipant: 'Amanda Foster'
      },
    ],
    interactions: [
      {
        id: 'int-4c', dealId: 'deal-4', date: '2026-03-01', type: 'Negotiation', keyParticipant: 'Amanda Foster',
        summary: 'Amanda confirmed budget freeze. Suggested creative structuring — start billing in Q3.',
        duration: 40,
        transcript: `[Zoom recording — Negotiation Call — Mar 1, 2026]

Amanda Foster (Lululemon, VP Sales Ops): Leo, I'm really sorry about this. I was so close to getting this across the line and then James comes in and freezes everything.

Leo Zhou: I understand. These things happen. Let's figure out how to keep the momentum going. What's the timeline on the freeze?

Amanda Foster: James is saying Q3 — so July at the earliest. He wants to see Q1 and Q2 results before approving any new spend.

Leo Zhou: Is there any flexibility? Like, could we structure a pilot at a reduced cost that falls under a different budget threshold?

Amanda Foster: That's actually what I was going to ask you about. What's the minimum we could do to keep this alive and show James some results before Q3?

Leo Zhou: We could do a limited pilot — five reps, ninety days, at about thirty percent of the full contract value. That would be around ninety thousand dollars. Is there a budget threshold below which James doesn't need to approve?

Amanda Foster: Anything under a hundred thousand is at my discretion. So ninety thousand might work.

Leo Zhou: Okay. Let me put together a proposal for a ninety-thousand-dollar pilot — five reps, ninety days, full Salesforce integration. At the end of the pilot, you'd have the data to make the case to James for the full rollout.

Amanda Foster: That could work. Derek would support it — he's been pushing for this for months.

Leo Zhou: Should we get Derek on a call to align on the pilot scope?

Amanda Foster: Yes. Let me set that up for next week.

Leo Zhou: One other thing — would it make sense to get James into a brief executive briefing? Even just thirty minutes, so he understands what we're doing and why it matters. It might make the Q3 conversation easier.

Amanda Foster: That's a good idea. He's new and he doesn't know anything about Meridian. I'll ask him.

Leo Zhou: Perfect. I'll send the pilot proposal today.

[Recording ends — 38 minutes]`
      },
      {
        id: 'int-4b', dealId: 'deal-4', date: '2026-01-20', type: 'Executive Briefing', keyParticipant: 'Derek Walsh',
        summary: 'CRO Derek briefing. Strong advocate. Pushed for Q1 close. CFO change happened two weeks later.',
        duration: 35,
        transcript: `[Chorus recording — Executive Briefing — Jan 20, 2026]

Derek Walsh (Lululemon, CRO): Leo, I'll be direct. I've been pushing for this deal for three months. Amanda is fully bought in, Legal is almost done with their review, and I think we can close this in Q1 if we move fast.

Leo Zhou: I'm aligned on that timeline. What are the remaining blockers?

Derek Walsh: Honestly, just the CFO sign-off. Our previous CFO was going to approve it — it was basically done. But we just had a CFO transition and the new guy, James Liu, he's doing a full budget review. He's not going to block it, but he might slow it down.

Leo Zhou: Have you briefed James on the deal?

Derek Walsh: Not yet. I was going to do that this week. I want to make sure I frame it right — this isn't just a software purchase, it's a strategic investment in our sales capability.

Leo Zhou: Would it help if I prepared a one-page executive summary for James? Something that frames the ROI in CFO language — payback period, revenue impact, risk mitigation.

Derek Walsh: That would be very helpful. James is a numbers guy. He's going to want to see the math.

Leo Zhou: I'll have it to you by end of week. What's the best format — PDF, slides?

Derek Walsh: One-page PDF. He doesn't have time for slides.

Leo Zhou: Done. And the contract terms — are you comfortable with the pricing we've discussed?

Derek Walsh: The pricing is fine. Amanda negotiated it down a bit from the initial proposal, which I think is fair. The term length — we're thinking two years, not three. We want to see how it performs before committing to three.

Leo Zhou: Two years works for us. I'll update the contract accordingly.

[Recording ends — 33 minutes]`
      },
      {
        id: 'int-4a', dealId: 'deal-4', date: '2025-12-10', type: 'Discovery Call', keyParticipant: 'Amanda Foster',
        summary: 'Initial discovery with Amanda. Pain around deal visibility and rep coaching.',
        duration: 45,
        transcript: `[Zoom auto-transcript — Discovery Call — Dec 10, 2025]

Leo Zhou: Amanda, thanks for taking the call. Derek Walsh mentioned you're the right person to talk to about sales intelligence tools.

Amanda Foster: Yeah, Derek introduced us. He's been following Meridian for a while. I run Sales Ops so I'm the one who would actually implement and manage a tool like this.

Leo Zhou: What's the current state of your sales intelligence stack?

Amanda Foster: We use Salesforce as our CRM, Gong for call recording, and Clari for forecasting. The gap I'm trying to fill is the qualitative side — I know what's in the pipeline and I know what was said in meetings, but I don't have a good picture of the relationship dynamics inside each deal.

Leo Zhou: Can you give me an example of where that gap has cost you?

Amanda Foster: Sure. Last quarter we lost a deal that we thought was ninety percent likely to close. Turned out there was a new VP who had joined the buying committee two months earlier and nobody had engaged him. He vetoed the deal at the last minute. If we'd known he was there, we could have engaged him. But nobody knew.

Leo Zhou: How did you find out after the fact?

Amanda Foster: The rep mentioned it in the post-mortem. He'd heard about the new VP but didn't think it was important to mention.

Leo Zhou: That's a classic example of a stakeholder blind spot. Meridian would have flagged that automatically — any time a new person is mentioned in a meeting recording, it creates a stakeholder record and alerts the rep and manager.

Amanda Foster: That's exactly what I need. How does it work technically?

Leo Zhou: The rep connects their calendar or uploads the meeting transcript. The AI processes it and extracts stakeholder mentions, sentiment signals, action items. Everything gets structured into a Deal Snapshot that you and the rep can both see.

Amanda Foster: And it integrates with Salesforce?

Leo Zhou: Yes, bidirectional sync. Anything Meridian captures gets written back to Salesforce automatically.

Amanda Foster: Okay. I want to see a demo. Can we include Derek?

Leo Zhou: Absolutely. I'll send a calendar invite.

[Recording ends — 43 minutes]`
      },
    ],
  },

  // ─────────────────────────────────────────────
  // DEAL 5 — Notion | Negotiation (Near Close)
  // ─────────────────────────────────────────────
  {
    id: 'deal-5',
    name: 'Notion Sales Intelligence',
    company: 'Notion',
    website: 'www.notion.so',
    logo: 'https://logo.clearbit.com/notion.so',
    stage: 'Negotiation',
    value: 110000,
    confidenceScore: 88,
    daysInStage: 55,
    lastActivity: '2026-03-02',
    ownerEmail: 'leo@meridian.ai',
    riskOneLiner: 'On track — CEO signature pending, targeting March 15 close',
    buyingStages: ['Evaluation', 'Approval', 'Close'],
    companyInfo: 'Notion is a productivity and collaboration software company. $10B+ valuation, 500+ employees. Growing enterprise sales team targeting Fortune 500 accounts.',
    stakeholders: [
      { id: 'no5-s1', name: 'Michelle Wang', title: 'Head of Enterprise Sales', role: 'Champion', roles: ['Champion', 'Decision Maker'], sentiment: 'Positive', engagement: 'High', avatar: AVATARS.d5_s1, stage: 'Close', email: 'michelle.wang@notion.so', keyInsights: 'Ready to sign. Pushing for March close. Has full budget authority for tools under $150K. CEO sign-off is a formality.', x: 600, y: 150 },
      { id: 'no5-s2', name: 'Ivan Zhao', title: 'CEO', role: 'Decision Maker', roles: ['Decision Maker'], sentiment: 'Positive', engagement: 'Medium', avatar: AVATARS.d5_s2, stage: 'Close', email: 'ivan.zhao@notion.so', keyInsights: 'Approved budget. Wants to start onboarding ASAP. Met at SaaStr — mentioned he\'d heard good things about Meridian.', x: 600, y: 310 },
      { id: 'no5-s3', name: 'Akshay Kothari', title: 'COO', role: 'Influencer', roles: ['Influencer', 'Evaluator'], sentiment: 'Positive', engagement: 'Medium', avatar: AVATARS.d5_s3, stage: 'Approval', email: 'akshay.k@notion.so', keyInsights: 'Operational champion. Wants to use Meridian data for quarterly business reviews. Supportive of the deal.', x: 350, y: 230 },
      { id: 'no5-s4', name: 'Camille Ricketts', title: 'VP Marketing & Sales Enablement', role: 'User', roles: ['User', 'Evaluator'], sentiment: 'Positive', engagement: 'High', avatar: AVATARS.d5_s4, stage: 'Evaluation', email: 'c.ricketts@notion.so', keyInsights: 'Power user during POC. Gave detailed feedback. Will manage the rollout to the sales team.', x: 150, y: 150 },
    ],
    snapshots: [
      {
        id: 'snap-5b', dealId: 'deal-5', date: '2026-03-02',
        whatsHappening: 'Contract in final legal review. All commercial terms agreed. Ivan approved budget. Michelle pushing for March 15 close date. Onboarding team already briefed.',
        whatsNext: 'Send final contract for signature. Schedule onboarding kickoff for March 17.',
        keyRisks: ['Minor legal redlines on data processing agreement — expect resolution this week'],
        confidenceScore: 88, confidenceChange: 5, interactionType: 'Negotiation', keyParticipant: 'Michelle Wang'
      },
      {
        id: 'snap-5a', dealId: 'deal-5', date: '2026-02-10',
        whatsHappening: 'POC completed successfully. Camille\'s team loved it. Ivan briefed and approved budget. Moving to contract stage.',
        whatsNext: 'Send contract. Begin legal review.',
        keyRisks: ['None significant — deal on track'],
        confidenceScore: 83, confidenceChange: 18, interactionType: 'Executive Briefing', keyParticipant: 'Ivan Zhao'
      },
    ],
    interactions: [
      {
        id: 'int-5d', dealId: 'deal-5', date: '2026-03-02', type: 'Negotiation', keyParticipant: 'Michelle Wang',
        summary: 'Final terms agreed. 3-year deal with annual billing. Onboarding to start March 15.',
        duration: 30,
        transcript: `[Zoom recording — Contract Negotiation — Mar 2, 2026]

Michelle Wang (Notion, Head of Enterprise Sales): Leo, I think we're basically there. Legal had two redlines — one on the data processing agreement around sub-processors, and one on the limitation of liability clause. Both are pretty standard.

Leo Zhou: I saw the redlines. The sub-processor list — we can add that as an exhibit to the DPA, that's easy. The limitation of liability — what's Legal asking for?

Michelle Wang: They want the cap at two times annual contract value instead of one times. Our standard position.

Leo Zhou: I can do one and a half times. That's the most I can go without escalating internally.

Michelle Wang: Let me check with Nina. I think that's probably acceptable. She was mainly pushing on the sub-processor transparency, which you've already addressed.

Leo Zhou: Great. So assuming those two issues are resolved, are we looking at signatures by end of week?

Michelle Wang: That's the goal. Ivan wants to start onboarding March 15 — he's got a big enterprise push in Q2 and he wants the team fully trained before then.

Leo Zhou: We can do March 15 for onboarding kickoff. I'll have the implementation team reach out to Camille this week to start the prep work.

Michelle Wang: Perfect. One more thing — the billing. We agreed on annual billing, right? Not monthly?

Leo Zhou: Annual billing, invoiced on contract start date. First invoice due March 15.

Michelle Wang: Okay. And the term is three years?

Leo Zhou: Three years, with an annual price increase cap of five percent.

Michelle Wang: That works. Alright, I'll get the redlines back to you by tomorrow and we should be able to sign by Friday.

Leo Zhou: Looking forward to it. This has been a great process, Michelle.

Michelle Wang: You too. The team is really excited to get started.

[Recording ends — 28 minutes]`
      },
      {
        id: 'int-5c', dealId: 'deal-5', date: '2026-02-10', type: 'Executive Briefing', keyParticipant: 'Ivan Zhao',
        summary: 'CEO briefing went well. Ivan sees strategic value. Approved budget immediately.',
        duration: 25,
        transcript: `[Zoom recording — CEO Briefing — Feb 10, 2026]

Leo Zhou: Ivan, thanks for making time. I know you're busy — I'll keep this to twenty minutes. Michelle has been leading the evaluation and she wanted to make sure you had the full picture before we move to contract.

Ivan Zhao (Notion, CEO): I appreciate that. I've actually heard about Meridian from a few people in my network. The consensus is that it's the most thoughtful approach to deal intelligence I've seen. So I'm already predisposed to like it. What I want to understand is the strategic value — not just the features.

Leo Zhou: The strategic value is this: your sales team is generating a massive amount of intelligence about your customers and prospects in every meeting they have. Right now, that intelligence lives in the rep's head and disappears when the deal closes or the rep leaves. Meridian captures that intelligence, structures it, and makes it institutional knowledge.

Ivan Zhao: So it's not just a sales tool — it's a knowledge management tool.

Leo Zhou: Exactly. Over time, you build a database of how your best deals were won — what the buying committee looked like, what the key objections were, how they were addressed. That becomes a competitive advantage.

Ivan Zhao: I like that framing. What's the implementation timeline?

Leo Zhou: Two to three weeks from contract to go-live. Camille and her team have already done the technical evaluation — the Salesforce integration is straightforward.

Ivan Zhao: What's the investment?

Leo Zhou: For your team size — twenty-five reps plus managers — it's a hundred and ten thousand annually. Three-year term.

Ivan Zhao: That's within Michelle's budget authority. I'll approve it. Let's move forward.

Leo Zhou: Thank you, Ivan. We're going to make sure this delivers real value for your team.

[Recording ends — 23 minutes]`
      },
      {
        id: 'int-5b', dealId: 'deal-5', date: '2026-01-25', type: 'POC Check-in', keyParticipant: 'Camille Ricketts',
        summary: 'POC results excellent. Camille\'s team reporting significant time savings. Ready to recommend.',
        duration: 35,
        transcript: `[Zoom recording — POC Readout — Jan 25, 2026]

Camille Ricketts (Notion, VP Sales Enablement): Leo, the results are really strong. I want to walk you through what we found.

Leo Zhou: Please, go ahead.

Camille Ricketts: So we ran the POC with six reps for thirty days. Average time savings on deal prep — two point three hours per rep per week. Stakeholder coverage went from an average of two point one contacts per deal to four point seven. And three of the six reps said it changed how they think about deal strategy.

Leo Zhou: That last one is the most meaningful to me. What did they mean by that?

Camille Ricketts: One rep — Jake — he said that before Meridian, he was thinking about deals as conversations. Now he thinks about them as relationships. He's mapping the buying committee before every meeting and thinking about who he hasn't talked to yet.

Leo Zhou: That's a behavioral change. That's what drives long-term win rate improvement.

Camille Ricketts: Exactly. The other thing — and this is a bit unexpected — the reps are using the Deal Snapshot as a coaching tool. They're sharing it with Michelle before deal reviews instead of doing a verbal update. Michelle said the quality of deal reviews has gone up significantly.

Leo Zhou: That's a great use case. It becomes a shared language between reps and managers.

Camille Ricketts: Yeah. Okay, so my recommendation is to move forward. I'm going to present the POC results to Ivan next week and recommend we sign the contract.

Leo Zhou: That's great news. Is there anything I can do to support that presentation?

Camille Ricketts: Can you put together a one-page summary of the POC results in a format I can share with Ivan? He likes clean, data-driven summaries.

Leo Zhou: I'll have it to you by end of week.

[Recording ends — 33 minutes]`
      },
      {
        id: 'int-5a', dealId: 'deal-5', date: '2026-01-05', type: 'Discovery Call', keyParticipant: 'Michelle Wang',
        summary: 'Initial discovery. Michelle building enterprise sales team from scratch. Needs intelligence infrastructure.',
        duration: 40,
        transcript: `[Zoom auto-transcript — Discovery Call — Jan 5, 2026]

Leo Zhou: Michelle, thanks for taking the call. I understand you're building out the enterprise sales motion at Notion — can you tell me where you are in that journey?

Michelle Wang: Sure. We've had a self-serve business for years, but we're now going after enterprise accounts seriously for the first time. I joined six months ago to build that out. We have twenty-five reps now, mostly coming from companies like Salesforce, HubSpot, Gong. They're good reps but they're used to having a mature sales infrastructure. We don't have that yet.

Leo Zhou: What's the most urgent gap?

Michelle Wang: Deal visibility. I have no idea what's happening in our deals unless I'm on the call. The reps are good at selling but they're not good at documenting. Our Salesforce data is a mess.

Leo Zhou: Is that a discipline problem or a tool problem?

Michelle Wang: Honestly, both. The reps don't want to spend time on CRM hygiene — they want to sell. And the tools we have don't make it easy. Salesforce is powerful but it requires a lot of manual input.

Leo Zhou: What if the CRM updated itself automatically from the meeting recordings?

Michelle Wang: That would be... that would change everything, honestly. Is that what Meridian does?

Leo Zhou: That's the core of it. The rep connects their calendar or uploads the transcript, and the AI extracts the stakeholder information, the deal status, the action items, and writes it back to Salesforce automatically. The rep doesn't have to do anything extra.

Michelle Wang: And the AI is accurate?

Leo Zhou: About eighty to eighty-five percent. The rep can always override. But in practice, most reps find the AI is right more often than not, and they trust it more than their own memory.

Michelle Wang: [laughs] That's a low bar. I want to see a demo. Can we do it this week?

Leo Zhou: Absolutely. I'll send a calendar invite.

[Recording ends — 38 minutes]`
      },
    ],
  },
];

export const currentUser = {
  name: 'Leo Zhou',
  email: 'leo@meridian.ai',
  role: 'Account Executive',
  avatar: 'https://ui-avatars.com/api/?name=Leo+Zhou&background=3b82f6&color=fff&size=128',
};

// ─── Helper Functions ───────────────────────────────────────────────────────

export function getConfidenceColor(score: number): string {
  if (score >= 75) return 'text-status-success';
  if (score >= 50) return 'text-status-warning';
  return 'text-status-danger';
}

export function getConfidenceBg(score: number): string {
  if (score >= 75) return 'bg-status-success/15 text-status-success';
  if (score >= 50) return 'bg-status-warning/15 text-status-warning';
  return 'bg-status-danger/15 text-status-danger';
}

export function getSentimentColor(sentiment: string): string {
  if (sentiment === 'Positive') return 'text-status-success';
  if (sentiment === 'Neutral') return 'text-status-warning';
  return 'text-status-danger';
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'Champion': return 'bg-status-success/15 text-status-success border-status-success/30';
    case 'Decision Maker': return 'bg-status-info/15 text-status-info border-status-info/30';
    case 'Blocker': return 'bg-status-danger/15 text-status-danger border-status-danger/30';
    case 'Evaluator': return 'bg-status-warning/15 text-status-warning border-status-warning/30';
    case 'Influencer': return 'bg-primary/15 text-primary border-primary/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getDaysAgo(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function getStageColor(stage: string): string {
  switch (stage) {
    case 'Discovery': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'Demo': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'Technical Evaluation': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'POC': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'Negotiation': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'Closed Won': return 'bg-green-500/15 text-green-400 border-green-500/30';
    case 'Closed Lost': return 'bg-red-500/15 text-red-400 border-red-500/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

export const pipelineStats = {
  totalPipeline: deals.reduce((sum, d) => sum + d.value, 0),
  predictableRevenue: deals.filter(d => d.confidenceScore >= 60).reduce((sum, d) => sum + d.value, 0),
  avgConfidence: Math.round(deals.reduce((sum, d) => sum + d.confidenceScore, 0) / deals.length),
  atRiskCount: deals.filter(d => d.confidenceScore < 60).length,
};
