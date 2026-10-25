import type { ZodError } from "zod";

export type ActionState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string>; id?: string; link?: string };

export const fail = (error: string, fieldErrors?: Record<string, string>): ActionState => ({ ok: false, error, fieldErrors });
export const done = (message?: string, extra: Partial<ActionState> = {}): ActionState => ({ ok: true, message, ...extra });

export function fieldErrors(e: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of e.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

/** Chuyển lỗi Supabase/Postgres sang thông báo tiếng Việt, không lộ chi tiết nội bộ. */
export function dbError(e: { message?: string; code?: string } | null | undefined, fallback = "Có lỗi xảy ra, bạn thử lại sau nhé."): string {
  if (!e) return fallback;
  // Các hàm trong cơ sở dữ liệu tự ném thông báo tiếng Việt dùng errcode riêng (P0001, 42501, P0002, 22023)
  if (e.code && ["P0001", "42501", "P0002", "22023"].includes(e.code) && e.message && /[À-ỹ]/.test(e.message)) return e.message;
  if (e.code === "42501") return "Bạn không có quyền thực hiện thao tác này.";
  if (e.code === "23505") return "Dữ liệu này đã tồn tại.";
  if (e.code === "PGRST116") return "Không tìm thấy dữ liệu.";
  if (e.message && /JWT|expired|not authenticated/i.test(e.message)) return "Phiên đăng nhập đã hết hạn, bạn đăng nhập lại nhé.";
  if (e.message && /fetch|network/i.test(e.message)) return "Không kết nối được mạng. Bạn kiểm tra lại rồi thử nhé.";
  return fallback;
}

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");
