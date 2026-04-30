import path from "node:path";

/** Removes characters unsafe for Drive / Windows / Unix filenames. */
export function sanitizePathSegment(segment: string): string {
  const trimmed = segment.trim().replace(/[/\\?%*:|"<>]/g, "_");
  const collapsed = trimmed.replace(/\s+/g, "_").replace(/_+/g, "_");
  return collapsed.slice(0, 120) || "unnamed";
}

export function extensionFromFilename(name: string): string {
  const ext = path.extname(name).slice(1).toLowerCase();
  if (ext && /^[a-z0-9]{1,8}$/.test(ext)) return ext;
  return "bin";
}

export function buildDriveFilename(
  originalFilename: string,
  fields: {
    due_date: string | null;
    issue_date: string | null;
    document_type: string;
    entity: string | null;
    amount_due: number | null;
  },
): string {
  const ext = extensionFromFilename(originalFilename);
  const date = fields.due_date ?? fields.issue_date ?? "unknown";
  const type = sanitizePathSegment(fields.document_type);
  const entity = sanitizePathSegment(fields.entity ?? "unknown");
  const amount =
    fields.amount_due != null ? `_${String(fields.amount_due).replace(/\./g, "p")}` : "";
  return `${date}_${type}_${entity}${amount}.${ext}`;
}
