import { useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Avatar, ConfirmButton, EmptyState, Field, LinkBtn, Loading, Notice, PageTitle } from "@/components/ui";
import { MemoryCard } from "@/components/MemoryCard";
import NotFound from "./NotFound";
import { useAsync, useFamily } from "@/lib/session";
import { deletePerson, friendlyError, getPerson, getPrivateBirthDate, listMemories, listPeople, savePerson } from "@/lib/data";
import { checkFile } from "@/lib/image";
import { AvatarCropper } from "@/components/AvatarCropper";
import { personSchema } from "@/lib/validation";
import type { Person } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function MembersPage() {
  const ctx = useFamily();
  const [sp] = useSearchParams();
  const { data, loading, error } = useAsync(() => listPeople(ctx), [ctx.fid]);
  if (loading) return <Loading />;
  if (error || !data) return <Notice kind="error">{friendlyError(error)}</Notice>;
  return (
    <>
      <PageTitle eyebrow="Gia đình" title="Những người thân yêu">{ctx.canWrite && <LinkBtn to="/family/members/new">Thêm hồ sơ</LinkBtn>}</PageTitle>
      {sp.get("deleted") && <div className="mb-6"><Notice kind="success">Đã xoá hồ sơ.</Notice></div>}
      {data.length === 0 ? (
        <EmptyState title="Chưa có hồ sơ nào" action={ctx.canWrite ? <LinkBtn to="/family/members/new">Thêm hồ sơ đầu tiên</LinkBtn> : undefined}>Hồ sơ giúp gắn ký ức với từng người thân, kể cả người chưa dùng website.</EmptyState>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <li key={p.id}>
              <Link to={`/family/members/${p.id}`} className="card flex items-center gap-4 p-5 text-ink no-underline transition hover:border-stone">
                <Avatar name={p.fullName} url={p.avatar} size={64} />
                <span className="min-w-0"><span className="block truncate font-serif text-[1.3rem]">{p.fullName}</span>
                  <span className="block truncate text-[15px] text-stone">{p.relationLabel || "Thành viên"}{p.userId ? " · có tài khoản" : ""}{p.isDemo ? " · mẫu" : ""}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const canEditPerson = (ctx: ReturnType<typeof useFamily>, p: Person) => ctx.isAdmin || (ctx.canWrite && p.createdBy === ctx.user.uid) || p.userId === ctx.user.uid;

export function PersonPage() {
  const { id = "" } = useParams();
  const ctx = useFamily();
  const nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const { data, loading, error } = useAsync(async () => {
    const p = await getPerson(ctx, id);
    if (!p) return null;
    const [people, memories, privateBirth] = await Promise.all([listPeople(ctx), listMemories(ctx), getPrivateBirthDate(ctx, id)]);
    return { p, people, memories: memories.filter((m) => m.personIds.includes(id)), privateBirth };
  }, [ctx.fid, id]);
  if (loading) return <Loading />;
  if (error) return <Notice kind="error">{friendlyError(error)}</Notice>;
  if (!data) return <NotFound inside />;
  const { p } = data;
  const names = new Map(data.people.map((x) => [x.id, x.fullName]));
  const birth = p.birthDate ?? data.privateBirth;
  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/family/members" className="tap text-[15px] text-stone underline">← Thành viên</Link>
      {err && <div className="mt-4"><Notice kind="error">{err}</Notice></div>}
      <header className="mt-6 flex flex-wrap items-center gap-6">
        <Avatar name={p.fullName} url={p.avatar} size={112} />
        <div>
          <h1 className="text-[2.4rem]">{p.fullName}</h1>
          <p className="mt-1 text-stone">{p.relationLabel || "Thành viên gia đình"}{birth ? ` · sinh ${formatDate(birth)}` : ""}{p.isDemo ? " · hồ sơ mẫu" : ""}</p>
          {data.privateBirth && <p className="text-[14px] text-stone">Ngày sinh đang ẩn với người khác trong gia đình.</p>}
        </div>
      </header>
      {p.bio && <p className="mt-8 max-w-read whitespace-pre-line text-[1.1rem] leading-[1.85]">{p.bio}</p>}
      {canEditPerson(ctx, p) && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <LinkBtn to={`/family/members/${p.id}/edit`} soft sm>Sửa hồ sơ</LinkBtn>
          {!p.userId && (ctx.isAdmin || p.createdBy === ctx.user.uid) && (
            <ConfirmButton label="Xoá hồ sơ" question={`Xoá hồ sơ ${p.fullName}? Quan hệ gia phả của người này cũng bị xoá (ký ức vẫn giữ).`} confirmLabel="Xoá hồ sơ"
              onConfirm={async () => { try { await deletePerson(ctx, p); nav("/family/members?deleted=1", { replace: true }); } catch (x) { setErr(friendlyError(x)); } }} />
          )}
        </div>
      )}
      <section className="mt-14" aria-labelledby="ky-uc">
        <h2 id="ky-uc" className="mb-6 text-[1.7rem]">Ký ức có {p.fullName}</h2>
        {data.memories.length === 0 ? <p className="text-stone">Chưa có ký ức nào gắn với người này.</p> : <div className="grid gap-5 sm:grid-cols-2">{data.memories.map((m) => <MemoryCard key={m.id} m={m} names={names} compact />)}</div>}
      </section>
    </div>
  );
}

function PersonForm({ existing, privateBirth }: { existing?: Person; privateBirth?: string | null }) {
  const ctx = useFamily();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string>>({});
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined); // undefined = giữ nguyên
  const [cropFile, setCropFile] = useState<File | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const preview = avatar === undefined ? existing?.avatar ?? null : avatar;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setFe({});
    const f = new FormData(e.currentTarget);
    const parsed = personSchema.safeParse({ fullName: f.get("fullName"), relationLabel: f.get("relationLabel"), birthDate: f.get("birthDate"), birthDateVisible: f.get("birthDateVisible") === "on", bio: f.get("bio") });
    if (!parsed.success) {
      const out: Record<string, string> = {};
      for (const i of parsed.error.issues) { const k = String(i.path[0]); if (!out[k]) out[k] = i.message; }
      setFe(out); setError("Bạn kiểm tra lại các ô bên dưới nhé.");
      return;
    }
    setBusy(true);
    try {
      const id = await savePerson(ctx, { ...parsed.data, avatar }, existing);
      nav(`/family/members/${id}`, { replace: !!existing });
    } catch (x) {
      setError(friendlyError(x, "Chưa lưu được hồ sơ."));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-read space-y-6" noValidate>
      {cropFile && <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onDone={(d) => { setAvatar(d); setCropFile(null); }} />}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="flex flex-wrap items-center gap-5">
        <Avatar name={existing?.fullName || "?"} url={preview} size={88} />
        <div className="flex gap-2">
          <button type="button" className="btn-soft" onClick={() => ref.current?.click()}>{preview ? "Đổi ảnh đại diện" : "Thêm ảnh đại diện"}</button>
          {preview && cropFile === null && <span className="sr-only">Ảnh đại diện đã chọn</span>}
          {preview && <button type="button" className="btn-soft" onClick={() => setAvatar(null)}>Bỏ ảnh</button>}
          <input ref={ref} type="file" accept="image/*" className="sr-only" aria-label="Chọn ảnh đại diện"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ""; // cho phép chọn lại đúng ảnh vừa chọn
              if (!file) return;
              const er = checkFile(file);
              if (er) { setError(er); return; }
              setError(null); setCropFile(file);
            }} />
        </div>
      </div>
      <Field label="Họ và tên" name="fullName" error={fe.fullName}>
        <input id="fullName" name="fullName" className="input" defaultValue={existing?.fullName} maxLength={100} required />
      </Field>
      <Field label="Vai trò trong gia đình" name="relationLabel" hint="VD: Ông nội, Mẹ, Con gái, Chú Hùng…">
        <input id="relationLabel" name="relationLabel" className="input" defaultValue={existing?.relationLabel ?? ""} maxLength={40} />
      </Field>
      <Field label="Ngày sinh (không bắt buộc)" name="birthDate" error={fe.birthDate}>
        <input id="birthDate" name="birthDate" type="date" className="input" defaultValue={existing?.birthDate ?? privateBirth ?? ""} />
      </Field>
      <label className="flex items-start gap-3 text-[16px]">
        <input type="checkbox" name="birthDateVisible" defaultChecked={existing?.birthDateVisible ?? false} className="mt-1.5 h-5 w-5 accent-ink" />
        <span>Cho cả gia đình xem ngày sinh<span className="hint block">Nếu không chọn, chỉ quản trị viên, người tạo hồ sơ và chính người đó thấy ngày sinh.</span></span>
      </label>
      <Field label="Tiểu sử, vài dòng về người này" name="bio">
        <textarea id="bio" name="bio" className="input min-h-[140px]" defaultValue={existing?.bio ?? ""} maxLength={3000} />
      </Field>
      <div className="flex gap-4">
        <button className="btn" type="submit" disabled={busy} aria-busy={busy}>{busy ? "Đang lưu…" : existing ? "Lưu thay đổi" : "Thêm hồ sơ"}</button>
        <button type="button" className="btn-soft" disabled={busy} onClick={() => nav(-1)}>Huỷ</button>
      </div>
    </form>
  );
}

export function NewPersonPage() {
  const ctx = useFamily();
  if (!ctx.canWrite) return <Navigate to="/family/members" replace />;
  return (<><PageTitle eyebrow="Hồ sơ mới" title="Thêm người thân" /><PersonForm /></>);
}

export function EditPersonPage() {
  const { id = "" } = useParams();
  const ctx = useFamily();
  const { data, loading } = useAsync(async () => {
    const p = await getPerson(ctx, id);
    return p ? { p, privateBirth: await getPrivateBirthDate(ctx, id) } : null;
  }, [ctx.fid, id]);
  if (loading) return <Loading />;
  if (!data) return <NotFound inside />;
  if (!canEditPerson(ctx, data.p)) return <Navigate to={`/family/members/${id}`} replace />;
  return (<><PageTitle eyebrow="Sửa hồ sơ" title={data.p.fullName} /><PersonForm existing={data.p} privateBirth={data.privateBirth} /></>);
}
