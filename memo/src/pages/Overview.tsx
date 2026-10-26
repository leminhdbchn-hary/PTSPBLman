import { Link } from "react-router-dom";
import { useEffect } from "react";
import { EmptyState, ErrorState, LinkBtn, Loading } from "@/components/ui";
import { MemoryCard, Photo } from "@/components/MemoryCard";
import { useAsync, useFamily } from "@/lib/session";
import { friendlyError, getFamily, listMemories, listPeople, listStories } from "@/lib/data";
import type { Memory, Person } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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
export const coverOf = (m: Memory) => m.cover ?? m.demoImages[0] ?? null;

/** Số ngày từ ký ức đầu tiên (theo ngày xảy ra; thiếu thì theo ngày ghi). */
function daysSinceFirst(list: Memory[]): number | null {
  const ts = list.map((m) => (m.happenedOn ? new Date(m.happenedOn + "T12:00:00").getTime() : m.createdAt?.toMillis() ?? NaN)).filter((t) => Number.isFinite(t));
  if (!ts.length) return null;
  return Math.max(1, Math.floor((Date.now() - Math.min(...ts)) / 86400000) + 1);
}

export default function Overview() {
  const ctx = useFamily();
  const { data, error, loading, reload } = useAsync(async () => {
    const [family, people, memories, stories] = await Promise.all([getFamily(ctx.db, ctx.fid), listPeople(ctx), listMemories(ctx), listStories(ctx).catch(() => [])]);
    return { family, people, memories, stories };
  }, [ctx.fid]);
  useEffect(() => { document.title = `${ctx.familyName} · Memo`; }, [ctx.familyName]);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={friendlyError(error)} onRetry={reload} />;
  const names = new Map(data.people.map((p) => [p.id, p.fullName]));
  const latest = data.memories.slice(0, 3);
  const withPhoto = data.memories.filter((m) => coverOf(m));
  const hero = withPhoto[0] ?? null;
  const birthdays = upcomingBirthdays(data.people);
  const photos = data.memories.reduce((n, m) => n + m.photoIds.length, 0);
  const days = daysSinceFirst(data.memories);
  const stats = [
    { n: data.memories.length, t: "Kỷ niệm đã lưu" },
    { n: photos, t: "Ảnh trong album" },
    { n: data.stories.length, t: "Lời kể bằng giọng nói" },
    { n: days ?? "—", t: "Ngày từ kỷ niệm đầu" },
  ];

  return (
    <div className="space-y-12 sm:space-y-14">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Chào mừng về nhà <span aria-hidden className="text-blush">♥</span></p>
          <h1 className="mt-2 break-words text-[2rem] sm:text-[2.6rem]">{data.family?.name ?? ctx.familyName}</h1>
          {data.family?.description && <p className="mt-2 max-w-xl text-stone">{data.family.description}</p>}
        </div>
        <Link to="/settings" aria-label="Tài khoản của bạn" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage-soft font-semibold text-mossdark no-underline">{ctx.user.name.trim().charAt(0).toUpperCase() || "M"}</Link>
      </header>

      {/* ---- Hero ---- */}
      <section aria-label="Giới thiệu" className="grid items-center gap-8 overflow-hidden rounded-[28px] bg-cream p-7 sm:p-10 md:grid-cols-[1.3fr_.8fr] md:p-12">
        <div>
          <p className="eyebrow">Our little forever <span aria-hidden>✦</span></p>
          <h2 className="mt-4 text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.15]">Mỗi ngày bên nhau,<br /><em className="text-moss">một điều đáng nhớ.</em></h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-stone">Lưu lại những khoảnh khắc nhỏ bé, để mai này nhìn lại, chúng ta thấy cả một hành trình yêu thương.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {ctx.canWrite && <LinkBtn to="/family/memories/new">＋ Viết kỷ niệm mới</LinkBtn>}
            <LinkBtn to="/family/memories" soft>Xem tất cả ký ức</LinkBtn>
          </div>
        </div>
        <Link to={hero ? `/family/memories/${hero.id}` : ctx.canWrite ? "/family/memories/new" : "/family/memories"} aria-label={hero ? `Mở ký ức: ${hero.title}` : "Thêm ký ức đầu tiên"}
          className="mx-auto block w-[210px] rotate-[6deg] bg-white p-2.5 pb-0 shadow-lift no-underline transition duration-300 hover:rotate-[3deg] sm:w-[240px]">
          {hero ? (
            <Photo src={coverOf(hero)!} priority className="aspect-[4/4.4] w-full object-cover" />
          ) : (
            <div className="relative grid aspect-[4/4.4] place-items-center bg-gradient-to-b from-sage-mist from-50% to-sage-mist to-50%" aria-hidden>
              <span className="text-[3.2rem] text-sun">☀</span><span className="absolute bottom-6 text-[3.4rem] text-blush-soft">♥</span>
            </div>
          )}
          <p className="truncate bg-white px-2 py-2.5 text-center font-serif text-[13px] italic text-ink">{hero ? hero.title : "together is home ♡"}</p>
        </Link>
      </section>

      {/* ---- Thống kê ---- */}
      <section aria-label="Thống kê" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.t} className="card px-5 py-5 sm:px-6">
            <strong className="block font-serif text-[2rem] font-medium leading-none sm:text-[2.2rem]">{s.n}</strong>
            <span className="mt-2 block text-[13.5px] text-stone">{s.t}</span>
          </div>
        ))}
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
                <span aria-hidden className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[14px] ${st.done ? "bg-moss text-white" : "border border-stone/60"}`}>{st.done ? "✓" : ""}</span>
                {st.to && !st.done ? <Link to={st.to} className="tap underline">{st.text}</Link> : <span className={st.done ? "text-stone line-through" : ""}>{st.text}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ---- Kỷ niệm gần đây ---- */}
      <section aria-labelledby="moi-nhat">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><p className="eyebrow">Little moments, big love</p><h2 id="moi-nhat" className="mt-1.5 text-[1.7rem] sm:text-[2rem]">Kỷ niệm gần đây</h2></div>
          <Link to="/family/memories" className="tap shrink-0 text-[15.5px] font-semibold text-moss underline">Xem tất cả</Link>
        </div>
        {latest.length === 0 ? (
          <EmptyState title="Cuốn sổ còn trống" action={ctx.canWrite ? <LinkBtn to="/family/memories/new">Viết trang đầu tiên</LinkBtn> : undefined}>
            Hãy thêm ký ức đầu tiên của gia đình. {ctx.isAdmin && <>Hoặc <Link to="/family/manage#du-lieu-mau" className="underline">thêm dữ liệu mẫu</Link> để xem sổ trông như thế nào.</>}
          </EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{latest.map((m) => <MemoryCard key={m.id} m={m} names={names} />)}</div>
        )}
      </section>

      {/* ---- Album ---- */}
      {withPhoto.length >= 2 && (
        <section aria-labelledby="album-xem-truoc">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="eyebrow">Khoảnh khắc</p><h2 id="album-xem-truoc" className="mt-1.5 text-[1.7rem] sm:text-[2rem]">Album ảnh</h2></div>
            <Link to="/family/album" className="tap shrink-0 text-[15.5px] font-semibold text-moss underline">Mở album</Link>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            {withPhoto.slice(0, 6).map((m) => (
              <li key={m.id}><Link to="/family/album" aria-label={`Xem ảnh: ${m.title}`} className="block overflow-hidden rounded-xl"><Photo src={coverOf(m)!} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></Link></li>
            ))}
          </ul>
        </section>
      )}

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

      {/* ---- Gia đình ---- */}
      <section aria-labelledby="loi-tat" className="rounded-3xl bg-sage-soft px-6 py-12 text-center sm:px-10">
        <span aria-hidden className="text-[2.2rem] text-moss">♡</span>
        <h2 id="loi-tat" className="mx-auto mt-2 max-w-lg text-[1.6rem] sm:text-[1.9rem]">Gia đình là nơi mọi câu chuyện bắt đầu.</h2>
        <p className="mt-2 text-stone">Hãy lưu giữ thêm một ngày đáng nhớ nhé.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {ctx.canWrite && <LinkBtn to="/family/memories/new">Thêm ký ức</LinkBtn>}
          {ctx.canWrite && <LinkBtn to="/family/stories/new" soft>🎙 Ghi âm lời kể</LinkBtn>}
          <LinkBtn to="/family/tree" soft>Xem gia phả</LinkBtn>
        </div>
      </section>
    </div>
  );
}
