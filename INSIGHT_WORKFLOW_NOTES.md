# Insight Workflow Persistence - Implementation Notes

## Current Architecture

### Data Flow
1. AI generates insight → saved to `snapshots` table (whatsHappening, keyRisks, whatsNext)
2. User clicks Accept/Dismiss/Later on What's Next → creates record in `nextActions` table with `source='ai_suggested'`, `snapshotId`, and matching `text`
3. `WhatsNextCard` checks if `existingActions` has matching `text` + `source='ai_suggested'` to determine status

### Problem
- When user clicks "Refresh Analysis", AI generates NEW suggestions with different text
- Old `nextActions` records still exist but their `text` no longer matches new `whatsNext` items
- So dismissed/done items reappear as new suggestions (different text = no match)
- `insightOverrides` (chat-updated insights) are pure frontend state, lost on refresh

## Solution Design

### Approach: Use `snapshotId` as the link, not text matching

**Key insight**: Each What's Next suggestion belongs to a specific snapshot. When we refresh, we create a NEW snapshot. The old snapshot's suggestions should be considered "resolved" (either acted on or superseded).

### Changes Needed

#### 1. Schema: Add `suggestionActions` JSON to snapshots table
Stores the user's disposition of each suggestion in that snapshot:
```json
[
  { "action": "Engage Rachel Torres...", "status": "accepted", "actionId": 123 },
  { "action": "Initiate follow-up...", "status": "rejected" },
  { "action": "Send DPA directly...", "status": "accepted", "actionId": 124 }
]
```

#### 2. Backend: On Refresh Analysis
- Before generating new insight, save current suggestion dispositions to current snapshot's `suggestionActions`
- Generate new AI analysis (new snapshot)
- Filter out suggestions that are semantically similar to already-accepted actions

#### 3. Frontend: What's Next display logic
- Show suggestions from `latestSnapshot.whatsNext`
- Check `nextActions` for matching items (current behavior, keep it)
- When ALL suggestions in a snapshot have been acted on, show "All caught up" state
- Dismissed items disappear from current view but are preserved in snapshot history

#### 4. Frontend: InsightHistory enhancement
- Each snapshot card shows full suggestion list with their dispositions
- Dismissed items shown with "Dismissed" badge + "Restore" button
- Clicking "Restore" on a dismissed item creates a new nextAction with status='accepted'

#### 5. Timeline integration
- Snapshot events in timeline show summary: "AI Analysis: 2 risks, 3 suggestions"
- Click to expand shows full snapshot content
- Already implemented in DealTimeline.tsx (snapshot kind events)
