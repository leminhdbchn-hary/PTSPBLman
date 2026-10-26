import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { addPhoto, deletePhoto, friendlyError, saveMemory, setMemoryPhotos, type Ctx } from "@/lib/data";
import { checkFile, prepareImage, thumbnailFrom } from "@/lib/image";
import { MEDIA_LIMITS, memorySchema } from "@/lib/validation";
import { THEME_TAGS, VISIBILITY_LABEL, type Memory, type Photo, type Visibility } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Notice } from "./ui";

type Pending = { key: string; file: File; preview: string };

const VIS_HELP: Record<Visibility, string> = {
  family: "Mọi người trong gia đình đều xem được",
  admins: "Chỉ chủ sở hữu và quản trị viên",
  private: "Chỉ bạn xem được, kể cả chủ sở hữu cũng không",
};
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const isoOf = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/** Tiêu đề tự đặt khi người dùng bỏ trống: câu đầu của lời kể, hoặc “Ký ức ngày …”. */
export function autoTitle(body: string, date: string | null): string {
  const first = body.trim().split(/\n|(?<=[.!?…])\s/)[0]?.trim() ?? "";
  if (first) return first.length > 48 ? first.slice(0, 46).trimEnd() + "…" : first;
  return date ? `Ký ức ngày ${formatDate(date)}` : "Ký ức chưa đặt tên";
}

export function MemoryForm({ ctx, people, existing, photos = [] }: { ctx: Ctx & { isAdmin: boolean }; people: { id: string; fullName: string }[]; existing?: Memory; photos?: Photo[] }) {
  const nav = useNavigate();
  const draftKey = `memo-draft-${ctx.fid}`;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [date, setDate] = useState(existing ? existing.happenedOn ?? "" : today());
  const [dateFromPhoto, setDateFromPhoto] = useState(false);
  const [dateTouched, setDateTouched] = useState(!!existing);
  const [location, setLocation] = useState(existing?.location ?? "");
  const [visibility, setVisibility] = useState<Visibility>(existing?.visibility ?? "family");
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [who, setWho] = useState<string[]>(existing?.personIds ?? []);
  const [files, setFiles] = useState<Pending[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [restored, setRestored] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const kept = photos.filter((p) => !removed.includes(p.id));
  const room = MEDIA_LIMITS.maxPerMemory - kept.length - files.length;
  const isAuthor = !existing || existing.createdBy === ctx.user.uid;
  const hasDetails = !!(location || tags.length || who.length);

  // Bản nháp: khôi phục khi mở lại trang thêm ký ức mới (lỡ tắt trình duyệt, điện thoại hết pin…)
  useEffect(() => {
    if (existing) return;
    try {
      const d = JSON.parse(localStorage.getItem(draftKey) ?? "null");
      if (d && (d.title || d.body)) { setTitle(d.title ?? ""); setBody(d.body ?? ""); if (d.location) setLocation(d.location); setRestored(true); }
    } catch { /* không đọc được thì thôi */ }
  }, [draftKey, existing]);
  useEffect(() => {
    if (existing || busy) return;
    const t = setTimeout(() => {
      try {
        if (title || body) localStorage.setItem(draftKey, JSON.stringify({ title, body, location }));
        else localStorage.removeItem(draftKey);
      } catch { /* bỏ qua */ }
    }, 400);
    return () => clearTimeout(t);
  }, [title, body, location, draftKey, existing, busy]);
  const clearDraft = () => { try { localStorage.removeItem(draftKey); } catch { /* bỏ qua */ } };

  function addTag(t: string) {
    const v = t.replace(/\s+/g, " ").trim().slice(0, 24);
    if (v && tags.length < 8 && !tags.some((x) => x.toLowerCase() === v.toLowerCase())) setTags([...tags, v]);
  }
  function pick(list: FileList | null) {
    if (!list) return;
    const errs: string[] = [];
    const add: Pending[] = [];
    for (const f of Array.from(list)) {
      if (add.length >= room) { errs.push(`Mỗi ký ức tối đa ${MEDIA_LIMITS.maxPerMemory} ảnh.`); break; }
      const e = checkFile(f);
      if (e) errs.push(e);
      else add.push({ key: Math.random().toString(36).slice(2), file: f, preview: URL.createObjectURL(f) });
    }
    setError(errs.length ? errs.join(" ") : null);
    // ngày chụp: lấy từ ảnh đầu tiên nếu người dùng chưa tự chọn ngày
    if (add.length && !dateTouched && !files.length && !kept.length && add[0].file.lastModified) {
      const iso = isoOf(add[0].file.lastModified);
      if (iso !== date) { setDate(iso); setDateFromPhoto(true); }
    }
    setFiles((p) => [...p, ...add]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!title.trim() && !body.trim() && !files.length && !kept.length) { setError("Hãy thêm ảnh hoặc viết vài dòng về ký ức này nhé."); return; }
    const parsed = memorySchema.safeParse({
      title: title.trim() || autoTitle(body, date || null), body, happenedOn: date, location, tags, visibility, personIds: who,
    });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      setProgress("Đang lưu…");
      const id = await saveMemory(ctx, parsed.data, existing);
      for (const pid of removed) await deletePhoto(ctx, pid).catch(() => {});
      const ids = kept.map((p) => p.id);
      let cover: string | null = existing && kept.length && existing.photoIds[0] === kept[0].id ? existing.cover : null;
      const failed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`Đang lưu ảnh ${i + 1}/${files.length}…`);
        try {
          ids.push(await addPhoto(ctx, id, await prepareImage(files[i].file)));
        } catch (x) {
          failed.push(x instanceof Error && x.message.startsWith("Ảnh") ? x.message : files[i].file.name);
        }
      }
      if (!cover && ids.length) {
        const first = kept[0]?.data ?? null;
        cover = first ? await thumbnailFrom(first) : files.length ? await thumbnailFrom(files[0].file).catch(() => null) : null;
      }
      if (ids.length !== (existing?.photoIds.length ?? 0) || removed.length || files.length || cover !== (existing?.cover ?? null)) {
        await setMemoryPhotos(ctx, id, ids, ids.length ? cover : null);
      }
      if (failed.length) {
        setBusy(false); setProgress(null);
        setError(`Ký ức đã được lưu, nhưng chưa lưu được ảnh: ${failed.join(", ")}. Bạn mở ký ức để thêm lại nhé.`);
        return;
      }
      clearDraft();
      nav(`/family/memories/${id}`, { replace: !!existing });
    } catch (x) {
      setBusy(false); setProgress(null);
      setError(friendlyError(x, "Chưa lưu được ký ức. Bạn thử lại nhé."));
    }
  }

  const count = kept.length + files.length;
  return (
    <form onSubmit={submit} className="mx-auto max-w-read space-y-8" noValidate>
      {restored && (
        <Notice>Mình đã khôi phục bản nháp bạn viết dở. <button type="button" className="tap underline" onClick={() => { clearDraft(); setTitle(""); setBody(""); setLocation(""); setRestored(false); }}>Bỏ bản nháp</button></Notice>
      )}
      {error && <Notice kind="error">{error}</Notice>}

      <section aria-labelledby="f-anh">
        <h2 id="f-anh" className="label !text-[17px]">Ảnh {count > 0 && <span className="font-normal text-stone">({count})</span>}</h2>
        {count === 0 ? (
          <button type="button" onClick={() => fileRef.current?.click()} className="grid h-40 w-full place-items-center rounded-2xl border-2 border-dashed border-stone/60 bg-warm text-center text-ink hover:border-ink">
            <span><span className="block text-[2rem] leading-none text-moss" aria-hidden>＋</span><span className="mt-2 block text-[17px] font-medium">Chọn ảnh từ máy</span><span className="mt-0.5 block text-[14px] text-stone">Chọn được nhiều ảnh cùng lúc, hoặc bỏ qua nếu chỉ muốn viết</span></span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {kept.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl border border-line bg-paper">
                <img src={p.data} alt="Ảnh đã lưu" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setRemoved((r) => [...r, p.id])} className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-ink/80 text-sm text-warm" aria-label="Gỡ ảnh này khỏi ký ức">✕</button>
              </div>
            ))}
            {files.map((f) => (
              <div key={f.key} className="relative aspect-square overflow-hidden rounded-xl border border-line bg-paper">
                <img src={f.preview} alt={`Ảnh sẽ tải lên: ${f.file.name}`} className="h-full w-full object-cover" />
                <button type="button" onClick={() => { URL.revokeObjectURL(f.preview); setFiles((p) => p.filter((x) => x.key !== f.key)); }} className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-ink/80 text-sm text-warm" aria-label="Bỏ ảnh này">✕</button>
              </div>
            ))}
            {room > 0 && (
              <button type="button" onClick={() => fileRef.current?.click()} className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-stone/60 bg-warm text-center text-[14px] text-ink hover:border-ink">＋ Thêm ảnh</button>
            )}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => pick(e.target.files)} aria-label="Chọn ảnh từ máy" />
      </section>

      <div>
        <label htmlFor="body" className="label !text-[17px]">Kể về ký ức này</label>
        <textarea id="body" name="body" className="input min-h-[160px] leading-relaxed" value={body} onChange={(e) => setBody(e.target.value)} maxLength={10000} placeholder="Hôm đó… (viết như đang kể cho người thân nghe)" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="label">Tiêu đề <span className="font-normal text-stone">(để trống, mình tự đặt)</span></label>
          <input id="title" name="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder={autoTitle(body, date || null)} enterKeyHint="next" />
        </div>
        <div>
          <label htmlFor="happenedOn" className="label">Ngày xảy ra</label>
          <input id="happenedOn" name="happenedOn" type="date" className="input" value={date} onChange={(e) => { setDate(e.target.value); setDateTouched(true); setDateFromPhoto(false); }} />
          <p className="hint">{dateFromPhoto ? "Mình lấy ngày từ ảnh, bạn sửa được." : "Không nhớ chính xác thì cứ để ngày gần đúng."}</p>
        </div>
      </div>

      {isAuthor ? (
        <fieldset>
          <legend className="label !text-[17px]">Ai được xem?</legend>
          <div className="grid gap-2.5">
            {(Object.keys(VISIBILITY_LABEL) as Visibility[]).filter((v) => v !== "admins" || ctx.isAdmin || existing?.visibility === "admins").map((v) => (
              <label key={v} className="cursor-pointer">
                <input type="radio" name="visibility" value={v} checked={visibility === v} onChange={() => setVisibility(v)} className="peer sr-only" />
                <span className="flex items-center gap-3 rounded-xl border border-line bg-warm px-4 py-3 peer-checked:border-ink peer-checked:bg-[#efe9da] peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-moss">
                  <span aria-hidden className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${visibility === v ? "border-ink" : "border-stone/60"}`}>{visibility === v && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}</span>
                  <span><span className="block font-medium">{VISIBILITY_LABEL[v]}</span><span className="block text-[14px] text-stone">{VIS_HELP[v]}</span></span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="text-[15px] text-stone">Chế độ hiển thị: {VISIBILITY_LABEL[existing!.visibility]} (chỉ người viết mới đổi được).</p>
      )}

      <details className="rounded-2xl border border-line bg-warm px-4 py-1" open={hasDetails}>
        <summary className="tap cursor-pointer list-none text-[16.5px] font-medium">Thêm chi tiết <span className="font-normal text-stone">(địa điểm, chủ đề, người liên quan)</span></summary>
        <div className="space-y-6 pb-4 pt-2">
          <div>
            <label htmlFor="location" className="label">Địa điểm</label>
            <input id="location" name="location" className="input" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} placeholder="VD: Quê nội, Đà Lạt…" />
          </div>
          {people.length > 0 && (
            <fieldset>
              <legend className="label">Có ai trong ký ức này?</legend>
              <div className="flex flex-wrap gap-2">
                {people.map((p) => {
                  const on = who.includes(p.id);
                  return (
                    <button key={p.id} type="button" aria-pressed={on} onClick={() => setWho(on ? who.filter((x) => x !== p.id) : [...who, p.id])}
                      className={`tap rounded-full border px-4 text-[15px] ${on ? "border-ink bg-ink text-warm" : "border-line bg-paper text-ink"}`}>{p.fullName}</button>
                  );
                })}
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend className="label">Chủ đề</legend>
            <div className="flex flex-wrap gap-2">
              {[...THEME_TAGS, ...tags.filter((t) => !(THEME_TAGS as readonly string[]).includes(t))].map((t) => {
                const on = tags.includes(t);
                return (
                  <button key={t} type="button" aria-pressed={on} onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t].slice(0, 8))}
                    className={`tap rounded-full border px-4 text-[15px] ${on ? "border-ink bg-ink text-warm" : "border-line bg-paper text-ink"}`}>{t}</button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <input aria-label="Thêm chủ đề riêng" className="input" value={tagInput} maxLength={24} onChange={(e) => setTagInput(e.target.value)} placeholder="Chủ đề riêng"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); setTagInput(""); } }} />
              <button type="button" className="btn-soft btn-sm shrink-0" onClick={() => { addTag(tagInput); setTagInput(""); }}>Thêm</button>
            </div>
          </fieldset>
        </div>
      </details>

      {/* thanh Lưu cố định ở đáy màn hình để luôn bấm được, kể cả khi form dài */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="container-page flex max-w-read items-center gap-3 py-3">
          <button type="button" className="btn-soft shrink-0" disabled={busy} onClick={() => nav(-1)}>Huỷ</button>
          <button type="submit" className="btn flex-1" disabled={busy} aria-busy={busy}>{busy ? (progress ?? "Đang lưu…") : existing ? "Lưu thay đổi" : "Lưu vào sổ"}</button>
        </div>
      </div>
      <div aria-live="polite" className="sr-only">{progress}</div>
    </form>
  );
}
