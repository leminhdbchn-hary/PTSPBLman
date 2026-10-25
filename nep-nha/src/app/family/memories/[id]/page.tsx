import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFamily } from "@/lib/session";
import { listPeople } from "@/lib/data/people";
import { getMemory, relatedMemories } from "@/lib/data/memories";
import { Gallery } from "@/components/Gallery";
import { MemoryCard } from "@/components/MemoryCard";
import { CommentForm } from "@/components/CommentForm";
import { ConfirmForm } from "@/components/ConfirmForm";
import { LinkBtn, Notice } from "@/components/ui";
import { deleteComment, deleteMemory } from "@/app/actions/memories";
import { formatDate, formatDateTime } from "@/lib/utils";
import { VISIBILITY_LABEL } from "@/lib/types";

export const metadata: Metadata = { title: "Ký ức" };

export default async function MemoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireFamily();
  const people = await listPeople(ctx);
  const m = await getMemory(ctx, id, people);
  if (!m) notFound();
  const related = await relatedMemories(ctx, m, people);
  const { data: cm } = await ctx.supabase.from("comments").select("id, body, author_id, created_at").eq("memory_id", id).order("created_at", { ascending: true });
  const comments = (cm ?? []) as { id: string; body: string; author_id: string | null; created_at: string }[];
  const { data: auth } = comments.length
    ? await ctx.supabase.from("profiles").select("id, full_name").in("id", [...new Set(comments.map((c) => c.author_id).filter(Boolean))] as string[])
    : { data: [] };
  const names = new Map(((auth ?? []) as { id: string; full_name: string }[]).map((a) => [a.id, a.full_name]));
  const canEdit = ctx.isAdmin || (ctx.canWrite && m.created_by === ctx.user.id);
  const images = m.media.filter((x) => x.url).map((x) => ({ url: x.url as string, caption: x.caption }));

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/family/memories" className="text-[15px] text-stone underline">← Dòng thời gian</Link>
      {sp.error && <div className="mt-4"><Notice kind="error">{sp.error}</Notice></div>}
      <header className="mb-8 mt-5">
        <p className="eyebrow">{formatDate(m.happened_on)}{m.location ? ` · ${m.location}` : ""}{m.is_demo ? " · Dữ liệu mẫu" : ""}</p>
        <h1 className="mt-3 text-[2.4rem] leading-tight sm:text-[3.1rem]">{m.title}</h1>
        <p className="mt-4 text-[14.5px] text-stone">
          {m.author_name ? `Ghi lại bởi ${m.author_name} · ` : ""}đăng ngày {formatDateTime(m.created_at)}
          {m.updated_at !== m.created_at ? ` · sửa ${formatDateTime(m.updated_at)}` : ""} · {VISIBILITY_LABEL[m.visibility]}
        </p>
      </header>

      {images.length > 0 && <div className="mb-10"><Gallery images={images} title={m.title} /></div>}
      {m.media.length > images.length && <div className="mb-8"><Notice kind="error">Có {m.media.length - images.length} ảnh chưa hiển thị được. Hãy tải lại trang hoặc thử lại sau.</Notice></div>}

      {m.body ? <div className="whitespace-pre-line text-[1.12rem] leading-[1.9]">{m.body}</div> : <p className="text-stone">Ký ức này chưa có lời kể.</p>}

      {(m.people.length > 0 || m.tags.length > 0) && (
        <div className="mt-8 flex flex-wrap gap-2 text-[14.5px]">
          {m.people.map((p) => <Link key={p.id} href={`/family/members/${p.id}`} className="rounded-full bg-[#e9e3d3] px-3.5 py-1 text-ink no-underline hover:bg-line">{p.full_name}</Link>)}
          {m.tags.map((t) => <Link key={t} href={`/family/memories?tag=${encodeURIComponent(t)}`} className="rounded-full border border-line px-3.5 py-1 text-stone no-underline hover:border-stone">{t}</Link>)}
        </div>
      )}

      {canEdit && (
        <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6">
          <LinkBtn href={`/family/memories/${m.id}/edit`} soft sm>Sửa ký ức</LinkBtn>
          <ConfirmForm action={deleteMemory} message={`Xoá ký ức “${m.title}”? Ảnh và bình luận kèm theo cũng sẽ bị xoá và không khôi phục được.`} label="Xoá ký ức"><input type="hidden" name="id" value={m.id} /></ConfirmForm>
        </div>
      )}

      <section className="mt-14" aria-labelledby="binh-luan">
        <h2 id="binh-luan" className="mb-5 text-[1.6rem]">Lời nhắn của cả nhà</h2>
        {comments.length === 0 && <p className="mb-6 text-stone">Chưa có lời nhắn nào.</p>}
        <ul className="mb-6 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="card px-5 py-4">
              <div className="flex items-baseline justify-between gap-3"><span className="font-medium">{c.author_id ? (names.get(c.author_id) ?? "Thành viên") : "Thành viên đã rời"}</span><span className="text-[13.5px] text-stone">{formatDateTime(c.created_at)}</span></div>
              <p className="mt-1 whitespace-pre-line">{c.body}</p>
              {(c.author_id === ctx.user.id || ctx.isAdmin) && (
                <ConfirmForm action={deleteComment} message="Xoá lời nhắn này?" label="Xoá" className="mt-2 text-[14px] text-stone underline"><input type="hidden" name="id" value={c.id} /><input type="hidden" name="memoryId" value={m.id} /></ConfirmForm>
              )}
            </li>
          ))}
        </ul>
        {ctx.canWrite ? <CommentForm memoryId={m.id} /> : <p className="text-[15px] text-stone">Bạn có quyền chỉ xem nên chưa viết lời nhắn được.</p>}
      </section>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="lien-quan">
          <h2 id="lien-quan" className="mb-5 text-[1.6rem]">Ký ức liên quan</h2>
          <div className="grid gap-5 sm:grid-cols-2">{related.map((r) => <MemoryCard key={r.id} m={r} compact />)}</div>
        </section>
      )}
    </article>
  );
}
