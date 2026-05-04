import { buildDriveFilename } from "@/lib/filename";
import { prisma } from "@/lib/prisma";
import { extractionSchema, shouldMarkNeedsReview } from "@/lib/validation/extractionSchema";
import { extractStructuredFromDocument } from "@/server/ai/geminiExtract";
import { createDueDateEvent } from "@/server/integrations/calendar";
import { ensureDriveFolderPath, uploadFileToDrive } from "@/server/integrations/drive";
import { getGoogleOAuth2ForUser } from "@/server/integrations/googleOAuth";
import { notifyUrgentDocument } from "@/server/notifications/notify";
import { readRawFile } from "@/server/storage";

export async function processJob(jobId: string): Promise<void> {
  const job = await prisma.processingJob.findUnique({
    where: { id: jobId },
    include: { document: true },
  });
  if (!job || job.status !== "pending") return;

  const claimed = await prisma.processingJob.updateMany({
    where: { id: jobId, status: "pending" },
    data: { status: "running", lockedAt: new Date(), attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return;

  const doc = await prisma.document.findUnique({ where: { id: job.documentId } });
  if (!doc || !doc.rawStorageKey) {
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: "failed", lastError: "Missing document or raw file" },
    });
    if (doc) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: "failed" },
      });
    }
    return;
  }

  try {
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "processing" },
    });

    const bytes = await readRawFile(doc.rawStorageKey);
    const { data, rawText, model } = await extractStructuredFromDocument({
      mimeType: doc.mimeType,
      bytes,
    });

    const normalized = extractionSchema.parse(data);
    const needsReview = shouldMarkNeedsReview(normalized);

    await prisma.extraction.create({
      data: {
        documentId: doc.id,
        model,
        rawModelOutput: rawText.slice(0, 50000),
        normalizedJson: normalized as object,
        fieldConfidence: normalized.confidence as object,
      },
    });

    const auth = await getGoogleOAuth2ForUser(doc.userId);
    const { folderId, mkdirActions } = await ensureDriveFolderPath(auth, normalized.suggested_folder);

    for (const action of mkdirActions) {
      await prisma.externalAction.create({
        data: {
          documentId: doc.id,
          kind: "drive_mkdir",
          externalId: action.folderId,
          metadata: { segment: action.segment },
        },
      });
    }

    const driveName = buildDriveFilename(doc.originalFilename, {
      due_date: normalized.due_date,
      issue_date: normalized.issue_date,
      document_type: normalized.document_type,
      entity: normalized.entity,
      amount_due: normalized.amount_due,
    });

    const uploaded = await uploadFileToDrive({
      auth,
      parentFolderId: folderId,
      fileName: driveName,
      mimeType: doc.mimeType,
      rawStorageKey: doc.rawStorageKey,
    });

    await prisma.externalAction.create({
      data: {
        documentId: doc.id,
        kind: "drive_upload",
        externalId: uploaded.fileId,
        metadata: { webViewLink: uploaded.webViewLink, fileName: driveName },
      },
    });

    let calendarEventId: string | null = null;
    if (normalized.due_date) {
      const title = `תשלום: ${normalized.document_type}${normalized.entity ? ` - ${normalized.entity}` : ""}`;
      const description = [normalized.summary, "", uploaded.webViewLink ? `קישור למסמך ב-Drive: ${uploaded.webViewLink}` : ""]
        .filter(Boolean)
        .join("\n");

      const calendar = await createDueDateEvent({
        auth,
        title,
        description,
        dueDateYmd: normalized.due_date,
      });
      calendarEventId = calendar.eventId;

      await prisma.externalAction.create({
        data: {
          documentId: doc.id,
          kind: "calendar_event",
          externalId: calendar.eventId,
          metadata: { htmlLink: calendar.htmlLink },
        },
      });

      if (normalized.is_urgent) {
        await notifyUrgentDocument(doc.userId, normalized.document_type, normalized.due_date);
      }
    }

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: needsReview ? "needs_review" : "completed",
        driveFileId: uploaded.fileId,
        driveWebViewLink: uploaded.webViewLink,
        calendarEventId,
      },
    });

    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: "completed", lastError: null },
    });

    await prisma.auditLog.create({
      data: {
        userId: doc.userId,
        action: "document_processed",
        metadata: { documentId: doc.id, jobId, needsReview },
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await failJob(jobId, doc.id, message);
  }
}

async function failJob(jobId: string, documentId: string, message: string) {
  await prisma.processingJob.update({
    where: { id: jobId },
    data: { status: "failed", lastError: message.slice(0, 8000) },
  });
  await prisma.document.update({
    where: { id: documentId },
    data: { status: "failed" },
  });
}
