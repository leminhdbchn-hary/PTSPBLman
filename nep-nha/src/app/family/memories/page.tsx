import type { Metadata } from "next";
import Link from "next/link";
import { requireFamily } from "@/lib/session";
import { listPeople } from "@/lib/data/people";
import { listMemories, memoryTags, memoryYears } from "@/lib/data/memories";
import { MemoryCard } from "@/components/MemoryCard";
import { EmptyState, LinkBtn, Notice, PageTitle } from "@/components/ui";
import { clampInt, yearOf } from "@/lib/utils";

export const metadata: Metadata = { title: "Dòng thời gian" };
const PAGE = 8;

type SP = { q?: string; year?: string; tag?: string; person?: string; n?: string; deleted?: string };

export default async function MemoriesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ctx = await requireFamily();
  const limit = clampInt(sp.n, PAGE, 400, PAGE);
  const people = await listPeople(ctx);
  const [{ items, hasMore }, years, tags] = await Promise.all([
    listMemories(ctx, { q: sp.q, year: sp.year, tag: sp.tag, person: sp.person, limit }, people),
    memoryYears(ctx),
    memoryTags(ctx),
  ]);
  const filtered = !!(sp.q || sp.year || sp.tag || sp.person);
  const more = new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.year ? { year: sp.year } : {}), ...(sp.tag ? { tag: sp.tag } : {}), ...(sp.person ? { person: sp.person } : {}), n: String(limit + PAGE) });

  let lastYear: string | null | undefined;
  return (
    <div>
      <PageTitle eyebrow="Dòng thời gian" title="Ký ức của gia đình">
        {ctx.canWrite && <LinkBtn href="/family/memories/new">Thêm ký ức</LinkBtn>}
      </PageTitle>
      {sp.deleted && <div className="mb-6"><Notice kind="success">Đã xoá ký ức.</Notice></div>}

      <form className="mb-10 grid gap-3 rounded-2xl border border-line bg-warm p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]" role="search" aria-label="Tìm và lọc ký ức">
        <div><label htmlFor="q" className="sr-only">Tìm theo tiêu đề, nội dung</label><input id="q" name="q" defaultValue={sp.q} className="input" placeholder="Tìm theo tiêu đề, nội dung…" /></div>
        <div><label htmlFor="year" className="sr-only">Năm</label>
          <select id="year" name="year" defaultValue={sp.year ?? ""} className="input"><option value="">Mọi năm</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
        <div><label htmlFor="tag" className="sr-only">Chủ đề</label>
          <select id="tag" name="tag" defaultValue={sp.tag ?? ""} className="input"><option value="">Mọi chủ đề</option>{tags.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
        <div><label htmlFor="person" className="sr-only">Thành viên</label>
          <select id="person" name="person" defaultValue={sp.person ?? ""} className="input"><option value="">Mọi người</option>{people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
        <div className="flex gap-2"><button className="btn btn-sm !min-h-[50px]" type="submit">Lọc</button>{filtered && <Link href="/family/memories" className="btn-soft btn-sm !min-h-[50px]">Bỏ lọc</Link>}</div>
      </form>

      {items.length === 0 ? (
        filtered ? (
          <EmptyState title="Không có ký ức nào khớp">Thử bỏ bớt bộ lọc hoặc tìm bằng từ khác nhé.</EmptyState>
        ) : (
          <EmptyState title="Chưa có ký ức nào" action={ctx.canWrite ? <LinkBtn href="/family/memories/new">Viết trang đầu tiên</LinkBtn> : undefined}>Cuốn sổ đang chờ câu chuyện đầu tiên của gia đình.</EmptyState>
        )
      ) : (
        <ol className="relative space-y-8 border-l border-dashed border-stone/50 pl-6 sm:pl-10">
          {items.map((m) => {
            const y = yearOf(m.happened_on);
            const head = y !== lastYear;
            lastYear = y;
            return (
              <li key={m.id} className="relative">
                {head && <h2 className="mb-5 font-serif text-[2.2rem] text-moss">{y ?? "Chưa rõ năm"}</h2>}
                <span aria-hidden className="absolute -left-[31px] top-2 h-3 w-3 rounded-full border-2 border-paper bg-stone sm:-left-[47px]" />
                <MemoryCard m={m} />
              </li>
            );
          })}
        </ol>
      )}
      {hasMore && <div className="mt-10 flex justify-center"><Link href={`/family/memories?${more.toString()}`} className="btn-soft" scroll={false}>Xem thêm ký ức</Link></div>}
    </div>
  );
}
