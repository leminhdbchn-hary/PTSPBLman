import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "@/lib/env";

/** Client phía máy chủ: đọc/ghi cookie phiên đăng nhập. Mọi truy vấn đều chạy với quyền của người dùng (RLS áp dụng). */
export async function createClient() {
  const cfg = supabaseConfig();
  if (!cfg) throw new Error("Chưa cấu hình Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  const store = await cookies();
  return createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Gọi từ Server Component (không ghi cookie được): middleware sẽ làm mới phiên.
        }
      },
    },
  });
}
