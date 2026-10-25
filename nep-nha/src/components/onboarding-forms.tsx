"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFamily, acceptInvite } from "@/app/actions/family";
import type { ActionState } from "@/lib/actions";
import { Field, Notice } from "./ui";
import { SubmitButton } from "./SubmitButton";
import { useKeepOnError } from "@/lib/useKeepOnError";

export function CreateFamilyForm() {
  const [s, action] = useActionState<ActionState, FormData>(createFamily, {});
  const keep = useKeepOnError(s);
  return (
    <form action={action} {...keep} className="space-y-5" noValidate>
      {s.error && <Notice kind="error">{s.error}</Notice>}
      <Field label="Tên gia đình" name="name" hint="VD: Gia đình họ Nguyễn, Nhà mình…" error={s.fieldErrors?.name}>
        <input id="name" name="name" className="input" maxLength={80} required />
      </Field>
      <SubmitButton className="btn w-full" pending="Đang tạo…">Tạo sổ gia đình</SubmitButton>
    </form>
  );
}

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {err && <Notice kind="error">{err}</Notice>}
      <button className="btn w-full" disabled={pending} aria-busy={pending} onClick={() => start(async () => {
        setErr(null);
        const r = await acceptInvite(token);
        if (!r.ok) { setErr(r.error ?? "Chưa nhận được lời mời."); return; }
        router.push("/family");
        router.refresh();
      })}>{pending ? "Đang tham gia…" : "Tham gia gia đình"}</button>
    </div>
  );
}
