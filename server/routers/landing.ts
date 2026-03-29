import { z } from "zod";
import { publicProcedure } from "../_core/trpc";
import { router } from "../_core/trpc";
import { getDb } from "../db";
import { accessRequests } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

export const landingRouter = router({
  requestAccess: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        source: z.string().optional().default("landing_page"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        // Still return success even if DB is down - don't block the user
        return { success: true, message: "submitted" };
      }

      // Check if email already submitted
      const existing = await db
        .select()
        .from(accessRequests)
        .where(eq(accessRequests.email, input.email.toLowerCase().trim()))
        .limit(1);

      if (existing.length > 0) {
        return { success: true, message: "already_submitted" };
      }

      // Insert new access request
      await db.insert(accessRequests).values({
        email: input.email.toLowerCase().trim(),
        source: input.source,
      });

      // Notify owner
      await notifyOwner({
        title: "🚀 New Access Request",
        content: `New early access request from: ${input.email}\n\nSource: ${input.source}\nTime: ${new Date().toISOString()}`,
      });

      return { success: true, message: "submitted" };
    }),
});
