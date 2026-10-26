
import { useEffect, useState } from "react";

type Img = { url: string; caption: string | null };

/** Hiển thị ảnh của một ký ức; bấm để xem lớn, có phím ← → và Esc. */
export function Gallery({ images, title }: { images: Img[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i + images.length - 1) % images.length));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, images.length]);

  if (!images.length) return null;
  const [first, ...rest] = images;
  return (
    <>
      <div className="space-y-3">
        <button type="button" onClick={() => setOpen(0)} className="block w-full overflow-hidden rounded-2xl" aria-label={`Xem ảnh lớn: ${title}`}>
          <img src={first.url} alt={first.caption || title} className="max-h-[70vh] w-full object-cover" loading="eager" />
        </button>
        {rest.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {rest.map((im, i) => (
              <button type="button" key={i} onClick={() => setOpen(i + 1)} className="overflow-hidden rounded-xl" aria-label={`Xem ảnh ${i + 2} trên ${images.length}`}>
                <img src={im.url} alt={im.caption || `${title} — ảnh ${i + 2}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
      {open !== null && (
        <div role="dialog" aria-modal="true" aria-label="Xem ảnh lớn" className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1712]/95 p-4" onClick={() => setOpen(null)}>
          <img src={images[open].url} alt={images[open].caption || title} className="max-h-[88vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-xl text-white" onClick={() => setOpen(null)} aria-label="Đóng" autoFocus>✕</button>
          {images.length > 1 && (
            <>
              <button type="button" className="absolute left-3 top-1/2 grid h-14 w-12 -translate-y-1/2 place-items-center rounded-xl bg-white/15 text-2xl text-white" onClick={(e) => { e.stopPropagation(); setOpen((open + images.length - 1) % images.length); }} aria-label="Ảnh trước">‹</button>
              <button type="button" className="absolute right-3 top-1/2 grid h-14 w-12 -translate-y-1/2 place-items-center rounded-xl bg-white/15 text-2xl text-white" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % images.length); }} aria-label="Ảnh sau">›</button>
              <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-white/80">{open + 1} / {images.length}</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
