import OpenAI, { toFile } from "openai";

import { env } from "../config/env.js";
import { badRequest } from "../utils/httpError.js";
import { MANAGER_ASSISTANT_SYSTEM_PROMPT } from "./systemPrompt.js";

type UploadDocumentInput = {
  buffer: Buffer;
  originalName: string;
  mimeType?: string;
  projectId?: string;
  documentType?: string;
  notes?: string;
};

type UploadedDocument = {
  openaiFileId: string;
  vectorStoreFileId: string;
  vectorStoreId: string;
};

const getVectorStoreId = () => env.OPENAI_VECTOR_STORE_ID;

const createOpenAIClient = () => {
  if (!env.OPENAI_API_KEY) {
    throw badRequest("OPENAI_API_KEY is required for document search.");
  }

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
};

const cleanForTelegram = (text: string) => {
  const cleaned = text.trim();

  if (!cleaned) {
    return "I could not find an answer in the document knowledge base.";
  }

  return cleaned.length > 3800 ? `${cleaned.slice(0, 3797)}...` : cleaned;
};

export const askDocuments = async (question: string): Promise<string> => {
  const vectorStoreId = getVectorStoreId();

  if (!vectorStoreId) {
    return "No document knowledge base is configured yet.";
  }

  const openai = createOpenAIClient();
  const response = await openai.responses.create({
    model: env.OPENAI_MODEL,
    instructions: MANAGER_ASSISTANT_SYSTEM_PROMPT,
    input: question,
    tools: [
      {
        type: "file_search",
        vector_store_ids: [vectorStoreId],
      },
    ],
  });

  return cleanForTelegram(response.output_text);
};

export const uploadDocumentToVectorStore = async ({
  buffer,
  originalName,
  mimeType,
  projectId,
  documentType,
  notes,
}: UploadDocumentInput): Promise<UploadedDocument> => {
  const vectorStoreId = getVectorStoreId();

  if (!vectorStoreId) {
    throw badRequest("OPENAI_VECTOR_STORE_ID is required for document uploads.");
  }

  const openai = createOpenAIClient();
  const uploadable = await toFile(buffer, originalName, {
    type: mimeType,
  });
  const uploadedFile = await openai.files.create({
    file: uploadable,
    purpose: "assistants",
  });
  const vectorStoreFile = await openai.vectorStores.files.createAndPoll(
    vectorStoreId,
    {
      file_id: uploadedFile.id,
      attributes: {
        originalName,
        ...(projectId ? { projectId } : {}),
        ...(documentType ? { documentType } : {}),
        ...(notes ? { notes: notes.slice(0, 512) } : {}),
      },
    },
  );

  if (vectorStoreFile.status !== "completed") {
    throw new Error(
      `OpenAI vector store file processing did not complete: ${vectorStoreFile.status}`,
    );
  }

  return {
    openaiFileId: uploadedFile.id,
    vectorStoreFileId: vectorStoreFile.id,
    vectorStoreId,
  };
};
