import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { addPhoto, deletePhoto, friendlyError, saveMemory, setMemoryPhotos, type Ctx } from "@/lib/data";
import { checkFile, prepareImage, thumbnailFrom } from "@/lib/image";
import { MEDIA_LIMITS, memorySchema } from "@/lib/validation";
import { THEME_TAGS, VISIBILITY_LABEL, type Memory, type Photo, type Visibility } from "@/lib/types";
import { Field, Notice } from "./ui";

type Pending = { key: string; file: File; preview: string };

export function MemoryForm({ ctx, people, existing, photos = [] }: { ctx: Ctx & { isAdmin: boolean }; people: { id: string; fullName: string }[]; existing?: Memory; photos?: Photo[] }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [files, setFiles] = useState<Pending[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const kept = photos.filter((p) => !removed.includes(p.id));
  const room = MEDIA_LIMITS.maxPerMemory - kept.length - files.length;
  const isAuthor = !existing || existing.createdBy === ctx.user.uid;

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
    setFiles((p) => [...p, ...add]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setFieldErr({});
    const f = new FormData(e.currentTarget);
    const parsed = memorySchema.safeParse({
      title: f.get("title"), body: f.get("body"), happenedOn: f.get("happenedOn"), location: f.get("location"),
      tags, visibility: f.get("visibility") ?? existing?.visibility, personIds: f.getAll("personIds"),
    });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) { const k = String(i.path[0]); if (!fe[k]) fe[k] = i.message; }
      setFieldErr(fe);
      setError(fe.title ?? "Bạn kiểm tra lại các ô bên dưới nhé.");
      return;
    }
    setBusy(true);
    try {
      setProgress("Đang lưu câu chuyện…");
      const id = await saveMemory(ctx, parsed.data, existing);
      // gỡ ảnh đã bỏ
      for (const pid of removed) await deletePhoto(ctx, pid).catch(() => {});
      const ids = kept.map((p) => p.id);
      let cover: string | null = existing && kept.length && existing.photoIds[0] === kept[0].id ? existing.cover : null;
      const failed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`Đang nén và lưu ảnh ${i + 1}/${files.length}…`);
        try {
          const img = await prepareImage(files[i].file);
          ids.push(await addPhoto(ctx, id, img));
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
      nav(`/family/memories/${id}`, { replace: !!existing });
    } catch (x) {
      setBusy(false); setProgress(null);
      setError(friendlyError(x, "Chưa lưu được ký ức. Bạn thử lại nhé."));
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-read space-y-7" noValidate>
      {error && <Notice kind="error">{error}</Notice>}
      <Field label="Tiêu đề" name="title" error={fieldErr.title}>
        <input id="title" name="title" className="input" defaultValue={existing?.title} maxLength={140} required placeholder="VD: Bữa cơm chiều ngày mưa" aria-invalid={!!fieldErr.title} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ngày xảy ra" name="happenedOn" hint="Không nhớ chính xác cũng được, bạn có thể bỏ trống." error={fieldErr.happenedOn}>
          <input id="happenedOn" name="happenedOn" type="date" className="input" defaultValue={existing?.happenedOn ?? ""} />
        </Field>
        <Field label="Địa điểm (không bắt buộc)" name="location">
          <input id="location" name="location" className="input" defaultValue={existing?.location ?? ""} maxLength={120} placeholder="VD: Quê nội, Đà Lạt…" />
        </Field>
      </div>
      <Field label="Câu chuyện" name="body" hint="Hãy viết như đang kể cho người thân nghe.">
        <textarea id="body" name="body" className="input min-h-[190px] leading-relaxed" defaultValue={existing?.body} maxLength={10000} placeholder="Hôm đó…" />
      </Field>

      <fieldset>
        <legend className="label">Ảnh</legend>
        <div className="flex flex-wrap gap-3">
          {kept.map((p) => (
            <div key={p.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-line bg-paper">
              <img src={p.data} alt="Ảnh đã lưu" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setRemoved((r) => [...r, p.id])} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink/80 text-sm text-warm" aria-label="Gỡ ảnh này khỏi ký ức">✕</button>
            </div>
          ))}
          {files.map((f) => (
            <div key={f.key} className="relative h-24 w-24 overflow-hidden rounded-xl border border-line bg-paper">
              <img src={f.preview} alt={`Ảnh sẽ tải lên: ${f.file.name}`} className="h-full w-full object-cover" />
              <button type="button" onClick={() => { URL.revokeObjectURL(f.preview); setFiles((p) => p.filter((x) => x.key !== f.key)); }} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink/80 text-sm text-warm" aria-label="Bỏ ảnh này">✕</button>
            </div>
          ))}
          {room > 0 && (
            <button type="button" onClick={() => fileRef.current?.click()} className="grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-stone/60 bg-warm text-center text-[14px] text-ink hover:border-ink">
              + Thêm ảnh
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif" multiple className="sr-only" onChange={(e) => pick(e.target.files)} aria-label="Chọn ảnh từ máy" />
        <p className="hint">Tối đa {MEDIA_LIMITS.maxPerMemory} ảnh. Ảnh được nén gọn ngay trên máy (cạnh dài khoảng 1600 px) trước khi lưu, chỉ người trong gia đình mới xem được.</p>
      </fieldset>

      <fieldset>
        <legend className="label">Chủ đề</legend>
        <div className="flex flex-wrap gap-2">
          {[...THEME_TAGS, ...tags.filter((t) => !(THEME_TAGS as readonly string[]).includes(t))].map((t) => {
            const on = tags.includes(t);
            return (
              <button key={t} type="button" aria-pressed={on} onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t].slice(0, 8))}
                className={`rounded-full border px-3.5 py-1.5 text-[15px] ${on ? "border-ink bg-ink text-warm" : "border-line bg-warm text-ink hover:border-stone"}`}>
                {t}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <input aria-label="Thêm chủ đề riêng" className="input" value={tagInput} maxLength={24} onChange={(e) => setTagInput(e.target.value)} placeholder="Chủ đề riêng, rồi bấm Thêm"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); setTagInput(""); } }} />
          <button type="button" className="btn-soft btn-sm shrink-0" onClick={() => { addTag(tagInput); setTagInput(""); }}>Thêm</button>
        </div>
      </fieldset>

      {people.length > 0 && (
        <fieldset>
          <legend className="label">Người liên quan</legend>
          <div className="flex flex-wrap gap-2">
            {people.map((p) => (
              <label key={p.id} className="cursor-pointer">
                <input type="checkbox" name="personIds" value={p.id} defaultChecked={existing?.personIds.includes(p.id)} className="peer sr-only" />
                <span className="inline-block rounded-full border border-line bg-warm px-3.5 py-1.5 text-[15px] peer-checked:border-ink peer-checked:bg-ink peer-checked:text-warm peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-moss">{p.fullName}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {isAuthor ? (
        <Field label="Ai được xem ký ức này?" name="visibility" hint="“Chỉ mình tôi”: kể cả chủ sở hữu gia đình cũng không xem được.">
          <select id="visibility" name="visibility" className="input" defaultValue={existing?.visibility ?? "family"}>
            {(Object.keys(VISIBILITY_LABEL) as Visibility[]).filter((v) => v !== "admins" || ctx.isAdmin).map((v) => <option key={v} value={v}>{VISIBILITY_LABEL[v]}</option>)}
          </select>
        </Field>
      ) : (
        <p className="text-[15px] text-stone">Chế độ hiển thị: {VISIBILITY_LABEL[existing!.visibility]} (chỉ người viết mới đổi được).</p>
      )}

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button type="submit" className="btn" disabled={busy} aria-busy={busy}>{busy ? (progress ?? "Đang lưu…") : existing ? "Lưu thay đổi" : "Lưu vào sổ"}</button>
        <button type="button" className="btn-soft" disabled={busy} onClick={() => nav(-1)}>Huỷ</button>
      </div>
      <div aria-live="polite" className="sr-only">{progress}</div>
    </form>
  );
}
