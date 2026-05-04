import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export async function createDueDateEvent(params: {
  auth: OAuth2Client;
  title: string;
  description: string;
  dueDateYmd: string;
}): Promise<{ eventId: string; htmlLink: string | null }> {
  const calendar = google.calendar({ version: "v3", auth: params.auth });
  const endExclusive = addDaysYmd(params.dueDateYmd, 1);

  const inserted = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: params.title,
      description: params.description,
      start: { date: params.dueDateYmd },
      end: { date: endExclusive },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 3 * 24 * 60 },
          { method: "popup", minutes: 1 * 24 * 60 },
        ],
      },
    },
  });

  const eventId = inserted.data.id;
  if (!eventId) throw new Error("Calendar insert returned no event id");
  return { eventId, htmlLink: inserted.data.htmlLink ?? null };
}

export async function deleteCalendarEvent(auth: OAuth2Client, eventId: string): Promise<void> {
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: "primary", eventId });
}
