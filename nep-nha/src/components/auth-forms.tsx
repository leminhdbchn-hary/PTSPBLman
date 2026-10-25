"use client";
import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword, login, register, resetPassword } from "@/app/actions/auth";
import type { ActionState } from "@/lib/actions";
import { Field, Notice } from "./ui";
import { SubmitButton } from "./SubmitButton";
import { useKeepOnError } from "@/lib/useKeepOnError";

const init: ActionState = {};

function Msg({ s }: { s: ActionState }) {
  if (s.error) return <Notice kind="error">{s.error}</Notice>;
  if (s.ok && s.message) return <Notice kind="success">{s.message}</Notice>;
  return null;
}

export function LoginForm({ next }: { next?: string }) {
  const [s, action] = useActionState(login, init);
  const keep = useKeepOnError(s);
  return (
    <form action={action} {...keep} className="space-y-5" noValidate>
      <Msg s={s} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" name="email" error={s.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required aria-invalid={!!s.fieldErrors?.email} />
      </Field>
      <Field label="Mật khẩu" name="password" error={s.fieldErrors?.password}>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
      </Field>
      <SubmitButton className="btn w-full" pending="Đang đăng nhập…">Đăng nhập</SubmitButton>
      <p className="text-center text-[15px]"><Link href="/forgot-password" className="text-mossdark underline">Quên mật khẩu?</Link></p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [s, action] = useActionState(register, init);
  const keep = useKeepOnError(s);
  if (s.ok) return <Notice kind="success">{s.message}</Notice>;
  return (
    <form action={action} {...keep} className="space-y-5" noValidate>
      <Msg s={s} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Họ và tên" name="fullName" error={s.fieldErrors?.fullName}>
        <input id="fullName" name="fullName" autoComplete="name" className="input" required />
      </Field>
      <Field label="Email" name="email" error={s.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required />
      </Field>
      <Field label="Mật khẩu" name="password" hint="Ít nhất 8 ký tự, có cả chữ và số." error={s.fieldErrors?.password}>
        <input id="password" name="password" type="password" autoComplete="new-password" className="input" required minLength={8} />
      </Field>
      <SubmitButton className="btn w-full" pending="Đang tạo tài khoản…">Tạo tài khoản</SubmitButton>
      <p className="text-center text-[14px] text-stone">Bằng việc đăng ký, bạn đồng ý với <Link href="/privacy" className="underline">chính sách bảo mật</Link> của Nếp Nhà.</p>
    </form>
  );
}

export function ForgotForm() {
  const [s, action] = useActionState(forgotPassword, init);
  const keep = useKeepOnError(s);
  if (s.ok) return <Notice kind="success">{s.message}</Notice>;
  return (
    <form action={action} {...keep} className="space-y-5" noValidate>
      <Msg s={s} />
      <Field label="Email đã đăng ký" name="email" error={s.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required />
      </Field>
      <SubmitButton className="btn w-full" pending="Đang gửi…">Gửi liên kết đặt lại mật khẩu</SubmitButton>
    </form>
  );
}

export function ResetForm() {
  const [s, action] = useActionState(resetPassword, init);
  const keep = useKeepOnError(s);
  return (
    <form action={action} {...keep} className="space-y-5" noValidate>
      <Msg s={s} />
      <Field label="Mật khẩu mới" name="password" hint="Ít nhất 8 ký tự, có cả chữ và số." error={s.fieldErrors?.password}>
        <input id="password" name="password" type="password" autoComplete="new-password" className="input" required minLength={8} />
      </Field>
      <Field label="Nhập lại mật khẩu mới" name="confirm" error={s.fieldErrors?.confirm}>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" required />
      </Field>
      <SubmitButton className="btn w-full" pending="Đang lưu…">Đặt mật khẩu mới</SubmitButton>
    </form>
  );
}
