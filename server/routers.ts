import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { aiRouter } from "./routers/ai";
import { dealsRouter } from "./routers/deals";
import { knowledgeRouter } from "./routers/knowledge";
import { meetingsRouter } from "./routers/meetings";
import { nextActionsRouter } from "./routers/nextActions";
import { snapshotsRouter } from "./routers/snapshots";
import { stakeholdersRouter } from "./routers/stakeholders";
import { teamRouter } from "./routers/team";
import { onboardingRouter } from "./routers/onboarding";
import { salesModelRouter } from "./routers/salesModels";
import { landingRouter } from "./routers/landing";
import { strategyNotesRouter } from "./routers/strategyNotes";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  deals: dealsRouter,
  stakeholders: stakeholdersRouter,
  meetings: meetingsRouter,
  snapshots: snapshotsRouter,
  nextActions: nextActionsRouter,
  knowledge: knowledgeRouter,
  ai: aiRouter,
  team: teamRouter,
  onboarding: onboardingRouter,
  salesModels: salesModelRouter,
  landing: landingRouter,
  strategyNotes: strategyNotesRouter,
});

export type AppRouter = typeof appRouter;
