import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ConfirmButton, LinkBtn, Loading, Notice, PageTitle, Submit, ErrorState } from "@/components/ui";
import { Gallery } from "@/components/Gallery";
import { MemoryCard } from "@/components/MemoryCard";
import { MemoryForm } from "@/components/MemoryForm";
import NotFound from "./NotFound";
import { useAsync, useFamily } from "@/lib/session";
import { addComment, deleteComment, deleteMemory, friendlyError, getMemory, getPhotos, listComments, listMemories, listPeople } from "@/lib/data";
import { commentSchema } from "@/lib/validation";
import { VISIBILITY_LABEL, type Memory } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";

export function NewMemoryPage() {
  const ctx = useFamily();
  const people = useAsync(() => listPeople(ctx), [ctx.fid]);
  if (!ctx.canWrite) return <Navigate to="/family/memories" replace />;
  return (
    <>
      <PageTitle eyebrow="Trang mới" title="Thêm một ký ức" />
      {people.loading ? <Loading /> : <MemoryForm ctx={ctx} people={people.data ?? []} />}
    </>
  );
}

export function EditMemoryPage() {
  const { id = "" } = useParams();
  const ctx = useFamily();
  const { data, loading, error, reload } = useAsync(async () => {
    const m = await getMemory(ctx, id);
    return { m, photos: m ? await getPhotos(ctx, m) : [], people: await listPeople(ctx) };
  }, [ctx.fid, id]);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={friendlyError(error)} onRetry={reload} />;
  if (!data?.m) return <NotFound inside />;
  const canEdit = (ctx.canWrite && data.m.createdBy === ctx.user.uid) || (ctx.isAdmin && data.m.visibility !== "private");
  if (!canEdit) return <Navigate to={`/family/memories/${id}`} replace />;
  return (
    <>
      <PageTitle eyebrow="Sửa ký ức" title={data.m.title} />
      <MemoryForm ctx={ctx} people={data.people} existing={data.m} photos={data.photos} />
    </>
  );
}

function related(all: Memory[], m: Memory) {
  return all
    .filter((x) => x.id !== m.id)
    .map((x) => ({ x, score: x.tags.filter((t) => m.tags.includes(t)).length + 2 * x.personIds.filter((p) => m.personIds.includes(p)).length }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((r) => r.x);
}

export function MemoryDetailPage() {
  const { id = "" } = useParams();
  const ctx = useFamily();
  const nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useAsync(async () => {
    const m = await getMemory(ctx, id);
    if (!m) return null;
    const [photos, people, comments, all] = await Promise.all([getPhotos(ctx, m), listPeople(ctx), listComments(ctx, id), listMemories(ctx)]);
    const idx = all.findIndex((x) => x.id === m.id);
    return { m, photos, people, comments, related: related(all, m), older: idx >= 0 ? all[idx + 1] ?? null : null, newer: idx > 0 ? all[idx - 1] : null };
  }, [ctx.fid, id]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={friendlyError(error)} onRetry={reload} />;
  if (!data) return <NotFound inside />;
  const { m, photos, people, comments } = data;
  const names = new Map(people.map((p) => [p.id, p.fullName]));
  const canEdit = (ctx.canWrite && m.createdBy === ctx.user.uid) || (ctx.isAdmin && m.visibility !== "private");
  const canDelete = m.createdBy === ctx.user.uid || canEdit;
  const images = [...photos.map((p) => ({ url: p.data, caption: null })), ...m.demoImages.map((u) => ({ url: u, caption: "Hình minh hoạ" }))];
  const created = m.createdAt ? formatDateTime(m.createdAt) : "";
  const updated = m.updatedAt && m.createdAt && m.updatedAt.toMillis() - m.createdAt.toMillis() > 60_000 ? formatDateTime(m.updatedAt) : null;

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = commentSchema.safeParse({ body: new FormData(form).get("body") });
    if (!parsed.success) { setErr(parsed.error.issues[0].message); return; }
    setBusy(true); setErr(null);
    try { await addComment(ctx, m.id, parsed.data.body); form.reset(); reload(); } catch (x) { setErr(friendlyError(x, "Chưa gửi được lời nhắn.")); }
    setBusy(false);
  }

  return (
    <article className="mx-auto max-w-3xl">
      <Link to="/family/memories" className="tap text-[15px] text-stone underline">← Dòng thời gian</Link>
      <header className="mb-8 mt-5">
        <p className="eyebrow">{formatDate(m.happenedOn)}{m.location ? ` · ${m.location}` : ""}{m.isDemo ? " · Dữ liệu mẫu" : ""}</p>
        <h1 className="mt-3 text-[2.1rem] leading-tight sm:text-[3.1rem]">{m.title}</h1>
        <p className="mt-4 text-[14.5px] text-stone">
          Ghi lại bởi {m.createdByName}{created ? ` · đăng ngày ${created}` : ""}{updated ? ` · sửa ${updated}` : ""} · {VISIBILITY_LABEL[m.visibility]}
        </p>
      </header>

      {images.length > 0 && <div className="mb-10"><Gallery images={images} title={m.title} /></div>}
      {photos.length < m.photoIds.length && <div className="mb-8"><Notice kind="error">Có {m.photoIds.length - photos.length} ảnh chưa hiển thị được. Hãy tải lại trang hoặc thử lại sau.</Notice></div>}

      {m.body ? <div className="whitespace-pre-line text-[1.12rem] leading-[1.9]">{m.body}</div> : <p className="text-stone">Ký ức này chưa có lời kể.</p>}

      {(m.personIds.length > 0 || m.tags.length > 0) && (
        <div className="mt-8 flex flex-wrap gap-2 text-[14.5px]">
          {m.personIds.filter((p) => names.has(p)).map((p) => <Link key={p} to={`/family/members/${p}`} className="inline-flex min-h-[40px] items-center rounded-full bg-cream px-3.5 text-ink no-underline hover:bg-line">{names.get(p)}</Link>)}
          {m.tags.map((t) => <Link key={t} to={`/family/memories?tag=${encodeURIComponent(t)}`} className="inline-flex min-h-[40px] items-center rounded-full border border-line px-3.5 text-stone no-underline hover:border-stone">{t}</Link>)}
        </div>
      )}

      {(canEdit || canDelete) && (
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          {canEdit && <LinkBtn to={`/family/memories/${m.id}/edit`} soft sm>Sửa ký ức</LinkBtn>}
          <ConfirmButton label="Xoá ký ức" question={`Xoá “${m.title}” cùng ảnh và lời nhắn? Không khôi phục được.`} confirmLabel="Xoá hẳn"
            onConfirm={async () => { try { await deleteMemory(ctx, m); nav("/family/memories?deleted=1", { replace: true }); } catch (x) { setErr(friendlyError(x)); } }} />
        </div>
      )}

      <section className="mt-14" aria-labelledby="binh-luan">
        <h2 id="binh-luan" className="mb-5 text-[1.6rem]">Lời nhắn của cả nhà</h2>
        {comments.length === 0 && <p className="mb-6 text-stone">Chưa có lời nhắn nào.</p>}
        <ul className="mb-6 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="card px-5 py-4">
              <div className="flex items-baseline justify-between gap-3"><span className="font-medium">{c.authorName}</span><span className="text-[13.5px] text-stone">{c.createdAt ? formatDateTime(c.createdAt) : "vừa xong"}</span></div>
              <p className="mt-1 whitespace-pre-line">{c.body}</p>
              {(c.authorId === ctx.user.uid || ctx.isAdmin) && (
                <div className="mt-2"><ConfirmButton label="Xoá" className="text-[14px] text-stone underline" question="Xoá lời nhắn này?" confirmLabel="Xoá"
                  onConfirm={async () => { try { await deleteComment(ctx, m.id, c.id); reload(); } catch (x) { setErr(friendlyError(x)); } }} /></div>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={send} className="space-y-3">
          <label htmlFor="cbody" className="label">Viết lời nhắn cho cả nhà</label>
          <textarea id="cbody" name="body" className="input min-h-[90px]" maxLength={2000} required />
          {err && <Notice kind="error">{err}</Notice>}
          <Submit busy={busy} className="btn btn-sm" busyText="Đang gửi…">Gửi</Submit>
        </form>
      </section>

      {(data.older || data.newer) && (
        <nav aria-label="Ký ức kế tiếp" className="mt-14 grid gap-3 sm:grid-cols-2">
          {data.older ? <Link to={`/family/memories/${data.older.id}`} className="card block p-4 text-ink no-underline hover:border-stone"><span className="eyebrow">← Ký ức trước</span><span className="mt-1 block truncate font-serif text-[1.15rem]">{data.older.title}</span></Link> : <span />}
          {data.newer ? <Link to={`/family/memories/${data.newer.id}`} className="card block p-4 text-ink no-underline hover:border-stone sm:text-right"><span className="eyebrow">Ký ức sau →</span><span className="mt-1 block truncate font-serif text-[1.15rem]">{data.newer.title}</span></Link> : <span />}
        </nav>
      )}

      {data.related.length > 0 && (
        <section className="mt-16" aria-labelledby="lien-quan">
          <h2 id="lien-quan" className="mb-5 text-[1.6rem]">Ký ức liên quan</h2>
          <div className="grid gap-5 sm:grid-cols-2">{data.related.map((r) => <MemoryCard key={r.id} m={r} names={names} compact />)}</div>
        </section>
      )}
    </article>
  );
}
