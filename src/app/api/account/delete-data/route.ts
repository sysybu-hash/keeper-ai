import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteRawFile } from "@/server/storage";
import { deleteDriveFile } from "@/server/integrations/drive";
import { deleteCalendarEvent } from "@/server/integrations/calendar";
import { getGoogleOAuth2ForUser } from "@/server/integrations/googleOAuth";
import type { OAuth2Client } from "google-auth-library";

export const maxDuration = 60;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }

  const userId = session.user.id;

  const docs = await prisma.document.findMany({
    where: { userId },
    select: { rawStorageKey: true, driveFileId: true, calendarEventId: true },
  });

  let oauth2: OAuth2Client | null = null;
  try {
    oauth2 = await getGoogleOAuth2ForUser(userId);
  } catch {
    /* Google not linked — skip Drive/Calendar cleanup */
  }

  for (const d of docs) {
    if (d.rawStorageKey) {
      try {
        await deleteRawFile(d.rawStorageKey);
      } catch {
        /* ignore */
      }
    }
    if (oauth2 && d.driveFileId) {
      try {
        await deleteDriveFile(oauth2, d.driveFileId);
      } catch {
        /* ignore */
      }
    }
    if (oauth2 && d.calendarEventId) {
      try {
        await deleteCalendarEvent(oauth2, d.calendarEventId);
      } catch {
        /* ignore */
      }
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
