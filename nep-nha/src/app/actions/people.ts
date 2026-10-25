"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamily } from "@/lib/session";
import { dbError, done, fail, fieldErrors, str, type ActionState } from "@/lib/actions";
import { personSchema, relationshipSchema } from "@/lib/validation";
import { wouldCreateCycle } from "@/lib/tree";
import type { Relationship } from "@/lib/types";

export async function savePerson(fd: FormData): Promise<ActionState> {
  const ctx = await requireFamily();
  if (!ctx.canWrite) return fail("Bạn chỉ có quyền xem.");
  const parsed = personSchema.safeParse({
    fullName: str(fd, "fullName"),
    relationLabel: str(fd, "relationLabel"),
    birthDate: str(fd, "birthDate"),
    birthDateVisible: str(fd, "birthDateVisible") === "on",
    bio: str(fd, "bio"),
  });
  if (!parsed.success) return fail("Bạn kiểm tra lại các ô bên dưới nhé.", fieldErrors(parsed.error));
  const d = parsed.data;
  const row = { full_name: d.fullName, relation_label: d.relationLabel, birth_date: d.birthDate ?? null, birth_date_visible: d.birthDateVisible, bio: d.bio };
  const id = str(fd, "id");
  if (id) {
    if (!z.string().uuid().safeParse(id).success) return fail("Hồ sơ không hợp lệ.");
    const { data, error } = await ctx.supabase.from("people").update(row).eq("id", id).eq("family_id", ctx.family.id).select("id");
    if (error) return fail(dbError(error));
    if (!data?.length) return fail("Bạn không có quyền sửa hồ sơ này.");
    revalidatePath("/family", "layout");
    return done("Đã lưu hồ sơ.", { id });
  }
  const { data, error } = await ctx.supabase.from("people").insert({ ...row, family_id: ctx.family.id, created_by: ctx.user.id }).select("id").single();
  if (error || !data) return fail(dbError(error, "Chưa lưu được hồ sơ."));
  revalidatePath("/family", "layout");
  return done("Đã thêm hồ sơ.", { id: (data as { id: string }).id });
}

export async function setAvatar(personId: string, path: string): Promise<ActionState> {
  const ctx = await requireFamily();
  if (!z.string().uuid().safeParse(personId).success) return fail("Hồ sơ không hợp lệ.");
  if (!path.startsWith(`${ctx.family.id}/people/${personId}/`) || path.includes("..")) return fail("Đường dẫn ảnh không hợp lệ.");
  const { data: old } = await ctx.supabase.from("people").select("avatar_path").eq("id", personId).eq("family_id", ctx.family.id).maybeSingle();
  const { data, error } = await ctx.supabase.from("people").update({ avatar_path: path }).eq("id", personId).eq("family_id", ctx.family.id).select("id");
  if (error || !data?.length) return fail(dbError(error, "Chưa lưu được ảnh đại diện."));
  const prev = (old as { avatar_path: string | null } | null)?.avatar_path;
  if (prev && prev !== path && !prev.startsWith("demo:")) await ctx.supabase.storage.from("family-media").remove([prev]);
  revalidatePath("/family", "layout");
  return done("Đã lưu ảnh đại diện.");
}

export async function deletePerson(fd: FormData): Promise<void> {
  const ctx = await requireFamily();
  const id = str(fd, "id");
  if (!z.string().uuid().safeParse(id).success) redirect("/family/members");
  const { data: p } = await ctx.supabase.from("people").select("avatar_path, user_id").eq("id", id).eq("family_id", ctx.family.id).maybeSingle();
  if ((p as { user_id: string | null } | null)?.user_id) redirect(`/family/members/${id}?error=${encodeURIComponent("Đây là hồ sơ của một tài khoản. Hãy xoá thành viên khỏi gia đình ở trang Quản lý nếu cần.")}`);
  const { data, error } = await ctx.supabase.from("people").delete().eq("id", id).eq("family_id", ctx.family.id).select("id");
  if (error || !data?.length) redirect(`/family/members/${id}?error=${encodeURIComponent(dbError(error, "Bạn không có quyền xoá hồ sơ này."))}`);
  const av = (p as { avatar_path: string | null } | null)?.avatar_path;
  if (av && !av.startsWith("demo:")) await ctx.supabase.storage.from("family-media").remove([av]);
  revalidatePath("/family", "layout");
  redirect("/family/members?deleted=1");
}

export async function addRelationship(_: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await requireFamily();
  if (!ctx.canWrite) return fail("Bạn chỉ có quyền xem.");
  const parsed = relationshipSchema.safeParse({ personA: str(fd, "personA"), personB: str(fd, "personB"), kind: str(fd, "kind") });
  if (!parsed.success) return fail("Bạn chọn đủ hai người và loại quan hệ nhé.");
  let { personA: a, personB: b } = parsed.data;
  const { kind } = parsed.data;
  if (a === b) return fail("Hãy chọn hai người khác nhau.");
  // kiểm tra sớm ở máy chủ để báo lỗi dễ hiểu; cơ sở dữ liệu cũng có trigger chặn vòng lặp
  const { data: rels } = await ctx.supabase.from("family_relationships").select("id, family_id, person_a, person_b, kind").eq("family_id", ctx.family.id);
  if (kind === "parent" && wouldCreateCycle((rels ?? []) as Relationship[], a, b)) return fail("Quan hệ này tạo vòng lặp trong gia phả (người này đã là tổ tiên của người kia).");
  if (kind === "spouse" && a > b) [a, b] = [b, a]; // lưu theo thứ tự cố định để không trùng
  const { error } = await ctx.supabase.from("family_relationships").insert({ family_id: ctx.family.id, person_a: a, person_b: b, kind, created_by: ctx.user.id });
  if (error) return fail(dbError(error, "Chưa thêm được quan hệ."));
  return done("Đã thêm quan hệ."); // form gọi router.refresh() ở client
}

export async function deleteRelationship(fd: FormData): Promise<void> {
  const ctx = await requireFamily();
  const id = str(fd, "id");
  if (!z.string().uuid().safeParse(id).success) return;
  await ctx.supabase.from("family_relationships").delete().eq("id", id).eq("family_id", ctx.family.id);
}

