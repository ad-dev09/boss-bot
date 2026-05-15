import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  fileType: z.string().trim().nullable().optional(),
  url: z.string().trim().url().nullable().optional(),
  openaiFileId: z.string().trim().nullable().optional(),
  vectorStoreFileId: z.string().trim().nullable().optional(),
  projectId: z.string().uuid(),
});

export const updateDocumentSchema = createDocumentSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
