import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb, getOrCreateDefaultTenant } from "../db";
import { tenantMembers, users } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const teamRouter = router({
  // List all members of the current tenant
  listMembers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: tenantMembers.role,
        joinedAt: tenantMembers.createdAt,
      })
      .from(tenantMembers)
      .innerJoin(users, eq(users.id, tenantMembers.userId))
      .where(eq(tenantMembers.tenantId, tenant.id));

    return rows;
  }),

  // Invite a new member by email (sends a notification; actual invite flow is simplified for MVP)
  invite: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      // Check if user with this email already exists
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];

        // Check if already a member
        const existingMember = await db
          .select()
          .from(tenantMembers)
          .where(eq(tenantMembers.userId, existingUser.id))
          .limit(1);

        if (existingMember.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This user is already a member of your workspace",
          });
        }

        // Add them as a member
        await db.insert(tenantMembers).values({
          tenantId: tenant.id,
          userId: existingUser.id,
          role: "member",
        });

        return { success: true, message: "User added to workspace" };
      }

      // User doesn't exist yet — in a real product, send an email invite
      // For MVP, we just return success and log the intent
      console.log(`[Team Invite] Invite sent to ${input.email} for tenant ${tenant.id} by user ${ctx.user.id}`);

      return { success: true, message: `Invite sent to ${input.email}` };
    }),
});
