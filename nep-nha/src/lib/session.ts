import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Family, FamilyRole, Profile } from "@/lib/types";

export const FAMILY_COOKIE = "nn_family";

/** Người dùng hiện tại (đã xác thực với Supabase) — chuyển về /login nếu chưa đăng nhập. */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
});

export const getProfile = cache(async (): Promise<Profile> => {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? { id: user.id, full_name: "", avatar_path: null, bio: null, deletion_requested_at: null };
});

export type Ctx = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string };
  family: Family;
  role: FamilyRole;
  families: { family: Family; role: FamilyRole }[];
  canWrite: boolean;
  isAdmin: boolean;
};

/** Gia đình đang xem. Chọn theo cookie (nếu người dùng thật sự là thành viên) hoặc gia đình tham gia sớm nhất. */
export const getFamilyCtx = cache(async (): Promise<Ctx | null> => {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("family_memberships")
    .select("role, joined_at, families(id, name, description, cover_path, created_at)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });
  type Row = { role: FamilyRole; families: Family | Family[] | null };
  const list = ((data ?? []) as unknown as Row[])
    .map((r) => ({ role: r.role, family: Array.isArray(r.families) ? r.families[0] : r.families }))
    .filter((r): r is { role: FamilyRole; family: Family } => !!r.family);
  if (!list.length) return null;
  const want = (await cookies()).get(FAMILY_COOKIE)?.value;
  const cur = list.find((x) => x.family.id === want) ?? list[0];
  return {
    supabase,
    user: { id: user.id, email: user.email },
    family: cur.family,
    role: cur.role,
    families: list,
    canWrite: cur.role !== "viewer",
    isAdmin: cur.role === "owner" || cur.role === "admin",
  };
});

/** Trang trong /family cần có gia đình; chưa có thì chuyển tới màn tạo/nhận lời mời. */
export async function requireFamily(): Promise<Ctx> {
  const ctx = await getFamilyCtx();
  if (!ctx) redirect("/onboarding");
  return ctx;
}
