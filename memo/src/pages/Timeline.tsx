import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState, LinkBtn, Loading, Notice, PageTitle, ErrorState } from "@/components/ui";
import { MemoryCard } from "@/components/MemoryCard";
import { useAsync, useFamily } from "@/lib/session";
import { friendlyError, listMemories, listPeople } from "@/lib/data";
import { fold, yearOf } from "@/lib/utils";

const PAGE = 9;

export default function Timeline() {
  const ctx = useFamily();
  const [sp, setSp] = useSearchParams();
  const [limit, setLimit] = useState(PAGE);
  const { data, error, loading, reload } = useAsync(async () => {
    const [memories, people] = await Promise.all([listMemories(ctx), listPeople(ctx)]);
    return { memories, people };
  }, [ctx.fid]);
  const q = sp.get("q") ?? "", year = sp.get("year") ?? "", tag = sp.get("tag") ?? "", person = sp.get("person") ?? "";
  const filtered = !!(q || year || tag || person);
  const [open, setOpen] = useState(!!(year || tag || person));
  const items = useMemo(() => {
    const fq = fold(q.trim());
    return (data?.memories ?? []).filter((m) =>
      (!fq || fold(`${m.title} ${m.body} ${m.location ?? ""}`).includes(fq)) &&
      (!year || yearOf(m.happenedOn) === year) &&
      (!tag || m.tags.includes(tag)) &&
      (!person || m.personIds.includes(person)));
  }, [data, q, year, tag, person]);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={friendlyError(error)} onRetry={reload} />;
  const names = new Map(data.people.map((p) => [p.id, p.fullName]));
  const years = [...new Set(data.memories.map((m) => yearOf(m.happenedOn)).filter(Boolean) as string[])].sort().reverse();
  const tags = [...new Set(data.memories.flatMap((m) => m.tags))].sort((a, b) => a.localeCompare(b, "vi"));
  const shown = items.slice(0, limit);
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v); else next.delete(k);
    setLimit(PAGE);
    setSp(next, { replace: true });
  };

  // gom theo năm, giữ thứ tự mới nhất trước
  const groups: { year: string; list: typeof shown }[] = [];
  for (const m of shown) {
    const y = yearOf(m.happenedOn) ?? "Chưa rõ năm";
    const g = groups[groups.length - 1];
    if (g && g.year === y) g.list.push(m); else groups.push({ year: y, list: [m] });
  }
  const jump = (y: string) => document.getElementById("y-" + y)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div>
      <PageTitle eyebrow="Our story" title="Ký ức của gia đình">
        {ctx.canWrite && <span className="max-md:hidden"><LinkBtn to="/family/memories/new">Thêm ký ức</LinkBtn></span>}
      </PageTitle>
      {sp.get("deleted") && <div className="mb-6"><Notice kind="success">Đã xoá ký ức.</Notice></div>}

      <div className="mb-8 space-y-3" role="search" aria-label="Tìm và lọc ký ức">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <label htmlFor="q" className="sr-only">Tìm ký ức</label>
            <input id="q" type="search" value={q} onChange={(e) => set("q", e.target.value)} className="input !pl-12" placeholder="Tìm theo tên, nội dung, địa điểm…" autoComplete="off" enterKeyHint="search" />
          </div>
          <button type="button" className="btn-soft shrink-0 !px-4" aria-expanded={open} onClick={() => setOpen(!open)}>Lọc{year || tag || person ? " •" : ""}</button>
        </div>
        {open && (
          <div className="grid gap-3 rounded-2xl border border-line bg-warm p-4 sm:grid-cols-3">
            <div><label htmlFor="year" className="label">Năm</label>
              <select id="year" value={year} onChange={(e) => set("year", e.target.value)} className="input"><option value="">Mọi năm</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
            <div><label htmlFor="tag" className="label">Chủ đề</label>
              <select id="tag" value={tag} onChange={(e) => set("tag", e.target.value)} className="input"><option value="">Mọi chủ đề</option>{tags.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label htmlFor="person" className="label">Có ai</label>
              <select id="person" value={person} onChange={(e) => set("person", e.target.value)} className="input"><option value="">Mọi người</option>{data.people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</select></div>
          </div>
        )}
        {filtered && (
          <p className="flex flex-wrap items-center gap-3 text-[15px] text-stone">
            {items.length} ký ức khớp
            <button type="button" className="tap underline" onClick={() => { setSp(new URLSearchParams(), { replace: true }); setOpen(false); }}>Bỏ lọc</button>
          </p>
        )}
        {!filtered && years.length > 1 && (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Nhảy tới năm">
            {years.map((y) => <button key={y} type="button" onClick={() => jump(y)} className="tap shrink-0 rounded-full border border-line bg-warm px-4 text-[15px] text-ink">{y}</button>)}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        filtered ? <EmptyState title="Không có ký ức nào khớp">Thử bỏ bớt bộ lọc hoặc tìm bằng từ khác nhé.</EmptyState>
          : <EmptyState title="Chưa có ký ức nào" action={ctx.canWrite ? <LinkBtn to="/family/memories/new">Thêm ký ức đầu tiên</LinkBtn> : undefined}>Cuốn sổ đang chờ câu chuyện đầu tiên của gia đình.</EmptyState>
      ) : (
        <div className="space-y-12">
          {groups.map((g) => (
            <section key={g.year} id={"y-" + g.year} aria-label={"Năm " + g.year} className="scroll-mt-24">
              <h2 className="mb-6 inline-block rounded-full bg-sage-soft px-5 py-1.5 font-serif text-[1.5rem] text-mossdark">{g.year}</h2>
              <ol className="ml-3 space-y-6 border-l-2 border-sage-mist pl-5 sm:ml-4 sm:space-y-8 sm:pl-8">
                {g.list.map((m) => (
                  <li key={m.id} className="relative">
                    <span aria-hidden className="absolute -left-[27px] top-7 h-3.5 w-3.5 rounded-full border-[3px] border-paper bg-moss ring-1 ring-moss/30 sm:-left-[41px]" />
                    <MemoryCard m={m} names={names} layout="row" />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
      {items.length > limit && <div className="mt-10 flex justify-center"><button type="button" className="btn-soft" onClick={() => setLimit((n) => n + PAGE)}>Xem thêm ({items.length - limit})</button></div>}
      {!ctx.canWrite && data.memories.length > 0 && <p className="mt-10 text-center text-[14.5px] text-stone">Bạn đang ở chế độ chỉ xem. <Link to="/family" className="underline">Về trang chính</Link></p>}
    </div>
  );
}
