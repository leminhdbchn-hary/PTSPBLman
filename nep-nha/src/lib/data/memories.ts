import "server-only";
import type { Ctx } from "@/lib/session";
import type { MediaRow, Memory, MemoryWithExtras, Person } from "@/lib/types";
import { sanitizeSearch } from "@/lib/utils";
import { signPaths } from "./media";

export type MemoryFilter = { q?: string; year?: string; tag?: string; person?: string; limit: number };

async function decorate(ctx: Ctx, mems: Memory[], people: Pick<Person, "id" | "full_name">[]): Promise<MemoryWithExtras[]> {
  if (!mems.length) return [];
  const ids = mems.map((m) => m.id);
  const [{ data: media }, { data: links }, { data: authors }] = await Promise.all([
    ctx.supabase.from("memory_media").select("id, memory_id, storage_path, mime_type, width, height, caption, sort_order").in("memory_id", ids).order("sort_order"),
    ctx.supabase.from("memory_people").select("memory_id, person_id").in("memory_id", ids),
    ctx.supabase.from("profiles").select("id, full_name").in("id", [...new Set(mems.map((m) => m.created_by).filter(Boolean))] as string[]),
  ]);
  const urls = await signPaths(ctx.supabase, ((media ?? []) as MediaRow[]).map((m) => m.storage_path));
  const pById = new Map(people.map((p) => [p.id, p]));
  const aById = new Map(((authors ?? []) as { id: string; full_name: string }[]).map((a) => [a.id, a.full_name]));
  return mems.map((m) => ({
    ...m,
    media: ((media ?? []) as MediaRow[]).filter((x) => x.memory_id === m.id).map((x) => ({ ...x, url: urls.get(x.storage_path) ?? null })),
    people: ((links ?? []) as { memory_id: string; person_id: string }[]).filter((l) => l.memory_id === m.id).map((l) => pById.get(l.person_id)).filter(Boolean) as Pick<Person, "id" | "full_name">[],
    author_name: m.created_by ? (aById.get(m.created_by) ?? null) : null,
  }));
}

/** Dòng thời gian: lọc theo năm, chủ đề, người, từ khoá; tải thêm bằng cách tăng `limit`. RLS lo phần quyền xem. */
export async function listMemories(ctx: Ctx, f: MemoryFilter, people: Pick<Person, "id" | "full_name">[]) {
  let personIds: string[] | null = null;
  if (f.person) {
    const { data } = await ctx.supabase.from("memory_people").select("memory_id").eq("person_id", f.person).eq("family_id", ctx.family.id);
    personIds = ((data ?? []) as { memory_id: string }[]).map((r) => r.memory_id);
    if (!personIds.length) return { items: [] as MemoryWithExtras[], hasMore: false };
  }
  let q = ctx.supabase.from("memories").select("*").eq("family_id", ctx.family.id);
  if (f.year && /^\d{4}$/.test(f.year)) q = q.gte("happened_on", `${f.year}-01-01`).lte("happened_on", `${f.year}-12-31`);
  if (f.tag) q = q.contains("tags", [f.tag]);
  if (personIds) q = q.in("id", personIds);
  const s = sanitizeSearch(f.q);
  if (s) q = q.or(`title.ilike.%${s}%,body.ilike.%${s}%,location.ilike.%${s}%`);
  const { data } = await q
    .order("happened_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(0, f.limit); // lấy dư 1 bản ghi để biết còn nữa không
  const rows = (data ?? []) as Memory[];
  const hasMore = rows.length > f.limit;
  return { items: await decorate(ctx, rows.slice(0, f.limit), people), hasMore };
}

export async function getMemory(ctx: Ctx, id: string, people: Pick<Person, "id" | "full_name">[]) {
  const { data } = await ctx.supabase.from("memories").select("*").eq("id", id).eq("family_id", ctx.family.id).maybeSingle();
  if (!data) return null;
  return (await decorate(ctx, [data as Memory], people))[0];
}

export async function memoryYears(ctx: Ctx): Promise<string[]> {
  const { data } = await ctx.supabase.from("memories").select("happened_on").eq("family_id", ctx.family.id).not("happened_on", "is", null).limit(5000);
  return [...new Set(((data ?? []) as { happened_on: string }[]).map((r) => r.happened_on.slice(0, 4)))].sort().reverse();
}

export async function memoryTags(ctx: Ctx): Promise<string[]> {
  const { data } = await ctx.supabase.from("memories").select("tags").eq("family_id", ctx.family.id).limit(2000);
  const c = new Map<string, number>();
  for (const r of (data ?? []) as { tags: string[] }[]) for (const t of r.tags ?? []) c.set(t, (c.get(t) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 24);
}

/** Ký ức liên quan: cùng thẻ hoặc cùng người, bỏ chính nó. */
export async function relatedMemories(ctx: Ctx, m: MemoryWithExtras, people: Pick<Person, "id" | "full_name">[]) {
  const ids = new Set<string>();
  if (m.people.length) {
    const { data } = await ctx.supabase.from("memory_people").select("memory_id").in("person_id", m.people.map((p) => p.id)).neq("memory_id", m.id).limit(40);
    for (const r of (data ?? []) as { memory_id: string }[]) ids.add(r.memory_id);
  }
  if (m.tags.length) {
    const { data } = await ctx.supabase.from("memories").select("id").eq("family_id", ctx.family.id).overlaps("tags", m.tags).neq("id", m.id).limit(40);
    for (const r of (data ?? []) as { id: string }[]) ids.add(r.id);
  }
  if (!ids.size) return [];
  const { data } = await ctx.supabase.from("memories").select("*").in("id", [...ids]).order("happened_on", { ascending: false, nullsFirst: false }).limit(4);
  return decorate(ctx, (data ?? []) as Memory[], people);
}
