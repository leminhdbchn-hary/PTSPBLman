"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { savePerson, setAvatar } from "@/app/actions/people";
import { checkFile, extFor, prepareImage } from "@/lib/image";
import { Avatar, Field, Notice } from "./ui";

export function PersonForm({ familyId, initial }: {
  familyId: string;
  initial: { id?: string; full_name: string; relation_label: string; birth_date: string; birth_date_visible: boolean; bio: string; avatar_url: string | null };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial.avatar_url);
  const ref = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setFe({});
    const fd = new FormData(e.currentTarget);
    if (initial.id) fd.set("id", initial.id);
    start(async () => {
      const res = await savePerson(fd);
      if (!res.ok || !res.id) { setError(res.error ?? "Chưa lưu được."); setFe(res.fieldErrors ?? {}); return; }
      if (file) {
        try {
          const p = await prepareImage(file, 800);
          const path = `${familyId}/people/${res.id}/${crypto.randomUUID()}.${extFor(p.mime)}`;
          const { error: upErr } = await createClient().storage.from("family-media").upload(path, p.blob, { contentType: p.mime, upsert: false });
          if (upErr) throw upErr;
          const r = await setAvatar(res.id, path);
          if (!r.ok) throw new Error(r.error);
        } catch {
          setError("Đã lưu hồ sơ nhưng chưa tải được ảnh đại diện. Bạn thử lại ở trang sửa hồ sơ nhé.");
          router.replace(`/family/members/${res.id}/edit`);
          return;
        }
      }
      router.push(`/family/members/${res.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-read space-y-6" noValidate>
      {error && <Notice kind="error">{error}</Notice>}
      <div className="flex items-center gap-5">
        <Avatar name={initial.full_name || "?"} url={preview} size={88} />
        <div>
          <button type="button" className="btn-soft btn-sm" onClick={() => ref.current?.click()}>{preview ? "Đổi ảnh đại diện" : "Thêm ảnh đại diện"}</button>
          <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" aria-label="Chọn ảnh đại diện"
            onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const er = checkFile(f); if (er) { setError(er); return; } setError(null); setFile(f); setPreview(URL.createObjectURL(f)); }} />
        </div>
      </div>
      <Field label="Họ và tên" name="fullName" error={fe.fullName}>
        <input id="fullName" name="fullName" className="input" defaultValue={initial.full_name} maxLength={100} required />
      </Field>
      <Field label="Vai trò trong gia đình" name="relationLabel" hint="VD: Ông nội, Mẹ, Con gái, Chú Hùng…">
        <input id="relationLabel" name="relationLabel" className="input" defaultValue={initial.relation_label} maxLength={40} />
      </Field>
      <Field label="Ngày sinh (không bắt buộc)" name="birthDate" error={fe.birthDate}>
        <input id="birthDate" name="birthDate" type="date" className="input" defaultValue={initial.birth_date} />
      </Field>
      <label className="flex items-start gap-3 text-[16px]">
        <input type="checkbox" name="birthDateVisible" defaultChecked={initial.birth_date_visible} className="mt-1.5 h-5 w-5 accent-ink" />
        <span>Cho cả gia đình xem ngày sinh<span className="hint block">Nếu không chọn, chỉ quản trị viên và người tạo hồ sơ thấy ngày sinh.</span></span>
      </label>
      <Field label="Tiểu sử, vài dòng về người này" name="bio">
        <textarea id="bio" name="bio" className="input min-h-[140px]" defaultValue={initial.bio} maxLength={3000} />
      </Field>
      <div className="flex gap-4">
        <button className="btn" type="submit" disabled={pending} aria-busy={pending}>{pending ? "Đang lưu…" : initial.id ? "Lưu thay đổi" : "Thêm hồ sơ"}</button>
        <button type="button" className="btn-soft" disabled={pending} onClick={() => router.back()}>Huỷ</button>
      </div>
    </form>
  );
}
