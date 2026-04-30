import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { Readable } from "node:stream";
import { sanitizePathSegment } from "@/lib/filename";
import { readRawFile } from "@/server/storage";
function parseFolderSegments(suggestedFolder: string): string[] {
  const trimmed = suggestedFolder.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!trimmed) return ["KeeperAI"];
  return trimmed.split("/").map((s) => sanitizePathSegment(s));
}

async function findChildFolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  name: string,
): Promise<string | null> {
  const q = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const res = await drive.files.list({
    q,
    fields: "files(id,name)",
    pageSize: 200,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const match = res.data.files?.find((f) => f.name === name);
  return match?.id ?? null;
}

async function createFolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  name: string,
): Promise<string> {
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
    supportsAllDrives: true,
  });
  const id = created.data.id;
  if (!id) throw new Error("Drive folder create returned no id");
  return id;
}

/** Ensures nested path under My Drive root; returns leaf folder id. */
export async function ensureDriveFolderPath(auth: OAuth2Client, suggestedFolder: string): Promise<{
  folderId: string;
  mkdirActions: { segment: string; folderId: string }[];
}> {
  const drive = google.drive({ version: "v3", auth });
  const segments = parseFolderSegments(suggestedFolder);
  let parentId = "root";
  const mkdirActions: { segment: string; folderId: string }[] = [];

  for (const segment of segments) {
    let id = await findChildFolder(drive, parentId, segment);
    if (!id) {
      id = await createFolder(drive, parentId, segment);
      mkdirActions.push({ segment, folderId: id });
    }
    parentId = id;
  }

  return { folderId: parentId, mkdirActions };
}

export async function uploadFileToDrive(params: {
  auth: OAuth2Client;
  parentFolderId: string;
  fileName: string;
  mimeType: string;
  rawStorageKey: string;
}): Promise<{ fileId: string; webViewLink: string | null }> {
  const drive = google.drive({ version: "v3", auth: params.auth });
  const fileBuffer = await readRawFile(params.rawStorageKey);
  const media = {
    mimeType: params.mimeType,
    body: Readable.from(fileBuffer),
  };

  const created = await drive.files.create({
    requestBody: {
      name: params.fileName,
      parents: [params.parentFolderId],
    },
    media,
    fields: "id, webViewLink, webContentLink",
    supportsAllDrives: true,
  });

  const fileId = created.data.id;
  if (!fileId) throw new Error("Drive upload returned no file id");

  let webViewLink = created.data.webViewLink ?? null;
  if (!webViewLink) {
    const meta = await drive.files.get({
      fileId,
      fields: "webViewLink",
      supportsAllDrives: true,
    });
    webViewLink = meta.data.webViewLink ?? null;
  }

  return { fileId, webViewLink };
}
