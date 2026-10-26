import { useState } from "react";
import { Link } from "react-router-dom";
import type { Memory } from "@/lib/types";
import { VISIBILITY_LABEL } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/** Ảnh tải lười, giữ chỗ bằng tỉ lệ cố định (không giật trang) và hiện dần khi tải xong. */
export function Photo({ src, alt = "", className = "", priority }: { src: string; alt?: string; className?: string; priority?: boolean }) {
  const [on, setOn] = useState(false);
  return (
    <img
      src={src} alt={alt} decoding="async" loading={priority ? "eager" : "lazy"} onLoad={() => setOn(true)}
      className={`bg-cream transition-opacity duration-500 ${on ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}

/**
 * Một trang trong cuốn sổ: ảnh là chính, chữ ngắn gọn bên dưới.
 * layout="row": trên màn hình rộng, ảnh bên trái và chữ bên phải (dùng trong dòng thời gian).
 */
export function MemoryCard({ m, names, compact, layout = "stack" }: { m: Memory; names: Map<string, string>; compact?: boolean; layout?: "stack" | "row" }) {
  const img = m.cover ?? m.demoImages[0] ?? null;
  const count = m.photoIds.length + m.demoImages.length;
  const people = m.personIds.map((id) => names.get(id)).filter(Boolean) as string[];
  const shownPeople = people.slice(0, 3);
  const row = layout === "row" && !compact;
  return (
    <article className="card cv-auto overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <Link to={`/family/memories/${m.id}`} className={`block text-ink no-underline ${row && img ? "sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : ""}`}>
        {img ? (
          <div className="relative overflow-hidden">
            <Photo src={img} className={`w-full object-cover ${compact ? "aspect-[4/3]" : row ? "aspect-[4/3] sm:h-full sm:min-h-[220px]" : "aspect-[4/3] sm:aspect-[3/2]"}`} />
            {count > 1 && <span className="absolute bottom-2.5 right-2.5 rounded-full bg-ink/75 px-2.5 py-0.5 text-[13px] text-white">{count} ảnh</span>}
          </div>
        ) : !compact && m.body ? (
          <div className="bg-cream px-6 pt-6 sm:px-7">
            <p className="line-clamp-4 whitespace-pre-line font-serif text-[1.2rem] leading-relaxed text-ink/80">“{m.body}”</p>
          </div>
        ) : null}
        <div className={compact ? "p-4" : "p-5 sm:p-6"}>
          <p className="eyebrow !normal-case !tracking-[0.04em]">
            <time>{formatDate(m.happenedOn)}</time>
            {m.location ? ` · ${m.location}` : ""}
            {m.isDemo ? " · Mẫu" : ""}
            {m.visibility !== "family" ? ` · ${VISIBILITY_LABEL[m.visibility]}` : ""}
          </p>
          <h3 className={`mt-1.5 ${compact ? "text-[1.1rem]" : "text-[1.4rem] sm:text-[1.55rem]"}`}>{m.title}</h3>
          {!compact && img && m.body && <p className="mt-2 line-clamp-2 whitespace-pre-line text-[15.5px] text-stone">{m.body}</p>}
          {!compact && shownPeople.length > 0 && (
            <p className="mt-3 text-[14px] text-stone">Cùng {shownPeople.join(", ")}{people.length > 3 ? ` và ${people.length - 3} người khác` : ""}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
