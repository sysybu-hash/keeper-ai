import type { IngestionPayload } from "./types";

export function buildWebIngestion(
  userId: string,
  originalFilename: string,
  mimeType: string,
  bytes: Buffer,
): IngestionPayload {
  return {
    userId,
    source: "web",
    originalFilename,
    mimeType,
    bytes,
  };
}
