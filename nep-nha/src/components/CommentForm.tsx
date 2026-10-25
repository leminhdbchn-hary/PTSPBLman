"use client";
import { useActionState, useEffect, useRef } from "react";
import { addComment } from "@/app/actions/memories";
import type { ActionState } from "@/lib/actions";
import { Notice } from "./ui";
import { SubmitButton } from "./SubmitButton";
import { useRefreshOnOk } from "@/lib/useRefreshOnOk";

export function CommentForm({ memoryId }: { memoryId: string }) {
  const [s, action] = useActionState<ActionState, FormData>(addComment, {});
  useRefreshOnOk(s);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (s.ok) ref.current?.reset(); }, [s]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="memoryId" value={memoryId} />
      <label htmlFor="cbody" className="label">Viết lời nhắn cho cả nhà</label>
      <textarea id="cbody" name="body" className="input min-h-[90px]" maxLength={2000} required />
      {s.error && <Notice kind="error">{s.error}</Notice>}
      <SubmitButton className="btn btn-sm" pending="Đang gửi…">Gửi</SubmitButton>
    </form>
  );
}
