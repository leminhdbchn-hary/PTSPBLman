"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { attachMedia, saveMemory } from "@/app/actions/memories";
import { checkFile, extFor, prepareImage, type Prepared } from "@/lib/image";
import { MEDIA_LIMITS } from "@/lib/validation";
import { THEME_TAGS, VISIBILITY_LABEL, type Visibility } from "@/lib/types";
import { Field, Notice } from "./ui";

type Existing = { id: string; url: string | null };
type Initial = { id?: string; title: string; body: string; happened_on: string; location: string; tags: string[]; visibility: Visibility; personIds: string[]; media: Existing[] };
type Pending = { key: string; file: File; preview: string };

export function MemoryForm({ familyId, people, initial, canSeeAdminsOnly = true }: {
  familyId: string;
  people: { id: string; full_name: string }[];
  initial: Initial;
  canSeeAdminsOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [tagInput, setTagInput] = useState("");
  const [files, setFiles] = useState<Pending[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const kept = initial.media.filter((m) => !removed.includes(m.id));
  const room = MEDIA_LIMITS.maxPerMemory - kept.length - files.length;

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
      else add.push({ key: crypto.randomUUID(), file: f, preview: URL.createObjectURL(f) });
    }
    setError(errs.length ? errs.join(" ") : null);
    setFiles((p) => [...p, ...add]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setFieldErr({});
    const fd = new FormData(e.currentTarget);
    fd.set("tags", tags.join(","));
    removed.forEach((r) => fd.append("removeMedia", r));
    if (initial.id) fd.set("id", initial.id);
    start(async () => {
      setProgress("Đang lưu câu chuyện…");
      const res = await saveMemory(fd);
      if (!res.ok || !res.id) { setProgress(null); setError(res.error ?? "Chưa lưu được."); setFieldErr(res.fieldErrors ?? {}); return; }
      const memoryId = res.id;
      const metas: { path: string; mime: string; size: number; width: number | null; height: number | null }[] = [];
      const failed: string[] = [];
      const supabase = createClient();
      for (let i = 0; i < files.length; i++) {
        setProgress(`Đang tải ảnh ${i + 1}/${files.length}…`);
        try {
          const p: Prepared = await prepareImage(files[i].file);
          const path = `${familyId}/memories/${memoryId}/${crypto.randomUUID()}.${extFor(p.mime)}`;
          const { error: upErr } = await supabase.storage.from("family-media").upload(path, p.blob, { contentType: p.mime, upsert: false, cacheControl: "3600" });
          if (upErr) throw upErr;
          metas.push({ path, mime: p.mime, size: p.blob.size, width: p.width, height: p.height });
        } catch {
          failed.push(files[i].file.name);
        }
      }
      if (metas.length) {
        const att = await attachMedia(memoryId, metas);
        if (!att.ok) { setProgress(null); setError(att.error ?? "Chưa gắn được ảnh."); router.replace(`/family/memories/${memoryId}/edit`); return; }
      }
      if (failed.length) {
        setProgress(null);
        setError(`Ký ức đã được lưu, nhưng chưa tải được: ${failed.join(", ")}. Bạn mở ký ức để thêm lại những ảnh này nhé.`);
        router.replace(`/family/memories/${memoryId}/edit`);
        return;
      }
      router.push(`/family/memories/${memoryId}`);
      router.refresh();
    });
  }

  const busy = pending;
  return (
    <form onSubmit={submit} className="mx-auto max-w-read space-y-7" noValidate>
      {error && <Notice kind="error">{error}</Notice>}
      <Field label="Tiêu đề" name="title" error={fieldErr.title}>
        <input id="title" name="title" className="input" defaultValue={initial.title} maxLength={140} required placeholder="VD: Bữa cơm chiều ngày mưa" aria-invalid={!!fieldErr.title} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ngày xảy ra" name="happenedOn" hint="Không nhớ chính xác cũng được, bạn có thể bỏ trống." error={fieldErr.happenedOn}>
          <input id="happenedOn" name="happenedOn" type="date" className="input" defaultValue={initial.happened_on} />
        </Field>
        <Field label="Địa điểm (không bắt buộc)" name="location">
          <input id="location" name="location" className="input" defaultValue={initial.location} maxLength={120} placeholder="VD: Quê nội, Đà Lạt…" />
        </Field>
      </div>
      <Field label="Câu chuyện" name="body" hint="Hãy viết như đang kể cho người thân nghe.">
        <textarea id="body" name="body" className="input min-h-[190px] leading-relaxed" defaultValue={initial.body} maxLength={10000} placeholder="Hôm đó…" />
      </Field>

      <fieldset>
        <legend className="label">Ảnh</legend>
        <div className="flex flex-wrap gap-3">
          {kept.map((m) => (
            <div key={m.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-line bg-paper">
              {m.url ? <img src={m.url} alt="Ảnh đã lưu" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-xs text-stone">Ảnh</span>}
              <button type="button" onClick={() => setRemoved((r) => [...r, m.id])} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink/80 text-sm text-warm" aria-label="Gỡ ảnh này khỏi ký ức">✕</button>
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
        <p className="hint">Tối đa {MEDIA_LIMITS.maxPerMemory} ảnh, mỗi ảnh dưới 25 MB. Ảnh chỉ những người trong gia đình mới xem được.</p>
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
                <input type="checkbox" name="personIds" value={p.id} defaultChecked={initial.personIds.includes(p.id)} className="peer sr-only" />
                <span className="inline-block rounded-full border border-line bg-warm px-3.5 py-1.5 text-[15px] peer-checked:border-ink peer-checked:bg-ink peer-checked:text-warm peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-moss">{p.full_name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <Field label="Ai được xem ký ức này?" name="visibility">
        <select id="visibility" name="visibility" className="input" defaultValue={initial.visibility}>
          {(Object.keys(VISIBILITY_LABEL) as Visibility[]).filter((v) => v !== "admins" || canSeeAdminsOnly).map((v) => <option key={v} value={v}>{VISIBILITY_LABEL[v]}</option>)}
        </select>
      </Field>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button type="submit" className="btn" disabled={busy} aria-busy={busy}>{busy ? (progress ?? "Đang lưu…") : initial.id ? "Lưu thay đổi" : "Lưu vào sổ"}</button>
        <button type="button" className="btn-soft" disabled={busy} onClick={() => router.back()}>Huỷ</button>
      </div>
      <div aria-live="polite" className="sr-only">{progress}</div>
    </form>
  );
}
