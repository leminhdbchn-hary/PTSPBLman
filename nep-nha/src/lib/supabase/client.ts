import { createBrowserClient } from "@supabase/ssr";

/** Client chạy trong trình duyệt (dùng cho tải ảnh lên Storage bằng phiên đăng nhập của người dùng; RLS vẫn áp dụng). */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, key);
}
