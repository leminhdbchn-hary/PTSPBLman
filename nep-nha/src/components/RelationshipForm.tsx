"use client";
import { useActionState } from "react";
import { addRelationship } from "@/app/actions/people";
import type { ActionState } from "@/lib/actions";
import { Notice } from "./ui";
import { SubmitButton } from "./SubmitButton";
import { useRefreshOnOk } from "@/lib/useRefreshOnOk";

export function RelationshipForm({ people }: { people: { id: string; full_name: string }[] }) {
  const [s, action] = useActionState<ActionState, FormData>(addRelationship, {});
  useRefreshOnOk(s);
  return (
    <form action={action} className="card space-y-4 p-5 sm:p-6">
      <h3 className="text-[1.3rem]">Thêm một quan hệ</h3>
      {s.error && <Notice kind="error">{s.error}</Notice>}
      {s.ok && s.message && <Notice kind="success">{s.message}</Notice>}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div><label htmlFor="personA" className="label">Người thứ nhất</label>
          <select id="personA" name="personA" className="input" required defaultValue=""><option value="" disabled>Chọn người…</option>{people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
        <div><label htmlFor="kind" className="label">là</label>
          <select id="kind" name="kind" className="input" defaultValue="parent"><option value="parent">cha/mẹ của</option><option value="spouse">vợ/chồng của</option></select></div>
        <div><label htmlFor="personB" className="label">Người thứ hai</label>
          <select id="personB" name="personB" className="input" required defaultValue=""><option value="" disabled>Chọn người…</option>{people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
      </div>
      <SubmitButton className="btn btn-sm" pending="Đang lưu…">Thêm quan hệ</SubmitButton>
    </form>
  );
}
