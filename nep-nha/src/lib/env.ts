// Đọc cấu hình từ biến môi trường. Chỉ dùng khoá công khai (anon). Không có service-role key ở bất kỳ đâu trong dự án.
export function supabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.includes("your-project-ref")) return null;
  return { url, anonKey };
}

export const isConfigured = () => supabaseConfig() !== null;

export const contactEmail = () => process.env.NEXT_PUBLIC_CONTACT_EMAIL || "lienhe@example.com";

/** Địa chỉ gốc của website, dùng làm liên kết trong email. */
export function siteUrl(fallbackOrigin?: string): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || fallbackOrigin || "http://localhost:3000").replace(/\/$/, "");
}
