"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireFamily, requireUser, FAMILY_COOKIE } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { dbError, done, fail, fieldErrors, str, type ActionState } from "@/lib/actions";
import { familySchema, inviteSchema } from "@/lib/validation";
import { randomToken } from "@/lib/utils";
import { siteUrl } from "@/lib/env";
import { headers } from "next/headers";
import { seedDemoData, clearDemoData } from "@/lib/demo";

async function setActive(id: string) {
  (await cookies()).set(FAMILY_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function createFamily(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = familySchema.safeParse({ name: str(fd, "name") });
  if (!parsed.success) return fail("Bạn kiểm tra lại tên gia đình nhé.", fieldErrors(parsed.error));
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("create_family", { p_name: parsed.data.name });
  if (error || !data) return fail(dbError(error, "Chưa tạo được gia đình."));
  await setActive(String(data));
  redirect("/family");
}

export async function switchFamily(fd: FormData) {
  const id = str(fd, "id");
  const { supabase } = await requireUser();
  const { data } = await supabase.from("family_memberships").select("family_id").eq("family_id", id).maybeSingle(); // chỉ chuyển sang gia đình mình thật sự là thành viên
  if (data) await setActive(id);
  redirect("/family");
}

export async function updateFamily(_: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await requireFamily();
  if (!ctx.isAdmin) return fail("Chỉ quản trị viên mới sửa được thông tin gia đình.");
  const parsed = familySchema.safeParse({ name: str(fd, "name") });
  if (!parsed.success) return fail("Bạn kiểm tra lại tên gia đình nhé.", fieldErrors(parsed.error));
  const description = str(fd, "description").trim().slice(0, 500) || null;
  const { error } = await ctx.supabase.from("families").update({ name: parsed.data.name, description }).eq("id", ctx.family.id);
  if (error) return fail(dbError(error));
  return done("Đã lưu thông tin gia đình.");
}

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createInvite(_: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await requireFamily();
  if (!ctx.isAdmin) return fail("Chỉ quản trị viên mới mời được thành viên.");
  const parsed = inviteSchema.safeParse({ email: str(fd, "email"), role: str(fd, "role") || "contributor", days: str(fd, "days") || 7 });
  if (!parsed.success) return fail("Bạn kiểm tra lại thông tin lời mời nhé.", fieldErrors(parsed.error));
  if (parsed.data.role === "admin" && ctx.role !== "owner") return fail("Chỉ chủ sở hữu mới mời được quản trị viên.");
  const token = randomToken(24);
  const expires = new Date(Date.now() + parsed.data.days * 86400_000).toISOString();
  const { error } = await ctx.supabase.from("invitations").insert({
    family_id: ctx.family.id,
    email: parsed.data.email,
    role: parsed.data.role,
    token_hash: await sha256Hex(token),
    created_by: ctx.user.id,
    expires_at: expires,
  });
  if (error) return fail(dbError(error, "Chưa tạo được lời mời."));
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const base = siteUrl(host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}` : undefined);
  // Mã gốc chỉ hiện đúng một lần ở đây; cơ sở dữ liệu chỉ giữ bản băm
  return done("Đã tạo lời mời. Hãy sao chép liên kết và gửi cho người thân (liên kết chỉ hiện một lần).", { link: `${base}/invite/${token}` });
}

export async function revokeInvite(fd: FormData) {
  const ctx = await requireFamily();
  if (!ctx.isAdmin) return;
  await ctx.supabase.from("invitations").update({ revoked_at: new Date().toISOString() }).eq("id", str(fd, "id")).eq("family_id", ctx.family.id).is("accepted_at", null);
}

export async function acceptInvite(token: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error || !data) return fail(dbError(error, "Chưa nhận được lời mời."));
  await setActive(String(data));
  return done("Đã tham gia gia đình.", { id: String(data) });
}

export async function setRole(fd: FormData) {
  const ctx = await requireFamily();
  const role = str(fd, "role");
  if (!["admin", "contributor", "viewer"].includes(role)) return;
  await ctx.supabase.rpc("set_member_role", { p_family: ctx.family.id, p_user: str(fd, "user"), p_role: role });
}

export async function removeMember(fd: FormData) {
  const ctx = await requireFamily();
  await ctx.supabase.rpc("remove_member", { p_family: ctx.family.id, p_user: str(fd, "user") });
}

export async function leaveFamily() {
  const ctx = await requireFamily();
  const { error } = await ctx.supabase.rpc("remove_member", { p_family: ctx.family.id, p_user: ctx.user.id });
  if (error) redirect(`/family/manage?error=${encodeURIComponent(dbError(error))}`);
  (await cookies()).delete(FAMILY_COOKIE);
  redirect("/family");
}

export async function transferOwnership(fd: FormData) {
  const ctx = await requireFamily();
  const { error } = await ctx.supabase.rpc("transfer_ownership", { p_family: ctx.family.id, p_new_owner: str(fd, "user") });
  if (error) redirect(`/family/manage?error=${encodeURIComponent(dbError(error))}`);
}

export async function deleteFamily() {
  const ctx = await requireFamily();
  if (ctx.role !== "owner") redirect("/family/manage?error=" + encodeURIComponent("Chỉ chủ sở hữu mới xoá được gia đình."));
  // dọn file ảnh trong Storage trước (xoá dòng dữ liệu không tự xoá file)
  const supabase = await createClient();
  const prefix = ctx.family.id;
  const stack = [prefix];
  const files: string[] = [];
  while (stack.length && files.length < 5000) {
    const dir = stack.pop()!;
    const { data } = await supabase.storage.from("family-media").list(dir, { limit: 1000 });
    for (const it of data ?? []) {
      if (it.id) files.push(`${dir}/${it.name}`);
      else stack.push(`${dir}/${it.name}`);
    }
  }
  for (let i = 0; i < files.length; i += 100) await supabase.storage.from("family-media").remove(files.slice(i, i + 100));
  const { error } = await ctx.supabase.rpc("delete_family", { p_family: ctx.family.id });
  if (error) redirect(`/family/manage?error=${encodeURIComponent(dbError(error))}`);
  (await cookies()).delete(FAMILY_COOKIE);
  redirect("/family");
}

export async function addDemo(): Promise<void> {
  const ctx = await requireFamily();
  if (!ctx.canWrite) redirect("/family/manage?error=" + encodeURIComponent("Bạn chỉ có quyền xem."));
  const r = await seedDemoData(ctx);
  revalidatePath("/family", "layout");
  redirect(r.ok ? "/family/memories" : `/family/manage?error=${encodeURIComponent(r.error ?? "Chưa thêm được dữ liệu mẫu.")}`);
}

export async function removeDemo(): Promise<void> {
  const ctx = await requireFamily();
  if (!ctx.isAdmin) redirect("/family/manage?error=" + encodeURIComponent("Chỉ quản trị viên mới xoá được dữ liệu mẫu."));
  await clearDemoData(ctx);
  revalidatePath("/family", "layout");
  redirect("/family/manage?demo=removed");
}
