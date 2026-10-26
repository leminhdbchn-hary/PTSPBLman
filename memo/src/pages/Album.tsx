import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LinkBtn, Loading, PageTitle } from "@/components/ui";
import { Photo } from "@/components/MemoryCard";
import { coverOf } from "@/pages/Overview";
import { useAsync, useFamily } from "@/lib/session";
import { friendlyError, listMemories } from "@/lib/data";
import { doc, getDoc } from "firebase/firestore";
import type { Memory } from "@/lib/types";
import { formatDate, yearOf } from "@/lib/utils";

// nhịp tỉ lệ khung cho lưới gạch (đẹp mắt, ảnh được cắt giữa)
const RATIOS = ["aspect-[4/5]", "aspect-square", "aspect-[4/3]", "aspect-[3/4]", "aspect-[5/6]", "aspect-[1/1]"];

/** Xem ảnh lớn: hiện ngay ảnh nhỏ, rồi thay bằng ảnh đầy đủ khi tải xong. Phím ← →, Esc, vuốt ngang. */
function Viewer({ items, index, onIndex, onClose }: { items: Memory[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const ctx = useFamily();
  const m = items[index];
  const [full, setFull] = useState<{ id: string; src: string } | null>(null);
  const touch = useRef<number | null>(null);
  const go = useCallback((d: number) => onIndex((index + d + items.length) % items.length), [index, items.length, onIndex]);

  useEffect(() => {
    let alive = true;
    const pid = m.photoIds[0];
    if (pid) getDoc(doc(ctx.db, "nn_families", ctx.fid, "photos", pid)).then((s) => { if (alive && s.exists()) setFull({ id: m.id, src: String(s.data().data) }); }).catch(() => {});
    return () => { alive = false; };
  }, [m.id, m.photoIds, ctx.db, ctx.fid]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); else if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1); };
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [go, onClose]);

  const src = full?.id === m.id ? full.src : coverOf(m)!;
  return (
    <div role="dialog" aria-modal="true" aria-label={`Xem ảnh: ${m.title}`} className="fixed inset-0 z-50 flex flex-col bg-ink/95 text-white"
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { const x0 = touch.current; touch.current = null; if (x0 === null || items.length < 2) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-[14px] text-white/80" aria-live="polite">{index + 1} / {items.length}</p>
        <button type="button" onClick={onClose} aria-label="Đóng" autoFocus className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-xl">✕</button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2" onClick={onClose}>
        <img src={src} alt={m.title} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full rounded-lg object-contain" decoding="async" />
        {items.length > 1 && (
          <>
            <button type="button" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-2 top-1/2 grid h-12 w-11 -translate-y-1/2 place-items-center rounded-xl bg-white/15 text-2xl max-sm:hidden">‹</button>
            <button type="button" aria-label="Ảnh sau" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-2 top-1/2 grid h-12 w-11 -translate-y-1/2 place-items-center rounded-xl bg-white/15 text-2xl max-sm:hidden">›</button>
          </>
        )}
      </div>
      <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-center">
        <p className="font-serif text-[1.25rem]">{m.title}</p>
        <p className="mt-0.5 text-[14px] text-white/75">{formatDate(m.happenedOn)}{m.photoIds.length > 1 ? ` · ${m.photoIds.length} ảnh trong ký ức này` : ""}</p>
        <Link to={`/family/memories/${m.id}`} className="tap mt-1 text-[15px] font-semibold text-white underline">Mở ký ức</Link>
      </div>
    </div>
  );
}

export default function AlbumPage() {
  const ctx = useFamily();
  const [open, setOpen] = useState<number | null>(null);
  const { data, loading, error, reload } = useAsync(() => listMemories(ctx), [ctx.fid]);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={friendlyError(error)} onRetry={reload} />;
  const items = data.filter((m) => coverOf(m));
  // gom theo năm, giữ chỉ số toàn cục để mở đúng ảnh
  const groups: { year: string; list: { m: Memory; i: number }[] }[] = [];
  items.forEach((m, i) => {
    const y = yearOf(m.happenedOn) ?? "Chưa rõ năm";
    const g = groups[groups.length - 1];
    if (g && g.year === y) g.list.push({ m, i }); else groups.push({ year: y, list: [{ m, i }] });
  });
  return (
    <div>
      <PageTitle eyebrow="Khoảnh khắc" title="Album ảnh">{ctx.canWrite && <LinkBtn to="/family/memories/new">＋ Thêm ảnh</LinkBtn>}</PageTitle>
      {items.length === 0 ? (
        <EmptyState title="Album chưa có ảnh" action={ctx.canWrite ? <LinkBtn to="/family/memories/new">Thêm ký ức có ảnh</LinkBtn> : undefined}>Ảnh trong các ký ức sẽ hiện ở đây thành một album để cả nhà cùng xem.</EmptyState>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.year} aria-label={"Ảnh năm " + g.year}>
              <h2 className="mb-4 font-serif text-[1.6rem] text-moss">{g.year}</h2>
              <ul className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
                {g.list.map(({ m, i }, k) => (
                  <li key={m.id} className="mb-3 break-inside-avoid sm:mb-4">
                    <button type="button" onClick={() => setOpen(i)} aria-label={`Xem ảnh lớn: ${m.title}`} className="group relative block w-full overflow-hidden rounded-2xl text-left shadow-soft">
                      <Photo src={coverOf(m)!} className={`w-full object-cover transition duration-500 group-hover:scale-[1.04] ${RATIOS[(i + k) % RATIOS.length]}`} />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-3 pb-2.5 pt-8 text-[13.5px] font-medium leading-snug text-white">{m.title}</span>
                      {m.photoIds.length + m.demoImages.length > 1 && <span className="absolute right-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-[12px] text-white">{m.photoIds.length + m.demoImages.length} ảnh</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {open !== null && <Viewer items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}
