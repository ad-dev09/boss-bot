import { Router } from "express";
import multer from "multer";

import { uploadDocumentToVectorStore } from "../ai/fileSearchService.js";
import { documentService } from "../modules/documents/document.service.js";
import {
  createDocumentSchema,
  uploadDocumentSchema,
  updateDocumentSchema,
} from "../modules/documents/document.validation.js";
import { idParamSchema } from "../modules/shared/validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest } from "../utils/httpError.js";

export const documentsRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

documentsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const documents = await documentService.list();
    res.json({ data: documents });
  }),
);

documentsRouter.post(
  "/upload",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw badRequest("A file is required.");
    }

    const uploadData = uploadDocumentSchema.parse(req.body);
    const openaiDocument = await uploadDocumentToVectorStore({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      projectId: uploadData.projectId,
      documentType: uploadData.documentType,
      notes: uploadData.notes,
    });
    const document = await documentService.create({
      title: req.file.originalname,
      fileName: req.file.originalname,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      openaiFileId: openaiDocument.openaiFileId,
      vectorStoreFileId: openaiDocument.vectorStoreFileId,
      vectorStoreId: openaiDocument.vectorStoreId,
      documentType: uploadData.documentType,
      notes: uploadData.notes,
      projectId: uploadData.projectId,
    });

    res.status(201).json({
      message: "Document uploaded.",
      data: document,
    });
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
