import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createMeeting,
  deleteMeeting,
  getAllMeetingsForTenant,
  getMeetings,
  getOrCreateDefaultTenant,
  updateMeeting,
} from "../db";
import type { InsertMeeting } from "../../drizzle/schema";

const MEETING_TYPES = [
  "Discovery Call", "Demo", "Technical Review", "POC Check-in",
  "Negotiation", "Executive Briefing", "Follow-up",
] as const;

export const meetingsRouter = router({
  listByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return getMeetings(input.dealId, tenant.id);
    }),

  listAll: protectedProcedure.query(async ({ ctx }) => {
    const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
    return getAllMeetingsForTenant(tenant.id);
  }),

  create: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      date: z.string().or(z.date()).transform(d => new Date(d)),
      type: z.string().default("Follow-up"),
      keyParticipant: z.string().optional(),
      summary: z.string().optional(),
      duration: z.number().default(30),
      transcriptUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const meetingType = (MEETING_TYPES.includes(input.type as any) ? input.type : "Follow-up") as InsertMeeting["type"];
      const id = await createMeeting({
        dealId: input.dealId,
        tenantId: tenant.id,
        date: input.date,
        type: meetingType,
        keyParticipant: input.keyParticipant,
        summary: input.summary,
        duration: input.duration,
        transcriptUrl: input.transcriptUrl,
      });
      const all = await getMeetings(input.dealId, tenant.id);
      return all.find(m => m.id === id)!;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      date: z.string().or(z.date()).transform(d => new Date(d)).optional(),
      type: z.string().optional(),
      summary: z.string().optional(),
      transcriptUrl: z.string().optional(),
      keyParticipant: z.string().optional(),
      duration: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const { id, type, ...rest } = input;
      const meetingType = type
        ? ((MEETING_TYPES.includes(type as any) ? type : "Follow-up") as InsertMeeting["type"])
        : undefined;
      await updateMeeting(id, tenant.id, { ...rest, ...(meetingType ? { type: meetingType } : {}) });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await deleteMeeting(input.id, tenant.id);
      return { success: true };
    }),
});
