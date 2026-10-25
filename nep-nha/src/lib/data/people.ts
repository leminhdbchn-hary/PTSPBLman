import "server-only";
import type { Ctx } from "@/lib/session";
import type { Person, Relationship } from "@/lib/types";
import { signPaths } from "./media";

export async function listPeople(ctx: Ctx): Promise<(Person & { avatar_url: string | null })[]> {
  // đọc qua people_directory: ngày sinh đã được che ở cơ sở dữ liệu theo quyền của người xem
  const { data } = await ctx.supabase.rpc("people_directory", { p_family: ctx.family.id });
  const rows = ((data ?? []) as Person[]).slice().sort((a, b) => a.full_name.localeCompare(b.full_name, "vi"));
  const urls = await signPaths(ctx.supabase, rows.map((r) => r.avatar_path));
  return rows.map((r) => ({ ...r, avatar_url: r.avatar_path ? (urls.get(r.avatar_path) ?? null) : null }));
}

export async function getPerson(ctx: Ctx, id: string) {
  const { data } = await ctx.supabase.rpc("people_directory", { p_family: ctx.family.id });
  const p = ((data ?? []) as Person[]).find((x) => x.id === id);
  if (!p) return null;
  const urls = await signPaths(ctx.supabase, [p.avatar_path]);
  return { ...p, avatar_url: p.avatar_path ? (urls.get(p.avatar_path) ?? null) : null };
}

export async function listRelationships(ctx: Ctx): Promise<Relationship[]> {
  const { data } = await ctx.supabase.from("family_relationships").select("id, family_id, person_a, person_b, kind").eq("family_id", ctx.family.id);
  return (data ?? []) as Relationship[];
}
