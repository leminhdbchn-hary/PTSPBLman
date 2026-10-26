import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Field, Loading, Logo, Notice, Submit } from "@/components/ui";
import { useAsync, useSession } from "@/lib/session";
import { cleanupBeforeAccountDeletion, exportFamily, friendlyError, leaveFamily, listMemories, saveProfile } from "@/lib/data";
import { passwordSchema, profileSchema } from "@/lib/validation";
import { downloadJson, slug } from "@/lib/download";

type Msg = { kind: "error" | "success"; text: string } | null;

export default function Settings() {
  const s = useSession();
  const nav = useNavigate();
  const [pm, setPm] = useState<Msg>(null), [pw, setPw] = useState<Msg>(null), [dm, setDm] = useState<Msg>(null), [xm, setXm] = useState<Msg>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { document.title = "Cài đặt · Memo"; }, []);
  const prof = useAsync(async () => (s.fb && s.user ? (await getDoc(doc(s.fb.db, "nn_users", s.user.uid)).catch(() => null))?.data() ?? null : null), [s.user?.uid]);
  if (s.loading) return <Loading />;
  if (!s.user || !s.fb || !s.fbUser) return <Navigate to="/login?next=%2Fsettings" replace />;
  const user = s.user, fb = s.fb, fbUser = s.fbUser;
  const active = s.active;
  const ctx = active ? { db: fb.db, user, fid: active.id, role: active.role } : null;
  const reauth = (password: string) => reauthenticateWithCredential(fbUser, EmailAuthProvider.credential(fbUser.email ?? "", password));

  async function saveProf(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = profileSchema.safeParse({ fullName: f.get("fullName"), bio: f.get("bio") });
    if (!parsed.success) { setPm({ kind: "error", text: parsed.error.issues[0].message }); return; }
    setBusy("p"); setPm(null);
    try {
      await saveProfile(fb.db, user, parsed.data.fullName, parsed.data.bio);
      await updateProfile(fbUser, { displayName: parsed.data.fullName });
      s.setName(parsed.data.fullName);
      setPm({ kind: "success", text: "Đã lưu hồ sơ của bạn." });
    } catch (x) { setPm({ kind: "error", text: friendlyError(x) }); }
    setBusy(null);
  }
  async function changePw(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const next = String(f.get("password") ?? "");
    const v = passwordSchema.safeParse(next);
    if (!v.success) { setPw({ kind: "error", text: v.error.issues[0].message }); return; }
    if (next !== f.get("confirm")) { setPw({ kind: "error", text: "Hai mật khẩu chưa khớp." }); return; }
    setBusy("pw"); setPw(null);
    try {
      await reauth(String(f.get("current") ?? ""));
    } catch {
      setPw({ kind: "error", text: "Mật khẩu hiện tại chưa đúng." }); setBusy(null); return;
    }
    try { await updatePassword(fbUser, next); setPw({ kind: "success", text: "Đã đổi mật khẩu." }); form.reset(); } catch (x) { setPw({ kind: "error", text: friendlyError(x, "Chưa đổi được mật khẩu.") }); }
    setBusy(null);
  }
  async function exportData(scope: "me" | "family") {
    if (!ctx || !active) return;
    setBusy("x" + scope); setXm(null);
    try {
      if (scope === "family") {
        downloadJson(`memo-${slug(active.name)}.json`, { scope, ...(await exportFamily(ctx, active.name)) });
      } else {
        const mine = (await listMemories(ctx)).filter((m) => m.createdBy === user.uid).map(({ cover: _c, ...m }) => ({ ...m, createdAt: m.createdAt?.toDate().toISOString() ?? null, updatedAt: m.updatedAt?.toDate().toISOString() ?? null }));
        downloadJson(`memo-cua-toi.json`, { scope, exportedAt: new Date().toISOString(), account: { name: user.name, email: user.email, bio: prof.data?.bio ?? null }, family: { id: active.id, name: active.name }, memories: mine });
      }
      setXm({ kind: "success", text: "Đã tạo tệp. Trình duyệt sẽ tải về máy." });
    } catch (x) { setXm({ kind: "error", text: friendlyError(x) }); }
    setBusy(null);
  }
  async function removeAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (String(f.get("confirm") ?? "").trim().toUpperCase() !== "XOA") { setDm({ kind: "error", text: "Bạn gõ chữ XOA vào ô xác nhận để tiếp tục." }); return; }
    setBusy("del"); setDm(null);
    try { await reauth(String(f.get("password") ?? "")); } catch { setDm({ kind: "error", text: "Mật khẩu chưa đúng." }); setBusy(null); return; }
    try {
      await cleanupBeforeAccountDeletion(fb.db, user);
      await deleteUser(fbUser);
      nav("/?deleted=1", { replace: true });
    } catch (x) { setDm({ kind: "error", text: friendlyError(x, "Chưa xoá được tài khoản.") }); setBusy(null); }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="container-page flex h-20 items-center justify-between"><Logo to={active ? "/family" : "/onboarding"} /><Link to={active ? "/family" : "/onboarding"} className="btn-soft btn-sm">← Về sổ gia đình</Link></header>
      <main id="noi-dung" className="container-page max-w-3xl flex-1 space-y-14 py-10">
        <h1 className="text-[2.4rem]">Cài đặt</h1>

        <section aria-labelledby="hs"><h2 id="hs" className="mb-5 text-[1.6rem]">Hồ sơ của bạn</h2>
          <div className="card p-6">
            {prof.loading ? <Loading label="Đang tải…" /> : (
              <form onSubmit={saveProf} className="space-y-4">
                {pm && <Notice kind={pm.kind}>{pm.text}</Notice>}
                <p className="text-[15px] text-stone">Email đăng nhập: <span className="text-ink">{user.email}</span></p>
                <Field label="Họ và tên" name="fullName"><input id="fullName" name="fullName" className="input" defaultValue={String(prof.data?.fullName ?? user.name)} maxLength={100} required /></Field>
                <Field label="Vài dòng về bạn" name="bio"><textarea id="bio" name="bio" className="input min-h-[90px]" defaultValue={String(prof.data?.bio ?? "")} maxLength={1000} /></Field>
                <Submit busy={busy === "p"} className="btn btn-sm" busyText="Đang lưu…">Lưu hồ sơ</Submit>
              </form>
            )}
          </div>
        </section>

        <section aria-labelledby="mk"><h2 id="mk" className="mb-5 text-[1.6rem]">Mật khẩu</h2>
          <div className="card p-6">
            <form onSubmit={changePw} className="space-y-4">
              {pw && <Notice kind={pw.kind}>{pw.text}</Notice>}
              <Field label="Mật khẩu hiện tại" name="current"><input id="current" name="current" type="password" autoComplete="current-password" className="input" required /></Field>
              <Field label="Mật khẩu mới" name="password" hint="Ít nhất 8 ký tự, có cả chữ và số."><input id="password" name="password" type="password" autoComplete="new-password" className="input" required /></Field>
              <Field label="Nhập lại mật khẩu mới" name="confirm"><input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" required /></Field>
              <Submit busy={busy === "pw"} className="btn btn-sm" busyText="Đang lưu…">Đổi mật khẩu</Submit>
            </form>
          </div>
        </section>

        <section aria-labelledby="rt"><h2 id="rt" className="mb-3 text-[1.6rem]">Quyền riêng tư và dữ liệu</h2>
          <div className="card space-y-5 p-6 text-[16.5px]">
            <p>Ký ức của bạn chỉ hiển thị với người trong gia đình, theo chế độ bạn chọn cho từng ký ức. Nội dung không công khai và không dùng để huấn luyện AI. Ngày sinh trong hồ sơ thành viên mặc định được ẩn với người khác.</p>
            <p><Link to="/privacy" className="underline">Đọc chính sách bảo mật</Link></p>
            {xm && <Notice kind={xm.kind}>{xm.text}</Notice>}
            {active && (
              <div className="flex flex-wrap gap-3 pt-1">
                <button type="button" className="btn-soft btn-sm" disabled={!!busy} onClick={() => exportData("me")}>{busy === "xme" ? "Đang tạo tệp…" : "Tải ký ức của tôi (JSON)"}</button>
                {(active.role === "owner" || active.role === "admin") && <button type="button" className="btn-soft btn-sm" disabled={!!busy} onClick={() => exportData("family")}>{busy === "xfamily" ? "Đang tạo tệp…" : "Tải dữ liệu cả gia đình (JSON)"}</button>}
              </div>
            )}
            <p className="text-[14.5px] text-stone">Tệp tải về gồm chữ (ký ức, hồ sơ, quan hệ, lời nhắn) và số lượng ảnh. Ảnh chưa nằm trong tệp; hãy giữ bản gốc trong điện thoại của bạn.</p>
          </div>
        </section>

        {active && active.role !== "owner" && ctx && (
          <section aria-labelledby="roi"><h2 id="roi" className="mb-3 text-[1.6rem]">Gia đình “{active.name}”</h2>
            <button type="button" className="btn-danger" disabled={!!busy} onClick={async () => { setBusy("leave"); try { await leaveFamily(ctx); await s.refresh(); nav("/family"); } catch (x) { setXm({ kind: "error", text: friendlyError(x) }); setBusy(null); } }}>{busy === "leave" ? "Đang rời…" : "Rời khỏi gia đình"}</button>
          </section>
        )}

        <section aria-labelledby="xoa-tk" className="rounded-2xl border border-danger-line bg-danger-bg/70 p-6">
          <h2 id="xoa-tk" className="mb-3 text-[1.5rem]">Xoá tài khoản</h2>
          <p className="mb-5 text-[16px]">Tài khoản bị xoá ngay và không khôi phục được. Ký ức “chỉ mình tôi” của bạn bị xoá; ký ức chia sẻ với gia đình vẫn được giữ lại cho mọi người. Nếu bạn là chủ sở hữu một gia đình còn người khác, hãy chuyển quyền trước; gia đình chỉ có mình bạn sẽ bị xoá luôn.</p>
          <form onSubmit={removeAccount} className="space-y-4">
            {dm && <Notice kind={dm.kind}>{dm.text}</Notice>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mật khẩu" name="delpw"><input id="delpw" name="password" type="password" autoComplete="current-password" className="input" required /></Field>
              <Field label="Gõ XOA để xác nhận" name="xoa"><input id="xoa" name="confirm" className="input" autoComplete="off" /></Field>
            </div>
            <Submit busy={busy === "del"} className="btn-danger btn-sm" busyText="Đang xoá…">Xoá tài khoản vĩnh viễn</Submit>
          </form>
        </section>
      </main>
    </div>
  );
}
