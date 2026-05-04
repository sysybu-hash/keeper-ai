import { prisma } from "@/lib/prisma";
import type { IngestionPayload } from "@/server/ingestion/types";
import { processJob } from "@/server/pipeline/processJob";
import { saveRawUpload } from "@/server/storage";

export async function enqueueIngestion(payload: IngestionPayload) {
  const rawStorageKey = await saveRawUpload(payload.userId, payload.bytes, payload.originalFilename);

  const document = await prisma.document.create({
    data: {
      userId: payload.userId,
      source: payload.source,
      originalFilename: payload.originalFilename,
      mimeType: payload.mimeType,
      status: "queued",
      rawStorageKey,
    },
  });

  const job = await prisma.processingJob.create({
    data: {
      documentId: document.id,
      type: "extract_and_sync",
      status: "pending",
    },
  });

  if (payload.externalRef) {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: "document_ingested",
        metadata: {
          documentId: document.id,
          jobId: job.id,
          source: payload.source,
          externalRef: payload.externalRef,
        },
      },
    });
  }

  void processJob(job.id).catch((err) => {
    console.error("processJob failed", job.id, err);
  });

  return { document, job };
}
