import { requestOrigin, safeNext } from "@/lib/utils";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";

/** Điểm nhận liên kết từ email (xác minh đăng ký, đặt lại mật khẩu): đổi mã (PKCE) lấy phiên đăng nhập. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = requestOrigin(request);
  const next = safeNext(searchParams.get("next"), "/family");
  const code = searchParams.get("code");
  if (isConfigured() && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Liên kết đã hết hạn hoặc không hợp lệ. Bạn thử đăng nhập hoặc yêu cầu liên kết mới nhé.")}`);
}
