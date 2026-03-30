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
        fullName: z.string().min(1).optional(),
        companyName: z.string().min(1).optional(),
        phone: z.string().min(1).optional(),
        wechat: z.string().min(1).optional(),
        source: z.string().optional().default("landing_page"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        // Still return success even if DB is down - don't block the user
        return { success: true, message: "submitted" };
      }

      const email = input.email.toLowerCase().trim();

      // Check if email already submitted
      const existing = await db
        .select()
        .from(accessRequests)
        .where(eq(accessRequests.email, email))
        .limit(1);

      if (existing.length > 0) {
        return { success: true, message: "already_submitted" };
      }

      // Insert new access request
      await db.insert(accessRequests).values({
        email,
        fullName: input.fullName?.trim() || null,
        companyName: input.companyName?.trim() || null,
        phone: input.phone?.trim() || null,
        wechat: input.wechat?.trim() || null,
        source: input.source,
      });

      // Notify owner
      const details = [
        `Email: ${email}`,
        input.fullName ? `Name: ${input.fullName.trim()}` : null,
        input.companyName ? `Company: ${input.companyName.trim()}` : null,
        input.phone ? `Phone: ${input.phone.trim()}` : null,
        input.wechat ? `WeChat: ${input.wechat.trim()}` : null,
        `Source: ${input.source}`,
        `Time: ${new Date().toISOString()}`,
      ]
        .filter(Boolean)
        .join("\n");

      await notifyOwner({
        title: "🚀 New Waitlist Signup",
        content: `New early access request!\n\n${details}`,
      });

      return { success: true, message: "submitted" };
    }),
});
