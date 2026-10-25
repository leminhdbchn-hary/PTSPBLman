import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";
import { FAMILY_COOKIE } from "@/lib/session";
import { cookies } from "next/headers";

/** Xuất dữ liệu (JSON): scope=me (những gì của riêng tôi) hoặc scope=family (cả gia đình, chỉ quản trị). Chạy với quyền người dùng nên RLS tự giới hạn. */
export async function GET(request: NextRequest) {
  if (!isConfigured()) return NextResponse.json({ error: "Chưa cấu hình" }, { status: 503 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const scope = request.nextUrl.searchParams.get("scope") === "family" ? "family" : "me";
  const uid = auth.user.id;

  const { data: ms } = await supabase.from("family_memberships").select("family_id, role, families(name)").eq("user_id", uid);
  const memberships = (ms ?? []) as unknown as { family_id: string; role: string; families: { name: string } | { name: string }[] | null }[];
  const want = (await cookies()).get(FAMILY_COOKIE)?.value;
  const cur = memberships.find((m) => m.family_id === want) ?? memberships[0];

  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), scope, user: { id: uid, email: auth.user.email } };
  const { data: profile } = await supabase.from("profiles").select("full_name, bio, created_at").eq("id", uid).maybeSingle();
  out.profile = profile;

  if (cur) {
    if (scope === "family" && !["owner", "admin"].includes(cur.role)) return NextResponse.json({ error: "Chỉ quản trị viên mới tải được dữ liệu cả gia đình." }, { status: 403 });
    const fid = cur.family_id;
    const mine = scope === "me";
    let mem = supabase.from("memories").select("id, title, body, happened_on, location, tags, visibility, created_at, updated_at, created_by").eq("family_id", fid);
    if (mine) mem = mem.eq("created_by", uid);
    const { data: memories } = await mem;
    const ids = ((memories ?? []) as { id: string }[]).map((m) => m.id);
    const [media, links, comments, people, rels] = await Promise.all([
      ids.length ? supabase.from("memory_media").select("memory_id, storage_path, mime_type, size_bytes, caption").in("memory_id", ids) : Promise.resolve({ data: [] }),
      ids.length ? supabase.from("memory_people").select("memory_id, person_id").in("memory_id", ids) : Promise.resolve({ data: [] }),
      mine ? supabase.from("comments").select("memory_id, body, created_at").eq("family_id", fid).eq("author_id", uid) : supabase.from("comments").select("memory_id, author_id, body, created_at").eq("family_id", fid),
      supabase.rpc("people_directory", { p_family: fid }),
      mine ? Promise.resolve({ data: [] }) : supabase.from("family_relationships").select("person_a, person_b, kind").eq("family_id", fid),
    ]);
    out.family = { id: fid, name: Array.isArray(cur.families) ? cur.families[0]?.name : cur.families?.name, role: cur.role };
    out.memories = memories;
    out.memory_media = media.data;
    out.memory_people = links.data;
    out.comments = comments.data;
    out.people = mine ? ((people.data ?? []) as { user_id: string | null }[]).filter((p) => p.user_id === uid) : people.data;
    if (!mine) out.relationships = rels.data;
  }
  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="nep-nha-${scope}-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" },
  });
}
