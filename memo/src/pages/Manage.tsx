import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Avatar, ConfirmButton, CopyField, Field, Loading, Notice, PageTitle, Submit, ErrorState } from "@/components/ui";
import { useAsync, useFamily, useSession } from "@/lib/session";
import { createInvite, deleteFamily, friendlyError, getFamily, leaveFamily, listInvites, listMembers, removeMember, revokeInvite, setRole, transferOwnership, updateFamily } from "@/lib/data";
import { clearDemoData, seedDemoData } from "@/lib/demo";
import { familySchema, inviteSchema } from "@/lib/validation";
import { ROLE_HELP, ROLE_LABEL, type FamilyRole, type Invite } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function Manage() {
  const ctx = useFamily();
  const session = useSession();
  const nav = useNavigate();
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const { data, loading, error, reload } = useAsync(async () => {
    const [family, members, invites, demo] = await Promise.all([
      getFamily(ctx.db, ctx.fid), listMembers(ctx), listInvites(ctx),
      getDocs(query(collection(ctx.db, "nn_families", ctx.fid, "memories"), where("isDemo", "==", true), where("visibility", "==", "family"))),
    ]);
    return { family, members, invites, demoCount: demo.size };
  }, [ctx.fid]);
  if (!ctx.isAdmin) return <Navigate to="/family" replace />;
  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorState message={friendlyError(error)} onRetry={reload} />;
  const now = Date.now();
  const status = (i: Invite) => (i.acceptedBy ? "Đã nhận" : i.revoked ? "Đã thu hồi" : i.expiresAt.toMillis() < now ? "Hết hạn" : "Đang chờ");
  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key); setMsg(null);
    try { await fn(); if (ok) setMsg({ kind: "success", text: ok }); reload(); } catch (x) { setMsg({ kind: "error", text: friendlyError(x) }); }
    setBusy(null);
  };

  async function saveInfo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = familySchema.safeParse({ name: f.get("name"), description: f.get("description") });
    if (!parsed.success) { setMsg({ kind: "error", text: parsed.error.issues[0].message }); return; }
    await run("info", async () => { await updateFamily(ctx, parsed.data.name, parsed.data.description); await session.refresh(); }, "Đã lưu thông tin gia đình.");
  }
  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = inviteSchema.safeParse({ email: f.get("email") ?? "", role: f.get("role"), days: f.get("days") });
    if (!parsed.success) { setMsg({ kind: "error", text: parsed.error.issues[0].message }); return; }
    setLink(null);
    await run("invite", async () => {
      const r = await createInvite(ctx, data!.family?.name ?? ctx.familyName, parsed.data);
      setLink(location.origin + r.path);
    }, "Đã tạo lời mời. Hãy sao chép liên kết và gửi cho người thân (liên kết chỉ hiện một lần).");
  }
  const roles: FamilyRole[] = ctx.isOwner ? ["admin", "contributor", "viewer"] : ["contributor", "viewer"];

  return (
    <div className="mx-auto max-w-4xl space-y-14">
      <PageTitle eyebrow="Quản lý" title={data.family?.name ?? ctx.familyName} />
      {msg && <div className="sticky top-[132px] z-20"><Notice kind={msg.kind}>{msg.text}</Notice></div>}

      <section aria-labelledby="tt"><h2 id="tt" className="mb-5 text-[1.6rem]">Thông tin gia đình</h2>
        <div className="card p-6">
          <form onSubmit={saveInfo} className="space-y-4">
            <Field label="Tên gia đình" name="name"><input id="name" name="name" className="input" defaultValue={data.family?.name} maxLength={80} required /></Field>
            <Field label="Giới thiệu ngắn" name="description"><textarea id="description" name="description" className="input min-h-[90px]" defaultValue={data.family?.description ?? ""} maxLength={500} /></Field>
            <Submit busy={busy === "info"} className="btn btn-sm" busyText="Đang lưu…">Lưu</Submit>
          </form>
        </div>
      </section>

      <section aria-labelledby="moi"><h2 id="moi" className="mb-2 text-[1.6rem]">Mời người thân</h2>
        <p className="mb-5 text-stone">Liên kết mời chỉ dùng được một lần và có thời hạn. Bạn có thể thu hồi bất cứ lúc nào.</p>
        <div className="card space-y-5 p-6">
          <form onSubmit={invite} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email người được mời (không bắt buộc)" name="email" hint="Nếu điền, chỉ tài khoản có đúng email này nhận được lời mời.">
                <input id="email" name="email" type="email" className="input" autoComplete="off" />
              </Field>
              <Field label="Vai trò" name="role" hint={ROLE_HELP.contributor}>
                <select id="role" name="role" className="input" defaultValue="contributor">{roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
              </Field>
            </div>
            <Field label="Liên kết có hiệu lực trong" name="days">
              <select id="days" name="days" className="input sm:max-w-xs" defaultValue="7"><option value="1">1 ngày</option><option value="3">3 ngày</option><option value="7">7 ngày</option><option value="14">14 ngày</option><option value="30">30 ngày</option></select>
            </Field>
            <Submit busy={busy === "invite"} className="btn btn-sm" busyText="Đang tạo…">Tạo liên kết mời</Submit>
          </form>
          {link && <CopyField value={link} />}
        </div>
        {data.invites.length > 0 && (
          <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-warm">
            {data.invites.slice(0, 30).map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-[15.5px]">
                <span><span className="font-medium">{ROLE_LABEL[i.role]}</span>{i.email ? ` · ${i.email}` : " · mọi người có liên kết"}<span className="block text-[13.5px] text-stone">Tạo {formatDateTime(i.createdAt)} · hạn {formatDateTime(i.expiresAt)}</span></span>
                <span className="flex items-center gap-3"><span className="text-stone">{status(i)}</span>
                  {status(i) === "Đang chờ" && <button type="button" className="btn-soft btn-sm" disabled={busy === i.id} onClick={() => run(i.id, () => revokeInvite(ctx, i.id), "Đã thu hồi lời mời.")}>Thu hồi</button>}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tv"><h2 id="tv" className="mb-5 text-[1.6rem]">Thành viên có tài khoản</h2>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-warm">
          {data.members.map((m) => {
            const self = m.uid === ctx.user.uid;
            const locked = m.role === "owner" || (ctx.role === "admin" && m.role === "admin");
            return (
              <li key={m.uid} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <span className="flex items-center gap-3"><Avatar name={m.name} size={44} /><span><span className="font-medium">{m.name}{self ? " (bạn)" : ""}</span><span className="block text-[14px] text-stone">{ROLE_LABEL[m.role]}{m.joinedAt ? ` · từ ${formatDateTime(m.joinedAt)}` : ""}</span></span></span>
                <span className="flex flex-wrap items-center gap-2">
                  {!self && !locked && (
                    <>
                      <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); const r = new FormData(e.currentTarget).get("role") as Exclude<FamilyRole, "owner">; run(m.uid, () => setRole(ctx, m.uid, r), `Đã đổi vai trò của ${m.name}.`); }}>
                        <label className="sr-only" htmlFor={`r-${m.uid}`}>Vai trò của {m.name}</label>
                        <select id={`r-${m.uid}`} name="role" defaultValue={m.role} className="input !min-h-0 !w-auto !py-1.5 !text-[15px]">
                          {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                        </select>
                        <Submit busy={busy === m.uid} className="btn-soft btn-sm" busyText="…">Lưu</Submit>
                      </form>
                      <ConfirmButton label="Mời ra" question={`Mời ${m.name} ra khỏi gia đình?`} confirmLabel="Mời ra" onConfirm={() => run("rm" + m.uid, () => removeMember(ctx, m.uid), `Đã mời ${m.name} ra khỏi gia đình.`)} />
                    </>
                  )}
                  {!self && ctx.isOwner && (
                    <ConfirmButton label="Chuyển quyền chủ sở hữu" className="btn-soft btn-sm" question={`Chuyển quyền chủ sở hữu cho ${m.name}? Bạn sẽ thành quản trị viên.`} confirmLabel="Chuyển quyền"
                      onConfirm={async () => { await run("own", () => transferOwnership(ctx, m.uid)); await session.refresh(); }} />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="du-lieu-mau" id="du-lieu-mau"><h2 className="mb-2 text-[1.6rem]">Dữ liệu mẫu</h2>
        <p className="mb-5 text-stone">Năm ký ức và năm hồ sơ hoàn toàn giả lập để bạn xem cuốn sổ trông như thế nào. Xoá một lần là sạch, không ảnh hưởng nội dung thật.</p>
        <div className="flex flex-wrap gap-3">
          {data.demoCount === 0
            ? <button type="button" className="btn-soft" disabled={busy === "demo"} onClick={async () => { setBusy("demo"); try { await seedDemoData(ctx); nav("/family/memories"); } catch (x) { setMsg({ kind: "error", text: friendlyError(x) }); setBusy(null); } }}>{busy === "demo" ? "Đang thêm…" : "Thêm dữ liệu mẫu"}</button>
            : <ConfirmButton label="Xoá dữ liệu mẫu" className="btn-soft" question="Xoá toàn bộ ký ức và hồ sơ mẫu?" confirmLabel="Xoá dữ liệu mẫu" onConfirm={() => run("demo", () => clearDemoData(ctx), "Đã xoá dữ liệu mẫu.")} />}
        </div>
      </section>

      <section aria-labelledby="nguy" className="rounded-2xl border border-danger-line bg-danger-bg/70 p-6"><h2 id="nguy" className="mb-3 text-[1.5rem]">Khu vực cần cẩn thận</h2>
        {progress && <div className="mb-3"><Notice>{progress}</Notice></div>}
        <div className="flex flex-wrap gap-3">
          {!ctx.isOwner && <ConfirmButton label="Rời gia đình" className="btn-danger" question="Rời khỏi gia đình này? Ký ức “chỉ mình tôi” của bạn ở đây sẽ bị xoá." confirmLabel="Rời gia đình"
            onConfirm={async () => { try { await leaveFamily(ctx); await session.refresh(); nav("/family"); } catch (x) { setMsg({ kind: "error", text: friendlyError(x) }); } }} />}
          {ctx.isOwner && <ConfirmButton label="Xoá cả gia đình" className="btn-danger" question={`XOÁ VĨNH VIỄN “${ctx.familyName}” cùng toàn bộ ký ức, ảnh, hồ sơ của mọi người?`} confirmLabel="Xoá vĩnh viễn"
            onConfirm={async () => { try { await deleteFamily(ctx, setProgress); await session.refresh(); nav("/family"); } catch (x) { setProgress(null); setMsg({ kind: "error", text: friendlyError(x) }); } }} />}
        </div>
        {ctx.isOwner && <p className="mt-3 text-[14.5px] text-stone">Muốn rời gia đình? Hãy chuyển quyền chủ sở hữu cho người khác trước.</p>}
      </section>
    </div>
  );
}
