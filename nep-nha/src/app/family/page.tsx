import type { Metadata } from "next";
import Link from "next/link";
import { requireFamily } from "@/lib/session";
import { listPeople } from "@/lib/data/people";
import { listMemories } from "@/lib/data/memories";
import { MemoryCard } from "@/components/MemoryCard";
import { EmptyState, LinkBtn } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Tổng quan gia đình" };

/** Sự kiện sắp tới: sinh nhật (ngày sinh được phép hiển thị) trong 45 ngày tới. */
function upcomingBirthdays(people: { id: string; full_name: string; birth_date: string | null; birth_date_visible: boolean; created_by: string | null }[], viewer: string, isAdmin: boolean) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: { id: string; name: string; when: Date; turns: number }[] = [];
  for (const p of people) {
    if (!p.birth_date) continue;
    if (!(p.birth_date_visible || isAdmin || p.created_by === viewer)) continue;
    const [y, m, d] = p.birth_date.split("-").map(Number);
    let next = new Date(today.getFullYear(), m - 1, d);
    if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
    const days = Math.round((next.getTime() - today.getTime()) / 86400000);
    if (days <= 45) out.push({ id: p.id, name: p.full_name, when: next, turns: next.getFullYear() - y });
  }
  return out.sort((a, b) => a.when.getTime() - b.when.getTime()).slice(0, 4);
}

export default async function FamilyHome() {
  const ctx = await requireFamily();
  const people = await listPeople(ctx);
  const { items } = await listMemories(ctx, { limit: 4 }, people);
  const birthdays = upcomingBirthdays(people, ctx.user.id, ctx.isAdmin);

  return (
    <div className="space-y-14">
      <section className="max-w-3xl">
        <p className="eyebrow mb-3">Sổ ký ức</p>
        <h1 className="text-[2.5rem] sm:text-[3.2rem]">{ctx.family.name}</h1>
        {ctx.family.description && <p className="mt-4 text-[1.1rem] text-stone">{ctx.family.description}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          {ctx.canWrite && <LinkBtn href="/family/memories/new">Thêm ký ức mới</LinkBtn>}
          <LinkBtn href="/family/memories" soft>Mở dòng thời gian</LinkBtn>
          {ctx.isAdmin && <LinkBtn href="/family/manage" soft>Mời thành viên</LinkBtn>}
        </div>
      </section>

      <section aria-labelledby="moi-nhat">
        <div className="mb-6 flex items-baseline justify-between"><h2 id="moi-nhat" className="text-[1.7rem]">Những trang mới nhất</h2><Link href="/family/memories" className="text-[15.5px] text-ink underline">Xem tất cả</Link></div>
        {items.length === 0 ? (
          <EmptyState title="Cuốn sổ còn trống" action={ctx.canWrite ? <LinkBtn href="/family/memories/new">Viết trang đầu tiên</LinkBtn> : undefined}>
            Hãy thêm ký ức đầu tiên của gia đình. {ctx.isAdmin && <>Hoặc <Link href="/family/manage#du-lieu-mau" className="underline">thêm dữ liệu mẫu</Link> để xem sổ trông như thế nào.</>}
          </EmptyState>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">{items.map((m) => <MemoryCard key={m.id} m={m} />)}</div>
        )}
      </section>

      {birthdays.length > 0 && (
        <section aria-labelledby="sap-toi">
          <h2 id="sap-toi" className="mb-5 text-[1.7rem]">Sắp tới</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {birthdays.map((b) => (
              <li key={b.id} className="card flex items-center justify-between px-5 py-4">
                <Link href={`/family/members/${b.id}`} className="text-ink no-underline"><span className="font-medium">Sinh nhật {b.name}</span><span className="block text-[14.5px] text-stone">tròn {b.turns} tuổi</span></Link>
                <span className="text-[15px] text-stone">{formatDate(b.when.toISOString().slice(0, 10))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="loi-tat">
        <h2 id="loi-tat" className="mb-5 text-[1.7rem]">Đi nhanh tới</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { href: "/family/members", t: "Thành viên", d: `${people.length} hồ sơ` },
            { href: "/family/tree", t: "Gia phả", d: "Các thế hệ trong gia đình" },
            { href: "/family/stories", t: "Lời kể của người thân", d: "Sắp ra mắt" },
          ].map((x) => (
            <Link key={x.href} href={x.href} className="card block p-5 text-ink no-underline transition hover:border-stone"><span className="font-serif text-[1.3rem]">{x.t}</span><span className="mt-1 block text-[15px] text-stone">{x.d}</span></Link>
          ))}
        </div>
      </section>
    </div>
  );
}
