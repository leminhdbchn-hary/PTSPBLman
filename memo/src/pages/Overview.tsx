import { Link } from "react-router-dom";
import { EmptyState, LinkBtn, Loading, Notice } from "@/components/ui";
import { MemoryCard } from "@/components/MemoryCard";
import { useAsync, useFamily } from "@/lib/session";
import { friendlyError, getFamily, listMemories, listPeople } from "@/lib/data";
import type { Person } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useEffect } from "react";

/** Sinh nhật trong 45 ngày tới (chỉ những ngày sinh để công khai trong gia đình). */
function upcomingBirthdays(people: Person[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: { id: string; name: string; when: Date; turns: number }[] = [];
  for (const p of people) {
    if (!p.birthDate || !p.birthDateVisible) continue;
    const [y, m, d] = p.birthDate.split("-").map(Number);
    let next = new Date(today.getFullYear(), m - 1, d);
    if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
    const days = Math.round((next.getTime() - today.getTime()) / 86400000);
    if (days <= 45) out.push({ id: p.id, name: p.fullName, when: next, turns: next.getFullYear() - y });
  }
  return out.sort((a, b) => a.when.getTime() - b.when.getTime()).slice(0, 4);
}
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function Overview() {
  const ctx = useFamily();
  const { data, error, loading } = useAsync(async () => {
    const [family, people, memories] = await Promise.all([getFamily(ctx.db, ctx.fid), listPeople(ctx), listMemories(ctx)]);
    return { family, people, memories };
  }, [ctx.fid]);
  useEffect(() => { document.title = `${ctx.familyName} · Memo`; }, [ctx.familyName]);
  if (loading) return <Loading />;
  if (error || !data) return <Notice kind="error">{friendlyError(error)}</Notice>;
  const names = new Map(data.people.map((p) => [p.id, p.fullName]));
  const latest = data.memories.slice(0, 4);
  const birthdays = upcomingBirthdays(data.people);
  return (
    <div className="space-y-14">
      <section className="max-w-3xl">
        <p className="eyebrow mb-3">Sổ ký ức</p>
        <h1 className="text-[2.5rem] sm:text-[3.2rem]">{data.family?.name ?? ctx.familyName}</h1>
        {data.family?.description && <p className="mt-4 text-[1.1rem] text-stone">{data.family.description}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          {ctx.canWrite && <LinkBtn to="/family/memories/new">Thêm ký ức mới</LinkBtn>}
          <LinkBtn to="/family/memories" soft>Xem tất cả ký ức</LinkBtn>
        </div>
      </section>

      {ctx.canWrite && data.memories.length < 3 && (
        <section aria-labelledby="bat-dau" className="card p-5 sm:p-6">
          <h2 id="bat-dau" className="text-[1.4rem]">Bắt đầu cuốn sổ trong 3 bước</h2>
          <ol className="mt-4 space-y-2.5">
            {[
              { done: true, text: "Tạo sổ gia đình", to: null as string | null },
              { done: data.memories.length > 0, text: "Thêm ký ức đầu tiên (một tấm ảnh và vài dòng là đủ)", to: "/family/memories/new" },
              ...(ctx.isAdmin ? [{ done: false, text: "Mời người thân cùng viết", to: "/family/manage" }] : []),
            ].map((st) => (
              <li key={st.text} className="flex items-start gap-3">
                <span aria-hidden className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[14px] ${st.done ? "bg-moss text-warm" : "border border-stone/60"}`}>{st.done ? "✓" : ""}</span>
                {st.to && !st.done ? <Link to={st.to} className="tap underline">{st.text}</Link> : <span className={st.done ? "text-stone line-through" : ""}>{st.text}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="moi-nhat">
        <div className="mb-6 flex items-baseline justify-between"><h2 id="moi-nhat" className="text-[1.7rem]">Những trang mới nhất</h2><Link to="/family/memories" className="tap text-[15.5px] text-ink underline">Xem tất cả</Link></div>
        {latest.length === 0 ? (
          <EmptyState title="Cuốn sổ còn trống" action={ctx.canWrite ? <LinkBtn to="/family/memories/new">Viết trang đầu tiên</LinkBtn> : undefined}>
            Hãy thêm ký ức đầu tiên của gia đình. {ctx.isAdmin && <>Hoặc <Link to="/family/manage#du-lieu-mau" className="underline">thêm dữ liệu mẫu</Link> để xem sổ trông như thế nào.</>}
          </EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{latest.slice(0, 3).map((m) => <MemoryCard key={m.id} m={m} names={names} />)}</div>
        )}
      </section>

      {birthdays.length > 0 && (
        <section aria-labelledby="sap-toi">
          <h2 id="sap-toi" className="mb-5 text-[1.7rem]">Sắp tới</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {birthdays.map((b) => (
              <li key={b.id} className="card flex items-center justify-between px-5 py-4">
                <Link to={`/family/members/${b.id}`} className="text-ink no-underline"><span className="font-medium">Sinh nhật {b.name}</span><span className="block text-[14.5px] text-stone">tròn {b.turns} tuổi</span></Link>
                <span className="text-[15px] text-stone">{formatDate(iso(b.when))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="loi-tat">
        <h2 id="loi-tat" className="mb-5 text-[1.7rem]">Đi nhanh tới</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { to: "/family/members", t: "Thành viên", d: `${data.people.length} hồ sơ` },
            { to: "/family/tree", t: "Gia phả", d: "Các thế hệ trong gia đình" },
          ].map((x) => (
            <Link key={x.to} to={x.to} className="card block p-5 text-ink no-underline transition hover:border-stone"><span className="font-serif text-[1.3rem]">{x.t}</span><span className="mt-1 block text-[15px] text-stone">{x.d}</span></Link>
          ))}
        </div>
      </section>
    </div>
  );
}
