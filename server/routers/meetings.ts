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
import { transcribeAudio } from "../_core/voiceTranscription";
import { storagePut } from "../storage";

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

  // Voice capture: upload audio, transcribe, create meeting, return transcript
  transcribeAndCreate: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      audioBase64: z.string(), // base64-encoded audio blob
      mimeType: z.string().default('audio/webm'),
      keyParticipant: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      // 1. Upload audio to S3
      const audioBuffer = Buffer.from(input.audioBase64, 'base64');
      const fileKey = `voice-notes/${tenant.id}/${Date.now()}.webm`;
      const { url: audioUrl } = await storagePut(fileKey, audioBuffer, input.mimeType);

      // 2. Transcribe with Whisper
      let transcriptText = '';
      try {
        const result = await transcribeAudio({ audioUrl });
        transcriptText = ('text' in result ? result.text : null) ?? '';
      } catch (err) {
        console.warn('[transcribeAndCreate] Transcription failed, using placeholder:', err);
        transcriptText = `Voice note recorded on ${new Date().toLocaleString()}`;
      }

      // 3. Create meeting with transcript as summary
      const id = await createMeeting({
        dealId: input.dealId,
        tenantId: tenant.id,
        date: new Date(),
        type: 'Follow-up',
        keyParticipant: input.keyParticipant,
        summary: transcriptText,
        duration: 0,
        transcriptUrl: audioUrl,
      });

      const all = await getMeetings(input.dealId, tenant.id);
      const meeting = all.find(m => m.id === id)!;
      return { meeting, transcriptText };
    }),
});
