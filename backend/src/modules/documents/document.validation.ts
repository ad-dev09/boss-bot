import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  originalName: z.string().trim().nullable().optional(),
  fileType: z.string().trim().nullable().optional(),
  url: z.string().trim().url().nullable().optional(),
  openaiFileId: z.string().trim().nullable().optional(),
  vectorStoreFileId: z.string().trim().nullable().optional(),
  vectorStoreId: z.string().trim().nullable().optional(),
  documentType: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export const updateDocumentSchema = createDocumentSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export const uploadDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  projectId: z
    .string()
    .trim()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  documentType: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
