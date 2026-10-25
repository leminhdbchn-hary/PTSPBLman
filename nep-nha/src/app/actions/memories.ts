"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireFamily } from "@/lib/session";
import { dbError, done, fail, fieldErrors, str, type ActionState } from "@/lib/actions";
import { commentSchema, mediaMetaSchema, memorySchema, MEDIA_LIMITS } from "@/lib/validation";
import { z } from "zod";

function parseForm(fd: FormData) {
  return memorySchema.safeParse({
    title: str(fd, "title"),
    body: str(fd, "body"),
    happenedOn: str(fd, "happenedOn"),
    location: str(fd, "location"),
    tags: str(fd, "tags"),
    visibility: str(fd, "visibility") || "family",
    personIds: fd.getAll("personIds").map(String),
  });
}

/** Tạo hoặc sửa nội dung chữ của ký ức. Ảnh được tải trực tiếp từ trình duyệt lên Storage rồi gắn vào bằng attachMedia. */
export async function saveMemory(fd: FormData): Promise<ActionState> {
  const ctx = await requireFamily();
  if (!ctx.canWrite) return fail("Bạn chỉ có quyền xem, không thêm hoặc sửa được ký ức.");
  const parsed = parseForm(fd);
  if (!parsed.success) return fail("Bạn kiểm tra lại các ô bên dưới nhé.", fieldErrors(parsed.error));
  const d = parsed.data;
  const id = str(fd, "id");
  const row = { title: d.title, body: d.body, happened_on: d.happenedOn ?? null, location: d.location, tags: d.tags, visibility: d.visibility };

  let memoryId = id;
  if (id) {
    if (!z.string().uuid().safeParse(id).success) return fail("Ký ức không hợp lệ.");
    const { data, error } = await ctx.supabase.from("memories").update(row).eq("id", id).eq("family_id", ctx.family.id).select("id");
    if (error) return fail(dbError(error, "Chưa lưu được ký ức."));
    if (!data?.length) return fail("Bạn không có quyền sửa ký ức này, hoặc ký ức không còn nữa.");
  } else {
    const { data, error } = await ctx.supabase.from("memories").insert({ ...row, family_id: ctx.family.id, created_by: ctx.user.id }).select("id").single();
    if (error || !data) return fail(dbError(error, "Chưa lưu được ký ức."));
    memoryId = (data as { id: string }).id;
  }
  // cập nhật những người liên quan: chỉ nhận người thuộc đúng gia đình này (khoá ngoại ghép (id, family_id) cũng chặn ở DB)
  await ctx.supabase.from("memory_people").delete().eq("memory_id", memoryId);
  if (d.personIds.length) {
    const { error } = await ctx.supabase.from("memory_people").insert(d.personIds.map((p) => ({ memory_id: memoryId, person_id: p, family_id: ctx.family.id })));
    if (error) return fail("Đã lưu ký ức nhưng chưa gắn được người liên quan.", undefined);
  }
  // gỡ các ảnh được bỏ chọn
  const remove = fd.getAll("removeMedia").map(String).filter((x) => z.string().uuid().safeParse(x).success);
  if (id && remove.length) {
    const { data: rows } = await ctx.supabase.from("memory_media").select("id, storage_path").eq("memory_id", memoryId).in("id", remove);
    const paths = (rows ?? []).map((r: { storage_path: string }) => r.storage_path).filter((p) => !p.startsWith("demo:"));
    if (paths.length) await ctx.supabase.storage.from("family-media").remove(paths);
    await ctx.supabase.from("memory_media").delete().eq("memory_id", memoryId).in("id", remove);
  }
  revalidatePath("/family", "layout");
  return done("Đã lưu vào sổ.", { id: memoryId });
}

/** Gắn các ảnh vừa tải lên Storage vào ký ức. Đường dẫn bắt buộc nằm trong thư mục của chính ký ức này. */
export async function attachMedia(memoryId: string, items: unknown): Promise<ActionState> {
  const ctx = await requireFamily();
  if (!ctx.canWrite) return fail("Bạn chỉ có quyền xem.");
  if (!z.string().uuid().safeParse(memoryId).success) return fail("Ký ức không hợp lệ.");
  const parsed = z.array(mediaMetaSchema).max(MEDIA_LIMITS.maxPerMemory).safeParse(items);
  if (!parsed.success) return fail("Thông tin ảnh không hợp lệ.");
  const prefix = `${ctx.family.id}/memories/${memoryId}/`;
  if (parsed.data.some((m) => !m.path.startsWith(prefix) || m.path.includes(".."))) return fail("Đường dẫn ảnh không hợp lệ.");
  const { count } = await ctx.supabase.from("memory_media").select("id", { count: "exact", head: true }).eq("memory_id", memoryId);
  if ((count ?? 0) + parsed.data.length > MEDIA_LIMITS.maxPerMemory) return fail(`Mỗi ký ức tối đa ${MEDIA_LIMITS.maxPerMemory} ảnh.`);
  const { error } = await ctx.supabase.from("memory_media").insert(
    parsed.data.map((m, i) => ({
      memory_id: memoryId, family_id: ctx.family.id, storage_path: m.path, mime_type: m.mime, size_bytes: m.size, width: m.width, height: m.height, sort_order: (count ?? 0) + i, created_by: ctx.user.id,
    })),
  );
  if (error) return fail(dbError(error, "Chưa gắn được ảnh vào ký ức."));
  revalidatePath("/family", "layout");
  return done("Đã gắn ảnh.");
}

export async function deleteMemory(fd: FormData): Promise<void> {
  const ctx = await requireFamily();
  const id = str(fd, "id");
  if (!z.string().uuid().safeParse(id).success) redirect("/family/memories");
  const { data: media } = await ctx.supabase.from("memory_media").select("storage_path").eq("memory_id", id);
  const { data, error } = await ctx.supabase.from("memories").delete().eq("id", id).eq("family_id", ctx.family.id).select("id");
  if (error || !data?.length) redirect(`/family/memories/${id}?error=${encodeURIComponent("Bạn không có quyền xoá ký ức này.")}`);
  const paths = ((media ?? []) as { storage_path: string }[]).map((m) => m.storage_path).filter((p) => !p.startsWith("demo:"));
  if (paths.length) await ctx.supabase.storage.from("family-media").remove(paths);
  revalidatePath("/family", "layout");
  redirect("/family/memories?deleted=1");
}

export async function addComment(_: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await requireFamily();
  if (!ctx.canWrite) return fail("Bạn chỉ có quyền xem.");
  const parsed = commentSchema.safeParse({ body: str(fd, "body") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const memoryId = str(fd, "memoryId");
  if (!z.string().uuid().safeParse(memoryId).success) return fail("Ký ức không hợp lệ.");
  const { error } = await ctx.supabase.from("comments").insert({ memory_id: memoryId, family_id: ctx.family.id, author_id: ctx.user.id, body: parsed.data.body });
  if (error) return fail(dbError(error, "Chưa gửi được bình luận."));
  return done("Đã gửi.");
}

export async function deleteComment(fd: FormData): Promise<void> {
  const ctx = await requireFamily();
  const id = str(fd, "id");
  if (!z.string().uuid().safeParse(id).success) return;
  await ctx.supabase.from("comments").delete().eq("id", id).eq("family_id", ctx.family.id);
}
