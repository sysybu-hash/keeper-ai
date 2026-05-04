import { NextResponse } from "next/server";
import { buildEmailIngestion } from "@/server/ingestion/emailWebhook";
import { enqueueIngestion } from "@/server/ingestion/enqueue";

export const maxDuration = 120;

function authorize(req: Request) {
  const secret = process.env.INBOUND_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  return req.headers.get("x-keeper-webhook-secret") === secret;
}

export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const userId = String(form.get("userId") || "");
  const file = form.get("file");
  const messageId = form.get("messageId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  const payload = buildEmailIngestion({
    userId,
    originalFilename: file.name || "email-attachment.bin",
    mimeType: file.type || "application/octet-stream",
    bytes,
    messageId: typeof messageId === "string" ? messageId : undefined,
  });

  const { document, job } = await enqueueIngestion(payload);

  return NextResponse.json({
    ok: true,
    documentId: document.id,
    jobId: job.id,
  });
}
