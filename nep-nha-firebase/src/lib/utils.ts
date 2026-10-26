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
export const yearOf = (d: string | null | undefined) => /^(\d{4})/.exec(d ?? "")?.[1] ?? null;

export function formatDateTime(d: Date | { toDate(): Date } | null | undefined): string {
  if (!d) return "";
  const x = d instanceof Date ? d : d.toDate();
  return `${x.getDate()}/${x.getMonth() + 1}/${x.getFullYear()}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu: "Bữa cơm" → "bua com". */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

/** Mã ngẫu nhiên an toàn (base64url) cho liên kết mời. */
export function randomToken(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  let s = "";
  for (const b of a) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
