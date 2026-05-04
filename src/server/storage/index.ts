/**
 * Unified raw-file storage:
 * - Production (Vercel): set `BLOB_READ_WRITE_TOKEN` for private Vercel Blob storage.
 * - Local dev: omit token to use filesystem storage under `STORAGE_ROOT` / `./uploads`.
 */
import path from "node:path";
import { randomUUID } from "node:crypto";
import { del, get, put } from "@vercel/blob";
import * as local from "./local";

const BLOB_KEY_PREFIX = "blob1:";

export function blobStorageEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function blobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  return token;
}

/** Returns the DB value for `Document.rawStorageKey`. */
export async function saveRawUpload(
  userId: string,
  buffer: Buffer,
  originalFilename: string,
): Promise<string> {
  if (process.env.VERCEL === "1" && !blobStorageEnabled()) {
    throw new Error("Vercel deployment requires Blob storage. Connect Vercel Blob or set BLOB_READ_WRITE_TOKEN.");
  }

  if (blobStorageEnabled()) {
    const ext = path.extname(originalFilename) || ".bin";
    const pathname = `keeper/raw/${userId}/${randomUUID()}${ext}`;
    const result = await put(pathname, buffer, {
      access: "private",
      token: blobToken(),
      addRandomSuffix: false,
      multipart: buffer.length > 4 * 1024 * 1024,
    });
    return `${BLOB_KEY_PREFIX}${result.url}`;
  }

  return local.saveRawUpload(userId, buffer, originalFilename);
}

export async function readRawFile(storageKey: string): Promise<Buffer> {
  if (storageKey.startsWith(BLOB_KEY_PREFIX)) {
    const url = storageKey.slice(BLOB_KEY_PREFIX.length);
    const res = await get(url, { access: "private", token: blobToken(), useCache: false });
    if (!res || res.statusCode !== 200 || !res.stream) {
      throw new Error("Blob get failed or empty body");
    }
    return Buffer.from(await new Response(res.stream).arrayBuffer());
  }

  return local.readRawFile(storageKey);
}

export async function deleteRawFile(storageKey: string): Promise<void> {
  if (storageKey.startsWith(BLOB_KEY_PREFIX)) {
    const url = storageKey.slice(BLOB_KEY_PREFIX.length);
    await del(url, { token: blobToken() });
    return;
  }

  return local.deleteRawFile(storageKey);
}

export { getStorageRoot } from "./local";
