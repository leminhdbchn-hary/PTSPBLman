"use client";
import { useActionState } from "react";
import { createInvite, updateFamily } from "@/app/actions/family";
import type { ActionState } from "@/lib/actions";
import { ROLE_HELP, ROLE_LABEL, type FamilyRole } from "@/lib/types";
import { CopyField } from "./CopyField";
import { Field, Notice } from "./ui";
import { SubmitButton } from "./SubmitButton";
import { useKeepOnError } from "@/lib/useKeepOnError";
import { useRefreshOnOk } from "@/lib/useRefreshOnOk";

export function FamilyEditForm({ name, description }: { name: string; description: string }) {
  const [s, action] = useActionState<ActionState, FormData>(updateFamily, {});
  useRefreshOnOk(s);
  const keep = useKeepOnError(s);
  return (
    <form action={action} {...keep} className="space-y-4">
      {s.error && <Notice kind="error">{s.error}</Notice>}
      {s.ok && <Notice kind="success">{s.message}</Notice>}
      <Field label="Tên gia đình" name="name" error={s.fieldErrors?.name}><input id="name" name="name" className="input" defaultValue={name} maxLength={80} required /></Field>
      <Field label="Giới thiệu ngắn" name="description"><textarea id="description" name="description" className="input min-h-[90px]" defaultValue={description} maxLength={500} /></Field>
      <SubmitButton className="btn btn-sm" pending="Đang lưu…">Lưu</SubmitButton>
    </form>
  );
}

export function InviteForm({ isOwner }: { isOwner: boolean }) {
  const [s, action] = useActionState<ActionState, FormData>(createInvite, {});
  useRefreshOnOk(s);
  const keep = useKeepOnError(s);
  const roles: FamilyRole[] = isOwner ? ["admin", "contributor", "viewer"] : ["contributor", "viewer"];
  return (
    <div className="space-y-5">
      <form action={action} {...keep} className="space-y-4">
        {s.error && <Notice kind="error">{s.error}</Notice>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email người được mời (không bắt buộc)" name="email" hint="Nếu điền, chỉ tài khoản có đúng email này nhận được lời mời." error={s.fieldErrors?.email}>
            <input id="email" name="email" type="email" className="input" autoComplete="off" />
          </Field>
          <Field label="Vai trò" name="role" hint={ROLE_HELP.contributor}>
            <select id="role" name="role" className="input" defaultValue="contributor">{roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
          </Field>
        </div>
        <Field label="Liên kết có hiệu lực trong" name="days">
          <select id="days" name="days" className="input sm:max-w-xs" defaultValue="7"><option value="1">1 ngày</option><option value="3">3 ngày</option><option value="7">7 ngày</option><option value="14">14 ngày</option><option value="30">30 ngày</option></select>
        </Field>
        <SubmitButton className="btn btn-sm" pending="Đang tạo…">Tạo liên kết mời</SubmitButton>
      </form>
      {s.ok && s.link && (
        <div className="space-y-3"><Notice kind="success">{s.message}</Notice><CopyField value={s.link} /></div>
      )}
    </div>
  );
}
