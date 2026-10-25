"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isConfigured, siteUrl } from "@/lib/env";
import { emailSchema, loginSchema, passwordSchema, registerSchema } from "@/lib/validation";
import { done, fail, fieldErrors, str, type ActionState } from "@/lib/actions";
import { safeNext } from "@/lib/utils";

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return siteUrl(host ? `${proto}://${host}` : undefined);
}

function authMessage(e: { message?: string; status?: number; code?: string }): string {
  const m = (e.message ?? "").toLowerCase();
  if (m.includes("invalid login")) return "Email hoặc mật khẩu chưa đúng.";
  if (m.includes("email not confirmed")) return "Bạn chưa xác minh email. Hãy mở thư xác minh chúng tôi đã gửi.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Email này đã có tài khoản. Bạn thử đăng nhập nhé.";
  if (m.includes("rate limit") || e.status === 429) return "Bạn thao tác hơi nhanh. Đợi một chút rồi thử lại nhé.";
  if (m.includes("weak") || m.includes("password")) return "Mật khẩu chưa đủ mạnh. Hãy dùng ít nhất 8 ký tự, có cả chữ và số.";
  if (m.includes("fetch") || m.includes("network")) return "Không kết nối được mạng. Bạn kiểm tra lại rồi thử nhé.";
  return "Chưa thực hiện được. Bạn thử lại sau nhé.";
}

export async function register(_: ActionState, fd: FormData): Promise<ActionState> {
  if (!isConfigured()) return fail("Website chưa được cấu hình Supabase.");
  const parsed = registerSchema.safeParse({ fullName: str(fd, "fullName"), email: str(fd, "email"), password: str(fd, "password") });
  if (!parsed.success) return fail("Bạn kiểm tra lại các ô bên dưới nhé.", fieldErrors(parsed.error));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName }, emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(safeNext(str(fd, "next"), "/onboarding"))}` },
  });
  if (error) return fail(authMessage(error));
  // Supabase trả về user nhưng identities rỗng khi email đã tồn tại (để không lộ thông tin tài khoản)
  if (data.user && data.user.identities && data.user.identities.length === 0) return fail("Email này đã có tài khoản. Bạn thử đăng nhập nhé.");
  if (data.session) redirect(safeNext(str(fd, "next"), "/onboarding")); // dự án tắt xác minh email
  return done("Chúng tôi đã gửi thư xác minh tới email của bạn. Hãy mở thư và bấm vào liên kết để hoàn tất đăng ký.");
}

export async function login(_: ActionState, fd: FormData): Promise<ActionState> {
  if (!isConfigured()) return fail("Website chưa được cấu hình Supabase.");
  const parsed = loginSchema.safeParse({ email: str(fd, "email"), password: str(fd, "password") });
  if (!parsed.success) return fail("Bạn kiểm tra lại email và mật khẩu nhé.", fieldErrors(parsed.error));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return fail(authMessage(error));
  redirect(safeNext(str(fd, "next")));
}

export async function forgotPassword(_: ActionState, fd: FormData): Promise<ActionState> {
  if (!isConfigured()) return fail("Website chưa được cấu hình Supabase.");
  const parsed = emailSchema.safeParse(str(fd, "email"));
  if (!parsed.success) return fail("Email chưa đúng định dạng.", { email: parsed.error.issues[0].message });
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${await origin()}/auth/callback?next=/reset-password` });
  if (error && (error.status === 429 || /rate/i.test(error.message))) return fail(authMessage(error));
  // Luôn trả lời giống nhau để không lộ email nào đã đăng ký
  return done("Nếu email này có tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu. Bạn nhớ xem cả hộp thư rác nhé.");
}

export async function resetPassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const pw = passwordSchema.safeParse(str(fd, "password"));
  if (!pw.success) return fail("Mật khẩu chưa hợp lệ.", { password: pw.error.issues[0].message });
  if (str(fd, "password") !== str(fd, "confirm")) return fail("Hai mật khẩu chưa khớp.", { confirm: "Hai mật khẩu chưa khớp" });
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return fail("Liên kết đặt lại mật khẩu đã hết hạn. Bạn yêu cầu liên kết mới nhé.");
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) return fail(authMessage(error));
  redirect("/family");
}
