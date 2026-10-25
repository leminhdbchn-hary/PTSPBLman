/** Chỉ cho phép chuyển hướng nội bộ (chống open-redirect qua tham số ?next=). */
export function safeNext(next: string | null | undefined, fallback = "/family"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

const MONTHS = ["tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6", "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"];

/** "2024-05-01" → "1 tháng 5, 2024". Không phụ thuộc múi giờ. */
export function formatDate(d: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d ?? "");
  if (!m) return "Chưa rõ ngày";
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}, ${m[1]}`;
}
export const yearOf = (d: string | null | undefined) => (/^(\d{4})/.exec(d ?? "")?.[1] ?? null);

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** Làm sạch từ khoá tìm kiếm để dùng trong bộ lọc PostgREST .or(...) (bỏ ký tự đặc biệt của cú pháp lọc). */
export function sanitizeSearch(q: string | null | undefined): string {
  return String(q ?? "")
    .replace(/[,()%*\\"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function randomToken(bytes = 24): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function clampInt(v: string | string[] | undefined, min: number, max: number, def: number): number {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : def;
}

/** Origin mà trình duyệt thực sự dùng (tôn trọng Host/X-Forwarded-* sau reverse proxy), thay vì địa chỉ nội bộ của máy chủ. */
export function requestOrigin(req: { headers: Headers; url: string }): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return new URL(req.url).origin;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
  const proto = req.headers.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}
