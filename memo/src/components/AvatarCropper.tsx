import { useCallback, useEffect, useRef, useState } from "react";
import { rotateCanvas, toCanvas } from "@/lib/image";

const OUT = 320; // kích thước ảnh đại diện lưu lại (vuông)

type FaceDetectorCtor = new (o?: { fastMode?: boolean; maxDetectedFaces?: number }) => { detect(i: CanvasImageSource): Promise<{ boundingBox: DOMRectReadOnly }[]> };

/**
 * Cửa sổ cắt ảnh đại diện: kéo ảnh để đặt khuôn mặt vào giữa vòng tròn, kéo thanh trượt (hoặc chụm hai ngón) để phóng to, nút xoay.
 * Trình duyệt nào hỗ trợ nhận diện khuôn mặt (Chrome Android) thì tự căn sẵn vào mặt.
 */
export function AvatarCropper({ file, onCancel, onDone }: { file: File; onCancel: () => void; onDone: (dataUrl: string) => void }) {
  const [src, setSrc] = useState<HTMLCanvasElement | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState(280);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 }); // vị trí tâm ảnh so với tâm vòng tròn (px màn hình)
  const [auto, setAuto] = useState(false);
  const url = useRef<string>("");
  const [imgUrl, setImgUrl] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; z: number } | null>(null);

  // kích thước vòng cắt theo bề rộng màn hình
  useEffect(() => {
    const f = () => setView(Math.max(220, Math.min(320, window.innerWidth - 56)));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  // đọc ảnh
  useEffect(() => {
    let alive = true;
    toCanvas(file).then(
      (c) => alive && setSrc(c),
      () => alive && setErr("Trình duyệt này chưa đọc được ảnh đó (thường là ảnh HEIC trên máy tính). Bạn chọn ảnh JPG hoặc PNG nhé."),
    );
    return () => { alive = false; };
  }, [file]);

  // ảnh hiển thị = canvas hiện tại
  useEffect(() => {
    if (!src) return;
    let alive = true;
    src.toBlob((b) => {
      if (!b || !alive) return;
      URL.revokeObjectURL(url.current);
      url.current = URL.createObjectURL(b);
      setImgUrl(url.current);
    }, "image/jpeg", 0.9);
    setZoom(1); setOff({ x: 0, y: 0 }); setAuto(false);
    // nhận diện khuôn mặt nếu trình duyệt có
    const FD = (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector;
    if (FD) {
      new FD({ fastMode: true, maxDetectedFaces: 1 }).detect(src).then((faces) => {
        const f = faces[0]?.boundingBox;
        if (!f || !alive) return;
        const base = view / Math.min(src.width, src.height);
        const z = Math.min(4, Math.max(1, (view * 0.55) / (Math.max(f.width, f.height) * base)));
        const s = base * z;
        setZoom(z);
        setOff(clamp({ x: -((f.x + f.width / 2) - src.width / 2) * s, y: -((f.y + f.height / 2) - src.height / 2) * s }, src, s, view));
        setAuto(true);
      }).catch(() => {});
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);
  useEffect(() => () => URL.revokeObjectURL(url.current), []);

  // khoá cuộn nền, Esc để đóng
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", k);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", k); };
  }, [onCancel]);

  const scale = src ? (view / Math.min(src.width, src.height)) * zoom : 1;
  const move = useCallback((dx: number, dy: number) => { if (src) setOff((o) => clamp({ x: o.x + dx, y: o.y + dy }, src, scale, view)); }, [src, scale, view]);
  const setZ = (z: number) => { if (!src) return; const nz = Math.min(4, Math.max(1, z)); setZoom(nz); setOff((o) => clamp(o, src, (view / Math.min(src.width, src.height)) * nz, view)); };

  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) { const [a, b] = [...pointers.current.values()]; pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom }; }
  };
  const onMove = (e: React.PointerEvent) => {
    const p = pointers.current.get(e.pointerId);
    if (!p) return;
    const prev = { ...p };
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      setZ(pinch.current.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.d));
    } else if (pointers.current.size === 1) move(e.clientX - prev.x, e.clientY - prev.y);
  };
  const onUp = (e: React.PointerEvent) => { pointers.current.delete(e.pointerId); if (pointers.current.size < 2) pinch.current = null; };
  const onKey = (e: React.KeyboardEvent) => {
    const step = 12;
    if (e.key === "ArrowLeft") move(step, 0); else if (e.key === "ArrowRight") move(-step, 0);
    else if (e.key === "ArrowUp") move(0, step); else if (e.key === "ArrowDown") move(0, -step);
    else if (e.key === "+" || e.key === "=") setZ(zoom + 0.2); else if (e.key === "-") setZ(zoom - 0.2);
    else return;
    e.preventDefault();
  };

  function done() {
    if (!src) return;
    const s = scale;
    // phần ảnh gốc đang nằm trong vòng cắt
    const sx = src.width / 2 - (view / 2 + off.x) / s;
    const sy = src.height / 2 - (view / 2 + off.y) / s;
    const side = view / s;
    const c = document.createElement("canvas");
    c.width = c.height = OUT;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, OUT, OUT);
    g.imageSmoothingQuality = "high";
    g.drawImage(src, sx, sy, side, side, 0, 0, OUT, OUT);
    let q = 0.85, out = c.toDataURL("image/jpeg", q);
    while (out.length > 120_000 && q > 0.4) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
    onDone(out);
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="crop-title" className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center" onClick={onCancel}>
      <div className="max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-paper p-5 sm:rounded-3xl" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
        <h2 id="crop-title" className="text-[1.4rem]">Cắt ảnh đại diện</h2>
        <p className="mt-1 text-[15px] text-stone">Kéo ảnh để đặt khuôn mặt vào giữa vòng tròn. Dùng thanh trượt hoặc chụm hai ngón để phóng to.</p>
        {err ? (
          <div className="mt-5 space-y-4"><div role="alert" className="rounded-xl border border-[#e2b9ab] bg-[#fbeee8] px-4 py-3 text-[15.5px] text-[#7d3220]">{err}</div><button type="button" className="btn-soft w-full" onClick={onCancel}>Đóng</button></div>
        ) : !src || !imgUrl ? (
          <p className="py-16 text-center text-stone" role="status">Đang mở ảnh…</p>
        ) : (
          <>
            <div
              ref={box} tabIndex={0} role="img" aria-label="Khung cắt ảnh. Dùng phím mũi tên để di chuyển, dấu cộng trừ để phóng to"
              className="relative mx-auto mt-5 touch-none select-none overflow-hidden rounded-2xl bg-[#d9d2c4] outline-offset-4"
              style={{ width: view, height: view, cursor: "grab" }}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey} data-testid="crop-box"
            >
              <img src={imgUrl} alt="" draggable={false} className="pointer-events-none absolute max-w-none"
                style={{ width: src.width * scale, height: src.height * scale, left: view / 2 - (src.width * scale) / 2 + off.x, top: view / 2 - (src.height * scale) / 2 + off.y }} />
              {/* vòng tròn: ngoài vòng được làm tối */}
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: "0 0 0 999px rgba(28,23,18,0.55)", border: "2px solid rgba(255,255,255,0.9)" }} />
            </div>
            {auto && <p className="mt-2 text-center text-[14px] text-moss">Đã tự căn vào khuôn mặt, bạn chỉnh lại nếu cần.</p>}
            <div className="mt-5 flex items-center gap-3">
              <label htmlFor="crop-zoom" className="shrink-0 text-[15px]">Phóng to</label>
              <input id="crop-zoom" type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZ(Number(e.target.value))} className="w-full" />
            </div>
            <div className="mt-4 flex gap-2.5">
              <button type="button" className="btn-soft shrink-0 !px-4" onClick={() => setSrc((c) => (c ? rotateCanvas(c) : c))} aria-label="Xoay ảnh 90 độ">↻ Xoay</button>
              <button type="button" className="btn-soft shrink-0 !px-4" onClick={onCancel}>Huỷ</button>
              <button type="button" className="btn flex-1 !px-3" onClick={done}>Dùng ảnh này</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Giữ ảnh luôn phủ kín vòng cắt (không để lộ viền trống). */
function clamp(o: { x: number; y: number }, src: HTMLCanvasElement, scale: number, view: number) {
  const mx = Math.max(0, (src.width * scale - view) / 2), my = Math.max(0, (src.height * scale - view) / 2);
  return { x: Math.min(mx, Math.max(-mx, o.x)), y: Math.min(my, Math.max(-my, o.y)) };
}
