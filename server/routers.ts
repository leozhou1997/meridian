import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { aiRouter } from "./routers/ai";
import { dealsRouter } from "./routers/deals";
import { knowledgeRouter } from "./routers/knowledge";
import { meetingsRouter } from "./routers/meetings";
import { nextActionsRouter } from "./routers/nextActions";
import { snapshotsRouter } from "./routers/snapshots";
import { stakeholdersRouter } from "./routers/stakeholders";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  deals: dealsRouter,
  stakeholders: stakeholdersRouter,
  meetings: meetingsRouter,
  snapshots: snapshotsRouter,
  nextActions: nextActionsRouter,
  knowledge: knowledgeRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
