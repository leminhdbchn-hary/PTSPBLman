import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState, LinkBtn, Loading, Notice, PageTitle } from "@/components/ui";
import { MemoryCard } from "@/components/MemoryCard";
import { useAsync, useFamily } from "@/lib/session";
import { friendlyError, listMemories, listPeople } from "@/lib/data";
import { fold, yearOf } from "@/lib/utils";

const PAGE = 8;

export default function Timeline() {
  const ctx = useFamily();
  const [sp, setSp] = useSearchParams();
  const [limit, setLimit] = useState(PAGE);
  const { data, error, loading } = useAsync(async () => {
    const [memories, people] = await Promise.all([listMemories(ctx), listPeople(ctx)]);
    return { memories, people };
  }, [ctx.fid]);
  const q = sp.get("q") ?? "", year = sp.get("year") ?? "", tag = sp.get("tag") ?? "", person = sp.get("person") ?? "";
  const filtered = !!(q || year || tag || person);
  const items = useMemo(() => {
    const fq = fold(q.trim());
    return (data?.memories ?? []).filter((m) =>
      (!fq || fold(`${m.title} ${m.body} ${m.location ?? ""}`).includes(fq)) &&
      (!year || yearOf(m.happenedOn) === year) &&
      (!tag || m.tags.includes(tag)) &&
      (!person || m.personIds.includes(person)));
  }, [data, q, year, tag, person]);
  if (loading) return <Loading />;
  if (error || !data) return <Notice kind="error">{friendlyError(error)}</Notice>;
  const names = new Map(data.people.map((p) => [p.id, p.fullName]));
  const years = [...new Set(data.memories.map((m) => yearOf(m.happenedOn)).filter(Boolean) as string[])].sort().reverse();
  const tags = [...new Set(data.memories.flatMap((m) => m.tags))].sort((a, b) => a.localeCompare(b, "vi"));
  const shown = items.slice(0, limit);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    for (const k of ["q", "year", "tag", "person"]) { const v = String(f.get(k) ?? "").trim(); if (v) next.set(k, v); }
    setLimit(PAGE);
    setSp(next);
  }

  let lastYear: string | null | undefined;
  return (
    <div>
      <PageTitle eyebrow="Dòng thời gian" title="Ký ức của gia đình">
        {ctx.canWrite && <LinkBtn to="/family/memories/new">Thêm ký ức</LinkBtn>}
      </PageTitle>
      {sp.get("deleted") && <div className="mb-6"><Notice kind="success">Đã xoá ký ức.</Notice></div>}

      <form onSubmit={submit} key={sp.toString()} className="mb-10 grid gap-3 rounded-2xl border border-line bg-warm p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]" role="search" aria-label="Tìm và lọc ký ức">
        <div><label htmlFor="q" className="sr-only">Tìm theo tiêu đề, nội dung</label><input id="q" name="q" defaultValue={q} className="input" placeholder="Tìm theo tiêu đề, nội dung…" /></div>
        <div><label htmlFor="year" className="sr-only">Năm</label>
          <select id="year" name="year" defaultValue={year} className="input"><option value="">Mọi năm</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
        <div><label htmlFor="tag" className="sr-only">Chủ đề</label>
          <select id="tag" name="tag" defaultValue={tag} className="input"><option value="">Mọi chủ đề</option>{tags.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
        <div><label htmlFor="person" className="sr-only">Thành viên</label>
          <select id="person" name="person" defaultValue={person} className="input"><option value="">Mọi người</option>{data.people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</select></div>
        <div className="flex gap-2"><button className="btn btn-sm !min-h-[50px]" type="submit">Lọc</button>{filtered && <button type="button" className="btn-soft btn-sm !min-h-[50px]" onClick={() => setSp(new URLSearchParams())}>Bỏ lọc</button>}</div>
      </form>

      {shown.length === 0 ? (
        filtered ? <EmptyState title="Không có ký ức nào khớp">Thử bỏ bớt bộ lọc hoặc tìm bằng từ khác nhé.</EmptyState>
          : <EmptyState title="Chưa có ký ức nào" action={ctx.canWrite ? <LinkBtn to="/family/memories/new">Viết trang đầu tiên</LinkBtn> : undefined}>Cuốn sổ đang chờ câu chuyện đầu tiên của gia đình.</EmptyState>
      ) : (
        <ol className="relative space-y-8 border-l border-dashed border-stone/50 pl-6 sm:pl-10">
          {shown.map((m) => {
            const y = yearOf(m.happenedOn);
            const head = y !== lastYear;
            lastYear = y;
            return (
              <li key={m.id} className="relative">
                {head && <h2 className="mb-5 font-serif text-[2.2rem] text-moss">{y ?? "Chưa rõ năm"}</h2>}
                <span aria-hidden className="absolute -left-[31px] top-2 h-3 w-3 rounded-full border-2 border-paper bg-stone sm:-left-[47px]" />
                <MemoryCard m={m} names={names} />
              </li>
            );
          })}
        </ol>
      )}
      {items.length > limit && <div className="mt-10 flex justify-center"><button type="button" className="btn-soft" onClick={() => setLimit((n) => n + PAGE)}>Xem thêm ký ức</button></div>}
    </div>
  );
}
