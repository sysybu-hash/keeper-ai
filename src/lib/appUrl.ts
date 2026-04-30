/** Base public URL of the app (no trailing slash). Used for OAuth redirect URIs. */
export function appBaseUrl(): string {
  const raw = process.env.AUTH_URL?.trim() ?? "";
  return raw.replace(/\/+$/, "");
}
