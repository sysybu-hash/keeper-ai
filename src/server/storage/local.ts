import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export function getStorageRoot(): string {
  const root = process.env.STORAGE_ROOT ?? "./uploads";
  return path.isAbsolute(root) ? root : path.join(process.cwd(), root);
}

export async function ensureStorageRoot(): Promise<string> {
  const root = getStorageRoot();
  await fs.mkdir(root, { recursive: true });
  return root;
}

/** Returns relative key stored in DB (e.g. raw/2025/uuid.pdf). */
export async function saveRawUpload(
  userId: string,
  buffer: Buffer,
  originalFilename: string,
): Promise<string> {
  const root = await ensureStorageRoot();
  const ext = path.extname(originalFilename) || ".bin";
  const key = path.join("raw", userId, `${randomUUID()}${ext}`);
  const full = path.join(root, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer);
  return key.replace(/\\/g, "/");
}

export async function readRawFile(storageKey: string): Promise<Buffer> {
  const full = path.join(getStorageRoot(), storageKey);
  return fs.readFile(full);
}

export async function deleteRawFile(storageKey: string): Promise<void> {
  const full = path.join(getStorageRoot(), storageKey);
  await fs.rm(full, { force: true });
}
