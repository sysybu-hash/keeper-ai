import { NextResponse } from "next/server";
import { enqueueIngestion } from "@/server/ingestion/enqueue";
import { buildWhatsAppIngestion } from "@/server/ingestion/whatsappWebhook";

export const maxDuration = 120;

type WhatsAppPayload = {
  userId?: string;
  mediaBase64?: string;
  mimeType?: string;
  filename?: string;
  mediaId?: string;
};

function authorize(req: Request) {
  const secret = process.env.INBOUND_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  return req.headers.get("x-keeper-webhook-secret") === secret;
}

export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as WhatsAppPayload;
  if (!body.userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  if (!body.mediaBase64) {
    return NextResponse.json({ error: "Missing mediaBase64" }, { status: 400 });
  }

  const bytes = Buffer.from(body.mediaBase64, "base64");
  if (bytes.length === 0) {
    return NextResponse.json({ error: "Empty media" }, { status: 400 });
  }

  const payload = buildWhatsAppIngestion({
    userId: body.userId,
    originalFilename: body.filename || `whatsapp-${body.mediaId || Date.now()}.bin`,
    mimeType: body.mimeType || "application/octet-stream",
    bytes,
    mediaId: body.mediaId,
  });

  const { document, job } = await enqueueIngestion(payload);

  return NextResponse.json({
    ok: true,
    documentId: document.id,
    jobId: job.id,
  });
}
