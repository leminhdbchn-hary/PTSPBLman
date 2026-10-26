import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Field, Loading, Logo, Notice, Submit } from "@/components/ui";
import { useSession } from "@/lib/session";
import { familySchema } from "@/lib/validation";
import { acceptInvite, createFamily, friendlyError, previewInvite, type InvitePreview } from "@/lib/data";
import { ROLE_LABEL } from "@/lib/types";

export function OnboardingPage() {
  const { fb, user, families, refresh, setActive, loading } = useSession();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { document.title = "Bắt đầu · Nếp Nhà"; }, []);
  if (loading) return <Loading />;
  if (families.length) return <Navigate to="/family" replace />;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = familySchema.safeParse({ name: new FormData(e.currentTarget).get("name") });
    if (!parsed.success) { setErr(parsed.error.issues[0].message); return; }
    setBusy(true); setErr(null);
    try {
      const id = await createFamily(fb!.db, user!, parsed.data.name);
      setActive(id);
      await refresh();
      nav("/family", { replace: true });
    } catch (x) {
      setErr(friendlyError(x, "Chưa tạo được gia đình. Bạn thử lại nhé."));
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container-page flex h-20 items-center"><Logo to="/onboarding" /></header>
      <main id="noi-dung" className="flex flex-1 items-start justify-center px-5 pb-20 pt-6 sm:pt-12">
        <div className="w-full max-w-md">
          <p className="eyebrow mb-3">Chào {user?.name || "bạn"}</p>
          <h1 className="text-[2.2rem]">Hãy đặt tên cho gia đình</h1>
          <p className="mb-8 mt-3 text-stone">Đây sẽ là cuốn sổ riêng của gia đình bạn. Bạn là chủ sở hữu và quyết định mời ai vào.</p>
          <div className="card p-7">
            <form onSubmit={submit} className="space-y-5" noValidate>
              {err && <Notice kind="error">{err}</Notice>}
              <Field label="Tên gia đình" name="name" hint="VD: Gia đình họ Nguyễn, Nhà mình…"><input id="name" name="name" className="input" maxLength={80} required /></Field>
              <Submit busy={busy} className="btn w-full" busyText="Đang tạo…">Tạo sổ gia đình</Submit>
            </form>
          </div>
          <p className="mt-8 text-center text-[15.5px] text-stone">Được người thân mời? Hãy mở liên kết mời họ đã gửi, bạn sẽ vào thẳng gia đình đó.</p>
          <form onSubmit={async (e) => { e.preventDefault(); await fb?.auth.signOut(); nav("/"); }} className="mt-4 text-center"><button className="text-[15px] text-stone underline" type="submit">Đăng xuất</button></form>
        </div>
      </main>
    </div>
  );
}

export function InvitePage() {
  const { fid = "", token = "" } = useParams();
  const { fb, user, loading, refresh, setActive } = useSession();
  const nav = useNavigate();
  const [info, setInfo] = useState<InvitePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { document.title = "Lời mời vào gia đình · Nếp Nhà"; }, []);
  useEffect(() => { if (fb) previewInvite(fb.db, fid, token).then(setInfo, () => setInfo({ ok: false, reason: "Liên kết mời không hợp lệ." })); }, [fb, fid, token]);
  const next = `/invite/${fid}/${token}`;
  async function join() {
    setBusy(true); setErr(null);
    try {
      await acceptInvite(fb!.db, user!, fid, token);
      setActive(fid);
      await refresh();
      nav("/family", { replace: true });
    } catch (x) {
      setErr(friendlyError(x, "Chưa nhận được lời mời."));
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container-page flex h-20 items-center"><Logo /></header>
      <main id="noi-dung" className="flex flex-1 items-start justify-center px-5 pb-20 pt-6 sm:pt-12">
        <div className="card w-full max-w-md p-8 text-center">
          {!info || loading ? <Loading label="Đang mở lời mời…" /> : !info.ok ? (
            <>
              <h1 className="text-[1.9rem]">Lời mời không dùng được</h1>
              <p className="mt-3 text-stone">{info.reason}</p>
              <Link to="/" className="btn-soft mt-7">Về trang chủ</Link>
            </>
          ) : (
            <>
              <p className="eyebrow mb-3">Bạn được mời</p>
              <h1 className="text-[2rem]">Tham gia “{info.invite.familyName}”</h1>
              <p className="mb-7 mt-3 text-stone">Với vai trò <strong className="text-ink">{ROLE_LABEL[info.invite.role]}</strong>. Bạn sẽ cùng xem và lưu giữ cuốn sổ ký ức của gia đình.</p>
              {err && <div className="mb-4 text-left"><Notice kind="error">{err}</Notice></div>}
              {user ? (
                <button className="btn w-full" disabled={busy} aria-busy={busy} onClick={join}>{busy ? "Đang tham gia…" : "Tham gia gia đình"}</button>
              ) : (
                <div className="space-y-3">
                  <Link to={`/register?next=${encodeURIComponent(next)}`} className="btn w-full">Tạo tài khoản để tham gia</Link>
                  <Link to={`/login?next=${encodeURIComponent(next)}`} className="btn-soft w-full">Tôi đã có tài khoản</Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
