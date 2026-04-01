import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import {
  createKbDocument,
  deleteKbDocument,
  getKbDocuments,
  getKbDocumentById,
  getOrCreateDefaultTenant,
  updateKbDocument,
} from "../db";

// ─── File Upload & AI Parsing ────────────────────────────────────────────────

const MIME_TO_FILE_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xlsx",
  "text/plain": "txt",
  "text/markdown": "md",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function extractContentWithAI(fileUrl: string, mimeType: string, fileName: string): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a document extraction assistant. Extract ALL text content from the provided document. Preserve the structure (headings, lists, tables) as much as possible using markdown formatting. Output ONLY the extracted content, no commentary.",
          },
          {
            role: "user",
            content: [
              {
                type: "file_url",
                file_url: {
                  url: fileUrl,
                  mime_type: "application/pdf",
                },
              },
              {
                type: "text",
                text: `Extract all text content from this PDF document "${fileName}". Preserve structure with markdown formatting.`,
              },
            ],
          },
        ],
      });
      return result.choices[0]?.message?.content as string ?? "";
    }

    // For text-based files, fetch and return directly
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const textContent = new TextDecoder("utf-8", { fatal: false }).decode(buffer);

    if (mimeType === "text/plain" || mimeType === "text/markdown") {
      return textContent;
    }

    // For docx/xlsx, use LLM to interpret
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a document extraction assistant. The user will provide raw file content. Extract and organize the meaningful text content using markdown formatting. For spreadsheets, format data as markdown tables. Output ONLY the extracted content, no commentary.",
        },
        {
          role: "user",
          content: `Extract the meaningful text content from this ${mimeType} file named "${fileName}". Here is the raw content:\n\n${textContent.substring(0, 50000)}`,
        },
      ],
    });
    return result.choices[0]?.message?.content as string ?? "";
  } catch (error) {
    console.error("[KB] AI extraction failed:", error);
    throw new Error(`Failed to extract content from ${fileName}: ${(error as Error).message}`);
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const knowledgeRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
    return getKbDocuments(tenant.id);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return getKbDocumentById(input.id, tenant.id);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      category: z.enum(["product", "playbook", "icp"]).default("product"),
      description: z.string().optional(),
      fileType: z.enum(["pdf", "doc", "md", "txt", "xlsx", "docx"]).default("md"),
      content: z.string().optional(),
      fileUrl: z.string().optional(),
      fileSize: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const id = await createKbDocument({ ...input, tenantId: tenant.id, uploadedBy: ctx.user.id });
      const all = await getKbDocuments(tenant.id);
      return all.find(d => d.id === id)!;
    }),

  upload: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      category: z.enum(["product", "playbook", "icp"]).default("product"),
      description: z.string().optional(),
      fileName: z.string(),
      mimeType: z.string(),
      fileData: z.string(), // base64 encoded
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const fileBuffer = Buffer.from(input.fileData, "base64");
      const fileSize = formatFileSize(fileBuffer.length);
      const fileType = (MIME_TO_FILE_TYPE[input.mimeType] ?? "txt") as "pdf" | "doc" | "md" | "txt" | "xlsx" | "docx";
      const suffix = Math.random().toString(36).slice(2, 10);
      const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const s3Key = `kb/${tenant.id}/${Date.now()}-${suffix}-${safeFileName}`;
      const { url: fileUrl } = await storagePut(s3Key, fileBuffer, input.mimeType);

      const docId = await createKbDocument({
        tenantId: tenant.id,
        uploadedBy: ctx.user.id,
        name: input.name,
        category: input.category,
        description: input.description ?? null,
        fileType,
        fileUrl,
        fileSize,
        originalFileName: input.fileName,
        mimeType: input.mimeType,
        processingStatus: "processing",
      });

      // Background AI extraction
      extractContentWithAI(fileUrl, input.mimeType, input.fileName)
        .then(async (extractedContent) => {
          await updateKbDocument(docId, tenant.id, {
            extractedContent,
            processingStatus: "completed",
          });
        })
        .catch(async (error) => {
          console.error("[KB] Extraction failed for doc", docId, error);
          await updateKbDocument(docId, tenant.id, {
            processingStatus: "failed",
            extractedContent: `提取失败: ${(error as Error).message}`,
          });
        });

      const all = await getKbDocuments(tenant.id);
      return all.find(d => d.id === docId)!;
    }),

  retryExtraction: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const doc = await getKbDocumentById(input.id, tenant.id);
      if (!doc) throw new Error("Document not found");
      if (!doc.fileUrl) throw new Error("No file URL to extract from");
      await updateKbDocument(input.id, tenant.id, { processingStatus: "processing" });
      try {
        const extractedContent = await extractContentWithAI(
          doc.fileUrl,
          doc.mimeType ?? "application/octet-stream",
          doc.originalFileName ?? doc.name
        );
        await updateKbDocument(input.id, tenant.id, {
          extractedContent,
          processingStatus: "completed",
        });
        return { success: true, extractedContent };
      } catch (error) {
        await updateKbDocument(input.id, tenant.id, {
          processingStatus: "failed",
          extractedContent: `提取失败: ${(error as Error).message}`,
        });
        throw error;
      }
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      content: z.string().optional(),
      extractedContent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const { id, ...data } = input;
      await updateKbDocument(id, tenant.id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await deleteKbDocument(input.id, tenant.id);
      return { success: true };
    }),
});
