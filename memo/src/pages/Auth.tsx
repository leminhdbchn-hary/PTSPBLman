import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Field, Logo, Notice, Submit } from "@/components/ui";
import { useSession } from "@/lib/session";
import { emailSchema, loginSchema, registerSchema } from "@/lib/validation";
import { friendlyError } from "@/lib/data";
import { safeNext } from "@/lib/utils";

function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => { document.title = `${title} · Memo`; }, [title]);
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="container-page flex h-20 items-center"><Logo /></header>
      <main id="noi-dung" className="flex flex-1 items-start justify-center px-5 pb-20 pt-6 sm:pt-12">
        <div className="card w-full max-w-md p-7 sm:p-9">{children}</div>
      </main>
    </div>
  );
}

const fieldErrs = (issues: { path: (string | number)[]; message: string }[]) => {
  const out: Record<string, string> = {};
  for (const i of issues) { const k = String(i.path[0] ?? "form"); if (!out[k]) out[k] = i.message; }
  return out;
};

export function LoginPage() {
  const { fb } = useSession();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const next = safeNext(sp.get("next"));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string>>({});
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: f.get("email"), password: f.get("password") });
    if (!parsed.success) { setFe(fieldErrs(parsed.error.issues)); setErr("Bạn kiểm tra lại email và mật khẩu nhé."); return; }
    setFe({}); setErr(null); setBusy(true);
    try {
      await signInWithEmailAndPassword(fb!.auth, parsed.data.email, parsed.data.password);
      nav(next, { replace: true });
    } catch (x) {
      setErr(friendlyError(x, "Chưa đăng nhập được. Bạn thử lại nhé."));
      setBusy(false);
    }
  }
  return (
    <AuthShell title="Đăng nhập">
      <h1 className="text-[2rem]">Chào mừng trở lại</h1>
      <p className="mb-7 mt-2 text-stone">Đăng nhập để mở sổ ký ức của gia đình bạn.</p>
      <form onSubmit={submit} className="space-y-5" noValidate>
        {err && <Notice kind="error">{err}</Notice>}
        <Field label="Email" name="email" error={fe.email}><input id="email" name="email" type="email" autoComplete="email" className="input" required /></Field>
        <Field label="Mật khẩu" name="password" error={fe.password}><input id="password" name="password" type="password" autoComplete="current-password" className="input" required /></Field>
        <Submit busy={busy} className="btn w-full" busyText="Đang đăng nhập…">Đăng nhập</Submit>
        <p className="text-center text-[15px]"><Link to="/forgot-password" className="text-mossdark underline">Quên mật khẩu?</Link></p>
      </form>
      <p className="mt-7 text-center text-[15.5px]">Chưa có tài khoản? <Link to={sp.get("next") ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-medium text-ink underline">Tạo sổ gia đình</Link></p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { fb, setName } = useSession();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const next = safeNext(sp.get("next"), "/onboarding");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string>>({});
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = registerSchema.safeParse({ fullName: f.get("fullName"), email: f.get("email"), password: f.get("password") });
    if (!parsed.success) { setFe(fieldErrs(parsed.error.issues)); setErr("Bạn kiểm tra lại các ô bên dưới nhé."); return; }
    setFe({}); setErr(null); setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(fb!.auth, parsed.data.email, parsed.data.password);
      await updateProfile(cred.user, { displayName: parsed.data.fullName });
      await setDoc(doc(fb!.db, "nn_users", cred.user.uid), { fullName: parsed.data.fullName, bio: null, email: parsed.data.email, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setName(parsed.data.fullName);
      sendEmailVerification(cred.user).catch(() => {}); // không chặn người dùng nếu gửi email lỗi
      nav(next, { replace: true });
    } catch (x) {
      setErr(friendlyError(x, "Chưa tạo được tài khoản. Bạn thử lại nhé."));
      setBusy(false);
    }
  }
  return (
    <AuthShell title="Tạo tài khoản">
      <h1 className="text-[2rem]">Tạo sổ gia đình</h1>
      <p className="mb-7 mt-2 text-stone">Chỉ mất một phút. Sau đó bạn đặt tên cho gia đình và mời người thân.</p>
      <form onSubmit={submit} className="space-y-5" noValidate>
        {err && <Notice kind="error">{err}</Notice>}
        <Field label="Họ và tên" name="fullName" error={fe.fullName}><input id="fullName" name="fullName" autoComplete="name" className="input" required /></Field>
        <Field label="Email" name="email" error={fe.email}><input id="email" name="email" type="email" autoComplete="email" className="input" required /></Field>
        <Field label="Mật khẩu" name="password" hint="Ít nhất 8 ký tự, có cả chữ và số." error={fe.password}><input id="password" name="password" type="password" autoComplete="new-password" className="input" required minLength={8} /></Field>
        <Submit busy={busy} className="btn w-full" busyText="Đang tạo tài khoản…">Tạo tài khoản</Submit>
        <p className="text-center text-[14px] text-stone">Bằng việc đăng ký, bạn đồng ý với <Link to="/privacy" className="underline">chính sách bảo mật</Link> của Memo.</p>
      </form>
      <p className="mt-7 text-center text-[15.5px]">Đã có tài khoản? <Link to={sp.get("next") ? `/login?next=${encodeURIComponent(safeNext(sp.get("next")))}` : "/login"} className="font-medium text-ink underline">Đăng nhập</Link></p>
    </AuthShell>
  );
}

export function ForgotPage() {
  const { fb } = useSession();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(new FormData(e.currentTarget).get("email"));
    if (!parsed.success) { setErr("Email chưa đúng định dạng."); return; }
    setBusy(true); setErr(null);
    // Luôn báo như nhau dù email có tài khoản hay không, để không lộ ai đã đăng ký
    try { await sendPasswordResetEmail(fb!.auth, parsed.data); } catch { /* cố ý bỏ qua */ }
    setDone(true); setBusy(false);
  }
  return (
    <AuthShell title="Quên mật khẩu">
      <h1 className="text-[2rem]">Quên mật khẩu</h1>
      {done ? (
        <div className="mt-6 space-y-5">
          <Notice kind="success">Nếu email này có tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu. Bạn kiểm tra hộp thư (cả mục Spam) nhé.</Notice>
          <Link to="/login" className="btn-soft w-full">Về trang đăng nhập</Link>
        </div>
      ) : (
        <>
          <p className="mb-7 mt-2 text-stone">Nhập email bạn dùng để đăng nhập, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
          <form onSubmit={submit} className="space-y-5" noValidate>
            {err && <Notice kind="error">{err}</Notice>}
            <Field label="Email" name="email"><input id="email" name="email" type="email" autoComplete="email" className="input" required /></Field>
            <Submit busy={busy} className="btn w-full" busyText="Đang gửi…">Gửi liên kết</Submit>
          </form>
        </>
      )}
    </AuthShell>
  );
}
