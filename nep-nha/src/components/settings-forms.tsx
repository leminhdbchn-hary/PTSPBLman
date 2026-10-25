"use client";
import { useActionState } from "react";
import { changePassword, requestDeletion, updateProfile } from "@/app/actions/settings";
import type { ActionState } from "@/lib/actions";
import { Field, Notice } from "./ui";
import { SubmitButton } from "./SubmitButton";
import { useKeepOnError } from "@/lib/useKeepOnError";
import { useRefreshOnOk } from "@/lib/useRefreshOnOk";

export function ProfileForm({ fullName, bio, email }: { fullName: string; bio: string; email: string }) {
  const [s, action] = useActionState<ActionState, FormData>(updateProfile, {});
  useRefreshOnOk(s);
  const keep = useKeepOnError(s);
  return (
    <form action={action} {...keep} className="space-y-4">
      {s.error && <Notice kind="error">{s.error}</Notice>}
      {s.ok && <Notice kind="success">{s.message}</Notice>}
      <Field label="Email đăng nhập" name="email-ro"><input id="email-ro" className="input bg-paper" value={email} readOnly /></Field>
      <Field label="Họ và tên" name="fullName" error={s.fieldErrors?.fullName}><input id="fullName" name="fullName" className="input" defaultValue={fullName} maxLength={100} required /></Field>
      <Field label="Vài dòng về bạn" name="bio"><textarea id="bio" name="bio" className="input min-h-[100px]" defaultValue={bio} maxLength={1000} /></Field>
      <SubmitButton className="btn btn-sm" pending="Đang lưu…">Lưu hồ sơ</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [s, action] = useActionState<ActionState, FormData>(changePassword, {});
  const keep = useKeepOnError(s);
  return (
    <form action={action} {...keep} className="space-y-4">
      {s.error && <Notice kind="error">{s.error}</Notice>}
      {s.ok && <Notice kind="success">{s.message}</Notice>}
      <Field label="Mật khẩu hiện tại" name="current" error={s.fieldErrors?.current}><input id="current" name="current" type="password" autoComplete="current-password" className="input" required /></Field>
      <Field label="Mật khẩu mới" name="password" hint="Ít nhất 8 ký tự, có cả chữ và số." error={s.fieldErrors?.password}><input id="password" name="password" type="password" autoComplete="new-password" className="input" required minLength={8} /></Field>
      <Field label="Nhập lại mật khẩu mới" name="confirm" error={s.fieldErrors?.confirm}><input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" required /></Field>
      <SubmitButton className="btn btn-sm" pending="Đang lưu…">Đổi mật khẩu</SubmitButton>
    </form>
  );
}

export function DeletionForm() {
  const [s, action] = useActionState<ActionState, FormData>(requestDeletion, {});
  useRefreshOnOk(s);
  const keep = useKeepOnError(s);
  return (
    <form action={action} {...keep} className="space-y-4">
      {s.error && <Notice kind="error">{s.error}</Notice>}
      {s.ok && <Notice kind="success">{s.message}</Notice>}
      <Field label="Lý do (không bắt buộc)" name="reason"><textarea id="reason" name="reason" className="input min-h-[80px]" maxLength={500} /></Field>
      <Field label="Gõ XOA để xác nhận" name="confirm" error={s.fieldErrors?.confirm}><input id="confirm" name="confirm" className="input sm:max-w-[12rem]" autoComplete="off" /></Field>
      <SubmitButton className="btn-danger btn-sm" pending="Đang gửi…">Gửi yêu cầu xoá tài khoản</SubmitButton>
    </form>
  );
}
