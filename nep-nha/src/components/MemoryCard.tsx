import Link from "next/link";
import type { MemoryWithExtras } from "@/lib/types";
import { VISIBILITY_LABEL } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/** Một trang trong cuốn nhật ký ảnh. */
export function MemoryCard({ m, compact }: { m: MemoryWithExtras; compact?: boolean }) {
  const img = m.media.find((x) => x.url);
  return (
    <article className="card overflow-hidden">
      <Link href={`/family/memories/${m.id}`} className="block text-ink no-underline">
        {img?.url && <img src={img.url} alt={img.caption || m.title} className={`w-full object-cover ${compact ? "aspect-[4/3]" : "max-h-[420px]"}`} loading="lazy" />}
        <div className={compact ? "p-4" : "p-6 sm:p-7"}>
          <p className="eyebrow">
            {formatDate(m.happened_on)}
            {m.location ? ` · ${m.location}` : ""}
            {m.is_demo ? " · Dữ liệu mẫu" : ""}
            {m.visibility !== "family" ? ` · ${VISIBILITY_LABEL[m.visibility]}` : ""}
          </p>
          <h3 className={`mt-2 ${compact ? "text-[1.15rem]" : "text-[1.7rem]"}`}>{m.title}</h3>
          {!compact && m.body && <p className="mt-3 line-clamp-4 whitespace-pre-line text-stone">{m.body}</p>}
          {!compact && (m.tags.length > 0 || m.people.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2 text-[13.5px]">
              {m.people.map((p) => <span key={p.id} className="rounded-full bg-[#e9e3d3] px-3 py-0.5 text-ink">{p.full_name}</span>)}
              {m.tags.map((t) => <span key={t} className="rounded-full border border-line px-3 py-0.5 text-stone">{t}</span>)}
            </div>
          )}
          {!compact && m.media.length > 1 && <p className="mt-3 text-[13.5px] text-stone">{m.media.length} ảnh</p>}
        </div>
      </Link>
    </article>
  );
}
