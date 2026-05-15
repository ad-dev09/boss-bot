import { Router } from "express";

import { documentService } from "../modules/documents/document.service.ts";
import {
  createDocumentSchema,
  updateDocumentSchema,
} from "../modules/documents/document.validation.ts";
import { idParamSchema } from "../modules/shared/validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";

export const documentsRouter = Router();

documentsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const documents = await documentService.list();
    res.json({ data: documents });
  }),
);

documentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createDocumentSchema.parse(req.body);
    const document = await documentService.create(data);
    res.status(201).json({ message: "Document created.", data: document });
  }),
);

documentsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateDocumentSchema.parse(req.body);
    const document = await documentService.update(id, data);
    res.json({ message: "Document updated.", data: document });
  }),
);

documentsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await documentService.remove(id);
    res.json({ message: "Document deleted." });
  }),
);
