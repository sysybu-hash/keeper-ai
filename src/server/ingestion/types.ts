import type { DocumentSource } from "@prisma/client";

/** Shared payload after any ingestion normalizes to this shape. */
export type IngestionPayload = {
  userId: string;
  source: DocumentSource;
  originalFilename: string;
  mimeType: string;
  bytes: Buffer;
  /** Optional email message id, WhatsApp media id, etc. */
  externalRef?: string;
};
