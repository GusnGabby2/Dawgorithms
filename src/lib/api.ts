const rawBase = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
const base = rawBase ? rawBase.replace(/\/$/, "") : "";

export function apiUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}/api${normalized}`;
}
