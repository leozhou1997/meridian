import { z } from "zod";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { aiRouter } from "./routers/ai";
import { dealsRouter } from "./routers/deals";
import { knowledgeRouter } from "./routers/knowledge";
import { meetingsRouter } from "./routers/meetings";
import { nextActionsRouter } from "./routers/nextActions";
import { snapshotsRouter } from "./routers/snapshots";
import { stakeholdersRouter } from "./routers/stakeholders";
import { teamRouter } from "./routers/team";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(100) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(users).set({ name: input.name }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
  }),
  deals: dealsRouter,
  stakeholders: stakeholdersRouter,
  meetings: meetingsRouter,
  snapshots: snapshotsRouter,
  nextActions: nextActionsRouter,
  knowledge: knowledgeRouter,
  ai: aiRouter,
  team: teamRouter,
});

export type AppRouter = typeof appRouter;
