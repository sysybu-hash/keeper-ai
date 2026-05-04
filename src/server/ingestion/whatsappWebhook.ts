import type { IngestionPayload } from "@/server/ingestion/types";

export function buildWhatsAppIngestion(params: {
  userId: string;
  originalFilename: string;
  mimeType: string;
  bytes: Buffer;
  mediaId?: string;
}): IngestionPayload {
  return {
    userId: params.userId,
    source: "whatsapp",
    originalFilename: params.originalFilename,
    mimeType: params.mimeType,
    bytes: params.bytes,
    externalRef: params.mediaId,
  };
}
