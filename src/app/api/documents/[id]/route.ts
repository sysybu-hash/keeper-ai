import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { extractionSchema } from "@/lib/validation/extractionSchema";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    include: {
      extractions: { orderBy: { createdAt: "desc" }, take: 1 },
      jobs: { orderBy: { createdAt: "desc" }, take: 5 },
      externalActions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  return NextResponse.json({ document: doc });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    include: { extractions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!doc) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  const body = (await req.json()) as { normalizedJson?: unknown };
  if (!body.normalizedJson) {
    return NextResponse.json({ error: "חסר normalizedJson" }, { status: 400 });
  }

  const parsed = extractionSchema.parse(body.normalizedJson);
  const latest = doc.extractions[0];
  if (!latest) {
    return NextResponse.json({ error: "אין חילוץ לעדכון" }, { status: 400 });
  }

  await prisma.extraction.update({
    where: { id: latest.id },
    data: {
      normalizedJson: parsed as object,
      fieldConfidence: parsed.confidence as object,
    },
  });

  await prisma.document.update({
    where: { id: doc.id },
    data: { status: "completed" },
  });

  return NextResponse.json({ ok: true });
}
