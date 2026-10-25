import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/env";
import { requestOrigin } from "@/lib/utils";

const PROTECTED = ["/family", "/settings", "/onboarding"];

/** Làm mới phiên đăng nhập ở mỗi request và chặn các trang riêng tư khi chưa đăng nhập. */
export async function updateSession(request: NextRequest) {
  const fwd = new Headers(request.headers);
  fwd.set("x-pathname", request.nextUrl.pathname);
  let response = NextResponse.next({ request: { headers: fwd } });
  const cfg = supabaseConfig();
  const path = request.nextUrl.pathname;
  const needsAuth = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
  if (!cfg) {
    if (needsAuth) {
      return NextResponse.redirect(new URL("/?config=missing", requestOrigin(request)));
    }
    return response;
  }
  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: fwd } });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // getUser() xác thực token với máy chủ Supabase (không tin cookie một cách mù quáng)
  const { data } = await supabase.auth.getUser();
  if (!data.user && needsAuth) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path + request.nextUrl.search)}`, requestOrigin(request)));
  }
  return response;
}
