import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFamily } from "@/lib/session";
import { getPerson, listPeople } from "@/lib/data/people";
import { listMemories } from "@/lib/data/memories";
import { MemoryCard } from "@/components/MemoryCard";
import { ConfirmForm } from "@/components/ConfirmForm";
import { Avatar, LinkBtn, Notice } from "@/components/ui";
import { deletePerson } from "@/app/actions/people";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Hồ sơ thành viên" };

export default async function PersonPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireFamily();
  const p = await getPerson(ctx, id);
  if (!p) notFound();
  const people = await listPeople(ctx);
  const { items } = await listMemories(ctx, { person: id, limit: 12 }, people);
  const canEdit = ctx.isAdmin || (ctx.canWrite && (p.created_by === ctx.user.id || p.user_id === ctx.user.id));
  const showBirth = p.birth_date && (p.birth_date_visible || ctx.isAdmin || p.created_by === ctx.user.id || p.user_id === ctx.user.id);
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/family/members" className="text-[15px] text-stone underline">← Thành viên</Link>
      {sp.error && <div className="mt-4"><Notice kind="error">{sp.error}</Notice></div>}
      <header className="mt-6 flex flex-wrap items-center gap-6">
        <Avatar name={p.full_name} url={p.avatar_url} size={112} />
        <div>
          <h1 className="text-[2.4rem]">{p.full_name}</h1>
          <p className="mt-1 text-stone">{p.relation_label || "Thành viên gia đình"}{showBirth ? ` · sinh ${formatDate(p.birth_date)}` : ""}{p.is_demo ? " · hồ sơ mẫu" : ""}</p>
          {p.birth_date && !showBirth && <p className="text-[14px] text-stone">Ngày sinh được ẩn với người khác.</p>}
        </div>
      </header>
      {p.bio && <p className="mt-8 max-w-read whitespace-pre-line text-[1.1rem] leading-[1.85]">{p.bio}</p>}
      {canEdit && (
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkBtn href={`/family/members/${p.id}/edit`} soft sm>Sửa hồ sơ</LinkBtn>
          {!p.user_id && <ConfirmForm action={deletePerson} message={`Xoá hồ sơ ${p.full_name}? Các quan hệ gia phả của người này cũng bị xoá (ký ức vẫn được giữ).`} label="Xoá hồ sơ"><input type="hidden" name="id" value={p.id} /></ConfirmForm>}
        </div>
      )}
      <section className="mt-14" aria-labelledby="ky-uc">
        <h2 id="ky-uc" className="mb-6 text-[1.7rem]">Ký ức có {p.full_name}</h2>
        {items.length === 0 ? <p className="text-stone">Chưa có ký ức nào gắn với người này.</p> : <div className="grid gap-5 sm:grid-cols-2">{items.map((m) => <MemoryCard key={m.id} m={m} compact />)}</div>}
      </section>
    </div>
  );
}
