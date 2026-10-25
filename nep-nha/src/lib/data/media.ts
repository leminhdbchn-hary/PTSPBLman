import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;
const BUCKET = "family-media";

/** Tạo signed URL (hết hạn sau 1 giờ) cho các đường dẫn riêng tư; đường dẫn 'demo:' là ảnh minh hoạ có sẵn trong website. */
export async function signPaths(supabase: Client, paths: (string | null | undefined)[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const real: string[] = [];
  for (const p of paths) {
    if (!p) continue;
    if (p.startsWith("demo:")) out.set(p, p.slice(5));
    else if (!out.has(p) && !real.includes(p)) real.push(p);
  }
  if (real.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(real, 3600);
    for (const row of data ?? []) if (row.path && row.signedUrl) out.set(row.path, row.signedUrl);
  }
  return out;
}
