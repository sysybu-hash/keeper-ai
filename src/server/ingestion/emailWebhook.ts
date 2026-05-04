import type { IngestionPayload } from "@/server/ingestion/types";

export function buildEmailIngestion(params: {
  userId: string;
  originalFilename: string;
  mimeType: string;
  bytes: Buffer;
  messageId?: string;
}): IngestionPayload {
  return {
    userId: params.userId,
    source: "email",
    originalFilename: params.originalFilename,
    mimeType: params.mimeType,
    bytes: params.bytes,
    externalRef: params.messageId,
  };
}
