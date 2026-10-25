import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireFamily } from "@/lib/session";
import { FamilyEditForm, InviteForm } from "@/components/manage-forms";
import { ConfirmForm } from "@/components/ConfirmForm";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { Avatar, Notice, PageTitle } from "@/components/ui";
import { addDemo, deleteFamily, leaveFamily, removeDemo, removeMember, revokeInvite, setRole, transferOwnership } from "@/app/actions/family";
import { ROLE_LABEL, type FamilyRole, type Invitation } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Quản lý gia đình" };

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ error?: string; demo?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireFamily();
  const fid = ctx.family.id;
  const { data: ms } = await ctx.supabase.from("family_memberships").select("user_id, role, joined_at").eq("family_id", fid).order("joined_at");
  const members = (ms ?? []) as { user_id: string; role: FamilyRole; joined_at: string }[];
  const { data: pr } = await ctx.supabase.from("profiles").select("id, full_name").in("id", members.map((m) => m.user_id));
  const names = new Map(((pr ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p.full_name || "Thành viên"]));
  let invites: Invitation[] = [];
  if (ctx.isAdmin) {
    const { data } = await ctx.supabase.from("invitations").select("id, email, role, created_at, expires_at, accepted_at, revoked_at").eq("family_id", fid).order("created_at", { ascending: false }).limit(30);
    invites = (data ?? []) as Invitation[];
  } else redirect("/family");
  const { count: demoCount } = await ctx.supabase.from("memories").select("id", { count: "exact", head: true }).eq("family_id", fid).eq("is_demo", true);
  const now = Date.now();
  const status = (i: Invitation) => (i.accepted_at ? "Đã nhận" : i.revoked_at ? "Đã thu hồi" : new Date(i.expires_at).getTime() < now ? "Hết hạn" : "Đang chờ");

  return (
    <div className="mx-auto max-w-4xl space-y-14">
      <PageTitle eyebrow="Quản lý" title={ctx.family.name} />
      {sp.error && <Notice kind="error">{sp.error}</Notice>}
      {sp.demo === "removed" && <Notice kind="success">Đã xoá dữ liệu mẫu.</Notice>}

      <section aria-labelledby="tt"><h2 id="tt" className="mb-5 text-[1.6rem]">Thông tin gia đình</h2><div className="card p-6"><FamilyEditForm name={ctx.family.name} description={ctx.family.description ?? ""} /></div></section>

      <section aria-labelledby="moi"><h2 id="moi" className="mb-2 text-[1.6rem]">Mời người thân</h2>
        <p className="mb-5 text-stone">Liên kết mời chỉ dùng được một lần và có thời hạn. Bạn có thể thu hồi bất cứ lúc nào.</p>
        <div className="card p-6"><InviteForm isOwner={ctx.role === "owner"} /></div>
        {invites.length > 0 && (
          <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-warm">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-[15.5px]">
                <span><span className="font-medium">{ROLE_LABEL[i.role]}</span>{i.email ? ` · ${i.email}` : " · mọi người có liên kết"}<span className="block text-[13.5px] text-stone">Tạo {formatDateTime(i.created_at)} · hạn {formatDateTime(i.expires_at)}</span></span>
                <span className="flex items-center gap-3"><span className="text-stone">{status(i)}</span>{status(i) === "Đang chờ" && <ActionForm action={revokeInvite}><input type="hidden" name="id" value={i.id} /><SubmitButton className="btn-soft btn-sm" pending="…">Thu hồi</SubmitButton></ActionForm>}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tv"><h2 id="tv" className="mb-5 text-[1.6rem]">Thành viên có tài khoản</h2>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-warm">
          {members.map((m) => {
            const self = m.user_id === ctx.user.id;
            const locked = m.role === "owner" || (ctx.role === "admin" && m.role === "admin");
            return (
              <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <span className="flex items-center gap-3"><Avatar name={names.get(m.user_id) ?? "?"} size={44} /><span><span className="font-medium">{names.get(m.user_id)}{self ? " (bạn)" : ""}</span><span className="block text-[14px] text-stone">{ROLE_LABEL[m.role]} · từ {formatDateTime(m.joined_at)}</span></span></span>
                {!self && !locked && (
                  <span className="flex flex-wrap items-center gap-2">
                    <ActionForm action={setRole} className="flex items-center gap-2"><input type="hidden" name="user" value={m.user_id} />
                      <label className="sr-only" htmlFor={`r-${m.user_id}`}>Vai trò của {names.get(m.user_id)}</label>
                      <select id={`r-${m.user_id}`} name="role" defaultValue={m.role} className="input !min-h-0 !w-auto !py-1.5 !text-[15px]">
                        {ctx.role === "owner" && <option value="admin">{ROLE_LABEL.admin}</option>}<option value="contributor">{ROLE_LABEL.contributor}</option><option value="viewer">{ROLE_LABEL.viewer}</option></select>
                      <SubmitButton className="btn-soft btn-sm" pending="…">Lưu</SubmitButton></ActionForm>
                    <ConfirmForm action={removeMember} message={`Mời ${names.get(m.user_id)} ra khỏi gia đình?`} label="Xoá"><input type="hidden" name="user" value={m.user_id} /></ConfirmForm>
                  </span>
                )}
                {!self && ctx.role === "owner" && (
                  <ConfirmForm action={transferOwnership} message={`Chuyển quyền chủ sở hữu cho ${names.get(m.user_id)}? Bạn sẽ trở thành quản trị viên.`} label="Chuyển quyền chủ sở hữu" className="btn-soft btn-sm"><input type="hidden" name="user" value={m.user_id} /></ConfirmForm>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="du-lieu-mau" id="du-lieu-mau"><h2 className="mb-2 text-[1.6rem]">Dữ liệu mẫu</h2>
        <p className="mb-5 text-stone">Năm ký ức và năm hồ sơ hoàn toàn giả lập để bạn xem cuốn sổ trông như thế nào. Xoá một lần là sạch, không ảnh hưởng nội dung thật.</p>
        <div className="flex flex-wrap gap-3">
          {(demoCount ?? 0) === 0 ? <form action={addDemo}><SubmitButton className="btn-soft" pending="Đang thêm…">Thêm dữ liệu mẫu</SubmitButton></form>
            : <ConfirmForm action={removeDemo} message="Xoá toàn bộ dữ liệu mẫu (ký ức và hồ sơ mẫu)?" label="Xoá dữ liệu mẫu" className="btn-soft" />}
        </div>
      </section>

      <section aria-labelledby="nguy" className="rounded-2xl border border-[#dfc3b8] bg-[#fbf3ef] p-6"><h2 id="nguy" className="mb-3 text-[1.5rem]">Khu vực cần cẩn thận</h2>
        <div className="flex flex-wrap gap-3">
          {ctx.role !== "owner" && <ConfirmForm action={leaveFamily} message="Rời khỏi gia đình này? Bạn sẽ không xem được sổ nữa cho tới khi được mời lại." label="Rời gia đình" className="btn-danger" />}
          {ctx.role === "owner" && <ConfirmForm action={deleteFamily} message={`XOÁ VĨNH VIỄN gia đình “${ctx.family.name}” cùng toàn bộ ký ức, ảnh và hồ sơ? Không thể khôi phục.`} label="Xoá cả gia đình" className="btn-danger" />}
        </div>
        {ctx.role === "owner" && <p className="mt-3 text-[14.5px] text-stone">Muốn rời gia đình? Hãy chuyển quyền chủ sở hữu cho người khác trước.</p>}
      </section>
    </div>
  );
}
