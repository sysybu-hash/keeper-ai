import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }

  const docs = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      originalFilename: true,
      mimeType: true,
      status: true,
      source: true,
      driveWebViewLink: true,
      calendarEventId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ documents: docs });
}
