import { Link } from "react-router-dom";
import type { Memory } from "@/lib/types";
import { VISIBILITY_LABEL } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/** Một trang trong cuốn nhật ký ảnh: ảnh là chính, chữ ngắn gọn bên dưới. */
export function MemoryCard({ m, names, compact }: { m: Memory; names: Map<string, string>; compact?: boolean }) {
  const img = m.cover ?? m.demoImages[0] ?? null;
  const count = m.photoIds.length + m.demoImages.length;
  const people = m.personIds.map((id) => names.get(id)).filter(Boolean) as string[];
  const shownPeople = people.slice(0, 3);
  return (
    <article className="card overflow-hidden transition hover:border-stone">
      <Link to={`/family/memories/${m.id}`} className="block text-ink no-underline">
        {img ? (
          <div className="relative">
            <img src={img} alt="" className={`w-full object-cover ${compact ? "aspect-[4/3]" : "aspect-[4/3] sm:aspect-[3/2]"}`} loading="lazy" />
            {count > 1 && <span className="absolute bottom-2.5 right-2.5 rounded-full bg-ink/75 px-2.5 py-0.5 text-[13px] text-warm">{count} ảnh</span>}
          </div>
        ) : !compact && m.body ? (
          <div className="bg-[#efe9da] px-6 pt-6 sm:px-7">
            <p className="line-clamp-4 whitespace-pre-line font-serif text-[1.2rem] leading-relaxed text-ink/80">“{m.body}”</p>
          </div>
        ) : null}
        <div className={compact ? "p-4" : "p-5 sm:p-6"}>
          <p className="eyebrow">
            {formatDate(m.happenedOn)}
            {m.location ? ` · ${m.location}` : ""}
            {m.isDemo ? " · Mẫu" : ""}
            {m.visibility !== "family" ? ` · ${VISIBILITY_LABEL[m.visibility]}` : ""}
          </p>
          <h3 className={`mt-1.5 ${compact ? "text-[1.1rem]" : "text-[1.45rem] sm:text-[1.6rem]"}`}>{m.title}</h3>
          {!compact && img && m.body && <p className="mt-2 line-clamp-2 whitespace-pre-line text-[15.5px] text-stone">{m.body}</p>}
          {!compact && shownPeople.length > 0 && (
            <p className="mt-3 text-[14px] text-stone">Cùng {shownPeople.join(", ")}{people.length > 3 ? ` và ${people.length - 3} người khác` : ""}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
