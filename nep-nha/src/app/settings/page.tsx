import type { Metadata } from "next";
import Link from "next/link";
import { getFamilyCtx, getProfile, requireUser } from "@/lib/session";
import { DeletionForm, PasswordForm, ProfileForm } from "@/components/settings-forms";
import { ConfirmForm } from "@/components/ConfirmForm";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { Logo, Notice } from "@/components/ui";
import { cancelDeletion } from "@/app/actions/settings";
import { leaveFamily } from "@/app/actions/family";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const { user } = await requireUser();
  const [profile, ctx] = await Promise.all([getProfile(), getFamilyCtx()]);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container-page flex h-20 items-center justify-between"><Logo href={ctx ? "/family" : "/onboarding"} /><Link href={ctx ? "/family" : "/onboarding"} className="btn-soft btn-sm">← Về sổ gia đình</Link></header>
      <main id="noi-dung" className="container-page max-w-3xl flex-1 space-y-14 py-10">
        <h1 className="text-[2.4rem]">Cài đặt</h1>

        <section aria-labelledby="hs"><h2 id="hs" className="mb-5 text-[1.6rem]">Hồ sơ của bạn</h2><div className="card p-6"><ProfileForm fullName={profile.full_name} bio={profile.bio ?? ""} email={user.email ?? ""} /></div></section>
        <section aria-labelledby="mk"><h2 id="mk" className="mb-5 text-[1.6rem]">Mật khẩu</h2><div className="card p-6"><PasswordForm /></div></section>

        <section aria-labelledby="rt"><h2 id="rt" className="mb-3 text-[1.6rem]">Quyền riêng tư và dữ liệu</h2>
          <div className="card space-y-5 p-6 text-[16.5px]">
            <p>Ký ức của bạn chỉ hiển thị với người trong gia đình, theo chế độ bạn chọn cho từng ký ức. Nội dung không công khai và không dùng để huấn luyện AI. Ngày sinh trong hồ sơ thành viên mặc định được ẩn với người khác.</p>
            <p><Link href="/privacy" className="underline">Đọc chính sách bảo mật</Link></p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="/api/export?scope=me" className="btn-soft btn-sm" download>Tải dữ liệu của tôi (JSON)</a>
              {ctx?.isAdmin && <a href="/api/export?scope=family" className="btn-soft btn-sm" download>Tải dữ liệu cả gia đình (JSON)</a>}
            </div>
            <p className="text-[14.5px] text-stone">File tải về gồm toàn bộ chữ (ký ức, hồ sơ, quan hệ, bình luận) và danh sách ảnh. Ảnh gốc hiện chưa nằm trong file; hãy sao lưu thêm từ chính điện thoại của bạn.</p>
          </div></section>

        {ctx && ctx.role !== "owner" && (
          <section aria-labelledby="roi"><h2 id="roi" className="mb-3 text-[1.6rem]">Gia đình “{ctx.family.name}”</h2>
            <ConfirmForm action={leaveFamily} message="Rời khỏi gia đình này? Bạn sẽ không xem được sổ nữa cho tới khi được mời lại." label="Rời khỏi gia đình" className="btn-danger" /></section>
        )}

        <section aria-labelledby="xoa" className="rounded-2xl border border-[#dfc3b8] bg-[#fbf3ef] p-6">
          <h2 id="xoa" className="mb-3 text-[1.5rem]">Xoá tài khoản</h2>
          {profile.deletion_requested_at ? (
            <div className="space-y-4"><Notice>Bạn đã yêu cầu xoá tài khoản ngày {formatDateTime(profile.deletion_requested_at)}. Yêu cầu đang chờ người vận hành xử lý. Bạn có thể huỷ trước khi hoàn tất.</Notice>
              <ActionForm action={cancelDeletion}><SubmitButton className="btn-soft btn-sm" pending="…">Huỷ yêu cầu xoá</SubmitButton></ActionForm></div>
          ) : (
            <>
              <p className="mb-5 text-[16px]">Yêu cầu xoá sẽ được người vận hành xử lý thủ công. Nếu bạn là chủ sở hữu duy nhất của một gia đình, hãy chuyển quyền hoặc xoá gia đình trước. Ký ức bạn đã đóng góp trong gia đình sẽ được giữ lại trừ khi chủ sở hữu xoá chúng.</p>
              <DeletionForm />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
