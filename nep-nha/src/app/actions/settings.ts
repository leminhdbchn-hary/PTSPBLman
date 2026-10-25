"use server";
import { requireUser } from "@/lib/session";
import { dbError, done, fail, fieldErrors, str, type ActionState } from "@/lib/actions";
import { passwordSchema, profileSchema } from "@/lib/validation";

export async function updateProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = profileSchema.safeParse({ fullName: str(fd, "fullName"), bio: str(fd, "bio") });
  if (!parsed.success) return fail("Bạn kiểm tra lại các ô bên dưới nhé.", fieldErrors(parsed.error));
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.fullName, bio: parsed.data.bio }).eq("id", user.id);
  if (error) return fail(dbError(error));
  // cập nhật luôn tên trong hồ sơ thành viên gắn với tài khoản này
  await supabase.from("people").update({ full_name: parsed.data.fullName }).eq("user_id", user.id);
  return done("Đã lưu hồ sơ của bạn.");
}

export async function changePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const pw = passwordSchema.safeParse(str(fd, "password"));
  if (!pw.success) return fail("Mật khẩu mới chưa hợp lệ.", { password: pw.error.issues[0].message });
  if (str(fd, "password") !== str(fd, "confirm")) return fail("Hai mật khẩu chưa khớp.", { confirm: "Hai mật khẩu chưa khớp" });
  // xác nhận lại mật khẩu hiện tại để người khác cầm máy đang đăng nhập không đổi được mật khẩu
  const { error: e1 } = await supabase.auth.signInWithPassword({ email: user.email ?? "", password: str(fd, "current") });
  if (e1) return fail("Mật khẩu hiện tại chưa đúng.", { current: "Mật khẩu hiện tại chưa đúng" });
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) return fail("Chưa đổi được mật khẩu. Bạn thử lại sau nhé.");
  return done("Đã đổi mật khẩu.");
}

export async function requestDeletion(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  if (str(fd, "confirm").trim().toUpperCase() !== "XOA") return fail("Bạn gõ chữ XOA vào ô xác nhận để tiếp tục.", { confirm: "Chưa đúng" });
  const { error } = await supabase.rpc("request_account_deletion", { p_reason: str(fd, "reason").slice(0, 500) || null });
  if (error) return fail(dbError(error));
  return done("Đã ghi nhận yêu cầu xoá tài khoản. Bạn có thể huỷ yêu cầu bất cứ lúc nào trong thời gian chờ xử lý.");
}

export async function cancelDeletion(): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.rpc("cancel_account_deletion");
}
