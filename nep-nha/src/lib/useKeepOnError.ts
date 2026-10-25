"use client";
import { useEffect, useRef, type FormEvent } from "react";

/**
 * React 19 xoá sạch các ô nhập sau khi một server action chạy xong. Khi action báo lỗi, người dùng không muốn gõ lại từ đầu,
 * nên hook này chụp lại giá trị lúc gửi và đặt lại sau khi form bị xoá (trừ ô mật khẩu). Khi thành công thì để form được xoá như bình thường.
 */
export function useKeepOnError(state: { error?: string; fieldErrors?: Record<string, string> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const snap = useRef<Record<string, string>>({});
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const out: Record<string, string> = {};
    for (const el of Array.from(e.currentTarget.elements)) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) continue;
      if (!el.name || (el instanceof HTMLInputElement && ["password", "hidden", "checkbox", "radio", "file"].includes(el.type))) continue;
      out[el.name] = el.value;
    }
    snap.current = out;
  };
  useEffect(() => {
    if (!state.error && !state.fieldErrors) return;
    const form = formRef.current;
    if (!form) return;
    for (const [name, value] of Object.entries(snap.current)) {
      const el = form.elements.namedItem(name);
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) el.value = value;
    }
  }, [state]);
  return { ref: formRef, onSubmit };
}
